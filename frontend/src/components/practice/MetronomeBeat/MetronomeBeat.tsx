/**
 * MetronomeBeat Component
 * Visual beat indicator showing numbered circles that pulse on the active beat.
 */

import React from 'react';
import './MetronomeBeat.css';

interface MetronomeBeatProps {
  currentBeat: number;
  beatsPerMeasure: number;
  isActive: boolean;
}

export const MetronomeBeat: React.FC<MetronomeBeatProps> = ({
  currentBeat,
  beatsPerMeasure,
  isActive,
}) => {
  return (
    <div className={`metronome-beat ${!isActive ? 'metronome-beat--inactive' : ''}`}>
      {Array.from({ length: beatsPerMeasure }, (_, i) => {
        const beat = i + 1;
        const isCurrent = isActive && beat === currentBeat;
        const isDownbeat = beat === 1;

        return (
          <div
            key={beat}
            className={[
              'metronome-beat__dot',
              isDownbeat ? 'metronome-beat__dot--downbeat' : '',
              isCurrent ? 'metronome-beat__dot--active' : '',
            ].join(' ')}
          >
            {beat}
          </div>
        );
      })}
    </div>
  );
};
