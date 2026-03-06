/**
 * BowVisualizer Component
 * Displays bowing information:
 * - Direction (up/down bow)
 * - Portion of bow to use (frog/middle/tip)
 * - Technique (détaché, legato, staccato, etc.)
 */

import React from 'react';
import type { BowDirection, BowPortion, BowTechnique } from '@/types';
import './BowVisualizer.css';

interface DurationMilestone {
  beats: number;
  label: string;
  ms: number;
}

interface BowVisualizerProps {
  /** Direction of bow stroke */
  direction: BowDirection;

  /** Which portion of bow to use */
  portion: BowPortion;

  /** Bowing technique */
  technique: BowTechnique;

  /** Optional pressure indication (0-1) */
  pressure?: number;

  /** Duration in ms since the active note started (for duration guide) */
  activeNoteDurationMs?: number | null;

  /** BPM tempo for computing duration milestones */
  tempo?: number;
}

export const BowVisualizer: React.FC<BowVisualizerProps> = ({
  direction,
  portion,
  technique,
  pressure = 0.5,
  activeNoteDurationMs,
  tempo,
}) => {
  // Calculate portion position percentage
  const getPortionPosition = (): { start: number; end: number } => {
    switch (portion) {
      case 'FROG':
        return { start: 0, end: 33 };
      case 'MIDDLE':
        return { start: 33, end: 66 };
      case 'TIP':
        return { start: 66, end: 100 };
      case 'WHOLE':
        return { start: 0, end: 100 };
    }
  };

  const position = getPortionPosition();

  // Get technique display name
  const getTechniqueName = (): string => {
    const names: Record<BowTechnique, string> = {
      DETACHE: 'Détaché',
      LEGATO: 'Legato',
      STACCATO: 'Staccato',
      SPICCATO: 'Spiccato',
      PIZZICATO: 'Pizzicato',
      TREMOLO: 'Tremolo',
      MARTELE: 'Martelé',
      COL_LEGNO: 'Col Legno',
    };
    return names[technique];
  };

  // Get technique description
  const getTechniqueDescription = (): string => {
    const descriptions: Record<BowTechnique, string> = {
      DETACHE: 'Separate, smooth bow strokes',
      LEGATO: 'Multiple notes in one smooth bow',
      STACCATO: 'Short, detached notes',
      SPICCATO: 'Bouncing bow off the string',
      PIZZICATO: 'Pluck with finger',
      TREMOLO: 'Rapid back-and-forth bowing',
      MARTELE: 'Hammered stroke with accent',
      COL_LEGNO: 'Use the wood of the bow',
    };
    return descriptions[technique];
  };

  // Duration guide milestones
  const beatMs = tempo ? 60000 / tempo : 500;
  const milestones: DurationMilestone[] = [
    { beats: 0.5, label: 'Corchea', ms: beatMs * 0.5 },
    { beats: 1,   label: 'Negra',   ms: beatMs },
    { beats: 2,   label: 'Blanca',  ms: beatMs * 2 },
    { beats: 4,   label: 'Redonda', ms: beatMs * 4 },
  ];
  const wholeMs = beatMs * 4;

  const showDurationGuide = activeNoteDurationMs != null && activeNoteDurationMs > 0 && tempo;

  // Determine current quantized duration label
  const getCurrentDurationLabel = (): string => {
    if (!activeNoteDurationMs) return '';
    for (let i = milestones.length - 1; i >= 0; i--) {
      if (activeNoteDurationMs >= milestones[i].ms) return milestones[i].label;
    }
    return '';
  };

  return (
    <div className="bow-visualizer">
      <div className="bow-visualizer__header">
        <h3>Bow Technique</h3>
      </div>

      <div className="bow-visualizer__body">
        {/* Direction indicator */}
        <div className="bow-visualizer__direction">
          <span className="bow-visualizer__label">Direction:</span>
          <div className={`bow-visualizer__direction-indicator bow-visualizer__direction--${direction.toLowerCase()}`}>
            {direction === 'DOWN' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 4L12 20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 20L12 4M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span>{direction === 'DOWN' ? 'Down Bow' : 'Up Bow'}</span>
          </div>
        </div>

        {/* Bow visualization */}
        <div className="bow-visualizer__bow">
          <div className="bow-visualizer__bow-labels">
            <span>Frog</span>
            <span>Middle</span>
            <span>Tip</span>
          </div>

          <div className="bow-visualizer__bow-track">
            {/* Full bow */}
            <div className="bow-visualizer__bow-line" />

            {/* Active portion */}
            <div
              className="bow-visualizer__bow-portion"
              style={{
                left: `${position.start}%`,
                width: `${position.end - position.start}%`,
              }}
            />

            {/* Direction arrow */}
            <div
              className={`bow-visualizer__bow-arrow bow-visualizer__bow-arrow--${direction.toLowerCase()}`}
              style={{
                left: direction === 'DOWN' ? `${position.start}%` : `${position.end}%`,
              }}
            />
          </div>

          <div className="bow-visualizer__bow-markers">
            <span className="bow-visualizer__bow-marker">▼</span>
            <span className="bow-visualizer__bow-marker">▼</span>
            <span className="bow-visualizer__bow-marker">▼</span>
          </div>
        </div>

        {/* Technique info */}
        <div className="bow-visualizer__technique">
          <div className="bow-visualizer__technique-name">{getTechniqueName()}</div>
          <div className="bow-visualizer__technique-description">
            {getTechniqueDescription()}
          </div>
        </div>

        {/* Pressure indicator */}
        <div className="bow-visualizer__pressure">
          <span className="bow-visualizer__label">Pressure:</span>
          <div className="bow-visualizer__pressure-bar">
            <div
              className="bow-visualizer__pressure-fill"
              style={{ width: `${pressure * 100}%` }}
            />
          </div>
          <span className="bow-visualizer__pressure-value">
            {pressure < 0.3 ? 'Light' : pressure < 0.7 ? 'Medium' : 'Heavy'}
          </span>
        </div>

        {/* Duration guide */}
        {showDurationGuide && (
          <div className="bow-visualizer__duration-guide">
            <div className="bow-visualizer__duration-bar">
              <div
                className="bow-visualizer__duration-fill"
                style={{ width: `${Math.min(100, (activeNoteDurationMs! / wholeMs) * 100)}%` }}
              />
              {milestones.map((m) => (
                <span
                  key={m.label}
                  className={`bow-visualizer__duration-marker ${activeNoteDurationMs! >= m.ms ? 'bow-visualizer__duration-marker--reached' : ''}`}
                  style={{ left: `${(m.ms / wholeMs) * 100}%` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <span className="bow-visualizer__duration-value">
              {getCurrentDurationLabel()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
