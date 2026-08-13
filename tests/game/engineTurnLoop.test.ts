import { describe, expect, it } from 'vitest';

import { createEmptyIntersectionBoard } from '../../src/engine/board/initialization';
import {
  endTurn,
  movePawn,
  resolveCaptureAction,
  resolveDiceRoll,
  selectCaptureGroup,
} from '../../src/game/engine';
import type {
  IntersectionBoard,
  IntersectionCoordinate,
  RuntimeGameState,
} from '../../src/types/game';

describe('canonical same-dice capture loop', () => {
  it('keeps the active player in mandatory capture selection while a same-V group remains reachable', () => {
    const state = stateWithTwoDifferentSingleOncak();
    const rolled = resolveDiceRoll(state, 1);
    const first = rolled.legalOpportunities.find(
      (opportunity) => opportunity.candidateOncakCoordinates[0]?.x === 0,
    );
    const group = first ? selectCaptureGroup(rolled, first.id) : null;

    expect(group).not.toBeNull();
    const afterCapture = resolveCaptureAction(rolled, group!);

    expect(afterCapture.activePlayerIndex).toBe(0);
    expect(afterCapture.players[0]?.score).toBe(1);
    expect(afterCapture.turn).toMatchObject({
      phase: 'WAITING_FOR_CAPTURE_SELECTION',
      currentDiceValue: 1,
      mandatorySameDiceCaptureRequired: true,
      rerollRequired: false,
    });
    expect(afterCapture.legalOpportunities).toHaveLength(1);
  });

  it('rejects ending the turn while a mandatory same-dice capture remains', () => {
    const rolled = resolveDiceRoll(stateWithTwoDifferentSingleOncak(), 1);
    const next = endTurn(rolled);

    expect(next).toBe(rolled);
  });

  it('rejects free Pawn movement outside a resolved capture', () => {
    const state = stateWithOnBoardPawn();
    const moved = movePawn(state, {
      intersections: [at(0, 0), at(1, 0), at(2, 0)],
      segments: [{ start: at(0, 0), end: at(2, 0), direction: 'RIGHT' }],
      finalEndpoint: at(2, 0),
    });

    expect(moved).toBe(state);
  });
});

function stateWithTwoDifferentSingleOncak(): RuntimeGameState {
  const board = withOncak(
    withOncak(createEmptyIntersectionBoard(), at(0, 0), 'BLACK'),
    at(1, 0),
    'WHITE',
  );
  return {
    gameMode: 'LOCAL_MULTIPLAYER',
    playerCount: 2,
    board,
    players: [
      {
        id: 'p1',
        name: 'Player 1',
        controllerType: 'HUMAN',
        score: 0,
        pawn: { id: 'pawn-p1', playerId: 'p1', state: { status: 'OFF_BOARD', position: null } },
      },
      {
        id: 'p2',
        name: 'Player 2',
        controllerType: 'HUMAN',
        score: 0,
        pawn: { id: 'pawn-p2', playerId: 'p2', state: { status: 'OFF_BOARD', position: null } },
      },
    ],
    activePlayerIndex: 0,
    remainingOncak: 2,
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

function stateWithOnBoardPawn(): RuntimeGameState {
  const board = withPawn(createEmptyIntersectionBoard(), at(0, 0), 'pawn-p1');
  return {
    ...stateWithTwoDifferentSingleOncak(),
    board,
    remainingOncak: 2,
    players: [
      {
        id: 'p1',
        name: 'Player 1',
        controllerType: 'HUMAN',
        score: 0,
        pawn: { id: 'pawn-p1', playerId: 'p1', state: { status: 'ON_BOARD', position: at(0, 0) } },
      },
      {
        id: 'p2',
        name: 'Player 2',
        controllerType: 'HUMAN',
        score: 0,
        pawn: { id: 'pawn-p2', playerId: 'p2', state: { status: 'OFF_BOARD', position: null } },
      },
    ],
    turn: {
      phase: 'WAITING_FOR_CAPTURE_SELECTION',
      currentDiceValue: 1,
      mandatorySameDiceCaptureRequired: false,
      rerollRequired: false,
    },
  };
}

function at(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
}

function withOncak(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
  color: 'BLACK' | 'WHITE',
): IntersectionBoard {
  return board.map((row, y) =>
    row.map((intersection, x) =>
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
    ),
  );
}

function withPawn(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
  pawnId: string,
): IntersectionBoard {
  return board.map((row, y) =>
    row.map((intersection, x) =>
      x === coordinate.x && y === coordinate.y
        ? { coordinate, kind: 'PAWN' as const, oncak: null, pawnOccupantId: pawnId }
        : intersection,
    ),
  );
}
