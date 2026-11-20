# BuddyBoardz 10 — Native Desktop App (Tauri v2 + Rust)

## Why Tauri v2 + Rust (Instead of 150 MB Electron)
- Native Windows WebView2 + compiled Rust core (`~5 MB` installer, `<35 MB` RAM).
- Zero-copy Rust `simulator.rs` (109-mark GSEB solver) & `fsrs_engine.rs` (exam-date-capped FSRS).
- Atomic disk backups via `save_atomic_backup` (`write tmp -> rename`) so crashes never corrupt logs.
- Loads `G:\Personal\SHLOK\Projects\BuddyBoardz\Assets\Logo-2 animated.mp4` via Tauri's `asset://` protocol (`tauri.conf.json` scope pre-configured).

## Build Commands (Antigravity / Local Windows)
```bash
# 1. Drop buddyboardz_10_desktop.html into dist/index.html
# 2. Run native desktop dev mode
cargo tauri dev
# 3. Compile release Windows .exe / .msi (~5 MB)
cargo tauri build
```
