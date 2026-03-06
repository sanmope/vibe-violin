/**
 * Violin-specific type definitions.
 * These types represent violin playing techniques and positions.
 */

/**
 * The four strings of a violin, from lowest to highest pitch.
 * Standard tuning: G3, D4, A4, E5
 */
export type ViolinString = 'G' | 'D' | 'A' | 'E';

/**
 * Direction of bow stroke.
 * - DOWN: Bow moves from frog to tip (symbol: ⌐ or ∏)
 * - UP: Bow moves from tip to frog (symbol: V)
 */
export type BowDirection = 'DOWN' | 'UP';

/**
 * Which portion of the bow to use for the stroke.
 * - FROG: Near the frog/heel (stronger, more weight)
 * - MIDDLE: Middle of the bow (balanced)
 * - TIP: Near the tip/point (lighter, more delicate)
 * - WHOLE: Use the entire bow length
 */
export type BowPortion = 'FROG' | 'MIDDLE' | 'TIP' | 'WHOLE';

/**
 * Bowing technique/articulation.
 * Different ways to play notes with the bow.
 */
export type BowTechnique =
  | 'DETACHE'    // Separate bow strokes, smooth and connected
  | 'LEGATO'     // Multiple notes in one bow stroke, very smooth
  | 'STACCATO'   // Short, detached notes
  | 'SPICCATO'   // Bouncing bow off the string
  | 'PIZZICATO'  // Plucking the string with finger
  | 'TREMOLO'    // Rapid back-and-forth bowing
  | 'MARTELE'    // Hammered stroke with strong accent
  | 'COL_LEGNO'; // Using the wood of the bow

/**
 * Hand position on the fingerboard.
 * Higher positions are closer to the bridge.
 */
export type HandPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Finger numbers used in violin playing.
 * 0 = open string (no finger pressed)
 * 1-4 = index through pinky fingers
 */
export type FingerNumber = 0 | 1 | 2 | 3 | 4;

/**
 * Represents a specific position on the violin fingerboard
 */
export interface FingerboardPosition {
  /** Which string */
  string: ViolinString;

  /** Which finger (0 = open) */
  finger: FingerNumber;

  /** Which position (1st, 2nd, etc.) */
  position: HandPosition;
}

/**
 * Complete bowing information for a note
 */
export interface BowingInfo {
  /** Direction of the bow stroke */
  direction: BowDirection;

  /** Which part of the bow to use */
  portion: BowPortion;

  /** Technique to apply */
  technique: BowTechnique;

  /** Optional pressure/weight indication (0-1, where 1 is maximum) */
  pressure?: number;

  /** Optional speed indication (0-1, where 1 is fastest) */
  speed?: number;
}

/**
 * Finger position visualization highlighting
 */
export interface PositionHighlight {
  /** Which string to highlight */
  string: ViolinString;

  /** Which finger position to highlight */
  finger: FingerNumber;

  /** Optional: emphasize this position (e.g., for current note) */
  emphasized?: boolean;
}

/**
 * String tuning information
 */
export interface StringTuning {
  string: ViolinString;
  pitch: string;
  frequency: number; // in Hz
}

/**
 * Standard violin tuning
 */
export const VIOLIN_TUNING: Record<ViolinString, StringTuning> = {
  G: { string: 'G', pitch: 'G3', frequency: 196.00 },
  D: { string: 'D', pitch: 'D4', frequency: 293.66 },
  A: { string: 'A', pitch: 'A4', frequency: 440.00 },
  E: { string: 'E', pitch: 'E5', frequency: 659.25 },
};

/**
 * Helper to get the order of strings from low to high
 */
export const STRING_ORDER: ViolinString[] = ['G', 'D', 'A', 'E'];

/**
 * Helper to get the order of strings for visual display (high to low)
 */
export const STRING_ORDER_VISUAL: ViolinString[] = ['E', 'A', 'D', 'G'];
