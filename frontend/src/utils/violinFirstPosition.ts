/**
 * First Position Notes for Violin
 * Defines all possible notes in first position, including alternative fingerings
 */

import type { ViolinString } from '@/types';
import { VIOLIN_TUNING as _VIOLIN_TUNING } from '@/types';
import { getPositionForPitch } from './violinFingerboard';

/**
 * Note position in first position
 */
export interface FirstPositionNote {
  /** Pitch of the note (e.g., "A4", "F#4") */
  pitch: string;
  
  /** Which finger (0 = open, 1-4 = fingers) */
  finger: number;
  
  /** Position on fingerboard (0-1, where 0 is nut) */
  position: number;
  
  /** Which string */
  string: ViolinString;
  
  /** Whether this is an alternative/optional fingering */
  isAlternative?: boolean;
}

/**
 * All notes in first position for each string
 * Based on the reference image showing all first position notes
 * Note: Some fingers have two positions (e.g., finger 1 can be low or high)
 */
export const FIRST_POSITION_NOTES: Record<ViolinString, FirstPositionNote[]> = {
  // G string (G3) - Row 1: G, Row 2: G#, Row 3: A, Row 4: A#, Row 5: B, Row 6: C, Row 7: C#, Row 8: D
  G: [
    { pitch: 'G3', finger: 0, position: 0, string: 'G' }, // Open - Row 1
    { pitch: 'G#3', finger: 1, position: 0, string: 'G', isAlternative: true }, // Low 1 - Row 2
    { pitch: 'A3', finger: 1, position: 0, string: 'G' }, // High 1 - Row 3
    { pitch: 'A#3', finger: 2, position: 0, string: 'G' }, // Row 4
    { pitch: 'B3', finger: 2, position: 0, string: 'G', isAlternative: true }, // Low 2 - Row 5
    { pitch: 'C4', finger: 3, position: 0, string: 'G' }, // Row 6
    { pitch: 'C#4', finger: 3, position: 0, string: 'G', isAlternative: true }, // Low 3 - Row 7
    { pitch: 'D4', finger: 4, position: 0, string: 'G' }, // Row 8
  ],
  
  // D string (D4) - Row 1: D, Row 2: D#, Row 3: E, Row 4: F, Row 5: F#, Row 6: G, Row 7: G#, Row 8: A
  D: [
    { pitch: 'D4', finger: 0, position: 0, string: 'D' }, // Open - Row 1
    { pitch: 'D#4', finger: 1, position: 0, string: 'D', isAlternative: true }, // Low 1 - Row 2
    { pitch: 'E4', finger: 1, position: 0, string: 'D' }, // High 1 - Row 3
    { pitch: 'F4', finger: 2, position: 0, string: 'D' }, // Row 4
    { pitch: 'F#4', finger: 2, position: 0, string: 'D', isAlternative: true }, // Low 2 - Row 5
    { pitch: 'G4', finger: 3, position: 0, string: 'D' }, // Row 6
    { pitch: 'G#4', finger: 3, position: 0, string: 'D', isAlternative: true }, // Low 3 - Row 7
    { pitch: 'A4', finger: 4, position: 0, string: 'D' }, // Row 8
  ],
  
  // A string (A4) - Row 1: A, Row 2: A#, Row 3: B, Row 4: C, Row 5: C#, Row 6: D, Row 7: D#, Row 8: E
  A: [
    { pitch: 'A4', finger: 0, position: 0, string: 'A' }, // Open - Row 1
    { pitch: 'A#4', finger: 1, position: 0, string: 'A', isAlternative: true }, // Low 1 - Row 2
    { pitch: 'B4', finger: 1, position: 0, string: 'A' }, // High 1 - Row 3
    { pitch: 'C5', finger: 2, position: 0, string: 'A' }, // Row 4
    { pitch: 'C#5', finger: 2, position: 0, string: 'A', isAlternative: true }, // Low 2 - Row 5
    { pitch: 'D5', finger: 3, position: 0, string: 'A' }, // Row 6
    { pitch: 'D#5', finger: 3, position: 0, string: 'A', isAlternative: true }, // Low 3 - Row 7
    { pitch: 'E5', finger: 4, position: 0, string: 'A' }, // Row 8
  ],
  
  // E string (E5) - Row 1: E, Row 2: F, Row 3: F#, Row 4: G, Row 5: G#, Row 6: A, Row 7: A#, Row 8: B
  E: [
    { pitch: 'E5', finger: 0, position: 0, string: 'E' }, // Open - Row 1
    { pitch: 'F5', finger: 1, position: 0, string: 'E' }, // Row 2
    { pitch: 'F#5', finger: 1, position: 0, string: 'E', isAlternative: true }, // Low 1 - Row 3
    { pitch: 'G5', finger: 2, position: 0, string: 'E' }, // Row 4
    { pitch: 'G#5', finger: 2, position: 0, string: 'E', isAlternative: true }, // Low 2 - Row 5
    { pitch: 'A5', finger: 3, position: 0, string: 'E' }, // Row 6
    { pitch: 'A#5', finger: 3, position: 0, string: 'E', isAlternative: true }, // Low 3 - Row 7
    { pitch: 'B5', finger: 4, position: 0, string: 'E' }, // Row 8
  ],
};

/**
 * Calculate actual positions for all first position notes
 */
export function calculateFirstPositionNotes(): Record<ViolinString, FirstPositionNote[]> {
  const result: Record<ViolinString, FirstPositionNote[]> = {
    G: [],
    D: [],
    A: [],
    E: [],
  };

  (Object.keys(FIRST_POSITION_NOTES) as ViolinString[]).forEach((string) => {
    result[string] = FIRST_POSITION_NOTES[string].map((note) => {
      // Calculate actual position based on pitch
      const position = getPositionForPitch(string, note.pitch);
      return {
        ...note,
        position,
      };
    });
  });

  return result;
}

/**
 * Get all notes for a specific string in first position
 * Calculates actual positions based on pitch frequencies
 */
export function getFirstPositionNotesForString(string: ViolinString): FirstPositionNote[] {
  const notes = FIRST_POSITION_NOTES[string];
  return notes.map((note) => {
    // Calculate actual position based on pitch - this gives different positions
    // for alternative fingerings (e.g., F and F# on A string, both finger 1)
    const position = getPositionForPitch(string, note.pitch);
    return {
      ...note,
      position,
    };
  });
}

