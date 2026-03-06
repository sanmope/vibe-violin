/**
 * Note Converter Utilities
 * Converts RecognizedNote (from audio detection) to Note (app domain model).
 * Assigns violin string/finger positions and measure/beat placement.
 */

import type { Note, RecognizedNote, ViolinString } from '@/types';
import { FIRST_POSITION_NOTES } from './violinFirstPosition';

/**
 * Find the best violin position (string + finger) for a given pitch.
 * Prefers the simplest position (open strings, lower fingers).
 */
export function findBestViolinPosition(pitch: string): { violinString: ViolinString; fingerPosition: number } {
  const strings: ViolinString[] = ['E', 'A', 'D', 'G'];

  for (const str of strings) {
    const notes = FIRST_POSITION_NOTES[str];
    const match = notes.find(n => n.pitch === pitch && !n.isAlternative);
    if (match) {
      return { violinString: str, fingerPosition: match.finger };
    }
  }

  // Try alternative fingerings
  for (const str of strings) {
    const notes = FIRST_POSITION_NOTES[str];
    const match = notes.find(n => n.pitch === pitch);
    if (match) {
      return { violinString: str, fingerPosition: match.finger };
    }
  }

  // Default fallback for notes outside first position
  return { violinString: 'A', fingerPosition: 1 };
}

/**
 * Convert a RecognizedNote (from audio detection) to a Note (app domain model).
 */
export function recognizedNoteToNote(
  recognized: RecognizedNote,
  sequenceNumber: number
): Note {
  const position = recognized.violinString && recognized.fingerPosition !== undefined
    ? { violinString: recognized.violinString, fingerPosition: recognized.fingerPosition }
    : findBestViolinPosition(recognized.pitch);

  return {
    id: recognized.id,
    sequenceNumber,
    pitch: recognized.pitch,
    octave: recognized.octave,
    duration: recognized.duration,
    durationBeats: recognized.durationBeats,
    measure: 1,
    beat: 1,
    positionInMeasure: 0,
    violinString: position.violinString,
    fingerPosition: position.fingerPosition,
    handPosition: 1,
    bowDirection: sequenceNumber % 2 === 0 ? 'DOWN' : 'UP',
    bowPortion: 'MIDDLE',
    technique: 'DETACHE',
  };
}

/**
 * Assign measure and beat numbers to a list of notes based on time signature.
 */
export function assignMeasureAndBeat(
  notes: Note[],
  beatsPerMeasure: number = 4
): Note[] {
  let currentMeasure = 1;
  let currentBeat = 1;

  return notes.map((note, index) => {
    const updatedNote = {
      ...note,
      measure: currentMeasure,
      beat: currentBeat,
      positionInMeasure: index,
    };

    currentBeat += note.durationBeats;
    while (currentBeat > beatsPerMeasure) {
      currentBeat -= beatsPerMeasure;
      currentMeasure++;
    }

    return updatedNote;
  });
}

/**
 * Convert a list of RecognizedNotes to domain Notes with measure/beat assignment.
 */
export function recognizedNotesToNotes(
  recognized: RecognizedNote[],
  beatsPerMeasure: number = 4
): Note[] {
  const rawNotes = recognized.map((r, i) => recognizedNoteToNote(r, i + 1));
  return assignMeasureAndBeat(rawNotes, beatsPerMeasure);
}
