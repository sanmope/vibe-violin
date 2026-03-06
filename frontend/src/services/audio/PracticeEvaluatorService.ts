/**
 * Practice Evaluator Service
 * Compares played notes against expected notes and produces accuracy scores.
 * Score: 70% pitch accuracy + 30% timing accuracy.
 */

import type { Note, RecognizedNote, NoteEvaluation, PracticeEvaluation } from '@/types';
import { calculateCentsDeviation } from '@/utils/pitchDetection';
import { pitchToFrequency } from '@/utils/violinFingerboard';

/** Weight for pitch accuracy in overall score */
const PITCH_WEIGHT = 0.7;
/** Weight for timing accuracy in overall score */
const TIMING_WEIGHT = 0.3;
/** Cents deviation beyond which the note is completely wrong */
const MAX_CENTS_FOR_WRONG = 50;
/** Cents penalty per cent of deviation */
const CENTS_PENALTY = 5;
/** Timing tolerance percentage (within this % of expected = perfect timing) */
const TIMING_TOLERANCE = 0.2;

export class PracticeEvaluatorService {
  private expectedNotes: Note[] = [];
  private currentIndex = 0;
  private evaluations: NoteEvaluation[] = [];

  /**
   * Set the expected notes sequence for evaluation
   */
  loadExpectedNotes(notes: Note[]): void {
    this.expectedNotes = [...notes];
    this.currentIndex = 0;
    this.evaluations = [];
  }

  /**
   * Get the current expected note
   */
  getCurrentExpectedNote(): Note | null {
    if (this.currentIndex >= this.expectedNotes.length) return null;
    return this.expectedNotes[this.currentIndex];
  }

  /**
   * Get the current note index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Check if evaluation is complete
   */
  isComplete(): boolean {
    return this.currentIndex >= this.expectedNotes.length;
  }

  /**
   * Evaluate a played note against the current expected note.
   * Advances to the next expected note after evaluation.
   */
  evaluateNote(played: RecognizedNote): NoteEvaluation | null {
    const expected = this.getCurrentExpectedNote();
    if (!expected) return null;

    const pitchScore = this.calculatePitchScore(expected, played);
    const timingScore = this.calculateTimingScore(expected, played);
    const overallScore = pitchScore * PITCH_WEIGHT + timingScore * TIMING_WEIGHT;

    const playedPitchFull = `${played.pitch}${played.octave}`;
    const expectedPitchFull = `${expected.pitch}${expected.octave}`;

    // Calculate actual cents deviation
    let centsDeviation = 0;
    try {
      const expectedFreq = pitchToFrequency(expectedPitchFull);
      centsDeviation = calculateCentsDeviation(played.averageFrequency, expectedPitchFull);

      // If the played note is a completely different note, use a large deviation
      if (playedPitchFull !== expectedPitchFull) {
        centsDeviation = 1200 * Math.log2(played.averageFrequency / expectedFreq);
      }
    } catch {
      centsDeviation = 100;
    }

    const rating: NoteEvaluation['rating'] =
      overallScore >= 80 ? 'correct' :
      overallScore >= 50 ? 'close' :
      'wrong';

    const evaluation: NoteEvaluation = {
      expectedPitch: expected.pitch,
      playedPitch: played.pitch,
      pitchScore,
      timingScore,
      overallScore,
      centsDeviation,
      isPitchCorrect: Math.abs(centsDeviation) <= MAX_CENTS_FOR_WRONG,
      rating,
    };

    this.evaluations.push(evaluation);
    this.currentIndex++;

    return evaluation;
  }

  /**
   * Get the overall practice evaluation summary
   */
  getOverallEvaluation(): PracticeEvaluation {
    const total = this.evaluations.length;
    if (total === 0) {
      return {
        totalNotes: 0,
        correctNotes: 0,
        closeNotes: 0,
        wrongNotes: 0,
        averagePitchScore: 0,
        averageTimingScore: 0,
        overallScore: 0,
        noteEvaluations: [],
      };
    }

    const correct = this.evaluations.filter(e => e.rating === 'correct').length;
    const close = this.evaluations.filter(e => e.rating === 'close').length;
    const wrong = this.evaluations.filter(e => e.rating === 'wrong').length;

    const avgPitch = this.evaluations.reduce((sum, e) => sum + e.pitchScore, 0) / total;
    const avgTiming = this.evaluations.reduce((sum, e) => sum + e.timingScore, 0) / total;
    const avgOverall = this.evaluations.reduce((sum, e) => sum + e.overallScore, 0) / total;

    return {
      totalNotes: total,
      correctNotes: correct,
      closeNotes: close,
      wrongNotes: wrong,
      averagePitchScore: avgPitch,
      averageTimingScore: avgTiming,
      overallScore: avgOverall,
      noteEvaluations: [...this.evaluations],
    };
  }

  /**
   * Reset for a new evaluation session
   */
  reset(): void {
    this.currentIndex = 0;
    this.evaluations = [];
  }

  private calculatePitchScore(expected: Note, played: RecognizedNote): number {
    const expectedPitch = `${expected.pitch}${expected.octave}`;
    const playedPitch = `${played.pitch}${played.octave}`;

    // Exact match
    if (expectedPitch === playedPitch) {
      // Score based on cents deviation from perfect pitch
      const absCents = Math.abs(played.averageCentsDeviation);
      return Math.max(0, 100 - absCents * CENTS_PENALTY);
    }

    // Different note entirely
    try {
      const expectedFreq = pitchToFrequency(expectedPitch);
      const centsOff = Math.abs(1200 * Math.log2(played.averageFrequency / expectedFreq));

      if (centsOff <= MAX_CENTS_FOR_WRONG) {
        // Close enough - within a semitone
        return Math.max(0, 100 - centsOff * (CENTS_PENALTY / 2));
      }
    } catch {
      // Invalid pitch
    }

    return 0;
  }

  private calculateTimingScore(expected: Note, played: RecognizedNote): number {
    // Compare duration in beats
    const expectedBeats = expected.durationBeats;
    const playedBeats = played.durationBeats;

    if (expectedBeats === 0) return 100;

    const ratio = playedBeats / expectedBeats;
    const deviation = Math.abs(1 - ratio);

    if (deviation <= TIMING_TOLERANCE) {
      return 100;
    }

    // Scale proportionally beyond tolerance
    const excessDeviation = deviation - TIMING_TOLERANCE;
    return Math.max(0, 100 - excessDeviation * 200);
  }
}
