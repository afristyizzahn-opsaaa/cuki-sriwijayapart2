import { describe, expect, it } from 'vitest';

import { INITIAL_ONCAK_COUNT } from '../../src/constants/gameRules';
import {
  assignOncakLayout,
  createEmptyIntersectionBoard,
  getIntersectionState,
  type OncakLayoutEntry,
} from '../../src/engine/board/initialization';
import {
  discoverCaptureOpportunities,
  evaluateCaptureOpportunities,
  validateCaptureRoute,
  type CaptureOpportunityCandidate,
} from '../../src/engine/rules/captureOpportunities';
import { resolveCaptureGroup, resolveDiceValue } from '../../src/engine/rules/captureResolution';
import { finalizeMatch } from '../../src/engine/rules/matchResolution';
import type {
  CaptureGroup,
  CaptureRoute,
  IntersectionBoard,
  IntersectionCoordinate,
  MovementDirection,
  RuntimeGameState,
} from '../../src/types/game';

describe('FINAL 06 engine verification closure', () => {
  it('TC-BRD-002, TC-CENT-001, TC-CENT-004, REG-002, and REG-008 — rejects cell centres and the Central Logo without mutation', () => {
    const board = createEmptyIntersectionBoard();
    const offBoardPawn = pawn('pawn-p1', null);
    const cellCentreCandidate = candidate('cell-centre', [at(2.5, 2.5)], offBoardRoute(at(2.5, 2.5)));
    const logoCandidate = candidate('logo-entry', [at(5, 5)], offBoardRoute(at(5, 5)));

    expect(getIntersectionState(board, 2.5, 2.5)).toBeNull();
    expect(discoverCaptureOpportunities(board, 1, [cellCentreCandidate, logoCandidate])).toEqual([]);
    expect(evaluateCaptureOpportunities(board, offBoardPawn, 1, [logoCandidate])).toEqual([]);
    expect(board[5]?.[5]).toMatchObject({ kind: 'CENTRAL_LOGO', oncak: null, pawnOccupantId: null });
  });

  it('TC-DICE-001, TC-DICE-002, and REG-005 — captures exact quantity while allowing a route longer than the dice value', () => {
    const board = withPawn(
      withOncak(createEmptyIntersectionBoard(), [
        ['WHITE', at(0, 7)],
        ['WHITE', at(0, 8)],
      ]),
      at(0, 0),
      'pawn-p1',
    );
    const longRoute = route([at(0, 0), at(0, 8)]);
    const current = stateFor(board, at(0, 0));
    const selected = resolveDiceValue({
      state: current,
      diceValue: 2,
      candidates: [candidate('long-two', [at(0, 7), at(0, 8)], longRoute)],
    }).state;
    const result = resolveCaptureGroup({ state: selected, group: groupFrom(selected, 'long-two'), postCaptureCandidates: [] }).state;

    expect(validateCaptureRoute(board, longRoute, 'pawn-p1', at(0, 0)).isLegal).toBe(true);
    expect(result.players[0]?.score).toBe(2);
    expect(result.remainingOncak).toBe(INITIAL_ONCAK_COUNT - 2);
  });

  it('TC-UNR-001 — rejects independently invalid route conditions from legal-opportunity evaluation', () => {
    const blockedBoard = withPawns(withOncak(createEmptyIntersectionBoard(), [['BLACK', at(1, 3)]]), [
      [at(1, 1), 'pawn-p1'],
      [at(1, 2), 'pawn-p2'],
    ]);
    const logoBoard = withPawn(withOncak(createEmptyIntersectionBoard(), [['BLACK', at(5, 7)]]), at(5, 3), 'pawn-p1');
    const diagonalBoard = withPawn(withOncak(createEmptyIntersectionBoard(), [['BLACK', at(4, 4)]]), at(3, 3), 'pawn-p1');
    const segmentBoard = withPawn(withOncak(createEmptyIntersectionBoard(), [['BLACK', at(4, 4)]]), at(0, 0), 'pawn-p1');

    expect(evaluateCaptureOpportunities(blockedBoard, pawn('pawn-p1', at(1, 1)), 1, [
      candidate('blocked', [at(1, 3)], route([at(1, 1), at(1, 3)])),
    ])).toEqual([]);
    expect(evaluateCaptureOpportunities(logoBoard, pawn('pawn-p1', at(5, 3)), 1, [
      candidate('logo', [at(5, 7)], route([at(5, 3), at(5, 7)])),
    ])).toEqual([]);
    expect(evaluateCaptureOpportunities(diagonalBoard, pawn('pawn-p1', at(3, 3)), 1, [
      candidate('diagonal', [at(4, 4)], diagonalRoute(at(3, 3), at(4, 4))),
    ])).toEqual([]);
    expect(evaluateCaptureOpportunities(segmentBoard, pawn('pawn-p1', at(0, 0)), 1, [
      candidate('four-segments', [at(4, 4)], route([at(0, 0), at(0, 2), at(2, 2), at(2, 4), at(4, 4)])),
    ])).toEqual([]);
  });

  it('TC-AI-001 and TC-DET-001 — applies the identical pure engine result to identical human and AI actions', () => {
    const board = withPawn(withOncak(createEmptyIntersectionBoard(), [['BLACK', at(0, 1)]]), at(0, 0), 'pawn-p1');
    const candidates = [candidate('one', [at(0, 1)], route([at(0, 0), at(0, 1)]))];
    const humanState = stateFor(board, at(0, 0));
    const aiState: RuntimeGameState = {
      ...humanState,
      players: humanState.players.map((player, index) =>
        index === 0 ? { ...player, controllerType: 'AI' } : player,
      ),
    };

    const first = resolveDiceValue({ state: humanState, diceValue: 1, candidates: candidates }).state;
    const second = resolveDiceValue({ state: humanState, diceValue: 1, candidates: candidates }).state;
    const ai = resolveDiceValue({ state: aiState, diceValue: 1, candidates: candidates }).state;

    expect(first).toEqual(second);
    expect(ai.turn).toEqual(first.turn);
    expect(ai.legalOpportunities).toEqual(first.legalOpportunities);
  });

  it('TC-INV-001, TC-EDG-001, REG-003, REG-011, and REG-014 — exposes no free move, pawn elimination, or setup-removal transition', () => {
    const board = withPawn(withOncak(createEmptyIntersectionBoard(), [['WHITE', at(2, 3)]]), at(2, 2), 'pawn-p1');
    const current = stateFor(board, at(2, 2));
    const forgedMove: CaptureGroup = {
      opportunityId: 'free-move',
      oncakColor: 'WHITE',
      oncakIds: ['none'],
      oncakCoordinates: [at(2, 3)],
      route: route([at(2, 2), at(2, 3)]),
      finalEndpoint: at(2, 3),
    };

    expect(resolveCaptureGroup({ state: current, group: forgedMove, postCaptureCandidates: [] })).toMatchObject({
      accepted: false,
      reason: 'INVALID_TURN_PHASE',
      state: current,
    });
    const whiteOnlyBoard = withPawn(withOncak(createEmptyIntersectionBoard(), [['WHITE', at(2, 3)]]), at(2, 2), 'pawn-p1');
    const nonComplete = { ...current, board: whiteOnlyBoard, remainingOncak: 10 };

    expect(current.players).toHaveLength(2);
    expect(current.players.every((player) => player.pawn.state.status === 'OFF_BOARD' || player.pawn.state.status === 'ON_BOARD')).toBe(true);
    expect(evaluateCaptureOpportunities(whiteOnlyBoard, pawn('pawn-p1', at(2, 2)), 1, [
      candidate('white-remains', [at(2, 3)], route([at(2, 2), at(2, 3)])),
    ])).toHaveLength(1);
    expect(finalizeMatch(nonComplete)).toBe(nonComplete);
  });

  it('REG-001 — rejects an obsolete 96-Oncak initial layout', () => {
    const legacyLayout: OncakLayoutEntry[] = Array.from({ length: 96 }, (_, index) => ({
      id: `legacy-${index}`,
      color: 'BLACK',
    }));

    expect(() => assignOncakLayout(createEmptyIntersectionBoard(), legacyLayout)).toThrow();
  });
});

function stateFor(board: IntersectionBoard, activePawnPosition: IntersectionCoordinate): RuntimeGameState {
  return {
    gameMode: 'LOCAL_MULTIPLAYER',
    playerCount: 2,
    board,
    players: [
      { id: 'p1', name: 'P1', controllerType: 'HUMAN', score: 0, pawn: pawn('pawn-p1', activePawnPosition) },
      { id: 'p2', name: 'P2', controllerType: 'HUMAN', score: 0, pawn: pawn('pawn-p2', null) },
    ],
    activePlayerIndex: 0,
    remainingOncak: INITIAL_ONCAK_COUNT,
    turn: { phase: 'WAITING_FOR_DICE_ROLL', currentDiceValue: null, mandatorySameDiceCaptureRequired: false, rerollRequired: false },
    legalOpportunities: [],
    selectedCaptureGroup: null,
    matchStatus: 'ACTIVE',
    result: null,
  };
}

function groupFrom(state: RuntimeGameState, opportunityId: string): CaptureGroup {
  const opportunity = state.legalOpportunities.find((item) => item.id === opportunityId);
  const selectedRoute = opportunity?.routes[0];
  if (!opportunity || !selectedRoute) {
    throw new Error(`Missing opportunity ${opportunityId}`);
  }
  return {
    opportunityId: opportunity.id,
    oncakColor: opportunity.oncakColor,
    oncakIds: opportunity.candidateOncakIds,
    oncakCoordinates: opportunity.candidateOncakCoordinates,
    route: selectedRoute,
    finalEndpoint: selectedRoute.finalEndpoint,
  };
}

function pawn(id: string, position: IntersectionCoordinate | null) {
  return {
    id,
    playerId: id.replace('pawn-', ''),
    state: position ? { status: 'ON_BOARD' as const, position } : { status: 'OFF_BOARD' as const, position: null },
  };
}

function at(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
}

function candidate(id: string, oncakCoordinates: ReadonlyArray<IntersectionCoordinate>, captureRoute: CaptureRoute): CaptureOpportunityCandidate {
  return { id, oncakCoordinates, route: captureRoute };
}

function offBoardRoute(endpoint: IntersectionCoordinate): CaptureRoute {
  return { intersections: [endpoint], segments: [], finalEndpoint: endpoint };
}

function route(waypoints: ReadonlyArray<IntersectionCoordinate>): CaptureRoute {
  const segments = waypoints.slice(1).map((end, index) => ({
    start: waypoints[index] as IntersectionCoordinate,
    end,
    direction: directionBetween(waypoints[index] as IntersectionCoordinate, end),
  }));
  const intersections = segments.flatMap((segment, index) => {
    const nodes = nodesOnSegment(segment.start, segment.end);
    return index === 0 ? nodes : nodes.slice(1);
  });
  return {
    intersections: intersections.length > 0 ? intersections : [waypoints[0] as IntersectionCoordinate],
    segments,
    finalEndpoint: waypoints[waypoints.length - 1] as IntersectionCoordinate,
  };
}

function diagonalRoute(start: IntersectionCoordinate, end: IntersectionCoordinate): CaptureRoute {
  return {
    intersections: [start, end],
    segments: [{ start, end, direction: 'DOWN' }],
    finalEndpoint: end,
  };
}

function directionBetween(start: IntersectionCoordinate, end: IntersectionCoordinate): MovementDirection {
  if (start.x === end.x) {
    return start.y < end.y ? 'DOWN' : 'UP';
  }
  return start.x < end.x ? 'RIGHT' : 'LEFT';
}

function nodesOnSegment(start: IntersectionCoordinate, end: IntersectionCoordinate): IntersectionCoordinate[] {
  const deltaX = Math.sign(end.x - start.x);
  const deltaY = Math.sign(end.y - start.y);
  const length = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
  return Array.from({ length: length + 1 }, (_, index) => at(start.x + deltaX * index, start.y + deltaY * index));
}

function withOncak(
  board: IntersectionBoard,
  entries: ReadonlyArray<readonly [color: 'BLACK' | 'WHITE', coordinate: IntersectionCoordinate]>,
): IntersectionBoard {
  return entries.reduce(
    (nextBoard, [color, coordinate], index) =>
      replace(nextBoard, coordinate, {
        coordinate,
        kind: 'ONCAK',
        oncak: { id: `oncak-${index}-${coordinate.x}-${coordinate.y}`, color, state: 'PRESENT', position: coordinate },
        pawnOccupantId: null,
      }),
    board,
  );
}

function withPawn(board: IntersectionBoard, coordinate: IntersectionCoordinate, pawnId: string): IntersectionBoard {
  return replace(board, coordinate, { coordinate, kind: 'PAWN', oncak: null, pawnOccupantId: pawnId });
}

function withPawns(
  board: IntersectionBoard,
  entries: ReadonlyArray<readonly [coordinate: IntersectionCoordinate, pawnId: string]>,
): IntersectionBoard {
  return entries.reduce((nextBoard, [coordinate, pawnId]) => withPawn(nextBoard, coordinate, pawnId), board);
}

function replace(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
  replacement: IntersectionBoard[number][number],
): IntersectionBoard {
  return board.map((row, y) => row.map((node, x) => (x === coordinate.x && y === coordinate.y ? replacement : node)));
}
