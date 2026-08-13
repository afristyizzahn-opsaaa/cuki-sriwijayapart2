import { describe, expect, it } from 'vitest';

import { createEmptyIntersectionBoard } from '../../src/engine/board/initialization';
import {
  determineMatchResult,
  finalizeMatch,
  hasCanonicalScoreConservation,
  isMatchComplete,
} from '../../src/engine/rules/matchResolution';
import type { RuntimeGameState } from '../../src/types/game';

describe('match completion and final result resolution', () => {
  it('TC-WIN-001 — selects the unique highest scorer without considering player order or final capture', () => {
    expect(determineMatchResult(stateWithScores([40, 50, 20, 10]).players)).toEqual({
      kind: 'WINNER',
      winnerId: 'p2',
    });
  });

  it('TC-WIN-002 and REG-012 — represents two-way, three-way, and four-way draws with no tie-breaker', () => {
    expect(determineMatchResult(stateWithScores([50, 50, 20, 0]).players)).toEqual({
      kind: 'DRAW',
      tiedPlayerIds: ['p1', 'p2'],
    });
    expect(determineMatchResult(stateWithScores([35, 35, 35, 15]).players)).toEqual({
      kind: 'DRAW',
      tiedPlayerIds: ['p1', 'p2', 'p3'],
    });
    expect(determineMatchResult(stateWithScores([30, 30, 30, 30]).players)).toEqual({
      kind: 'DRAW',
      tiedPlayerIds: ['p1', 'p2', 'p3', 'p4'],
    });
  });

  it('TC-MCH-002 and REG-013 — only zero remaining Oncak can finalize a match', () => {
    const oneColorExhausted = stateWithScores([60, 50, 0, 0], 10);
    const blockedPawn = stateWithScores([40, 40, 20, 10], 10);
    const completedTurn = stateWithScores([40, 40, 20, 10], 10, 'TURN_END');

    for (const state of [oneColorExhausted, blockedPawn, completedTurn]) {
      expect(isMatchComplete(state)).toBe(false);
      expect(finalizeMatch(state)).toBe(state);
      expect(state.matchStatus).toBe('ACTIVE');
    }
  });

  it('TC-MCH-001 — finalization clears all turn continuation state but does not advance the active player', () => {
    const state = stateWithScores([60, 50, 10], 0, 'REROLL_REQUIRED');
    const result = finalizeMatch(state);

    expect(isMatchComplete(result)).toBe(true);
    expect(result.matchStatus).toBe('MATCH_FINISHED');
    expect(result.activePlayerIndex).toBe(0);
    expect(result.result).toEqual({ kind: 'WINNER', winnerId: 'p1' });
    expect(result.turn).toEqual({
      phase: 'TURN_END',
      currentDiceValue: null,
      mandatorySameDiceCaptureRequired: false,
      rerollRequired: false,
    });
  });

  it('TC-INT-001 — preserves the locked 120-Oncak score conservation invariant at completion', () => {
    const completed = finalizeMatch(stateWithScores([50, 50, 20, 0], 0));

    expect(hasCanonicalScoreConservation(completed)).toBe(true);
    expect(completed.remainingOncak).toBe(0);
    expect(completed.players.reduce((total, player) => total + player.score, 0)).toBe(120);
  });
});

function stateWithScores(
  scores: ReadonlyArray<number>,
  remainingOncak = 0,
  phase: RuntimeGameState['turn']['phase'] = 'WAITING_FOR_DICE_ROLL',
): RuntimeGameState {
  if (scores.length < 2 || scores.length > 4) {
    throw new Error('Fixtures require two to four players.');
  }

  return {
    gameMode: 'LOCAL_MULTIPLAYER',
    playerCount: scores.length as 2 | 3 | 4,
    board: createEmptyIntersectionBoard(),
    players: scores.map((score, index) => ({
      id: `p${index + 1}`,
      name: `P${index + 1}`,
      controllerType: 'HUMAN',
      score,
      pawn: {
        id: `pawn-p${index + 1}`,
        playerId: `p${index + 1}`,
        state: { status: 'OFF_BOARD', position: null },
      },
    })),
    activePlayerIndex: 0,
    remainingOncak,
    turn: {
      phase,
      currentDiceValue: phase === 'REROLL_REQUIRED' ? 1 : null,
      mandatorySameDiceCaptureRequired: false,
      rerollRequired: phase === 'REROLL_REQUIRED',
    },
    legalOpportunities: [],
    selectedCaptureGroup: null,
    matchStatus: 'ACTIVE',
    result: null,
  };
}
