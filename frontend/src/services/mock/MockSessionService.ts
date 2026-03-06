/**
 * Mock implementation of ISessionService for Phase 1 development.
 * Simulates practice session management with realistic behavior.
 */

import type {
  ISessionService,
  PracticeSession,
  CreateSessionRequest,
  UpdateSessionRequest,
  PaginatedResponse,
} from '@/types';
import { mockSessions, mockSheetMusicLibrary } from './mockData';

/**
 * Simulates network delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock Session Service
 * Manages practice sessions with simulated backend behavior
 */
export class MockSessionService implements ISessionService {
  private sessions: PracticeSession[] = [...mockSessions];

  /**
   * Create a new practice session
   */
  async createSession(request: CreateSessionRequest): Promise<PracticeSession> {
    await delay(300);

    // Find the sheet music
    const sheetMusic = mockSheetMusicLibrary.find(s => s.id === request.sheetMusicId);
    if (!sheetMusic) {
      throw new Error(`Sheet music with ID ${request.sheetMusicId} not found`);
    }

    const newSession: PracticeSession = {
      id: `session-${Date.now()}`,
      sheetMusic: { ...sheetMusic },
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      tempoUsed: request.tempo,
      currentNoteIndex: 0,
      completed: false,
    };

    this.sessions.push(newSession);
    return { ...newSession };
  }

  /**
   * Get a specific session by ID
   */
  async getSession(id: string): Promise<PracticeSession | null> {
    await delay(200);
    const session = this.sessions.find(s => s.id === id);
    return session ? { ...session } : null;
  }

  /**
   * List all sessions with pagination
   */
  async listSessions(page: number = 1, limit: number = 10): Promise<PaginatedResponse<PracticeSession>> {
    await delay(400);

    // Sort by most recent first
    const sortedSessions = [...this.sessions].sort((a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    const start = (page - 1) * limit;
    const end = start + limit;
    const results = sortedSessions.slice(start, end);

    return {
      count: this.sessions.length,
      next: end < this.sessions.length ? page + 1 : null,
      previous: page > 1 ? page - 1 : null,
      results: results.map(session => ({ ...session })),
    };
  }

  /**
   * Update an existing session
   */
  async updateSession(id: string, updates: UpdateSessionRequest): Promise<PracticeSession> {
    await delay(150);

    const session = this.sessions.find(s => s.id === id);
    if (!session) {
      throw new Error(`Session with ID ${id} not found`);
    }

    // Apply updates
    if (updates.currentNoteIndex !== undefined) {
      session.currentNoteIndex = updates.currentNoteIndex;
    }
    if (updates.tempoUsed !== undefined) {
      session.tempoUsed = updates.tempoUsed;
    }
    if (updates.metadata) {
      session.metadata = { ...session.metadata, ...updates.metadata };
    }

    // Update duration if session is still active
    if (!session.endedAt) {
      const startTime = new Date(session.startedAt).getTime();
      const now = Date.now();
      session.durationSeconds = Math.floor((now - startTime) / 1000);
    }

    return { ...session };
  }

  /**
   * Mark a session as complete
   */
  async completeSession(id: string): Promise<PracticeSession> {
    await delay(200);

    const session = this.sessions.find(s => s.id === id);
    if (!session) {
      throw new Error(`Session with ID ${id} not found`);
    }

    session.completed = true;
    session.endedAt = new Date().toISOString();

    // Calculate final duration
    const startTime = new Date(session.startedAt).getTime();
    const endTime = new Date(session.endedAt).getTime();
    session.durationSeconds = Math.floor((endTime - startTime) / 1000);

    return { ...session };
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string): Promise<void> {
    await delay(150);

    const index = this.sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      this.sessions.splice(index, 1);
    }
  }

  /**
   * Get sessions for a specific sheet music
   */
  async getSessionsForSheetMusic(sheetMusicId: string): Promise<PracticeSession[]> {
    await delay(300);

    return this.sessions
      .filter(s => s.sheetMusic.id === sheetMusicId)
      .map(s => ({ ...s }));
  }

  /**
   * Get recent sessions (last N sessions)
   */
  async getRecentSessions(limit: number = 5): Promise<PracticeSession[]> {
    await delay(300);

    return [...this.sessions]
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit)
      .map(s => ({ ...s }));
  }
}
