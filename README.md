# GrimTool — Tauri + Rust Desktop Client

A desktop application built with **Tauri 2 / Rust** (native backend) and **React 19 / TypeScript** (UI), built as a deep-dive into Windows native integration, the Steam client/library file formats, and secure desktop-to-server communication patterns.

> **This is a portfolio snapshot of the client application only.** The companion backend service, distribution infrastructure, and any network endpoints referenced in the source have been removed/replaced with placeholders (`*.invalid` domains). The code will compile and the UI runs, but it cannot reach any real server — there is nothing to download or activate. This repo exists to show the engineering, not to operate the original product.

## What this demonstrates

**Native Windows integration (Rust)**
- Parses Steam's `libraryfolders.vdf` (Valve's custom key-value format) to enumerate every Steam library folder on a machine, not just the default install path.
- Reads/writes Windows Registry keys (`winreg`) for machine identification and persistent app state.
- Builds a hardware fingerprint from `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid` for device-bound session tokens.
- Spawns and manages external processes (Steam restarts, PowerShell helpers) via `std::process::Command`, including elevated (`-Verb RunAs`) invocations and Windows `CREATE_NO_WINDOW` flags.

**Networking & client architecture (Rust + TypeScript)**
- All HTTP traffic is routed through Tauri commands (`api_get`/`api_post`) backed by a native `reqwest` client, rather than calling `fetch()` directly from the WebView — keeping auth headers and request signing out of renderer-accessible JS.
- Streaming downloads with live progress events emitted back to the frontend (`window.emit`) for multi-file batch installs.
- JWT-based auth with device-binding (HWID claim checked against request headers) to prevent token sharing across machines.
- Timeout/retry wrapper (`invokeWithTimeout`) around every Tauri `invoke()` call so the UI never hangs on a dead native command.

**Frontend (React 19 / TypeScript / Framer Motion)**
- Fully custom component library, no UI framework — every modal, tab system, and card is hand-built with inline styles driven by a shared design-token module (`constants/colors.ts`).
- Context-split state management (`Theme` → `UI` → `Auth` → `Games`) so unrelated state changes don't cascade re-renders across the whole tree.
- Framer Motion for layout transitions, 3D tilt-on-hover cards, and animated status surfaces.
- A from-scratch toast/status pipeline that classifies outcome messages (success/error/info) without needing every call site to pass a type explicitly.

## Stack

| Layer | Tech |
|---|---|
| Desktop shell | Tauri 2 |
| Native backend | Rust (`reqwest`, `winreg`, `serde`) |
| UI | React 19, TypeScript, Vite 7 |
| Animation | Framer Motion |
| Styling | Inline style system + design tokens, Tailwind for a handful of shadcn-derived primitives |

## Running locally

```bash
npm install
npm run tauri dev
```

The app will launch and the UI is fully navigable, but every network call points at a placeholder `*.invalid` domain — login, activation, and downloads will fail by design, since the real backend isn't part of this repo.

## Project layout

```
src/                  React UI — components, pages, context providers
src-tauri/src/        Rust backend — Tauri commands, Steam/Windows integration
src/constants/        Design tokens, i18n strings
```
