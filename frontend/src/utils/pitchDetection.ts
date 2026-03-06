/**
 * Pitch Detection using Autocorrelation
 * Analyzes audio data from AnalyserNode to detect fundamental frequency.
 */

import type { PitchDetectionResult, DetectedNote } from '@/types/audio.types';
import { calculatePitchFromFrequency } from './violinFingerboard';

/** Minimum clarity threshold to consider a valid pitch detection */
const CLARITY_THRESHOLD = 0.85;

/** Minimum frequency to detect (below violin range but with margin) */
const MIN_FREQUENCY = 80;

/** Maximum frequency to detect (above violin range but with margin) */
const MAX_FREQUENCY = 4200;

/**
 * Detect pitch from audio time-domain data using autocorrelation
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number
): PitchDetectionResult {
  const timestamp = performance.now();

  // Check if the signal has enough energy (not silence)
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);

  if (rms < 0.01) {
    return { frequency: null, clarity: 0, rms, timestamp };
  }

  // Autocorrelation
  const size = buffer.length;
  const correlation = new Float32Array(size);

  for (let lag = 0; lag < size; lag++) {
    let sum = 0;
    for (let i = 0; i < size - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
    }
    correlation[lag] = sum;
  }

  // Normalize by the zero-lag value
  const zeroLagValue = correlation[0];
  if (zeroLagValue === 0) {
    return { frequency: null, clarity: 0, rms, timestamp };
  }

  // Find the first significant peak after the initial decline
  // Convert frequency limits to lag limits
  const minLag = Math.floor(sampleRate / MAX_FREQUENCY);
  const maxLag = Math.floor(sampleRate / MIN_FREQUENCY);

  // Find the first dip (where correlation starts rising again)
  let foundDip = false;
  let dipLag = minLag;
  for (let i = minLag; i < maxLag; i++) {
    if (correlation[i] < correlation[i + 1]) {
      foundDip = true;
      dipLag = i;
      break;
    }
  }

  if (!foundDip) {
    return { frequency: null, clarity: 0, rms, timestamp };
  }

  // Find the highest peak after the dip
  let bestLag = dipLag;
  let bestCorrelation = correlation[dipLag];

  for (let i = dipLag; i < maxLag && i < size; i++) {
    if (correlation[i] > bestCorrelation) {
      bestCorrelation = correlation[i];
      bestLag = i;
    }
  }

  // Calculate clarity as ratio of peak to zero-lag
  const clarity = bestCorrelation / zeroLagValue;

  if (clarity < CLARITY_THRESHOLD) {
    return { frequency: null, clarity, rms, timestamp };
  }

  // Parabolic interpolation for sub-sample accuracy
  const prev = bestLag > 0 ? correlation[bestLag - 1] : correlation[bestLag];
  const curr = correlation[bestLag];
  const next = bestLag < size - 1 ? correlation[bestLag + 1] : correlation[bestLag];

  const denominator = 2 * curr - prev - next;
  const interpolatedLag = denominator !== 0
    ? bestLag + (prev - next) / (2 * denominator)
    : bestLag;

  const frequency = sampleRate / interpolatedLag;

  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
    return { frequency: null, clarity: 0, rms, timestamp };
  }

  return { frequency, clarity, rms, timestamp };
}

/**
 * Convert a frequency to a DetectedNote with musical information
 */
export function frequencyToDetectedNote(
  frequency: number,
  clarity: number,
  rms: number,
  timestamp: number
): DetectedNote {
  const pitchInfo = calculatePitchFromFrequency(frequency);
  const centsDeviation = calculateCentsDeviation(frequency, pitchInfo.pitch);

  // Extract octave from pitch string
  const octaveMatch = pitchInfo.pitch.match(/(\d+)$/);
  const octave = octaveMatch ? parseInt(octaveMatch[1], 10) : 4;

  return {
    frequency,
    pitch: pitchInfo.pitch,
    centsDeviation,
    octave,
    clarity,
    rms,
    timestamp,
  };
}

/**
 * Calculate cents deviation from the nearest perfect pitch
 */
export function calculateCentsDeviation(frequency: number, noteName: string): number {
  // Parse note name to get the exact frequency of the perfect pitch
  const match = noteName.match(/^([A-G])([#b]?)(\d+)$/);
  if (!match) return 0;

  const [, note, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  const noteToSemitones: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11,
  };

  const noteKey = accidental ? `${note}${accidental}` : note;
  const semitonesFromC = noteToSemitones[noteKey] || 0;
  const semitonesFromA4 = semitonesFromC - 9 + (octave - 4) * 12;
  const perfectFrequency = 440 * Math.pow(2, semitonesFromA4 / 12);

  // Cents = 1200 * log2(f1/f2)
  return 1200 * Math.log2(frequency / perfectFrequency);
}
