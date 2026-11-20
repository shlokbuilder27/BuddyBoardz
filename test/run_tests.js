/**
 * BuddyBoardz Automated Test Suite
 * Evaluation Engineering Test Harness for GSEB Class 10 Paper Intelligence System
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${testName} ${details ? '— ' + details : ''}`);
    failedTests++;
  }
}

function runSection(title, fn) {
  console.log(`\n==================================================`);
  console.log(`🧪 ${title}`);
  console.log(`==================================================`);
  try {
    fn();
  } catch (err) {
    console.error(`  ✗ [CRITICAL ERROR in ${title}]:`, err.message);
    failedTests++;
  }
}

// 1. Extract JavaScript Environment from index.html
const indexPath = path.join(__dirname, '..', 'buddyboardz-10', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

const scriptMatch = indexHtml.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('FATAL: Could not extract <script> tag from index.html');
  process.exit(1);
}

// Create a sandboxed browser-like context for execution
const mockLocalStorage = {};
const sandbox = {
  console: { log: () => {}, error: () => {}, warn: () => {} },
  localStorage: {
    getItem: (key) => mockLocalStorage[key] || null,
    setItem: (key, val) => { mockLocalStorage[key] = String(val); },
    removeItem: (key) => { delete mockLocalStorage[key]; },
    clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }
  },
  document: {
    getElementById: (id) => ({
      textContent: '',
      innerHTML: '',
      value: '',
      style: {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      addEventListener: () => {},
      appendChild: () => {},
      focus: () => {}
    }),
    querySelectorAll: () => [],
    createElement: (tag) => ({
      className: '',
      style: {},
      innerHTML: '',
      textContent: '',
      addEventListener: () => {},
      appendChild: () => {}
    })
  },
  window: {
    speechSynthesis: { speak: () => {}, cancel: () => {} },
    SpeechSynthesisUtterance: function() {}
  },
  setTimeout: () => {},
  Date: Date,
  Math: Math,
  JSON: JSON,
  structuredClone: (obj) => JSON.parse(JSON.stringify(obj))
};

vm.createContext(sandbox);

// Append bridge to export top-level const and let variables to sandbox
const exportBridge = `
;
this.BLUEPRINTS = BLUEPRINTS;
this.state = state;
this.DEFAULT_STATE = DEFAULT_STATE;
this.ONBOARD_QUESTIONS = ONBOARD_QUESTIONS;
this.SYLLABUS_KEYWORDS = SYLLABUS_KEYWORDS;
this.nativeRunSimulation = nativeRunSimulation;
this.nativeComputeFsrs = nativeComputeFsrs;
this.computeFsrsNextSync = computeFsrsNextSync;
this.logMistakeEntry = logMistakeEntry;
this.STORAGE_KEY = STORAGE_KEY;
this.PROFILES_KEY = PROFILES_KEY;
this.INTELLIGENCE_KEY = INTELLIGENCE_KEY;
this.createEmptyIntelligence = createEmptyIntelligence;
this.validateIntelligenceStore = validateIntelligenceStore;
this.saveIntelligence = saveIntelligence;
this.loadIntelligence = loadIntelligence;
this.stablePatternId = stablePatternId;
this.normalizeAnchor = normalizeAnchor;
this.buildLegacyAttempts = buildLegacyAttempts;
this.buildErrorPatterns = buildErrorPatterns;
this.migrateIntelligence = migrateIntelligence;
this.applyAssessmentToStore = applyAssessmentToStore;
this.recordAssessment = recordAssessment;
this.computeWeaknesses = computeWeaknesses;
this.detectWeaknesses = detectWeaknesses;
this.activityKindForTag = activityKindForTag;
this.createCorrectiveActivity = createCorrectiveActivity;
this.issueCorrectiveActivity = issueCorrectiveActivity;
this.scheduleRetest = scheduleRetest;
this.issueRetest = issueRetest;
this.recordCorrectivePractice = recordCorrectivePractice;
this.reopenWeakness = reopenWeakness;
this.applyRetestResultToStore = applyRetestResultToStore;
this.recordRetestResult = recordRetestResult;
this.masteryFor = masteryFor;
this.getChapterMastery = getChapterMastery;
this.MASTERY_PRIOR = MASTERY_PRIOR;
this.cloneJson = cloneJson;
`;

vm.runInContext(scriptMatch[1] + exportBridge, sandbox);

// ==========================================
// TEST SUITE EXECUTION
// ==========================================

// Suite 1: Blueprint Math & Invariants
runSection('Suite 1: GSEB Blueprint Mathematical Invariants', () => {
  const BLUEPRINTS = sandbox.BLUEPRINTS;
  assert(BLUEPRINTS != null, 'BLUEPRINTS data exists in sandbox');

  const subjects = ['maths-std-12', 'maths-basic-18', 'science-11', 'social-10'];

  subjects.forEach(subId => {
    const bp = BLUEPRINTS[subId];
    assert(bp != null, `${subId}: Blueprint definition exists`);

    const sumBase = bp.chapters.reduce((sum, ch) => sum + ch.base, 0);
    assert(sumBase === 80, `${subId}: Base printed marks sum to exactly 80`, `Got ${sumBase}`);

    const sumOpt = bp.chapters.reduce((sum, ch) => sum + ch.opt, 0);
    assert(sumOpt === 109, `${subId}: General-option total marks sum to exactly 109`, `Got ${sumOpt}`);

    const optionCushion = sumOpt - sumBase;
    assert(optionCushion === 29, `${subId}: Option cushion is exactly 29 marks`, `Got ${optionCushion}`);
  });

  // Test Maths Track differences
  const stdAP = BLUEPRINTS['maths-std-12'].chapters.find(c => c.id === 5);
  const basicAP = BLUEPRINTS['maths-basic-18'].chapters.find(c => c.id === 5);
  assert(stdAP.base === 6 && stdAP.opt === 9, 'Maths Standard AP is 6M base / 9M opt');
  assert(basicAP.base === 8 && basicAP.opt === 13, 'Maths Basic AP is 8M base / 13M opt');

  const stdStats = BLUEPRINTS['maths-std-12'].chapters.find(c => c.id === 13);
  const basicStats = BLUEPRINTS['maths-basic-18'].chapters.find(c => c.id === 13);
  assert(stdStats.base === 8 && stdStats.opt === 10, 'Maths Standard Stats is 8M base / 10M opt');
  assert(basicStats.base === 14 && basicStats.opt === 16, 'Maths Basic Stats is 14M base / 16M opt');
});

// Suite 2: Simulation Engine & Pass Floor
runSection('Suite 2: 109-Mark Simulation Engine & Pass Floor Rules', () => {
  const computeSimulation = sandbox.computeSimulation;
  assert(typeof computeSimulation === 'function', 'computeSimulation is an executable function');

  // Master State (all chapters active)
  sandbox.state.simStates['maths-std-12'] = {};
  const masterSim = computeSimulation('maths-std-12');
  assert(masterSim.achievable === 80, 'Full Master state yields 80 / 80 achievable marks', `Got ${masterSim.achievable}`);
  assert(masterSim.maxSecA === 24, 'Section A compulsory ceiling is capped at 24', `Got ${masterSim.maxSecA}`);
  assert(masterSim.passes === true, 'Master state safely passes board floor');

  // Dropping chapters to test pass floor (< 26 marks)
  const skipAll = {};
  sandbox.BLUEPRINTS['maths-std-12'].chapters.forEach(ch => {
    skipAll[ch.id] = 'SKIP';
  });
  sandbox.state.simStates['maths-std-12'] = skipAll;
  const zeroSim = computeSimulation('maths-std-12');
  assert(zeroSim.achievable === 0, 'Skipping all chapters drops score to 0', `Got ${zeroSim.achievable}`);
  assert(zeroSim.passes === false, 'Zero score triggers failure of the 26/80 pass floor');

  // Test Sec A Only state preserves compulsory marks without descriptive
  const secAOnly = {};
  sandbox.BLUEPRINTS['maths-std-12'].chapters.forEach(ch => {
    secAOnly[ch.id] = 'SEC_A_ONLY';
  });
  sandbox.state.simStates['maths-std-12'] = secAOnly;
  const secASim = computeSimulation('maths-std-12');
  assert(secASim.maxSecA === 24, 'Sec A Only extracts full 24 Section A marks');
  assert(secASim.maxDesc === 0, 'Sec A Only provides 0 descriptive marks');
  assert(secASim.achievable === 24, 'Total achievable score is 24/80');
  assert(secASim.passes === false, '24/80 is correctly flagged as below the 26/80 pass floor');
});

// Suite 3: Mutually Exclusive Maths Stream Isolation
runSection('Suite 3: Track Isolation (Standard 12 vs Basic 18)', () => {
  const getActiveSubjects = sandbox.getActiveSubjects;
  assert(typeof getActiveSubjects === 'function', 'getActiveSubjects exists');

  // When enrolled in Standard (12)
  sandbox.state.mathsTrack = 'maths-std-12';
  const stdSubs = getActiveSubjects();
  assert(stdSubs.length === 3, 'Returns exactly 3 subjects when on Standard track', `Got ${stdSubs.length}`);
  const stdIds = stdSubs.map(s => s.id);
  assert(stdIds.includes('maths-std-12'), 'Contains Mathematics Standard (12)');
  assert(!stdIds.includes('maths-basic-18'), 'Excludes Mathematics Basic (18)');
  assert(stdIds.includes('science-11'), 'Contains Science (11)');
  assert(stdIds.includes('social-10'), 'Contains Social Science (10)');

  // When enrolled in Basic (18)
  sandbox.state.mathsTrack = 'maths-basic-18';
  const basicSubs = getActiveSubjects();
  assert(basicSubs.length === 3, 'Returns exactly 3 subjects when on Basic track', `Got ${basicSubs.length}`);
  const basicIds = basicSubs.map(s => s.id);
  assert(!basicIds.includes('maths-std-12'), 'Excludes Mathematics Standard (12)');
  assert(basicIds.includes('maths-basic-18'), 'Contains Mathematics Basic (18)');

  // Dynamic Onboarding Question 3 test
  const ONBOARD_QUESTIONS = sandbox.ONBOARD_QUESTIONS;
  const qMaths = ONBOARD_QUESTIONS.find(q => q.id === 'maths_track');
  assert(qMaths != null, 'Question 2 is maths_track');
  assert(qMaths.options.length === 2, 'Maths track offers strictly 2 mutually exclusive streams');

  const qSubject = ONBOARD_QUESTIONS.find(q => q.id === 'subject');
  const dynamicOptsBasic = qSubject.getOptions({ maths_track: 'maths-basic-18' });
  assert(dynamicOptsBasic.some(o => o.val === 'maths-basic-18') && !dynamicOptsBasic.some(o => o.val === 'maths-std-12'),
    'Q3 dynamically yields Maths Basic when Basic track chosen');

  const dynamicOptsStd = qSubject.getOptions({ maths_track: 'maths-std-12' });
  assert(dynamicOptsStd.some(o => o.val === 'maths-std-12') && !dynamicOptsStd.some(o => o.val === 'maths-basic-18'),
    'Q3 dynamically yields Maths Standard when Standard track chosen');
});

// Suite 4: Real Functional Mistake Logging & Routing
runSection('Suite 4: Functional Mistake Logging & Domain Pipeline', () => {
  const logMistakeEntry = sandbox.logMistakeEntry;
  assert(typeof logMistakeEntry === 'function', 'logMistakeEntry exists as an executable domain function');

  // Reset state to clean baseline
  sandbox.state.mistakes = [];
  sandbox.state.xp = 0;

  // Log a FORMULA mistake via real application function
  const entryFormula = logMistakeEntry({
    subjectId: 'maths-std-12',
    chapterId: 8,
    section: 'C',
    marksLost: 3,
    errorTag: 'FORMULA',
    paperLabel: 'Vraj Paper 1',
    microAnchor: 'sec²θ - tan²θ sign slip'
  });

  assert(sandbox.state.mistakes.length === 1, 'state.mistakes count incremented to 1');
  assert(sandbox.state.xp === 15, 'state.xp rewarded by exactly +15 XP (Got ' + sandbox.state.xp + ')');
  assert(entryFormula.dueAt !== null && typeof entryFormula.dueAt === 'number',
    'FORMULA mistake routed to FSRS with active dueAt timestamp');

  // Log a SILLY mistake via real application function
  const entrySilly = logMistakeEntry({
    subjectId: 'maths-std-12',
    chapterId: 4,
    section: 'B',
    marksLost: 2,
    errorTag: 'SILLY',
    paperLabel: 'Navneet Paper 1'
  });

  assert(sandbox.state.mistakes.length === 2, 'state.mistakes count incremented to 2');
  assert(sandbox.state.xp === 30, 'state.xp accumulated to exactly +30 XP');
  assert(entrySilly.dueAt === null, 'SILLY mistake assigned dueAt = null (routes strictly to Landmine Checklist)');

  // Verify persistence into localStorage
  const savedRaw = sandbox.localStorage.getItem(sandbox.STORAGE_KEY);
  assert(savedRaw != null, 'Application state saved to localStorage');
  const savedState = JSON.parse(savedRaw);
  assert(savedState.mistakes.length === 2, 'localStorage accurately holds both logged mistakes');
  assert(savedState.xp === 30, 'localStorage accurately holds updated 30 XP');
});

// Suite 5: Real FSRS Engine Execution & Exam Cap
runSection('Suite 5: FSRS Spaced Memory Math & Board Exam Cap', () => {
  const computeFsrsNextSync = sandbox.computeFsrsNextSync;
  assert(typeof computeFsrsNextSync === 'function', 'computeFsrsNextSync exists as an executable domain function');

  const examDate = '2027-02-25';

  // 1. AGAIN rating resets interval to 1 day and stability to 1.0
  const resAgain = computeFsrsNextSync(2.5, 'AGAIN', examDate);
  assert(resAgain.intervalDays === 1, 'AGAIN rating always resets interval to 1 day', `Got ${resAgain.intervalDays}`);
  assert(resAgain.stability === 1.0, 'AGAIN resets stability to 1.0');

  // 2. HARD rating scales moderately
  const resHard = computeFsrsNextSync(1.5, 'HARD', examDate);
  assert(resHard.intervalDays >= 1, 'HARD interval is >= 1 day', `Got ${resHard.intervalDays}`);

  // 3. GOOD rating provides solid spacing
  const resGood = computeFsrsNextSync(1.5, 'GOOD', examDate);
  assert(resGood.intervalDays >= resHard.intervalDays, 'GOOD interval >= HARD interval',
    `GOOD: ${resGood.intervalDays}d, HARD: ${resHard.intervalDays}d`);

  // 4. EASY rating provides maximum spacing
  const resEasy = computeFsrsNextSync(1.5, 'EASY', examDate);
  assert(resEasy.intervalDays >= resGood.intervalDays, 'EASY interval >= GOOD interval',
    `EASY: ${resEasy.intervalDays}d, GOOD: ${resGood.intervalDays}d`);

  // 5. Hard Exam Cap Boundary Condition (exam in 4 days -> max interval is 2 days)
  const nearExamDate = new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];
  const cappedRes = computeFsrsNextSync(20.0, 'EASY', nearExamDate);
  assert(cappedRes.intervalDays <= 2, `Interval capped to <= 2d before exam (Got ${cappedRes.intervalDays}d)`);
});

// Suite 6: Multi-Student Desk Isolation & Storage
runSection('Suite 6: Multi-Student Desk Isolation & Storage Security', () => {
  const registerOrUpdateProfile = sandbox.registerOrUpdateProfile;
  const getStoredProfiles = sandbox.getStoredProfiles;

  assert(typeof registerOrUpdateProfile === 'function', 'registerOrUpdateProfile exists');
  assert(typeof getStoredProfiles === 'function', 'getStoredProfiles exists');

  // Register Student A
  registerOrUpdateProfile({
    studentName: 'Aarav',
    mathsTrack: 'maths-std-12',
    activeSubject: 'maths-std-12',
    streak: 3,
    xp: 75,
    mistakes: [{ id: 'm1', chapterId: 3, marksLost: 2, errorTag: 'SILLY' }]
  });

  // Register Student B
  registerOrUpdateProfile({
    studentName: 'Dhruv',
    mathsTrack: 'maths-basic-18',
    activeSubject: 'maths-basic-18',
    streak: 5,
    xp: 120,
    mistakes: []
  });

  const profiles = getStoredProfiles();
  assert(profiles.length === 2, 'Stored profiles list contains exactly 2 student desks');

  const aarav = profiles.find(p => p.studentName === 'Aarav');
  const dhruv = profiles.find(p => p.studentName === 'Dhruv');

  assert(aarav != null && aarav.mathsTrack === 'maths-std-12', 'Aarav profile is preserved with Standard track');
  assert(aarav.mistakes.length === 1, 'Aarav has 1 mistake preserved');
  assert(dhruv != null && dhruv.mathsTrack === 'maths-basic-18', 'Dhruv profile is preserved with Basic track');
  assert(dhruv.mistakes.length === 0, 'Dhruv desk is isolated with 0 mistakes');
});

// Suite 7: Paper Sources & Kumar Removal Verification
runSection('Suite 7: Paper Sources & Kumar Removal Verification', () => {
  const indexStr = fs.readFileSync(indexPath, 'utf8');

  assert(!/kumar/i.test(indexStr), 'Zero references to Kumar anywhere in index.html');
  assert(indexStr.includes('Vraj Model Question Papers'), 'Vraj Model Question Papers present in index.html');
  assert(indexStr.includes('Navneet Practice Question Papers'), 'Navneet Practice Question Papers present in index.html');
  assert(indexStr.includes('Gala Model Question Papers'), 'Gala Model Question Papers present in index.html');

  const previewPath = path.join(__dirname, '..', 'buddyboardz-10', 'buddyboardz-10-tauri-rust', 'dist_index_preview.html');
  const previewStr = fs.readFileSync(previewPath, 'utf8');
  assert(!/kumar/i.test(previewStr), 'Zero references to Kumar anywhere in dist_index_preview.html');
});

// Suite 8: Systems IPC Bridge & Vision Autopsy Engine
runSection('Suite 8: Systems IPC Bridge & Vision Autopsy Engine', () => {
  const SYLLABUS_KEYWORDS = sandbox.SYLLABUS_KEYWORDS;
  assert(SYLLABUS_KEYWORDS != null, 'SYLLABUS_KEYWORDS database is initialized');

  ['maths-std-12', 'maths-basic-18', 'science-11', 'social-10'].forEach(subId => {
    const rules = SYLLABUS_KEYWORDS[subId];
    assert(Array.isArray(rules) && rules.length > 0, `${subId}: Has vision keyword diagnostic rules`);
    rules.forEach(rule => {
      const chExists = sandbox.BLUEPRINTS[subId].chapters.some(c => c.id === rule.id);
      assert(chExists, `${subId} rule for Ch.${rule.id} matches real blueprint chapter`);
      assert(['CONCEPT', 'FORMULA', 'SILLY', 'TIME'].includes(rule.tag), `${subId} Ch.${rule.id} has valid taxonomy tag (${rule.tag})`);
    });
  });

  // Verify nativeRunSimulation and nativeComputeFsrs contract
  const nativeRunSim = sandbox.nativeRunSimulation;
  assert(typeof nativeRunSim === 'function', 'nativeRunSimulation IPC bridge exists');

  const nativeFsrs = sandbox.nativeComputeFsrs;
  assert(typeof nativeFsrs === 'function', 'nativeComputeFsrs IPC bridge exists');
});

runSection('Suite 9: Learning Intelligence — Data Model & Validation', () => {
  const createEmptyIntelligence = sandbox.createEmptyIntelligence;
  const validateIntelligenceStore = sandbox.validateIntelligenceStore;
  assert(typeof createEmptyIntelligence === 'function', 'createEmptyIntelligence exists as executable function');
  assert(typeof validateIntelligenceStore === 'function', 'validateIntelligenceStore exists as executable function');

  const empty = createEmptyIntelligence();
  assert(empty.version === 2, 'Empty intelligence store uses schema version 2', `Got ${empty.version}`);
  ['attempts', 'errorPatterns', 'activities', 'retests', 'chapterMastery'].forEach(field => {
    assert(Array.isArray(empty[field]) && empty[field].length === 0, `Empty store has empty ${field} array`);
  });

  const valid = validateIntelligenceStore({ ...empty, unexpected: 'drop-me' });
  assert(valid.version === 2, 'Validator preserves valid schema version');
  assert(valid.unexpected === undefined, 'Validator drops unknown fields');

  let threwOnVersion = false;
  try { validateIntelligenceStore({ ...empty, version: 1 }); } catch (err) { threwOnVersion = true; }
  assert(threwOnVersion, 'Validator rejects unsupported schema version');

  let threwOnField = false;
  try { validateIntelligenceStore({ ...empty, attempts: 'not-an-array' }); } catch (err) { threwOnField = true; }
  assert(threwOnField, 'Validator rejects malformed array field');

  const normalizeAnchor = sandbox.normalizeAnchor;
  assert(normalizeAnchor('  Sec²θ - tan²θ SIGN slip  ') === 'sec tan sign slip',
    'Anchor normalization lowercases, strips symbols and collapses whitespace',
    `Got "${normalizeAnchor('  Sec²θ - tan²θ SIGN slip  ')}"`);
  assert(normalizeAnchor('   ') === '', 'Blank anchor normalizes to empty string');

  const stablePatternId = sandbox.stablePatternId;
  const idA = stablePatternId('maths-std-12', 8, 'FORMULA');
  assert(idA === stablePatternId('maths-std-12', 8, 'FORMULA'), 'Pattern id is deterministic for same inputs');
  assert(idA !== stablePatternId('maths-std-12', 9, 'FORMULA'), 'Pattern id changes with chapter');
  assert(/^ep-[0-9a-f]{8}$/.test(idA), 'Pattern id has stable ep-<hash> shape', `Got ${idA}`);
});

runSection('Suite 10: Learning Intelligence — Migration & Backward Compatibility', () => {
  const key = sandbox.INTELLIGENCE_KEY;
  delete mockLocalStorage[key];

  sandbox.state.studentName = 'Phase2 Student';
  sandbox.state.examDateISO = '2027-02-25';
  sandbox.state.mistakes = [
    { id: 'm-1000-1', subjectId: 'maths-std-12', chapterId: 8, section: 'C', marksLost: 3, errorTag: 'FORMULA', microAnchor: 'Ch8 trig identity sign flip' },
    { id: 'm-2000-2', subjectId: 'maths-std-12', chapterId: 8, section: 'C', marksLost: 3, errorTag: 'FORMULA', microAnchor: 'Ch8 trig identity sign flip' },
    { id: 'm-3000-3', subjectId: 'maths-std-12', chapterId: 4, section: 'B', marksLost: 2, errorTag: 'SILLY', microAnchor: '' },
    { id: 'm-4000-4', subjectId: 'science-11', chapterId: 11, section: 'C', marksLost: 2, errorTag: 'CONCEPT', microAnchor: 'Ohm law units' }
  ];

  const migrated = sandbox.migrateIntelligence();
  assert(migrated.attempts.length === 2, 'Legacy mistakes grouped into 2 subject attempts', `Got ${migrated.attempts.length}`);
  assert(migrated.attempts.every(a => a.scoreObtained === null), 'Legacy attempts carry no invented score');
  assert(migrated.attempts.every(a => a.examDateISO === '2027-02-25'), 'Legacy attempts inherit exam date from v2 state');
  assert(migrated.attempts.every(a => a.studentId === 'Phase2 Student'), 'Legacy attempts carry active student id');

  const mathsAttempt = migrated.attempts.find(a => a.subjectId === 'maths-std-12');
  const scienceAttempt = migrated.attempts.find(a => a.subjectId === 'science-11');
  assert(mathsAttempt && mathsAttempt.mistakes.length === 3, 'Maths attempt holds 3 mapped mistakes');
  assert(scienceAttempt && scienceAttempt.mistakes.length === 1, 'Science attempt holds 1 mapped mistake');
  assert(mathsAttempt.mistakes[0].microAnchor === 'Ch8 trig identity sign flip', 'Micro-anchor preserved verbatim on attempt mistakes');

  assert(migrated.errorPatterns.length === 3, 'Derived 3 recurring error patterns', `Got ${migrated.errorPatterns.length}`);
  const trigPattern = migrated.errorPatterns.find(p => p.chapterId === 8 && p.errorTag === 'FORMULA');
  assert(trigPattern && trigPattern.frequency === 2, 'Repeated trig formula error counted twice');
  assert(trigPattern && trigPattern.patternId === sandbox.stablePatternId('maths-std-12', 8, 'FORMULA'), 'Pattern id derived deterministically');
  assert(trigPattern && trigPattern.description === 'ch8 trig identity sign flip', 'Pattern description normalized from anchor');
  const sillyPattern = migrated.errorPatterns.find(p => p.errorTag === 'SILLY');
  assert(sillyPattern && sillyPattern.description === 'SILLY error in chapter 4', 'Missing anchor yields honest default description');
  assert(sillyPattern && sillyPattern.trend === 'STABLE', 'New pattern starts with STABLE trend');

  const persisted = mockLocalStorage[key];
  assert(persisted != null, 'Intelligence store persisted to localStorage');
  assert(JSON.parse(persisted).version === 2, 'Persisted store has schema version 2');

  const v2Raw = mockLocalStorage[sandbox.STORAGE_KEY];
  assert(v2Raw != null && Array.isArray(JSON.parse(v2Raw).mistakes), 'v2 active-desk key remains intact after migration');

  const secondRun = sandbox.migrateIntelligence();
  assert(secondRun.attempts.length === 2 && secondRun.errorPatterns.length === 3, 'Migration is idempotent on second run');

  sandbox.saveIntelligence(migrated);
  const loaded = sandbox.loadIntelligence();
  assert(loaded.attempts.length === 2, 'Intelligence store round-trips through save/load');

  mockLocalStorage[key] = '{corrupted';
  let threwOnCorrupt = false;
  try { sandbox.loadIntelligence(); } catch (err) { threwOnCorrupt = true; }
  assert(threwOnCorrupt, 'Corrupted intelligence JSON is rejected explicitly');

  let threwOnBadStore = false;
  try { sandbox.saveIntelligence({ version: 99, attempts: [] }); } catch (err) { threwOnBadStore = true; }
  assert(threwOnBadStore, 'Invalid store cannot be saved');

  mockLocalStorage[key] = JSON.stringify(migrated);
});

function buildPhase3Attempt(attemptId, createdAt, mistakes) {
  return {
    attemptId: attemptId,
    studentId: 'Shlok',
    subjectId: 'maths-std-12',
    examDateISO: '2027-02-25',
    scoreObtained: 54,
    createdAt: createdAt,
    mistakes: mistakes || [
      { subjectId: 'maths-std-12', chapterId: 8, section: 'C', marksLost: 3, errorTag: 'FORMULA', microAnchor: 'Ch8 trig identity sign flip' },
      { subjectId: 'maths-std-12', chapterId: 8, section: 'C', marksLost: 3, errorTag: 'FORMULA', microAnchor: 'Ch8 trig identity sign flip' }
    ]
  };
}

function buildPhase3Activity() {
  return {
    activityId: 'ac-ep-test-1763000000000',
    studentId: 'Shlok',
    subjectId: 'maths-std-12',
    chapterId: 8,
    conceptIds: ['maths-std-12-c8'],
    kind: 'FORMULA_REVIEW',
    status: 'PENDING',
    expectedOutcome: 'Rewrite trig identities on paper without a sign flip',
    createdAt: 1763000000000,
    linkedPatternIds: [sandbox.stablePatternId('maths-std-12', 8, 'FORMULA')]
  };
}

runSection('Suite 11: Feedback Loop — Assessment Recording & Weakness Detection', () => {
  const key = sandbox.INTELLIGENCE_KEY;
  delete mockLocalStorage[key];
  sandbox.state.studentName = 'Shlok';
  sandbox.state.examDateISO = '2027-02-25';

  const attempt = buildPhase3Attempt('at-p3-1', 1763000000000);
  const applied = sandbox.applyAssessmentToStore(sandbox.createEmptyIntelligence(), attempt);
  assert(applied.store.attempts.length === 1, 'Assessment stored as one attempt');
  assert(applied.store.errorPatterns.length === 1, 'Assessment derived one error pattern');
  assert(applied.store.errorPatterns[0].frequency === 2, 'Repeated mistake frequency counted as 2');
  assert(applied.store.errorPatterns[0].latestAttemptId === 'at-p3-1', 'Pattern links back to source attempt');

  const mastery = sandbox.getChapterMastery(applied.store, 'maths-std-12', 8);
  assert(mastery.estimate === 0.1, 'Two assessment misses lower mastery from 0.3 to 0.1', `Got ${mastery.estimate}`);
  assert(mastery.evidence.length === 2 && mastery.evidence.every(e => e.kind === 'ASSESSMENT_MISS'), 'Both misses recorded as evidence');

  const replay = sandbox.applyAssessmentToStore(applied.store, attempt);
  assert(replay.store.attempts.length === 1 && replay.store.errorPatterns[0].frequency === 2, 'Replaying same attempt is idempotent');

  const weaknesses = sandbox.computeWeaknesses(applied.store);
  assert(weaknesses.length === 1, 'One recurring weakness detected');
  assert(weaknesses[0].severity === 'CRITICAL', 'Low mastery yields CRITICAL severity', `Got ${weaknesses[0].severity}`);
  assert(weaknesses[0].marksAtRisk === 4.5, 'Marks at risk derived from chapter base 5 and mastery 0.1', `Got ${weaknesses[0].marksAtRisk}`);
  assert(weaknesses[0].pattern.errorTag === 'FORMULA', 'Weakness retains error taxonomy tag');

  const single = sandbox.applyAssessmentToStore(sandbox.createEmptyIntelligence(),
    buildPhase3Attempt('at-p3-2', 1763000000100, [attempt.mistakes[0]])).store;
  assert(sandbox.computeWeaknesses(single).length === 0, 'Single occurrence is not yet a recurring weakness');

  mockLocalStorage[key] = JSON.stringify(applied.store);
  assert(sandbox.detectWeaknesses().length === 1, 'detectWeaknesses wrapper reads persisted store');
});

runSection('Suite 12: Feedback Loop — Corrective Activities & Retest Scheduling', () => {
  assert(sandbox.activityKindForTag('CONCEPT') === 'CONCEPT_REWORK', 'CONCEPT routes to concept rework');
  assert(sandbox.activityKindForTag('FORMULA') === 'FORMULA_REVIEW', 'FORMULA routes to formula review');
  assert(sandbox.activityKindForTag('SILLY') === 'DRILL_SET', 'SILLY routes to drill set');
  assert(sandbox.activityKindForTag('TIME') === 'TIME_MANAGEMENT', 'TIME routes to time management');

  const attempt = buildPhase3Attempt('at-p3-3', 1763000000000);
  const store = sandbox.applyAssessmentToStore(sandbox.createEmptyIntelligence(), attempt).store;
  const weakness = sandbox.computeWeaknesses(store)[0];
  const activity = sandbox.createCorrectiveActivity(weakness, 'Shlok');
  assert(activity.kind === 'FORMULA_REVIEW', 'Generated activity kind follows weakness tag');
  assert(activity.conceptIds.length === 1 && activity.conceptIds[0] === 'maths-std-12-c8', 'Activity linked to failing concept');
  assert(activity.status === 'PENDING', 'New corrective activity starts PENDING');
  assert(activity.linkedPatternIds.indexOf(weakness.pattern.patternId) !== -1, 'Activity linked to its error pattern');

  mockLocalStorage[sandbox.INTELLIGENCE_KEY] = JSON.stringify(store);
  const issued = sandbox.issueCorrectiveActivity(weakness);
  const issuedAgain = sandbox.issueCorrectiveActivity(weakness);
  assert(issued.activityId === issuedAgain.activityId, 'Issue twice returns same activity (no duplicate)');
  assert(sandbox.loadIntelligence().activities.length === 1, 'Only one activity persisted');

  const far = sandbox.scheduleRetest(activity, '2027-02-25', '2026-11-20T00:00:00Z', 'at-p3-3');
  assert(far.intervalDays === undefined, 'Retest contract exposes scheduledFor, not raw interval');
  assert(far.scheduledFor === '2026-11-27', 'Far exam schedules a 7-day retest', `Got ${far.scheduledFor}`);
  const near = sandbox.scheduleRetest(activity, '2027-02-25', '2027-02-21T00:00:00Z', 'at-p3-3');
  assert(near.scheduledFor <= '2027-02-23', 'Near exam caps retest at exam minus 2 days', `Got ${near.scheduledFor}`);
  assert(near.lastAttemptId === 'at-p3-3', 'Retest keeps the source attempt id');

  const storedWithActivity = sandbox.loadIntelligence();
  const beforePractice = sandbox.getChapterMastery(storedWithActivity, 'maths-std-12', 8).estimate;
  sandbox.recordCorrectivePractice(activity.activityId);
  const afterPractice = sandbox.masteryFor('maths-std-12', 8);
  assert(sandbox.loadIntelligence().activities[0].status === 'PRACTICE_DONE', 'Practice marks activity PRACTICE_DONE');
  assert(afterPractice.estimate === beforePractice, 'Practice alone grants zero mastery credit', `${beforePractice} -> ${afterPractice.estimate}`);
});

runSection('Suite 13: Feedback Loop — Retest Verification & Weakness Reopening', () => {
  const key = sandbox.INTELLIGENCE_KEY;
  const activity = buildPhase3Activity();
  const patternId = sandbox.stablePatternId('maths-std-12', 8, 'FORMULA');
  const makeStore = (retestId) => ({
    version: 2,
    attempts: [],
    errorPatterns: [{ patternId: patternId, subjectId: 'maths-std-12', conceptId: 'maths-std-12-c8', chapterId: 8, errorTag: 'FORMULA', description: 'ch8 trig identity sign flip', frequency: 2, firstSeen: 1763000000000, lastSeen: 1763000000000, trend: 'STABLE', latestAttemptId: 'at-p3-1' }],
    activities: [sandbox.cloneJson(activity)],
    retests: [{ retestId: retestId, activityId: activity.activityId, studentId: 'Shlok', subjectId: 'maths-std-12', chapterId: 8, conceptIds: ['maths-std-12-c8'], scheduledFor: '2026-11-27', result: 'PENDING', marksLostAfter: null, lastAttemptId: 'at-p3-1', createdAt: 1763000000000, fsrsNextDueIso: '' }],
    chapterMastery: [{ subjectId: 'maths-std-12', chapterId: 8, estimate: 0.1, evidence: [
      { attemptId: 'at-p3-1', kind: 'ASSESSMENT_MISS', weight: -0.1, createdAt: 1763000000000 },
      { attemptId: 'at-p3-2', kind: 'ASSESSMENT_MISS', weight: -0.1, createdAt: 1763000000100 }
    ], lastVerified: 0 }]
  });

  mockLocalStorage[key] = JSON.stringify(makeStore('rt-pass-1'));
  sandbox.recordRetestResult('rt-pass-1', 'PASS', 0);
  const passed = sandbox.loadIntelligence();
  assert(passed.activities[0].status === 'VERIFIED', 'Passing verification marks activity VERIFIED');
  assert(passed.retests[0].result === 'PASS', 'Retest result recorded as PASS');
  assert(passed.retests[0].fsrsNextDueIso !== '', 'PASS feeds the existing FSRS scheduler');
  assert(passed.chapterMastery[0].estimate === 0.35, 'Passing evidence raises mastery by 0.25', `Got ${passed.chapterMastery[0].estimate}`);
  assert(passed.chapterMastery[0].evidence.some(e => e.kind === 'RETRY_PASS'), 'Mastery claim has supporting evidence');

  mockLocalStorage[key] = JSON.stringify(makeStore('rt-fail-1'));
  sandbox.recordRetestResult('rt-fail-1', 'FAIL', 3);
  const failed = sandbox.loadIntelligence();
  assert(failed.activities[0].status === 'REOPENED', 'Failing verification reopens the weakness');
  assert(failed.retests[0].result === 'FAIL', 'Original retest recorded as FAIL');
  assert(failed.retests.length === 2 && failed.retests[1].result === 'PENDING', 'A fresh retest is scheduled after failure');
  assert(failed.retests[1].retestId === 'rt-fail-1-retry-1', 'Reopened retest has deterministic id');
  assert(failed.chapterMastery[0].estimate === 0, 'Failure lowers mastery, clamped at zero', `Got ${failed.chapterMastery[0].estimate}`);
  assert(failed.chapterMastery[0].evidence.some(e => e.kind === 'RETRY_FAIL'), 'Reopen has supporting evidence');

  mockLocalStorage[key] = JSON.stringify(makeStore('rt-pass-1'));
  let threwOnUnknown = false;
  try { sandbox.recordRetestResult('rt-does-not-exist', 'PASS', 0); } catch (err) { threwOnUnknown = true; }
  assert(threwOnUnknown, 'Unknown retest id is rejected explicitly');

  mockLocalStorage[key] = JSON.stringify(sandbox.createEmptyIntelligence());
});

// ==========================================
// TEST SUMMARY REPORT
// ==========================================
console.log(`\n==================================================`);
console.log(`📊 EVALUATION REPORT: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log(`==================================================`);

if (failedTests > 0) {
  console.error(`❌ TEST HARNESS FAILED with ${failedTests} error(s). Review invariant violations above.`);
  process.exit(1);
} else {
  console.log(`✅ ALL INVARIANTS VERIFIED! Codebase obeys all GSEB & pedagogical rules.`);
  process.exit(0);
}
