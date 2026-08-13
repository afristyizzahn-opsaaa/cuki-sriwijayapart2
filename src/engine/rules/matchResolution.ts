import { INITIAL_ONCAK_COUNT } from '../../constants/gameRules';
import type { DrawPlayerIds, MatchResult, PlayerState, RuntimeGameState } from '../../types/game';

/** The sole normal gameplay condition for completing a match. */
export function isMatchComplete(state: Pick<RuntimeGameState, 'remainingOncak'>): boolean {
  return state.remainingOncak === 0;
}

/** Determines a winner or draw exclusively from the final player scores. */
export function determineMatchResult(players: ReadonlyArray<PlayerState>): MatchResult {
  const highestScore = Math.max(...players.map((player) => player.score));
  const highestScoringPlayerIds = players
    .filter((player) => player.score === highestScore)
    .map((player) => player.id);

  if (highestScoringPlayerIds.length === 1) {
    return { kind: 'WINNER', winnerId: highestScoringPlayerIds[0] as string };
  }

  return {
    kind: 'DRAW',
    tiedPlayerIds: toDrawPlayerIds(highestScoringPlayerIds),
  };
}

/**
 * Stops all turn progression and records the canonical final score result. This is a no-op
 * while Oncak remain, so failed rolls, turn ends, and blocking can never finish a match.
 */
export function finalizeMatch(state: RuntimeGameState): RuntimeGameState {
  if (!isMatchComplete(state)) {
    return state;
  }

  return {
    ...state,
    matchStatus: 'MATCH_FINISHED',
    result: determineMatchResult(state.players),
    legalOpportunities: [],
    selectedCaptureGroup: null,
    turn: {
      phase: 'TURN_END',
      currentDiceValue: null,
      mandatorySameDiceCaptureRequired: false,
      rerollRequired: false,
    },
  };
}

/** Verifies the locked total-Oncak score invariant for canonical runtime states. */
export function hasCanonicalScoreConservation(state: Pick<RuntimeGameState, 'remainingOncak' | 'players'>): boolean {
  return state.remainingOncak + state.players.reduce((total, player) => total + player.score, 0) === INITIAL_ONCAK_COUNT;
}

function toDrawPlayerIds(playerIds: ReadonlyArray<string>): DrawPlayerIds {
  if (playerIds.length === 2) {
    return [playerIds[0] as string, playerIds[1] as string];
  }
  if (playerIds.length === 3) {
    return [playerIds[0] as string, playerIds[1] as string, playerIds[2] as string];
  }
  if (playerIds.length === 4) {
    return [playerIds[0] as string, playerIds[1] as string, playerIds[2] as string, playerIds[3] as string];
  }

  throw new Error('A canonical draw requires two to four tied players.');
}
