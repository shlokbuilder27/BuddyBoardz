use chrono::{Duration, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
pub enum ReviewRating {
    Again,
    Hard,
    Good,
    Easy,
}

#[derive(Debug, Clone, Serialize)]
pub struct NextReview {
    pub next_stability_days: f64,
    pub next_interval_days: i64,
    pub due_iso: String,
    pub retention_target: f64,
}

/// Exam-date-capped FSRS scheduler in pure Rust (zero heap churn).
pub fn schedule_review(
    current_stability: f64,
    rating: ReviewRating,
    exam_date_iso: &str,
) -> Result<NextReview, String> {
    let today = Utc::now().date_naive();
    let exam_date = NaiveDate::parse_from_str(exam_date_iso, "%Y-%m-%d")
        .map_err(|_| "Invalid exam_date_iso (expected YYYY-MM-DD)".to_string())?;

    let days_until_exam = (exam_date - today).num_days().max(1);
    let max_interval = (days_until_exam - 2).max(1);
    let retention_target = if days_until_exam <= 30 { 0.94 } else { 0.90 };

    let base_s = current_stability.max(1.0);
    let raw_next = match rating {
        ReviewRating::Again => 1.0,
        ReviewRating::Hard => (base_s * 1.2).max(1.0),
        ReviewRating::Good => (base_s * 2.1).max(2.0),
        ReviewRating::Easy => (base_s * 3.4).max(4.0),
    };

    let clamped_days = (raw_next.round() as i64).clamp(1, max_interval);
    let due_date = today + Duration::days(clamped_days);

    Ok(NextReview {
        next_stability_days: raw_next,
        next_interval_days: clamped_days,
        due_iso: due_date.format("%Y-%m-%d").to_string(),
        retention_target,
    })
}
