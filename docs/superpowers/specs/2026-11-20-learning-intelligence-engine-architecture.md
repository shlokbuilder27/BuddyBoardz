# Learning Intelligence Engine Architecture — BuddyBoardz

> **Date:** 2026-11-20
> **Status:** Architecture proposal. Phase 1 (audit) complete. Baseline verification: `node test/run_tests.js` → 108 PASSED / 0 FAILED.
> **Doc Type:** Architecture (Phase 1) — extended, not rebuilt. v1 capture/diagnose/route preserved.

---

## 1. Intent & Scope

BuddyBoardz evolves through the product identities the user proposed:

- **Today:** Paper Mistake Intelligence.
- **Next:** Personal Learning Intelligence.
- **Eventually:** Adaptive academic improvement system.

The closed-loop system connects: **What the student knows → what they get wrong → why it happens → what should happen next → whether the intervention worked.**

**Scope decision (Phase 0, reviewed):** This **extends** BuddyBoardz 10 as-is. The v1 flow (4-tap paper mistake logger → radar → FSRS retest) stays as the capture/diagnose/route core. The new engines add the **Practise → Verify → Measure** stages v1 lacks, plus the knowledge graphs and the Next Best Action Engine.

---

## 2. Constraints (must hold through all phases)

1. **Local-first / zero-server.** All intelligence lives in client storage (`localStorage` in the browser; native files in desktop). Never transmit to a cloud. (Matches AGENTS.md "Zero-Server / Absolute Privacy".)
2. **Paper-first manifesto.** Every digital screen hands the student back to pen and paper. No full-screen "mathGPT" overlays. Practise activities are **paper exercises** (paper + pen); verification is by paper attempts.
3. **GSEB invariants** (AGENTS.md §2, enforced by `test/run_tests.js` Suites 1–2): blueprint sums `base=80`/`opt=109`, pass floor 26/80, mutually exclusive Maths tracks. Preserved and regression-tested.
4. **Determinism of engines.** Scoring, mastery, scheduling, graphs — pure functions of stored data. Explainable & reproducible. No random AI judgments inside the loop.
5. **Bauhaus minimalism.** No new dopamine visuals; intelligence surfaces as text/lines.
6. **Tidepool role:** engineering assistance (draft, debug, review) only. Every change is reviewed by OpenCode before merge (git checkpoint per phase).
7. **No fabricated data:** no fake student performance; mockery only for tests.

---

## 3. Approaches Considered & Chosen

| Approach | Why rejected |
| :--- | :--- |
| AI-wrapper approach | LLM judgments are non-deterministic, privacy-hostile, and undermine the paper-first manifesto. |
| Full rewrite (new architecture) | User's Phase-0 answer: extend. Avoids regressions; keeps the 108-test invariant suite alive. |
| **Chosen: extend + incremental deterministic engines** | Pure functions, per-phase checkpoints, gradual UI surfacing. |

---

## 4. Systems (5 engines) — responsibility & contracts

All engines are pure and deterministic; contracts identical in JS (browser) and Rust (desktop). Function signatures listed in **§6** data model form.

### 4.1 Feedback Loop Engine
Connects assessment → intervention → verification → reopening.
- `recordAssessment(attempt)` — stores attempt history; updates chapter mastery, error pattern frequencies, marks-at-risk estimates.
- `detectWeaknesses()` — returns patterns with `frequency >= 2` in chapter estimates below threshold; marks `WORSE`/`DETERMINING` severity.
- `generateCorrectiveActivity(weakness)` — kind by errorTag: `CONCEPT_REWORK` / `FORMULA_REVIEW` / `DRILL_SET` / `TIME_MANAGEMENT`.
- `scheduleRetest(activity)` — due date = `max(1, daysUntilExam - 2)` (same cap as `computeFsrsNextSync`).
- `recordCorrectivePractice(activity)` — marks `PRACTICE_DONE`. **No mastery credit** (user rule: activity completion ≠ mastery; mastery needs evidence from a later attempt).
- `recordRetestResult(retest, result, marksLostAfter)` — marks `VERIFIED` on PASS (feeds existing FSRS path: calls `computeFsrsNextSync` to keep legacy retest queue behavior) or reopens weakness on FAIL.

### 4.2 Knowledge Graph Engine
Structural (shared) graph + error patterns.
- Nodes: `ConceptNode` (prerequisites), `QuestionNode` (chapter/concept/marks/section), `ErrorPatternNode`.
- Edges: concept prerequisite edges (`A → B`: B requires A), error co-occurrence edges between patterns in the same attempt, chapter→concept containment (fields).
- Traversal: `conceptAncestors(id)`, `conceptDescendants(id)`, `rootCausesOf(chapterId)` (patterns whose prerequisites are already covered).
- `setChapterConcepts(subjectId)` — seeds concepts from blueprints (ids `${subjectId}-c${chapterId}`), and structural questions per section (A: 24×1M; B: 13×2M printed 26; C: 9×3M printed 27; D: math 5×4M printed 32, social 4×4M + compulsory 4M map).

### 4.3 Mastery Engine
Evidence-based chapter estimates.
- `masteryFor(subjectId, chapterId)` → `{ estimate (0..1), evidence[], lastVerified }`.
- Estimate update on `recordRetestResult` PASS: `estimate += 0.25` (bounded 0..1). FAIL: `estimate -= 0.25` + weakness reopened.
- Time decay toward prior after `lastVerified` (defined in Phase 5: e.g. linear toward 0.5, -5%/week, exam-aware floor).
- Default prior: `0.3` (new chapter; data arrives from assessments).

### 4.4 Pattern Detection Engine
- `topWeakPatterns(subjectId)` — frequency, trend, chapter linkage.
- Trend per pattern: `RISING` (freq grew last 2 windows) / `STABLE` / `FALLING`.
- Recurring-mistake detection: same `(errorTag, normalizedAnchor)` in ≥ 2 attempts → pattern node created.

### 4.5 Next Best Action Engine (the differentiator)
`nextBestAction(studentId)`:
```
priority = marksRecoverable × frequencyWeight × importance × novelty × retestHistoryFactor
  marksRecoverable  = chapterBase × (1 − mastery) (capped ≤ chapterBase)
  frequencyWeight   = 1 + min(3, pattern.frequency) × 0.2
  importance        = chapterOpt / 109 (or 0.8 for pass-floor chapters)
  novelty           = examProximityFactor(daysUntilExam)   // closer → higher
  retestHistoryFactor = 1 / (1 + failedRetestsForActivity)
```
Returns single top action: `{ activity, reason, expectedMarksRecoverable, priority }`.

---

## 5. Storage & Migration (Phase 2)

**New store** — `localStorage` key `buddyboardz_intelligence_v2`:
```json
{
  "version": 2,
  "attempts": [Attempt],
  "errorPatterns": [ErrorPattern],
  "activities": [CorrectiveActivity],
  "retests": [Retest],
  "chapterMastery": [ChapterMastery]
}
```

**Migration (additive, idempotent):**
- On first load: if `buddyboardz_intelligence_v2` missing → build from `state.mistakes[]`: group per `(subjectId, examDateISO)` → `Attempt` (score = legacy unknown → `null`; `mistakes` = mapped LegacyMistake; createdAt = mistake time). Derive error patterns from mistakes.
- Existing keys `buddyboardz_active_desk_v2` and `buddyboardz_profiles_v2` remain untouched (v1 still reads/writes them). No data loss.
- `loadIntelligence()` returns empty store if none.

**Atomicity:** writes are full-store JSON writes (same pattern as `saveState()`). No partial-state risk; `try/catch` with explicit surface on failure (matching repo's "zero silent failures" rule).

---

## 6. Data Model (contracts, shared JS/Rust)

```ts
type SubjectId = 'maths-std-12' | 'maths-basic-18' | 'science-11' | 'social-10'; // existing
type ErrorTag = 'CONCEPT' | 'FORMULA' | 'SILLY' | 'TIME'; // existing taxonomy

type LegacyMistake = {
  subjectId: SubjectId; chapterId: number; section: PaperSection;
  marksLost: 1|2|3|4; errorTag: ErrorTag; microAnchor?: string;
};

type Attempt = {
  attemptId: string;          // 'at-' + Date.now() + random suffix
  studentId: string;
  subjectId: SubjectId;
  examDateISO: string;
  scoreObtained: number | null;
  createdAt: number;
  mistakes: LegacyMistake[];
};

type ErrorPattern = {
  patternId: string;          // 'ep-' + hash(subjectId, conceptId, errorTag)
  subjectId: SubjectId;
  conceptId: string;
  chapterId: number;
  errorTag: ErrorTag;
  description: string;        // e.g. "Sign error when opening a bracket"
  frequency: number;
  firstSeen: number; lastSeen: number;
  trend: 'RISING' | 'STABLE' | 'FALLING';
};

type CorrectiveActivity = {
  activityId: string;
  studentId: string;
  subjectId: SubjectId; chapterId: number; conceptIds: string[];
  kind: 'CONCEPT_REWORK' | 'FORMULA_REVIEW' | 'DRILL_SET' | 'TIME_MANAGEMENT';
  status: 'PENDING' | 'PRACTICE_DONE' | 'VERIFIED' | 'REOPENED';
  expectedOutcome: string;
  createdAt: number;
  linkedPatternIds: string[];
};

type Retest = {
  retestId: string;
  activityId: string; studentId: string;
  subjectId: SubjectId; chapterId: number; conceptIds: string[];
  scheduledFor: string;       // ISO date
  result: 'PENDING' | 'PASS' | 'FAIL';
  marksLostAfter?: number;
  lastAttemptId: string;
  createdAt: number;
};

type Evidence = { attemptId: string; kind: 'RETRY_PASS' | 'RETRY_FAIL' | 'PRACTICE_DONE'; weight: number };
type ChapterMastery = { chapterId: number; subjectId: SubjectId; estimate: number; evidence: Evidence[]; lastVerified: number };

type ConceptNode = { id: string; subjectId: SubjectId; chapterId: number; name: string; difficulty: number; importance: number; prerequisites: string[] };
type QuestionNode = { id: string; subjectId: SubjectId; chapterId: number; conceptIds: string[]; marks: number; difficulty: number };

type Weakness = { pattern: ErrorPattern; chapterId: number; estimate: number; marksAtRisk: number; severity: number };
type NextBestAction = { activity: CorrectiveActivity; reason: string; expectedMarksRecoverable: number; priority: number };

// Engine API (public surface)
function recordAssessment(a: Attempt): void;
function recordCorrectivePractice(act: CorrectiveActivity): void;        // PRACTICE_DONE — no mastery credit
function recordRetestResult(retest: Retest, result: 'PASS'|'FAIL', marksLostAfter?: number): void;
function reopenWeakness(retest: Retest): void;
function detectWeaknesses(): Weakness[];
function generateCorrectiveActivity(w: Weakness): CorrectiveActivity;
function scheduleRetest(act: CorrectiveActivity): Retest;
function masteryFor(subjectId: SubjectId, chapterId: number): ChapterMastery;
function topWeakPatterns(subjectId: SubjectId): ErrorPattern[];
function nextBestAction(studentId: string): NextBestAction | null;
function conceptAncestors(conceptId: string): string[];
function conceptDescendants(conceptId: string): string[];
function chapterProgression(studentId: string): Array<{ attemptId, examDateISO, score }>; // Marks Progression Graph
function chapterMasteryGraph(): Array<{ chapterId, subjectId, estimate }>;
```

**Integration with existing FSRS (Phase 3):** `recordRetestResult(PASS)` also calls the existing `computeFsrsNextSync(stability, ratingKey, examDate)` path so the legacy retest queue stays correct. `CONCEPT`/`FORMULA` taxonomy routing is preserved.

---

## 7. Rust / JavaScript split (user's assignment)

- **JavaScript (web app, `index.html`):** engines as pure TS-style functions (browser mirrors of Rust), plus UI + visualisations. Follows the existing dual-mirror pattern (`simulator.rs` ↔ `computeSimulation`, `fsrs_engine.rs` ↔ `computeFsrsNextSync`).
- **Rust (desktop app, `src-tauri`):** engine modules — the primary implementation for the desktop product:
  - `feedback_loop.rs` (Phase 3) — `record_assessment`, `detect_weaknesses`, `generate_activity`, `schedule_retest`, `record_retest_result`, `reopen_weakness`
  - `graph.rs` (Phase 4) — `concept_ancestors`, `concept_descendants`, `set_chapter_concepts`, traversal
  - `mastery.rs` (Phase 5) — `mastery_for`, evidence accumulation, decay, trend per chapter
  - `pattern_detector.rs` (Phase 5) — frequency/trend
  - `next_action.rs` (Phase 6) — scoring & selection of the single best action
- **IPC:** `main.rs` gains commands (e.g. `record_assessment`, `next_best_action`, `record_retest_result`) for desktop surfacing.
- **Tests:** `cargo test` per Rust module; `node test/run_tests.js` extended per phase with JS mirror suites. Parity of behavior verified by shared scenario scripts.

---

## 8. Phase Plan & Per-Phase Verification (7 phases)

| Phase | Deliverable | Verify (actual commands run) |
|---|---|---|
| 1 | Audit + this Architecture doc | `node test/run_tests.js` → 108/0 (done) |
| 2 | Data model + migration + v3 store + JS mirrors + Node suites | `node test/run_tests.js` → **145 PASSED / 0 FAILED** (baseline 108 + 37 new assertions in Suites 9–10: model round-trip, additive migration, idempotency) — verified 2026-11-20 |
| 3 | Feedback Loop Engine (recordAssessment→activity→retest→reopen + FSRS bridge) | `cargo test` → **13 PASSED / 0 FAILED** (6 baseline + 7 new) and `node test/run_tests.js` → **186 PASSED / 0 FAILED** (145 + 41 new in Suites 11–13) — verified 2026-11-20 |
| 4 | Knowledge Graph Engine (concepts, prerequisites, questions, traversal) | `cargo test` (graph) + Node suites (traversal scenarios) |
| 5 | Mastery + Pattern Detection engines | `cargo test` (mastery, pattern_detector) + Node suites (evidence math, decay, trends) |
| 6 | Next Best Action Engine | `cargo test` (next_action) + Node suites (scoring order scenarios) |
| 7 | Integration + UI surfacing (dashboard view, Radar shows NBO, mirror sync) + docs (AGENTS.md new invariants) | `node test/run_tests.js` + `cargo test` + `node harness/repair_loop.js` (diagnostics HEALTHY) |

**Phase 7 UI scope (minimal):** add an "Intelligence" tab — `nextBestAction()` line (the answer to "what is the one thing I should work on next?") + chapter mastery graph view. All existing views untouched.

---

## 9. Delays & Honest-Verification Notes

- No fabricated performance data: mastery priors (0.3) and scoring constants are formulas, not inferred from real student data.
- Reports after each phase list: changed files, verification commands executed, and actual pass/fail counts.
## 10. Reviewgate

- Phase 0/1 answer (user message): **"Yes — extend BuddyBoardz 10 as-is."**
- Per the assignment: nothing begins Phase 2 until this document is reviewed and approved.
- Before each phase: report actual verification results; update this doc with user corrections.

## 11. Phase Completion Log

### Phase 2 — Data Model + Migration (verified 2026-11-20)
- Changed files: `buddyboardz-10/index.html` (store/model/migration functions), `test/run_tests.js` (exports + Suites 9–10), this document.
- Verification executed: `node test/run_tests.js` → 145 PASSED / 0 FAILED (Suites 9–10 add 37 assertions).
- Calls made (reviewable): migration is an explicit `migrateIntelligence()` function, wired from UI init in Phase 7 (avoids side effects at script load); legacy attempts carry `scoreObtained: null` (no invented marks); `desk_index` filtering by studentId stays in Phase 7; patterns grouped by `(subjectId, chapter conceptId, errorTag)` with deterministic FNV-1a-style ids; desktop mirrors deferred to Phase 3+ (no UI change in Phase 2, so dist mirror not touched).

### Phase 3 — Feedback Loop Engine (verified 2026-11-20)
- Changed files: `buddyboardz-10/index.html` (JS engine + wrappers), `test/run_tests.js` (exports + Suites 11–13), `buddyboardz-10/.../src-tauri/src/feedback_loop.rs` (new Rust mirror), `main.rs` (mod + 2 IPC commands), this document.
- Verification executed: `node test/run_tests.js` → 186 PASSED / 0 FAILED; `cargo test` → 13 PASSED / 0 FAILED. First Rust attempt failed to compile on a `String`/`&str` comparison in one test; fixed with `.as_str()`, re-run green. First JS run had 3 failures (retry-id off-by-one + two fixtures with unsupported mastery-without-evidence states); fixed and re-run green. `cargo test` emits a pre-existing linker warning about multiple non-default manifests (not a test failure).
- Calls made (reviewable): mastery is recomputed as `prior + Σ evidence weights` (never from a stored estimate alone), prior 0.3, weights `ASSESSMENT_MISS -0.1 / RETRY_PASS +0.25 / RETRY_FAIL -0.25 / PRACTICE_DONE 0`; `Evidence.createdAt`, `ErrorPattern.latestAttemptId`, `Retest.fsrsNextDueIso` added to support provenance and the FSRS bridge; retest intervals are `min(7, max(1, daysUntilExam-2))`; failed verification reopens with deterministic `-retry-N` retest id; desktop IPC commands take JSON payloads (Rust stays pure, JS persists).
