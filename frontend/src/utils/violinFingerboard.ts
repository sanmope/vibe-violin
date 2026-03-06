/**
 * Violin Fingerboard Utilities
 * Calculates exact fingerboard positions based on real violin physics
 */

import type { ViolinString, FingerNumber } from '@/types';
import { VIOLIN_TUNING } from '@/types';

/**
 * Standard violin scale length in millimeters
 * Distance from nut to bridge
 */
const SCALE_LENGTH_MM = 328;

/**
 * Calculate frequency of a note from pitch string (e.g., "A4", "C#5")
 */
export function pitchToFrequency(pitch: string): number {
  // Parse pitch: note name + octave (e.g., "A4", "C#5", "Bb3")
  const match = pitch.match(/^([A-G])([#b]?)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid pitch format: ${pitch}`);
  }

  const [, note, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  // Semitones from C in each octave
  const noteToSemitones: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11,
  };

  let noteKey = note;
  if (accidental === '#') {
    noteKey = `${note}#`;
  } else if (accidental === 'b') {
    noteKey = `${note}b`;
  }

  const semitonesFromC = noteToSemitones[noteKey] || 0;
  const semitonesFromA4 = semitonesFromC - 9 + (octave - 4) * 12;
  
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * Calculate the position on the fingerboard (in mm from nut) for a given frequency
 * Formula: position = scale_length * (1 - (f0 / f1))
 * where f0 is open string frequency and f1 is target frequency
 */
export function frequencyToPosition(
  openStringFreq: number,
  targetFreq: number,
  scaleLength: number = SCALE_LENGTH_MM
): number {
  return scaleLength * (1 - openStringFreq / targetFreq);
}

/**
 * Get the pitch for a finger position on a string
 * Standard positions in first position:
 * - 0: Open string
 * - 1: Whole step up (2 semitones)
 * - 2: Whole step + half step (3 semitones)
 * - 3: Two whole steps (4 semitones)
 * - 4: Two whole steps + half step (5 semitones)
 */
export function getPitchForFinger(
  string: ViolinString,
  finger: FingerNumber,
  handPosition: number = 1
): string {
  const openStringPitch = VIOLIN_TUNING[string].pitch;
  const openStringFreq = VIOLIN_TUNING[string].frequency;

  if (finger === 0) {
    return openStringPitch;
  }

  // Calculate semitones from open string
  // In first position: finger 1 = 2 semitones, finger 2 = 3, finger 3 = 4, finger 4 = 5
  // Each position shift adds 5 semitones (a perfect fourth)
  const semitonesFromOpen = finger + 1 + (handPosition - 1) * 5;
  
  // Calculate target frequency
  const targetFreq = openStringFreq * Math.pow(2, semitonesFromOpen / 12);
  
  // Convert back to pitch
  return calculatePitchFromFrequency(targetFreq).pitch;
}

/**
 * Calculate pitch name from frequency
 * Returns both the pitch string and the exact frequency of that note
 */
export function calculatePitchFromFrequency(freq: number): { pitch: string; exactFrequency: number } {
  const semitonesFromA4 = 12 * Math.log2(freq / 440);
  const roundedSemitones = Math.round(semitonesFromA4);
  const noteIndex = ((roundedSemitones % 12) + 12 + 9) % 12; // +9 to offset from A-based to C-based index
  const octave = 4 + Math.floor((roundedSemitones + 9) / 12);

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const pitch = `${notes[noteIndex]}${octave}`;
  const exactFrequency = 440 * Math.pow(2, roundedSemitones / 12);
  return { pitch, exactFrequency };
}

/**
 * Get the exact position (in percentage from nut) for a finger on a string
 * Returns a value between 0 (nut) and 1 (bridge)
 */
export function getFingerPosition(
  string: ViolinString,
  finger: FingerNumber,
  handPosition: number = 1
): number {
  if (finger === 0) {
    return 0; // Open string at nut
  }

  const openStringFreq = VIOLIN_TUNING[string].frequency;
  
  // Calculate semitones from open string
  // In first position: finger 1 = 2 semitones, finger 2 = 3, finger 3 = 4, finger 4 = 5
  // Each position shift adds 5 semitones (a perfect fourth)
  const semitonesFromOpen = finger + 1 + (handPosition - 1) * 5;
  const targetFreq = openStringFreq * Math.pow(2, semitonesFromOpen / 12);
  
  // Calculate position in mm
  const positionMm = frequencyToPosition(openStringFreq, targetFreq);
  
  // Convert to percentage (0 = nut, 1 = bridge)
  return positionMm / SCALE_LENGTH_MM;
}

/**
 * Get all finger positions for a string in a given hand position
 */
export function getFingerPositionsForString(
  string: ViolinString,
  handPosition: number = 1
): Array<{ finger: FingerNumber; position: number; pitch: string }> {
  return [0, 1, 2, 3, 4].map((finger) => {
    const position = getFingerPosition(string, finger as FingerNumber, handPosition);
    const pitch = getPitchForFinger(string, finger as FingerNumber, handPosition);
    return { finger: finger as FingerNumber, position, pitch };
  });
}

/**
 * Get position for a specific note pitch on a string
 */
export function getPositionForPitch(
  string: ViolinString,
  pitch: string
): number {
  const openStringFreq = VIOLIN_TUNING[string].frequency;
  const targetFreq = pitchToFrequency(pitch);
  const positionMm = frequencyToPosition(openStringFreq, targetFreq);
  return positionMm / SCALE_LENGTH_MM;
}

