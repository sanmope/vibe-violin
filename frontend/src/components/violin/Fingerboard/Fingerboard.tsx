/**
 * Fingerboard Component
 * Interactive visualization of the violin fingerboard showing:
 * - Four strings (G, D, A, E)
 * - Finger positions (0-4) with exact real-world distances
 * - Current note highlighting
 */

import React from 'react';
import type { Note, ViolinString, PositionHighlight } from '@/types';
import { STRING_ORDER_VISUAL } from '@/types';
import { getFirstPositionNotesForString } from '@/utils/violinFirstPosition';
import type { FirstPositionNote } from '@/utils/violinFirstPosition';
import { isPitchInScale, type Scale } from '@/utils/musicScales';
import './Fingerboard.css';

interface FingerboardProps {
  /** Current note being played/practiced */
  currentNote?: Note;

  /** Position to highlight */
  highlightPosition?: PositionHighlight;

  /** Whether to show position labels */
  showLabels?: boolean;

  /** Optional background image URL for the fingerboard */
  backgroundImageUrl?: string;

  /** Selected scale to filter notes */
  selectedScale?: Scale | null;
}

export const Fingerboard: React.FC<FingerboardProps> = ({
  currentNote,
  highlightPosition: _highlightPosition,
  showLabels = true,
  backgroundImageUrl,
  selectedScale,
}) => {
  // Get hand position from current note, default to 1st position
  // TODO: Use hand position for position-aware rendering
  void (currentNote?.handPosition || 1);
  
  // For first position, get ALL notes including alternatives
  // Calculate ALL possible positions across ALL strings to find the true maximum
  const allStringsNotes = STRING_ORDER_VISUAL.flatMap(s => 
    getFirstPositionNotesForString(s)
  );
  const globalMaxPosition = Math.max(...allStringsNotes.map(note => note.position));
  
  // Use the global maximum to scale all positions
  // This ensures positions are distributed across the full width of the fingerboard
  // Scale to use 95% of available space, leaving a small margin
  const scaleFactor = 0.95;
  
  // Use the global max position, ensuring it's meaningful
  // In first position, the highest note (E string, finger 4) is around 15-18% of scale
  // We'll use this to scale everything proportionally
  const effectiveMaxPosition = Math.max(globalMaxPosition, 0.18);

  // Normalize positions to fill the available space proportionally
  // This distributes positions across the full width while maintaining exact relative distances
  const normalizePosition = (position: number): number => {
    if (effectiveMaxPosition === 0) return 0;
    // Scale from 0-effectiveMaxPosition to 0-scaleFactor (95% of space)
    // This ensures all positions are visible and distributed across the fingerboard
    return (position / effectiveMaxPosition) * scaleFactor;
  };

  const getStringColor = (string: ViolinString): string => {
    const colors = {
      E: 'var(--color-string-e)',
      A: 'var(--color-string-a)',
      D: 'var(--color-string-d)',
      G: 'var(--color-string-g)',
    };
    return colors[string];
  };

  const isNoteHighlighted = (note: FirstPositionNote): boolean => {
    if (!currentNote) return false;

    // Match by pitch + string only — guarantees at most one highlight per string
    return currentNote.pitch === note.pitch && currentNote.violinString === note.string;
  };

  const renderString = (string: ViolinString) => {
    // Get ALL notes for this string in first position (including alternatives)
    const allNotes = getFirstPositionNotesForString(string);

    return (
      <div key={string} className="fingerboard__string-container">
        {/* String label */}
        <div
          className="fingerboard__string-label"
          style={{ color: getStringColor(string) }}
        >
          {string}
        </div>

        {/* String line with ALL notes, including alternatives */}
        <div className="fingerboard__string-line">
          {allNotes.map((note) => {
            const isCurrentNote = isNoteHighlighted(note);
            const normalizedPosition = normalizePosition(note.position);
            const leftPercent = normalizedPosition * 100;
            
            // Check if note is in the selected scale
            const isInScale = isPitchInScale(note.pitch, selectedScale ?? null);
            const isDisabled = selectedScale && !isInScale;

            return (
              <div
                key={`${string}-${note.pitch}-${note.finger}`}
                className={`
                  fingerboard__position
                  ${note.isAlternative ? 'fingerboard__position--alternative' : ''}
                  ${isCurrentNote ? 'fingerboard__position--current' : ''}
                  ${isDisabled ? 'fingerboard__position--disabled' : ''}
                  ${selectedScale && isInScale ? 'fingerboard__position--in-scale' : ''}
                `}
                style={{
                  left: `${leftPercent}%`,
                  borderColor: isCurrentNote ? getStringColor(string) : undefined,
                }}
                title={`${note.pitch} - Finger ${note.finger === 0 ? 'Open' : note.finger}${selectedScale ? ` (${isInScale ? 'in scale' : 'not in scale'})` : ''}`}
              >
                {showLabels && (
                  <span className="fingerboard__position-label">
                    {note.finger === 0 ? 'O' : note.finger}
                  </span>
                )}
                {showLabels && (
                  <span className="fingerboard__position-pitch">{note.pitch}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fingerboard"
      style={backgroundImageUrl ? {
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : undefined}
    >
      <div className="fingerboard__header">
        <h3>Finger Position</h3>
        {currentNote && (
          <div className="fingerboard__current-note">
            <span className="fingerboard__note-pitch">{currentNote.pitch}</span>
            <span className="fingerboard__note-info">
              {currentNote.violinString} string, finger {currentNote.fingerPosition}
              {currentNote.fingerPosition === 0 && ' (open)'}
            </span>
          </div>
        )}
      </div>

      <div className="fingerboard__body">
        {STRING_ORDER_VISUAL.map((string) => renderString(string))}
      </div>

      {currentNote && (
        <div className="fingerboard__footer">
          <span className="fingerboard__position-name">
            {currentNote.handPosition}
            {currentNote.handPosition === 1
              ? 'st'
              : currentNote.handPosition === 2
              ? 'nd'
              : currentNote.handPosition === 3
              ? 'rd'
              : 'th'}{' '}
            position
          </span>
        </div>
      )}
    </div>
  );
};
