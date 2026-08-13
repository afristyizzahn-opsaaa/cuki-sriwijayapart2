import { describe, expect, it } from 'vitest';

import { createEmptyIntersectionBoard } from '../../src/engine/board/initialization';
import {
  createCaptureRoute,
  canAppendSequentialCaptureStep,
  hasClearMovementPath,
  findLegalCaptureOpportunities,
  hasValidCaptureMoves,
  validateMovementRoute,
} from '../../src/game/rules';
import type { IntersectionBoard, IntersectionCoordinate } from '../../src/types/game';

describe('Sprint 2 pathfinding locks', () => {
  it('rejects a route that jumps over an Oncak outside the selected capture group', () => {
    const board = withOncak(withPawn(createEmptyIntersectionBoard(), at(1, 1), 'p1'), at(1, 2));
    const route = createCaptureRoute([at(1, 1), at(1, 4)]);

    expect(route).not.toBeNull();
    expect(validateMovementRoute(board, route!, 'p1', at(1, 1)).reason).toBe('ONCAK_BLOCKED');
    expect(hasClearMovementPath(board, route!, 'p1', at(1, 1))).toBe(false);
  });

  it('rejects capture routes that cut through empty intersections instead of staying on the eaten Oncak path', () => {
    const board = withOncak(
      withPawn(createEmptyIntersectionBoard(), at(0, 1), 'p1'),
      at(2, 1),
    );
    const route = createCaptureRoute([at(0, 1), at(2, 1)]);

    expect(route).not.toBeNull();
    expect(
      validateMovementRoute(board, route!, 'p1', at(0, 1), [at(2, 1)]).reason,
    ).toBe('ONCAK_BLOCKED');
  });

  it('rejects a route that jumps over another Pawn', () => {
    const board = withPawn(
      withPawn(createEmptyIntersectionBoard(), at(2, 1), 'p1'),
      at(2, 2),
      'p2',
    );
    const route = createCaptureRoute([at(2, 1), at(2, 4)]);

    expect(route).not.toBeNull();
    expect(validateMovementRoute(board, route!, 'p1', at(2, 1)).reason).toBe('PAWN_BLOCKED');
  });

  it('reports no move when each exact-size capture route is blocked', () => {
    const board = withOncak(
      withPawn(
        withPawn(withPawn(createEmptyIntersectionBoard(), at(0, 0), 'p1'), at(0, 1), 'p2'),
        at(1, 0),
        'p3',
      ),
      at(0, 2),
    );

    expect(hasValidCaptureMoves(at(0, 0), 1, board, 'p1')).toBe(false);
  });

  it('accepts two same-colour Oncak that bracket a Pawn when both outer boundaries are opposite', () => {
    const board = withOncakColor(
      withOncakColor(
        withOncakColor(
          withOncakColor(
            withPawn(createEmptyIntersectionBoard(), at(2, 2), 'p1'),
            at(0, 2),
            'BLACK',
          ),
          at(1, 2),
          'WHITE',
        ),
        at(3, 2),
        'WHITE',
      ),
      at(4, 2),
      'BLACK',
    );
    const pawn = {
      id: 'p1',
      playerId: 'p1',
      state: { status: 'ON_BOARD' as const, position: at(2, 2) },
    };

    const bridge = findLegalCaptureOpportunities(board, pawn, 2).find((opportunity) =>
      opportunity.id.startsWith('bridge-WHITE'),
    );

    expect(bridge?.candidateOncakCoordinates).toEqual([at(1, 2), at(3, 2)]);
    expect(bridge?.routes).toHaveLength(2);
    expect(bridge && canAppendSequentialCaptureStep(bridge, null, at(3, 2))).toBe(true);
  });

  it('does not capture a smaller run when the same colour continues behind the Pawn', () => {
    const board = withOncakColor(
      withOncakColor(
        withOncakColor(
          withOncakColor(
            withPawn(createEmptyIntersectionBoard(), at(2, 2), 'p1'),
            at(1, 2),
            'BLACK',
          ),
          at(3, 2),
          'BLACK',
        ),
        at(4, 2),
        'BLACK',
      ),
      at(5, 2),
      'WHITE',
    );
    const pawn = {
      id: 'p1',
      playerId: 'p1',
      state: { status: 'ON_BOARD' as const, position: at(2, 2) },
    };

    expect(findLegalCaptureOpportunities(board, pawn, 2)).toEqual([]);
  });

  it('does not split a line when the opposite side has an empty point before the same colour', () => {
    const board = withOncakColor(
      withOncakColor(
        withOncakColor(
          withPawn(createEmptyIntersectionBoard(), at(3, 2), 'p1'),
          at(4, 2),
          'BLACK',
        ),
        at(5, 2),
        'BLACK',
      ),
      at(1, 2),
      'BLACK',
    );
    const pawn = {
      id: 'p1',
      playerId: 'p1',
      state: { status: 'ON_BOARD' as const, position: at(3, 2) },
    };

    expect(findLegalCaptureOpportunities(board, pawn, 2)).toEqual([]);
  });

  it('accepts a die-three group split above and below a Pawn in two direction segments', () => {
    const board = withOncakColor(
      withOncakColor(
        withOncakColor(
          withOncakColor(
            withOncakColor(
              withPawn(createEmptyIntersectionBoard(), at(3, 4), 'p1'),
              at(3, 1),
              'BLACK',
            ),
            at(3, 3),
            'WHITE',
          ),
          at(3, 5),
          'WHITE',
        ),
        at(3, 6),
        'WHITE',
      ),
      at(3, 8),
      'BLACK',
    );
    const pawn = {
      id: 'p1',
      playerId: 'p1',
      state: { status: 'ON_BOARD' as const, position: at(3, 4) },
    };

    const opportunity = findLegalCaptureOpportunities(board, pawn, 3).find((candidate) =>
      candidate.id.startsWith('span-WHITE'),
    );

    expect(opportunity?.candidateOncakCoordinates).toEqual([at(3, 3), at(3, 5), at(3, 6)]);
    expect(opportunity?.routes).toHaveLength(2);
    expect(opportunity?.routes.every((route) => route.segments.length <= 2)).toBe(true);
    expect(opportunity && canAppendSequentialCaptureStep(opportunity, null, at(3, 6))).toBe(false);
    expect(opportunity && canAppendSequentialCaptureStep(opportunity, null, at(3, 3))).toBe(true);
  });

  it('rejects same-colour Oncak separated by an empty intersection', () => {
    const board = withOncakColor(
      withOncakColor(
        withOncakColor(
          withOncakColor(
            withOncakColor(
              withPawn(createEmptyIntersectionBoard(), at(7, 1), 'p1'),
              at(7, 2),
              'WHITE',
            ),
            at(7, 3),
            'WHITE',
          ),
          at(7, 5),
          'WHITE',
        ),
        at(7, 6),
        'WHITE',
      ),
      at(7, 7),
      'BLACK',
    );
    const pawn = {
      id: 'p1',
      playerId: 'p1',
      state: { status: 'ON_BOARD' as const, position: at(7, 1) },
    };

    const opportunity = findLegalCaptureOpportunities(board, pawn, 4).find((candidate) =>
      candidate.id.startsWith('ray-DOWN-WHITE'),
    );

    expect(opportunity).toBeUndefined();
  });

  it('requires the next capture to follow the route order instead of jumping ahead', () => {
    const board = withOncakColor(
      withOncakColor(
        withOncakColor(
          withOncakColor(
            withOncakColor(
              withPawn(createEmptyIntersectionBoard(), at(7, 1), 'p1'),
              at(7, 2),
              'WHITE',
            ),
            at(7, 3),
            'WHITE',
          ),
          at(7, 5),
          'WHITE',
        ),
        at(7, 6),
        'WHITE',
      ),
      at(7, 7),
      'BLACK',
    );
    const pawn = {
      id: 'p1',
      playerId: 'p1',
      state: { status: 'ON_BOARD' as const, position: at(7, 1) },
    };

    const opportunity = findLegalCaptureOpportunities(board, pawn, 2).find((candidate) =>
      candidate.id.startsWith('ray-DOWN-WHITE'),
    );

    expect(opportunity).toBeUndefined();
  });
});

function at(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
}

function withPawn(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
  pawnId: string,
): IntersectionBoard {
  return replace(board, coordinate, {
    coordinate,
    kind: 'PAWN',
    oncak: null,
    pawnOccupantId: pawnId,
  });
}

function withOncak(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
): IntersectionBoard {
  return replace(board, coordinate, {
    coordinate,
    kind: 'ONCAK',
    oncak: {
      id: `oncak-${coordinate.x}-${coordinate.y}`,
      color: 'BLACK',
      state: 'PRESENT',
      position: coordinate,
    },
    pawnOccupantId: null,
  });
}

function withOncakColor(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
  color: 'BLACK' | 'WHITE',
): IntersectionBoard {
  return replace(board, coordinate, {
    coordinate,
    kind: 'ONCAK',
    oncak: {
      id: `oncak-${color}-${coordinate.x}-${coordinate.y}`,
      color,
      state: 'PRESENT',
      position: coordinate,
    },
    pawnOccupantId: null,
  });
}

function replace(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
  value: IntersectionBoard[number][number],
): IntersectionBoard {
  return board.map((row, y) =>
    row.map((intersection, x) => (x === coordinate.x && y === coordinate.y ? value : intersection)),
  );
}
