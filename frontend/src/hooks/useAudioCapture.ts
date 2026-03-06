/**
 * Hook for audio capture and pitch detection
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { DetectedNote } from '@/types/audio.types';
import { AudioCaptureService } from '@/services/audio/AudioCaptureService';

interface UseAudioCaptureReturn {
  isListening: boolean;
  detectedNote: DetectedNote | null;
  rawPitch: number | null;
  clarity: number;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  error: string | null;
}

export function useAudioCapture(): UseAudioCaptureReturn {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<DetectedNote | null>(null);
  const [rawPitch, setRawPitch] = useState<number | null>(null);
  const [clarity, setClarity] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<AudioCaptureService | null>(null);

  const startCapture = useCallback(async () => {
    try {
      setError(null);
      const service = new AudioCaptureService();
      serviceRef.current = service;

      await service.start((result, note) => {
        setRawPitch(result.frequency);
        setClarity(result.clarity);
        setDetectedNote(note);
      });

      setIsListening(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      if (message.includes('Permission') || message.includes('NotAllowed')) {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        setError(message);
      }
      setIsListening(false);
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
      serviceRef.current = null;
    }
    setIsListening(false);
    setDetectedNote(null);
    setRawPitch(null);
    setClarity(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.stop();
        serviceRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    detectedNote,
    rawPitch,
    clarity,
    startCapture,
    stopCapture,
    error,
  };
}
