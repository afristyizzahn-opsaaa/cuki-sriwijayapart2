import { describe, expect, it } from 'vitest';

import {
  assignOncakLayout,
  createEmptyIntersectionBoard,
  getIntersectionState,
  getOrthogonalNeighbors,
  initializeCanonicalGameState,
  validateDiagonalSequences,
  validateInitialOncakLayout,
  validateVerticalSequences,
  type OncakLayoutEntry,
} from '../../src/engine/board/initialization';
import type { IntersectionCoordinate, OncakColor, PlayerCount } from '../../src/types/game';

const RESOLVED_RANDOM_VALUES = createResolvedRandomValues(119 * 32);

describe('canonical board initialization', () => {
  it('TC-BRD-001 — initializes the complete 121-intersection network and rejects out-of-bounds queries', () => {
    const board = createEmptyIntersectionBoard();

    expect(board).toHaveLength(11);
    expect(board.every((row) => row.length === 11)).toBe(true);
    expect(board.flat()).toHaveLength(121);
    expect(getIntersectionState(board, 0, 0)?.coordinate).toEqual({ x: 0, y: 0 });
    expect(getIntersectionState(board, 10, 10)?.coordinate).toEqual({ x: 10, y: 10 });
    expect(getIntersectionState(board, -1, 0)).toBeNull();
    expect(getIntersectionState(board, 11, 5)).toBeNull();
    expect(getIntersectionState(board, 2.5, 2.5)).toBeNull();
  });

  it('TC-BRD-003 — maps only orthogonal neighbors at corners, edges, and interior intersections', () => {
    const board = createEmptyIntersectionBoard();
    const coordinatesOf = (coordinate: IntersectionCoordinate) =>
      getOrthogonalNeighbors(board, coordinate).map((intersection) => intersection.coordinate);

    expect(coordinatesOf({ x: 0, y: 0 })).toEqual([{ x: 1, y: 0 }, { x: 0, y: 1 }]);
    expect(coordinatesOf({ x: 0, y: 5 })).toEqual([{ x: 0, y: 4 }, { x: 1, y: 5 }, { x: 0, y: 6 }]);
    expect(coordinatesOf({ x: 2, y: 2 })).toEqual([
      { x: 2, y: 1 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 1, y: 2 },
    ]);
  });

  it('TC-INIT-001 and TC-INIT-002 — creates 120 Oncak with complete non-central coverage', () => {
    const state = initializeForPlayers(2);
    const occupiedIntersections = state.board.flat().filter((node) => node.kind === 'ONCAK');

    expect(occupiedIntersections).toHaveLength(120);
    expect(occupiedIntersections.filter((node) => node.oncak.color === 'BLACK')).toHaveLength(60);
    expect(occupiedIntersections.filter((node) => node.oncak.color === 'WHITE')).toHaveLength(60);
    expect(state.board[5]?.[5]).toMatchObject({
      kind: 'CENTRAL_LOGO',
      oncak: null,
      pawnOccupantId: null,
    });
    expect(state.remainingOncak).toBe(120);
    expect(state.remainingOncak + state.players.reduce((sum, player) => sum + player.score, 0)).toBe(120);
  });

  it('TC-DIST-001 — accepts six and rejects seven vertical same-color Oncak', () => {
    expect(validateVerticalSequences(createLayoutWithBlackRun(verticalCoordinates(6)))).toBe(true);
    expect(validateVerticalSequences(createLayoutWithBlackRun(verticalCoordinates(7)))).toBe(false);
  });

  it('TC-DIST-002 — rejects seven same-color Oncak on either diagonal orientation', () => {
    const descending = coordinatesFrom(0, 2, 1, 1, 7);
    const ascending = coordinatesFrom(0, 8, 1, -1, 7);

    expect(validateDiagonalSequences(createLayoutWithBlackRun(descending))).toBe(false);
    expect(validateDiagonalSequences(createLayoutWithBlackRun(ascending))).toBe(false);
  });

  it('TC-DIST-003 — does not apply the max-six constraint horizontally', () => {
    const board = createHorizontallyUnrestrictedLayout();

    expect(validateVerticalSequences(board)).toBe(true);
    expect(validateDiagonalSequences(board)).toBe(true);
    expect(validateInitialOncakLayout(board)).toBe(true);
  });

  it('TC-PawnInit-001, TC-PawnInit-002, REG-003, and REG-014 — keeps pawns OFF_BOARD without removing Oncak', () => {
    const state = initializeForPlayers(4);

    expect(state.players).toHaveLength(4);
    expect(state.players.every((player) => player.score === 0)).toBe(true);
    expect(state.players.every((player) => player.pawn.state.status === 'OFF_BOARD')).toBe(true);
    expect(state.players.every((player) => player.pawn.state.position === null)).toBe(true);
    expect(state.board[0]?.[0]).toMatchObject({ kind: 'ONCAK', oncak: { state: 'PRESENT' } });
  });

  it('initializes two, three, and four players with the canonical active match state', () => {
    for (const playerCount of [2, 3, 4] as const) {
      const state = initializeForPlayers(playerCount);

      expect(state.playerCount).toBe(playerCount);
      expect(state.activePlayerIndex).toBe(0);
      expect(state.matchStatus).toBe('ACTIVE');
      expect(state.turn.phase).toBe('WAITING_FOR_DICE_ROLL');
    }
  });

  it('TC-DET-001 — reproduces the same initial state from the same resolved random input', () => {
    expect(initializeForPlayers(3)).toEqual(initializeForPlayers(3));
  });
});

function initializeForPlayers(playerCount: PlayerCount) {
  return initializeCanonicalGameState({
    gameMode: 'LOCAL_MULTIPLAYER',
    playerCount,
    players: Array.from({ length: playerCount }, (_, index) => ({
      id: `player-${index + 1}`,
      name: `Player ${index + 1}`,
      controllerType: 'HUMAN' as const,
    })),
    randomValues: RESOLVED_RANDOM_VALUES,
    maxLayoutAttempts: 32,
  });
}

function createLayoutWithBlackRun(
  run: ReadonlyArray<IntersectionCoordinate>,
  compensationCoordinates?: ReadonlyArray<IntersectionCoordinate>,
) {
  const runKeys = new Set(run.map(toCoordinateKey));
  const colors = new Map<string, OncakColor>();

  forEachPlayableCoordinate((coordinate) => {
    colors.set(toCoordinateKey(coordinate), (coordinate.x + coordinate.y) % 2 === 0 ? 'BLACK' : 'WHITE');
  });
  for (const coordinate of run) {
    colors.set(toCoordinateKey(coordinate), 'BLACK');
  }

  rebalanceBlackOncak(colors, runKeys, compensationCoordinates);
  return assignOncakLayout(createEmptyIntersectionBoard(), createLayoutEntries(colors));
}

function createHorizontallyUnrestrictedLayout() {
  const colors = new Map<string, OncakColor>();

  forEachPlayableCoordinate((coordinate) => {
    colors.set(toCoordinateKey(coordinate), coordinate.y % 2 === 0 ? 'BLACK' : 'WHITE');
  });
  for (let x = 0; x < 6; x += 1) {
    colors.set(`${x},0`, 'WHITE');
  }

  return assignOncakLayout(createEmptyIntersectionBoard(), createLayoutEntries(colors));
}

function rebalanceBlackOncak(
  colors: Map<string, OncakColor>,
  protectedKeys: ReadonlySet<string>,
  compensationCoordinates?: ReadonlyArray<IntersectionCoordinate>,
): void {
  let blackCount = Array.from(colors.values()).filter((color) => color === 'BLACK').length;

  for (const coordinate of compensationCoordinates ?? []) {
    const key = toCoordinateKey(coordinate);
    if (blackCount > 60 && !protectedKeys.has(key) && colors.get(key) === 'BLACK') {
      colors.set(key, 'WHITE');
      blackCount -= 1;
    }
  }

  forEachPlayableCoordinate((coordinate) => {
    const key = toCoordinateKey(coordinate);
    if (blackCount > 60 && !protectedKeys.has(key) && colors.get(key) === 'BLACK') {
      colors.set(key, 'WHITE');
      blackCount -= 1;
    }
  });
}

function createLayoutEntries(colors: ReadonlyMap<string, OncakColor>): ReadonlyArray<OncakLayoutEntry> {
  const entries: OncakLayoutEntry[] = [];
  let blackId = 1;
  let whiteId = 1;

  forEachPlayableCoordinate((coordinate) => {
    const color = colors.get(toCoordinateKey(coordinate));
    if (!color) {
      throw new Error('Missing test Oncak color.');
    }

    const id = color === 'BLACK' ? `test-black-${blackId++}` : `test-white-${whiteId++}`;
    entries.push({ id, color });
  });

  return entries;
}

function forEachPlayableCoordinate(callback: (coordinate: IntersectionCoordinate) => void): void {
  for (let y = 0; y <= 10; y += 1) {
    for (let x = 0; x <= 10; x += 1) {
      if (x !== 5 || y !== 5) {
        callback({ x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] });
      }
    }
  }
}

function verticalCoordinates(length: number): ReadonlyArray<IntersectionCoordinate> {
  return coordinatesFrom(3, 0, 0, 1, length);
}

function coordinatesFrom(
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number,
  length: number,
): ReadonlyArray<IntersectionCoordinate> {
  return Array.from({ length }, (_, index) => ({
    x: (startX + deltaX * index) as IntersectionCoordinate['x'],
    y: (startY + deltaY * index) as IntersectionCoordinate['y'],
  }));
}

function toCoordinateKey(coordinate: IntersectionCoordinate): string {
  return `${coordinate.x},${coordinate.y}`;
}

function createResolvedRandomValues(length: number): ReadonlyArray<number> {
  let state = 123456789;

  return Array.from({ length }, () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  });
}
