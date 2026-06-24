import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { invokeWithTimeout, pinnedGet, pinnedPost, PinnedResponse } from './apiClient';

export interface Game {
  id: number;
  name: string;
  description?: string;
  category?: string;
  online?: boolean;
}

export interface OnlineDownloadInfo {
  gameName: string;
  fileIndex: number;
  totalFiles: number;
  fileName: string;
  percent: number;
}

export type SyncFileStatus = 'pending' | 'syncing' | 'done' | 'error';
export interface SyncFile { name: string; status: SyncFileStatus }

interface GamesContextValue {
  games: Game[]; uniqueGames: Game[]; adultGames: Game[]; exclusiveGames: Game[];
  activatedGamesIds: number[]; setActivatedGamesIds: (fn: (prev: number[]) => number[]) => void;
  isRefreshing: boolean;
  loadingAppId: number | null; onlineLoadingAppId: number | null;
  onlineDownload: OnlineDownloadInfo | null;
  refreshAllGames: () => void;
  handleActivate: (game: Game) => void;
  handleOnlineInstall: (game: Game) => void;

  steamPath: string;
  handleFullRestart: () => void;
  handleInstallCore: () => void;
  isInstallingCore: boolean;
  handleReinstallCore: () => Promise<void>;
  isReinstalingCore: boolean;
  showWarning: boolean; setShowWarning: (v: boolean) => void;

  showRestartModal: boolean; setShowRestartModal: (v: boolean) => void;
  showLimitOverlay: boolean; setShowLimitOverlay: (v: boolean) => void;
  limitCountdown: string; limitResetMs: number; setLimitResetMs: (v: number) => void;
  showSyncModal: boolean; setShowSyncModal: (v: boolean) => void;
  showSyncModeSelect: boolean; setShowSyncModeSelect: (v: boolean) => void;
  syncProgress: number; syncStatus: string; syncFiles: SyncFile[];
  syncTotal: number; syncDone: number; isCheckingUp: boolean;
  syncModeSelectedGame: string; setSyncModeSelectedGame: (v: string) => void;
  runIntegritySync: () => void;
  runIntegritySyncClassic: (targetAppId?: string) => void;
  runIntegritySyncManifestTool: () => void;

  gamesSectionUnlocked: boolean; setGamesSectionUnlocked: (v: boolean) => void;
  showGamesSectionDisclaimer: boolean; setShowGamesSectionDisclaimer: (v: boolean) => void;

  showFixerDisclaimer: boolean; setShowFixerDisclaimer: (v: boolean) => void;
  isRunningFixer: boolean;
  handleRunFixer: () => void;
  handleAcceptFixerDisclaimer: () => void;
  handleDeclineFixerDisclaimer: () => void;

  showManualFixDisclaimer: boolean; setShowManualFixDisclaimer: (v: boolean) => void;
  isRunningManualFix: boolean;
  handleRunManualFix: () => void;
  handleAcceptManualFixDisclaimer: () => void;
  handleDeclineManualFixDisclaimer: () => void;
}

const LIMIT_RESET_KEY = 'grim_limit_reset_ms';
function getPersistedLimitResetMs(): number {
  const saved = localStorage.getItem(LIMIT_RESET_KEY);
  if (!saved) return 0;
  const ms = parseInt(saved, 10);
  return ms > Date.now() ? ms : 0;
}
function savePersistedLimitResetMs(ms: number) {
  if (ms > 0) localStorage.setItem(LIMIT_RESET_KEY, String(ms));
  else localStorage.removeItem(LIMIT_RESET_KEY);
}

const GamesContext = createContext<GamesContextValue>(null!);
export const useGames = () => useContext(GamesContext);

export function GamesProvider({ children }: { children: ReactNode }) {
  const { userToken, hwid, userTier, fetchUserStatus, userCan18, userCanExclusive, canDownloadUnique } = useAuth();
  const { updateStatus } = useUI();

  const [steamPath, setSteamPath] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [uniqueGames, setUniqueGames] = useState<Game[]>([]);
  const [adultGames, setAdultGames] = useState<Game[]>([]);
  const [exclusiveGames, setExclusiveGames] = useState<Game[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingAppId, setLoadingAppId] = useState<number | null>(null);
  const [onlineLoadingAppId, setOnlineLoadingAppId] = useState<number | null>(null);
  const [onlineDownload, setOnlineDownload] = useState<OnlineDownloadInfo | null>(null);
  const [activatedGamesIds, setActivatedGamesIds] = useState<number[]>(() => {
    const s = localStorage.getItem('activated_games_pool'); return s ? JSON.parse(s) : [];
  });

  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isInstallingCore, setIsInstallingCore] = useState(false);
  const [isReinstalingCore, setIsReinstalingCore] = useState(false);
  const [showLimitOverlay, setShowLimitOverlay] = useState(false);
  const [limitResetMs, setLimitResetMs] = useState(getPersistedLimitResetMs);
  const [limitCountdown, setLimitCountdown] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showSyncModeSelect, setShowSyncModeSelect] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncFiles, setSyncFiles] = useState<SyncFile[]>([]);
  const [syncTotal, setSyncTotal] = useState(0);
  const [syncDone, setSyncDone] = useState(0);
  const [isCheckingUp, setIsCheckingUp] = useState(false);
  const [syncModeSelectedGame, setSyncModeSelectedGame] = useState('__all__');

  const [gamesSectionUnlocked, setGamesSectionUnlocked] = useState(() => localStorage.getItem('grim_games_unlocked') === 'true');
  const [showGamesSectionDisclaimer, setShowGamesSectionDisclaimer] = useState(false);

  const [showFixerDisclaimer, setShowFixerDisclaimer] = useState(false);
  const [isRunningFixer, setIsRunningFixer] = useState(false);
  const [showManualFixDisclaimer, setShowManualFixDisclaimer] = useState(false);
  const [isRunningManualFix, setIsRunningManualFix] = useState(false);

  const fetchGames = useCallback(async () => {
    setIsRefreshing(true); updateStatus('SYNCHRONIZING TARGETS...');
    try {
      const res = await pinnedGet(`/api/games`);
      const data = await res.json();
      setGames(data.map((g: Game) => ({ ...g, id: Number(g.id) })));
      updateStatus(`DATABASE SYNCED: ${data.length} APPS`);
    } catch { updateStatus('SYNC FAILED'); }
    finally { setTimeout(() => setIsRefreshing(false), 800); }
  }, [updateStatus]);

  const uniqueLoadedRef = useRef(false);
  const adultLoadedRef = useRef(false);
  const exclusiveLoadedRef = useRef(false);

  const fetchUniqueGames = useCallback(async (token: string) => {
    try {
      const res = await pinnedGet(`/api/unique-games?token=${token}`);
      if (res.ok) { const d = await res.json(); setUniqueGames((d.games ?? d).map((g: Game) => ({ ...g, id: Number(g.id) }))); uniqueLoadedRef.current = true; }
    } catch {}
  }, []);

  const fetchAdultGames = useCallback(async (token: string) => {
    try {
      const res = await pinnedGet(`/api/adult-games?token=${token}`);
      if (res.ok) { const d = await res.json(); setAdultGames((d.games ?? d).map((g: Game) => ({ ...g, id: Number(g.id) }))); adultLoadedRef.current = true; }
    } catch {}
  }, []);

  const fetchExclusiveGames = useCallback(async (token: string) => {
    try {
      const res = await pinnedGet(`/api/exclusive-games?token=${token}`);
      if (res.ok) { const d = await res.json(); setExclusiveGames((d.games ?? d).map((g: Game) => ({ ...g, id: Number(g.id) }))); exclusiveLoadedRef.current = true; }
    } catch {}
  }, []);

  const refreshAllGames = useCallback(async () => {
    await fetchGames();
    if (userToken) {
      await fetchUniqueGames(userToken);
      await fetchAdultGames(userToken);
      await fetchExclusiveGames(userToken);
    }
  }, [fetchGames, fetchUniqueGames, fetchAdultGames, fetchExclusiveGames, userToken]);

  const handleInstallCore = useCallback(async () => {
    setIsInstallingCore(true);
    try { const r = await invoke('install_all_components'); if (r === 'ALL_COMPONENTS_INSTALLED_AND_SYNCED') setShowWarning(false); }
    catch (e) { updateStatus(`CORE ERROR: ${String(e)}`); }
    finally { setIsInstallingCore(false); }
  }, [updateStatus]);

  const handleReinstallCore = useCallback(async () => {
    setIsReinstalingCore(true);
    updateStatus('ПЕРЕИНИЦИАЛИЗАЦИЯ ЯДРА...');
    try {
      const r = await invoke('reinstall_core');
      if (r === 'REINSTALL_DONE') updateStatus('ЯДРО ПЕРЕИНИЦИАЛИЗИРОВАНО');
      else updateStatus(`REINIT: ${String(r)}`);
    } catch (e) {
      updateStatus(`REINIT ERROR: ${String(e)}`);
    } finally {
      setIsReinstalingCore(false);
    }
  }, [updateStatus]);

  const runFixerExe = useCallback(async () => {
    setIsRunningFixer(true);
    try {
      await invoke('run_fixer');
      updateStatus('FIXER ЗАПУЩЕН');
    } catch (e) {
      updateStatus(String(e) === 'FIXER_NOT_FOUND' ? 'FIXER НЕ НАЙДЕН — ВЫПОЛНИТЕ ПЕРЕИНИЦИАЛИЗАЦИЮ ЯДРА' : `FIXER ERROR: ${String(e)}`);
    } finally {
      setIsRunningFixer(false);
    }
  }, [updateStatus]);

  const handleRunFixer = useCallback(() => {
    const accepted = localStorage.getItem('grim_fixer_disclaimer_accepted') === 'true';
    if (accepted) { runFixerExe(); return; }
    setShowFixerDisclaimer(true);
  }, [runFixerExe]);

  const handleAcceptFixerDisclaimer = useCallback(() => {
    localStorage.setItem('grim_fixer_disclaimer_accepted', 'true');
    setShowFixerDisclaimer(false);
    runFixerExe();
  }, [runFixerExe]);

  const handleDeclineFixerDisclaimer = useCallback(() => {
    setShowFixerDisclaimer(false);
  }, []);

  const runManualFixExe = useCallback(async () => {
    setIsRunningManualFix(true);
    try {
      try { await invoke('run_defender_disable'); } catch {  }
      await invoke('run_autofix');
      updateStatus('РУЧНОЕ ИСПРАВЛЕНИЕ ЗАПУЩЕНО');
    } catch (e) {
      updateStatus(`MANUAL FIX ERROR: ${String(e)}`);
    } finally {
      setIsRunningManualFix(false);
    }
  }, [updateStatus]);

  const handleRunManualFix = useCallback(() => {
    setShowManualFixDisclaimer(true);
  }, []);

  const handleAcceptManualFixDisclaimer = useCallback(() => {
    setShowManualFixDisclaimer(false);
    runManualFixExe();
  }, [runManualFixExe]);

  const handleDeclineManualFixDisclaimer = useCallback(() => {
    setShowManualFixDisclaimer(false);
  }, []);

  const handleFullRestart = useCallback(async () => {
    updateStatus('PURGING & REBOOTING STEAM...');
    try { await invoke('full_steam_restart', { steamPath }); updateStatus('STEAM CLEANED & RESTARTED'); setShowRestartModal(false); }
    catch { updateStatus('EXECUTION FAILED'); }
  }, [steamPath, updateStatus]);

  const handleActivate = useCallback(async (game: Game) => {
    const isAlready = activatedGamesIds.includes(game.id);
    setLoadingAppId(game.id); updateStatus('CHECKING ACCESS...');
    try {
      if (!isAlready) {
        const check = await pinnedPost(`/api/check-limit`, { token: userToken });
        const checkData = await check.json();
        if (!check.ok) {
          const resetMs = Date.now() + (checkData.reset_in || 3_600_000);
          setLimitResetMs(resetMs); savePersistedLimitResetMs(resetMs);
          setShowLimitOverlay(true); setLoadingAppId(null); return;
        }
      }
      updateStatus(`INJECTING ${game.name.toUpperCase()}...`);
      await invokeWithTimeout('install_game_logic', {
        steamPath, appId: String(game.id), depots: [], luaName: `${game.id}.lua`,
        token: userToken, hwid, gameName: game.name, confirmActivation: !isAlready,
      }, 180000);
      if (!isAlready) {
        setActivatedGamesIds(prev => [...prev, Number(game.id)]);
      }
      setLoadingAppId(null); updateStatus(`SUCCESS: ${game.name} ADDED`);
      fetchUserStatus(userToken); setShowRestartModal(true);
    } catch (err) {
      setLoadingAppId(null);
      updateStatus(String(err).includes('TIMEOUT') ? 'INJECTION TIMEOUT: TRY AGAIN' : 'INJECTION ERROR');
    }
  }, [activatedGamesIds, userToken, steamPath, updateStatus, fetchUserStatus, hwid]);

  const handleOnlineInstall = useCallback(async (game: Game) => {
    setOnlineLoadingAppId(game.id); updateStatus(`LOADING ONLINE FILES: ${game.name.toUpperCase()}...`);
    let unlisten: (() => void) | null = null;
    try {
      let listRes: PinnedResponse;
      try {
        listRes = await pinnedGet(`/api/online-files/${game.id}?token=${userToken}&hwid=${encodeURIComponent(hwid)}`, 10000);
      } catch {
        updateStatus('ONLINE: SERVER NOT RESPONDING'); return;
      }
      if (!listRes.ok) { updateStatus('ONLINE: NO FILES FOUND ON SERVER'); return; }
      const { files }: { files: string[] } = await listRes.json();
      if (!files?.length) { updateStatus('ONLINE: DIRECTORY IS EMPTY'); return; }
      updateStatus(`ONLINE: INSTALLING ${files.length} FILES...`);

      setOnlineDownload({ gameName: game.name, fileIndex: 0, totalFiles: files.length, fileName: files[0] ?? '', percent: 0 });
      const { listen } = await import('@tauri-apps/api/event');
      unlisten = await listen<{
        app_id: string; file_index: number; total_files: number; file_name: string; percent: number;
      }>('online-progress', (e) => {
        if (String(e.payload.app_id) !== String(game.id)) return;
        setOnlineDownload(prev => prev ? {
          ...prev,
          fileIndex: e.payload.file_index,
          totalFiles: e.payload.total_files,
          fileName: e.payload.file_name || prev.fileName,
          percent: e.payload.percent,
        } : prev);
      });

      const result = await invokeWithTimeout<string>('install_online_files', { steamPath, appId: String(game.id), files, token: userToken, hwid }, 300000);
      updateStatus(result?.startsWith('ONLINE_INSTALLED:') ? `ONLINE INSTALLED: ${result.split(':')[1]} FILES → ${game.name.toUpperCase()}` : 'ONLINE INSTALL: UNEXPECTED RESULT');
    } catch (err) { updateStatus(String(err).includes('TIMEOUT') ? 'ONLINE TIMEOUT: TRY AGAIN' : `ONLINE ERROR: ${String(err).substring(0, 60)}`); }
    finally {
      setOnlineLoadingAppId(null);
      if (unlisten) unlisten();
      setOnlineDownload(null);
    }
  }, [steamPath, updateStatus, userToken, hwid]);

  const runIntegritySync = useCallback(() => setShowSyncModeSelect(true), []);

  const runIntegritySyncClassic = useCallback(async (targetAppId?: string) => {
    const allGames = [...games, ...uniqueGames, ...adultGames, ...exclusiveGames];
    const userGames = targetAppId && targetAppId !== '__all__'
      ? allGames.filter(g => String(g.id) === targetAppId)
      : allGames.filter(g => activatedGamesIds.includes(Number(g.id)));
    if (!userGames.length) { updateStatus('INTEGRITY SYNC: NO ACTIVATED GAMES FOUND'); return; }
    setShowSyncModeSelect(false);
    setSyncFiles(userGames.map(g => ({ name: g.name.toUpperCase(), status: 'pending' as SyncFileStatus })));
    setSyncTotal(userGames.length); setSyncDone(0); setSyncProgress(0);
    setSyncStatus('INITIALIZING INTEGRITY CHECK...'); setShowSyncModal(true); setIsCheckingUp(true);
    let ok = 0, fail = 0;
    try {
      for (let i = 0; i < userGames.length; i++) {
        const g = userGames[i];
        setSyncFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'syncing' } : f));
        setSyncStatus(`DOWNLOADING MANIFESTS: ${g.name.toUpperCase()}`);
        try {
          const result = await invokeWithTimeout<string>('integrity_sync_game', { steamPath, appId: String(g.id), depots: [], luaName: `${g.id}.lua`, token: userToken, hwid }, 120000);
          if (result === 'INTEGRITY_SYNC_DONE') { ok++; setSyncFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f)); }
          else { fail++; setSyncFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f)); }
        } catch { fail++; setSyncFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f)); }
        const done = i + 1; setSyncDone(done); setSyncProgress(Math.round((done / userGames.length) * 100));
      }
      setSyncStatus(fail > 0 ? `COMPLETE: ${ok} OK — ${fail} FAILED` : `ALL ${ok} GAMES RESTORED TO DEPOTCACHE`);
      updateStatus(fail > 0 ? `INTEGRITY SYNC: ${ok} OK, ${fail} FAILED` : `INTEGRITY SYNC COMPLETE: ${ok} GAMES OK`);
    } catch { setSyncStatus('CRITICAL ERROR — SEE LOGS'); updateStatus('INTEGRITY SYNC FAILED'); }
    finally { setIsCheckingUp(false); }
  }, [games, uniqueGames, adultGames, exclusiveGames, activatedGamesIds, steamPath, updateStatus, userToken, hwid]);

  const runIntegritySyncManifestTool = useCallback(async () => {
    setShowSyncModeSelect(false); updateStatus('LAUNCHING MANIFEST TOOL VIA POWERSHELL...');
    try { await invoke('run_powershell_manifest_tool'); updateStatus('MANIFEST TOOL LAUNCHED'); }
    catch { updateStatus('MANIFEST TOOL: CHECK POWERSHELL WINDOW'); }
  }, [updateStatus]);

  useEffect(() => { localStorage.setItem('activated_games_pool', JSON.stringify(activatedGamesIds)); }, [activatedGamesIds]);
  useEffect(() => { savePersistedLimitResetMs(limitResetMs); }, [limitResetMs]);

  useEffect(() => {
    if (!showLimitOverlay || limitResetMs <= 0) return;
    const tick = () => {
      const rem = limitResetMs - Date.now();
      if (rem <= 0) { setLimitCountdown('READY'); setShowLimitOverlay(false); savePersistedLimitResetMs(0); return; }
      const h = Math.floor(rem / 3_600_000);
      const m = Math.floor((rem % 3_600_000) / 60_000);
      const s = Math.floor((rem % 60_000) / 1_000);
      setLimitCountdown(`${h}H ${m.toString().padStart(2, '00')}M ${s.toString().padStart(2, '00')}S`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [showLimitOverlay, limitResetMs]);

  useEffect(() => {
    if (!userToken) return;
    (async () => {
      try {
        const path = await invoke<string>('find_steam'); setSteamPath(path);
        const toolsOk = await invoke<boolean>('check_steam_tools');
        if (!toolsOk) setShowWarning(true);
        fetchGames();
      } catch { updateStatus('CRITICAL: STEAM NOT DETECTED'); }
    })();

  }, [userToken]);

  useEffect(() => {
    if (userToken) {
      fetchUniqueGames(userToken);
      fetchAdultGames(userToken);
      fetchExclusiveGames(userToken);
    }

  }, [userTier, userToken]);

  const enforcingAccessRef = useRef(false);

  const pendingRecheckRef = useRef(false);
  const [recheckTick, setRecheckTick] = useState(0);

  useEffect(() => {
    if (!steamPath) return;

    if (!uniqueLoadedRef.current || !adultLoadedRef.current || !exclusiveLoadedRef.current) return;

    if (enforcingAccessRef.current) { pendingRecheckRef.current = true; return; }

    const blocked: number[] = [];
    if (!userCanExclusive) blocked.push(...exclusiveGames.map(g => g.id));
    if (!canDownloadUnique) blocked.push(...uniqueGames.map(g => g.id));
    if (!userCan18) blocked.push(...adultGames.map(g => g.id));
    if (!blocked.length) return;

    enforcingAccessRef.current = true;
    (async () => {
      await Promise.all(blocked.map(id =>
        invoke('remove_game_files', { steamPath, appId: String(id) }).catch(() => {})
      ));
      setActivatedGamesIds(prev => {
        const removed = prev.filter(id => blocked.includes(id));
        if (removed.length) updateStatus(`ACCESS REVOKED: ${removed.length} GAME(S) REMOVED — TIER TOO LOW`);
        return prev.filter(id => !blocked.includes(id));
      });
      enforcingAccessRef.current = false;
      if (pendingRecheckRef.current) { pendingRecheckRef.current = false; setRecheckTick(t => t + 1); }
    })();
  }, [userTier, steamPath, uniqueGames, adultGames, exclusiveGames, userCanExclusive, canDownloadUnique, userCan18, updateStatus, recheckTick]);

  const value: GamesContextValue = {
    games, uniqueGames, adultGames, exclusiveGames,
    activatedGamesIds, setActivatedGamesIds,
    isRefreshing, loadingAppId, onlineLoadingAppId, onlineDownload,
    refreshAllGames, handleActivate, handleOnlineInstall,
    steamPath, handleFullRestart, handleInstallCore, isInstallingCore,
    handleReinstallCore, isReinstalingCore,
    showWarning, setShowWarning,
    showRestartModal, setShowRestartModal,
    showLimitOverlay, setShowLimitOverlay, limitCountdown, limitResetMs, setLimitResetMs,
    showSyncModal, setShowSyncModal, showSyncModeSelect, setShowSyncModeSelect,
    syncProgress, syncStatus, syncFiles, syncTotal, syncDone, isCheckingUp,
    syncModeSelectedGame, setSyncModeSelectedGame,
    runIntegritySync, runIntegritySyncClassic, runIntegritySyncManifestTool,
    gamesSectionUnlocked, setGamesSectionUnlocked,
    showGamesSectionDisclaimer, setShowGamesSectionDisclaimer,
    showFixerDisclaimer, setShowFixerDisclaimer, isRunningFixer,
    handleRunFixer, handleAcceptFixerDisclaimer, handleDeclineFixerDisclaimer,
    showManualFixDisclaimer, setShowManualFixDisclaimer, isRunningManualFix,
    handleRunManualFix, handleAcceptManualFixDisclaimer, handleDeclineManualFixDisclaimer,
  };

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>;
}
