import { describe, expect, it } from 'vitest';

import { createEmptyIntersectionBoard } from '../../src/engine/board/initialization';
import {
  discoverCaptureOpportunities,
  evaluateCaptureOpportunities,
  filterReachableCaptureOpportunities,
  validateCaptureRoute,
  type CaptureOpportunityCandidate,
} from '../../src/engine/rules/captureOpportunities';
import type {
  CaptureRoute,
  IntersectionBoard,
  IntersectionCoordinate,
  MovementDirection,
  Pawn,
} from '../../src/types/game';

describe('capture opportunities and route validation', () => {
  it('TC-GRP-001 and TC-GRP-002 — accepts only exact same-color groups', () => {
    const board = withOncak(createEmptyIntersectionBoard(), [
      ['BLACK', at(1, 1)],
      ['BLACK', at(1, 2)],
      ['WHITE', at(1, 3)],
    ]);

    expect(discoverCaptureOpportunities(board, 2, [candidate('valid', [at(1, 1), at(1, 2)])])).toHaveLength(1);
    expect(discoverCaptureOpportunities(board, 3, [candidate('wrong-size', [at(1, 1), at(1, 2)])])).toHaveLength(0);
    expect(discoverCaptureOpportunities(board, 2, [candidate('mixed', [at(1, 2), at(1, 3)])])).toHaveLength(0);
  });

  it('REG-015 — does not merge branching connected Oncak as a flood-fill cluster', () => {
    const board = withOncak(createEmptyIntersectionBoard(), [
      ['BLACK', at(2, 2)],
      ['BLACK', at(2, 3)],
      ['BLACK', at(3, 2)],
    ]);
    const explicitPath = candidate('line-only', [at(2, 2), at(2, 3)]);

    const opportunities = discoverCaptureOpportunities(board, 2, [explicitPath]);

    expect(opportunities).toHaveLength(1);
    expect(opportunities[0]?.candidateOncakCoordinates).toEqual([at(2, 2), at(2, 3)]);
  });

  it('TC-GEO-001, TC-GEO-002, and REG-007 — permits orthogonal routes and rejects diagonal routes', () => {
    const board = withPawn(createEmptyIntersectionBoard(), at(2, 2), 'pawn-1');

    expect(validateCaptureRoute(board, route([at(2, 2), at(2, 5)]), 'pawn-1', at(2, 2)).isLegal).toBe(true);
    expect(validateCaptureRoute(board, route([at(2, 2), at(5, 2)]), 'pawn-1', at(2, 2)).isLegal).toBe(true);

    const diagonalRoute: CaptureRoute = {
      intersections: [at(2, 2), at(3, 3), at(4, 4)],
      segments: [{ start: at(2, 2), end: at(4, 4), direction: 'DOWN' }],
      finalEndpoint: at(4, 4),
    };
    expect(validateCaptureRoute(board, diagonalRoute, 'pawn-1', at(2, 2))).toMatchObject({
      isLegal: false,
      reason: 'NON_ORTHOGONAL_SEGMENT',
    });
  });

  it('TC-SEG-001, TC-SEG-002, and REG-006 — permits one to three segments, including long segments', () => {
    const board = withPawn(createEmptyIntersectionBoard(), at(0, 0), 'pawn-1');
    const routes = [
      route([at(0, 0), at(0, 10)]),
      route([at(0, 0), at(0, 4), at(4, 4)]),
      route([at(0, 0), at(0, 3), at(3, 3), at(3, 8)]),
    ];
    const fourSegmentRoute = route([at(0, 0), at(0, 2), at(2, 2), at(2, 4), at(4, 4)]);
    const fiveSegmentRoute = route([at(0, 0), at(0, 1), at(1, 1), at(1, 2), at(2, 2), at(2, 3)]);

    expect(routes.every((path) => validateCaptureRoute(board, path, 'pawn-1', at(0, 0)).isLegal)).toBe(true);
    expect(validateCaptureRoute(board, fourSegmentRoute, 'pawn-1', at(0, 0))).toMatchObject({
      reason: 'SEGMENT_LIMIT_EXCEEDED',
    });
    expect(validateCaptureRoute(board, fiveSegmentRoute, 'pawn-1', at(0, 0))).toMatchObject({
      reason: 'SEGMENT_LIMIT_EXCEEDED',
    });
  });

  it('TC-BLK-001, TC-BLK-002, and TC-BLK-003 — rejects crossing, endpoints, and jumps over pawns', () => {
    const intermediateBlocked = withPawns(createEmptyIntersectionBoard(), [
      [at(1, 1), 'pawn-1'],
      [at(1, 3), 'pawn-2'],
    ]);
    const endpointBlocked = withPawns(createEmptyIntersectionBoard(), [
      [at(2, 2), 'pawn-1'],
      [at(2, 4), 'pawn-2'],
    ]);
    const jumpedPawn = withPawns(createEmptyIntersectionBoard(), [
      [at(1, 1), 'pawn-1'],
      [at(1, 2), 'pawn-2'],
    ]);

    expect(validateCaptureRoute(intermediateBlocked, route([at(1, 1), at(1, 5)]), 'pawn-1', at(1, 1)).reason).toBe('PAWN_BLOCKED');
    expect(validateCaptureRoute(endpointBlocked, route([at(2, 2), at(2, 4)]), 'pawn-1', at(2, 2)).reason).toBe('PAWN_BLOCKED');
    expect(validateCaptureRoute(jumpedPawn, route([at(1, 1), at(1, 3)]), 'pawn-1', at(1, 1)).reason).toBe('PAWN_BLOCKED');
  });

  it('TC-BLK-004 and TC-CENT-003 — permits complete three-segment detours around pawn and logo blocks', () => {
    const pawnBlocked = withPawns(createEmptyIntersectionBoard(), [
      [at(1, 1), 'pawn-1'],
      [at(1, 2), 'pawn-2'],
    ]);
    const logoBoard = withPawn(createEmptyIntersectionBoard(), at(4, 3), 'pawn-1');

    expect(validateCaptureRoute(pawnBlocked, route([at(1, 1), at(2, 1), at(2, 3), at(1, 3)]), 'pawn-1', at(1, 1)).isLegal).toBe(true);
    expect(validateCaptureRoute(logoBoard, route([at(4, 3), at(4, 6), at(6, 6), at(6, 5)]), 'pawn-1', at(4, 3)).isLegal).toBe(true);
  });

  it('TC-CENT-002 and REG-008 — rejects central logo traversal and endpoints', () => {
    const board = withPawn(createEmptyIntersectionBoard(), at(5, 3), 'pawn-1');
    const traversal = route([at(5, 3), at(5, 6)]);
    const endpoint = route([at(5, 3), at(5, 5)]);

    expect(validateCaptureRoute(board, traversal, 'pawn-1', at(5, 3)).reason).toBe('CENTRAL_LOGO_BLOCKED');
    expect(validateCaptureRoute(board, endpoint, 'pawn-1', at(5, 3)).reason).toBe('CENTRAL_LOGO_BLOCKED');
  });

  it('TC-UNR-001 and TC-UNR-002 — filters unreachable opportunities while preserving reachable ones', () => {
    const board = withPawns(
      withOncak(createEmptyIntersectionBoard(), [
        ['BLACK', at(2, 3)],
        ['BLACK', at(2, 7)],
      ]),
      [
        [at(2, 2), 'pawn-1'],
        [at(2, 5), 'pawn-2'],
        [at(1, 2), 'pawn-3'],
        [at(3, 2), 'pawn-4'],
      ],
    );
    const pawn = onBoardPawn('pawn-1', at(2, 2));
    const candidates = [
      candidate('reachable', [at(2, 3)], route([at(2, 2), at(2, 3)])),
      candidate('blocked', [at(2, 7)], route([at(2, 2), at(2, 7)])),
    ];

    expect(evaluateCaptureOpportunities(board, pawn, 1, candidates).map((opportunity) => opportunity.id)).toEqual(['reachable']);
  });

  it('TC-ENTRY-002 and REG-004 — evaluates OFF_BOARD opportunities board-wide without an external route', () => {
    const board = withOncak(createEmptyIntersectionBoard(), [['WHITE', at(3, 4)]]);
    const pawn = offBoardPawn('pawn-1');
    const interiorEntry: CaptureOpportunityCandidate = {
      id: 'interior-entry',
      oncakCoordinates: [at(3, 4)],
      route: { intersections: [at(3, 4)], segments: [], finalEndpoint: at(3, 4) },
    };

    const opportunities = evaluateCaptureOpportunities(board, pawn, 1, [interiorEntry]);

    expect(opportunities).toHaveLength(1);
    expect(opportunities[0]?.candidateOncakCoordinates).toEqual([at(3, 4)]);
    expect(filterReachableCaptureOpportunities(board, pawn, opportunities)).toHaveLength(1);
  });
});

function at(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
}

function route(waypoints: ReadonlyArray<IntersectionCoordinate>): CaptureRoute {
  const segments = waypoints.slice(1).map((end, index) => ({
    start: waypoints[index] as IntersectionCoordinate,
    end,
    direction: directionBetween(waypoints[index] as IntersectionCoordinate, end),
  }));
  const intersections = segments.flatMap((segment, index) => {
    const points = pointsAlongSegment(segment);
    return index === 0 ? points : points.slice(1);
  });

  return {
    intersections,
    segments,
    finalEndpoint: waypoints[waypoints.length - 1] as IntersectionCoordinate,
  };
}

function directionBetween(start: IntersectionCoordinate, end: IntersectionCoordinate): MovementDirection {
  if (start.x === end.x) {
    return start.y < end.y ? 'DOWN' : 'UP';
  }
  return start.x < end.x ? 'RIGHT' : 'LEFT';
}

function pointsAlongSegment(segment: { start: IntersectionCoordinate; end: IntersectionCoordinate }): IntersectionCoordinate[] {
  const deltaX = Math.sign(segment.end.x - segment.start.x);
  const deltaY = Math.sign(segment.end.y - segment.start.y);
  const length = Math.abs(segment.end.x - segment.start.x) + Math.abs(segment.end.y - segment.start.y);

  return Array.from({ length: length + 1 }, (_, index) => at(segment.start.x + deltaX * index, segment.start.y + deltaY * index));
}

function candidate(
  id: string,
  oncakCoordinates: ReadonlyArray<IntersectionCoordinate>,
  captureRoute?: CaptureRoute,
): CaptureOpportunityCandidate {
  const routeForCandidate = captureRoute ?? route(oncakCoordinates);
  return { id, oncakCoordinates, route: routeForCandidate };
}

function withOncak(
  board: IntersectionBoard,
  entries: ReadonlyArray<readonly [color: 'BLACK' | 'WHITE', coordinate: IntersectionCoordinate]>,
): IntersectionBoard {
  return entries.reduce(
    (nextBoard, [color, coordinate], index) =>
      replaceIntersection(nextBoard, coordinate, {
        coordinate,
        kind: 'ONCAK',
        oncak: { id: `oncak-${index}-${coordinate.x}-${coordinate.y}`, color, state: 'PRESENT', position: coordinate },
        pawnOccupantId: null,
      }),
    board,
  );
}

function withPawn(board: IntersectionBoard, coordinate: IntersectionCoordinate, pawnId: string): IntersectionBoard {
  return replaceIntersection(board, coordinate, {
    coordinate,
    kind: 'PAWN',
    oncak: null,
    pawnOccupantId: pawnId,
  });
}

function withPawns(
  board: IntersectionBoard,
  entries: ReadonlyArray<readonly [coordinate: IntersectionCoordinate, pawnId: string]>,
): IntersectionBoard {
  return entries.reduce((nextBoard, [coordinate, pawnId]) => withPawn(nextBoard, coordinate, pawnId), board);
}

function replaceIntersection(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
  replacement: IntersectionBoard[number][number],
): IntersectionBoard {
  return board.map((row, y) => row.map((node, x) => (x === coordinate.x && y === coordinate.y ? replacement : node)));
}

function onBoardPawn(id: string, position: IntersectionCoordinate): Pawn {
  return { id, playerId: id, state: { status: 'ON_BOARD', position } };
}

function offBoardPawn(id: string): Pawn {
  return { id, playerId: id, state: { status: 'OFF_BOARD', position: null } };
}
