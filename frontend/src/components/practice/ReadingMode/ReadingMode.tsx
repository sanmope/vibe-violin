/**
 * Reading Mode Component
 * Load a sheet music, play along, and get real-time evaluation feedback.
 * Notes are colored based on accuracy: green (correct), yellow (close), red (wrong).
 */

import React, { useEffect, useMemo } from 'react';
import type { Note } from '@/types';
import { usePracticeEvaluation } from '@/hooks/usePracticeEvaluation';
import { useMetronome } from '@/hooks/useMetronome';
import { recognizedNotesToNotes } from '@/utils/noteConverter';
import { FrequencyMeter } from '@/components/audio/FrequencyMeter/FrequencyMeter';
import { StaffNotation } from '@/components/sheet/StaffNotation/StaffNotation';
import { Fingerboard } from '@/components/violin/Fingerboard/Fingerboard';
import { PracticeSummary } from '@/components/practice/PracticeSummary/PracticeSummary';
import { MetronomeBeat } from '@/components/practice/MetronomeBeat/MetronomeBeat';
import './ReadingMode.css';

interface ReadingModeProps {
  notes: Note[];
  timeSignature?: string;
  tempo?: number;
}

export const ReadingMode: React.FC<ReadingModeProps> = ({
  notes,
  timeSignature = '4/4',
  tempo = 120,
}) => {
  const {
    currentExpectedNote,
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
  } = usePracticeEvaluation();

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10) || 4;
  const metronome = useMetronome(tempo, beatsPerMeasure);

  // Sync metronome with evaluation state
  useEffect(() => {
    if (isEvaluating && !isComplete) {
      metronome.start();
    } else {
      metronome.stop();
    }
  }, [isEvaluating, isComplete]);

  const playedConvertedNotes = useMemo(
    () => recognizedNotesToNotes(recognizedNotes, beatsPerMeasure),
    [recognizedNotes, beatsPerMeasure]
  );

  const targetNoteName = currentExpectedNote
    ? `${currentExpectedNote.pitch}${currentExpectedNote.octave}`
    : undefined;

  return (
    <div className="reading-mode">
      {isComplete && overallEvaluation ? (
        <PracticeSummary
          evaluation={overallEvaluation}
          onRestart={() => startEvaluation(notes)}
        />
      ) : (
        <>
          {/* Frequency Meter with target note */}
          <div className="reading-mode__meter">
            <FrequencyMeter
              detectedNote={detectedNote}
              targetNote={targetNoteName}
              rawFrequency={rawPitch}
              clarity={clarity}
            />
            {isEvaluating && (
              <div className="reading-mode__status">
                <div className={`reading-mode__violin-badge ${isViolinDetected ? 'reading-mode__violin-badge--active' : ''}`}>
                  {isViolinDetected ? 'Violin Detectado' : 'Sin Violin'}
                </div>
                {lastEvaluation && (
                  <div className={`reading-mode__last-eval reading-mode__last-eval--${lastEvaluation.rating}`}>
                    {lastEvaluation.rating === 'correct' ? 'Correcto' :
                     lastEvaluation.rating === 'close' ? 'Casi' : 'Incorrecto'}
                    {' '}({Math.round(lastEvaluation.overallScore)}%)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Staff Notation with evaluation colors */}
          <div className="reading-mode__staff">
            <StaffNotation
              notes={notes}
              highlightedNoteId={currentExpectedNote?.id}
              timeSignature={timeSignature}
              noteStyles={noteStyles}
              overlayNotes={playedConvertedNotes.length > 0 ? playedConvertedNotes : undefined}
              overlayNoteStyles={playedNoteStyles}
              scrollToEnd={false}
            />
          </div>

          {/* Fingerboard showing expected position */}
          {isEvaluating && currentExpectedNote && (
            <div className="reading-mode__fingerboard">
              <Fingerboard
                currentNote={currentExpectedNote}
                showLabels={true}
              />
            </div>
          )}

          {/* Controls */}
          <div className="reading-mode__controls">
            <MetronomeBeat
              currentBeat={metronome.currentBeat}
              beatsPerMeasure={beatsPerMeasure}
              isActive={metronome.isActive}
            />

            <button
              className={`reading-mode__metronome-toggle ${metronome.isActive ? 'reading-mode__metronome-toggle--active' : ''}`}
              onClick={metronome.toggle}
            >
              Metronomo
            </button>

            <button
              className={`reading-mode__action-btn ${isEvaluating ? 'reading-mode__action-btn--stop' : ''}`}
              onClick={isEvaluating ? stopEvaluation : () => startEvaluation(notes)}
            >
              {isEvaluating ? 'Detener Practica' : 'Empezar Practica'}
            </button>
          </div>

          {error && (
            <div className="reading-mode__error">{error}</div>
          )}
        </>
      )}
    </div>
  );
};
