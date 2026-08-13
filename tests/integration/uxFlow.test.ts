import { afterEach, describe, expect, it } from 'vitest';

import { createLocalMatchInput } from '../../src/pages/matchSetup';
import { useGameStore } from '../../src/stores/useGameStore';

afterEach(() => useGameStore.getState().resetMatch());

describe('match setup flow', () => {
  it('creates a local setup for each approved player count', () => {
    expect(createLocalMatchInput(2).players).toHaveLength(2);
    expect(createLocalMatchInput(3).players).toHaveLength(3);
    expect(createLocalMatchInput(4).players).toHaveLength(4);
  });

  it('passes the selected setup into canonical match initialization and can restart cleanly', () => {
    const setup = createLocalMatchInput(3);
    useGameStore.getState().startMatch({ ...setup, randomValues: resolvedRandomValues(119 * 32) });

    expect(useGameStore.getState().gameState).toMatchObject({ gameMode: 'LOCAL_MULTIPLAYER', playerCount: 3 });
    expect(useGameStore.getState().gameState?.players).toHaveLength(3);

    useGameStore.getState().resetMatch();
    expect(useGameStore.getState().gameState).toBeNull();
  });
});

function resolvedRandomValues(length: number): ReadonlyArray<number> {
  let state = 123456789;
  return Array.from({ length }, () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  });
}
