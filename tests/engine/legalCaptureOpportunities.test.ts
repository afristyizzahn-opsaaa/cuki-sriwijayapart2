import { describe, expect, it } from 'vitest';

import { createEmptyIntersectionBoard } from '../../src/engine/board/initialization';
import { getLegalCaptureOpportunities } from '../../src/engine/rules/legalCaptureOpportunities';
import type { IntersectionBoard, IntersectionCoordinate, RuntimeGameState } from '../../src/types/game';

describe('canonical capture-opportunity enumeration', () => {
  it('enumerates only a maximal run whose full size exactly matches the dice value', () => {
    const board = withOncak(createEmptyIntersectionBoard(), [
      ['BLACK', at(1, 1)],
      ['BLACK', at(2, 1)],
      ['BLACK', at(3, 1)],
    ]);

    const matching = getLegalCaptureOpportunities(stateFor(board, null), 3);

    expect(matching).toHaveLength(1);
    expect(matching[0]?.candidateOncakCoordinates).toEqual([at(1, 1), at(2, 1), at(3, 1)]);
    expect(getLegalCaptureOpportunities(stateFor(board, null), 2)).toEqual([]);
  });

  it('does not slice a larger run to satisfy a smaller dice value', () => {
    const board = withOncak(
      createEmptyIntersectionBoard(),
      Array.from({ length: 5 }, (_, index) => ['WHITE' as const, at(index, 0)] as const),
    );

    expect(getLegalCaptureOpportunities(stateFor(board, null), 3)).toEqual([]);
    expect(getLegalCaptureOpportunities(stateFor(board, null), 5)).toHaveLength(1);
  });

  it('terminates runs at different colors, empty intersections, and board edges', () => {
    const colorTerminatedBoard = withOncak(createEmptyIntersectionBoard(), [
      ['BLACK', at(0, 0)],
      ['WHITE', at(1, 0)],
      ['WHITE', at(2, 0)],
      ['WHITE', at(3, 0)],
      ['BLACK', at(4, 0)],
    ]);
    const emptyTerminatedBoard = withOncak(createEmptyIntersectionBoard(), [
      ['BLACK', at(0, 2)],
      ['BLACK', at(1, 2)],
      ['BLACK', at(3, 2)],
    ]);
    const edgeTerminatedBoard = withOncak(createEmptyIntersectionBoard(), [
      ['WHITE', at(8, 10)],
      ['WHITE', at(9, 10)],
      ['WHITE', at(10, 10)],
    ]);

    expect(getLegalCaptureOpportunities(stateFor(colorTerminatedBoard, null), 3)[0]?.candidateOncakCoordinates).toEqual([
      at(1, 0),
      at(2, 0),
      at(3, 0),
    ]);
    expect(getLegalCaptureOpportunities(stateFor(emptyTerminatedBoard, null), 2)).toHaveLength(1);
    expect(getLegalCaptureOpportunities(stateFor(edgeTerminatedBoard, null), 3)).toHaveLength(1);
  });

  it('treats the Central Logo as a run terminator and excludes perpendicular branches', () => {
    const centralBoard = withOncak(createEmptyIntersectionBoard(), [
      ['BLACK', at(3, 5)],
      ['BLACK', at(4, 5)],
      ['BLACK', at(6, 5)],
      ['BLACK', at(7, 5)],
    ]);
    const branchBoard = withOncak(createEmptyIntersectionBoard(), [
      ['WHITE', at(2, 2)],
      ['WHITE', at(3, 2)],
      ['WHITE', at(3, 3)],
    ]);

    expect(getLegalCaptureOpportunities(stateFor(centralBoard, null), 4)).toEqual([]);
    expect(getLegalCaptureOpportunities(stateFor(centralBoard, null), 2)).toHaveLength(2);
    expect(getLegalCaptureOpportunities(stateFor(branchBoard, null), 3)).toEqual([]);
    expect(getLegalCaptureOpportunities(stateFor(branchBoard, null), 2)).toHaveLength(2);
  });

  it('uses existing validation to respect pawn blockers and the Central Logo for ON_BOARD Pawns', () => {
    const pawnBlockedBoard = withPawns(
      withOncak(createEmptyIntersectionBoard(), [['BLACK', at(0, 2)]]),
      [
        [at(0, 0), 'pawn-p1'],
        [at(0, 1), 'pawn-p2'],
        [at(1, 0), 'pawn-p3'],
      ],
    );
    const logoBlockedBoard = withPawns(
      withOncak(createEmptyIntersectionBoard(), [['WHITE', at(5, 7)]]),
      [
        [at(5, 3), 'pawn-p1'],
        [at(5, 2), 'pawn-p2'],
        [at(4, 3), 'pawn-p3'],
        [at(6, 3), 'pawn-p4'],
      ],
    );

    expect(getLegalCaptureOpportunities(stateFor(pawnBlockedBoard, at(0, 0)), 1)).toEqual([]);
    expect(getLegalCaptureOpportunities(stateFor(logoBlockedBoard, at(5, 3), 4), 1)).toEqual([]);
  });

  it('enumerates OFF_BOARD groups board-wide without an external path and ON_BOARD groups from the Pawn origin', () => {
    const offBoardBoard = withOncak(createEmptyIntersectionBoard(), [['WHITE', at(3, 4)]]);
    const onBoardBoard = withPawn(
      withOncak(createEmptyIntersectionBoard(), [['BLACK', at(1, 3)]]),
      at(1, 1),
      'pawn-p1',
    );

    const offBoard = getLegalCaptureOpportunities(stateFor(offBoardBoard, null), 1);
    const onBoard = getLegalCaptureOpportunities(stateFor(onBoardBoard, at(1, 1)), 1);

    expect(offBoard[0]?.routes[0]).toMatchObject({
      intersections: [at(3, 4)],
      segments: [],
      finalEndpoint: at(3, 4),
    });
    expect(
      onBoard[0]?.routes.some(
        (route) => route.intersections[0]?.x === 1 && route.intersections[0]?.y === 1,
      ),
    ).toBe(true);
  });

  it('is deterministic and requires no UI-precomputed candidate input', () => {
    const board = withOncak(createEmptyIntersectionBoard(), [
      ['BLACK', at(1, 4)],
      ['BLACK', at(2, 4)],
    ]);
    const state = stateFor(board, null);

    expect(getLegalCaptureOpportunities(state, 2)).toEqual(getLegalCaptureOpportunities(state, 2));
  });
});

function stateFor(
  board: IntersectionBoard,
  pawnPosition: IntersectionCoordinate | null,
  playerCount: 2 | 3 | 4 = 2,
): RuntimeGameState {
  return {
    gameMode: 'LOCAL_MULTIPLAYER',
    playerCount,
    board,
    players: Array.from({ length: playerCount }, (_, index) => ({
      id: `p${index + 1}`,
      name: `P${index + 1}`,
      controllerType: 'HUMAN' as const,
      score: 0,
      pawn: {
        id: `pawn-p${index + 1}`,
        playerId: `p${index + 1}`,
        state:
          index === 0 && pawnPosition
            ? { status: 'ON_BOARD' as const, position: pawnPosition }
            : { status: 'OFF_BOARD' as const, position: null },
      },
    })),
    activePlayerIndex: 0,
    remainingOncak: 120,
    turn: { phase: 'WAITING_FOR_DICE_ROLL', currentDiceValue: null, mandatorySameDiceCaptureRequired: false, rerollRequired: false },
    legalOpportunities: [],
    selectedCaptureGroup: null,
    matchStatus: 'ACTIVE',
    result: null,
  };
}

function at(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
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
  return board.map((row, y) => row.map((intersection, x) => (x === coordinate.x && y === coordinate.y ? replacement : intersection)));
}
