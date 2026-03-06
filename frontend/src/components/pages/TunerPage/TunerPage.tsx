/**
 * Tuner Page
 * Standalone chromatic tuner with microphone input, violin detection, and note recognition.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteRecognition } from '@/hooks/useNoteRecognition';
import { FrequencyMeter } from '@/components/audio/FrequencyMeter/FrequencyMeter';
import './TunerPage.css';

export const TunerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isListening,
    detectedNote,
    rawPitch,
    clarity,
    isViolinDetected,
    recognizedNotes,
    startRecognition,
    stopRecognition,
    clearNotes,
    error,
  } = useNoteRecognition();

  const handleToggle = () => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  return (
    <div className="tuner-page">
      <header className="tuner-page__header">
        <button
          className="tuner-page__back-button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
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
        <h1>Afinador</h1>
        {isListening && (
          <div className={`tuner-page__violin-badge ${isViolinDetected ? 'tuner-page__violin-badge--active' : ''}`}>
            {isViolinDetected ? 'Violin Detectado' : 'Sin Violin'}
          </div>
        )}
      </header>

      <main className="tuner-page__content">
        <FrequencyMeter
          detectedNote={detectedNote}
          rawFrequency={rawPitch}
          clarity={clarity}
        />

        {error && (
          <div className="tuner-page__error">{error}</div>
        )}

        <div className="tuner-page__controls">
          <button
            className={`tuner-page__toggle ${isListening ? 'tuner-page__toggle--active' : ''}`}
            onClick={handleToggle}
          >
            {isListening ? 'Detener' : 'Empezar a Escuchar'}
          </button>

          {recognizedNotes.length > 0 && (
            <button
              className="tuner-page__clear"
              onClick={clearNotes}
            >
              Limpiar Notas
            </button>
          )}
        </div>

        <p className="tuner-page__hint">
          {isListening
            ? 'Toca una nota en tu violin para ver la afinacion'
            : 'Presiona el boton para activar el microfono'}
        </p>

        {/* Recognized Notes List */}
        {recognizedNotes.length > 0 && (
          <div className="tuner-page__notes">
            <h3>Notas Reconocidas</h3>
            <div className="tuner-page__notes-list">
              {recognizedNotes.map((note) => (
                <div key={note.id} className="tuner-page__note-item">
                  <span className="tuner-page__note-pitch">{note.pitch}</span>
                  <span className="tuner-page__note-duration">{note.duration}</span>
                  <span className="tuner-page__note-freq">{note.averageFrequency.toFixed(1)} Hz</span>
                  <span className="tuner-page__note-time">{Math.round(note.durationMs)} ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
