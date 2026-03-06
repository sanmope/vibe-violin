/**
 * Hook for note recognition combining audio capture, violin detection, and note accumulation.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { RecognizedNote } from '@/types';
import { useAudioCapture } from './useAudioCapture';
import { NoteAccumulatorService } from '@/services/audio/NoteAccumulatorService';
import { assessViolinLikelihood } from '@/utils/violinDetector';

interface UseNoteRecognitionReturn {
  /** All recognized notes accumulated so far */
  recognizedNotes: RecognizedNote[];
  /** The note currently being held (not yet finalized) */
  currentDetectedPitch: string | null;
  /** Whether a violin-like sound is currently detected */
  isViolinDetected: boolean;
  /** Set tempo for duration quantization */
  setTempo: (bpm: number) => void;
  /** Clear all accumulated notes */
  clearNotes: () => void;
  /** Audio capture state */
  isListening: boolean;
  /** Start microphone capture and recognition */
  startRecognition: () => Promise<void>;
  /** Stop capture and finalize any pending note */
  stopRecognition: () => void;
  /** Current detected note from audio capture */
  detectedNote: ReturnType<typeof useAudioCapture>['detectedNote'];
  /** Raw pitch frequency */
  rawPitch: number | null;
  /** Clarity of detection */
  clarity: number;
  /** Error message */
  error: string | null;
  /** Get the start time (performance.now()) of the currently active note */
  getActiveNoteStartTime: () => number | null;
}

export function useNoteRecognition(): UseNoteRecognitionReturn {
  const {
    isListening,
    detectedNote,
    rawPitch,
    clarity,
    startCapture,
    stopCapture,
    error,
  } = useAudioCapture();

  const [recognizedNotes, setRecognizedNotes] = useState<RecognizedNote[]>([]);
  const [isViolinDetected, setIsViolinDetected] = useState(false);
  const [currentDetectedPitch, setCurrentDetectedPitch] = useState<string | null>(null);

  const accumulatorRef = useRef<NoteAccumulatorService>(new NoteAccumulatorService());

  // Set up accumulator callback
  useEffect(() => {
    accumulatorRef.current.setCallback((note: RecognizedNote) => {
      setRecognizedNotes(prev => [...prev, note]);
    });
  }, []);

  // Process each detected note frame
  useEffect(() => {
    if (!isListening) return;

    const timestamp = performance.now();

    if (detectedNote && rawPitch) {
      const likelihood = assessViolinLikelihood(rawPitch, clarity);
      setIsViolinDetected(likelihood > 0);
      setCurrentDetectedPitch(detectedNote.pitch);

      if (likelihood > 0) {
        accumulatorRef.current.processFrame(detectedNote, timestamp);
      } else {
        accumulatorRef.current.processFrame(null, timestamp);
      }
    } else {
      setIsViolinDetected(false);
      setCurrentDetectedPitch(null);
      accumulatorRef.current.processFrame(null, timestamp);
    }
  }, [detectedNote, rawPitch, clarity, isListening]);

  const setTempo = useCallback((bpm: number) => {
    accumulatorRef.current.setTempo(bpm);
  }, []);

  const getActiveNoteStartTime = useCallback(() =>
    accumulatorRef.current.getActiveNoteStartTime(), []);

  const clearNotes = useCallback(() => {
    setRecognizedNotes([]);
    accumulatorRef.current.reset();
  }, []);

  const startRecognition = useCallback(async () => {
    accumulatorRef.current.reset();
    await startCapture();
  }, [startCapture]);

  const stopRecognition = useCallback(() => {
    accumulatorRef.current.flush();
    stopCapture();
    setIsViolinDetected(false);
    setCurrentDetectedPitch(null);
  }, [stopCapture]);

  return {
    recognizedNotes,
    currentDetectedPitch,
    isViolinDetected,
    setTempo,
    clearNotes,
    isListening,
    startRecognition,
    stopRecognition,
    detectedNote,
    rawPitch,
    clarity,
    error,
    getActiveNoteStartTime,
  };
}
