/**
 * useMetronome Hook
 * Web Audio API lookahead scheduler for precise metronome timing.
 * Provides audio clicks and visual beat state.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

/** How far ahead to schedule audio (seconds) */
const LOOKAHEAD_S = 0.1;
/** How often the scheduler wakes up (ms) */
const SCHEDULER_INTERVAL_MS = 25;
/** Click duration (seconds) */
const CLICK_DURATION_S = 0.03;

interface UseMetronomeReturn {
  isActive: boolean;
  currentBeat: number; // 1-indexed (1..beatsPerMeasure)
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useMetronome(tempo: number, beatsPerMeasure: number): UseMetronomeReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const schedulerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatCounterRef = useRef(0);
  const isActiveRef = useRef(false);

  // Keep refs in sync with latest values
  const tempoRef = useRef(tempo);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  useEffect(() => { tempoRef.current = tempo; }, [tempo]);
  useEffect(() => { beatsPerMeasureRef.current = beatsPerMeasure; }, [beatsPerMeasure]);

  const scheduleClick = useCallback((time: number, isDownbeat: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = isDownbeat ? 1000 : 800;
    gain.gain.setValueAtTime(isDownbeat ? 1.0 : 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + CLICK_DURATION_S);

    osc.start(time);
    osc.stop(time + CLICK_DURATION_S);
  }, []);

  const schedulerTick = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isActiveRef.current) return;

    while (nextBeatTimeRef.current < ctx.currentTime + LOOKAHEAD_S) {
      const beatInMeasure = (beatCounterRef.current % beatsPerMeasureRef.current) + 1;
      const isDownbeat = beatInMeasure === 1;

      scheduleClick(nextBeatTimeRef.current, isDownbeat);

      // Schedule visual update at the right wall-clock time
      const delayMs = (nextBeatTimeRef.current - ctx.currentTime) * 1000;
      const beat = beatInMeasure;
      setTimeout(() => {
        if (isActiveRef.current) {
          setCurrentBeat(beat);
        }
      }, Math.max(0, delayMs));

      // Advance
      const secondsPerBeat = 60 / tempoRef.current;
      nextBeatTimeRef.current += secondsPerBeat;
      beatCounterRef.current++;
    }
  }, [scheduleClick]);

  const start = useCallback(() => {
    if (isActiveRef.current) return;

    // Create or resume AudioContext
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const ctx = audioCtxRef.current;
    nextBeatTimeRef.current = ctx.currentTime;
    beatCounterRef.current = 0;

    isActiveRef.current = true;
    setIsActive(true);
    setCurrentBeat(1);

    schedulerIdRef.current = setInterval(schedulerTick, SCHEDULER_INTERVAL_MS);
  }, [schedulerTick]);

  const stop = useCallback(() => {
    if (!isActiveRef.current) return;

    isActiveRef.current = false;
    setIsActive(false);

    if (schedulerIdRef.current !== null) {
      clearInterval(schedulerIdRef.current);
      schedulerIdRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (isActiveRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (schedulerIdRef.current !== null) {
        clearInterval(schedulerIdRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      isActiveRef.current = false;
    };
  }, []);

  return { isActive, currentBeat, start, stop, toggle };
}
