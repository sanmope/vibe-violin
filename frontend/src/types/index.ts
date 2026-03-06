/**
 * Central export point for all type definitions.
 * Import types from this file throughout the application.
 */

// Music types
export type {
  Note,
  SheetMusic,
  NoteDuration,
  Pitch,
  TimeSignature,
  KeySignature,
  Articulation,
  Dynamic,
  ProcessingStatus,
} from './music.types';

// Violin types
export type {
  ViolinString,
  BowDirection,
  BowPortion,
  BowTechnique,
  HandPosition,
  FingerNumber,
  FingerboardPosition,
  BowingInfo,
  PositionHighlight,
  StringTuning,
} from './violin.types';

export {
  VIOLIN_TUNING,
  STRING_ORDER,
  STRING_ORDER_VISUAL,
} from './violin.types';

// API types
export type {
  PaginatedResponse,
  UploadMetadata,
  UploadResponse,
  ProcessingStatusResponse,
  PracticeSession,
  CreateSessionRequest,
  UpdateSessionRequest,
  ISheetMusicService,
  ISessionService,
  IAudioService,
  ApiError,
} from './api.types';

export { ServiceMode } from './api.types';

// Audio types
export type {
  PitchDetectionResult,
  DetectedNote,
  RecognizedNote,
  NoteEvaluation,
  PracticeEvaluation,
} from './audio.types';
