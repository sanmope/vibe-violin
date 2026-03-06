/**
 * Scale Selector Component
 * Provides buttons to select different musical scales
 */

import React from 'react';
import { COMMON_SCALES, type Scale } from '@/utils/musicScales';
import './ScaleSelector.css';

interface ScaleSelectorProps {
  /** Currently selected scale */
  selectedScale: Scale | null;

  /** Callback when scale is selected */
  onScaleSelect: (scale: Scale | null) => void;
}

export const ScaleSelector: React.FC<ScaleSelectorProps> = ({
  selectedScale,
  onScaleSelect,
}) => {
  const handleScaleClick = (scale: Scale) => {
    // Toggle: if same scale is clicked, deselect it
    if (selectedScale?.name === scale.name) {
      onScaleSelect(null);
    } else {
      onScaleSelect(scale);
    }
  };

  const handleClearClick = () => {
    onScaleSelect(null);
  };

  // Group scales by type
  const majorScales = COMMON_SCALES.filter(s => s.type === 'major');
  const minorScales = COMMON_SCALES.filter(s => s.type === 'minor');

  return (
    <div className="scale-selector">
      <div className="scale-selector__header">
        <h4>Select Scale</h4>
        {selectedScale && (
          <button
            className="scale-selector__clear"
            onClick={handleClearClick}
            aria-label="Clear scale selection"
          >
            Clear
          </button>
        )}
      </div>

      <div className="scale-selector__groups">
        {/* Major Scales */}
        <div className="scale-selector__group">
          <div className="scale-selector__group-label">Major</div>
          <div className="scale-selector__buttons">
            {majorScales.map((scale) => (
              <button
                key={scale.name}
                className={`
                  scale-selector__button
                  ${selectedScale?.name === scale.name ? 'scale-selector__button--active' : ''}
                `}
                onClick={() => handleScaleClick(scale)}
              >
                {scale.name}
              </button>
            ))}
          </div>
        </div>

        {/* Minor Scales */}
        <div className="scale-selector__group">
          <div className="scale-selector__group-label">Minor</div>
          <div className="scale-selector__buttons">
            {minorScales.map((scale) => (
              <button
                key={scale.name}
                className={`
                  scale-selector__button
                  ${selectedScale?.name === scale.name ? 'scale-selector__button--active' : ''}
                `}
                onClick={() => handleScaleClick(scale)}
              >
                {scale.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedScale && (
        <div className="scale-selector__info">
          <span className="scale-selector__selected">
            Selected: <strong>{selectedScale.name}</strong>
          </span>
          <span className="scale-selector__notes">
            Notes: {selectedScale.notes.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

