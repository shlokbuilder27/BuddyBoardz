# SPEC.md — BuddyBoardz 10 (GSEB Class 10 Blueprint & Mock-Mistake Autopsy PWA)

**Product Name:** `BuddyBoardz 10` *(Locked by CEO — `buddyboardz10.pages.dev`)*  
**Pipeline Stage:** Stage 4 — Locked Engineering Specification (`@architecture-skill` + `@round-table`)  
**Positioning Wedge (13 words):** *Turn any GSEB Class 10 paper test into a 3-minute marks-recovery plan.*  
**Target User:** GSEB Class 10 (SSC) English-Medium students in Surat & Gujarat taking school exams, weekly tuition tests, and Gala/Navneet paper sets.  
**Hosting & Runtime:** 100% client-side, offline-first static PWA on Cloudflare Pages (`<50 KB` gzipped target, `<150 KB` hard ceiling, zero backend, zero login).

## 1. Locked v1 Scope & Non-Goals

### In Scope (v1)
- **Subjects (4 Core GSEB Class 10 Papers — English Medium):**
  1. Mathematics Standard (`code: "12"`) — 14 chapters, 80 written / 109 printed marks ([CollegeDekho GSEB SSC Pattern](https://www.collegedekho.com/gujarat-board-gseb-10th-ssc-exam-pattern-brd)).
  2. Mathematics Basic (`code: "18"`) — 14 chapters, 80 written / 109 printed marks ([CollegeDekho Basic Maths 2026](https://www.collegedekho.com/news/gseb-10th-basic-mathematics-weightage-marks-2026-chapter-wise-75349/)).
  3. Science & Technology (`code: "11"`) — 13 chapters, 80 written / 109 printed marks ([CollegeDekho Science 2026](https://www.collegedekho.com/news/gseb-10th-science-chapter-wise-weightage-marks-2026-75431/)).
  4. Social Science (`code: "10"`) — 23 chapters, 80 written / 109 printed marks ([Gradehunt GSEB Social Science 2026-27](https://gradehunt.com/blogs/gujarat-board-subject-wise-syllabus-class-10-social-science)).
- **Default Board Exam Date Cap:** `2027-02-25` (editable in Settings), aligned to the GSEB 2026–27 Academic Calendar window of **February 25 to March 17, 2027** ([Keystone Universe](https://keystoneuniverse.com/blog/gseb-board-exam-2027-official-dates-for-std-10-and-12), [Careers360](https://school.careers360.com/boards/gseb/gseb-ssc-result), [Shiksha](https://www.shiksha.com/boards/gseb-ssc-board)).
- **Four Core Modules:**
  1. **109-Mark General-Option Simulator (Day-1 Zero-Data Hook):** Interactive chapter toggle (`Master` / `Sec A Only` / `Skip`) computing live achievable board score out of 80 using GSEB's 29-mark general-option buffer.
  2. **3-Minute Tap-Only Paper Autopsy Logger:** 4-tap mistake entry (`Chapter` → `Section A/B/C/D` → `Marks Lost` → `Error Tag`) + optional 5-word Micro-Anchor (`"Ch8 Trig identity sign flip"`).
  3. **Marks-at-Risk Priority Radar & Two-Bucket Fix Engine:**
     - **Bucket 1 (`CONCEPT` / `FORMULA`):** Client-side FSRS-6 (`ts-fsrs`) spaced retest queue capped to `examDate - 2 days`.
     - **Bucket 2 (`SILLY` / `TIME`):** Aggregated "Pre-Exam Landmine Checklist" (never spams flashcards).
  4. **ITP-Proof Persistence & 1-Tap Backup:** `IndexedDB` + `navigator.storage.persist()` + iOS "Add to Home Screen" guide + 1-tap `<50 KB` JSON snapshot export/import (designed for WhatsApp "Message Yourself" or iOS Files).

### Explicit Non-Goals (Cut from v1)
- No Computer Studies (`331`), English (`04`/`16`), or Class 12 HSC blueprints in v1 (supported later by dropping JSON files into `src/data/blueprints/`).
- No Gujarati UI translation toggle in v1 (English Medium only).
- No user accounts, cloud sync, Firebase/Supabase, AI chat wrappers, video lectures, or textbook question banks.
- No heavy charting libraries (inline SVG bars/sparklines only).

## 2. Verified GSEB Class 10 Paper & Blueprint Data

### 2.1 Common 80-Mark / 109-Printed-Mark Section Structure
All four v1 subjects use an **80-mark written board paper (3 hours) + 20-mark internal school assessment = 100 marks**, with a mandatory passing floor of **26/80 in theory** (33% overall does not pass if theory is `<26`) ([BharatBoard SSC Blueprint](https://www.bharatboard.com/guides/gseb-ssc-mathematics-science-social-blueprint), [Gradehunt Social Science](https://gradehunt.com/blogs/gujarat-board-subject-wise-syllabus-class-10-social-science)):

| Section | Question Range | Attempt Rule | Marks / Q | Max Scored | Printed Marks |
| :--- | :--- | :--- | ---: | ---: | ---: |
| **Section A** | Q1–Q24 | All 24 compulsory (0 options) | 1 | 24 | 24 |
| **Section B** | Q25–Q37 | Any 9 of 13 (General Option) | 2 | 18 | 26 |
| **Section C** | Q38–Q46 | Any 6 of 9 (General Option) | 3 | 18 | 27 |
| **Section D (Maths/Sci)** | Q47–Q54 | Any 5 of 8 (General Option) | 4 | 20 | 32 |
| **Section D (Social Sci)** | Q47–Q53 + Q54 | Any 4 of 7 (16M) + Q54 Compulsory India Map (4M) | 4 | 20 | 32 |
| **Total** | **54 Printed** | **44 Attempted** | — | **80** | **109** |

### 2.2 Verified Chapter-Wise Weightage Tables (Without Option / With General Option)

#### A. Mathematics Standard (`12`) & Mathematics Basic (`18`) — 14 Chapters
*Sources: [CollegeDekho GSEB SSC Pattern](https://www.collegedekho.com/gujarat-board-gseb-10th-ssc-exam-pattern-brd) and [CollegeDekho Basic Maths 2026](https://www.collegedekho.com/news/gseb-10th-basic-mathematics-weightage-marks-2026-chapter-wise-75349/). Ch. 7 normalized from Gujarati "Yaam Bhumiti" to official NCERT/GSEB English title "Coordinate Geometry".*

| Ch | Chapter Title (English Medium) | Std (12) Base | Std (12) w/ Opt | Basic (18) Base | Basic (18) w/ Opt |
| :-: | :--- | ---: | ---: | ---: | ---: |
| 1 | Real Numbers | 4 | 4 | 2 | 2 |
| 2 | Polynomials | 6 | 9 | 6 | 6 |
| 3 | Pair of Linear Equations in Two Variables | 8 | 12 | 4 | 8 |
| 4 | Quadratic Equations | 5 | 7 | 5 | 7 |
| 5 | Arithmetic Progressions | 6 | 9 | 8 | 13 |
| 6 | Triangles | 5 | 9 | 4 | 8 |
| 7 | Coordinate Geometry | 5 | 5 | 8 | 11 |
| 8 | Introduction to Trigonometry | 5 | 7 | 4 | 6 |
| 9 | Some Applications of Trigonometry | 4 | 4 | 2 | 2 |
| 10 | Circles | 6 | 9 | 5 | 8 |
| 11 | Areas Related to Circles | 4 | 4 | 2 | 2 |
| 12 | Surface Areas and Volumes | 8 | 12 | 6 | 6 |
| 13 | Statistics | 8 | 10 | 14 | 16 |
| 14 | Probability | 6 | 8 | 10 | 14 |
| **Sum** | **14 Chapters Verified** | **80** | **109** | **80** | **109** |

#### B. Science & Technology (`11`) — 13 Chapters
*Sources: [CollegeDekho Science 2026](https://www.collegedekho.com/news/gseb-10th-science-chapter-wise-weightage-marks-2026-75431/) & [CollegeDekho SSC Pattern](https://www.collegedekho.com/gujarat-board-gseb-10th-ssc-exam-pattern-brd). Ch. 5 normalized from Gujarati "Jaivik Kriyao" to official NCERT/GSEB English title "Life Processes".*

| Ch | Chapter Title (English Medium) | Base Marks | With General Option |
| :-: | :--- | ---: | ---: |
| 1 | Chemical Reactions and Equations | 5 | 5 |
| 2 | Acids, Bases and Salts | 7 | 10 |
| 3 | Metals and Non-metals | 7 | 10 |
| 4 | Carbon and its Compounds | 6 | 6 |
| 5 | Life Processes | 8 | 14 |
| 6 | Control and Coordination | 6 | 6 |
| 7 | How do Organisms Reproduce? | 6 | 10 |
| 8 | Heredity | 3 | 3 |
| 9 | Light – Reflection and Refraction | 8 | 8 |
| 10 | The Human Eye and the Colourful World | 5 | 9 |
| 11 | Electricity | 8 | 10 |
| 12 | Magnetic Effects of Electric Current | 5 | 8 |
| 13 | Our Environment | 6 | 10 |
| **Sum** | **13 Chapters Verified** | **80** | **109** |

#### C. Social Science (`10`) — 23 Chapters
*Source: [Gradehunt GSEB Social Science 2026-27](https://gradehunt.com/blogs/gujarat-board-subject-wise-syllabus-class-10-social-science) (citing GSEB Circular dated 28 August 2025) cross-verified with [CollegeDekho SSC Pattern](https://www.collegedekho.com/gujarat-board-gseb-10th-ssc-exam-pattern-brd).*

| Ch | Chapter Title (English Medium) | Theme | Base | With Opt |
| :-: | :--- | :--- | ---: | ---: |
| 1 | Heritage of India | Heritage | 3 | 5 |
| 2 | Cultural Heritage: Traditions, Handicrafts and Fine Arts | Heritage | 3 | 5 |
| 3 | Cultural Heritage: Sculpture and Architecture | Heritage | 4 | 7 |
| 4 | Literary Heritage of India | Heritage | 4 | 4 |
| 5 | India's Heritage of Science and Technology | Heritage | 4 | 8 |
| 6 | Places of Indian Cultural Heritage | Heritage | 4 | 4 |
| 7 | Preservation of Our Heritage | Heritage | 3 | 3 |
| 8 | Natural Resources | Geography | 4 | 7 |
| 9 | Forests and Wildlife Resources | Geography | 4 | 4 |
| 10 | India: Agriculture | Geography | 5 | 9 |
| 11 | India: Water Resources | Geography | 3 | 3 |
| 12 | India: Minerals and Energy Resources | Geography | 3 | 5 |
| 13 | Manufacturing Industries | Geography | 3 | 5 |
| 14 | Transportation, Communication and Trade | Geography | 3 | 3 |
| 15 | Economic Development | Economics | 3 | 3 |
| 16 | Economic Liberalisation and Globalisation | Economics | 3 | 3 |
| 17 | Economic Problems and Challenges: Poverty and Unemployment | Economics | 4 | 8 |
| 18 | Price Rise and Consumer Awareness | Economics | 3 | 6 |
| 19 | Human Development | Society | 4 | 4 |
| 20 | Social Problems of India and Challenges | Society | 5 | 5 |
| 21 | Social Change | Society | 4 | 4 |
| 22 | Nutritional System in Nature | Short | 2 | 2 |
| 23 | Road Safety and the Driver | Short | 2 | 2 |
| **Sum** | **23 Chapters Verified** | **5 Themes** | **80** | **109** |

## 3. Core Algorithms & Mathematical Contracts

### 3.1 109-Mark General-Option Simulator (`simulateScore`)
Each chapter $c$ has `baseMarks` ($B_c$, summing to 80), `withOptionMarks` ($O_c$, summing to 109), and a user toggle `status` $\in \{\text{MASTER}, \text{SEC\_A\_ONLY}, \text{SKIP}\}$.
- `compulsoryEstimate(c)` = `Math.min(B_c, Math.round(B_c * 0.30))` (guarantees Section A sum = 24).
- **Available Printable Pool:**
  - `MASTER`: contributes `O_c` to total printed pool (both compulsory + descriptive).
  - `SEC_A_ONLY`: contributes `compulsoryEstimate(c)` only (0 descriptive buffer).
  - `SKIP`: contributes `0` (loses `compulsoryEstimate(c)` from the 24-mark Section A ceiling permanently).
- **Achievable Score Cap (out of 80):**
  - `maxSecA = sum(compulsoryEstimate for MASTER + SEC_A_ONLY)` (capped at `24`).
  - `descriptivePool = sum(O_c - compulsoryEstimate for MASTER)`.
  - `maxDescriptive = Math.min(56, descriptivePool)` (Sections B+C+D require 56 marks out of 85 printed descriptive marks; 29-mark buffer).
  - `achievableBoardScore = maxSecA + maxDescriptive` (capped at `80`), plus explicit **Pass Status** (`>= 26/80` theory pass floor).

### 3.2 Marks-at-Risk Priority Engine (`rankChapters`)
For each chapter $c$ in active subject:
$$\text{Priority}(c) = W_{\text{eff}}(c) \times \text{ErrorRate}(c) \times \big(1 - R_{\text{avg}}(c)\big) \times M_{\text{mode}}$$
- **$W_{\text{eff}}(c)$:** In **Topper Mode (90%+)** = `O_c`; in **Pass/Survival Mode (33%+)** = `B_c * (1 + (B_c >= 6 ? 0.25 : 0))`.
- **Bayesian-Smoothed $\text{ErrorRate}(c)$:** $\frac{\text{marksLost}(c) + 0.5}{\text{marksAttempted}(c) + 4.0}$ so one 1-mark slip never outranks a 12-mark conceptual collapse.
- **$1 - R_{\text{avg}}(c)$:** Mean forgetting risk from `ts-fsrs` retrievability across active `CONCEPT`/`FORMULA` mistakes in chapter $c$ (defaults to `0.5` if logged but not yet reviewed).
- **$M_{\text{mode}}$:** `1.25` when chapter has unresolved `CONCEPT`/`FORMULA` errors; `0.60` if only `SILLY`/`TIME` errors exist (routed to Pre-Exam Landmine Checklist instead).

### 3.3 FSRS-6 Retest Scheduler (`ts-fsrs`)
- Library: [`ts-fsrs`](https://github.com/open-spaced-repetition/awesome-fsrs) (FSRS-6 default parameters; outperforms SM-2 in 91.9% of cases per [Anki #3616](https://github.com/ankitects/anki/issues/3616)).
- Mandatory config:
  - `enable_short_term: false` (no 1-min/10-min sub-day nag loops).
  - `enable_fuzz: true` (spreads Sunday tuition-test mistake clusters across days).
  - `maximum_interval: Math.max(1, daysUntil(examDate) - 2)` (never schedules past `2027-02-25`).
  - `request_retention: daysUntil(examDate) <= 30 ? 0.94 : 0.90`.
- **Ghost-Card Protection:** Every `CONCEPT`/`FORMULA` mistake displays its `Chapter`, `Section`, `Test Source` (e.g., `"Gala P3"`), and optional **5-word Micro-Anchor** (e.g., `"Ch8 cos²θ sign flip"`). Rating buttons: `Again` / `Hard` / `Good` / `Easy`.

## 4. Strict Data Contracts (TypeScript)

```ts
export type SubjectId = 'maths-std-12' | 'maths-basic-18' | 'science-11' | 'social-10';
export type PaperSection = 'A' | 'B' | 'C' | 'D';
export type ErrorTag = 'CONCEPT' | 'FORMULA' | 'SILLY' | 'TIME';
export type StrategyMode = 'TOPPER' | 'SURVIVAL';
export type ChapterSimState = 'MASTER' | 'SEC_A_ONLY' | 'SKIP';

export interface BlueprintChapter {
  id: number;                // 1..23
  title: string;             // Official English-medium chapter title
  theme?: string;            // Optional grouping (e.g., Heritage, Geography)
  baseMarks: number;         // Marks without general option (subject sum === 80)
  withOptionMarks: number;   // Marks with general option (subject sum === 109)
  hasCompulsoryMap?: boolean;// True for Social Science Ch. 8-13 map pool (Q54)
}

export interface BlueprintSubject {
  id: SubjectId;
  code: string;              // "12", "18", "11", "10"
  name: string;
  academicYear: '2026-27';
  verificationStatus: 'VERIFIED_2025_26_CARRYOVER';
  sourceUrl: string;
  theoryMax: 80;
  printedMax: 109;
  passingTheoryFloor: 26;
  chapters: BlueprintChapter[];
}

export interface TestSession {
  id: string;                // crypto.randomUUID()
  subjectId: SubjectId;
  preset: 'BOARD_80' | 'SCHOOL_50' | 'TUITION_25' | 'CUSTOM';
  label: string;             // e.g., "Gala Paper 3" or "Sunday Tuition Test"
  dateISO: string;           // YYYY-MM-DD
  scoreObtained: number;
  maxScore: number;
  createdAt: number;
}

export interface MistakeRecord {
  id: string;
  sessionId: string;
  subjectId: SubjectId;
  chapterId: number;
  section: PaperSection;
  marksLost: 1 | 2 | 3 | 4;
  errorTag: ErrorTag;
  microAnchor?: string;      // Optional <= 60 chars (5-word hook against ghost cards)
  fsrsState?: string;        // Serialized ts-fsrs Card JSON (ONLY for CONCEPT/FORMULA)
  resolved: boolean;
  createdAt: number;
}

export interface AppSettings {
  schemaVersion: 1;
  examDateISO: string;       // Default "2027-02-25"
  activeSubjectId: SubjectId;
  strategyMode: StrategyMode;
  testsSinceLastBackup: number;
  lastBackupISO?: string;
}

export interface BackupPayloadV1 {
  schemaVersion: 1;
  exportedAtISO: string;
  settings: AppSettings;
  simulatorStates: Record<SubjectId, Record<number, ChapterSimState>>;
  sessions: TestSession[];
  mistakes: MistakeRecord[];
}
```

## 5. Failure Modes & Mandatory Mitigations

| Failure Mode | Trigger | Required Defense |
| :--- | :--- | :--- |
| **iOS Safari 7-Day ITP Wipe** ([OpenPWA](https://openpwa.net/reference/storage/safari-seven-day-cap/)) | User opens app in Safari tab, skips 7 days during exams/vacation | Show dismissible **"Add to Home Screen"** banner on iOS Safari (non-standalone); call `navigator.storage.persist()`; show amber backup chip every 3 new tests (`Export 15 KB JSON`). |
| **Corrupted / Malformed JSON Import** | User imports edited or truncated backup file | Validate `schemaVersion === 1`, array types, valid `subjectId`, and numeric bounds before touching IndexedDB; reject atomically with explicit error toast. |
| **Ghost Cards in FSRS Queue** | User logs `"Ch 8 - 2M"` with no memory of what they missed | Encourage optional 5-word Micro-Anchor placeholder (`"e.g. Q34 tan²θ identity"`) right on the 4th tap; never block save if left blank. |
| **Blueprint Sum Drift** | Future edit breaks GSEB 80 / 109 invariants | Automated Vitest invariant suite asserts `sum(baseMarks) === 80` and `sum(withOptionMarks) === 109` for every subject JSON on every build. |
| **Post-Exam FSRS Scheduling** | `examDate` is 5 days away, FSRS schedules card in 14 days | Dynamic `maximum_interval = Math.max(1, daysUntilExam - 2)` clamped on every review calculation. |
