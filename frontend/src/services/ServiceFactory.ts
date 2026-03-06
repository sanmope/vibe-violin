/**
 * Service Factory
 * Provides a unified interface for switching between mock and real API services.
 *
 * Phase 1: Uses mock services for frontend-only development
 * Phase 2: Switches to real API services
 *
 * Usage:
 *   const sheetMusicService = ServiceFactory.getSheetMusicService();
 *   const sessions = await sheetMusicService.listSheetMusic();
 */

import type { ISheetMusicService, ISessionService } from '@/types';
import { ServiceMode } from '@/types';
import { MockSheetMusicService, MockSessionService } from './mock';

/**
 * Service Factory Configuration
 */
class ServiceFactoryConfig {
  private static instance: ServiceFactoryConfig;
  private mode: ServiceMode = ServiceMode.MOCK; // Default to mock for Phase 1

  private constructor() {}

  static getInstance(): ServiceFactoryConfig {
    if (!ServiceFactoryConfig.instance) {
      ServiceFactoryConfig.instance = new ServiceFactoryConfig();
    }
    return ServiceFactoryConfig.instance;
  }

  setMode(mode: ServiceMode): void {
    this.mode = mode;
    console.log(`Service mode set to: ${mode}`);
  }

  getMode(): ServiceMode {
    return this.mode;
  }
}

/**
 * Service Factory
 * Creates service instances based on current mode
 */
export class ServiceFactory {
  private static sheetMusicService: ISheetMusicService | null = null;
  private static sessionService: ISessionService | null = null;

  /**
   * Set the service mode (MOCK or API)
   * Call this at app initialization to configure the service layer
   */
  static setMode(mode: ServiceMode): void {
    ServiceFactoryConfig.getInstance().setMode(mode);

    // Clear cached instances to force recreation with new mode
    this.sheetMusicService = null;
    this.sessionService = null;
  }

  /**
   * Get current service mode
   */
  static getMode(): ServiceMode {
    return ServiceFactoryConfig.getInstance().getMode();
  }

  /**
   * Get Sheet Music Service
   * Returns mock service in Phase 1, real API service in Phase 2
   */
  static getSheetMusicService(): ISheetMusicService {
    if (!this.sheetMusicService) {
      const mode = ServiceFactoryConfig.getInstance().getMode();

      if (mode === ServiceMode.MOCK) {
        this.sheetMusicService = new MockSheetMusicService();
      } else {
        // Phase 2: Import and instantiate real API service
        // this.sheetMusicService = new ApiSheetMusicService();
        throw new Error('API service not yet implemented. Use ServiceMode.MOCK for Phase 1.');
      }
    }

    return this.sheetMusicService;
  }

  /**
   * Get Session Service
   * Returns mock service in Phase 1, real API service in Phase 2
   */
  static getSessionService(): ISessionService {
    if (!this.sessionService) {
      const mode = ServiceFactoryConfig.getInstance().getMode();

      if (mode === ServiceMode.MOCK) {
        this.sessionService = new MockSessionService();
      } else {
        // Phase 2: Import and instantiate real API service
        // this.sessionService = new ApiSessionService();
        throw new Error('API service not yet implemented. Use ServiceMode.MOCK for Phase 1.');
      }
    }

    return this.sessionService;
  }

  /**
   * Check if currently using mock services
   */
  static isMockMode(): boolean {
    return ServiceFactoryConfig.getInstance().getMode() === ServiceMode.MOCK;
  }

  /**
   * Reset all services (useful for testing or mode switching)
   */
  static reset(): void {
    this.sheetMusicService = null;
    this.sessionService = null;
  }
}

/**
 * Initialize the service factory
 * Call this in your app's entry point (main.tsx)
 */
export function initializeServices(mode: ServiceMode = ServiceMode.MOCK): void {
  ServiceFactory.setMode(mode);
  console.log(`Services initialized in ${mode} mode`);
}

/**
 * Hook-style getter for React components
 * Makes it easy to use services in components with consistent API
 */
export function useServices() {
  return {
    sheetMusicService: ServiceFactory.getSheetMusicService(),
    sessionService: ServiceFactory.getSessionService(),
    isMockMode: ServiceFactory.isMockMode(),
  };
}
