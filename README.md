<div align="center">

# 🛠️ GrimTool — Desktop Client built with Tauri + Rust

**A native desktop application: Rust backend (Tauri 2) + React 19 / TypeScript UI**

![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri_2-24C8DB?style=flat&logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React_19-149ECA?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white)

</div>

---

> ⚠️ **This is a portfolio snapshot of the client application only.** The backend service, distribution infrastructure, and every real network endpoint in the source have been removed or replaced with non-resolving placeholder domains (`*.invalid`). The code builds and the UI is fully clickable — but there's nothing real to connect to, download, or activate. This repo exists to show the engineering, not to run the original product.

## 📦 What this is

A desktop app for managing a local Steam library: native Windows integration, a fully custom desktop UI, and an architecture built around the Tauri command bridge between the Rust backend and the React frontend.

## 🦀 Native Windows integration (Rust)

- Parses `libraryfolders.vdf` — Valve's own key-value format — to discover **every** Steam library on a machine, not just the default install path.
- Reads/writes Windows Registry keys (`winreg`) for machine identification and persisted app state.
- Builds a hardware fingerprint from `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`, used to bind session tokens to a specific device.
- Spawns and manages external processes (`std::process::Command`) — restarting Steam, PowerShell helpers — including elevated (`-Verb RunAs`) invocations and the `CREATE_NO_WINDOW` flag.

## 🌐 Networking & client architecture (Rust + TypeScript)

- All HTTP traffic goes through Tauri commands (`api_get`/`api_post`) backed by a native `reqwest` client, instead of calling `fetch()` directly from the WebView — auth headers and request signing never touch renderer-side JS.
- Streaming downloads emit live progress events back to the frontend (`window.emit`) for multi-file batch installs.
- JWT auth with device binding — a claim baked into the token is checked against a request header on every call, preventing a token from being shared across machines.
- An `invokeWithTimeout` wrapper around every Tauri `invoke()` call, so the UI never hangs on a native command that never returns.

## ⚛️ Frontend (React 19 / TypeScript / Framer Motion)

- A fully custom component library, no UI framework — every modal, tab system, and card is hand-built on inline styles driven by a shared design-token module (`constants/colors.ts`).
- State split across contexts (`Theme → UI → Auth → Games`) so a change in one layer doesn't cascade re-renders through the whole tree.
- Framer Motion for state transitions, cursor-tracked 3D card tilt, and animated status surfaces.
- A small toast/status pipeline that classifies an outcome (success/error/info) from the message content itself, so call sites don't need to pass a type explicitly.

## 🔧 backend-example/ — the server-side pattern

The original production server isn't published here — it's tied to the real service's business logic and infrastructure. Instead, `backend-example/server.js` is a standalone, illustrative Express app showing the same architectural pattern that was actually used:

- Express + `helmet` + `cors` (origin allowlist) + `express-rate-limit`
- JWT auth with a token bound to `deviceId`
- **Two-phase quota activation** — `check-limit` (a preview, no deduction) → `confirm-activation` (the real deduction, only after the client confirms the operation actually succeeded). Deducting the quota at the preview step instead creates exactly the race condition that came up while fixing a real production bug: a failed client-side attempt would still burn the user's quota with nothing to show for it.

## 🧱 Stack

| Layer | Tech |
|---|---|
| Desktop shell | Tauri 2 |
| Native backend | Rust (`reqwest`, `winreg`, `serde`) |
| UI | React 19, TypeScript, Vite 7 |
| Animation | Framer Motion |
| Styling | Inline styles + design tokens, Tailwind for a handful of shadcn-derived primitives |

## 🚀 Running locally

```bash
npm install
npm run tauri dev
```

The app launches and the UI is fully navigable, but every network call points at a placeholder `*.invalid` domain — login, activation, and downloads fail by design, since there's no real backend in this repo.

The backend pattern example runs separately:

```bash
cd backend-example
npm install
npm start
```

## 📁 Project layout

```
src/                  React UI — components, pages, context providers
src-tauri/src/        Rust backend — Tauri commands, Steam/Windows integration
src/constants/        Design tokens, UI strings
backend-example/      Illustrative server-side pattern (not the production server)
```
