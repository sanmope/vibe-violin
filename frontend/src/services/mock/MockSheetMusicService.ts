/**
 * Mock implementation of ISheetMusicService for Phase 1 development.
 * Simulates backend behavior with realistic delays and responses.
 */

import type {
  ISheetMusicService,
  SheetMusic,
  Note,
  PaginatedResponse,
  UploadMetadata,
  UploadResponse,
  ProcessingStatusResponse,
} from '@/types';
import { mockSheetMusicLibrary, generateMockNotes } from './mockData';

/**
 * Simulates network delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock Sheet Music Service
 * Provides realistic simulation of backend API for development and testing
 */
export class MockSheetMusicService implements ISheetMusicService {
  private library: SheetMusic[] = [...mockSheetMusicLibrary];
  private processingQueue: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private pdfFiles: Map<string, string> = new Map(); // Map of sheet music ID to blob URL

  /**
   * Simulate uploading a PDF and starting processing
   */
  async uploadSheetMusic(file: File, metadata: UploadMetadata): Promise<UploadResponse> {
    // Simulate upload time based on file size
    const uploadTime = Math.min(1000 + (file.size / 10000), 3000);
    await delay(uploadTime);

    const newId = `mock-sheet-${Date.now()}`;
    
    // Create a blob URL for the uploaded PDF file
    const pdfBlobUrl = URL.createObjectURL(file);
    this.pdfFiles.set(newId, pdfBlobUrl);

    const newSheet: SheetMusic = {
      id: newId,
      title: metadata.title || file.name.replace('.pdf', ''),
      composer: metadata.composer || 'Unknown',
      keySignature: 'C major',
      timeSignature: '4/4',
      tempo: 120,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pdfUrl: pdfBlobUrl, // Store the blob URL
      notes: [],
    };

    this.library.push(newSheet);

    // Simulate processing completion after 3-5 seconds
    const processingTime = 3000 + Math.random() * 2000;
    const timeoutId = setTimeout(() => {
      const sheet = this.library.find(s => s.id === newId);
      if (sheet) {
        sheet.status = 'READY';
        sheet.notes = generateMockNotes(20);
        sheet.updatedAt = new Date().toISOString();
      }
      this.processingQueue.delete(newId);
    }, processingTime);

    this.processingQueue.set(newId, timeoutId);

    return {
      id: newId,
      title: newSheet.title,
      status: 'PROCESSING',
      processingUrl: `/api/v1/processing/status/${newId}/`,
    };
  }

  /**
   * Get a specific sheet music by ID
   */
  async getSheetMusic(id: string): Promise<SheetMusic | null> {
    await delay(300);
    const sheet = this.library.find(s => s.id === id);
    if (!sheet) return null;
    
    // Ensure pdfUrl is set if we have a stored blob URL
    const blobUrl = this.pdfFiles.get(id);
    if (blobUrl && !sheet.pdfUrl) {
      sheet.pdfUrl = blobUrl;
    }
    
    return { ...sheet };
  }

  /**
   * List all sheet music with pagination
   */
  async listSheetMusic(page: number = 1, limit: number = 10): Promise<PaginatedResponse<SheetMusic>> {
    await delay(500);

    const start = (page - 1) * limit;
    const end = start + limit;
    const results = this.library.slice(start, end);

    return {
      count: this.library.length,
      next: end < this.library.length ? page + 1 : null,
      previous: page > 1 ? page - 1 : null,
      results: results.map(sheet => {
        // Ensure pdfUrl is set if we have a stored blob URL
        const blobUrl = this.pdfFiles.get(sheet.id);
        if (blobUrl && !sheet.pdfUrl) {
          sheet.pdfUrl = blobUrl;
        }
        return { ...sheet };
      }),
    };
  }

  /**
   * Delete a sheet music
   */
  async deleteSheetMusic(id: string): Promise<void> {
    await delay(200);

    // Cancel processing if in progress
    const timeoutId = this.processingQueue.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.processingQueue.delete(id);
    }

    // Revoke blob URL to free memory
    const blobUrl = this.pdfFiles.get(id);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      this.pdfFiles.delete(id);
    }

    // Remove from library
    const index = this.library.findIndex(s => s.id === id);
    if (index !== -1) {
      this.library.splice(index, 1);
    }
  }

  /**
   * Get all notes for a specific sheet music
   */
  async getNotes(sheetMusicId: string): Promise<Note[]> {
    await delay(400);

    const sheet = this.library.find(s => s.id === sheetMusicId);
    if (!sheet || !sheet.notes) {
      return [];
    }

    return sheet.notes.map(note => ({ ...note }));
  }

  /**
   * Check processing status
   */
  async getProcessingStatus(id: string): Promise<ProcessingStatusResponse> {
    await delay(200);

    const sheet = this.library.find(s => s.id === id);
    if (!sheet) {
      throw new Error(`Sheet music with ID ${id} not found`);
    }

    // Calculate progress based on status
    let progress = 0;
    let stage = '';

    switch (sheet.status) {
      case 'UPLOADED':
        progress = 10;
        stage = 'Queued for processing';
        break;
      case 'PROCESSING':
        // Simulate progressive stages
        const stages = [
          'Extracting PDF pages',
          'Performing OCR',
          'Detecting musical notation',
          'Analyzing notes',
          'Converting to violin positions',
        ];
        progress = 20 + Math.floor(Math.random() * 60);
        stage = stages[Math.floor((progress - 20) / 15)] || stages[0];
        break;
      case 'READY':
        progress = 100;
        stage = 'Complete';
        break;
      case 'ERROR':
        progress = 0;
        stage = 'Failed';
        break;
    }

    return {
      id,
      status: sheet.status,
      progress,
      stage,
      error: sheet.error,
      sheetMusic: sheet.status === 'READY' ? { ...sheet } : undefined,
    };
  }

  /**
   * Add a pre-parsed sheet music (e.g., from MusicXML browser parsing)
   */
  addParsedSheetMusic(sheetMusic: SheetMusic, notes: Note[]): void {
    const existing = this.library.find(s => s.id === sheetMusic.id);
    if (existing) return;

    this.library.push({
      ...sheetMusic,
      notes,
    });
  }

  /**
   * Cleanup method to clear any pending timeouts and revoke blob URLs
   */
  cleanup(): void {
    this.processingQueue.forEach(timeoutId => clearTimeout(timeoutId));
    this.processingQueue.clear();
    
    // Revoke all blob URLs
    this.pdfFiles.forEach(blobUrl => URL.revokeObjectURL(blobUrl));
    this.pdfFiles.clear();
  }
}
