// ClinSync AI - Reconciliation & Validation Engine (deterministic, client-side)
// This file documents the engine architecture. The live implementation is embedded in index.html for preview compatibility.

export const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g,'');

export function reconcileSources(sources){
  // Groups by entity and detects conflicts - real implementation in index.html
  const medGroups = {};
  sources.filter(s=>s.kind==='medication').forEach(m=>{
    const key = normalizeName(m.name);
    if(!medGroups[key]) medGroups[key]=[];
    medGroups[key].push(m);
  });
  return medGroups;
}

export function validateRecord(record, conflicts, sources){
  const checks = [
    { id:"date_consistency", label:"Date consistency" },
    { id:"med_consistency", label:"Medication consistency" },
    { id:"allergy_consistency", label:"Allergy consistency" },
    { id:"lab_consistency", label:"Lab consistency" },
    { id:"duplicate", label:"Duplicate info" },
    { id:"missing", label:"Missing fields" },
    { id:"unsupported", label:"Unsupported claims" },
    { id:"conflicting", label:"Conflicting records" },
    { id:"traceability", label:"Source traceability" },
    { id:"latest", label:"Latest-record handling" },
  ];
  return checks;
}

// Safety invariant enforced in code:
// if (conflict.severity === 'high' && !humanApproved) return 'HUMAN_REVIEW_REQUIRED';
// Never auto-prescribe, diagnose, or change medication instructions autonomously.
