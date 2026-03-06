/**
 * Practice Page
 * Main interface for practicing violin with sheet music.
 * Supports three modes: Playback, Writing, Reading.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { SheetMusic, Note } from '@/types';
import { useServices } from '@/services/ServiceFactory';
import { usePlayback } from '@/hooks/usePlayback';
import { useMetronome } from '@/hooks/useMetronome';
import { Fingerboard } from '@/components/violin/Fingerboard/Fingerboard';
import { ScaleSelector } from '@/components/violin/Fingerboard/ScaleSelector';
import { BowVisualizer } from '@/components/violin/BowVisualizer/BowVisualizer';
import { PlaybackControls } from '@/components/playback/PlaybackControls/PlaybackControls';
import { StaffNotation } from '@/components/sheet/StaffNotation';
import { ModeSelector } from '@/components/practice/ModeSelector/ModeSelector';
import { WritingMode } from '@/components/practice/WritingMode/WritingMode';
import { ReadingMode } from '@/components/practice/ReadingMode/ReadingMode';
import { MetronomeBeat } from '@/components/practice/MetronomeBeat/MetronomeBeat';
import { TimeSignatureSelector } from '@/components/practice/TimeSignatureSelector/TimeSignatureSelector';
import type { PracticeMode } from '@/components/practice/ModeSelector/ModeSelector';
import type { Scale } from '@/utils/musicScales';
import './PracticePage.css';

export const PracticePage: React.FC = () => {
  const { sheetMusicId } = useParams<{ sheetMusicId: string }>();
  const navigate = useNavigate();
  const { sheetMusicService } = useServices();

  const [sheetMusic, setSheetMusic] = useState<SheetMusic | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(
    sheetMusicId ? 'playback' : 'writing'
  );
  const [timeSignature, setTimeSignature] = useState(sheetMusic?.timeSignature || '4/4');

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10) || 4;

  const {
    currentNoteIndex,
    isPlaying,
    tempo,
    play,
    pause,
    stepForward,
    stepBackward,
    setTempo,
    currentNote,
  } = usePlayback(notes, sheetMusic?.tempo || 120);

  const metronome = useMetronome(tempo, beatsPerMeasure);

  // Sync timeSignature when sheet music loads
  useEffect(() => {
    if (sheetMusic?.timeSignature) setTimeSignature(sheetMusic.timeSignature);
  }, [sheetMusic]);

  // Sync metronome with playback
  useEffect(() => {
    if (practiceMode === 'playback' && isPlaying) {
      metronome.start();
    } else {
      metronome.stop();
    }
  }, [isPlaying, practiceMode]);

  // Load sheet music data (skip if writing mode without sheetMusicId)
  useEffect(() => {
    if (!sheetMusicId) {
      setLoading(false);
      return;
    }

    loadSheetMusic();
  }, [sheetMusicId]);

  const loadSheetMusic = async () => {
    try {
      setLoading(true);
      setError(null);

      const sheet = await sheetMusicService.getSheetMusic(sheetMusicId!);
      if (!sheet) {
        throw new Error('Sheet music not found');
      }

      if (sheet.status !== 'READY') {
        throw new Error('Sheet music is still processing. Please wait.');
      }

      setSheetMusic(sheet);

      const notesData = await sheetMusicService.getNotes(sheetMusicId!);
      if (notesData.length === 0) {
        throw new Error('No notes found for this sheet music');
      }

      setNotes(notesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sheet music');
      console.error('Failed to load sheet music:', err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state (only when loading sheet music)
  if (loading && sheetMusicId) {
    return (
      <div className="practice-page practice-page--loading">
        <div className="practice-page__loading">
          <div className="practice-page__spinner" />
          <p>Loading sheet music...</p>
        </div>
      </div>
    );
  }

  // Error state (only for playback/reading modes with required sheet music)
  if (sheetMusicId && (error || !sheetMusic || notes.length === 0)) {
    return (
      <div className="practice-page practice-page--error">
        <div className="practice-page__error">
          <h2>Error</h2>
          <p>{error || 'Failed to load sheet music'}</p>
          <button
            className="practice-page__error-button"
            onClick={() => navigate('/library')}
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-page">
      {/* Header */}
      <header className="practice-page__header">
        <button
          className="practice-page__back-button"
          onClick={() => navigate(sheetMusicId ? '/library' : '/')}
          aria-label="Back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="practice-page__title">
          <h1>{sheetMusic?.title || 'Modo Escritura'}</h1>
          {sheetMusic?.composer && <p>{sheetMusic.composer}</p>}
        </div>

        <div className="practice-page__mode-selector">
          <ModeSelector
            currentMode={practiceMode}
            onModeChange={setPracticeMode}
            disableReading={notes.length === 0}
          />
        </div>

        <div className="practice-page__metadata">
          {sheetMusic && <span>{sheetMusic.keySignature}</span>}
          <TimeSignatureSelector
            value={timeSignature}
            onChange={setTimeSignature}
            disabled={isPlaying}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="practice-page__content">
        {practiceMode === 'writing' ? (
          <section className="practice-page__sheet-section">
            <WritingMode
              timeSignature={timeSignature}
              initialTempo={sheetMusic?.tempo || 120}
              onTimeSignatureChange={setTimeSignature}
            />
          </section>
        ) : practiceMode === 'reading' ? (
          <section className="practice-page__sheet-section">
            <ReadingMode
              notes={notes}
              timeSignature={timeSignature}
              tempo={tempo}
            />
          </section>
        ) : (
          <>
            {/* Playback Mode */}
            <section className="practice-page__sheet-section">
              <StaffNotation
                notes={notes}
                highlightedNoteId={currentNote?.id}
                timeSignature={timeSignature}
              />
            </section>

            <aside className="practice-page__violin-section">
              <ScaleSelector
                selectedScale={selectedScale}
                onScaleSelect={setSelectedScale}
              />

              <Fingerboard
                currentNote={currentNote || undefined}
                showLabels={true}
                selectedScale={selectedScale}
              />

              <BowVisualizer
                direction={currentNote?.bowDirection || 'DOWN'}
                portion={currentNote?.bowPortion || 'MIDDLE'}
                technique={currentNote?.technique || 'DETACHE'}
                pressure={0.6}
              />
            </aside>
          </>
        )}
      </main>

      {/* Playback Controls (only in playback mode) */}
      {practiceMode === 'playback' && notes.length > 0 && (
        <footer className="practice-page__footer">
          <div className="practice-page__footer-row">
            <PlaybackControls
              isPlaying={isPlaying}
              currentIndex={currentNoteIndex}
              totalNotes={notes.length}
              tempo={tempo}
              onPlay={play}
              onPause={pause}
              onStepForward={stepForward}
              onStepBackward={stepBackward}
              onTempoChange={setTempo}
            />
            <div className="practice-page__metronome-area">
              <button
                className={`practice-page__metronome-toggle ${metronome.isActive ? 'practice-page__metronome-toggle--active' : ''}`}
                onClick={metronome.toggle}
              >
                Metronomo
              </button>
              <MetronomeBeat
                currentBeat={metronome.currentBeat}
                beatsPerMeasure={beatsPerMeasure}
                isActive={metronome.isActive}
              />
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
