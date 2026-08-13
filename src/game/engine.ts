import type {
  CaptureGroup,
  CaptureOpportunity,
  CaptureRoute,
  CellOncak,
  DiceValue,
  DrawPlayerIds,
  IntersectionBoard,
  IntersectionCoordinate,
  MatchResult,
  PawnState,
  PlayerColor,
  Position,
  RuntimeGameState,
} from '../types/game';
import {
  captureGroupFromOpportunity,
  hasValidCaptureMoves,
  isCentralLogo as isCentralLogoCoordinate,
  isDiceValue,
  scanReachableCaptureGroups,
  validateCaptureGroup,
} from './rules';

export const FOUNDATION_BOARD_SIZE = 11;
export const FOUNDATION_TOTAL_ONCAK = 120;
export const FOUNDATION_BLACK_ONCAK = 60;
export const FOUNDATION_WHITE_ONCAK = 60;
export const FOUNDATION_CENTRAL_LOGO: Position = { x: 5, y: 5 };

const foundationPlayerColors: readonly PlayerColor[] = ['BLACK', 'WHITE', 'RED', 'BLUE'];

export type GameEngineAction =
  | { readonly type: 'ROLL_DICE'; readonly diceValue: DiceValue }
  | { readonly type: 'MOVE_PAWN'; readonly route: CaptureRoute }
  | { readonly type: 'MOVE_PAWN_TO_INTERSECTION'; readonly coordinate: IntersectionCoordinate }
  | { readonly type: 'SELECT_CAPTURE'; readonly group: CaptureGroup }
  | { readonly type: 'END_TURN' };

/** The immutable result of a rejected action is the original state reference. */
export function reduceGameState(
  state: RuntimeGameState,
  action: GameEngineAction,
): RuntimeGameState {
  switch (action.type) {
    case 'ROLL_DICE':
      return resolveDiceRoll(state, action.diceValue);
    case 'MOVE_PAWN':
      return movePawn(state, action.route);
    case 'MOVE_PAWN_TO_INTERSECTION':
      return movePawnToIntersection(state, action.coordinate);
    case 'SELECT_CAPTURE':
      return resolveCaptureAction(state, action.group);
    case 'END_TURN':
      return endTurn(state);
  }
}

/**
 * Resolves a newly rolled value. A value without a legal exact-size line requests another
 * roll; the match only finishes when every dice value is unable to produce a capture.
 */
export function resolveDiceRoll(state: RuntimeGameState, diceValue: DiceValue): RuntimeGameState {
  if (
    state.matchStatus !== 'ACTIVE' ||
    !isDiceValue(diceValue) ||
    (state.turn.phase !== 'WAITING_FOR_DICE_ROLL' && state.turn.phase !== 'REROLL_REQUIRED')
  ) {
    return state;
  }
  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer) return state;

  const hasValidMoves = hasValidCaptureMoves(
    activePlayer.pawn.state.status === 'ON_BOARD' ? activePlayer.pawn.state.position : null,
    diceValue,
    state.board,
    activePlayer.pawn.id,
  );
  const legalOpportunities = hasValidMoves
    ? scanReachableCaptureGroups(state.board, activePlayer.pawn, diceValue)
    : [];
  if (legalOpportunities.length === 0) {
    if (!hasAnyLegalCaptureForAnyDice(state, activePlayer.pawn)) {
      return finalizeLockedMatch(state);
    }
    return {
      ...state,
      legalOpportunities: [],
      selectedCaptureGroup: null,
      turn: {
        phase: 'REROLL_REQUIRED',
        currentDiceValue: diceValue,
        mandatorySameDiceCaptureRequired: false,
        rerollRequired: true,
      },
    };
  }
  return {
    ...state,
    legalOpportunities,
    selectedCaptureGroup: null,
    turn: {
      phase: legalOpportunities.length > 0 ? 'WAITING_FOR_CAPTURE_SELECTION' : 'WAITING_FOR_PAWN_MOVE',
      currentDiceValue: diceValue,
      mandatorySameDiceCaptureRequired: legalOpportunities.length > 0,
      rerollRequired: false,
    },
  };
}

function hasAnyLegalCaptureFromBoard(
  state: RuntimeGameState,
  pawn: RuntimeGameState['players'][number]['pawn'],
  diceValue: DiceValue,
): boolean {
  for (let y = 0; y <= 10; y += 1) {
    for (let x = 0; x <= 10; x += 1) {
      const coordinate = { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
      if (isCentralLogoCoordinate(coordinate)) continue;
      const candidatePawn = {
        ...pawn,
        state: { status: 'ON_BOARD' as const, position: coordinate },
      };
      if (scanReachableCaptureGroups(state.board, candidatePawn, diceValue).length > 0) {
        return true;
      }
    }
  }
  return false;
}

function hasAnyLegalCaptureForAnyDice(
  state: RuntimeGameState,
  pawn: RuntimeGameState['players'][number]['pawn'],
): boolean {
  return ([1, 2, 3, 4, 5, 6] as const).some((diceValue) =>
    hasAnyLegalCaptureFromBoard(state, pawn, diceValue),
  );
}

/**
 * Applies the entire selected group atomically. Board re-evaluation occurs only after all
 * V same-colour Oncak have been removed and the Pawn has settled on the final route point.
 */
export function resolveCaptureAction(
  state: RuntimeGameState,
  group: CaptureGroup,
): RuntimeGameState {
  if (state.matchStatus !== 'ACTIVE' || state.turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION') {
    return state;
  }
  const diceValue = state.turn.currentDiceValue;
  const activePlayer = state.players[state.activePlayerIndex];
  if (diceValue === null || !activePlayer) return state;

  const validation = validateCaptureGroup(state.board, activePlayer.pawn, diceValue, group);
  if (!validation.isLegal) return state;

  const captured = new Set(group.oncakCoordinates.map(coordinateKey));
  const nextBoard = commitCapture(
    state.board,
    activePlayer.pawn.id,
    activePlayer.pawn.state.status === 'ON_BOARD' ? activePlayer.pawn.state.position : null,
    group,
  );
  const nextPlayers = state.players.map((player) =>
    player.id === activePlayer.id
      ? {
          ...player,
          score: player.score + diceValue,
          pawn: {
            ...player.pawn,
            state: { status: 'ON_BOARD' as const, position: group.finalEndpoint },
          },
        }
      : player,
  );
  // `captured` also defends against malformed state/counts; validation guarantees exact V.
  const remainingOncak = state.remainingOncak - captured.size;
  const committed: RuntimeGameState = {
    ...state,
    board: nextBoard,
    players: nextPlayers,
    remainingOncak,
    legalOpportunities: [],
    selectedCaptureGroup: null,
    turn: {
      phase: 'REEVALUATING_SAME_DICE',
      currentDiceValue: diceValue,
      mandatorySameDiceCaptureRequired: false,
      rerollRequired: false,
    },
  };
  if (remainingOncak === 0) return finalizeMatch(committed);

  const movedPlayer = nextPlayers[state.activePlayerIndex];
  if (!movedPlayer) return committed;
  const hasValidMoves = hasValidCaptureMoves(
    movedPlayer.pawn.state.status === 'ON_BOARD' ? movedPlayer.pawn.state.position : null,
    diceValue,
    committed.board,
    movedPlayer.pawn.id,
  );
  const legalOpportunities = hasValidMoves
    ? scanReachableCaptureGroups(committed.board, movedPlayer.pawn, diceValue)
    : [];
  return {
    ...committed,
    legalOpportunities,
    turn:
      legalOpportunities.length > 0
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
  };
}

/**
 * Slides the active Pawn to a snapped intersection before the next capture resolution.
 * Moving never restores removed Oncak or changes score; opportunities are rescanned from the
 * new position, including after a completed capture when the turn is ready for another route.
 */
export function movePawn(state: RuntimeGameState, route: CaptureRoute): RuntimeGameState {
  // A Pawn may only move as part of an atomically resolved Capture Group.
  // Keep this action as a compatibility boundary, but never permit free movement.
  void route;
  return state;
}

/** Moves the active Scratch-style pawn to a snapped grid intersection before scanning. */
export function movePawnToIntersection(
  state: RuntimeGameState,
  coordinate: IntersectionCoordinate,
): RuntimeGameState {
  if (
    state.matchStatus !== 'ACTIVE' ||
    (state.turn.phase !== 'WAITING_FOR_PAWN_MOVE' &&
      state.turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION' &&
      state.turn.phase !== 'REROLL_REQUIRED') ||
    coordinate.x < 0 ||
    coordinate.x > 10 ||
    coordinate.y < 0 ||
    coordinate.y > 10 ||
    isCentralLogoCoordinate(coordinate)
  ) {
    return state;
  }
  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer) return state;

  const nextPlayers = state.players.map((player) =>
    player.id === activePlayer.id
      ? {
          ...player,
          pawn: {
            ...player.pawn,
            state: { status: 'ON_BOARD' as const, position: coordinate },
          },
        }
      : player,
  );
  const movedPawn = nextPlayers[state.activePlayerIndex]?.pawn;
  if (!movedPawn) return state;
  const diceValue = state.turn.currentDiceValue;
  const legalOpportunities =
    diceValue === null ? [] : scanReachableCaptureGroups(state.board, movedPawn, diceValue);
  const shouldRequestReroll =
    legalOpportunities.length === 0 && state.turn.phase === 'REROLL_REQUIRED';

  return {
    ...state,
    players: nextPlayers,
    legalOpportunities,
    selectedCaptureGroup: null,
    turn: {
      ...state.turn,
      phase:
        legalOpportunities.length > 0
          ? 'WAITING_FOR_CAPTURE_SELECTION'
          : shouldRequestReroll
            ? 'REROLL_REQUIRED'
            : 'WAITING_FOR_PAWN_MOVE',
      mandatorySameDiceCaptureRequired: legalOpportunities.length > 0,
      rerollRequired: shouldRequestReroll,
    },
  };
}

/** Returns a selected group only when its opportunity and route are currently legal. */
export function selectCaptureGroup(
  state: RuntimeGameState,
  opportunityId: string,
  routeIndex = 0,
): CaptureGroup | null {
  const opportunity = state.legalOpportunities.find((candidate) => candidate.id === opportunityId);
  return opportunity ? captureGroupFromOpportunity(opportunity, routeIndex) : null;
}

/** Recomputes legal opportunities from the current board, Pawn, and active die value. */
export function refreshLegalOpportunities(state: RuntimeGameState): RuntimeGameState {
  if (state.matchStatus !== 'ACTIVE' || state.turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION') {
    return state;
  }
  const diceValue = state.turn.currentDiceValue;
  const activePlayer = state.players[state.activePlayerIndex];
  if (diceValue === null || !activePlayer) {
    return state;
  }
  const legalOpportunities = scanReachableCaptureGroups(state.board, activePlayer.pawn, diceValue);
  if (sameCaptureOpportunities(legalOpportunities, state.legalOpportunities)) {
    return state;
  }

  return {
    ...state,
    legalOpportunities,
  };
}

/**
 * Explicitly passes control to the next active player after a capture-selection or reroll
 * stage. A failed newly rolled die still advances automatically in `resolveDiceRoll`.
 */
export function endTurn(state: RuntimeGameState): RuntimeGameState {
  if (
    state.matchStatus !== 'ACTIVE' ||
    state.players.length === 0 ||
    state.turn.phase !== 'REROLL_REQUIRED' && state.turn.phase !== 'WAITING_FOR_PAWN_MOVE' ||
    state.legalOpportunities.length > 0
  )
    return state;
  return advanceTurn(state);
}

/** Ends an AI turn after its single dice-matched capture. */
export function endAITurnAfterCapture(state: RuntimeGameState): RuntimeGameState {
  const activePlayer = state.players[state.activePlayerIndex];
  if (
    state.matchStatus !== 'ACTIVE' ||
    activePlayer?.controllerType !== 'AI' ||
    state.turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION'
  ) {
    return state;
  }
  return advanceTurn(state);
}

function advanceTurn(state: RuntimeGameState): RuntimeGameState {
  if (state.matchStatus !== 'ACTIVE' || state.players.length === 0) return state;
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

function finalizeLockedMatch(state: RuntimeGameState): RuntimeGameState {
  return {
    ...state,
    matchStatus: 'MATCH_FINISHED',
    result: determineMatchResult(state),
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

function sameCaptureOpportunities(
  first: ReadonlyArray<CaptureOpportunity>,
  second: ReadonlyArray<CaptureOpportunity>,
): boolean {
  return (
    first.length === second.length &&
    first.every((opportunity, index) => {
      const comparison = second[index];
      return (
        comparison !== undefined &&
        opportunity.id === comparison.id &&
        opportunity.oncakColor === comparison.oncakColor &&
        sameCoordinateSequence(
          opportunity.candidateOncakCoordinates,
          comparison.candidateOncakCoordinates,
        ) &&
        sameStringSequence(opportunity.candidateOncakIds, comparison.candidateOncakIds) &&
        sameRouteSequence(opportunity.routes, comparison.routes)
      );
    })
  );
}

function sameRouteSequence(
  first: ReadonlyArray<CaptureRoute>,
  second: ReadonlyArray<CaptureRoute>,
): boolean {
  return (
    first.length === second.length &&
    first.every((route, index) => {
      const comparison = second[index];
      return (
        comparison !== undefined &&
        sameCoordinateSequence(route.intersections, comparison.intersections) &&
        sameCoordinate(route.finalEndpoint, comparison.finalEndpoint) &&
        route.segments.length === comparison.segments.length &&
        route.segments.every((segment, segmentIndex) => {
          const comparedSegment = comparison.segments[segmentIndex];
          return (
            comparedSegment !== undefined &&
            segment.direction === comparedSegment.direction &&
            sameCoordinate(segment.start, comparedSegment.start) &&
            sameCoordinate(segment.end, comparedSegment.end)
          );
        })
      );
    })
  );
}

function sameCoordinateSequence(
  first: ReadonlyArray<IntersectionCoordinate>,
  second: ReadonlyArray<IntersectionCoordinate>,
): boolean {
  return (
    first.length === second.length &&
    first.every((coordinate, index) => sameCoordinate(coordinate, second[index] ?? null))
  );
}

function sameStringSequence(first: ReadonlyArray<string>, second: ReadonlyArray<string>): boolean {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

/** Match completion is triggered solely by zero remaining Oncak. */
export function finalizeMatch(state: RuntimeGameState): RuntimeGameState {
  if (state.remainingOncak !== 0) return state;
  return {
    ...state,
    matchStatus: 'MATCH_FINISHED',
    legalOpportunities: [],
    selectedCaptureGroup: null,
    turn: {
      phase: 'TURN_END',
      currentDiceValue: null,
      mandatorySameDiceCaptureRequired: false,
      rerollRequired: false,
    },
    result: determineMatchResult(state),
  };
}

export function determineMatchResult(state: Pick<RuntimeGameState, 'players'>): MatchResult {
  const highestScore = Math.max(...state.players.map((player) => player.score));
  const leaders = state.players
    .filter((player) => player.score === highestScore)
    .map((player) => player.id);
  if (leaders.length === 1) return { kind: 'WINNER', winnerId: leaders[0] as string };
  // Runtime initialization limits this list to 2–4 players, satisfying DrawPlayerIds.
  return { kind: 'DRAW', tiedPlayerIds: leaders as unknown as DrawPlayerIds };
}

/** Returns true for the permanently blocked Central Logo intersection at (5,5). */
export function isCentralLogo(pos: Position): boolean {
  return isCentralLogoCoordinate(pos);
}

/**
 * Creates an 11 × 11 foundation board containing exactly 120 Oncak: 60 BLACK, 60 WHITE,
 * and a null Central Logo at (5,5). This legacy UI adapter deliberately has no game rules.
 */
export function createInitialBoard(): CellOncak[][] {
  let blackPlaced = 0;
  let whitePlaced = 0;
  return Array.from({ length: FOUNDATION_BOARD_SIZE }, (_, y) =>
    Array.from({ length: FOUNDATION_BOARD_SIZE }, (_, x): CellOncak => {
      if (isCentralLogo({ x, y })) return null;
      if (
        blackPlaced < FOUNDATION_BLACK_ONCAK &&
        (blackPlaced <= whitePlaced || whitePlaced >= FOUNDATION_WHITE_ONCAK)
      ) {
        blackPlaced += 1;
        return 'BLACK';
      }
      whitePlaced += 1;
      return 'WHITE';
    }),
  );
}

/** Creates OFF_BOARD foundation pawns for the four presentation-layer player colours. */
export function createInitialPawns(pawnsPerPlayer = 4): PawnState[] {
  return foundationPlayerColors.flatMap((owner) =>
    Array.from({ length: pawnsPerPlayer }, (_, index) => ({
      id: `pawn-${owner.toLowerCase()}-${index + 1}`,
      owner,
      position: 'OFF_BOARD' as const,
    })),
  );
}

function commitCapture(
  board: IntersectionBoard,
  activePawnId: string,
  previousPawnPosition: IntersectionCoordinate | null,
  group: CaptureGroup,
): IntersectionBoard {
  const captured = new Set(group.oncakCoordinates.map(coordinateKey));
  return board.map((row) =>
    row.map((intersection) => {
      if (sameCoordinate(intersection.coordinate, group.finalEndpoint)) {
        return {
          coordinate: intersection.coordinate,
          kind: 'PAWN' as const,
          oncak: null,
          pawnOccupantId: activePawnId,
        };
      }
      if (
        captured.has(coordinateKey(intersection.coordinate)) ||
        sameCoordinate(intersection.coordinate, previousPawnPosition)
      ) {
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

function coordinateKey(coordinate: IntersectionCoordinate): string {
  return `${coordinate.x},${coordinate.y}`;
}

function sameCoordinate(
  first: IntersectionCoordinate | null,
  second: IntersectionCoordinate | null,
): boolean {
  return first?.x === second?.x && first?.y === second?.y;
}
