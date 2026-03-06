/**
 * Music-related type definitions for the Vibe application.
 * These types represent musical concepts and notation.
 */

import type { ViolinString, BowDirection, BowPortion, BowTechnique } from './violin.types';

/**
 * Standard note durations in Western music notation
 */
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirty-second';

/**
 * Musical pitches with octave notation (e.g., "A4", "C#5")
 */
export type Pitch = string;

/**
 * Time signature representation (e.g., "4/4", "3/4", "6/8")
 */
export type TimeSignature = string;

/**
 * Key signature representation (e.g., "C major", "G minor", "D♭ major")
 */
export type KeySignature = string;

/**
 * Musical articulations and accents
 */
export type Articulation =
  | 'staccato'
  | 'accent'
  | 'tenuto'
  | 'marcato'
  | 'fermata'
  | 'trill'
  | '';

/**
 * Dynamic markings (volume/intensity)
 */
export type Dynamic =
  | 'ppp' | 'pp' | 'p'
  | 'mp' | 'mf'
  | 'f' | 'ff' | 'fff'
  | '';

/**
 * Represents a single musical note with all its properties
 */
export interface Note {
  /** Unique identifier for this note */
  id: string;

  /** Sequential position in the piece (0-indexed) */
  sequenceNumber: number;

  /** Musical pitch (e.g., "A4", "C#5") */
  pitch: Pitch;

  /** Octave number */
  octave: number;

  /** Note duration type */
  duration: NoteDuration;

  /** Duration in beats (e.g., 1.0 for quarter note in 4/4) */
  durationBeats: number;

  /** Measure/bar number (1-indexed) */
  measure: number;

  /** Beat position within the measure (1-indexed) */
  beat: number;

  /** Position within the measure (0-indexed) */
  positionInMeasure: number;

  /** Violin-specific string this note is played on */
  violinString: ViolinString;

  /** Finger position (0=open string, 1-4=fingers) */
  fingerPosition: number;

  /** Hand position on the fingerboard (1st position, 2nd position, etc.) */
  handPosition: number;

  /** Direction of the bow stroke */
  bowDirection: BowDirection;

  /** Which part of the bow to use */
  bowPortion: BowPortion;

  /** Bowing technique to apply */
  technique: BowTechnique;

  /** Optional articulation marking */
  articulation?: Articulation;

  /** Optional dynamic marking */
  dynamic?: Dynamic;
}

/**
 * Represents a complete piece of sheet music
 */
export interface SheetMusic {
  /** Unique identifier */
  id: string;

  /** Title of the piece */
  title: string;

  /** Composer name */
  composer: string;

  /** Key signature */
  keySignature: KeySignature;

  /** Time signature */
  timeSignature: TimeSignature;

  /** Default tempo in BPM */
  tempo: number;

  /** Processing status of the sheet music */
  status: ProcessingStatus;

  /** When the sheet music was uploaded */
  createdAt: string;

  /** Last modification timestamp */
  updatedAt: string;

  /** Optional thumbnail image URL */
  thumbnail?: string;

  /** Optional PDF file URL */
  pdfUrl?: string;

  /** Array of notes (may be loaded separately) */
  notes?: Note[];

  /** Optional error message if processing failed */
  error?: string;
}

/**
 * Processing status for uploaded sheet music
 */
export type ProcessingStatus =
  | 'UPLOADED'    // Just uploaded, not yet processed
  | 'PROCESSING'  // Currently being processed
  | 'READY'       // Successfully processed and ready to use
  | 'ERROR';      // Processing failed

/**
 * Violin-specific types (re-exported from violin.types.ts)
 */
export type {
  ViolinString,
  BowDirection,
  BowPortion,
  BowTechnique
} from './violin.types';
