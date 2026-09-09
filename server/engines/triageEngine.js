/**
 * Triage Engine — Rule-based symptom-to-pathway routing
 * 
 * NO AI/ML — purely keyword/flag matching.
 * Routes to: general, maternal, pediatric_danger (IMNCI-aligned), chronic
 * Output: { pathway, risk_level, suggested_specialty, matched_rules }
 */

// IMNCI danger signs for pediatric emergency
const PEDIATRIC_DANGER_SIGNS = [
  'convulsion', 'convulsions', 'seizure', 'seizures',
  'lethargy', 'lethargic', 'unconscious', 'unresponsive',
  'refusal to feed', 'not feeding', 'unable to feed', 'stopped feeding',
  'chest indrawing', 'stridor', 'breathing difficulty',
  'severe dehydration', 'sunken eyes', 'skin pinch',
  'high fever', 'very high fever',
  'bulging fontanelle', 'stiff neck',
  'bleeding', 'severe bleeding',
  'jaundice', 'severe jaundice', 'yellow',
];

const MATERNAL_KEYWORDS = [
  'pregnancy', 'pregnant', 'anc', 'antenatal',
  'bleeding', 'vaginal bleeding', 'spotting',
  'labor', 'labour', 'contractions', 'delivery',
  'pre-eclampsia', 'eclampsia', 'high bp in pregnancy',
  'gestational diabetes', 'swelling', 'edema',
  'headache pregnancy', 'blurred vision',
  'reduced fetal movement', 'no movement',
  'miscarriage', 'abortion',
  'postpartum', 'postnatal',
  'lmp', 'edd', 'morning sickness', 'nausea pregnancy',
];

const MATERNAL_EMERGENCY_KEYWORDS = [
  'severe bleeding', 'heavy bleeding', 'hemorrhage',
  'eclampsia', 'convulsions in pregnancy', 'seizure pregnancy',
  'obstructed labor', 'prolonged labor',
  'cord prolapse', 'placenta previa',
  'unconscious pregnant', 'shock',
];

const CHRONIC_KEYWORDS = [
  'diabetes', 'sugar', 'blood sugar', 'glucose', 'hba1c',
  'hypertension', 'blood pressure', 'bp', 'high bp',
  'asthma', 'wheezing', 'inhaler', 'breathing chronic',
  'copd', 'lung disease',
  'thyroid', 'hypothyroid', 'hyperthyroid',
  'kidney', 'renal', 'dialysis',
  'heart disease', 'cardiac', 'chest pain chronic',
  'arthritis', 'joint pain chronic',
  'epilepsy', 'seizure disorder',
  'tuberculosis', 'tb', 'cough chronic',
];

const PEDIATRIC_GENERAL_KEYWORDS = [
  'child', 'infant', 'baby', 'newborn', 'toddler',
  'vaccination', 'vaccine', 'immunisation', 'immunization',
  'growth', 'weight gain', 'feeding',
  'diarrhea', 'loose motion', 'vomiting child',
  'cough child', 'cold child', 'fever child',
  'rash child', 'skin child',
];

const GENERAL_EMERGENCY_KEYWORDS = [
  'accident', 'trauma', 'fracture', 'broken',
  'unconscious', 'unresponsive', 'not breathing',
  'snake bite', 'dog bite', 'burn', 'drowning',
  'poisoning', 'suicide attempt', 'self harm',
  'severe pain', 'chest pain', 'heart attack',
  'stroke', 'paralysis sudden', 'slurred speech',
];

function triage(symptoms, patientContext = {}) {
  if (!symptoms || typeof symptoms !== 'string') {
    return {
      pathway: 'general',
      risk_level: 'low',
      suggested_specialty: 'general',
      matched_rules: ['No symptoms provided — defaulting to general'],
    };
  }

  const text = symptoms.toLowerCase().trim();
  const matched_rules = [];
  let pathway = 'general';
  let risk_level = 'low';
  let suggested_specialty = 'general';

  const isChild = patientContext.age !== undefined && patientContext.age < 5;
  const isPregnant = patientContext.isPregnant || false;

  // 1. Check pediatric danger signs (IMNCI) — highest priority
  if (isChild) {
    const dangerMatches = PEDIATRIC_DANGER_SIGNS.filter(sign => text.includes(sign));
    if (dangerMatches.length > 0) {
      pathway = 'pediatric_danger';
      risk_level = 'emergency';
      suggested_specialty = 'pediatrics';
      matched_rules.push(`IMNCI danger sign(s) detected: ${dangerMatches.join(', ')}`);
      return { pathway, risk_level, suggested_specialty, matched_rules };
    }
  }

  // Also check pediatric danger signs without age context (keywords mention child)
  const childMentioned = ['child', 'infant', 'baby', 'newborn', 'toddler'].some(w => text.includes(w));
  if (childMentioned) {
    const dangerMatches = PEDIATRIC_DANGER_SIGNS.filter(sign => text.includes(sign));
    if (dangerMatches.length > 0) {
      pathway = 'pediatric_danger';
      risk_level = 'emergency';
      suggested_specialty = 'pediatrics';
      matched_rules.push(`Child mentioned with IMNCI danger sign(s): ${dangerMatches.join(', ')}`);
      return { pathway, risk_level, suggested_specialty, matched_rules };
    }
  }

  // 2. Check maternal emergency
  if (isPregnant || MATERNAL_KEYWORDS.some(kw => text.includes(kw))) {
    const emergencyMatches = MATERNAL_EMERGENCY_KEYWORDS.filter(kw => text.includes(kw));
    if (emergencyMatches.length > 0) {
      pathway = 'maternal';
      risk_level = 'emergency';
      suggested_specialty = 'obstetrics';
      matched_rules.push(`Maternal emergency keyword(s): ${emergencyMatches.join(', ')}`);
      return { pathway, risk_level, suggested_specialty, matched_rules };
    }

    const maternalMatches = MATERNAL_KEYWORDS.filter(kw => text.includes(kw));
    if (maternalMatches.length > 0) {
      pathway = 'maternal';
      risk_level = isPregnant && patientContext.riskFlags ? 'high' : 'medium';
      suggested_specialty = 'obstetrics';
      matched_rules.push(`Maternal keyword(s): ${maternalMatches.join(', ')}`);
      if (isPregnant && patientContext.riskFlags) {
        matched_rules.push(`Existing risk flags: ${patientContext.riskFlags}`);
      }
    }
  }

  // 3. Check general emergency
  const generalEmergencyMatches = GENERAL_EMERGENCY_KEYWORDS.filter(kw => text.includes(kw));
  if (generalEmergencyMatches.length > 0) {
    pathway = 'general';
    risk_level = 'emergency';
    suggested_specialty = 'emergency';
    matched_rules.push(`Emergency keyword(s): ${generalEmergencyMatches.join(', ')}`);
    return { pathway, risk_level, suggested_specialty, matched_rules };
  }

  // 4. Check chronic (only if not already maternal)
  if (pathway !== 'maternal') {
    const chronicMatches = CHRONIC_KEYWORDS.filter(kw => text.includes(kw));
    if (chronicMatches.length > 0) {
      pathway = 'chronic';
      risk_level = patientContext.thresholdBreached ? 'high' : 'medium';
      // Determine specialty based on chronic type
      if (text.includes('diabetes') || text.includes('sugar') || text.includes('glucose')) {
        suggested_specialty = 'endocrinology';
      } else if (text.includes('hypertension') || text.includes('bp') || text.includes('blood pressure')) {
        suggested_specialty = 'cardiology';
      } else if (text.includes('asthma') || text.includes('copd') || text.includes('lung')) {
        suggested_specialty = 'pulmonology';
      } else if (text.includes('thyroid')) {
        suggested_specialty = 'endocrinology';
      } else {
        suggested_specialty = 'chronic_care';
      }
      matched_rules.push(`Chronic condition keyword(s): ${chronicMatches.join(', ')}`);
      if (patientContext.thresholdBreached) {
        matched_rules.push('Threshold previously breached — elevated risk');
      }
    }
  }

  // 5. Check general pediatric (not danger)
  if (pathway === 'general') {
    const pedMatches = PEDIATRIC_GENERAL_KEYWORDS.filter(kw => text.includes(kw));
    if (pedMatches.length > 0 || isChild) {
      pathway = 'pediatric';
      risk_level = 'low';
      suggested_specialty = 'pediatrics';
      matched_rules.push(isChild ? 'Patient is under 5 years old' : `Pediatric keyword(s): ${pedMatches.join(', ')}`);
    }
  }

  // 6. Fever + additional symptoms for children → elevated risk
  if (isChild && text.includes('fever')) {
    const additionalRisk = ['convulsion', 'lethargy', 'not feeding', 'refusal to feed', 'unconscious'].some(s => text.includes(s));
    if (additionalRisk) {
      pathway = 'pediatric_danger';
      risk_level = 'emergency';
      suggested_specialty = 'pediatrics';
      matched_rules.push('Fever + IMNCI red flag in child under 5 → emergency');
    }
  }

  if (matched_rules.length === 0) {
    matched_rules.push('No specific keywords matched — routed to general consultation');
  }

  return { pathway, risk_level, suggested_specialty, matched_rules };
}

module.exports = { triage };
