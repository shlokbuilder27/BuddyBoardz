/**
 * BuddyBoardz End-to-End Visual & Offline Integration Harness
 * Executes 5 Core Student Workflows + Network Zero-Leak Audit in Real Headless Chrome
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3005';

let browser;
let page;
const networkRequests = [];
const externalRequests = [];
const testResults = [];

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    testResults.push({ name: message, passed: false });
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✓ [PASS] ${message}`);
    testResults.push({ name: message, passed: true });
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2ESuite() {
  console.log('====================================================');
  console.log('🧪 BUDDYBOARDZ E2E BROWSER & OFFLINE VERIFICATION HARNESS');
  console.log('====================================================\n');

  browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Network Leak Monitor
  page.on('request', req => {
    const url = req.url();
    networkRequests.push(url);
    if (!url.startsWith('http://localhost:3005') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      externalRequests.push(url);
    }
  });

  page.on('console', msg => {
    console.log(`    [Browser Console] ${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error(`    [Browser Page Error] ${err.message}`);
  });

  try {
    // ----------------------------------------------------
    // WORKFLOW 1: Student Onboarding and Maths Track Selection
    // ----------------------------------------------------
    console.log('📋 Scenario 1: Clean Launch, Student Desk Creation & Maths Standard Track');
    
    // Clear localStorage to simulate fresh student machine
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      window.location.reload();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Wait for Splash screen to dismiss and Auth Modal to activate
    await page.waitForSelector('#auth-modal.active', { visible: true, timeout: 6000 });
    const authModalActive = await page.evaluate(() => {
      const modal = document.getElementById('auth-modal');
      return modal && modal.classList.contains('active');
    });
    assert(authModalActive, 'Auth modal activates on uninitialized client');

    // Fill Student Name "Aarav" and select "maths-std-12"
    await page.evaluate(() => {
      document.getElementById('auth-name-input').value = 'Aarav';
      document.getElementById('auth-track-select').value = 'maths-std-12';
    });
    await sleep(100);

    // Click "Create Desk & Begin 7-Q Calibration"
    await page.evaluate(() => document.getElementById('auth-start-btn').click());
    await page.waitForSelector('#onboarding-modal.active');

    // Answer 7-Q Calibration
    for (let q = 1; q <= 7; q++) {
      const isModalActive = await page.evaluate(() => document.getElementById('onboarding-modal').classList.contains('active'));
      if (!isModalActive) break;

      await page.evaluate((step) => {
        if (step === 1) {
          const input = document.getElementById('onboard-name-input');
          if (input) input.value = 'Aarav';
          document.getElementById('onboard-next-btn').click();
        } else {
          const firstOpt = document.querySelector('#onboard-options-list .onboard-opt-btn');
          if (firstOpt) firstOpt.click();
        }
      }, q);
      await sleep(250);
    }
    await sleep(400);

    // Verify Aarav's Desk is active
    const deskState = await page.evaluate(() => {
      return {
        isLoggedIn: window.state.isLoggedIn,
        name: window.state.studentName,
        subject: window.state.activeSubject,
        mistakesCount: window.state.mistakes.length,
        xp: window.state.xp
      };
    });

    assert(deskState.isLoggedIn === true, 'Desk is officially marked as logged in');
    assert(deskState.name === 'Aarav', 'Active student profile name is "Aarav"');
    assert(deskState.subject === 'maths-std-12', 'Active syllabus track is Mathematics Standard (Code 12)');
    assert(deskState.mistakesCount === 0, 'Clean baseline: Zero initial mistakes');

    // ----------------------------------------------------
    // WORKFLOW 2: Clear Paper Image Upload & Local Offline OCR
    // ----------------------------------------------------
    console.log('\n📋 Scenario 2: Clear Paper Question OCR & Chapter Diagnosis');

    // Switch to AI Autopsy / Logger view
    await page.evaluate(() => window.switchView('logger'));
    await sleep(200);

    // Synthesize a canvas representing a paper answer sheet with clear quadratic equation text
    const ocrDiagnosis = await page.evaluate(async () => {
      const canvas = document.getElementById('ai-scan-canvas');
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // White paper with printed question & red pen correction
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 200);
      ctx.fillStyle = '#111111';
      ctx.font = '22px sans-serif';
      ctx.fillText('Find the roots of quadratic equation 2x^2 - 5x + 3 = 0', 30, 70);
      ctx.fillText('using quadratic formula. Show all working steps.', 30, 110);
      
      // Teacher red pen line
      ctx.strokeStyle = '#D32F2F';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(350, 60);
      ctx.lineTo(520, 75);
      ctx.stroke();

      // Trigger dynamic scan using the canvas
      await window.triggerDynamicAutopsyScan(canvas, 0.05);

      return {
        diagDisplay: document.getElementById('ai-diag-result').style.display,
        chapterText: document.getElementById('ai-diag-chapter').textContent,
        secText: document.getElementById('ai-diag-sec').textContent,
        tagText: document.getElementById('ai-diag-tag').textContent,
        recognizedText: document.getElementById('ai-recognized-text') ? document.getElementById('ai-recognized-text').value : '',
        unidentified: window.currentDiag ? window.currentDiag.unidentified : true
      };
    });

    console.log('    [Scenario 2 Debug Output]:', ocrDiagnosis);

    assert(ocrDiagnosis.diagDisplay === 'block', 'Diagnosis card rendered visible');
    assert(ocrDiagnosis.recognizedText.toLowerCase().includes('quadratic'), 'Offline Tesseract accurately read "quadratic" from paper canvas');
    assert(ocrDiagnosis.chapterText.includes('Ch 4') || ocrDiagnosis.chapterText.includes('Quadratic'), 'Correctly mapped to Chapter 4 (Quadratic Equations)');
    assert(ocrDiagnosis.tagText === 'CONCEPT' || ocrDiagnosis.tagText === 'FORMULA' || ocrDiagnosis.tagText === 'SILLY', 'Assigned error tag');

    // ----------------------------------------------------
    // WORKFLOW 3: Uncertain OCR & Manual Chapter Selection
    // ----------------------------------------------------
    console.log('\n📋 Scenario 3: Uncertain OCR / Low-Confidence Handwriting & Chapter Selection Chips');

    const uncertainDiagnosis = await page.evaluate(async () => {
      const canvas = document.getElementById('ai-scan-canvas');
      const ctx = canvas.getContext('2d');
      
      // Messy illegible handwriting scribbles with no syllabus keywords
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 200);
      ctx.fillStyle = '#444444';
      ctx.font = '16px cursive';
      ctx.fillText('???? illegible scribble xyz 12345', 50, 90);

      // Trigger dynamic scan
      await window.triggerDynamicAutopsyScan(canvas, 0.02);

      const chipsCount = document.querySelectorAll('.ocr-chapter-pick-btn').length;
      const chapterTitle = document.getElementById('ai-diag-chapter').textContent;
      const flawHtml = document.getElementById('ai-diag-flaw-text').innerHTML;

      return {
        chapterTitle,
        chipsCount,
        hasLowConfWarning: flawHtml.includes('Low Confidence Scan')
      };
    });

    assert(uncertainDiagnosis.chapterTitle.includes('Unidentified Question'), 'Honest warning: Flags unidentified question instead of hallucinating fake chapter');
    assert(uncertainDiagnosis.hasLowConfWarning === true, 'Presents explicit low confidence guidance');
    assert(uncertainDiagnosis.chipsCount === 14, 'Renders all 14 Maths Standard syllabus chapter selection chips');

    // Simulate student tapping "Ch.7 Coordinate Geometry"
    const pickedResult = await page.evaluate(() => {
      const ch7Btn = document.querySelector('.ocr-chapter-pick-btn[data-chid="7"]');
      if (ch7Btn) ch7Btn.click();
      return {
        chapterText: document.getElementById('ai-diag-chapter').textContent,
        secText: document.getElementById('ai-diag-sec').textContent,
        tagText: document.getElementById('ai-diag-tag').textContent,
        currentDiagCh: window.getCurrentDiag().chapterId
      };
    });

    assert(pickedResult.currentDiagCh === 7, 'Selected chapter accurately locked to Chapter 7');
    assert(pickedResult.chapterText.includes('Ch 7'), 'Diagnosis UI updated to "Ch 7"');

    // ----------------------------------------------------
    // WORKFLOW 4: Mistake Logging & Local Persistence
    // ----------------------------------------------------
    console.log('\n📋 Scenario 4: Mistake Logging, FSRS Assignment & Local Persistence');

    const preLogCount = await page.evaluate(() => window.state.mistakes.length);
    assert(preLogCount === 0, 'Zero mistakes prior to logging');

    // Click "1-Tap Auto-Log & Queue to Tonight"
    await page.click('#ai-auto-log-btn');
    await sleep(300);

    const postLogState = await page.evaluate(() => {
      const rawStored = localStorage.getItem('buddyboardz_profiles_v2');
      const parsedProfiles = JSON.parse(rawStored || '[]');
      const aaravProfile = parsedProfiles.find(p => p.studentName === 'Aarav');

      return {
        inMemoryMistakes: window.state.mistakes.length,
        xp: window.state.xp,
        latestMistake: window.state.mistakes[0],
        storedMistakesCount: aaravProfile ? aaravProfile.mistakes.length : 0
      };
    });

    assert(postLogState.inMemoryMistakes === 1, 'In-memory state updated to 1 mistake');
    assert(postLogState.xp === 15, 'XP incremented by +15 for logging autopsy');
    assert(postLogState.latestMistake.chapterId === 7, 'Logged mistake preserves Chapter 7');
    assert(postLogState.latestMistake.errorTag === 'CONCEPT', 'Logged mistake categorized as CONCEPT');
    assert(postLogState.latestMistake.dueAt !== null, 'CONCEPT mistake assigned immediate review schedule');
    assert(postLogState.storedMistakesCount === 1, 'Mistake persisted directly to localStorage["buddyboardz_profiles_v2"]');

    // ----------------------------------------------------
    // WORKFLOW 5: Multi-Desk Student Isolation
    // ----------------------------------------------------
    console.log('\n📋 Scenario 5: Multi-Desk Isolation (Aarav - Std vs Diya - Basic)');

    // Open Auth Modal to create Diya's Desk
    await page.evaluate(() => window.openAuthModal());
    await sleep(200);

    // Create Second Student: "Diya" with Mathematics Basic ("maths-basic-18")
    const beforeDiya = await page.evaluate(() => {
      const input = document.getElementById('auth-name-input');
      const select = document.getElementById('auth-track-select');
      input.value = 'Diya';
      select.value = 'maths-basic-18';
      const nameVal = input.value;
      document.getElementById('auth-start-btn').click();
      return {
        nameVal,
        stateName: window.state.studentName,
        onboardActive: document.getElementById('onboarding-modal').classList.contains('active')
      };
    });
    console.log('    [Before Diya Calibration]:', beforeDiya);
    await page.waitForSelector('#onboarding-modal.active');

    // Fast-complete calibration for Diya
    for (let q = 1; q <= 7; q++) {
      const isModalActive = await page.evaluate(() => document.getElementById('onboarding-modal').classList.contains('active'));
      if (!isModalActive) break;

      await page.evaluate((step) => {
        if (step === 1) {
          const input = document.getElementById('onboard-name-input');
          if (input) input.value = 'Diya';
          document.getElementById('onboard-next-btn').click();
        } else if (step === 2) {
          // Select Mathematics Basic for Diya
          const basicBtn = Array.from(document.querySelectorAll('#onboard-options-list .onboard-opt-btn')).find(b => b.textContent.includes('Basic'));
          if (basicBtn) basicBtn.click();
          else document.querySelector('#onboard-options-list .onboard-opt-btn').click();
        } else {
          const firstOpt = document.querySelector('#onboard-options-list .onboard-opt-btn');
          if (firstOpt) firstOpt.click();
        }
      }, q);
      await sleep(250);
    }
    await sleep(300);

    // Verify Diya's clean isolated desk
    const diyaState = await page.evaluate(() => {
      return {
        name: window.state.studentName,
        subject: window.state.activeSubject,
        mistakesCount: window.state.mistakes.length,
        xp: window.state.xp
      };
    });

    console.log('    [Scenario 5 Diya State]:', diyaState);

    assert(diyaState.name === 'Diya', 'Active student is "Diya"');
    assert(diyaState.subject === 'maths-basic-18', 'Diya is enrolled in Mathematics Basic (Code 18)');
    assert(diyaState.mistakesCount === 0, 'Diya has ZERO mistakes (No leakage from Aarav!)');
    assert(diyaState.xp === 0, 'Diya has 0 XP baseline');

    // Switch back to Aarav's Desk
    await page.evaluate(() => window.switchDeskTo('Aarav'));
    await sleep(200);

    const aaravRestored = await page.evaluate(() => {
      return {
        name: window.state.studentName,
        subject: window.state.activeSubject,
        mistakesCount: window.state.mistakes.length,
        xp: window.state.xp,
        mistakeChapter: window.state.mistakes[0].chapterId
      };
    });

    assert(aaravRestored.name === 'Aarav', 'Restored Aarav\'s Desk');
    assert(aaravRestored.subject === 'maths-std-12', 'Aarav\'s Mathematics Standard track maintained');
    assert(aaravRestored.mistakesCount === 1, 'Aarav\'s mistake record intact');
    assert(aaravRestored.mistakeChapter === 7, 'Aarav\'s Chapter 7 mistake preserved');
    assert(aaravRestored.xp === 15, 'Aarav\'s XP preserved (15 XP)');

    // ----------------------------------------------------
    // WORKFLOW 6: Closed Feedback Loop (Pillar 01 -> Corrective Practice -> Pillar 05 Retest Evidence)
    // ----------------------------------------------------
    console.log('\n📋 Scenario 6: Closed Feedback Loop & Demonstrated Retest Evidence');

    // 1. Switch to Profile view to check Academic Diagnostic Profile
    await page.evaluate(() => window.switchView('profile'));
    await sleep(250);

    const profileInitial = await page.evaluate(() => {
      const card = document.getElementById('academic-diagnostic-profile-card');
      const diagSummary = document.getElementById('academic-diag-summary');
      return {
        cardVisible: card !== null,
        hasDiagSummary: diagSummary && diagSummary.children.length > 0
      };
    });

    assert(profileInitial.cardVisible, 'Academic Diagnostic Profile card rendered in Profile view');
    assert(profileInitial.hasDiagSummary, '7-Question Diagnostic Calibration summary visible');

    // 2. Log a second paper mistake in Chapter 7 with CONCEPT flaw to trigger recurring weakness detection
    await page.evaluate(() => {
      window.logMistakeEntry({
        subjectId: 'maths-std-12',
        chapterId: 7,
        section: 'C',
        marksLost: 3,
        errorTag: 'CONCEPT',
        paperLabel: 'Navneet Paper 1',
        microAnchor: 'Section formula m1x2 ratio inversion'
      });
      window.renderAcademicProfile();
    });
    await sleep(200);

    const weaknessState = await page.evaluate(() => {
      const rawIntel = localStorage.getItem('buddyboardz_intelligence_v2');
      const clusters = document.querySelectorAll('#academic-weakness-clusters .card');
      const firstClusterText = clusters.length > 0 ? clusters[0].textContent : '';
      const hasChallengeBtn = document.querySelector('.take-challenge-btn') !== null;
      return {
        rawIntel,
        clustersCount: clusters.length,
        hasCh7: firstClusterText.includes('Ch.7') || firstClusterText.includes('Coordinate'),
        hasConceptTag: firstClusterText.includes('CONCEPT'),
        hasPendingBadge: firstClusterText.includes('PENDING CHALLENGE'),
        hasChallengeBtn
      };
    });

    console.log('    [Scenario 6 Weakness State]:', weaknessState);

    assert(weaknessState.clustersCount >= 1, 'Bayesian engine automatically detects recurring weakness cluster');
    assert(weaknessState.hasCh7, 'Weakness correctly mapped to Chapter 7');
    assert(weaknessState.hasConceptTag, 'Weakness retains CONCEPT flaw tag');
    assert(weaknessState.hasPendingBadge, 'Initial status marked PENDING CHALLENGE');
    assert(weaknessState.hasChallengeBtn, 'Presents "Take Targeted Paper Challenge" action');

    // 3. Open Targeted Paper Challenge
    await page.evaluate(() => {
      const btn = document.querySelector('.take-challenge-btn');
      if (btn) btn.click();
    });
    await sleep(200);

    const challengeModalState = await page.evaluate(() => {
      const modal = document.getElementById('challenge-modal');
      const qText = document.getElementById('challenge-question-text').textContent;
      const hText = document.getElementById('challenge-hint-text').textContent;
      return {
        isActive: modal && modal.classList.contains('active'),
        hasQuestion: qText.length > 10,
        hasHint: hText.includes('Invariant')
      };
    });

    assert(challengeModalState.isActive, 'Targeted Paper Challenge modal opened');
    assert(challengeModalState.hasQuestion, 'Presents concrete paper problem prompt');
    assert(challengeModalState.hasHint, 'Provides explicit invariant landmine check');

    // 4. Student marks paper practice done
    await page.click('#challenge-mark-done-btn');
    await sleep(250);

    const postPracticeState = await page.evaluate(() => {
      const clusters = document.querySelectorAll('#academic-weakness-clusters .card');
      const firstText = clusters.length > 0 ? clusters[0].textContent : '';
      return {
        hasPracticeDoneBadge: firstText.includes('PRACTICE DONE')
      };
    });

    assert(postPracticeState.hasPracticeDoneBadge, 'Status updated to PRACTICE DONE · AWAITING RETEST');

    // 5. Navigate to Retest Arena to inspect Demonstrated Retest Queue
    await page.evaluate(() => window.switchView('retest'));
    await sleep(250);

    const retestQueueState = await page.evaluate(() => {
      const items = document.querySelectorAll('#retest-verifications-list .card');
      const firstItemText = items.length > 0 ? items[0].textContent : '';
      return {
        itemCount: items.length,
        hasCh7Proof: firstItemText.includes('Ch.7') && firstItemText.includes('CONCEPT'),
        hasVerifyBtn: document.querySelector('.retest-item-pass-btn') !== null
      };
    });

    assert(retestQueueState.itemCount >= 1, 'Demonstrated Retest Queue displays scheduled verification');
    assert(retestQueueState.hasCh7Proof, 'Retest proof linked to Ch.7 CONCEPT flaw');

    // 6. Record retest verification: Student wrote next paper and demonstrated 0 marks lost!
    await page.click('.retest-item-pass-btn');
    await sleep(300);

    // 7. Verify resolution badge in Profile view
    await page.evaluate(() => window.switchView('profile'));
    await sleep(250);

    const verifiedResult = await page.evaluate(() => {
      const clusterHtml = document.getElementById('academic-weakness-clusters').innerHTML;
      const rawIntel = localStorage.getItem('buddyboardz_intelligence_v2');
      const intel = JSON.parse(rawIntel || '{}');
      const ch7Mastery = (intel.chapterMastery || []).find(m => m.chapterId === 7);
      const activity = (intel.activities || [])[0];

      return {
        hasVerifiedBadge: clusterHtml.includes('VERIFIED RESOLVED (+Evidence)'),
        activityStatus: activity ? activity.status : '',
        retestEvidenceRecorded: ch7Mastery && ch7Mastery.evidence.some(e => e.kind === 'RETRY_PASS'),
        masteryBoosted: ch7Mastery ? ch7Mastery.estimate > 0.3 : false,
        xpTotal: window.state.xp
      };
    });

    assert(verifiedResult.hasVerifiedBadge, 'Displays official "✓ VERIFIED RESOLVED (+Evidence)" badge');
    assert(verifiedResult.activityStatus === 'VERIFIED', 'Activity marked VERIFIED in Intelligence Store');
    assert(verifiedResult.retestEvidenceRecorded, 'Mastery backed by RETRY_PASS empirical evidence');
    assert(verifiedResult.masteryBoosted, 'Chapter 7 mastery estimate boosted (+25% gain)');

    // ----------------------------------------------------
    // NETWORK LEAK VERIFICATION
    // ----------------------------------------------------
    console.log('\n📋 Scenario 7: Network Request Audit (Zero-Leak / Offline Verification)');
    console.log(`  Total Requests Executed: ${networkRequests.length}`);
    console.log(`  External Requests: ${externalRequests.length}`);

    if (externalRequests.length > 0) {
      console.error('  ⚠️ Leaked External Requests:', externalRequests);
    }
    assert(externalRequests.length === 0, 'PROVEN: Zero external network requests made across entire session! 100% Offline Integrity.');

    console.log('\n====================================================');
    console.log(`✅ ALL ${testResults.filter(t => t.passed).length} / ${testResults.length} E2E & OFFLINE ASSERTIONS PASSED!`);
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ E2E TEST RUN ABORTED DUE TO FAILURE:');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runE2ESuite();
