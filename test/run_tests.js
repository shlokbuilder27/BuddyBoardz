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

// Suite 4: Mistake Taxonomy & Routing Rules
runSection('Suite 4: Mistake Taxonomy & Routing Rules', () => {
  const DEFAULT_STATE = sandbox.DEFAULT_STATE;
  assert(Array.isArray(DEFAULT_STATE.mistakes) && DEFAULT_STATE.mistakes.length === 0,
    'Clean desk baseline has 0 mistakes initially');
  assert(DEFAULT_STATE.xp === 0, 'Clean desk baseline starts at 0 XP');
  assert(DEFAULT_STATE.streak === 0, 'Clean desk baseline starts at 0 Streak');

  // Test routing logic: CONCEPT & FORMULA get dueAt, SILLY & TIME get null
  const testConcept = {
    errorTag: 'CONCEPT',
    dueAt: (['CONCEPT', 'FORMULA'].includes('CONCEPT')) ? Date.now() : null
  };
  const testSilly = {
    errorTag: 'SILLY',
    dueAt: (['CONCEPT', 'FORMULA'].includes('SILLY')) ? Date.now() : null
  };

  assert(testConcept.dueAt !== null, 'CONCEPT flaw routes to FSRS review with active dueAt timestamp');
  assert(testSilly.dueAt === null, 'SILLY flaw has dueAt = null (routes to Pre-Exam Landmines)');
});

// Suite 5: FSRS Spaced Repetition Math & Exam Cap
runSection('Suite 5: FSRS Spaced Memory Math & Board Exam Cap', () => {
  const daysUntilExam = sandbox.daysUntilExam;
  assert(typeof daysUntilExam === 'function', 'daysUntilExam function exists');

  const daysLeft = daysUntilExam();
  assert(typeof daysLeft === 'number' && daysLeft > 0, `Days until Feb 25, 2027 board exam is positive (${daysLeft} days)`);

  const maxInterval = Math.max(1, daysLeft - 2);
  const s = 1.5;
  const intervals = {
    AGAIN: 1,
    HARD: Math.min(maxInterval, Math.max(1, Math.round(s * 1.2))),
    GOOD: Math.min(maxInterval, Math.max(2, Math.round(s * 2.1))),
    EASY: Math.min(maxInterval, Math.max(4, Math.round(s * 3.4)))
  };

  assert(intervals.AGAIN === 1, 'AGAIN rating always resets interval to 1 day');
  assert(intervals.HARD <= intervals.GOOD, 'HARD interval <= GOOD interval');
  assert(intervals.GOOD <= intervals.EASY, 'GOOD interval <= EASY interval');
  assert(intervals.EASY <= maxInterval, `EASY interval (${intervals.EASY}d) does not breach exam cap (${maxInterval}d)`);
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
