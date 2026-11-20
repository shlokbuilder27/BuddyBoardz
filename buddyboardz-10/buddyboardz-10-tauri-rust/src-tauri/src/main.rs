#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod feedback_loop;
mod fsrs_engine;
mod simulator;

use fsrs_engine::{schedule_review, NextReview, ReviewRating};
use simulator::{simulate_gseb_109, ChapterWeight, SimulationResult};
use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn run_simulation(chapters: Vec<ChapterWeight>) -> SimulationResult {
    simulate_gseb_109(&chapters)
}

#[tauri::command]
fn compute_fsrs_next(
    stability: f64,
    rating: ReviewRating,
    exam_date_iso: String,
) -> Result<NextReview, String> {
    schedule_review(stability, rating, &exam_date_iso)
}

#[tauri::command]
fn save_atomic_backup(path: String, json_payload: String) -> Result<(), String> {
    let target = PathBuf::from(&path);
    let tmp = target.with_extension("json.tmp");
    fs::write(&tmp, json_payload.as_bytes()).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &target).map_err(|e| e.to_string())
}

#[tauri::command]
fn apply_assessment_command(store_json: String, attempt_json: String) -> Result<String, String> {
    let mut store: feedback_loop::IntelligenceStore = serde_json::from_str(&store_json).map_err(|e| e.to_string())?;
    let attempt: feedback_loop::Attempt = serde_json::from_str(&attempt_json).map_err(|e| e.to_string())?;
    feedback_loop::apply_assessment(&mut store, &attempt);
    serde_json::to_string(&store).map_err(|e| e.to_string())
}

#[tauri::command]
fn compute_weaknesses_command(store_json: String, marks_json: String) -> Result<String, String> {
    let store: feedback_loop::IntelligenceStore = serde_json::from_str(&store_json).map_err(|e| e.to_string())?;
    let marks: Vec<feedback_loop::ChapterMarks> = serde_json::from_str(&marks_json).map_err(|e| e.to_string())?;
    serde_json::to_string(&feedback_loop::detect_weaknesses(&store, &marks)).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            run_simulation,
            compute_fsrs_next,
            save_atomic_backup,
            apply_assessment_command,
            compute_weaknesses_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running BuddyBoardz 10 desktop app");
}
