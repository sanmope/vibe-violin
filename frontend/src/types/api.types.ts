/**
 * API-related type definitions.
 * Types for API requests, responses, and service interfaces.
 */

import type { SheetMusic, Note } from './music.types';

/**
 * Standard paginated API response
 */
export interface PaginatedResponse<T> {
  /** Total count of items */
  count: number;

  /** URL for next page (null if last page) */
  next: number | null;

  /** URL for previous page (null if first page) */
  previous: number | null;

  /** Array of results for current page */
  results: T[];
}

/**
 * Metadata for uploading sheet music
 */
export interface UploadMetadata {
  /** Title of the piece */
  title: string;

  /** Composer name (optional) */
  composer?: string;

  /** Additional notes (optional) */
  notes?: string;
}

/**
 * Response from sheet music upload endpoint
 */
export interface UploadResponse {
  /** Unique ID of the uploaded sheet music */
  id: string;

  /** Title */
  title: string;

  /** Current processing status */
  status: 'UPLOADED' | 'PROCESSING';

  /** URL to check processing status */
  processingUrl: string;
}

/**
 * Processing status response
 */
export interface ProcessingStatusResponse {
  /** Sheet music ID */
  id: string;

  /** Current status */
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'ERROR';

  /** Progress percentage (0-100) */
  progress: number;

  /** Current processing stage */
  stage?: string;

  /** Error message if status is ERROR */
  error?: string;

  /** Complete sheet music data if status is READY */
  sheetMusic?: SheetMusic;
}

/**
 * Practice session data
 */
export interface PracticeSession {
  /** Unique session ID */
  id: string;

  /** Associated sheet music */
  sheetMusic: SheetMusic;

  /** When the session started */
  startedAt: string;

  /** When the session ended (null if still active) */
  endedAt?: string;

  /** Total duration in seconds */
  durationSeconds: number;

  /** Tempo used for practice (BPM) */
  tempoUsed: number;

  /** Current note index being practiced */
  currentNoteIndex: number;

  /** Whether the session is completed */
  completed: boolean;

  /** Additional session data */
  metadata?: Record<string, unknown>;
}

/**
 * Request to create a new practice session
 */
export interface CreateSessionRequest {
  /** Sheet music ID to practice */
  sheetMusicId: string;

  /** Tempo to use (BPM) */
  tempo: number;
}

/**
 * Request to update a practice session
 */
export interface UpdateSessionRequest {
  /** Current note index */
  currentNoteIndex?: number;

  /** Tempo adjustment */
  tempoUsed?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Sheet Music Service Interface
 * Defines methods for interacting with sheet music data
 */
export interface ISheetMusicService {
  /**
   * Upload a new sheet music PDF
   */
  uploadSheetMusic(file: File, metadata: UploadMetadata): Promise<UploadResponse>;

  /**
   * Get a specific sheet music by ID
   */
  getSheetMusic(id: string): Promise<SheetMusic | null>;

  /**
   * List all sheet music with pagination
   */
  listSheetMusic(page?: number, limit?: number): Promise<PaginatedResponse<SheetMusic>>;

  /**
   * Delete a sheet music
   */
  deleteSheetMusic(id: string): Promise<void>;

  /**
   * Get all notes for a specific sheet music
   */
  getNotes(sheetMusicId: string): Promise<Note[]>;

  /**
   * Check processing status
   */
  getProcessingStatus(id: string): Promise<ProcessingStatusResponse>;

  /**
   * Add a pre-parsed sheet music (e.g., from MusicXML browser parsing)
   */
  addParsedSheetMusic?(sheetMusic: SheetMusic, notes: Note[]): void;
}

/**
 * Session Service Interface
 * Defines methods for managing practice sessions
 */
export interface ISessionService {
  /**
   * Create a new practice session
   */
  createSession(request: CreateSessionRequest): Promise<PracticeSession>;

  /**
   * Get a specific session by ID
   */
  getSession(id: string): Promise<PracticeSession | null>;

  /**
   * List all sessions with pagination
   */
  listSessions(page?: number, limit?: number): Promise<PaginatedResponse<PracticeSession>>;

  /**
   * Update an existing session
   */
  updateSession(id: string, updates: UpdateSessionRequest): Promise<PracticeSession>;

  /**
   * Mark a session as complete
   */
  completeSession(id: string): Promise<PracticeSession>;

  /**
   * Delete a session
   */
  deleteSession(id: string): Promise<void>;
}

/**
 * Audio Service Interface
 * Defines methods for audio playback
 */
export interface IAudioService {
  /**
   * Load notes for playback
   */
  loadNotes(notes: Note[]): Promise<void>;

  /**
   * Play a specific note
   */
  playNote(note: Note): Promise<void>;

  /**
   * Stop current note
   */
  stopNote(): void;

  /**
   * Set playback tempo
   */
  setTempo(bpm: number): void;

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void;

  /**
   * Cleanup and release resources
   */
  cleanup(): void;
}

/**
 * API Error response
 */
export interface ApiError {
  /** Error message */
  message: string;

  /** HTTP status code */
  statusCode: number;

  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Service mode enum
 */
export enum ServiceMode {
  /** Use mock data (Phase 1) */
  MOCK = 'mock',

  /** Use real API (Phase 2) */
  API = 'api',
}
