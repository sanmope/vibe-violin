/**
 * Hook for practice evaluation combining note recognition with evaluator service.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Note, NoteEvaluation, PracticeEvaluation, RecognizedNote } from '@/types';
import { useNoteRecognition } from './useNoteRecognition';
import { PracticeEvaluatorService } from '@/services/audio/PracticeEvaluatorService';

interface UsePracticeEvaluationReturn {
  /** The note the student should play next */
  currentExpectedNote: Note | null;
  /** Current expected note index */
  currentExpectedIndex: number;
  /** Evaluation of the last played note */
  lastEvaluation: NoteEvaluation | null;
  /** Overall evaluation summary */
  overallEvaluation: PracticeEvaluation | null;
  /** Map of note IDs to their ratings for coloring */
  noteStyles: Record<string, 'correct' | 'close' | 'wrong'>;
  /** All recognized notes from audio detection */
  recognizedNotes: RecognizedNote[];
  /** Map of recognized note IDs to their ratings for overlay coloring */
  playedNoteStyles: Record<string, 'correct' | 'close' | 'wrong'>;
  /** Whether evaluation is in progress */
  isEvaluating: boolean;
  /** Whether all notes have been evaluated */
  isComplete: boolean;
  /** Start practice evaluation */
  startEvaluation: (notes: Note[]) => Promise<void>;
  /** Stop evaluation */
  stopEvaluation: () => void;
  /** Audio state */
  detectedNote: ReturnType<typeof useNoteRecognition>['detectedNote'];
  rawPitch: number | null;
  clarity: number;
  isViolinDetected: boolean;
  error: string | null;
}

export function usePracticeEvaluation(): UsePracticeEvaluationReturn {
  const {
    recognizedNotes,
    detectedNote,
    rawPitch,
    clarity,
    isViolinDetected,
    startRecognition,
    stopRecognition,
    clearNotes,
    error,
  } = useNoteRecognition();

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentExpectedNote, setCurrentExpectedNote] = useState<Note | null>(null);
  const [currentExpectedIndex, setCurrentExpectedIndex] = useState(0);
  const [lastEvaluation, setLastEvaluation] = useState<NoteEvaluation | null>(null);
  const [overallEvaluation, setOverallEvaluation] = useState<PracticeEvaluation | null>(null);
  const [noteStyles, setNoteStyles] = useState<Record<string, 'correct' | 'close' | 'wrong'>>({});
  const [playedNoteStyles, setPlayedNoteStyles] = useState<Record<string, 'correct' | 'close' | 'wrong'>>({});
  const [isComplete, setIsComplete] = useState(false);

  const evaluatorRef = useRef(new PracticeEvaluatorService());
  const processedCountRef = useRef(0);
  const expectedNotesRef = useRef<Note[]>([]);

  // Watch for new recognized notes and evaluate them
  useEffect(() => {
    if (!isEvaluating) return;

    const newNotes = recognizedNotes.slice(processedCountRef.current);
    if (newNotes.length === 0) return;

    newNotes.forEach(recognized => {
      const evaluation = evaluatorRef.current.evaluateNote(recognized);
      if (evaluation) {
        setLastEvaluation(evaluation);

        // Map the evaluation to the expected note's ID
        const expectedIdx = evaluatorRef.current.getCurrentIndex() - 1;
        if (expectedIdx >= 0 && expectedIdx < expectedNotesRef.current.length) {
          const expectedNoteId = expectedNotesRef.current[expectedIdx].id;
          setNoteStyles(prev => ({
            ...prev,
            [expectedNoteId]: evaluation.rating,
          }));
        }

        // Map the evaluation to the recognized note's ID for overlay
        setPlayedNoteStyles(prev => ({
          ...prev,
          [recognized.id]: evaluation.rating,
        }));

        // Update current expected note
        const nextExpected = evaluatorRef.current.getCurrentExpectedNote();
        setCurrentExpectedNote(nextExpected);
        setCurrentExpectedIndex(evaluatorRef.current.getCurrentIndex());

        // Check completion
        if (evaluatorRef.current.isComplete()) {
          setIsComplete(true);
          setOverallEvaluation(evaluatorRef.current.getOverallEvaluation());
          stopRecognition();
          setIsEvaluating(false);
        }
      }
    });

    processedCountRef.current = recognizedNotes.length;
  }, [recognizedNotes, isEvaluating]);

  const startEvaluation = useCallback(async (notes: Note[]) => {
    // Reset state
    clearNotes();
    processedCountRef.current = 0;
    expectedNotesRef.current = notes;
    setNoteStyles({});
    setPlayedNoteStyles({});
    setLastEvaluation(null);
    setOverallEvaluation(null);
    setIsComplete(false);

    // Load expected notes
    evaluatorRef.current.loadExpectedNotes(notes);
    setCurrentExpectedNote(evaluatorRef.current.getCurrentExpectedNote());
    setCurrentExpectedIndex(0);

    // Start listening
    setIsEvaluating(true);
    await startRecognition();
  }, [clearNotes, startRecognition]);

  const stopEvaluation = useCallback(() => {
    stopRecognition();
    setIsEvaluating(false);
    setOverallEvaluation(evaluatorRef.current.getOverallEvaluation());
  }, [stopRecognition]);

  return {
    currentExpectedNote,
    currentExpectedIndex,
    lastEvaluation,
    overallEvaluation,
    noteStyles,
    recognizedNotes,
    playedNoteStyles,
    isEvaluating,
    isComplete,
    startEvaluation,
    stopEvaluation,
    detectedNote,
    rawPitch,
    clarity,
    isViolinDetected,
    error,
  };
}
