import { describe, expect, it } from 'vitest';

import { easyAIController } from '../../src/controllers/playerController';
import { initializeCanonicalGameState } from '../../src/engine/board/initialization';
import { resolveCaptureGroup, resolveDiceValue } from '../../src/engine/rules/captureResolution';
import { GAME_SESSION_STORAGE_KEY, loadGameSession, type StorageAdapter } from '../../src/services/storage';
import type { CaptureGroup, CaptureOpportunity, IntersectionBoard, IntersectionCoordinate, RuntimeGameState } from '../../src/types/game';

describe('alpha release regressions', () => {
  it('allows an Easy AI to finish the final Oncak capture and resolves winner or draw correctly', () => {
    const winner = finishFinalCapture(5, 3);
    const draw = finishFinalCapture(5, 6);

    expect(winner.matchStatus).toBe('MATCH_FINISHED');
    expect(winner.result).toEqual({ kind: 'WINNER', winnerId: 'ai-1' });
    expect(draw.result).toEqual({ kind: 'DRAW', tiedPlayerIds: ['ai-1', 'human-1'] });
  });

  it('rejects a structurally invalid saved match instead of restoring gameplay state', () => {
    const storage = memoryStorage();
    storage.setItem(GAME_SESSION_STORAGE_KEY, JSON.stringify({ version: '1.1.0', lastSavedAt: 'now', gameState: { matchStatus: 'ACTIVE' } }));

    expect(loadGameSession(storage)).toBeNull();
    expect(storage.getItem(GAME_SESSION_STORAGE_KEY)).toBeNull();
  });
});

function finishFinalCapture(aiScore: number, humanScore: number): RuntimeGameState {
  const base = initializeCanonicalGameState({
    gameMode: 'LOCAL_MULTIPLAYER',
    playerCount: 2,
    players: [
      { id: 'ai-1', name: 'Easy AI', controllerType: 'AI' },
      { id: 'human-1', name: 'Human', controllerType: 'HUMAN' },
    ],
    randomValues: resolvedRandomValues(119 * 32),
    maxLayoutAttempts: 32,
  });
  const state: RuntimeGameState = {
    ...base,
    board: retainOnlyOncak(base.board, at(0, 0)),
    remainingOncak: 1,
    players: base.players.map((player, index) => ({ ...player, score: index === 0 ? aiScore : humanScore })),
  };
  const diceResolved = resolveDiceValue({ state, diceValue: 1 }).state;
  const opportunity = easyAIController.chooseCaptureOpportunity(diceResolved);
  expect(opportunity).not.toBeNull();

  return resolveCaptureGroup({ state: diceResolved, group: captureGroup(opportunity!) }).state;
}

function captureGroup(opportunity: CaptureOpportunity): CaptureGroup {
  const route = opportunity.routes[0];
  if (!route) {
    throw new Error('Expected an engine-provided legal route');
  }
  return {
    opportunityId: opportunity.id,
    oncakColor: opportunity.oncakColor,
    oncakIds: opportunity.candidateOncakIds,
    oncakCoordinates: opportunity.candidateOncakCoordinates,
    route,
    finalEndpoint: route.finalEndpoint,
  };
}

function retainOnlyOncak(board: IntersectionBoard, target: IntersectionCoordinate): IntersectionBoard {
  return board.map((row) => row.map((intersection) =>
    intersection.kind !== 'ONCAK' || sameCoordinate(intersection.coordinate, target)
      ? intersection
      : { coordinate: intersection.coordinate, kind: 'EMPTY' as const, oncak: null, pawnOccupantId: null },
  ));
}

function at(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
}

function sameCoordinate(first: IntersectionCoordinate, second: IntersectionCoordinate): boolean {
  return first.x === second.x && first.y === second.y;
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
