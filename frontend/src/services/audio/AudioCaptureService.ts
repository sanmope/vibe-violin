/**
 * Audio Capture Service
 * Manages microphone input via Web Audio API and runs pitch detection in a loop.
 */

import type { PitchDetectionResult, DetectedNote } from '@/types/audio.types';
import { detectPitch, frequencyToDetectedNote } from '@/utils/pitchDetection';

export type PitchCallback = (result: PitchDetectionResult, note: DetectedNote | null) => void;

/**
 * Captures audio from microphone and runs continuous pitch detection
 */
export class AudioCaptureService {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private buffer: Float32Array | null = null;
  private callback: PitchCallback | null = null;
  private _isCapturing = false;

  get isCapturing(): boolean {
    return this._isCapturing;
  }

  /**
   * Start capturing audio from the microphone
   */
  async start(callback: PitchCallback): Promise<void> {
    if (this._isCapturing) return;

    this.callback = callback;

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create audio context
      this.audioContext = new AudioContext();

      // Create analyser node
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 4096;
      this.analyserNode.smoothingTimeConstant = 0;

      // Connect microphone to analyser
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyserNode);

      // Create buffer for time-domain data
      this.buffer = new Float32Array(this.analyserNode.fftSize);

      this._isCapturing = true;

      // Start detection loop
      this.detectLoop();
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop capturing audio
   */
  stop(): void {
    this._isCapturing = false;
    this.cleanup();
  }

  private detectLoop = (): void => {
    if (!this._isCapturing || !this.analyserNode || !this.buffer || !this.audioContext) {
      return;
    }

    // Get time-domain data
    // @ts-expect-error Float32Array generic parameter mismatch between ES2020 and ES2024 lib types
    this.analyserNode.getFloatTimeDomainData(this.buffer);

    // Run pitch detection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = detectPitch(this.buffer as any, this.audioContext.sampleRate);

    // Convert to detected note if frequency is valid
    let detectedNote: DetectedNote | null = null;
    if (result.frequency !== null) {
      detectedNote = frequencyToDetectedNote(result.frequency, result.clarity, result.rms, result.timestamp);
    }

    // Call back with results
    if (this.callback) {
      this.callback(result, detectedNote);
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.detectLoop);
  };

  private cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.buffer = null;
    this.callback = null;
  }
}
