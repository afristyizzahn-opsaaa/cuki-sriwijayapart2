import type { RuntimeGameState } from './game';

/** Versioned browser-storage snapshot of the complete canonical runtime state. */
export interface PersistedGameSession {
  readonly version: string;
  readonly lastSavedAt: string;
  readonly gameState: RuntimeGameState;
}
