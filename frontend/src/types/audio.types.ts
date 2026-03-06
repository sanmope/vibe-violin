/**
 * Audio-related type definitions for real-time pitch detection and practice evaluation.
 */

import type { NoteDuration, Pitch } from './music.types';
import type { ViolinString } from './violin.types';

/**
 * Raw result from pitch detection algorithm
 */
export interface PitchDetectionResult {
  /** Detected frequency in Hz, or null if no clear pitch */
  frequency: number | null;
  /** Clarity/confidence of detection (0-1) */
  clarity: number;
  /** RMS amplitude of the audio frame (0-1 range typical) */
  rms: number;
  /** Timestamp of detection */
  timestamp: number;
}

/**
 * A detected note with musical information derived from frequency
 */
export interface DetectedNote {
  /** Frequency in Hz */
  frequency: number;
  /** Note name with octave (e.g., "A4", "C#5") */
  pitch: Pitch;
  /** Deviation from perfect pitch in cents (-50 to +50) */
  centsDeviation: number;
  /** Octave number */
  octave: number;
  /** Clarity/confidence (0-1) */
  clarity: number;
  /** RMS amplitude of the audio frame */
  rms: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * A recognized musical note accumulated from multiple detection frames
 */
export interface RecognizedNote {
  /** Unique ID */
  id: string;
  /** Most common pitch detected */
  pitch: Pitch;
  /** Average frequency */
  averageFrequency: number;
  /** Average cents deviation */
  averageCentsDeviation: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Quantized musical duration */
  duration: NoteDuration;
  /** Duration in beats */
  durationBeats: number;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Octave */
  octave: number;
  /** Suggested violin string */
  violinString?: ViolinString;
  /** Suggested finger position */
  fingerPosition?: number;
}

/**
 * Evaluation of a single played note against an expected note
 */
export interface NoteEvaluation {
  /** Expected note pitch */
  expectedPitch: Pitch;
  /** Actually played pitch */
  playedPitch: Pitch;
  /** Pitch accuracy score (0-100) */
  pitchScore: number;
  /** Timing accuracy score (0-100) */
  timingScore: number;
  /** Combined score (0-100) */
  overallScore: number;
  /** Cents deviation from expected */
  centsDeviation: number;
  /** Whether pitch was correct (within tolerance) */
  isPitchCorrect: boolean;
  /** Rating based on score */
  rating: 'correct' | 'close' | 'wrong';
}

/**
 * Overall evaluation of a practice session
 */
export interface PracticeEvaluation {
  /** Total number of notes evaluated */
  totalNotes: number;
  /** Number of correct notes */
  correctNotes: number;
  /** Number of close notes */
  closeNotes: number;
  /** Number of wrong notes */
  wrongNotes: number;
  /** Average pitch accuracy (0-100) */
  averagePitchScore: number;
  /** Average timing accuracy (0-100) */
  averageTimingScore: number;
  /** Overall score (0-100) */
  overallScore: number;
  /** Individual note evaluations */
  noteEvaluations: NoteEvaluation[];
}
