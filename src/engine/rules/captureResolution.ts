import type {
  CaptureGroup,
  CaptureRoute,
  DiceValue,
  IntersectionBoard,
  IntersectionCoordinate,
  PlayerState,
  RuntimeGameState,
} from '../../types/game';
import {
  evaluateCaptureOpportunities,
  type CaptureOpportunityCandidate,
} from './captureOpportunities';
import { getLegalCaptureOpportunities } from './legalCaptureOpportunities';
import { finalizeMatch } from './matchResolution';

export type CaptureResolutionFailureReason =
  | 'MATCH_NOT_ACTIVE'
  | 'INVALID_TURN_PHASE'
  | 'MISSING_DICE_VALUE'
  | 'GROUP_NOT_LEGAL'
  | 'GROUP_SIZE_MISMATCH'
  | 'GROUP_ENDPOINT_MISMATCH';

export interface CaptureResolutionResult {
  readonly accepted: boolean;
  readonly reason: CaptureResolutionFailureReason | null;
  readonly state: RuntimeGameState;
}

export interface CaptureResolutionInput {
  readonly state: RuntimeGameState;
  readonly group: CaptureGroup;
  /** Explicit post-capture candidates used for the mandatory same-dice evaluation. */
  readonly postCaptureCandidates?: ReadonlyArray<CaptureOpportunityCandidate>;
}

export interface DiceResolutionInput {
  readonly state: RuntimeGameState;
  readonly diceValue: DiceValue;
  /** Explicit candidates for this resolved value; this module never generates routes. */
  readonly candidates?: ReadonlyArray<CaptureOpportunityCandidate>;
}

export interface DiceResolutionResult {
  readonly accepted: boolean;
  readonly reason: Extract<CaptureResolutionFailureReason, 'MATCH_NOT_ACTIVE' | 'INVALID_TURN_PHASE'> | null;
  readonly state: RuntimeGameState;
}

/**
 * Resolves one selected capture group as an indivisible state transaction. The supplied
 * post-capture candidates are evaluated only after all Oncak, score, and Pawn changes commit.
 */
export function resolveCaptureGroup(input: CaptureResolutionInput): CaptureResolutionResult {
  const { state, group, postCaptureCandidates } = input;
  if (state.matchStatus !== 'ACTIVE') {
    return rejectCapture(state, 'MATCH_NOT_ACTIVE');
  }
  if (state.turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION') {
    return rejectCapture(state, 'INVALID_TURN_PHASE');
  }

  const diceValue = state.turn.currentDiceValue;
  if (diceValue === null) {
    return rejectCapture(state, 'MISSING_DICE_VALUE');
  }
  if (group.oncakCoordinates.length !== diceValue || group.oncakIds.length !== diceValue) {
    return rejectCapture(state, 'GROUP_SIZE_MISMATCH');
  }
  if (!coordinatesContain(group.oncakCoordinates, group.finalEndpoint) || !sameCoordinate(group.route.finalEndpoint, group.finalEndpoint)) {
    return rejectCapture(state, 'GROUP_ENDPOINT_MISMATCH');
  }

  const activePlayer = getActivePlayer(state);
  if (!activePlayer || !isLegalSelectedGroup(state, activePlayer, diceValue, group)) {
    return rejectCapture(state, 'GROUP_NOT_LEGAL');
  }

  const committedPlayer = movePawnToEndpoint(activePlayer, group.finalEndpoint, diceValue);
  const committedState: RuntimeGameState = {
    ...state,
    board: commitCaptureBoard(state.board, activePlayer, group),
    players: state.players.map((player) => (player.id === activePlayer.id ? committedPlayer : player)),
    remainingOncak: state.remainingOncak - diceValue,
    legalOpportunities: [],
    selectedCaptureGroup: null,
    turn: {
      phase: 'REEVALUATING_SAME_DICE',
      currentDiceValue: diceValue,
      mandatorySameDiceCaptureRequired: false,
      rerollRequired: false,
    },
  };

  if (committedState.remainingOncak === 0) {
    return acceptCapture(finalizeMatch(committedState));
  }

  const opportunities = postCaptureCandidates
    ? evaluateCaptureOpportunities(
        committedState.board,
        committedPlayer.pawn,
        diceValue,
        postCaptureCandidates,
      )
    : getLegalCaptureOpportunities(committedState, diceValue);

  return acceptCapture({
    ...committedState,
    legalOpportunities: opportunities,
    turn:
      opportunities.length > 0
        ? {
            phase: 'WAITING_FOR_CAPTURE_SELECTION',
            currentDiceValue: diceValue,
            mandatorySameDiceCaptureRequired: true,
            rerollRequired: false,
          }
        : {
            phase: 'REROLL_REQUIRED',
            currentDiceValue: diceValue,
            mandatorySameDiceCaptureRequired: false,
            rerollRequired: true,
          },
  });
}

/**
 * Accepts a caller-resolved dice value in either a normal turn or an earned reroll. A value
 * without opportunities ends the turn; this function deliberately has no reroll counter.
 */
export function resolveDiceValue(input: DiceResolutionInput): DiceResolutionResult {
  const { state, diceValue, candidates } = input;
  if (state.matchStatus !== 'ACTIVE') {
    return rejectDice(state, 'MATCH_NOT_ACTIVE');
  }
  if (state.turn.phase !== 'WAITING_FOR_DICE_ROLL' && state.turn.phase !== 'REROLL_REQUIRED') {
    return rejectDice(state, 'INVALID_TURN_PHASE');
  }

  const activePlayer = getActivePlayer(state);
  if (!activePlayer) {
    return rejectDice(state, 'INVALID_TURN_PHASE');
  }

  const opportunities = candidates
    ? evaluateCaptureOpportunities(state.board, activePlayer.pawn, diceValue, candidates)
    : getLegalCaptureOpportunities(state, diceValue);
  if (opportunities.length === 0) {
    return acceptDice(endTurn(state));
  }

  return acceptDice({
    ...state,
    legalOpportunities: opportunities,
    selectedCaptureGroup: null,
    turn: {
      phase: 'WAITING_FOR_CAPTURE_SELECTION',
      currentDiceValue: diceValue,
      mandatorySameDiceCaptureRequired: true,
      rerollRequired: false,
    },
  });
}

/** Clears transient turn state and advances cyclically to the next configured player. */
export function endTurn(state: RuntimeGameState): RuntimeGameState {
  if (state.matchStatus !== 'ACTIVE' || state.players.length === 0) {
    return state;
  }

  return {
    ...state,
    activePlayerIndex: (state.activePlayerIndex + 1) % state.players.length,
    legalOpportunities: [],
    selectedCaptureGroup: null,
    turn: {
      phase: 'WAITING_FOR_DICE_ROLL',
      currentDiceValue: null,
      mandatorySameDiceCaptureRequired: false,
      rerollRequired: false,
    },
  };
}

function isLegalSelectedGroup(
  state: RuntimeGameState,
  activePlayer: PlayerState,
  diceValue: DiceValue,
  group: CaptureGroup,
): boolean {
  const legalOpportunity = state.legalOpportunities.find(
    (opportunity) =>
      opportunity.id === group.opportunityId &&
      opportunity.oncakColor === group.oncakColor &&
      coordinatesMatch(opportunity.candidateOncakCoordinates, group.oncakCoordinates) &&
      stringsMatch(opportunity.candidateOncakIds, group.oncakIds) &&
      opportunity.routes.some((route) => routesMatch(route, group.route)),
  );
  if (!legalOpportunity) {
    return false;
  }

  const currentLegalGroups = evaluateCaptureOpportunities(state.board, activePlayer.pawn, diceValue, [
    {
      id: legalOpportunity.id,
      oncakCoordinates: legalOpportunity.candidateOncakCoordinates,
      route: group.route,
    },
  ]);
  return currentLegalGroups.length === 1;
}

function commitCaptureBoard(
  board: IntersectionBoard,
  activePlayer: PlayerState,
  group: CaptureGroup,
): IntersectionBoard {
  const capturedCoordinates = new Set(group.oncakCoordinates.map(coordinateKey));
  const previousPawnCoordinate =
    activePlayer.pawn.state.status === 'ON_BOARD' ? activePlayer.pawn.state.position : null;

  return board.map((row) =>
    row.map((intersection) => {
      if (sameCoordinate(intersection.coordinate, group.finalEndpoint)) {
        return {
          coordinate: intersection.coordinate,
          kind: 'PAWN' as const,
          oncak: null,
          pawnOccupantId: activePlayer.pawn.id,
        };
      }
      if (capturedCoordinates.has(coordinateKey(intersection.coordinate)) || sameCoordinate(intersection.coordinate, previousPawnCoordinate)) {
        return {
          coordinate: intersection.coordinate,
          kind: 'EMPTY' as const,
          oncak: null,
          pawnOccupantId: null,
        };
      }
      return intersection;
    }),
  );
}

function movePawnToEndpoint(player: PlayerState, endpoint: IntersectionCoordinate, capturedCount: number): PlayerState {
  return {
    ...player,
    score: player.score + capturedCount,
    pawn: {
      ...player.pawn,
      state: {
        status: 'ON_BOARD',
        position: endpoint,
      },
    },
  };
}

function rejectCapture(state: RuntimeGameState, reason: CaptureResolutionFailureReason): CaptureResolutionResult {
  return { accepted: false, reason, state };
}

function acceptCapture(state: RuntimeGameState): CaptureResolutionResult {
  return { accepted: true, reason: null, state };
}

function rejectDice(
  state: RuntimeGameState,
  reason: Extract<CaptureResolutionFailureReason, 'MATCH_NOT_ACTIVE' | 'INVALID_TURN_PHASE'>,
): DiceResolutionResult {
  return { accepted: false, reason, state };
}

function acceptDice(state: RuntimeGameState): DiceResolutionResult {
  return { accepted: true, reason: null, state };
}

function coordinatesContain(coordinates: ReadonlyArray<IntersectionCoordinate>, target: IntersectionCoordinate): boolean {
  return coordinates.some((coordinate) => sameCoordinate(coordinate, target));
}

function coordinatesMatch(
  first: ReadonlyArray<IntersectionCoordinate>,
  second: ReadonlyArray<IntersectionCoordinate>,
): boolean {
  return first.length === second.length && first.every((coordinate, index) => sameCoordinate(coordinate, second[index]));
}

function stringsMatch(first: ReadonlyArray<string>, second: ReadonlyArray<string>): boolean {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function routesMatch(first: CaptureRoute, second: CaptureRoute): boolean {
  return (
    coordinatesMatch(first.intersections, second.intersections) &&
    first.segments.length === second.segments.length &&
    first.segments.every(
      (segment, index) =>
        sameCoordinate(segment.start, second.segments[index]?.start) &&
        sameCoordinate(segment.end, second.segments[index]?.end) &&
        segment.direction === second.segments[index]?.direction,
    ) &&
    sameCoordinate(first.finalEndpoint, second.finalEndpoint)
  );
}

function sameCoordinate(
  first: IntersectionCoordinate | null | undefined,
  second: IntersectionCoordinate | null | undefined,
): boolean {
  return first?.x === second?.x && first?.y === second?.y;
}

function coordinateKey(coordinate: IntersectionCoordinate): string {
  return `${coordinate.x},${coordinate.y}`;
}

function getActivePlayer(state: RuntimeGameState): PlayerState | null {
  return state.players[state.activePlayerIndex] ?? null;
}
