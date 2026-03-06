/**
 * Staff Notation Component
 * Displays a musical staff with notes. Supports:
 * - Single note display (legacy mode)
 * - Multi-measure rendering with horizontal scrolling
 * - Live mode with auto-scroll to end
 * - Note highlighting and coloring for practice evaluation
 */

import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Stem } from 'vexflow';
import type { Note } from '@/types';
import './StaffNotation.css';

type NoteRating = 'correct' | 'close' | 'wrong';

interface MeasureLayout {
  systemDiv: HTMLDivElement;
  x: number;
  width: number;
}

interface StaffNotationProps {
  /** Single note to display (legacy mode) */
  currentNote?: Note;
  /** Array of notes for multi-measure display */
  notes?: Note[];
  /** ID of the note to highlight */
  highlightedNoteId?: string;
  /** Display mode */
  mode?: 'static' | 'live';
  /** Time signature (e.g., "4/4") */
  timeSignature?: string;
  /** Key signature (e.g., "C major") */
  keySignature?: string;
  /** VexFlow key signature spec (e.g., "D", "Gm", "Bb") */
  vexflowKeySignature?: string;
  /** Number of measures per system/line (default 4) */
  measuresPerSystem?: number;
  /** Auto-scroll to the last note in live mode */
  scrollToEnd?: boolean;
  /** Per-note color styles for evaluation feedback */
  noteStyles?: Record<string, NoteRating>;
  /** Cursor position for metronome beat indicator */
  cursorPosition?: { measure: number; beatFraction: number };
  /** Overlay notes (played notes) for dual-voice rendering */
  overlayNotes?: Note[];
  /** Per-overlay-note color styles */
  overlayNoteStyles?: Record<string, NoteRating>;
}

const STAVE_HEIGHT = 200;
const STAVE_Y = 40;
const STAVE_MARGIN = 10;

const RATING_COLORS: Record<NoteRating, string> = {
  correct: '#10b981',
  close: '#f59e0b',
  wrong: '#ef4444',
};

const OVERLAY_COLORS: Record<NoteRating, string> = {
  correct: '#3b82f6',   // Blue
  close: '#60a5fa',     // Light blue
  wrong: '#ef4444',     // Red
};

const FADED_NOTE_COLOR = '#cbd5e1'; // Light gray for expected notes when overlay is active

export const StaffNotation: React.FC<StaffNotationProps> = ({
  currentNote,
  notes,
  highlightedNoteId,
  mode = 'static',
  timeSignature = '4/4',
  vexflowKeySignature,
  measuresPerSystem = 4,
  scrollToEnd = false,
  noteStyles,
  cursorPosition,
  overlayNotes,
  overlayNoteStyles,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const measureLayoutsRef = useRef<Map<number, MeasureLayout>>(new Map());

  // Track which measure the cursor is in so we only re-render on measure boundary changes
  const cursorMeasure = cursorPosition?.measure;

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';
    measureLayoutsRef.current.clear();

    // If notes array is provided, or cursor needs empty measures, render multi-measure
    if ((notes && notes.length > 0) || cursorMeasure) {
      renderMultiMeasure(notes ?? []);
    } else if (currentNote) {
      renderSingleNote(currentNote);
    } else {
      renderEmptyStaff();
    }
  }, [currentNote, notes, highlightedNoteId, timeSignature, noteStyles, measuresPerSystem, vexflowKeySignature, cursorMeasure, overlayNotes, overlayNoteStyles]);

  // Auto-scroll to end in live mode
  useEffect(() => {
    if (scrollToEnd && scrollRef.current && mode === 'live') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes, scrollToEnd, mode]);

  // Cursor overlay for metronome beat
  useEffect(() => {
    if (!cursorPosition) {
      // Remove any existing cursors
      containerRef.current?.querySelectorAll('.staff-notation__cursor').forEach(el => el.remove());
      return;
    }

    const layout = measureLayoutsRef.current.get(cursorPosition.measure);
    if (!layout) return;

    const x = layout.x + layout.width * cursorPosition.beatFraction;

    // Remove cursors from all systems
    containerRef.current?.querySelectorAll('.staff-notation__cursor').forEach(el => el.remove());

    // Find the SVG inside this system's div
    const svg = layout.systemDiv.querySelector('svg');
    if (!svg) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.classList.add('staff-notation__cursor');
    line.setAttribute('x1', String(x));
    line.setAttribute('x2', String(x));
    line.setAttribute('y1', String(STAVE_Y));
    line.setAttribute('y2', String(STAVE_Y + 80));
    svg.appendChild(line);
  }, [cursorPosition]);

  function renderEmptyStaff(): void {
    if (!containerRef.current) return;
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    const width = containerRef.current.clientWidth || 600;
    renderer.resize(width, STAVE_HEIGHT);
    const context = renderer.getContext();

    const stave = new Stave(STAVE_MARGIN, STAVE_Y, width - STAVE_MARGIN * 2);
    stave.addClef('treble');
    stave.addTimeSignature(timeSignature);
    stave.setContext(context).draw();
  }

  function renderSingleNote(note: Note): void {
    if (!containerRef.current) return;
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    const width = containerRef.current.clientWidth || 600;
    renderer.resize(width, STAVE_HEIGHT);
    const context = renderer.getContext();

    const stave = new Stave(STAVE_MARGIN, STAVE_Y, width - STAVE_MARGIN * 2);
    stave.addClef('treble');
    stave.addTimeSignature(timeSignature);
    stave.setContext(context).draw();

    try {
      const staveNote = createStaveNote(note);
      applyNoteStyle(staveNote, note.id);

      const [beatsNum] = parseTimeSignature(timeSignature);
      const voice = new Voice({ num_beats: beatsNum, beat_value: 4 });
      voice.setStrict(false);
      voice.addTickables([staveNote]);

      new Formatter().joinVoices([voice]).format([voice], width - 40);
      voice.draw(context, stave);
    } catch (error) {
      console.error('Error rendering note:', error);
    }
  }

  function renderMultiMeasure(allNotes: Note[]): void {
    if (!containerRef.current) return;

    // Group notes by measure
    const measureMap = new Map<number, Note[]>();
    allNotes.forEach(note => {
      const measure = note.measure || 1;
      if (!measureMap.has(measure)) {
        measureMap.set(measure, []);
      }
      measureMap.get(measure)!.push(note);
    });

    // Group overlay notes by measure
    const overlayMeasureMap = new Map<number, Note[]>();
    if (overlayNotes) {
      overlayNotes.forEach(note => {
        const measure = note.measure || 1;
        if (!overlayMeasureMap.has(measure)) {
          overlayMeasureMap.set(measure, []);
        }
        overlayMeasureMap.get(measure)!.push(note);
      });
    }

    // Ensure enough empty measures exist for the cursor
    const maxNoteMeasure = measureMap.size > 0 ? Math.max(...measureMap.keys()) : 0;
    const totalMeasures = Math.max(maxNoteMeasure, cursorMeasure ?? 0, 1);
    for (let i = 1; i <= totalMeasures; i++) {
      if (!measureMap.has(i)) measureMap.set(i, []);
    }

    const measureNumbers = Array.from(measureMap.keys()).sort((a, b) => a - b);
    const [beatsNum] = parseTimeSignature(timeSignature);

    // Split measures into systems (chunks of measuresPerSystem)
    const systems: number[][] = [];
    for (let i = 0; i < measureNumbers.length; i += measuresPerSystem) {
      systems.push(measureNumbers.slice(i, i + measuresPerSystem));
    }

    const containerWidth = containerRef.current.clientWidth || 600;

    // Render each system as its own div + SVG
    systems.forEach((systemMeasures, systemIndex) => {
      const systemDiv = document.createElement('div');
      systemDiv.className = 'staff-notation__system';
      containerRef.current!.appendChild(systemDiv);

      // Calculate widths: first measure of each system has clef + key sig, first system also has time sig
      const clefKeySigExtra = 60 + (vexflowKeySignature && vexflowKeySignature !== 'C' ? 30 : 0);
      const timeSigExtra = systemIndex === 0 ? 30 : 0;
      const firstMeasureExtra = clefKeySigExtra + timeSigExtra;
      const availableWidth = containerWidth - STAVE_MARGIN * 2;
      const measureWidth = (availableWidth - firstMeasureExtra) / systemMeasures.length;
      const firstMeasureWidth = measureWidth + firstMeasureExtra;

      const renderer = new Renderer(systemDiv, Renderer.Backends.SVG);
      renderer.resize(containerWidth, STAVE_HEIGHT);
      const context = renderer.getContext();

      let xOffset = STAVE_MARGIN;

      systemMeasures.forEach((measureNum, measureIndex) => {
        const measNotes = measureMap.get(measureNum) ?? [];
        const overlayMeasNotes = overlayMeasureMap.get(measureNum) ?? [];
        const isFirstInSystem = measureIndex === 0;
        const staveW = isFirstInSystem ? firstMeasureWidth : measureWidth;

        const stave = new Stave(xOffset, STAVE_Y, staveW);
        if (isFirstInSystem) {
          stave.addClef('treble');
          if (vexflowKeySignature && vexflowKeySignature !== 'C') {
            stave.addKeySignature(vexflowKeySignature);
          }
          if (systemIndex === 0) {
            stave.addTimeSignature(timeSignature);
          }
        }
        stave.setContext(context).draw();

        // Record layout for cursor positioning
        measureLayoutsRef.current.set(measureNum, {
          systemDiv,
          x: xOffset,
          width: staveW,
        });

        try {
          if (overlayNotes && overlayMeasNotes.length > 0) {
            // Dual-voice mode: expected notes faded (stem up) + overlay notes colored (stem down)
            const expectedStaveNotes = measNotes.map(note => {
              const sn = createStaveNote(note, Stem.UP);
              colorNote(sn, FADED_NOTE_COLOR);
              return sn;
            });

            const overlayStaveNotes = overlayMeasNotes.map(note => {
              const sn = createStaveNote(note, Stem.DOWN);
              const rating = overlayNoteStyles?.[note.id];
              const color = rating ? OVERLAY_COLORS[rating] : OVERLAY_COLORS.correct;
              colorNote(sn, color);
              return sn;
            });

            if (expectedStaveNotes.length > 0 || overlayStaveNotes.length > 0) {
              const formatter = new Formatter();

              if (expectedStaveNotes.length > 0) {
                const expectedVoice = new Voice({ num_beats: beatsNum, beat_value: 4 });
                expectedVoice.setStrict(false);
                expectedVoice.addTickables(expectedStaveNotes);
                formatter.joinVoices([expectedVoice]);

                if (overlayStaveNotes.length > 0) {
                  const overlayVoice = new Voice({ num_beats: beatsNum, beat_value: 4 });
                  overlayVoice.setStrict(false);
                  overlayVoice.addTickables(overlayStaveNotes);
                  formatter.joinVoices([overlayVoice]);

                  formatter.format([expectedVoice, overlayVoice], staveW - 30);
                  expectedVoice.draw(context, stave);
                  overlayVoice.draw(context, stave);
                } else {
                  formatter.format([expectedVoice], staveW - 30);
                  expectedVoice.draw(context, stave);
                }
              } else if (overlayStaveNotes.length > 0) {
                const overlayVoice = new Voice({ num_beats: beatsNum, beat_value: 4 });
                overlayVoice.setStrict(false);
                overlayVoice.addTickables(overlayStaveNotes);
                formatter.joinVoices([overlayVoice]);
                formatter.format([overlayVoice], staveW - 30);
                overlayVoice.draw(context, stave);
              }
            }
          } else {
            // Standard single-voice mode
            const staveNotes = measNotes.map(note => {
              const sn = createStaveNote(note);
              // When overlay prop exists (practice active) but no overlay notes in this measure, fade expected notes
              if (overlayNotes) {
                colorNote(sn, FADED_NOTE_COLOR);
              } else {
                applyNoteStyle(sn, note.id);
              }
              return sn;
            });

            if (staveNotes.length > 0) {
              const voice = new Voice({ num_beats: beatsNum, beat_value: 4 });
              voice.setStrict(false);
              voice.addTickables(staveNotes);

              new Formatter().joinVoices([voice]).format([voice], staveW - 30);
              voice.draw(context, stave);
            }
          }
        } catch (error) {
          console.error(`Error rendering measure ${measureNum}:`, error);
        }

        xOffset += staveW;
      });
    });
  }

  /**
   * Apply a color to all sub-elements of a StaveNote (noteheads, stem, flag).
   * Uses per-element inline styles to override the CSS rule on svg g elements.
   */
  function colorNote(staveNote: StaveNote, color: string): void {
    const style = { fillStyle: color, strokeStyle: color };
    staveNote.setStyle(style);
    staveNote.setStemStyle(style);
    staveNote.setFlagStyle(style);
    staveNote.getKeys().forEach((_, i) => {
      staveNote.setKeyStyle(i, style);
    });
  }

  function applyNoteStyle(staveNote: StaveNote, noteId: string): void {
    // Highlight
    if (highlightedNoteId && noteId === highlightedNoteId) {
      colorNote(staveNote, '#6366f1');
    }

    // Evaluation colors
    if (noteStyles && noteStyles[noteId]) {
      colorNote(staveNote, RATING_COLORS[noteStyles[noteId]]);
    }
  }

  const showScroll = mode === 'live' || (notes && notes.length > 4);

  return (
    <div className="staff-notation">
      <div
        className={`staff-notation__scroll ${showScroll ? 'staff-notation__scroll--scrollable' : ''}`}
        ref={scrollRef}
      >
        <div className="staff-notation__container" ref={containerRef} />
      </div>
      {!currentNote && (!notes || notes.length === 0) && !cursorPosition && (
        <div className="staff-notation__empty">
          <p>Select a note to see it on the staff</p>
        </div>
      )}
    </div>
  );
};

/**
 * Convert a Note to a VexFlow StaveNote
 */
function createStaveNote(note: Note, stemDirection?: number): StaveNote {
  const pitch = parsePitchToVexFlow(note.pitch, note.octave);
  const duration = mapDurationToVexFlow(note.duration);

  const staveNote = new StaveNote({
    clef: 'treble',
    keys: [pitch],
    duration,
    ...(stemDirection !== undefined && { stem_direction: stemDirection }),
  });

  // Add accidental if needed
  const accidental = extractAccidental(note.pitch);
  if (accidental) {
    staveNote.addModifier(new Accidental(accidental));
  }

  return staveNote;
}

/**
 * Parse pitch from "A4" or "C#5" format to VexFlow "A/4" or "C#/5" format
 */
function parsePitchToVexFlow(pitch: string, octave?: number): string {
  const match = pitch.match(/^([A-G])([#b]?)(\d*)$/);
  if (!match) {
    throw new Error(`Invalid pitch format: ${pitch}`);
  }

  const [, note, accidental, octStr] = match;
  const oct = octStr || (octave !== undefined ? String(octave) : '4');

  let noteName = note;
  if (accidental) {
    noteName = `${note}${accidental}`;
  }

  return `${noteName}/${oct}`;
}

/**
 * Extract accidental character from pitch string
 */
function extractAccidental(pitch: string): string | null {
  const match = pitch.match(/^[A-G]([#b]+)/);
  return match ? match[1] : null;
}

/**
 * Map duration to VexFlow duration
 */
function mapDurationToVexFlow(duration: string): string {
  const durationMap: Record<string, string> = {
    'whole': 'w',
    'half': 'h',
    'quarter': 'q',
    'eighth': '8',
    'sixteenth': '16',
    'thirty-second': '32',
  };

  return durationMap[duration] || 'q';
}

/**
 * Parse time signature string to [beats, beat_value]
 */
function parseTimeSignature(ts: string): [number, number] {
  const parts = ts.split('/');
  if (parts.length === 2) {
    return [parseInt(parts[0], 10) || 4, parseInt(parts[1], 10) || 4];
  }
  return [4, 4];
}
