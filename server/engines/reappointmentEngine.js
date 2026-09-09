/**
 * Reappointment Engine — Scoring-based alternative appointment ranking
 * 
 * When an appointment is disrupted (doctor unavailable, cancelled, etc.),
 * this engine finds and ranks alternatives.
 * 
 * Score = specialty_match(0–40) + slot_proximity(0–30) + distance_score(0–20) + facility_readiness(0–10)
 * 
 * Every sub-score is visible in the output — not a black box.
 */

/**
 * Calculate specialty match score (0–40)
 * Exact match = 40, related specialty = 20, different = 0
 */
function specialtyMatchScore(needed, available) {
  if (!needed || !available) return 0;
  if (needed === available) return 40;

  // Related specialties
  const related = {
    obstetrics: ['general', 'gynecology'],
    pediatrics: ['general', 'neonatology'],
    cardiology: ['general', 'chronic_care'],
    endocrinology: ['general', 'chronic_care'],
    pulmonology: ['general', 'chronic_care'],
    chronic_care: ['general', 'endocrinology', 'cardiology'],
    general: ['chronic_care'],
    emergency: ['general'],
  };

  if (related[needed] && related[needed].includes(available)) return 20;
  if (related[available] && related[available].includes(needed)) return 20;
  return 0;
}

/**
 * Calculate slot proximity score (0–30)
 * Same day = 30, next day = 25, 2 days = 20, 3 days = 15, 4-5 days = 10, 6-7 days = 5, >7 = 0
 */
function slotProximityScore(originalDate, alternativeDate) {
  if (!originalDate || !alternativeDate) return 0;
  const orig = new Date(originalDate);
  const alt = new Date(alternativeDate);
  const diffDays = Math.abs(Math.floor((alt - orig) / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return 30;
  if (diffDays === 1) return 25;
  if (diffDays === 2) return 20;
  if (diffDays === 3) return 15;
  if (diffDays <= 5) return 10;
  if (diffDays <= 7) return 5;
  return 0;
}

/**
 * Calculate distance score (0–20)
 * Uses simplified Haversine to compute km between patient and facility,
 * then maps to a score. Closer = higher.
 */
function distanceScore(patientLat, patientLng, facilityLat, facilityLng) {
  if (!patientLat || !patientLng || !facilityLat || !facilityLng) return 10; // default mid-range

  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(facilityLat - patientLat);
  const dLng = toRad(facilityLng - patientLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(patientLat)) * Math.cos(toRad(facilityLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;

  if (km <= 5) return 20;
  if (km <= 10) return 16;
  if (km <= 20) return 12;
  if (km <= 50) return 8;
  if (km <= 100) return 4;
  return 0;
}

/**
 * Facility readiness score (0–10)
 * Maps the facility's readiness_score (0–10 range) directly
 */
function facilityReadinessScore(readinessScore) {
  if (readinessScore == null) return 0;
  return Math.min(10, Math.max(0, Math.round(readinessScore)));
}

/**
 * Main function: find and rank alternative appointments
 * 
 * @param {Object} disrupted - The disrupted appointment details
 * @param {Array} availableSlots - Array of { doctor, facility, date, slot } options
 * @param {Object} patientLocation - { lat, lng } of patient
 * @returns {Array} Ranked alternatives with sub-scores
 */
function rankAlternatives(disrupted, availableSlots, patientLocation = {}) {
  const neededSpecialty = disrupted.suggested_specialty || disrupted.triage_pathway || 'general';
  const originalDate = disrupted.date;

  const ranked = availableSlots.map((option) => {
    const specScore = specialtyMatchScore(neededSpecialty, option.doctor_specialty);
    const proxScore = slotProximityScore(originalDate, option.date);
    const distScore = distanceScore(
      patientLocation.lat, patientLocation.lng,
      option.facility_lat, option.facility_lng
    );
    const readScore = facilityReadinessScore(option.facility_readiness);
    const totalScore = specScore + proxScore + distScore + readScore;

    return {
      doctor_id: option.doctor_id,
      doctor_name: option.doctor_name,
      doctor_specialty: option.doctor_specialty,
      facility_id: option.facility_id,
      facility_name: option.facility_name,
      date: option.date,
      slot: option.slot,
      total_score: totalScore,
      sub_scores: {
        specialty_match: { score: specScore, max: 40, reason: specScore === 40 ? 'Exact specialty match' : specScore === 20 ? 'Related specialty' : 'Different specialty' },
        slot_proximity: { score: proxScore, max: 30, reason: `${Math.abs(Math.floor((new Date(option.date) - new Date(originalDate)) / (1000 * 60 * 60 * 24)))} day(s) from original` },
        distance: { score: distScore, max: 20, reason: patientLocation.lat ? 'Based on patient location' : 'Default (location unknown)' },
        facility_readiness: { score: readScore, max: 10, reason: `Readiness score: ${option.facility_readiness || 'N/A'}` },
      },
    };
  });

  // Sort descending by total score
  ranked.sort((a, b) => b.total_score - a.total_score);

  return ranked;
}

module.exports = { rankAlternatives, specialtyMatchScore, slotProximityScore, distanceScore, facilityReadinessScore };
