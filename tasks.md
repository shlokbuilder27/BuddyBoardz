# TASKS.md — BuddyBoardz 10 Atomic Build & Multi-Harness Execution Queue

**Execution Protocol (`@architecture-skill`):**
- **NEVER** paste the entire `SPEC.md` into a coding harness at once. Feed strictly **one atomic task at a time** from `Task 1` to `Task 10`.
- Every task must pass its **Verification Command** before advancing.
- Every task below specifies its **Primary Harness & Model** plus **Zero-Cost Fallback** from your exact stack.

---

## Phase A: Project Scaffold & Verified Blueprints

### Task 1: Initialize Vite + TypeScript + Vitest + PWA Scaffold
- **Primary Harness / Model:** **Antigravity → Gemini 3.8 Flash** *(Fallback: OpenCode → `DeepSeek V4.1 Flash Free`)*
- **Target Files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/core/types.ts`
- **Deliverables:**
  - Initialize Vite Vanilla-TS project (`buddyboardz-10`) with `ts-fsrs`, `vitest`, and `vite-plugin-pwa`.
  - Add npm scripts: `dev`, `build`, `test`, `typecheck`.
  - Implement all exact TypeScript interfaces from `SPEC.md` Section 4 in `src/core/types.ts`.
- **Verification Command:**
  ```bash
  npx tsc --noEmit && npm run build
  ```

### Task 2: Encode All 4 Verified GSEB Class 10 Blueprints + Invariant Tests
- **Primary Harness / Model:** **Antigravity → Gemini 3.8 Flash** *(Audit: Gemini App)*
- **Target Files:** `src/data/blueprints/maths-std-12.ts`, `src/data/blueprints/maths-basic-18.ts`, `src/data/blueprints/science-11.ts`, `src/data/blueprints/social-10.ts`, `src/data/blueprints/index.ts`, `tests/blueprints.test.ts`
- **Deliverables:**
  - Populate all 64 verified chapters (14 + 14 + 13 + 23) verbatim from `SPEC.md` Section 2.2 with `sourceUrl` and `academicYear: "2026-27"`.
  - Write Vitest invariants verifying every subject sums to `baseMarks === 80` and `withOptionMarks === 109`, with contiguous chapter IDs and non-empty titles.
- **Verification Command:**
  ```bash
  npx vitest run tests/blueprints.test.ts
  ```

---

## Phase B: Pure Core Engines (`src/core/`, Zero DOM)

### Task 3: Build 109-Mark General-Option Simulator (`simulateScore`)
- **Primary Harness / Model:** **Antigravity → Claude 4.6 Sonnet** *(Fallback: Codex → `5.6 Terra`)*
- **Target Files:** `src/core/simulator.ts`, `tests/simulator.test.ts`
- **Function Signature:**
  ```ts
  export function simulateScore(
    subject: BlueprintSubject,
    states: Record<number, ChapterSimState>
  ): {
    maxSecA: number;
    maxDescriptive: number;
    achievableScore: number;
    bufferUsed: number;
    passesTheoryFloor: boolean;
  }
  ```
- **Deliverables:**
  - Implement exact 24-mark compulsory ceiling + 56-mark descriptive cap out of 85 printed descriptive marks.
  - Test edge cases: all `MASTER` (`80`), all `SKIP` (`0`), all `SEC_A_ONLY` (`24`, fails `26` floor), skipping 29M of descriptive chapters.
- **Verification Command:**
  ```bash
  npx vitest run tests/simulator.test.ts
  ```

### Task 4: Build FSRS-6 Retest Engine & Exam-Date Ceiling (`fsrs-engine.ts`)
- **Primary Harness / Model:** **Antigravity → Claude 4.6 Opus** *(Verification: Codex → `GPT 6 LUNA`)*
- **Target Files:** `src/core/fsrs-engine.ts`, `tests/fsrs-engine.test.ts`
- **Function Signatures:**
  ```ts
  export function createInitialFsrsCard(now?: Date): string;
  export function reviewMistakeCard(
    serializedCard: string,
    rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY',
    examDateISO: string,
    now?: Date
  ): { nextCard: string; dueISO: string; retrievability: number };
  export function getRetrievability(serializedCard: string, now?: Date): number;
  ```
- **Deliverables:**
  - Wrap `ts-fsrs` with `enable_short_term: false`, `enable_fuzz: true`, `maximum_interval = Math.max(1, daysUntilExam - 2)`, and `request_retention = daysUntilExam <= 30 ? 0.94 : 0.90`.
  - Test that no scheduled `dueISO` ever exceeds `examDateISO - 2 days` even on repeated `EASY` ratings.
- **Verification Command:**
  ```bash
  npx vitest run tests/fsrs-engine.test.ts
  ```

### Task 5: Build Marks-at-Risk Priority Radar & Landmine Aggregator
- **Primary Harness / Model:** **Antigravity → Claude 4.6 Sonnet** *(Fallback: OpenCode → `DeepSeek V4.1 Flash Free`)*
- **Target Files:** `src/core/priority.ts`, `src/core/landmines.ts`, `tests/priority.test.ts`
- **Function Signatures:**
  ```ts
  export function rankChapters(
    subject: BlueprintSubject,
    mistakes: MistakeRecord[],
    mode: StrategyMode,
    now?: Date
  ): Array<{ chapterId: number; title: string; priorityScore: number; marksAtRisk: number; errorCount: number }>;

  export function buildLandmineChecklist(
    mistakes: MistakeRecord[],
    subjectId: SubjectId
  ): Array<{ tag: 'SILLY' | 'TIME'; chapterId: number; count: number; anchors: string[] }>;
  ```
- **Deliverables:**
  - Implement Bayesian-smoothed error rate (`(marksLost + 0.5) / (marksAttempted + 4.0)`), `TOPPER` vs. `SURVIVAL` weightings, and FSRS forgetting-risk multiplier.
  - Route `SILLY` and `TIME` mistakes exclusively to `buildLandmineChecklist` (top 5 traps).
- **Verification Command:**
  ```bash
  npx vitest run tests/priority.test.ts
  ```

### Task 6: Build IndexedDB Store & Strict JSON Backup Validator
- **Primary Harness / Model:** **Antigravity → Claude 4.6 Opus** *(Adversarial Tests: Codex → `5.6 Terra`)*
- **Target Files:** `src/core/backup-schema.ts`, `src/storage/db.ts`, `src/storage/store.ts`, `tests/backup-schema.test.ts`
- **Deliverables:**
  - Implement `validateBackupPayload(raw: unknown): BackupPayloadV1` rejecting malformed JSON, bad schema versions, or out-of-range marks.
  - Implement thin IndexedDB wrapper (`getAll`, `put`, `delete`, `clearAndImportAtomic`) + `navigator.storage.persist()` helper.
  - Track `testsSinceLastBackup` counter in `AppSettings`.
- **Verification Command:**
  ```bash
  npx vitest run tests/backup-schema.test.ts && npx tsc --noEmit
  ```

---

## Phase C: Visual System & 4 Mobile-First Views

### Task 7: Stage 5 Visual System Tokens, Icons & Shell Layout
- **Primary Harness / Model:** **Gemini App (Stage 5 Tokens/SVGs) + Claude App (Micro-Copy)** → **Antigravity → Gemini 3.8 Flash**
- **Target Files:** `src/styles/tokens.css`, `src/styles/app.css`, `public/icon-192.svg`, `public/icon-512.svg`, `src/ui/components/header.ts`, `src/ui/components/nav.ts`, `src/ui/components/ios-banner.ts`
- **Deliverables:**
  - Implement 3-color high-contrast palette (`>= 4.5:1` WCAG contrast), `>= 44px` tap targets, bottom 4-tab nav (`Simulator`, `Log`, `Radar`, `Retest`), subject switcher, exam countdown pill, and iOS Safari non-standalone PWA install banner.
- **Verification Command:**
  ```bash
  npm run build
  ```

### Task 8: Build Tab 1 (109-Mark Simulator) & Tab 2 (3-Minute Paper Autopsy Logger)
- **Primary Harness / Model:** **Antigravity → Gemini 3.8 Flash** *(CSS tweaks: OpenCode → `Hy4 flash Free`)*
- **Target Files:** `src/ui/views/simulator-view.ts`, `src/ui/views/logger-view.ts`, `src/ui/components/svg-bar.ts`
- **Deliverables:**
  - **Simulator:** Interactive chapter rows toggling `Master` / `Sec A Only` / `Skip` with live sticky score header (`Achievable: XX / 80`, `29M Buffer Used`, `Pass Floor: Safe/Risk`) + Social Science Q54 Map callout.
  - **Logger:** Preset pills (`80M Board/Gala`, `50M School`, `25M Tuition`), score input, and 4-tap mistake chip flow (`Chapter` → `Section` → `Marks Lost` → `Error Tag`) + optional 5-word Micro-Anchor input (`maxlength="60"`).
- **Verification Command:**
  ```bash
  npx tsc --noEmit && npm run build
  ```

### Task 9: Build Tab 3 (Priority Radar + Landmines), Tab 4 (FSRS Retest) & Settings/Backup Modal
- **Primary Harness / Model:** **Antigravity → Claude 4.6 Sonnet**
- **Target Files:** `src/ui/views/radar-view.ts`, `src/ui/views/retest-view.ts`, `src/ui/views/settings-modal.ts`, `src/main.ts`
- **Deliverables:**
  - **Radar:** Top-3 High-ROI Chapters Tonight (with `Topper` / `Survival` toggle) + Pre-Exam Landmine Checklist.
  - **Retest:** FSRS due cards showing Chapter, Section, Test Source, Micro-Anchor, and 4 rating buttons (`Again` / `Hard` / `Good` / `Easy`).
  - **Settings Modal:** Editable `examDateISO` (default `2027-02-25`), 1-tap `Export JSON Backup`, `Import JSON Backup` (with validation toast), and `Reset Data` confirmation.
- **Verification Command:**
  ```bash
  npx vitest run && npx tsc --noEmit && npm run build
  ```

---

## Phase D: Taste Audit, Security Check & Cloudflare Pages Deploy

### Task 10: Visual Critique, XSS Security Pass, Bundle Check & Cloudflare Pages Deploy
- **Primary Harness / Model:** **Codex → `GPT 6 LUNA` / `SOL`** (Security & Build) + **OpenCode → `Nemotron 3.5 Super VL Free`** (Screenshot Mobile UI Check) + **Claude App / Gemini App** (Final Taste & Launch Kit) + **ChatGPT App** (Surat WhatsApp/Reddit Launch Hooks)
- **Deliverables:**
  - Verify zero XSS vectors (`textContent` / escaped rendering for user `label` and `microAnchor` strings—never raw `innerHTML` with user input).
  - Verify total gzipped `dist/` JS+CSS bundle is `<150 KB` (target `<50 KB`).
  - Verify offline reload works in Chrome DevTools Network → Offline mode.
  - Deploy `dist/` to Cloudflare Pages (`buddyboardz10.pages.dev`) and smoke-test on iPhone Safari + Add to Home Screen.
- **Verification Command:**
  ```bash
  npx vitest run && npm run build && du -sh dist/
  ```