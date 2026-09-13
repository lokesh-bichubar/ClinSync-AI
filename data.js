// ClinSync AI - Synthetic Data Engine
// All data is synthetic, deidentified, with source IDs and timestamps.
// See index.html for full dataset (5 scenarios).

export const SCENARIOS = [
  "medication_conflict",
  "allergy_conflict", 
  "lab_update",
  "missing_info",
  "multiple_conflicts"
];

// Each patient includes:
// - Synthetic patient ID (SYN-P-XXX)
// - Consultation transcript
// - Previous notes
// - Medication history with source priority
// - Allergy records
// - Lab reports with dates
// - New information for adaptation demo
// Priority: 1 = most recent verified, 2 = EHR, 3 = patient-reported

// Safety: No real PHI, no real patient data, all synthetic.
