/**
 * Violin Detection Utilities
 * Validates whether detected audio is likely from a violin based on frequency range and clarity.
 */

/** Violin lowest open string: G3 = 196 Hz */
const VIOLIN_MIN_FREQ = 196;

/** Violin highest practical note: E7 ~= 2637 Hz */
const VIOLIN_MAX_FREQ = 2637;

/** Minimum clarity for violin detection */
const VIOLIN_CLARITY_THRESHOLD = 0.8;

/**
 * Check if a frequency falls within the violin's playable range (G3-E7)
 */
export function isViolinFrequencyRange(frequency: number): boolean {
  return frequency >= VIOLIN_MIN_FREQ && frequency <= VIOLIN_MAX_FREQ;
}

/**
 * Assess how likely the detected sound is from a violin.
 * Combines frequency range check with clarity threshold.
 * Returns a score from 0 to 1.
 */
export function assessViolinLikelihood(frequency: number, clarity: number): number {
  if (!isViolinFrequencyRange(frequency)) {
    return 0;
  }

  if (clarity < VIOLIN_CLARITY_THRESHOLD) {
    return 0;
  }

  // Score based on clarity above threshold
  const clarityScore = (clarity - VIOLIN_CLARITY_THRESHOLD) / (1 - VIOLIN_CLARITY_THRESHOLD);

  // Slight penalty for extreme edges of range
  let rangeScore = 1;
  if (frequency < 220) {
    // Below A3 - lower end of G string
    rangeScore = 0.8;
  } else if (frequency > 2000) {
    // Very high positions
    rangeScore = 0.85;
  }

  return clarityScore * rangeScore;
}
