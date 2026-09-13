# ClinSync AI — From Consultation to Verified Documentation

> **An AI agent that reconciles fragmented clinical information, verifies evidence, detects inconsistencies, and knows when to ask a human.**

[![Synthetic Data Only](https://img.shields.io/badge/data-synthetic%20%7C%20deidentified-22D3EE?style=for-the-badge)](#safety-by-design)
[![No Autonomous Diagnosis](https://img.shields.io/badge/safety-no%20autonomous%20clinical%20decisions-F87171?style=for-the-badge)](#safety-by-design)
[![Live Demo](https://img.shields.io/badge/demo-fully%20functional%20%7C%20deterministic-34D399?style=for-the-badge)](#live-demo)

**Live Site:** Open `index.html` — zero dependencies, works offline. Deploy to GitHub Pages / Vercel / Netlify as static site.

**Tagline:** *“ClinSync AI doesn’t just generate documentation. It reconciles information, verifies evidence, validates the result, and knows when a human needs to take over.”*

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Live Demo — 5 Synthetic Scenarios](#live-demo--5-synthetic-scenarios)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Reconciliation Engine](#reconciliation-engine)
- [Validation Engine](#validation-engine)
- [Safety by Design](#safety-by-design)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
- [How to Use the Demo](#how-to-use-the-demo)
- [Adaptation Demo](#adaptation-demo)
- [Tech Stack](#tech-stack)
- [Deployment](#deployment)
- [License](#license)

---

## Problem

Clinical information is fragmented across:

- **Consultation Transcripts** — subjective, temporal (“stopped 2 weeks ago”)
- **Previous Notes** — often outdated
- **Medication History** — EHR says Active, pharmacy says no refill
- **Allergy Records** — patient denies, EHR documents rash
- **Lab Reports** — 1.1 mg/dL on Aug 10 vs 1.6 on Sep 05
- **New Updates** — arrive after encounter, changing interpretation

Result: contradictions, missing dosage, ambiguous statements, outdated records. Manual reconciliation is slow and error-prone.

## Solution

ClinSync AI is a **deterministic, auditable, tool-driven documentation agent**:

1. **Ingest** 5+ source types with timestamps & source IDs
2. **Extract** entities (med name/status/dosage, allergen, lab value)
3. **Reconcile** by grouping on normalized entity + comparing across sources
4. **Detect** contradictions, missing info, ambiguity, outdated records with severity
5. **Retrieve** supporting evidence via simulated tools (real JS functions)
6. **Generate** structured follow-up record with 11 sections + source traceability
7. **Validate** with 10 checks
8. **Decide:** Safely resolved OR Human Review Required (for high-severity)
9. **Adapt** when new information arrives — shows Before vs After diff

All logic runs client-side, no external AI API, no PHI. Synthetic data only.

---

## Live Demo — 5 Synthetic Scenarios

| ID | Scenario | Severity | What it tests |
|---|---|---|---|
| `SYN-P-001` | **Medication Conflict** | HIGH | Patient reports stopping Lisinopril (dizziness), EHR Active, pharmacy no refill since Aug 20 |
| `SYN-P-002` | **Allergy Conflict** | HIGH | Patient denies allergies, EHR documents Penicillin rash 2024 + unverified shellfish itching |
| `SYN-P-003` | **Laboratory Update** | MEDIUM | Creatinine 1.1 (Aug 10) → 1.6 High (Sep 05) → 1.3 Improving (Sep 12 repeat) |
| `SYN-P-004` | **Missing Information** | LOW | Levothyroxine dosage missing in EHR, present in pharmacy (75mcg); latex reaction missing |
| `SYN-P-005` | **Multiple Conflicts** | HIGH | Atorvastatin discontinuation + NKA vs Penicillin + missing dosage + outdated creatinine — stress test |

Each patient has:
- Synthetic ID, name, age, gender, MRN
- Consultation transcript with sourceId `CONS-XXX`
- Previous note `NOTE-XXX`
- Medications with `priority: 1=latest verified, 2=EHR, 3=patient-reported`
- Allergies, Labs with timestamps, source, sourceId
- `newInformation` for adaptation demo

---

## Key Features

### Fully Functional (Not a Mockup)
- ✅ Every button performs real action
- ✅ Navigation smooth-scrolls
- ✅ Workflow executes with real JS logic, not fake animations
- ✅ Data updates dynamically from synthetic engine
- ✅ Forms accept input (scenario selector)
- ✅ Reset / Replay / Introduce New Information all work

### Demo Capabilities
- **Workflow Bar:** 7 steps with progress, status, animated connectors
- **Sources & Conflicts:** Shows Source A vs Source B, date, priority, evidence, field
- **Evidence Panel:** FACT, SOURCE, DATE, CONFIDENCE, STATUS, verification
- **Structured Follow-up Record:** 11 sections, source badges clickable → modal with Source/Date/Type/Evidence
- **Validation Engine:** 10 checks with PASS/FAIL + exact reason
- **Human Review:** Approve / Mark for Review / Return to Reconciliation — mutates state + audit trail
- **Audit Trail:** Live timestamps `HH:MM:SS` — ingest, conflict detected, evidence retrieved, validation, decision
- **Simulated Tools:** Patient DB, Med Lookup, Allergy Lookup, Lab Retrieval, Knowledge, Validation — visible searching → found
- **Before vs After:** Highlights changed fields after new info injection
- **Analytics:** Sources Processed, Conflicts Detected/Resolved, Review Items, Validation Checks, Completeness — calculated live
- **Responsive + Dark/Light Mode**

---

## Architecture

```
Synthetic Data (5 scenarios, source IDs, timestamps)
        ↓
Ingestion (normalize dates, assign priority, validate required fields)
        ↓
Information Extraction (deterministic pattern matching, no hallucination)
        ↓
Reconciliation Engine (group by normalized name: meds, allergen, lab test)
        ↓
Conflict Detection (contradiction, missing, ambiguity, outdated + severity)
        ↓
Evidence Retrieval (6 tools = real JS functions searching synthetic DB)
        ↓
Documentation Generator (template + reconciliation output, every field sourceRefs)
        ↓
Validation Engine (10 checks)
        ↓
Human Review (escalation for high-severity, safety invariant enforced)
        ↓
Verified Follow-up Record + Audit Trail
```

**Clickable nodes** in UI explain each component's purpose, inputs, outputs, safety.

---

## Reconciliation Engine

Real client-side logic (see `index.html` and `engine.js`):

```javascript
// Group medications by normalized name
const medGroups = {};
sources.filter(s=>s.kind==='medication').forEach(m=>{
  const key = normalizeName(m.name); // lisinopril
  if(!medGroups[key]) medGroups[key]=[];
  medGroups[key].push(m);
});

// Detect status conflict: Active vs Patient-reported discontinuation
if (statuses.length > 1) {
  conflicts.push({
    type: "Medication Status Conflict",
    severity: "high", // requires human review
    sourceA, sourceB,
    field: "Medication Reconciliation"
  });
}

// Missing dosage → supplement from pharmacy if available (low severity, safely resolvable)
// Allergy: NKA vs Active → high severity, always escalate
// Lab: outdated → compare timestamps, use latest
// Ambiguity: regex for "about 2 weeks", "I think", "maybe", "not sure"
```

**Resolution Rules:**
- **High severity** (med status change, allergy contradiction): Document as `Patient-reported discontinuation - Pending provider verification`, flag for human review. Never auto-change.
- **Medium** (lab outdated): Safely resolve by using latest verified lab.
- **Low** (missing dosage, missing reaction): Supplement from pharmacy/nursing if evidence exists.

---

## Validation Engine

10 checks, each with pass/fail + reason:

1. **Date consistency** — encounter after previous note
2. **Medication consistency** — no duplicate active with different dosage
3. **Allergy consistency** — contradiction requires human review
4. **Lab consistency** — using latest values
5. **Duplicate information**
6. **Missing fields** — supplemented where possible
7. **Unsupported claims** — all facts traceable (never invent)
8. **Conflicting records** — high-severity requires review
9. **Source traceability** — every field has sourceId
10. **Latest-record handling** — priority 1 wins

Overall: `VALIDATION PASSED` or `VALIDATION FAILED` + `HUMAN REVIEW REQUIRED` if high-severity remains.

---

## Safety by Design

> **“Knowing when NOT to guess is part of intelligence.”**

**Enforced in code:**

```javascript
if (conflict.severity === 'high' && !humanApproved) {
  return 'HUMAN_REVIEW_REQUIRED';
}
// Never auto-prescribe, diagnose, or change med instructions
```

| Rule | Status |
|---|---|
| Synthetic data only (SYN-P-XXX, no real PHI) | ✅ Allow |
| No autonomous diagnosis | ❌ Deny — system only reconciles provided sources |
| No autonomous prescribing | ❌ Deny |
| No treatment recommendations | ❌ Deny |
| No medication changes | ❌ Deny — documents as “pending verification” |
| Human review for consequential uncertainty | ✅ Enforce |

---

## Project Structure

```
/
├── index.html          # Fully functional single-file app (122KB, 2207 lines)
│                       # Contains: UI, CSS, synthetic data, engine, validation,
│                       #           audit trail, evidence, human review, analytics
│                       # Works in GitHub preview (inline styles, no external deps)
├── engine.js           # Documentation of reconciliation & validation architecture
├── data.js             # Documentation of synthetic data engine
├── README.md           # This file
└── .gitignore          # (optional)
```

**Why single-file `index.html`?**
- Preview in GitHub / Arena iframe has no network access — external CSS/JS would fail to load. Inline ensures it renders everywhere.
- Still maintains component separation logically: `SYNTHETIC_PATIENTS`, `reconcile`, `detect`, `retrieve`, `generateFollowUpRecord`, `validate`, `audit`, `toolsState`, `render*` functions.

For production, you can split into Vite/Next.js — logic is already modular.

---

## How to Run

### Option 1: Open directly (no build)
```bash
git clone https://github.com/your-org/clinsync-ai.git
cd clinsync-ai
open index.html
# or: python3 -m http.server 8000 → http://localhost:8000
```

### Option 2: GitHub Pages
1. Push `index.html` to `main` branch root
2. Settings → Pages → Source: `main` / root
3. Site live at `https://your-org.github.io/clinsync-ai/`

### Option 3: Vercel / Netlify
- Drag & drop `index.html` or connect repo — static deployment, no build command needed.

No API keys, no backend, no env vars. Deterministic synthetic fallback works offline.

---

## How to Use the Demo

1. **Open site** → Understand problem in Problem cards (hover to see conflicts)
2. **Learn flow** in How It Works → click architecture nodes
3. **Live Demo:**
   - Select scenario (e.g., Medication Conflict)
   - Click **▶ Run ClinSync AI**
   - Watch 7 steps execute: sources load → conflicts detected → evidence retrieved → record generated → validation → decision
   - Inspect Sources & Conflicts panel (Source A vs B)
   - Check Evidence panel (confidence, verification)
   - Read Structured Follow-up Record — click source badges for modal
   - Review Validation (PASS/FAIL) and Audit Trail
   - If Human Review Required → try Approve / Mark for Review / Return to Reconciliation
4. **Introduce New Information** → injects pharmacy/lab update → auto re-runs → Before vs After diff
5. **Show Changes** toggle highlights updated fields
6. **Reset / Replay** to watch again

---

## Adaptation Demo

Required feature — implemented:

- Original: `Lisinopril Active (EHR 2026-08-15)`
- New consultation: Patient reports stopped
- New info button: Pharmacy dispense `not refilled since 2026-08-20`

System:
1. Detects new information exists
2. Compares with previous state
3. Re-runs reconciliation
4. Updates follow-up record
5. Re-runs validation
6. Shows exactly what changed in Before vs After panel with cyan highlight

---

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3 (CSS variables, glassmorphism, grid, flex, animations), ES6+ JavaScript (no framework, no build step)
- **Fonts:** Inter + JetBrains Mono (fallback to system if offline)
- **State:** Single `state` object — workflow, sources, conflicts, evidence, record, validation, audit, tools
- **Engine:** Deterministic, client-side, no external dependencies
- **Design:** Deep navy #0B1220, white, cyan #22D3EE / blue #3B82F6, premium healthcare + AI startup aesthetic

---

## Deployment

The site is **production-quality and immediately deployable**:

- No TODOs, no placeholder buttons, no “coming soon”
- All CTAs functional
- Error handling: missing records, empty transcript, conflicting records, failed retrieval, validation failure — shows useful messages, never silent fail
- Responsive: Desktop, Laptop, Tablet, Mobile tested
- Dark mode default, light mode toggle

**GitHub Push Checklist:**
```bash
git add index.html README.md
git commit -m "feat: ClinSync AI — fully functional reconciliation demo with 5 synthetic scenarios"
git push origin main
```

Enable GitHub Pages and you’re live.

---

## License

MIT — Synthetic data only, no real patient information. For demonstration / hackathon / educational use. Not a medical device. Does not provide medical advice.

---

## Core Message

> **ClinSync AI doesn’t just generate documentation. It reconciles information, verifies evidence, validates the result, and knows when a human needs to take over.**

Built for verification, not hallucination. Autonomous where safe. Human where it matters.

---

**Author:** ClinSync AI Team — 13 Sep 2026  
**Version:** v1.0.0 — `SYNTHETIC • DEIDENTIFIED • NO REAL PHI`

**Team:** Vibranium  
**Leader:** Lokesh  
**Co-Leader:** Jatin Saini
