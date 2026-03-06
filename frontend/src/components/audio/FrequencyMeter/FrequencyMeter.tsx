/**
 * Frequency Meter Component
 * Semicircular gauge showing pitch accuracy like a chromatic tuner.
 * Needle moves from -50 to +50 cents. Colors indicate accuracy.
 */

import React from 'react';
import type { DetectedNote } from '@/types/audio.types';
import './FrequencyMeter.css';

interface FrequencyMeterProps {
  detectedNote: DetectedNote | null;
  targetNote?: string;
  rawFrequency?: number | null;
  clarity?: number;
}

export const FrequencyMeter: React.FC<FrequencyMeterProps> = ({
  detectedNote,
  targetNote,
  rawFrequency,
  clarity = 0,
}) => {
  const cents = detectedNote?.centsDeviation ?? 0;
  const clampedCents = Math.max(-50, Math.min(50, cents));

  // Needle angle: -90deg (left, -50 cents) to +90deg (right, +50 cents)
  const needleAngle = (clampedCents / 50) * 90;

  const absCents = Math.abs(clampedCents);
  const accuracyClass =
    absCents <= 5 ? 'accurate' :
    absCents <= 15 ? 'close' :
    'off';

  const displayPitch = detectedNote?.pitch ?? '--';
  const displayFreq = rawFrequency ? `${rawFrequency.toFixed(1)} Hz` : '-- Hz';
  const displayCents = detectedNote
    ? `${clampedCents > 0 ? '+' : ''}${clampedCents.toFixed(0)} cents`
    : '-- cents';

  return (
    <div className="frequency-meter">
      <div className="frequency-meter__gauge">
        <svg viewBox="0 0 300 180" className="frequency-meter__svg">
          {/* Background arc */}
          <path
            d="M 30 150 A 120 120 0 0 1 270 150"
            fill="none"
            stroke="var(--color-surface-light)"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Color zones */}
          {/* Red left */}
          <path
            d="M 30 150 A 120 120 0 0 1 78 58"
            fill="none"
            stroke="var(--color-error)"
            strokeWidth="20"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Yellow left */}
          <path
            d="M 78 58 A 120 120 0 0 1 114 37"
            fill="none"
            stroke="var(--color-warning)"
            strokeWidth="20"
            opacity="0.4"
          />
          {/* Green center */}
          <path
            d="M 114 37 A 120 120 0 0 1 186 37"
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="20"
            opacity="0.5"
          />
          {/* Yellow right */}
          <path
            d="M 186 37 A 120 120 0 0 1 222 58"
            fill="none"
            stroke="var(--color-warning)"
            strokeWidth="20"
            opacity="0.4"
          />
          {/* Red right */}
          <path
            d="M 222 58 A 120 120 0 0 1 270 150"
            fill="none"
            stroke="var(--color-error)"
            strokeWidth="20"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Center tick */}
          <line x1="150" y1="28" x2="150" y2="42" stroke="var(--color-text)" strokeWidth="2" />

          {/* Needle */}
          <g
            transform={`rotate(${needleAngle}, 150, 150)`}
            className={`frequency-meter__needle ${detectedNote ? 'active' : ''}`}
          >
            <line
              x1="150" y1="150" x2="150" y2="40"
              stroke="var(--color-text)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="150" cy="150" r="6" fill="var(--color-primary)" />
          </g>

          {/* Labels */}
          <text x="25" y="168" className="frequency-meter__label" textAnchor="start">-50</text>
          <text x="150" y="18" className="frequency-meter__label" textAnchor="middle">0</text>
          <text x="275" y="168" className="frequency-meter__label" textAnchor="end">+50</text>
        </svg>
      </div>

      <div className="frequency-meter__info">
        <div className={`frequency-meter__note frequency-meter__note--${accuracyClass}`}>
          {displayPitch}
        </div>
        <div className="frequency-meter__details">
          <span className="frequency-meter__freq">{displayFreq}</span>
          <span className="frequency-meter__cents">{displayCents}</span>
        </div>
        {targetNote && (
          <div className="frequency-meter__target">
            Target: <strong>{targetNote}</strong>
          </div>
        )}
        {clarity > 0 && (
          <div className="frequency-meter__clarity">
            <div
              className="frequency-meter__clarity-bar"
              style={{ width: `${Math.round(clarity * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
