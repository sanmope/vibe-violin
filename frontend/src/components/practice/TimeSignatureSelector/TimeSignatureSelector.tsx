/**
 * TimeSignatureSelector Component
 * Dropdown selector for common time signatures.
 */

import React from 'react';
import './TimeSignatureSelector.css';

interface TimeSignatureSelectorProps {
  value: string;
  onChange: (ts: string) => void;
  disabled?: boolean;
}

const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '6/8'];

export const TimeSignatureSelector: React.FC<TimeSignatureSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="time-signature-selector">
      <label className="time-signature-selector__label">Compas:</label>
      <select
        className="time-signature-selector__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {TIME_SIGNATURES.map((ts) => (
          <option key={ts} value={ts}>
            {ts}
          </option>
        ))}
      </select>
    </div>
  );
};
