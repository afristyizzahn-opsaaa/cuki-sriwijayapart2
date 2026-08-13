import {
  CENTRAL_LOGO_COORDINATE,
  INITIAL_BLACK_ONCAK,
  INITIAL_ONCAK_COUNT,
  INITIAL_WHITE_ONCAK,
  INTERSECTION_GRID_SIZE,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from '../../constants/gameRules';
import type {
  ControllerType,
  GameMode,
  IntersectionAxis,
  IntersectionBoard,
  IntersectionCoordinate,
  IntersectionState,
  OncakColor,
  PlayerCount,
  PlayerState,
  RuntimeGameState,
} from '../../types/game';

export interface PlayerSetup {
  readonly id: string;
  readonly name: string;
  readonly controllerType: ControllerType;
}

export interface OncakLayoutEntry {
  readonly id: string;
  readonly color: OncakColor;
}

export interface CanonicalGameInitializationInput {
  readonly gameMode: GameMode;
  readonly playerCount: PlayerCount;
  readonly players: ReadonlyArray<PlayerSetup>;
  readonly randomValues: ReadonlyArray<number>;
  readonly maxLayoutAttempts: number;
}

export class InitializationError extends Error {
  public constructor(readonly code: 'INVALID_PLAYER_SETUP' | 'INVALID_RANDOM_INPUT' | 'LAYOUT_EXHAUSTED') {
    super(code);
    this.name = 'InitializationError';
  }
}

interface ShuffleResult<T> {
  readonly values: ReadonlyArray<T>;
  readonly consumedRandomValues: number;
}

/** Creates the immutable 121-node intersection network with a central hard block. */
export function createEmptyIntersectionBoard(): IntersectionBoard {
  return Array.from({ length: INTERSECTION_GRID_SIZE }, (_, y) =>
    Array.from({ length: INTERSECTION_GRID_SIZE }, (_, x) => {
      const coordinate = { x: x as IntersectionAxis, y: y as IntersectionAxis };

      if (isCentralLogoCoordinate(coordinate)) {
        return {
          coordinate,
          kind: 'CENTRAL_LOGO' as const,
          oncak: null,
          pawnOccupantId: null,
        };
      }

      return {
        coordinate,
        kind: 'EMPTY' as const,
        oncak: null,
        pawnOccupantId: null,
      };
    }),
  );
}

/** Creates the exact locked 60 BLACK / 60 WHITE Oncak pool. */
export function createCanonicalOncakPool(): ReadonlyArray<OncakLayoutEntry> {
  const blackOncak = Array.from({ length: INITIAL_BLACK_ONCAK }, (_, index) => ({
    id: `oncak-black-${index + 1}`,
    color: 'BLACK' as const,
  }));
  const whiteOncak = Array.from({ length: INITIAL_WHITE_ONCAK }, (_, index) => ({
    id: `oncak-white-${index + 1}`,
    color: 'WHITE' as const,
  }));

  return [...blackOncak, ...whiteOncak];
}

/** Assigns an ordered full Oncak layout to every non-central intersection. */
export function assignOncakLayout(
  board: IntersectionBoard,
  layout: ReadonlyArray<OncakLayoutEntry>,
): IntersectionBoard {
  if (layout.length !== INITIAL_ONCAK_COUNT) {
    throw new InitializationError('INVALID_PLAYER_SETUP');
  }

  let layoutIndex = 0;
  return board.map((row) =>
    row.map((intersection) => {
      if (intersection.kind === 'CENTRAL_LOGO') {
        return intersection;
      }

      const oncak = layout[layoutIndex];
      layoutIndex += 1;

      return {
        coordinate: intersection.coordinate,
        kind: 'ONCAK' as const,
        oncak: {
          ...oncak,
          state: 'PRESENT' as const,
          position: intersection.coordinate,
        },
        pawnOccupantId: null,
      };
    }),
  );
}

/** Returns whether a candidate layout satisfies all initial color-sequence constraints. */
export function validateInitialOncakLayout(board: IntersectionBoard): boolean {
  return validateVerticalSequences(board) && validateDiagonalSequences(board);
}

/** Validates only the vertical maximum-six color constraint. */
export function validateVerticalSequences(board: IntersectionBoard): boolean {
  return Array.from({ length: INTERSECTION_GRID_SIZE }, (_, x) =>
    Array.from({ length: INTERSECTION_GRID_SIZE }, (_, y) => board[y]?.[x]),
  ).every(isSequenceWithinLimit);
}

/** Validates both diagonal maximum-six color constraints; horizontal lines are excluded. */
export function validateDiagonalSequences(board: IntersectionBoard): boolean {
  const descendingDiagonals = collectDiagonals(board, 1);
  const ascendingDiagonals = collectDiagonals(board, -1);

  return [...descendingDiagonals, ...ascendingDiagonals].every(isSequenceWithinLimit);
}

/** Constructs a canonical initial runtime state from caller-supplied resolved random values. */
export function initializeCanonicalGameState(
  input: CanonicalGameInitializationInput,
): RuntimeGameState {
  validateInitializationInput(input);

  const pool = createCanonicalOncakPool();
  let randomOffset = 0;

  for (let attempt = 0; attempt < input.maxLayoutAttempts; attempt += 1) {
    const shuffled = shuffleWithRandomValues(pool, input.randomValues, randomOffset);
    randomOffset += shuffled.consumedRandomValues;

    const board = assignOncakLayout(createEmptyIntersectionBoard(), shuffled.values);
    if (!validateInitialOncakLayout(board)) {
      continue;
    }

    return {
      gameMode: input.gameMode,
      playerCount: input.playerCount,
      board,
      players: initializePlayers(input.players),
      activePlayerIndex: 0,
      remainingOncak: INITIAL_ONCAK_COUNT,
      turn: {
        phase: 'WAITING_FOR_DICE_ROLL',
        currentDiceValue: null,
        mandatorySameDiceCaptureRequired: false,
        rerollRequired: false,
      },
      legalOpportunities: [],
      selectedCaptureGroup: null,
      matchStatus: 'ACTIVE',
      result: null,
    };
  }

  throw new InitializationError('LAYOUT_EXHAUSTED');
}

/** Returns null for invalid coordinates without mutating the board. */
export function getIntersectionState(
  board: IntersectionBoard,
  x: number,
  y: number,
): IntersectionState | null {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) {
    return null;
  }

  return board[y]?.[x] ?? null;
}

/** Returns the existing orthogonal neighbors of an intersection, never diagonal cells. */
export function getOrthogonalNeighbors(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
): ReadonlyArray<IntersectionState> {
  return [
    getIntersectionState(board, coordinate.x, coordinate.y - 1),
    getIntersectionState(board, coordinate.x + 1, coordinate.y),
    getIntersectionState(board, coordinate.x, coordinate.y + 1),
    getIntersectionState(board, coordinate.x - 1, coordinate.y),
  ].filter((intersection): intersection is IntersectionState => intersection !== null);
}

function isCentralLogoCoordinate(coordinate: IntersectionCoordinate): boolean {
  return coordinate.x === CENTRAL_LOGO_COORDINATE.x && coordinate.y === CENTRAL_LOGO_COORDINATE.y;
}

function initializePlayers(players: ReadonlyArray<PlayerSetup>): ReadonlyArray<PlayerState> {
  return players.map((player) => ({
    id: player.id,
    name: player.name,
    controllerType: player.controllerType,
    score: 0,
    pawn: {
      id: `pawn-${player.id}`,
      playerId: player.id,
      state: {
        status: 'OFF_BOARD',
        position: null,
      },
    },
  }));
}

function validateInitializationInput(input: CanonicalGameInitializationInput): void {
  const hasSupportedPlayerCount =
    input.playerCount >= MIN_PLAYERS && input.playerCount <= MAX_PLAYERS;
  const hasMatchingPlayers = input.players.length === input.playerCount;
  const hasPositiveAttemptLimit = Number.isInteger(input.maxLayoutAttempts) && input.maxLayoutAttempts > 0;

  if (!hasSupportedPlayerCount || !hasMatchingPlayers || !hasPositiveAttemptLimit) {
    throw new InitializationError('INVALID_PLAYER_SETUP');
  }
}

function shuffleWithRandomValues<T>(
  values: ReadonlyArray<T>,
  randomValues: ReadonlyArray<number>,
  randomOffset: number,
): ShuffleResult<T> {
  const shuffled = [...values];
  let consumedRandomValues = 0;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomValue = randomValues[randomOffset + consumedRandomValues];
    if (!isValidResolvedRandomValue(randomValue)) {
      throw new InitializationError('INVALID_RANDOM_INPUT');
    }

    const swapIndex = Math.floor(randomValue * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    consumedRandomValues += 1;
  }

  return { values: shuffled, consumedRandomValues };
}

function isValidResolvedRandomValue(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value >= 0 && value < 1;
}

function collectDiagonals(board: IntersectionBoard, slope: 1 | -1): ReadonlyArray<ReadonlyArray<IntersectionState>> {
  const diagonals: IntersectionState[][] = [];

  for (let startX = 0; startX < INTERSECTION_GRID_SIZE; startX += 1) {
    diagonals.push(collectDiagonal(board, startX, slope === 1 ? 0 : INTERSECTION_GRID_SIZE - 1, slope));
  }

  for (let startY = 1; startY < INTERSECTION_GRID_SIZE; startY += 1) {
    diagonals.push(collectDiagonal(board, slope === 1 ? 0 : INTERSECTION_GRID_SIZE - 1, startY, slope));
  }

  return diagonals;
}

function collectDiagonal(
  board: IntersectionBoard,
  startX: number,
  startY: number,
  slope: 1 | -1,
): IntersectionState[] {
  const diagonal: IntersectionState[] = [];
  let x = startX;
  let y = startY;

  while (x >= 0 && x < INTERSECTION_GRID_SIZE && y >= 0 && y < INTERSECTION_GRID_SIZE) {
    const intersection = board[y]?.[x];
    if (intersection) {
      diagonal.push(intersection);
    }
    x += 1;
    y += slope;
  }

  return diagonal;
}

function isSequenceWithinLimit(line: ReadonlyArray<IntersectionState>): boolean {
  let previousColor: OncakColor | null = null;
  let sequenceLength = 0;

  for (const intersection of line) {
    const color = intersection.kind === 'ONCAK' ? intersection.oncak.color : null;
    if (color === null) {
      previousColor = null;
      sequenceLength = 0;
      continue;
    }

    sequenceLength = color === previousColor ? sequenceLength + 1 : 1;
    previousColor = color;
    if (sequenceLength > 6) {
      return false;
    }
  }

  return true;
}
