# 🤖 AGENTS.md — System Context & Engineering Invariants for BuddyBoardz

> **Document Type:** Context Engineering Ground Truth  
> **Target Audience:** Autonomous Agents, AI Engineers, and Human Contributors  
> **Repository:** `shlokbuilder27/BuddyBoardz`  
> **Maintainer:** Shlok & WOZ  

---

## 1. Project Dogma & Identity

BuddyBoardz is not a learning management system, not another flashcard app, and not an AI homework solver. It is a **109-Mark Paper Intelligence System** purpose-built for Gujarat Secondary and Higher Secondary Education Board (GSEB) Class 10 students (English Medium) in Surat, Gujarat.

### The Non-Negotiable Core Principles

1. **The Paper Priority (Hand Back to Paper):**
   Every digital screen must ask for a small diagnostic input (3 taps or fewer) and immediately hand the student back to physical pen and paper. Real exam performance lives in handwritten paper proofs, not touchscreen glow.
2. **Zero-Server / Absolute Privacy:**
   BuddyBoardz runs 100% locally. Student mistakes, anxiety patterns, marks lost, and test evaluations must NEVER be transmitted to a remote cloud or surveillance server. Local storage and native OS files are the single source of truth.
3. **Zero Cheap Dopamine:**
   No gambling gamification, no spinning wheels, no aggressive confetti. Visual feedback is restrained, Bauhaus-minimalist, and respectful of a stressed 15-year-old student's cognitive bandwidth.

---

## 2. Hard Invariants (Mathematical & Board Rules)

Any agent modifying the codebase must preserve these mathematical invariants. **Tests will fail if any of these are violated.**

### A. The 109-Mark General-Option Invariant
- **Total Printed Marks:** $\sum \text{Chapter Opt} = 109$.
- **Compulsory Base Paper:** $\sum \text{Chapter Base} = 80$.
- **Option Cushion (Safety Net):** $109 - 80 = 29\text{ marks}$.
- **Section A Ceiling:** Exactly $24\text{ marks}$. Objective questions (Q1–Q24) carry **zero general options**.
- **Descriptive Pool:** Exactly $85\text{ marks}$ printed across Sections B, C, and D. A student needs at most $56\text{ marks}$ from this pool ($80 - 24 = 56$).
- **GSEB Board Pass Floor:** **26 marks out of 80** ($33\%$ of 80 rounded down). If a student's simulated achievable score drops below 26, the UI must immediately flag a critical pass-floor warning.

### B. Mutually Exclusive Mathematics Track Rule
- GSEB Class 10 students are enrolled in **either** Mathematics Standard (Code 12) **or** Mathematics Basic (Code 18). **No student takes both.**
- The application must never present both Maths tracks simultaneously in the navigation, subject switcher, simulator, or logger.
- When `state.mathsTrack === 'maths-std-12'`:
  - Statistics is $8\text{M base} / 10\text{M opt}$.
  - Arithmetic Progressions is $6\text{M base} / 9\text{M opt}$.
  - Real Numbers is $4\text{M base} / 4\text{M opt}$.
- When `state.mathsTrack === 'maths-basic-18'`:
  - Statistics is $14\text{M base} / 16\text{M opt}$ (High-ROI pass anchor).
  - Arithmetic Progressions is $8\text{M base} / 13\text{M opt}$.
  - Real Numbers is $2\text{M base} / 2\text{M opt}$.

### C. The Four Flaw Taxonomy
Mistakes logged from evaluated test papers belong strictly to one of four categories:
1. `CONCEPT` (Didn't know the core concept / never learned it).
2. `FORMULA` (Forgot identity, theorem formula, or units).
3. `SILLY` (Bracket sign flip, arithmetic slip, misread diameter as radius).
4. `TIME` (Stuck in Section A, ran out of time in Section D).

**Routing Rule:**
- `CONCEPT` & `FORMULA` are routed to the **FSRS Spaced Repetition Retest Engine**.
- `SILLY` & `TIME` are routed to the **Pre-Exam Landmine Checklist**.

### D. FSRS Exam Cap Invariant
- FSRS review intervals are mathematically bounded:
  $$\text{Interval}_{\text{effective}} = \min\left(\text{FSRS\_Calculated\_Days}, \max(1, \text{DaysUntilExam} - 2)\right)$$
- No revision card may be scheduled on or after the GSEB Board Exam start date (default: `2027-02-25`). Within the final 48 hours before exams, the retest arena locks and the student reviews only their Landmine Checklist.

---

## 3. Architecture & File Structure

```
BuddyBoardz/
├── AGENTS.md                      # This document (Context Engineering)
├── test/                          # Stage 2 Automated Test Harness
│   └── run_tests.js               # Node.js deterministic headless test suite
├── Assets/                        # Native brand assets & animated mp4 intro
├── fonts/                         # Agrave Pro & Asimovian offline fonts
├── buddyboardz-10/                # Primary Web & Desktop Codebase
│   ├── index.html                 # Complete 6-module client engine
│   ├── server.js                  # Lightweight local dev server (Port 3005)
│   └── buddyboardz-10-tauri-rust/ # Native Windows Desktop App (Tauri v2 + Rust)
│       ├── src-tauri/
│       │   ├── src/main.rs        # Tauri entrypoint & IPC commands
│       │   ├── src/simulator.rs   # Native Rust blueprint simulator
│       │   ├── src/fsrs_engine.rs # Native Rust FSRS memory scheduler
│       │   └── tauri.conf.json    # Tauri v2 bundle configuration
│       └── dist_index_preview.html# Desktop release distribution
```

---

## 4. Tauri IPC Bridge Contract (Systems Engineering)

When running inside Tauri, the JavaScript frontend communicates with the Rust backend via `window.__TAURI__.core.invoke`. When running in a standard web browser, it gracefully falls back to local JavaScript execution.

### IPC Command Signatures (`src-tauri/src/main.rs`)
```rust
#[tauri::command]
pub fn run_simulation(chapters: Vec<ChapterWeight>) -> SimulationResult;

#[tauri::command]
pub fn compute_fsrs_next(
    stability: f64,
    rating: ReviewRating,
    exam_date_iso: String,
) -> Result<NextReview, String>;

#[tauri::command]
pub fn save_atomic_backup(path: String, json_payload: String) -> Result<(), String>;
```

---

## 5. Visual Identity & Design Standards (Dieter Rams / Bauhaus)

- **Palette:**
  - Ink: `#111111`
  - Ink Soft: `#555555`
  - Paper: `#FFFFFF`
  - Skin: `#F5EFE6`
  - Beige: `#EDE8DF`
  - Hairline Border: `#E6E4DC`
  - Primary Border: `1.5px solid #111111`
  - Bauhaus Red Accent: `#D04A36`
- **Typography:**
  - Headers & Numbers: `Agrave Pro` (geometric, clean)
  - Monospace Data & Badges: `Asimovian` / `monospace`
- **2D Schematic Mascot (`Buddy`):**
  - Minimalist vector stickman: Two dot eyes, one curved line mouth.
  - Reactions: `happy`, `excited`, `think`, `alert`.
  - Mascot speaks via Web Speech API (`speakBuddy`) only when voice toggle is enabled.

---

## 6. Development & Evaluation Protocol

1. **Verify Invariants Before Modifying:**
   Always run the test harness before committing:
   ```bash
   node test/run_tests.js
   ```
2. **Mirroring Rule:**
   Any change made to `buddyboardz-10/index.html` that affects the desktop interface must also be reflected in `buddyboardz-10/buddyboardz-10-tauri-rust/dist_index_preview.html` and `dist/index.html`.
3. **Commit Standards:**
   Follow Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`). Never commit unverified or breaking code.

---

## 7. The Multi-Harness AI Engineering Charter ("Dentist vs. Plumber Principle")

BuddyBoardz is engineered through a coordinated multi-harness operating structure. Rather than uncoordinated agents colliding on the same codebase, every model and harness has strict role boundaries:

| Seat | Agent / Engine | Responsibility | Primary Deliverables |
|---|---|---|---|
| **Founder & Decider** | **Shlok** | Field testing, product vision, final approval | Student feedback, Surat board exam alignment, merge signoff |
| **Chief Strategist** | **ChatGPT (GPT-6)** | Product architecture, pedagogical conscience, specifications | Roadmaps, invariant specifications, flaw taxonomy design |
| **Master Architect & Conductor** | **Antigravity / `WOZ` (Gemini 3.8 Flash)** | System conductor, context engineering, harness runner | `AGENTS.md`, test orchestrator, memory OS, coordinate harnesses |
| **Heavy Implementation Lead** | **Claude Code (`CC`)** | Core domain logic, native Rust engines, precision refactoring | Tauri IPC, FSRS math, AST parsers, deterministic state engines |
| **Frontend Workhorse** | **OpenCode (`oc` / `ocw`)** | High-velocity UI implementation (unlimited quota) | Bauhaus/Rams HTML/CSS, responsive components, landing pages |
| **Independent Verifier** | **OpenAI Codex** | Verification, AST review, security and contract auditing | Static analysis, test coverage audit, independent verification |

---

## 8. The Four Engineering Laws

All agents, subagents, and contributors modifying this repository must obey these four laws without exception:

1. **Law 1: One Primary Writer Per Task**  
   Never permit multiple AI harnesses to edit the same file simultaneously. Each task is owned by one designated writer; all other participants operate in advisory or review roles.

2. **Law 2: Independent Verification**  
   The implementer cannot be the sole verifier. Code produced by an implementation agent must be evaluated by an independent test suite, contract linter, or verification harness.

3. **Law 3: Evidence Before Approval**  
   Zero unverified claims. No feature, bugfix, or refactor may be marked resolved without deterministic execution logs demonstrating passing assertions that actively exercise the code.

4. **Law 4: Git is the Single Source of Truth**  
   Every meaningful milestone must be captured in atomic Git commits adhering to Conventional Commits. Working trees must remain clean, and every state mutation must have an auditable, rollback-safe history.
