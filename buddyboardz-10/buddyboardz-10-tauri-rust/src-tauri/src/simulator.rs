use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
pub enum ChapterState {
    Master,
    SecAOnly,
    Skip,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ChapterWeight {
    pub id: u8,
    pub base_marks: u8,
    pub with_option_marks: u8,
    pub state: ChapterState,
}

#[derive(Debug, Clone, Serialize)]
pub struct SimulationResult {
    pub max_sec_a: u8,
    pub max_descriptive: u8,
    pub achievable_score: u8,
    pub buffer_used: u8,
    pub passes_theory_floor: bool,
}

/// Zero-allocation stack-friendly GSEB 109-mark General-Option constraint solver.
pub fn simulate_gseb_109(chapters: &[ChapterWeight]) -> SimulationResult {
    let raw_comp_sum: f64 = chapters
        .iter()
        .map(|c| ((c.base_marks as f64 * 0.30).round().max(1.0)).min(c.base_marks as f64))
        .sum();

    let mut sec_a = 0.0_f64;
    let mut desc_pool = 0.0_f64;

    for ch in chapters {
        let raw_c = ((ch.base_marks as f64 * 0.30).round().max(1.0)).min(ch.base_marks as f64);
        let scaled_comp = if raw_comp_sum > 0.0 { (raw_c / raw_comp_sum) * 24.0 } else { 0.0 };
        let desc = (ch.with_option_marks as f64 - scaled_comp).max(0.0);

        match ch.state {
            ChapterState::Master => {
                sec_a += scaled_comp;
                desc_pool += desc;
            }
            ChapterState::SecAOnly => {
                sec_a += scaled_comp;
            }
            ChapterState::Skip => {}
        }
    }

    let max_sec_a = (sec_a.round() as u8).min(24);
    let max_descriptive = (desc_pool.round() as u8).min(56);
    let achievable_score = (max_sec_a + max_descriptive).min(80);
    let buffer_used = ((85.0 - desc_pool).max(0.0).round() as u8).min(29);

    SimulationResult {
        max_sec_a,
        max_descriptive,
        achievable_score,
        buffer_used,
        passes_theory_floor: achievable_score >= 26,
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_master_all_chapters_passes() {
        let chapters = vec![
            ChapterWeight { id: 1, base_marks: 4, with_option_marks: 4, state: ChapterState::Master },
            ChapterWeight { id: 2, base_marks: 6, with_option_marks: 9, state: ChapterState::Master },
            ChapterWeight { id: 3, base_marks: 8, with_option_marks: 12, state: ChapterState::Master },
            ChapterWeight { id: 4, base_marks: 5, with_option_marks: 7, state: ChapterState::Master },
            ChapterWeight { id: 5, base_marks: 6, with_option_marks: 9, state: ChapterState::Master },
            ChapterWeight { id: 6, base_marks: 5, with_option_marks: 9, state: ChapterState::Master },
            ChapterWeight { id: 7, base_marks: 5, with_option_marks: 5, state: ChapterState::Master },
            ChapterWeight { id: 8, base_marks: 5, with_option_marks: 7, state: ChapterState::Master },
            ChapterWeight { id: 9, base_marks: 4, with_option_marks: 4, state: ChapterState::Master },
            ChapterWeight { id: 10, base_marks: 6, with_option_marks: 9, state: ChapterState::Master },
            ChapterWeight { id: 11, base_marks: 4, with_option_marks: 4, state: ChapterState::Master },
            ChapterWeight { id: 12, base_marks: 8, with_option_marks: 12, state: ChapterState::Master },
            ChapterWeight { id: 13, base_marks: 8, with_option_marks: 10, state: ChapterState::Master },
            ChapterWeight { id: 14, base_marks: 6, with_option_marks: 8, state: ChapterState::Master },
        ];
        let sim = simulate_gseb_109(&chapters);
        assert_eq!(sim.achievable_score, 80);
        assert_eq!(sim.max_sec_a, 24);
        assert!(sim.passes_theory_floor);
    }

    #[test]
    fn test_skip_all_triggers_pass_floor_failure() {
        let chapters = vec![
            ChapterWeight { id: 1, base_marks: 4, with_option_marks: 4, state: ChapterState::Skip },
            ChapterWeight { id: 2, base_marks: 6, with_option_marks: 9, state: ChapterState::Skip },
        ];
        let sim = simulate_gseb_109(&chapters);
        assert_eq!(sim.achievable_score, 0);
        assert!(!sim.passes_theory_floor);
    }
}
