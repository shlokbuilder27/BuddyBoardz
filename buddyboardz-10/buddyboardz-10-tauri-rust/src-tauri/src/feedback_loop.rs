use chrono::{Duration, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

pub const MASTERY_PRIOR: f64 = 0.3;
pub const WEAKNESS_FREQUENCY_THRESHOLD: u32 = 2;

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EvidenceKind {
    AssessmentMiss,
    RetryPass,
    RetryFail,
    PracticeDone,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Evidence {
    pub attempt_id: String,
    pub kind: EvidenceKind,
    pub weight: f64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChapterMastery {
    pub subject_id: String,
    pub chapter_id: u16,
    pub estimate: f64,
    pub evidence: Vec<Evidence>,
    pub last_verified: i64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LegacyMistake {
    pub subject_id: String,
    pub chapter_id: u16,
    pub section: String,
    pub marks_lost: u8,
    pub error_tag: String,
    pub micro_anchor: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Attempt {
    pub attempt_id: String,
    pub student_id: String,
    pub subject_id: String,
    pub exam_date_iso: String,
    pub score_obtained: Option<f64>,
    pub created_at: i64,
    pub mistakes: Vec<LegacyMistake>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorPattern {
    pub pattern_id: String,
    pub subject_id: String,
    pub concept_id: String,
    pub chapter_id: u16,
    pub error_tag: String,
    pub description: String,
    pub frequency: u32,
    pub first_seen: i64,
    pub last_seen: i64,
    pub trend: String,
    pub latest_attempt_id: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CorrectiveActivity {
    pub activity_id: String,
    pub student_id: String,
    pub subject_id: String,
    pub chapter_id: u16,
    pub concept_ids: Vec<String>,
    pub kind: String,
    pub status: String,
    pub expected_outcome: String,
    pub created_at: i64,
    pub linked_pattern_ids: Vec<String>,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ReviewResult {
    Pending,
    Pass,
    Fail,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Retest {
    pub retest_id: String,
    pub activity_id: String,
    pub student_id: String,
    pub subject_id: String,
    pub chapter_id: u16,
    pub concept_ids: Vec<String>,
    pub scheduled_for: String,
    pub result: ReviewResult,
    pub marks_lost_after: Option<f64>,
    pub last_attempt_id: String,
    pub created_at: i64,
    pub fsrs_next_due_iso: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct IntelligenceStore {
    pub version: u32,
    pub attempts: Vec<Attempt>,
    pub error_patterns: Vec<ErrorPattern>,
    pub activities: Vec<CorrectiveActivity>,
    pub retests: Vec<Retest>,
    pub chapter_mastery: Vec<ChapterMastery>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChapterMarks {
    pub subject_id: String,
    pub chapter_id: u16,
    pub base_marks: u16,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Weakness {
    pub pattern: ErrorPattern,
    pub chapter_id: u16,
    pub estimate: f64,
    pub marks_at_risk: f64,
    pub severity: String,
}

fn stable_pattern_id(subject_id: &str, chapter_id: u16, error_tag: &str) -> String {
    let source = format!("{}|c{}|{}", subject_id, chapter_id, error_tag);
    let mut hash: u32 = 2166136261;
    for byte in source.bytes() {
        hash ^= byte as u32;
        hash = hash.wrapping_mul(16777619);
    }
    format!("ep-{:08x}", hash)
}

fn normalize_anchor(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c.is_whitespace() { c } else { ' ' })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn round_mastery(value: f64) -> f64 {
    ((value.max(0.0)).min(1.0) * 1000.0).round() / 1000.0
}

pub fn get_chapter_mastery(store: &IntelligenceStore, subject_id: &str, chapter_id: u16) -> ChapterMastery {
    store
        .chapter_mastery
        .iter()
        .find(|m| m.subject_id == subject_id && m.chapter_id == chapter_id)
        .cloned()
        .unwrap_or(ChapterMastery {
            subject_id: subject_id.to_string(),
            chapter_id,
            estimate: MASTERY_PRIOR,
            evidence: vec![],
            last_verified: 0,
        })
}

fn put_chapter_mastery(store: &mut IntelligenceStore, mastery: ChapterMastery) {
    if let Some(existing) = store
        .chapter_mastery
        .iter_mut()
        .find(|m| m.subject_id == mastery.subject_id && m.chapter_id == mastery.chapter_id)
    {
        *existing = mastery;
    } else {
        store.chapter_mastery.push(mastery);
    }
}

fn add_mastery_evidence(store: &mut IntelligenceStore, subject_id: &str, chapter_id: u16, evidence: Evidence) {
    let mut mastery = get_chapter_mastery(store, subject_id, chapter_id);
    let total = MASTERY_PRIOR + mastery.evidence.iter().map(|e| e.weight).sum::<f64>() + evidence.weight;
    mastery.estimate = round_mastery(total);
    if matches!(evidence.kind, EvidenceKind::RetryPass | EvidenceKind::RetryFail) {
        mastery.last_verified = evidence.created_at;
    }
    mastery.evidence.push(evidence);
    put_chapter_mastery(store, mastery);
}

pub fn apply_assessment(store: &mut IntelligenceStore, attempt: &Attempt) -> Vec<ErrorPattern> {
    if store.attempts.iter().any(|a| a.attempt_id == attempt.attempt_id) {
        return vec![];
    }
    store.attempts.push(attempt.clone());

    let mut derived: Vec<ErrorPattern> = Vec::new();
    for mistake in &attempt.mistakes {
        let id = stable_pattern_id(&mistake.subject_id, mistake.chapter_id, &mistake.error_tag);
        if let Some(pattern) = derived.iter_mut().find(|p| p.pattern_id == id) {
            pattern.frequency += 1;
            pattern.first_seen = pattern.first_seen.min(attempt.created_at);
            pattern.last_seen = pattern.last_seen.max(attempt.created_at);
            pattern.latest_attempt_id = attempt.attempt_id.clone();
        } else {
            let anchor = normalize_anchor(&mistake.micro_anchor);
            let description = if anchor.is_empty() {
                format!("{} error in chapter {}", mistake.error_tag, mistake.chapter_id)
            } else {
                anchor
            };
            derived.push(ErrorPattern {
                pattern_id: id,
                subject_id: mistake.subject_id.clone(),
                concept_id: format!("{}-c{}", mistake.subject_id, mistake.chapter_id),
                chapter_id: mistake.chapter_id,
                error_tag: mistake.error_tag.clone(),
                description,
                frequency: 1,
                first_seen: attempt.created_at,
                last_seen: attempt.created_at,
                trend: "STABLE".to_string(),
                latest_attempt_id: attempt.attempt_id.clone(),
            });
        }
    }

    for pattern in &derived {
        if let Some(existing) = store.error_patterns.iter_mut().find(|p| p.pattern_id == pattern.pattern_id) {
            existing.frequency += pattern.frequency;
            existing.first_seen = existing.first_seen.min(pattern.first_seen);
            existing.last_seen = existing.last_seen.max(pattern.last_seen);
            existing.latest_attempt_id = pattern.latest_attempt_id.clone();
        } else {
            store.error_patterns.push(pattern.clone());
        }
    }

    for mistake in &attempt.mistakes {
        add_mastery_evidence(
            store,
            &mistake.subject_id,
            mistake.chapter_id,
            Evidence {
                attempt_id: attempt.attempt_id.clone(),
                kind: EvidenceKind::AssessmentMiss,
                weight: -0.1,
                created_at: attempt.created_at,
            },
        );
    }
    derived
}

pub fn detect_weaknesses(store: &IntelligenceStore, marks: &[ChapterMarks]) -> Vec<Weakness> {
    let mut result: Vec<Weakness> = store
        .error_patterns
        .iter()
        .filter(|pattern| pattern.frequency >= WEAKNESS_FREQUENCY_THRESHOLD)
        .map(|pattern| {
            let mastery = get_chapter_mastery(store, &pattern.subject_id, pattern.chapter_id);
            let base = marks
                .iter()
                .find(|m| m.subject_id == pattern.subject_id && m.chapter_id == pattern.chapter_id)
                .map(|m| m.base_marks as f64)
                .unwrap_or(0.0);
            let severity = if mastery.estimate < 0.3 {
                "CRITICAL"
            } else if mastery.estimate < 0.6 {
                "HIGH"
            } else {
                "WATCH"
            };
            Weakness {
                pattern: pattern.clone(),
                chapter_id: pattern.chapter_id,
                estimate: mastery.estimate,
                marks_at_risk: ((base * (1.0 - mastery.estimate)) * 10.0).round() / 10.0,
                severity: severity.to_string(),
            }
        })
        .collect();
    result.sort_by(|a, b| b.marks_at_risk.partial_cmp(&a.marks_at_risk).unwrap_or(std::cmp::Ordering::Equal));
    result
}

pub fn activity_kind_for_tag(error_tag: &str) -> &'static str {
    match error_tag {
        "CONCEPT" => "CONCEPT_REWORK",
        "FORMULA" => "FORMULA_REVIEW",
        "TIME" => "TIME_MANAGEMENT",
        _ => "DRILL_SET",
    }
}

pub fn create_corrective_activity(weakness: &Weakness, student_id: &str) -> CorrectiveActivity {
    let pattern = &weakness.pattern;
    CorrectiveActivity {
        activity_id: format!("ac-{}-{}", pattern.pattern_id, pattern.last_seen),
        student_id: student_id.to_string(),
        subject_id: pattern.subject_id.clone(),
        chapter_id: pattern.chapter_id,
        concept_ids: vec![pattern.concept_id.clone()],
        kind: activity_kind_for_tag(&pattern.error_tag).to_string(),
        status: "PENDING".to_string(),
        expected_outcome: format!(
            "Attempt one fresh {} problem in chapter {} without repeating: {}",
            pattern.error_tag.to_lowercase(),
            pattern.chapter_id,
            pattern.description
        ),
        created_at: pattern.last_seen,
        linked_pattern_ids: vec![pattern.pattern_id.clone()],
    }
}

pub fn schedule_retest(
    activity: &CorrectiveActivity,
    exam_date_iso: &str,
    today: NaiveDate,
    last_attempt_id: &str,
) -> Result<Retest, String> {
    let exam_date = NaiveDate::parse_from_str(exam_date_iso, "%Y-%m-%d")
        .map_err(|_| "Invalid exam_date_iso (expected YYYY-MM-DD)".to_string())?;
    let days_until_exam = (exam_date - today).num_days().max(1);
    let interval_days = ((days_until_exam - 2).max(1)).min(7);
    Ok(Retest {
        retest_id: format!("rt-{}", activity.activity_id),
        activity_id: activity.activity_id.clone(),
        student_id: activity.student_id.clone(),
        subject_id: activity.subject_id.clone(),
        chapter_id: activity.chapter_id,
        concept_ids: activity.concept_ids.clone(),
        scheduled_for: (today + Duration::days(interval_days)).format("%Y-%m-%d").to_string(),
        result: ReviewResult::Pending,
        marks_lost_after: None,
        last_attempt_id: last_attempt_id.to_string(),
        created_at: Utc::now().timestamp_millis(),
        fsrs_next_due_iso: None,
    })
}

pub fn record_corrective_practice(store: &mut IntelligenceStore, activity_id: &str) -> Result<(), String> {
    let (subject_id, chapter_id) = {
        let activity = store
            .activities
            .iter_mut()
            .find(|a| a.activity_id == activity_id)
            .ok_or_else(|| format!("Unknown activity id: {}", activity_id))?;
        activity.status = "PRACTICE_DONE".to_string();
        (activity.subject_id.clone(), activity.chapter_id)
    };
    add_mastery_evidence(
        store,
        &subject_id,
        chapter_id,
        Evidence {
            attempt_id: activity_id.to_string(),
            kind: EvidenceKind::PracticeDone,
            weight: 0.0,
            created_at: Utc::now().timestamp_millis(),
        },
    );
    Ok(())
}

pub fn apply_retest_result(
    store: &mut IntelligenceStore,
    retest_id: &str,
    passed: bool,
    exam_date_iso: &str,
) -> Result<(), String> {
    let today = Utc::now().date_naive();
    let (activity_id, subject_id, chapter_id, last_attempt_id, created_at) = {
        let retest = store
            .retests
            .iter_mut()
            .find(|r| r.retest_id == retest_id)
            .ok_or_else(|| format!("Unknown retest id: {}", retest_id))?;
        retest.result = if passed { ReviewResult::Pass } else { ReviewResult::Fail };
        let rating = if passed { super::fsrs_engine::ReviewRating::Good } else { super::fsrs_engine::ReviewRating::Again };
        let next = super::fsrs_engine::schedule_review(1.2, rating, exam_date_iso)?;
        retest.fsrs_next_due_iso = Some(next.due_iso);
        (
            retest.activity_id.clone(),
            retest.subject_id.clone(),
            retest.chapter_id,
            retest.last_attempt_id.clone(),
            retest.created_at,
        )
    };

    add_mastery_evidence(
        store,
        &subject_id,
        chapter_id,
        Evidence {
            attempt_id: retest_id.to_string(),
            kind: if passed { EvidenceKind::RetryPass } else { EvidenceKind::RetryFail },
            weight: if passed { 0.25 } else { -0.25 },
            created_at,
        },
    );

    if passed {
        if let Some(activity) = store.activities.iter_mut().find(|a| a.activity_id == activity_id) {
            activity.status = "VERIFIED".to_string();
        }
        return Ok(());
    }

    if let Some(activity) = store.activities.iter_mut().find(|a| a.activity_id == activity_id) {
        activity.status = "REOPENED".to_string();
    }
    let retries = store
        .retests
        .iter()
        .filter(|r| r.activity_id == activity_id && r.result == ReviewResult::Fail && r.retest_id != retest_id)
        .count();
    if let Some(activity) = store.activities.iter().find(|a| a.activity_id == activity_id).cloned() {
        let mut replacement = schedule_retest(&activity, exam_date_iso, today, &last_attempt_id)?;
        replacement.retest_id = format!("{}-retry-{}", retest_id, retries + 1);
        store.retests.push(replacement);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_attempt(id: &str) -> Attempt {
        let mistake = LegacyMistake {
            subject_id: "maths-std-12".to_string(),
            chapter_id: 8,
            section: "C".to_string(),
            marks_lost: 3,
            error_tag: "FORMULA".to_string(),
            micro_anchor: "Ch8 trig identity sign flip".to_string(),
        };
        Attempt {
            attempt_id: id.to_string(),
            student_id: "Shlok".to_string(),
            subject_id: "maths-std-12".to_string(),
            exam_date_iso: "2027-02-25".to_string(),
            score_obtained: Some(54.0),
            created_at: 1763000000000,
            mistakes: vec![mistake.clone(), mistake],
        }
    }

    fn test_marks() -> Vec<ChapterMarks> {
        vec![ChapterMarks {
            subject_id: "maths-std-12".to_string(),
            chapter_id: 8,
            base_marks: 5,
        }]
    }

    fn test_store_with_verification() -> IntelligenceStore {
        let pattern_id = stable_pattern_id("maths-std-12", 8, "FORMULA");
        let mut store = IntelligenceStore::default();
        store.version = 2;
        store.error_patterns.push(ErrorPattern {
            pattern_id: pattern_id.clone(),
            subject_id: "maths-std-12".to_string(),
            concept_id: "maths-std-12-c8".to_string(),
            chapter_id: 8,
            error_tag: "FORMULA".to_string(),
            description: "ch8 trig identity sign flip".to_string(),
            frequency: 2,
            first_seen: 1763000000000,
            last_seen: 1763000000000,
            trend: "STABLE".to_string(),
            latest_attempt_id: "at-p3-1".to_string(),
        });
        store.activities.push(CorrectiveActivity {
            activity_id: format!("ac-{}-1763000000000", pattern_id),
            student_id: "Shlok".to_string(),
            subject_id: "maths-std-12".to_string(),
            chapter_id: 8,
            concept_ids: vec!["maths-std-12-c8".to_string()],
            kind: "FORMULA_REVIEW".to_string(),
            status: "PENDING".to_string(),
            expected_outcome: "Rewrite identities on paper".to_string(),
            created_at: 1763000000000,
            linked_pattern_ids: vec![pattern_id],
        });
        store.retests.push(Retest {
            retest_id: "rt-pass-1".to_string(),
            activity_id: format!("ac-{}-1763000000000", stable_pattern_id("maths-std-12", 8, "FORMULA")),
            student_id: "Shlok".to_string(),
            subject_id: "maths-std-12".to_string(),
            chapter_id: 8,
            concept_ids: vec!["maths-std-12-c8".to_string()],
            scheduled_for: "2026-11-27".to_string(),
            result: ReviewResult::Pending,
            marks_lost_after: None,
            last_attempt_id: "at-p3-1".to_string(),
            created_at: 1763000000000,
            fsrs_next_due_iso: None,
        });
        store.chapter_mastery.push(ChapterMastery {
            subject_id: "maths-std-12".to_string(),
            chapter_id: 8,
            estimate: 0.1,
            evidence: vec![
                Evidence { attempt_id: "at-p3-1".to_string(), kind: EvidenceKind::AssessmentMiss, weight: -0.1, created_at: 1763000000000 },
                Evidence { attempt_id: "at-p3-2".to_string(), kind: EvidenceKind::AssessmentMiss, weight: -0.1, created_at: 1763000000100 },
            ],
            last_verified: 0,
        });
        store
    }

    #[test]
    fn test_assessment_creates_pattern_and_lowers_mastery() {
        let mut store = IntelligenceStore::default();
        let attempt = test_attempt("at-rust-1");
        let derived = apply_assessment(&mut store, &attempt);
        assert_eq!(derived.len(), 1);
        assert_eq!(derived[0].frequency, 2);
        assert_eq!(get_chapter_mastery(&store, "maths-std-12", 8).estimate, 0.1);
        assert_eq!(apply_assessment(&mut store, &attempt).len(), 0);
        assert_eq!(store.attempts.len(), 1);
    }

    #[test]
    fn test_weakness_detection_and_activity_routing() {
        let mut store = IntelligenceStore::default();
        apply_assessment(&mut store, &test_attempt("at-rust-2"));
        let weaknesses = detect_weaknesses(&store, &test_marks());
        assert_eq!(weaknesses.len(), 1);
        assert_eq!(weaknesses[0].severity, "CRITICAL");
        assert_eq!(weaknesses[0].marks_at_risk, 4.5);
        let activity = create_corrective_activity(&weaknesses[0], "Shlok");
        assert_eq!(activity.kind, "FORMULA_REVIEW");
        assert_eq!(activity_kind_for_tag("CONCEPT"), "CONCEPT_REWORK");
        assert_eq!(activity_kind_for_tag("SILLY"), "DRILL_SET");
        assert_eq!(activity_kind_for_tag("TIME"), "TIME_MANAGEMENT");
    }

    #[test]
    fn test_retest_exam_cap() {
        let activity = create_corrective_activity(
            &Weakness {
                pattern: test_store_with_verification().error_patterns[0].clone(),
                chapter_id: 8,
                estimate: 0.1,
                marks_at_risk: 4.5,
                severity: "CRITICAL".to_string(),
            },
            "Shlok",
        );
        let near_exam = NaiveDate::from_ymd_opt(2027, 2, 25).unwrap() - Duration::days(4);
        let retest = schedule_retest(&activity, "2027-02-25", near_exam, "at-p3-1").unwrap();
        assert!(retest.scheduled_for.as_str() <= "2027-02-23");
        let far = schedule_retest(&activity, "2027-02-25", NaiveDate::from_ymd_opt(2026, 11, 20).unwrap(), "at-p3-1").unwrap();
        assert_eq!(far.scheduled_for, "2026-11-27");
    }

    #[test]
    fn test_practice_grants_no_mastery_credit() {
        let mut store = test_store_with_verification();
        let activity_id = store.activities[0].activity_id.clone();
        let before = get_chapter_mastery(&store, "maths-std-12", 8).estimate;
        record_corrective_practice(&mut store, &activity_id).unwrap();
        assert_eq!(store.activities[0].status, "PRACTICE_DONE");
        assert_eq!(get_chapter_mastery(&store, "maths-std-12", 8).estimate, before);
    }

    #[test]
    fn test_passing_retest_verifies_with_evidence() {
        let mut store = test_store_with_verification();
        apply_retest_result(&mut store, "rt-pass-1", true, "2027-02-25").unwrap();
        assert_eq!(store.activities[0].status, "VERIFIED");
        assert_eq!(store.retests[0].result, ReviewResult::Pass);
        assert!(store.retests[0].fsrs_next_due_iso.is_some());
        assert_eq!(get_chapter_mastery(&store, "maths-std-12", 8).estimate, 0.35);
        assert!(get_chapter_mastery(&store, "maths-std-12", 8).evidence.iter().any(|e| e.kind == EvidenceKind::RetryPass));
    }

    #[test]
    fn test_failing_retest_reopens_weakness() {
        let mut store = test_store_with_verification();
        apply_retest_result(&mut store, "rt-pass-1", false, "2027-02-25").unwrap();
        assert_eq!(store.activities[0].status, "REOPENED");
        assert_eq!(store.retests.len(), 2);
        assert_eq!(store.retests[1].retest_id, "rt-pass-1-retry-1");
        assert_eq!(store.retests[1].result, ReviewResult::Pending);
        assert_eq!(get_chapter_mastery(&store, "maths-std-12", 8).estimate, 0.0);
    }

    #[test]
    fn test_unknown_retest_id_is_rejected() {
        let mut store = test_store_with_verification();
        assert!(apply_retest_result(&mut store, "rt-missing", true, "2027-02-25").is_err());
    }
}
