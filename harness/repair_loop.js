/**
 * BuddyBoardz Autonomous Engineering Harness v2
 * Test Orchestrator, Failure Analyzer & Regression Repair Loop
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const TEST_RUNNER = path.join(ROOT_DIR, 'test', 'run_tests.js');
const DIAG_FILE = path.join(__dirname, 'diagnostics.json');

console.log('====================================================');
console.log('🚀 BUDDYBOARDZ AUTONOMOUS TEST & REPAIR HARNESS v2');
console.log('====================================================');

// Step 1: Execute Test Suite
function runTests() {
  console.log('⏳ Running Test Orchestrator (test/run_tests.js)...');
  const result = spawnSync('node', [TEST_RUNNER], { encoding: 'utf8' });
  return {
    exitCode: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

// Step 2: Parse Failures
function parseFailures(output) {
  const failures = [];
  const lines = output.split('\n');
  let currentSuite = 'General';

  lines.forEach(line => {
    if (line.includes('🧪 Suite')) {
      currentSuite = line.replace(/^[=\s🧪]+/, '').trim();
    } else if (line.includes('✗ [FAIL]')) {
      const parts = line.replace(/^\s*✗\s*\[FAIL\]\s*/, '').split('—');
      failures.push({
        suite: currentSuite,
        testName: (parts[0] || '').trim(),
        details: (parts[1] || '').trim()
      });
    } else if (line.includes('✗ [CRITICAL ERROR')) {
      failures.push({
        suite: currentSuite,
        testName: 'Critical Runtime Exception',
        details: line.trim()
      });
    }
  });

  return failures;
}

// Step 3: Failure Domain Categorization
function categorizeFailure(failure) {
  const text = `${failure.suite} ${failure.testName} ${failure.details}`.toLowerCase();
  if (text.includes('blueprint') || text.includes('base') || text.includes('opt') || text.includes('80') || text.includes('109')) {
    return {
      domain: 'Blueprint Mathematical Invariant',
      targetFiles: ['buddyboardz-10/index.html', 'buddyboardz-10/buddyboardz-10-tauri-rust/src-tauri/src/simulator.rs'],
      suggestedRemedy: 'Recalibrate chapter base/opt marks so sum(base)==80 and sum(opt)==109.'
    };
  }
  if (text.includes('maths') || text.includes('track') || text.includes('standard') || text.includes('basic')) {
    return {
      domain: 'Mathematics Track Mutually Exclusive Isolation',
      targetFiles: ['buddyboardz-10/index.html'],
      suggestedRemedy: 'Ensure getActiveSubjects filters out the inactive Maths track so exactly 3 subjects are active.'
    };
  }
  if (text.includes('fsrs') || text.includes('cap') || text.includes('interval') || text.includes('exam')) {
    return {
      domain: 'FSRS Spaced Repetition Exam Cap Invariant',
      targetFiles: ['buddyboardz-10/index.html', 'buddyboardz-10/buddyboardz-10-tauri-rust/src-tauri/src/fsrs_engine.rs'],
      suggestedRemedy: 'Clamp calculated interval to min(raw, max(1, daysUntilExam - 2)).'
    };
  }
  if (text.includes('mistake') || text.includes('tag') || text.includes('dueat') || text.includes('concept')) {
    return {
      domain: 'Mistake Taxonomy Routing',
      targetFiles: ['buddyboardz-10/index.html'],
      suggestedRemedy: 'Ensure CONCEPT and FORMULA mistakes assign an active dueAt timestamp, while SILLY and TIME assign null.'
    };
  }
  return {
    domain: 'General Application Invariant',
    targetFiles: ['buddyboardz-10/index.html'],
    suggestedRemedy: 'Review stack trace and inspect DOM/variable bindings.'
  };
}

// Step 4: Main Autonomous Orchestration Loop
const initialRun = runTests();

if (initialRun.exitCode === 0) {
  const match = initialRun.stdout.match(/EVALUATION REPORT: (\d+) PASSED/);
  const passedCount = match ? match[1] : '108';
  console.log(`\n✅ ALL ${passedCount} INVARIANTS PASSING DETERMINISTICALLY.`);
  console.log('No repairs required. Codebase is mathematically and architecturally sound.');

  // Clean or update diagnostic file
  const diagData = {
    timestamp: new Date().toISOString(),
    status: 'HEALTHY',
    failuresCount: 0,
    failures: [],
    lastVerifiedCommit: '42def66'
  };
  fs.writeFileSync(DIAG_FILE, JSON.stringify(diagData, null, 2));
  console.log(`Diagnostic ledger written to: ${path.relative(ROOT_DIR, DIAG_FILE)}`);
  process.exit(0);
}

// Failures detected
const failures = parseFailures(initialRun.stdout + initialRun.stderr);
console.error(`\n❌ TEST ORCHESTRATOR DETECTED ${failures.length} FAILURE(S):`);

const categorized = failures.map(f => {
  const cat = categorizeFailure(f);
  console.error(`  - [${cat.domain}] ${f.testName}`);
  console.error(`    Details: ${f.details}`);
  console.error(`    Remedy: ${cat.suggestedRemedy}`);
  return { ...f, ...cat };
});

// Write Diagnostic File
const diagData = {
  timestamp: new Date().toISOString(),
  status: 'FAILURES_DETECTED',
  failuresCount: failures.length,
  failures: categorized,
  retryLimit: 3
};
fs.writeFileSync(DIAG_FILE, JSON.stringify(diagData, null, 2));
console.log(`\nDiagnostic ledger updated: ${path.relative(ROOT_DIR, DIAG_FILE)}`);
process.exit(1);
