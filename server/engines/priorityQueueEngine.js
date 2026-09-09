/**
 * Priority Queue Engine — Ranks flagged patients for ASHA/staff follow-up
 * 
 * Ranking criteria (in order):
 * 1. Category risk weight (maternal > chronic > child)
 * 2. Days since flag raised (older = higher priority)
 * 3. Prior failed ASHA follow-up count
 * 
 * Every output row includes a human-readable reason_label.
 * Never shows a bare number to staff.
 */

const CATEGORY_WEIGHTS = {
  maternal: 100,
  chronic: 80,
  child: 60,
  general: 40,
};

const RISK_LEVEL_WEIGHTS = {
  emergency: 50,
  high: 30,
  medium: 15,
  low: 5,
};

/**
 * Rank a list of flagged patients by priority
 * 
 * @param {Array} flags - Array of priority_flag records, each with:
 *   { patient_id, category, reason_label, raised_at, resolved_status, patient_name, failed_followups }
 * @returns {Array} Sorted array with priority_score and scoring breakdown
 */
function rankPriorityQueue(flags) {
  if (!flags || flags.length === 0) return [];

  const now = new Date();

  const scored = flags
    .filter(f => !f.resolved_status) // Only unresolved
    .map((flag) => {
      // 1. Category weight
      const categoryWeight = CATEGORY_WEIGHTS[flag.category] || CATEGORY_WEIGHTS.general;

      // 2. Days since raised
      const raisedAt = new Date(flag.raised_at);
      const daysSinceRaised = Math.max(0, Math.floor((now - raisedAt) / (1000 * 60 * 60 * 24)));
      const ageScore = Math.min(50, daysSinceRaised * 5); // 5 points per day, max 50

      // 3. Failed follow-up bonus
      const failedFollowups = flag.failed_followups || 0;
      const followupScore = Math.min(30, failedFollowups * 10); // 10 points per failure, max 30

      // 4. Risk level bonus
      const riskWeight = RISK_LEVEL_WEIGHTS[flag.risk_level] || 0;

      const totalScore = categoryWeight + ageScore + followupScore + riskWeight;

      // Build human-readable urgency label
      let urgency = 'Normal';
      if (totalScore >= 180) urgency = 'Critical';
      else if (totalScore >= 130) urgency = 'Urgent';
      else if (totalScore >= 80) urgency = 'High';

      return {
        ...flag,
        priority_score: totalScore,
        urgency_level: urgency,
        scoring_breakdown: {
          category_weight: { value: categoryWeight, reason: `Category: ${flag.category}` },
          age_score: { value: ageScore, reason: `${daysSinceRaised} day(s) since flag raised` },
          followup_score: { value: followupScore, reason: `${failedFollowups} failed follow-up(s)` },
          risk_bonus: { value: riskWeight, reason: flag.risk_level ? `Risk level: ${flag.risk_level}` : 'No risk level set' },
        },
      };
    });

  // Sort descending by priority_score
  scored.sort((a, b) => b.priority_score - a.priority_score);

  return scored;
}

module.exports = { rankPriorityQueue };
