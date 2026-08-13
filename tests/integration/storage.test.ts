import { describe, expect, it } from 'vitest';

import { initializeCanonicalGameState } from '../../src/engine/board/initialization';
import {
  CORRUPT_STORAGE_BACKUP_KEY,
  GAME_SESSION_STORAGE_KEY,
  clearGameSession,
  loadGameSession,
  saveGameSession,
  type StorageAdapter,
} from '../../src/services/storage';
import type { RuntimeGameState } from '../../src/types/game';

describe('runtime game persistence', () => {
  it('saves and restores an active canonical match without changing its state', () => {
    const storage = memoryStorage();
    const original = activeState();

    expect(saveGameSession(original, storage)).toBe(true);
    expect(loadGameSession(storage)).toEqual(original);
  });

  it('restores a finished match including its result state', () => {
    const storage = memoryStorage();
    const finished: RuntimeGameState = {
      ...activeState(),
      matchStatus: 'MATCH_FINISHED',
      result: { kind: 'WINNER', winnerId: 'p1' },
    };

    saveGameSession(finished, storage);
    expect(loadGameSession(storage)).toEqual(finished);
  });

  it('backs up and clears corrupted storage while returning a safe empty restoration', () => {
    const storage = memoryStorage();
    storage.setItem(GAME_SESSION_STORAGE_KEY, '{not json');

    expect(loadGameSession(storage)).toBeNull();
    expect(storage.getItem(GAME_SESSION_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(CORRUPT_STORAGE_BACKUP_KEY)).toBe('{not json');
  });

  it('persists no presentation-only UI state and can clear a saved session', () => {
    const storage = memoryStorage();
    saveGameSession(activeState(), storage);
    const snapshot = storage.getItem(GAME_SESSION_STORAGE_KEY) ?? '';

    expect(snapshot).not.toContain('activeModal');
    expect(snapshot).not.toContain('activeMenu');
    expect(snapshot).not.toContain('activePanel');

    clearGameSession(storage);
    expect(storage.getItem(GAME_SESSION_STORAGE_KEY)).toBeNull();
  });
});

function activeState(): RuntimeGameState {
  return initializeCanonicalGameState({
    gameMode: 'LOCAL_MULTIPLAYER',
    playerCount: 2,
    players: [
      { id: 'p1', name: 'Player 1', controllerType: 'HUMAN' },
      { id: 'p2', name: 'Player 2', controllerType: 'HUMAN' },
    ],
    randomValues: resolvedRandomValues(119 * 32),
    maxLayoutAttempts: 32,
  });
}

function memoryStorage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function resolvedRandomValues(length: number): ReadonlyArray<number> {
  let state = 123456789;
  return Array.from({ length }, () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  });
}
