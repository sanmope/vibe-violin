/**
 * PDF Viewer Component
 * Displays a PDF file with a progress bar that moves through notes
 * synchronized with playback timing
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Note } from '@/types';
import './PDFViewer.css';

interface PDFViewerProps {
  /** URL of the PDF file to display */
  pdfUrl?: string;

  /** Array of notes for synchronization */
  notes: Note[];

  /** Current note index */
  currentNoteIndex: number;

  /** Whether playback is active */
  isPlaying: boolean;

  /** Current tempo in BPM */
  tempo: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  notes,
  currentNoteIndex,
  isPlaying,
  tempo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [progressPosition, setProgressPosition] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Calculate total duration of all notes
  const getTotalDuration = useCallback((): number => {
    const msPerBeat = (60 / tempo) * 1000;
    return notes.reduce((total, note) => total + note.durationBeats * msPerBeat, 0);
  }, [notes, tempo]);

  // Calculate cumulative time up to a specific note index
  const getTimeAtNoteIndex = useCallback((index: number): number => {
    const msPerBeat = (60 / tempo) * 1000;
    let time = 0;
    for (let i = 0; i < index && i < notes.length; i++) {
      time += notes[i].durationBeats * msPerBeat;
    }
    return time;
  }, [notes, tempo]);

  // Calculate current note progress (0-1 within the current note)
  const getCurrentNoteProgress = useCallback((): number => {
    if (!isPlaying || notes.length === 0 || currentNoteIndex >= notes.length) {
      return 0;
    }

    const currentNote = notes[currentNoteIndex];
    if (!currentNote) return 0;

    const msPerBeat = (60 / tempo) * 1000;
    const noteDuration = currentNote.durationBeats * msPerBeat;
    const timeAtNoteStart = getTimeAtNoteIndex(currentNoteIndex);
    const timeInNote = elapsedTime - timeAtNoteStart;

    return Math.min(Math.max(timeInNote / noteDuration, 0), 1);
  }, [isPlaying, notes, currentNoteIndex, tempo, elapsedTime, getTimeAtNoteIndex]);

  // Update progress bar position
  useEffect(() => {
    if (!containerRef.current || !progressBarRef.current) return;

    const container = containerRef.current;
    const containerHeight = container.clientHeight;
    
    // Calculate position based on current note and progress within note
    if (notes.length === 0) {
      setProgressPosition(0);
      return;
    }

    // Calculate total duration of all notes
    const totalDuration = getTotalDuration();
    
    // Calculate current time position
    const currentTime = getTimeAtNoteIndex(currentNoteIndex);
    const currentNote = notes[currentNoteIndex];
    const noteProgress = currentNote ? getCurrentNoteProgress() : 0;
    const msPerBeat = (60 / tempo) * 1000;
    const currentNoteDuration = currentNote ? currentNote.durationBeats * msPerBeat : 0;
    const timeInCurrentNote = noteProgress * currentNoteDuration;
    
    const totalElapsedTime = currentTime + timeInCurrentNote;
    
    // Calculate position as percentage of total duration (0-1)
    const position = totalDuration > 0 ? totalElapsedTime / totalDuration : 0;

    // Set the progress bar position (from top to bottom)
    const topPosition = Math.min(Math.max(position * containerHeight, 0), containerHeight);
    setProgressPosition(topPosition);
  }, [currentNoteIndex, isPlaying, elapsedTime, notes, tempo, getCurrentNoteProgress, getTimeAtNoteIndex, getTotalDuration]);

  // Animation loop for smooth progress
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      const now = performance.now();
      if (startTimeRef.current === 0) {
        startTimeRef.current = now - getTimeAtNoteIndex(currentNoteIndex);
      }
      
      const totalElapsed = now - startTimeRef.current;
      setElapsedTime(totalElapsed);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    startTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, currentNoteIndex, notes, tempo]);

  // Reset elapsed time when playback stops
  useEffect(() => {
    if (!isPlaying) {
      setElapsedTime(0);
      startTimeRef.current = 0;
    }
  }, [isPlaying, currentNoteIndex]);

  if (!pdfUrl) {
    return (
      <div className="pdf-viewer pdf-viewer--no-pdf">
        <div className="pdf-viewer__placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 19V6L16 3V16M9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19ZM16 16C16 17.1046 15.1046 18 14 18C12.8954 18 12 17.1046 12 16C12 14.8954 12.8954 14 14 14C15.1046 14 16 14.8954 16 16Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>No PDF disponible</p>
          <span className="pdf-viewer__placeholder-hint">
            Sube un PDF desde la biblioteca para ver la partitura
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer" ref={containerRef}>
      <div className="pdf-viewer__container">
        <object
          data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          type="application/pdf"
          className="pdf-viewer__object"
          title="Sheet Music PDF"
        >
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="pdf-viewer__iframe"
            title="Sheet Music PDF"
          />
        </object>
        
        {/* Progress Bar Overlay */}
        <div className="pdf-viewer__progress-overlay">
          <div
            ref={progressBarRef}
            className="pdf-viewer__progress-bar"
            style={{
              top: `${progressPosition}px`,
              opacity: isPlaying ? 1 : 0.5,
            }}
          />
        </div>
      </div>
    </div>
  );
};

