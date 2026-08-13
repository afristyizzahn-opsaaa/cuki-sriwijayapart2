import { describe, expect, it } from 'vitest';

import {
  boardLabelToCoordinate,
  boardToLabelMap,
  coordinateToBoardLabel,
  getOncakByLabel,
} from '../../src/game/boardCoordinates';
import { createEmptyIntersectionBoard } from '../../src/engine/board/initialization';
import type { IntersectionBoard, IntersectionCoordinate } from '../../src/types/game';

describe('named Cuki board coordinates', () => {
  it('maps engine coordinates to visible labels', () => {
    expect(coordinateToBoardLabel(at(0, 0))).toBe('A1');
    expect(coordinateToBoardLabel(at(1, 7))).toBe('H2');
    expect(coordinateToBoardLabel(at(10, 10))).toBe('K11');
  });

  it('parses labels case-insensitively and rejects invalid labels', () => {
    expect(boardLabelToCoordinate('h2')).toEqual(at(1, 7));
    expect(boardLabelToCoordinate('K11')).toEqual(at(10, 10));
    expect(boardLabelToCoordinate('L2')).toBeNull();
    expect(boardLabelToCoordinate('H12')).toBeNull();
  });

  it('detects an Oncak by its board label', () => {
    const board = withOncak(createEmptyIntersectionBoard(), at(1, 7), 'BLACK');
    expect(getOncakByLabel(board, 'H2')?.color).toBe('BLACK');
    expect(getOncakByLabel(board, 'H2', 'WHITE')).toBeNull();
    expect(boardToLabelMap(board).H2).toBe('ONCAK');
  });
});

function at(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
}

function withOncak(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
  color: 'BLACK' | 'WHITE',
): IntersectionBoard {
  return board.map((row, y) => row.map((intersection, x) =>
    x === coordinate.x && y === coordinate.y
      ? {
          coordinate,
          kind: 'ONCAK' as const,
          oncak: {
            id: `oncak-${coordinate.x}-${coordinate.y}`,
            color,
            state: 'PRESENT' as const,
            position: coordinate,
          },
          pawnOccupantId: null,
        }
      : intersection,
  ));
}
