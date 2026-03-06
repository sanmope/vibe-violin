/**
 * Writing Mode Component
 * Empty staff that fills with notes as the user plays the violin.
 * Uses microphone to detect notes in real-time.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteRecognition } from '@/hooks/useNoteRecognition';
import { useMetronome } from '@/hooks/useMetronome';
import { recognizedNotesToNotes } from '@/utils/noteConverter';
import {
  COMMON_SCALES,
  detectKey,
  scaleToVexflowKeySpec,
  type KeyDetectionResult,
  type Scale,
} from '@/utils/musicScales';
import { FrequencyMeter } from '@/components/audio/FrequencyMeter/FrequencyMeter';
import { StaffNotation } from '@/components/sheet/StaffNotation/StaffNotation';
import { Fingerboard } from '@/components/violin/Fingerboard/Fingerboard';
import { BowVisualizer } from '@/components/violin/BowVisualizer/BowVisualizer';
import { MetronomeBeat } from '@/components/practice/MetronomeBeat/MetronomeBeat';
import { TimeSignatureSelector } from '@/components/practice/TimeSignatureSelector/TimeSignatureSelector';
import { useServices } from '@/services/ServiceFactory';
import type { SheetMusic } from '@/types';
import './WritingMode.css';

interface WritingModeProps {
  timeSignature?: string;
  initialTempo?: number;
  onTimeSignatureChange?: (ts: string) => void;
}

export const WritingMode: React.FC<WritingModeProps> = ({
  timeSignature = '4/4',
  initialTempo = 120,
  onTimeSignatureChange,
}) => {
  const navigate = useNavigate();
  const { sheetMusicService } = useServices();

  const [tempo, setTempoState] = useState(initialTempo);
  const [detectedKeyResult, setDetectedKeyResult] = useState<KeyDetectionResult | null>(null);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [userOverrodeKey, setUserOverrodeKey] = useState(false);
  const [measuresPerSystem, setMeasuresPerSystem] = useState(4);
  const [cursorPosition, setCursorPosition] = useState<{ measure: number; beatFraction: number } | null>(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [activeNoteDuration, setActiveNoteDuration] = useState<number | null>(null);

  const recordingStartTimeRef = useRef<number>(0);

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
    setTempo,
    error,
    getActiveNoteStartTime,
  } = useNoteRecognition();

  const handleTempoChange = (newTempo: number) => {
    const clamped = Math.max(40, Math.min(240, newTempo));
    setTempoState(clamped);
    setTempo(clamped);
  };

  // Convert recognized notes to domain notes with measure/beat
  const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10) || 4;
  const metronome = useMetronome(tempo, beatsPerMeasure);
  const convertedNotes = useMemo(
    () => recognizedNotesToNotes(recognizedNotes, beatsPerMeasure),
    [recognizedNotes, beatsPerMeasure]
  );

  // Auto-detect key when notes change
  useEffect(() => {
    if (userOverrodeKey) return;
    if (convertedNotes.length === 0) {
      setDetectedKeyResult(null);
      setSelectedScale(null);
      return;
    }

    const pitches = convertedNotes.map(n => n.pitch);
    const result = detectKey(pitches);
    setDetectedKeyResult(result);

    if (result && result.isConfident) {
      setSelectedScale(result.bestMatch.scale);
    } else if (result && !result.isConfident) {
      // Don't auto-select if not confident, let user choose
      setSelectedScale(null);
    }
  }, [convertedNotes, userOverrodeKey]);

  // Sync metronome with recording
  useEffect(() => {
    if (isListening) {
      metronome.start();
    } else {
      metronome.stop();
    }
  }, [isListening]);

  // Beat clock — drives the cursor while recording
  useEffect(() => {
    if (!isListening) {
      setCursorPosition(null);
      return;
    }

    recordingStartTimeRef.current = performance.now();
    let rafId: number;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - recordingStartTimeRef.current;
      const totalBeats = elapsed / (60000 / tempo);
      const measure = Math.floor(totalBeats / beatsPerMeasure) + 1;
      const beatFraction = (totalBeats % beatsPerMeasure) / beatsPerMeasure;
      setCursorPosition({ measure, beatFraction });

      // Track active note duration
      const noteStart = getActiveNoteStartTime();
      setActiveNoteDuration(noteStart ? (now - noteStart) : null);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isListening, tempo, beatsPerMeasure]);

  const handleKeyChange = (scaleName: string) => {
    setUserOverrodeKey(true);
    if (scaleName === '') {
      setSelectedScale(null);
    } else {
      const scale = COMMON_SCALES.find(s => s.name === scaleName) || null;
      setSelectedScale(scale);
    }
  };

  const handleClear = () => {
    clearNotes();
    setDetectedKeyResult(null);
    setSelectedScale(null);
    setUserOverrodeKey(false);
    setCursorPosition(null);
    setSaveTitle('');
  };

  const handleSave = () => {
    if (!saveTitle.trim() || convertedNotes.length === 0) return;

    const now = new Date().toISOString();
    const sheetMusic: SheetMusic = {
      id: `writing-${Date.now()}`,
      title: saveTitle.trim(),
      composer: '',
      keySignature: selectedScale
        ? `${selectedScale.root} ${selectedScale.type}`
        : 'C major',
      timeSignature,
      tempo,
      status: 'READY',
      createdAt: now,
      updatedAt: now,
      notes: convertedNotes,
    };

    sheetMusicService.addParsedSheetMusic?.(sheetMusic, convertedNotes);
    navigate('/library');
  };

  // Derive the current fingerboard note from the last converted note
  const currentFingerboardNote = convertedNotes.length > 0
    ? convertedNotes[convertedNotes.length - 1]
    : undefined;

  const lastNoteId = convertedNotes.length > 0 ? convertedNotes[convertedNotes.length - 1].id : undefined;

  const vexflowKeySig = selectedScale ? scaleToVexflowKeySpec(selectedScale) : undefined;

  // Build suggestion list: candidates with score >= 0.5
  const keySuggestions = detectedKeyResult
    ? detectedKeyResult.candidates.filter(c => c.score >= 0.5)
    : [];

  const majorScales = COMMON_SCALES.filter(s => s.type === 'major');
  const minorScales = COMMON_SCALES.filter(s => s.type === 'minor');

  return (
    <div className="writing-mode">
      {/* Frequency Meter */}
      <div className="writing-mode__meter">
        <FrequencyMeter
          detectedNote={detectedNote}
          rawFrequency={rawPitch}
          clarity={clarity}
        />
        {isListening && (
          <div className={`writing-mode__violin-status ${isViolinDetected ? 'writing-mode__violin-status--active' : ''}`}>
            {isViolinDetected ? 'Violin Detectado' : 'Sin Violin'}
          </div>
        )}
      </div>

      {/* Key Detection UI */}
      {convertedNotes.length > 0 && (
        <div className="writing-mode__key-detection">
          {detectedKeyResult?.isConfident && !userOverrodeKey ? (
            <div className="writing-mode__key-detected">
              <span>Tonalidad: <strong>{selectedScale?.name}</strong></span>
              <button
                className="writing-mode__key-change-btn"
                onClick={() => setUserOverrodeKey(true)}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="writing-mode__key-selector">
              <label className="writing-mode__key-label">Tonalidad:</label>
              <select
                className="writing-mode__key-dropdown"
                value={selectedScale?.name || ''}
                onChange={(e) => handleKeyChange(e.target.value)}
              >
                <option value="">Sin tonalidad</option>
                {keySuggestions.length > 0 && (
                  <optgroup label="Sugerencias">
                    {keySuggestions.map(c => (
                      <option key={c.scale.name} value={c.scale.name}>
                        {c.scale.name} ({Math.round(c.score * 100)}%)
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Mayores">
                  {majorScales.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Menores">
                  {minorScales.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Staff Notation */}
      <div className="writing-mode__staff">
        <StaffNotation
          notes={convertedNotes.length > 0 ? convertedNotes : undefined}
          mode="live"
          timeSignature={timeSignature}
          scrollToEnd={true}
          highlightedNoteId={lastNoteId}
          measuresPerSystem={measuresPerSystem}
          vexflowKeySignature={vexflowKeySig}
          cursorPosition={cursorPosition ?? undefined}
        />
      </div>

      {/* Fingerboard + Bow Visualizer */}
      {(currentFingerboardNote || isListening) && (
        <div className="writing-mode__fingerboard">
          <Fingerboard
            currentNote={currentFingerboardNote}
            selectedScale={selectedScale}
          />
          <BowVisualizer
            direction={currentFingerboardNote?.bowDirection || 'DOWN'}
            portion={currentFingerboardNote?.bowPortion || 'MIDDLE'}
            technique={currentFingerboardNote?.technique || 'DETACHE'}
            activeNoteDurationMs={activeNoteDuration}
            tempo={tempo}
          />
        </div>
      )}

      {/* Controls */}
      <div className="writing-mode__controls">
        <TimeSignatureSelector
          value={timeSignature}
          onChange={(ts) => onTimeSignatureChange?.(ts)}
          disabled={isListening}
        />

        <MetronomeBeat
          currentBeat={metronome.currentBeat}
          beatsPerMeasure={beatsPerMeasure}
          isActive={metronome.isActive}
        />

        <div className="writing-mode__tempo">
          <button
            className="writing-mode__tempo-btn"
            onClick={() => handleTempoChange(tempo - 5)}
            disabled={isListening}
          >
            -
          </button>
          <span className="writing-mode__tempo-value">{tempo} BPM</span>
          <button
            className="writing-mode__tempo-btn"
            onClick={() => handleTempoChange(tempo + 5)}
            disabled={isListening}
          >
            +
          </button>
        </div>

        <div className="writing-mode__layout">
          <label className="writing-mode__layout-label">Compases/linea:</label>
          <select
            className="writing-mode__layout-select"
            value={measuresPerSystem}
            onChange={(e) => setMeasuresPerSystem(Number(e.target.value))}
          >
            {[2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="writing-mode__actions">
          <button
            className={`writing-mode__record-btn ${isListening ? 'writing-mode__record-btn--active' : ''}`}
            onClick={isListening ? stopRecognition : startRecognition}
          >
            {isListening ? 'Detener' : 'Grabar'}
          </button>

          {recognizedNotes.length > 0 && !isListening && (
            <button
              className="writing-mode__clear-btn"
              onClick={handleClear}
            >
              Limpiar
            </button>
          )}
        </div>

        {recognizedNotes.length > 0 && (
          <div className="writing-mode__stats">
            {recognizedNotes.length} nota{recognizedNotes.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Save */}
      {convertedNotes.length > 0 && !isListening && (
        <div className="writing-mode__save">
          <input
            className="writing-mode__save-input"
            type="text"
            placeholder="Titulo de la partitura"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
          />
          <button
            className="writing-mode__save-btn"
            onClick={handleSave}
            disabled={!saveTitle.trim()}
          >
            Guardar
          </button>
        </div>
      )}

      {error && (
        <div className="writing-mode__error">{error}</div>
      )}
    </div>
  );
};
