import { afterEach, describe, expect, it } from 'vitest';

import { controllerFor, easyAIController, humanController } from '../../src/controllers/playerController';
import { getLegalCaptureOpportunities } from '../../src/engine/rules/legalCaptureOpportunities';
import { createLocalMatchInput } from '../../src/pages/matchSetup';
import { useGameStore } from '../../src/stores/useGameStore';

afterEach(() => useGameStore.getState().resetMatch());

describe('easy AI controller integration', () => {
  it('receives and selects only a legal opportunity returned by the canonical engine API', () => {
    useGameStore.getState().startMatch(aiMatchInput());
    useGameStore.getState().resolveDice(1);
    const state = useGameStore.getState().gameState;
    expect(state).not.toBeNull();

    const legal = getLegalCaptureOpportunities(state!, 1);
    const chosen = easyAIController.chooseCaptureOpportunity(state!);

    expect(legal.length).toBeGreaterThan(0);
    expect(chosen).toEqual(legal[0]);
    expect(legal.some((opportunity) => opportunity.id === chosen?.id)).toBe(true);
  });

  it('completes a valid capture through existing store actions', () => {
    useGameStore.getState().startMatch(aiMatchInput());
    useGameStore.getState().resolveDice(1);
    const before = useGameStore.getState().gameState;
    const choice = easyAIController.chooseCaptureOpportunity(before!);
    expect(choice).not.toBeNull();

    useGameStore.getState().selectCaptureOpportunity(choice?.id ?? 'invalid');
    useGameStore.getState().executeCapture();

    expect(useGameStore.getState().gameState?.players[0]?.score).toBe(1);
  });

  it('leaves human selection behavior unchanged and supports mixed human/AI setup', () => {
    useGameStore.getState().startMatch(aiMatchInput());
    const state = useGameStore.getState().gameState;

    expect(humanController.chooseCaptureOpportunity(state!)).toBeNull();
    expect(controllerFor('HUMAN')).toBe(humanController);
    expect(controllerFor('AI')).toBe(easyAIController);

    const mixedPlayers = createLocalMatchInput(3, true).players;
    expect(mixedPlayers.map((player) => player.controllerType)).toEqual(['HUMAN', 'AI', 'HUMAN']);
  });
});

function aiMatchInput() {
  return {
    gameMode: 'LOCAL_MULTIPLAYER' as const,
    playerCount: 2 as const,
    players: [
      { id: 'ai-1', name: 'Easy AI', controllerType: 'AI' as const },
      { id: 'human-1', name: 'Human', controllerType: 'HUMAN' as const },
    ],
    randomValues: resolvedRandomValues(119 * 32),
    maxLayoutAttempts: 32,
  };
}

function resolvedRandomValues(length: number): ReadonlyArray<number> {
  let state = 123456789;
  return Array.from({ length }, () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  });
}
