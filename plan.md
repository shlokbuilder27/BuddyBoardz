# PLAN.md — BuddyBoardz 10 Technical Architecture & Multi-Harness Plan

**Product:** `BuddyBoardz 10` (GSEB Class 10 Blueprint & Mock-Mistake Autopsy PWA)  
**Architecture Standard:** 4KB-to-Moon Lean Engineering (`@andrej` + `@repo-architect` + `@dario` + `@demis` + `@steve`)  
**Target Bundle Budget:** `<50 KB` gzipped total JS+CSS (`<150 KB` hard ceiling)  
**Hosting:** Cloudflare Pages (Static Edge, zero server, zero cost, automatic HTTPS)

## 1. Tech Stack & Dependency Justification

Every single dependency must justify its byte weight under `@andrej`'s zero-bloat rule:

| Layer | Choice | Est. Gzipped Size | Why Chosen (Over Alternatives) |
| :--- | :--- | ---: | :--- |
| **Language & Bundler** | TypeScript 5 + Vite 6 | 0 KB runtime | Strict compile-time contracts (`SPEC.md` types), instant HMR, dead-code elimination. |
| **UI Rendering** | Vanilla TypeScript + Template Helpers + Custom CSS Tokens | ~6 KB | Eliminates React/Vue runtime (~45 KB+) and hook re-render bugs; 4 flat views need zero virtual DOM. |
| **Spaced Repetition** | [`ts-fsrs`](https://github.com/open-spaced-repetition/awesome-fsrs) | ~9 KB | Battle-tested FSRS-6 DSR algorithm (outperforms SM-2 in 91.9% of cases per [Anki #3616](https://github.com/ankitects/anki/issues/3616)). |
| **Local Storage** | Native `IndexedDB` (thin 90-line Promise wrapper) | ~1.5 KB | Zero external ORM; atomic transactions for `sessions`, `mistakes`, `settings`, `simulatorStates`. |
| **Offline PWA** | `vite-plugin-pwa` (Workbox precache) | ~3 KB | 100% offline after first visit on Surat mobile hotspots; enables iOS Home Screen standalone mode ([OpenPWA](https://openpwa.net/reference/storage/safari-seven-day-cap/)). |
| **Testing** | `vitest` (dev-only) | 0 KB runtime | Sub-second unit + invariant tests for all 64 chapters, simulator math, priority ranking, and FSRS exam-cap logic. |
| **Charts / Visuals** | Inline SVG bars & sparklines | ~1 KB | Zero 300 KB chart libraries; crisp on low-end Android and iPhone Retina screens. |
| **Total Runtime** | — | **~21–35 KB** | **4× under the 150 KB mobile-hotspot ceiling.** |

## 2. Directory Tree & Strict Module Boundaries

```text
buddyboardz-10/
├── index.html                      # Semantic PWA shell, viewport-fit=cover, inline critical CSS
├── package.json                    # Scripts: dev, build, test, typecheck, size-check
├── tsconfig.json                   # strict: true, noUncheckedIndexedAccess: true
├── vite.config.ts                  # Vite + vite-plugin-pwa manifest & offline precache
├── public/
│   ├── icon-192.svg                # Crisp geometric BuddyBoardz 10 PWA icon
│   └── icon-512.svg
├── src/
│   ├── main.ts                     # App bootstrap, IndexedDB init, SW registration, tab router
│   ├── styles/
│   │   ├── tokens.css              # 3-color palette, type scale, 4px spacing grid, tap targets (>=44px)
│   │   └── app.css                 # Layout primitives, bottom nav, cards, pills, SVG bars
│   ├── data/
│   │   ├── blueprints/
│   │   │   ├── maths-std-12.ts     # Verified 14-chapter Standard Maths (80 / 109)
│   │   │   ├── maths-basic-18.ts   # Verified 14-chapter Basic Maths (80 / 109)
│   │   │   ├── science-11.ts       # Verified 13-chapter Science (80 / 109)
│   │   │   ├── social-10.ts        # Verified 23-chapter Social Science (80 / 109 + Q54 Map)
│   │   │   └── index.ts            # Typed registry + lookup helper
│   ├── core/                       # PURE LOGIC ONLY — ZERO DOM / ZERO INDEXEDDB IMPORTS
│   │   ├── types.ts                # Exact contracts from SPEC.md Section 4
│   │   ├── simulator.ts            # 109-mark General-Option constraint solver
│   │   ├── priority.ts             # Marks-at-Risk Bayesian ROI ranker
│   │   ├── fsrs-engine.ts          # ts-fsrs wrapper with examDate cap & retention tightening
│   │   ├── landmines.ts            # SILLY / TIME error aggregator -> Top-5 Pre-Exam Checklist
│   │   └── backup-schema.ts        # Strict BackupPayloadV1 validator & serializer
│   ├── storage/
│   │   ├── db.ts                   # Minimal IndexedDB Promise wrapper + quota/persist check
│   │   └── store.ts                # Single reactive state container (subscribe/dispatch)
│   └── ui/
│       ├── components/
│       │   ├── header.ts           # Subject switcher, exam countdown pill, backup reminder badge
│       │   ├── nav.ts              # 4-tab mobile bottom bar: Simulator | Log | Radar | Retest
│       │   ├── svg-bar.ts          # Lightweight inline SVG progress/weightage bar
│       │   └── ios-banner.ts       # iOS Safari non-standalone "Add to Home Screen" warning
│       └── views/
│           ├── simulator-view.ts   # Tab 1: Day-1 109-Mark General-Option Simulator
│           ├── logger-view.ts      # Tab 2: 3-Min 4-Tap + Micro-Anchor Paper Autopsy Logger
│           ├── radar-view.ts       # Tab 3: Top-3 High-ROI Chapters + Pre-Exam Landmine Checklist
│           ├── retest-view.ts      # Tab 4: FSRS Due Queue (Again/Hard/Good/Easy)
│           └── settings-modal.ts   # Exam date picker, Export/Import JSON, Wipe/Reset confirm
└── tests/
    ├── blueprints.test.ts          # Invariant check: all 4 subjects sum to 80 base / 109 opt
    ├── simulator.test.ts           # Edge cases: all SKIP, all SEC_A_ONLY, 29M buffer saturation
    ├── priority.test.ts            # Bayesian smoothing + Survival vs Topper mode ordering
    ├── fsrs-engine.test.ts         # Exam-date interval ceiling + 30-day retention tightening
    └── backup-schema.test.ts       # Valid round-trip + malformed JSON rejection tests
```

## 3. State Flow & Architectural Invariants

1. **Unidirectional Data Flow:**
   `User Tap (UI View)` → `store.dispatch(action)` → `Pure Core Function (src/core/*)` → `IndexedDB Write (src/storage/db.ts)` → `Subscribers Re-render Active View`.
2. **Pure Core Isolation (`@dario` Eval Rule):**
   Every file under `src/core/` MUST be 100% pure TypeScript with zero `window`, `document`, or `indexedDB` references. This allows Vitest to verify 100% of math and edge cases in `<300 ms` without a browser.
3. **Zero Silent Failures:**
   Every IndexedDB transaction and JSON import catches errors explicitly and surfaces an inline banner/toast—never an empty `catch {}`.
4. **Mobile-First Ergonomics (4-Tap Budget):**
   - Minimum tap target: `44px × 44px` on all chapter pills, section chips (`A`/`B`/`C`/`D`), marks-lost buttons (`1`/`2`/`3`/`4`), and error tags (`CONCEPT`/`FORMULA`/`SILLY`/`TIME`).
   - Zero page reloads; tab switches render in `<16 ms`.
5. **Cloudflare Pages Deployment:**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Zero environment variables or secrets needed.

## 4. Exact Multi-Harness & AI Stack Allocation

### Surface 1: General AI / Chatbots (Trio A — Strategy, Research, Design, Copy & Audit)
- **Gemini App (Primary Heavy Lifter):** End-to-end `@architecture-skill` orchestration, deep web research & source verification, Google Drive/Workspace integration, Canvas `SPEC.md`/`PLAN.md`/`TASKS.md` authoring, Stage 5 design tokens & SVG icons, and `@round-table` council audits.
- **Claude App (Anthropic):** High-taste UI/UX micro-copy polish, zero-slop student onboarding text, deep architectural & XSS security code reviews.
- **ChatGPT App (OpenAI):** Fast launch-copy brainstorming (WhatsApp/Surat student group hooks, Reddit post drafts) and alternate adversarial test scenarios.

### Surface 2: Dev Harnesses (Trio B — Build, Test, Verify & Ship)
- **Antigravity (Primary Coding Harness — Google, Skills, MCPs, Plugins):**
  - **Gemini 3.8 Flash:** High-speed scaffolding, static blueprint encoding, CSS/HTML view assembly, rapid UI iteration (`Tasks 1, 2, 7, 8`).
  - **Claude 4.6 Opus / Sonnet:** High-precision core TypeScript algorithms (`simulator.ts`, `fsrs-engine.ts`, `priority.ts`, `db.ts`), strict state management, and Stage 7/8 polish (`Tasks 3, 4, 5, 6, 9`).
  - **GPT OSS 120B:** Fast local/open-weight helper refactors and repetitive test-case expansion.
- **Codex (OpenAI Coding Harness — Plugins + GPT 6 LUNA, 5.6 Terra, SOL):**
  - **GPT 6 LUNA / 5.6 Terra:** Adversarial Vitest fuzzing (corrupted JSON imports, FSRS exam-date edge cases, XSS payload checks) and final pre-deploy verification (`Task 10`).
  - **SOL:** Fast surgical CLI fixes, `package.json` build scripts, and bundle-size assertions.
- **OpenCode (Zero-Cost Overflow & Specialized Free Models):**
  - **Zero-Retention Coding (`DeepSeek V4.1 Flash Free`, `Hy4 flash Free`, `LongCat 2.5 Free`):** Safe zero-retention overflow for unit tests, CSS tweaks, and long-file reads (no training on your code).
  - **Visual UI Audit (`Nemotron 3.5 Super VL Free`):** Screenshot-based mobile layout & tap-target inspection (safe for BuddyBoardz 10 public UI screenshots; never feed confidential data).
  - **Non-Coder Gate (`Jev 1.13 Free`):** Only for typed yes/no/score checks—never code generation.
  - **Privacy Guardrail:** Keep `Big Pickle`, `Iceman Free`, `Inkling 2 Small Free`, `Flint 40B Free`, and `MiMo-V2.6-Flash Free` strictly off private/personal data (public boilerplate only).
