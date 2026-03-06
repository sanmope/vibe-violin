/**
 * Note Accumulator Service
 * Groups consecutive pitch detection frames into recognized musical notes with duration.
 * Handles silence gaps, minimum note duration, duration quantization,
 * and re-articulation detection (same pitch played twice consecutively).
 */

import type { DetectedNote, RecognizedNote, NoteDuration } from '@/types';

/** Minimum note duration in ms to be considered valid (not a glitch) */
const MIN_NOTE_DURATION_MS = 80;

/** Silence duration in ms that signals end of a note */
const SILENCE_GAP_MS = 80;

/**
 * Minimum gap (ms) between last detected frame and current frame to consider
 * a re-articulation when the same pitch resumes. A violin bow change typically
 * causes a ~20-50ms interruption in pitch detection.
 */
const RE_ARTICULATION_GAP_MS = 25;

/**
 * RMS drop ratio threshold for detecting bow changes on sustained same-pitch notes.
 * If current RMS < recentAvgRMS * this ratio, mark as potential re-attack.
 */
const RMS_DIP_RATIO = 0.4;

/** Number of recent RMS frames to average for dip detection */
const RMS_WINDOW_SIZE = 5;

/** Duration quantization thresholds relative to a beat duration */
const DURATION_THRESHOLDS: { maxBeats: number; duration: NoteDuration; beats: number }[] = [
  { maxBeats: 0.1875, duration: 'sixteenth', beats: 0.25 },
  { maxBeats: 0.375, duration: 'eighth', beats: 0.5 },
  { maxBeats: 0.75, duration: 'quarter', beats: 1 },
  { maxBeats: 1.5, duration: 'half', beats: 2 },
  { maxBeats: Infinity, duration: 'whole', beats: 4 },
];

export type NoteAccumulatorCallback = (note: RecognizedNote) => void;

interface ActiveNote {
  pitchCounts: Map<string, number>;
  frequencies: number[];
  centsDeviations: number[];
  octaves: number[];
  rmsValues: number[];
  startTime: number;
  lastFrameTime: number;
}

export class NoteAccumulatorService {
  private activeNote: ActiveNote | null = null;
  private lastSilenceTime: number | null = null;
  private tempo = 120;
  private noteCounter = 0;
  private callback: NoteAccumulatorCallback | null = null;
  /** Set when RMS dips below threshold; cleared when note is finalized */
  private rmsDipDetected = false;

  setCallback(callback: NoteAccumulatorCallback): void {
    this.callback = callback;
  }

  setTempo(bpm: number): void {
    this.tempo = bpm;
  }

  /**
   * Process a detection frame. Call this on every animation frame with detected note data.
   */
  processFrame(detectedNote: DetectedNote | null, timestamp: number): void {
    if (detectedNote === null) {
      // Silence frame
      if (this.activeNote) {
        if (this.lastSilenceTime === null) {
          this.lastSilenceTime = timestamp;
        }
        const silenceDuration = timestamp - this.lastSilenceTime;
        if (silenceDuration >= SILENCE_GAP_MS) {
          this.finalizeNote();
        }
      }
      return;
    }

    // We have a detected note
    if (this.activeNote) {
      const dominantPitch = this.getDominantPitch();
      if (dominantPitch === detectedNote.pitch) {
        // Same pitch — check for re-articulation before continuing

        // Strategy 1: Micro-silence gap detection
        // If there was a silence gap (lastSilenceTime set) and the time since
        // the last active frame exceeds RE_ARTICULATION_GAP_MS, the player
        // likely re-articulated (bow change).
        if (this.lastSilenceTime !== null) {
          const gapMs = timestamp - this.activeNote.lastFrameTime;
          if (gapMs >= RE_ARTICULATION_GAP_MS) {
            this.lastSilenceTime = null;
            this.rmsDipDetected = false;
            this.finalizeNote();
            this.startNewNote(detectedNote, timestamp);
            return;
          }
        }

        // Strategy 2: RMS amplitude dip detection
        // Detects smooth bow changes that maintain pitch detection but cause
        // a momentary amplitude drop. If we previously flagged an RMS dip
        // and the amplitude has now recovered, treat as new note.
        if (this.rmsDipDetected) {
          const recentAvg = this.getRecentRmsAverage();
          if (detectedNote.rms >= recentAvg * 0.7) {
            // RMS recovered after dip — this is a re-attack
            this.lastSilenceTime = null;
            this.rmsDipDetected = false;
            this.finalizeNote();
            this.startNewNote(detectedNote, timestamp);
            return;
          }
        }

        // No re-articulation detected — continue accumulating
        this.lastSilenceTime = null;
        this.accumulateFrame(detectedNote, timestamp);

        // Check for RMS dip on this frame (flag for next frames)
        this.checkRmsDip(detectedNote.rms);
      } else {
        // Different note — finalize current, start new
        this.lastSilenceTime = null;
        this.rmsDipDetected = false;
        this.finalizeNote();
        this.startNewNote(detectedNote, timestamp);
      }
    } else {
      // No active note — start a new one
      this.lastSilenceTime = null;
      this.startNewNote(detectedNote, timestamp);
    }
  }

  /**
   * Force-finalize any active note (e.g., when stopping capture)
   */
  flush(): void {
    if (this.activeNote) {
      this.finalizeNote();
    }
  }

  /**
   * Get the start time of the currently active (in-progress) note, or null if none.
   */
  getActiveNoteStartTime(): number | null {
    return this.activeNote ? this.activeNote.startTime : null;
  }

  reset(): void {
    this.activeNote = null;
    this.lastSilenceTime = null;
    this.rmsDipDetected = false;
    this.noteCounter = 0;
  }

  /**
   * Check if the current RMS is a significant dip below recent average.
   * Flags rmsDipDetected so a subsequent recovery triggers note split.
   */
  private checkRmsDip(currentRms: number): void {
    if (!this.activeNote || this.activeNote.rmsValues.length < RMS_WINDOW_SIZE) return;

    const recentAvg = this.getRecentRmsAverage();
    if (recentAvg > 0 && currentRms < recentAvg * RMS_DIP_RATIO) {
      this.rmsDipDetected = true;
    }
  }

  /**
   * Get average RMS of the last N frames (excluding the most recent one
   * which might be the dip itself).
   */
  private getRecentRmsAverage(): number {
    if (!this.activeNote) return 0;
    const vals = this.activeNote.rmsValues;
    const end = Math.max(0, vals.length - 1); // exclude last (might be dip)
    const start = Math.max(0, end - RMS_WINDOW_SIZE);
    if (start >= end) return 0;
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += vals[i];
    }
    return sum / (end - start);
  }

  private startNewNote(note: DetectedNote, timestamp: number): void {
    const pitchCounts = new Map<string, number>();
    pitchCounts.set(note.pitch, 1);

    this.activeNote = {
      pitchCounts,
      frequencies: [note.frequency],
      centsDeviations: [note.centsDeviation],
      octaves: [note.octave],
      rmsValues: [note.rms],
      startTime: timestamp,
      lastFrameTime: timestamp,
    };
  }

  private accumulateFrame(note: DetectedNote, timestamp: number): void {
    if (!this.activeNote) return;

    const count = this.activeNote.pitchCounts.get(note.pitch) || 0;
    this.activeNote.pitchCounts.set(note.pitch, count + 1);
    this.activeNote.frequencies.push(note.frequency);
    this.activeNote.centsDeviations.push(note.centsDeviation);
    this.activeNote.octaves.push(note.octave);
    this.activeNote.rmsValues.push(note.rms);
    this.activeNote.lastFrameTime = timestamp;
  }

  private finalizeNote(): void {
    if (!this.activeNote) return;

    const durationMs = this.activeNote.lastFrameTime - this.activeNote.startTime;

    // Discard notes shorter than minimum duration
    if (durationMs < MIN_NOTE_DURATION_MS) {
      this.activeNote = null;
      return;
    }

    const pitch = this.getDominantPitch();
    const avgFreq = this.activeNote.frequencies.reduce((a, b) => a + b, 0) / this.activeNote.frequencies.length;
    const avgCents = this.activeNote.centsDeviations.reduce((a, b) => a + b, 0) / this.activeNote.centsDeviations.length;

    // Most common octave
    const octaveCounts = new Map<number, number>();
    this.activeNote.octaves.forEach(o => octaveCounts.set(o, (octaveCounts.get(o) || 0) + 1));
    let octave = 4;
    let maxOctaveCount = 0;
    octaveCounts.forEach((count, oct) => {
      if (count > maxOctaveCount) {
        maxOctaveCount = count;
        octave = oct;
      }
    });

    const { duration, beats } = this.quantizeDuration(durationMs);

    const recognizedNote: RecognizedNote = {
      id: `note-${++this.noteCounter}-${Date.now()}`,
      pitch,
      averageFrequency: avgFreq,
      averageCentsDeviation: avgCents,
      durationMs,
      duration,
      durationBeats: beats,
      startTime: this.activeNote.startTime,
      endTime: this.activeNote.lastFrameTime,
      octave,
    };

    this.activeNote = null;

    if (this.callback) {
      this.callback(recognizedNote);
    }
  }

  private getDominantPitch(): string {
    if (!this.activeNote) return 'A4';
    let maxCount = 0;
    let dominant = 'A4';
    this.activeNote.pitchCounts.forEach((count, pitch) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = pitch;
      }
    });
    return dominant;
  }

  private quantizeDuration(durationMs: number): { duration: NoteDuration; beats: number } {
    const beatDurationMs = 60000 / this.tempo;
    const rawBeats = durationMs / beatDurationMs;

    for (const threshold of DURATION_THRESHOLDS) {
      if (rawBeats < threshold.maxBeats) {
        return { duration: threshold.duration, beats: threshold.beats };
      }
    }

    return { duration: 'whole', beats: 4 };
  }
}
