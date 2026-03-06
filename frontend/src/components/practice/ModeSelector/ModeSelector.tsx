/**
 * Mode Selector Component
 * Tab bar for switching between practice modes: Playback, Writing, Reading.
 */

import React from 'react';
import './ModeSelector.css';

export type PracticeMode = 'playback' | 'writing' | 'reading';

interface ModeSelectorProps {
  currentMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  /** Disable reading mode when no sheet music is loaded */
  disableReading?: boolean;
}

const MODE_LABELS: Record<PracticeMode, { label: string; description: string }> = {
  playback: { label: 'Reproducir', description: 'Escucha y sigue la partitura' },
  writing: { label: 'Escribir', description: 'Toca y escribe tu musica' },
  reading: { label: 'Lectura', description: 'Practica leyendo la partitura' },
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
  disableReading = false,
}) => {
  const modes: PracticeMode[] = ['playback', 'writing', 'reading'];

  return (
    <div className="mode-selector">
      {modes.map((mode) => {
        const { label } = MODE_LABELS[mode];
        const isDisabled = mode === 'reading' && disableReading;
        const isActive = mode === currentMode;

        return (
          <button
            key={mode}
            className={`mode-selector__tab ${isActive ? 'mode-selector__tab--active' : ''}`}
            onClick={() => !isDisabled && onModeChange(mode)}
            disabled={isDisabled}
            title={MODE_LABELS[mode].description}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
