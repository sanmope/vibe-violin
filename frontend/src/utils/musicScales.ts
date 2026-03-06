/**
 * Music Scales Utilities
 * Defines common scales and their notes
 */

/**
 * Represents a musical scale
 */
export interface Scale {
  /** Name of the scale (e.g., "C Major", "A Minor") */
  name: string;
  
  /** Root note of the scale (e.g., "C", "A") */
  root: string;
  
  /** Type of scale */
  type: 'major' | 'minor' | 'harmonic-minor' | 'melodic-minor';
  
  /** Notes in the scale (without octave, e.g., ["C", "D", "E", "F", "G", "A", "B"]) */
  notes: string[];
  
  /** All pitches in the scale across multiple octaves (e.g., ["C4", "D4", "E4", ...]) */
  pitches: string[];
}

/**
 * Get all notes in a scale starting from a root note
 */
function getScaleNotes(root: string, intervals: number[]): string[] {
  const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIndex = chromatic.indexOf(root);
  
  if (rootIndex === -1) {
    // Handle flats
    const flatMap: Record<string, string> = {
      'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    const mappedRoot = flatMap[root] || root;
    return getScaleNotes(mappedRoot, intervals);
  }
  
  const notes: string[] = [];
  intervals.forEach(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    notes.push(chromatic[noteIndex]);
  });
  
  return notes;
}

/**
 * Generate pitches for a scale across multiple octaves
 */
function generateScalePitches(notes: string[], rootOctave: number = 4): string[] {
  const pitches: string[] = [];
  
  // Generate for 3 octaves (3, 4, 5)
  for (let octave = rootOctave - 1; octave <= rootOctave + 1; octave++) {
    notes.forEach(note => {
      pitches.push(`${note}${octave}`);
    });
  }
  
  return pitches;
}

/**
 * Major scale intervals: W-W-H-W-W-W-H (2-2-1-2-2-2-1 semitones)
 */
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

/**
 * Natural minor scale intervals: W-H-W-W-H-W-W (2-1-2-2-1-2-2 semitones)
 */
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

/**
 * Harmonic minor scale intervals: W-H-W-W-H-A2-H (2-1-2-2-1-3-1 semitones)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const HARMONIC_MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 11];

/**
 * Common scales for violin practice
 */
export const COMMON_SCALES: Scale[] = [
  // Major scales
  {
    name: 'C Major',
    root: 'C',
    type: 'major',
    notes: getScaleNotes('C', MAJOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('C', MAJOR_INTERVALS), 4),
  },
  {
    name: 'G Major',
    root: 'G',
    type: 'major',
    notes: getScaleNotes('G', MAJOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('G', MAJOR_INTERVALS), 4),
  },
  {
    name: 'D Major',
    root: 'D',
    type: 'major',
    notes: getScaleNotes('D', MAJOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('D', MAJOR_INTERVALS), 4),
  },
  {
    name: 'A Major',
    root: 'A',
    type: 'major',
    notes: getScaleNotes('A', MAJOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('A', MAJOR_INTERVALS), 4),
  },
  {
    name: 'E Major',
    root: 'E',
    type: 'major',
    notes: getScaleNotes('E', MAJOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('E', MAJOR_INTERVALS), 4),
  },
  {
    name: 'F Major',
    root: 'F',
    type: 'major',
    notes: getScaleNotes('F', MAJOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('F', MAJOR_INTERVALS), 4),
  },
  {
    name: 'Bb Major',
    root: 'Bb',
    type: 'major',
    notes: getScaleNotes('Bb', MAJOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('Bb', MAJOR_INTERVALS), 4),
  },
  
  // Minor scales
  {
    name: 'A Minor',
    root: 'A',
    type: 'minor',
    notes: getScaleNotes('A', MINOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('A', MINOR_INTERVALS), 4),
  },
  {
    name: 'E Minor',
    root: 'E',
    type: 'minor',
    notes: getScaleNotes('E', MINOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('E', MINOR_INTERVALS), 4),
  },
  {
    name: 'D Minor',
    root: 'D',
    type: 'minor',
    notes: getScaleNotes('D', MINOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('D', MINOR_INTERVALS), 4),
  },
  {
    name: 'G Minor',
    root: 'G',
    type: 'minor',
    notes: getScaleNotes('G', MINOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('G', MINOR_INTERVALS), 4),
  },
  {
    name: 'C Minor',
    root: 'C',
    type: 'minor',
    notes: getScaleNotes('C', MINOR_INTERVALS),
    pitches: generateScalePitches(getScaleNotes('C', MINOR_INTERVALS), 4),
  },
];

/**
 * Normalize note name for comparison (handles enharmonic equivalents)
 */
function normalizeNoteName(note: string): string {
  // Remove octave if present
  const noteOnly = note.replace(/\d+$/, '');
  
  // Map flats to sharps for comparison
  const enharmonicMap: Record<string, string> = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#',
  };
  
  // Check if it's a flat note
  if (noteOnly.length === 2 && noteOnly[1] === 'b') {
    return enharmonicMap[noteOnly] || noteOnly;
  }
  
  return noteOnly;
}

/**
 * Check if a pitch is in a scale
 */
export function isPitchInScale(pitch: string, scale: Scale | null): boolean {
  if (!scale) return true; // If no scale selected, show all notes
  
  // Normalize the pitch note name
  const normalizedPitch = normalizeNoteName(pitch);
  
  // Check if the note (without octave) is in the scale
  return scale.notes.some(note => {
    const normalizedNote = normalizeNoteName(note);
    return normalizedPitch === normalizedNote;
  });
}

/**
 * Get scale by name
 */
export function getScaleByName(name: string): Scale | null {
  return COMMON_SCALES.find(scale => scale.name === name) || null;
}

/**
 * A candidate key/scale match from key detection
 */
export interface KeyCandidate {
  scale: Scale;
  score: number;
  matchingPitches: string[];
  nonMatchingPitches: string[];
}

/**
 * Result of automatic key detection
 */
export interface KeyDetectionResult {
  bestMatch: KeyCandidate;
  candidates: KeyCandidate[];
  isConfident: boolean;
  pitchClassCount: number;
}

/**
 * Detect the most likely key/scale from an array of pitch strings (e.g. ["C4", "D4", "E4"])
 */
export function detectKey(pitches: string[]): KeyDetectionResult | null {
  if (pitches.length === 0) return null;

  // Extract unique pitch classes (without octave), normalized
  const pitchClasses = new Set<string>();
  pitches.forEach(p => {
    pitchClasses.add(normalizeNoteName(p));
  });

  const uniquePitches = Array.from(pitchClasses);
  const pitchClassCount = uniquePitches.length;

  if (pitchClassCount === 0) return null;

  // Score each scale
  const candidates: KeyCandidate[] = COMMON_SCALES.map(scale => {
    const scaleNotes = scale.notes.map(n => normalizeNoteName(n));
    const matchingPitches: string[] = [];
    const nonMatchingPitches: string[] = [];

    uniquePitches.forEach(pc => {
      if (scaleNotes.includes(pc)) {
        matchingPitches.push(pc);
      } else {
        nonMatchingPitches.push(pc);
      }
    });

    const score = pitchClassCount > 0 ? matchingPitches.length / pitchClassCount : 0;
    return { scale, score, matchingPitches, nonMatchingPitches };
  });

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  const topScore = candidates[0].score;
  const secondScore = candidates.length > 1 ? candidates[1].score : 0;
  const gap = topScore - secondScore;

  const isConfident = pitchClassCount >= 4 && topScore >= 0.8 && gap >= 0.15;

  return {
    bestMatch: candidates[0],
    candidates,
    isConfident,
    pitchClassCount,
  };
}

/**
 * Convert a Scale to VexFlow key signature format (e.g. "D", "Gm", "Bb", "Ebm")
 */
export function scaleToVexflowKeySpec(scale: Scale): string {
  const root = scale.root;
  const isMinor = scale.type === 'minor' || scale.type === 'harmonic-minor' || scale.type === 'melodic-minor';
  return isMinor ? `${root}m` : root;
}

