/**
 * usePlayback Hook
 * Manages playback state for practicing sheet music
 * - Current note tracking
 * - Play/pause functionality
 * - Step forward/backward navigation
 * - Tempo control
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Note } from '@/types';

interface UsePlaybackReturn {
  /** Current note index */
  currentNoteIndex: number;

  /** Whether playback is active */
  isPlaying: boolean;

  /** Current tempo in BPM */
  tempo: number;

  /** Start playback */
  play: () => void;

  /** Pause playback */
  pause: () => void;

  /** Toggle play/pause */
  togglePlay: () => void;

  /** Step to next note */
  stepForward: () => void;

  /** Step to previous note */
  stepBackward: () => void;

  /** Jump to specific note */
  goToNote: (index: number) => void;

  /** Set tempo */
  setTempo: (bpm: number) => void;

  /** Reset to beginning */
  reset: () => void;

  /** Current note */
  currentNote: Note | null;
}

export function usePlayback(
  notes: Note[],
  initialTempo: number = 120
): UsePlaybackReturn {
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempoState] = useState(initialTempo);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate delay between notes based on tempo and note duration
  const getNoteDuration = useCallback(
    (note: Note): number => {
      // Calculate milliseconds per beat
      const msPerBeat = (60 / tempo) * 1000;

      // Return duration in milliseconds
      return note.durationBeats * msPerBeat;
    },
    [tempo]
  );

  // Advance to next note
  const advanceNote = useCallback(() => {
    setCurrentNoteIndex((prev) => {
      if (prev >= notes.length - 1) {
        setIsPlaying(false); // Stop at the end
        return prev;
      }
      return prev + 1;
    });
  }, [notes.length]);

  // Setup playback timer
  useEffect(() => {
    if (isPlaying && notes.length > 0) {
      const currentNote = notes[currentNoteIndex];
      if (!currentNote) {
        setIsPlaying(false);
        return;
      }

      const duration = getNoteDuration(currentNote);

      timerRef.current = setTimeout(() => {
        advanceNote();
      }, duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentNoteIndex, notes, getNoteDuration, advanceNote]);

  const play = useCallback(() => {
    if (notes.length === 0) return;

    // If at the end, restart from beginning
    if (currentNoteIndex >= notes.length - 1) {
      setCurrentNoteIndex(0);
    }

    setIsPlaying(true);
  }, [notes.length, currentNoteIndex]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentNoteIndex((prev) => Math.min(prev + 1, notes.length - 1));
  }, [notes.length]);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    setCurrentNoteIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToNote = useCallback(
    (index: number) => {
      setIsPlaying(false);
      setCurrentNoteIndex(Math.max(0, Math.min(index, notes.length - 1)));
    },
    [notes.length]
  );

  const setTempo = useCallback((bpm: number) => {
    setTempoState(Math.max(40, Math.min(bpm, 240))); // Clamp between 40-240 BPM
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentNoteIndex(0);
  }, []);

  const currentNote = notes[currentNoteIndex] || null;

  return {
    currentNoteIndex,
    isPlaying,
    tempo,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    goToNote,
    setTempo,
    reset,
    currentNote,
  };
}
