import type { IntersectionBoard, IntersectionCoordinate, IntersectionState, OncakColor } from '../types/game';

export const BOARD_ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'] as const;
export const BOARD_COLUMN_COUNT = 11;

export type BoardRowLabel = (typeof BOARD_ROW_LABELS)[number];
export type BoardCoordinateLabel = `${BoardRowLabel}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11}`;

/** Converts the engine coordinate (x/y) into the label printed around the board. */
export function coordinateToBoardLabel(coordinate: IntersectionCoordinate): BoardCoordinateLabel {
  const row = BOARD_ROW_LABELS[coordinate.y];
  if (!row) {
    throw new RangeError(`Invalid board row: ${coordinate.y}`);
  }
  return `${row}${coordinate.x + 1}` as BoardCoordinateLabel;
}

/** Converts a visible board label such as H2 back into the engine coordinate. */
export function boardLabelToCoordinate(label: string): IntersectionCoordinate | null {
  const match = /^([A-K])(10|11|[1-9])$/i.exec(label.trim());
  if (!match) return null;

  const y = BOARD_ROW_LABELS.indexOf(match[1].toUpperCase() as BoardRowLabel);
  const x = Number(match[2]) - 1;
  if (y < 0 || x < 0 || x >= BOARD_COLUMN_COUNT) return null;
  return { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
}

export function getIntersectionByLabel(
  board: IntersectionBoard,
  label: string,
): IntersectionState | null {
  const coordinate = boardLabelToCoordinate(label);
  return coordinate ? board[coordinate.y]?.[coordinate.x] ?? null : null;
}

export function getOncakByLabel(
  board: IntersectionBoard,
  label: string,
  color?: OncakColor,
): IntersectionState extends never ? never : Extract<IntersectionState, { kind: 'ONCAK' }>['oncak'] | null {
  const intersection = getIntersectionByLabel(board, label);
  if (intersection?.kind !== 'ONCAK' || (color && intersection.oncak.color !== color)) return null;
  return intersection.oncak;
}

/** Useful for diagnostics, tests, and future JSON board editors. */
export function boardToLabelMap(board: IntersectionBoard): Record<string, IntersectionState['kind']> {
  return Object.fromEntries(
    board.flat().map((intersection) => [coordinateToBoardLabel(intersection.coordinate), intersection.kind]),
  );
}
