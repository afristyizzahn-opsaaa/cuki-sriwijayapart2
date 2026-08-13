import { describe, expect, it } from 'vitest';

import { createEmptyIntersectionBoard } from '../../src/engine/board/initialization';
import {
  endTurn,
  resolveCaptureGroup,
  resolveDiceValue,
} from '../../src/engine/rules/captureResolution';
import type { CaptureGroup, CaptureRoute, IntersectionBoard, IntersectionCoordinate, RuntimeGameState } from '../../src/types/game';

describe('atomic capture resolution and turn transitions', () => {
  it('TC-RES-001 and TC-END-001 — commits a complete group once, then evaluates only after endpoint settlement', () => {
    const board = withPawn(
      withOncak(createEmptyIntersectionBoard(), [
        ['BLACK', at(0, 1)],
        ['BLACK', at(0, 2)],
        ['BLACK', at(0, 3)],
        ['WHITE', at(2, 3)],
        ['WHITE', at(3, 3)],
        ['WHITE', at(4, 3)],
      ]),
      at(0, 0),
      'pawn-p1',
    );
    const initial = stateFor(board, at(0, 0), 12);
    const selected = resolveDiceValue({
      state: initial,
      diceValue: 3,
      candidates: [candidate('three-black', [at(0, 1), at(0, 2), at(0, 3)], route([at(0, 0), at(0, 3)]))],
    }).state;

    const result = resolveCaptureGroup({
      state: selected,
      group: groupFrom(selected, 'three-black'),
      postCaptureCandidates: [
        candidate('post-commit-only', [at(2, 3), at(3, 3), at(4, 3)], route([at(0, 3), at(4, 3)])),
      ],
    });

    expect(result.accepted).toBe(true);
    expect(initial.board[1]?.[0]?.kind).toBe('ONCAK');
    expect(result.state.players[0]?.score).toBe(3);
    expect(result.state.remainingOncak).toBe(9);
    expect(result.state.players[0]?.pawn.state).toEqual({ status: 'ON_BOARD', position: at(0, 3) });
    expect(result.state.board[1]?.[0]?.kind).toBe('EMPTY');
    expect(result.state.board[2]?.[0]?.kind).toBe('EMPTY');
    expect(result.state.board[3]?.[0]).toMatchObject({ kind: 'PAWN', pawnOccupantId: 'pawn-p1' });
    expect(result.state.legalOpportunities.map((opportunity) => opportunity.id)).toEqual(['post-commit-only']);
    expect(result.state.turn).toMatchObject({ phase: 'WAITING_FOR_CAPTURE_SELECTION', currentDiceValue: 3, rerollRequired: false });

    const rejected = resolveCaptureGroup({
      state: selected,
      group: { ...groupFrom(selected, 'three-black'), oncakIds: ['forged', 'ids', 'only'] },
      postCaptureCandidates: [],
    });
    expect(rejected).toMatchObject({ accepted: false, reason: 'GROUP_NOT_LEGAL', state: selected });
  });

  it('TC-ENTRY-001 — resolves an OFF_BOARD first capture as a normal counted entry transaction', () => {
    const board = withOncak(createEmptyIntersectionBoard(), [
      ['WHITE', at(3, 3)],
      ['WHITE', at(3, 4)],
    ]);
    const initial = stateFor(board, null, 8);
    const selected = resolveDiceValue({
      state: initial,
      diceValue: 2,
      candidates: [candidate('entry-two', [at(3, 3), at(3, 4)], route([at(3, 3), at(3, 4)]))],
    }).state;

    const result = resolveCaptureGroup({
      state: selected,
      group: groupFrom(selected, 'entry-two'),
      postCaptureCandidates: [],
    });

    expect(result.accepted).toBe(true);
    expect(result.state.players[0]?.score).toBe(2);
    expect(result.state.remainingOncak).toBe(6);
    expect(result.state.players[0]?.pawn.state).toEqual({ status: 'ON_BOARD', position: at(3, 4) });
    expect(result.state.board[3]?.[3]?.kind).toBe('EMPTY');
    expect(result.state.board[4]?.[3]).toMatchObject({ kind: 'PAWN', pawnOccupantId: 'pawn-p1' });
  });

  it('TC-MAN-001, TC-MAN-002, and REG-009 — retains the same value and every legal choice, rejecting an early reroll', () => {
    const board = withPawn(
      withOncak(createEmptyIntersectionBoard(), [
        ['BLACK', at(1, 2)],
        ['BLACK', at(2, 1)],
      ]),
      at(1, 1),
      'pawn-p1',
    );
    const initial = stateFor(board, at(1, 1), 8);
    const selected = resolveDiceValue({
      state: initial,
      diceValue: 1,
      candidates: [
        candidate('group-a', [at(1, 2)], route([at(1, 1), at(1, 2)])),
        candidate('group-b', [at(2, 1)], route([at(1, 1), at(2, 1)])),
      ],
    }).state;

    expect(selected.legalOpportunities.map((opportunity) => opportunity.id)).toEqual(['group-a', 'group-b']);
    expect(resolveDiceValue({ state: selected, diceValue: 2, candidates: [] })).toMatchObject({
      accepted: false,
      reason: 'INVALID_TURN_PHASE',
      state: selected,
    });
  });

  it('TC-MAN-003, TC-MAN-004, and TC-UNR-002 — uses the settled endpoint for same-value reachability and drops unreachable candidates', () => {
    const board = withPawns(
      withOncak(createEmptyIntersectionBoard(), [
        ['BLACK', at(0, 2)],
        ['BLACK', at(0, 4)],
        ['BLACK', at(2, 2)],
      ]),
      [
        [at(0, 0), 'pawn-p1'],
        [at(0, 3), 'pawn-p2'],
        [at(1, 0), 'pawn-p3'],
      ],
    );
    const initial = stateFor(board, at(0, 0), 10);
    const selected = resolveDiceValue({
      state: initial,
      diceValue: 1,
      candidates: [candidate('first', [at(0, 2)], route([at(0, 0), at(0, 2)]))],
    }).state;

    const result = resolveCaptureGroup({
      state: selected,
      group: groupFrom(selected, 'first'),
      postCaptureCandidates: [
        candidate('newly-reachable', [at(0, 4)], route([at(0, 2), at(1, 2), at(1, 4), at(0, 4)])),
        candidate('still-blocked', [at(2, 2)], route([at(0, 2), at(0, 4), at(2, 4), at(2, 2)])),
      ],
    });

    expect(result.state.turn.phase).toBe('WAITING_FOR_CAPTURE_SELECTION');
    expect(result.state.legalOpportunities.map((opportunity) => opportunity.id)).toEqual(['newly-reachable']);
    expect(result.state.players[0]?.pawn.state).toEqual({ status: 'ON_BOARD', position: at(0, 2) });
  });

  it('TC-RER-001, TC-TRN-001, and REG-010 — grants reroll only after current-value exhaustion, then ends after a failed new value', () => {
    const board = withPawn(withOncak(createEmptyIntersectionBoard(), [['WHITE', at(4, 5)]]), at(4, 4), 'pawn-p1');
    const initial = stateFor(board, at(4, 4), 5);
    const selected = resolveDiceValue({
      state: initial,
      diceValue: 1,
      candidates: [candidate('only-group', [at(4, 5)], route([at(4, 4), at(4, 5)]))],
    }).state;
    const exhausted = resolveCaptureGroup({
      state: selected,
      group: groupFrom(selected, 'only-group'),
      postCaptureCandidates: [],
    }).state;

    expect(exhausted.turn).toMatchObject({ phase: 'REROLL_REQUIRED', currentDiceValue: 1, rerollRequired: true });
    const failedNewRoll = resolveDiceValue({ state: exhausted, diceValue: 4, candidates: [] });
    expect(failedNewRoll.accepted).toBe(true);
    expect(failedNewRoll.state.turn).toEqual({
      phase: 'WAITING_FOR_DICE_ROLL',
      currentDiceValue: null,
      mandatorySameDiceCaptureRequired: false,
      rerollRequired: false,
    });
    expect(failedNewRoll.state.activePlayerIndex).toBe(1);
  });

  it('TC-UNR-003 and TC-ENTRY-003 — a failed new roll ends the turn without moving an OFF_BOARD Pawn', () => {
    const initial = stateFor(createEmptyIntersectionBoard(), null, 9);
    const result = resolveDiceValue({ state: initial, diceValue: 5, candidates: [] });

    expect(result.accepted).toBe(true);
    expect(result.state.players[0]?.pawn.state).toEqual({ status: 'OFF_BOARD', position: null });
    expect(result.state.players[0]?.score).toBe(0);
    expect(result.state.board).toEqual(initial.board);
    expect(result.state.activePlayerIndex).toBe(1);
    expect(result.state.turn.phase).toBe('WAITING_FOR_DICE_ROLL');
  });

  it('TC-RER-002 — permits repeated capture-exhaustion-reroll cycles without a cap', () => {
    let board = createEmptyIntersectionBoard();
    board = withPawn(board, at(0, 0), 'pawn-p1');
    board = withOncak(
      board,
      Array.from({ length: 10 }, (_, index) => ['BLACK' as const, at(index + 1, 0)] as const),
    );
    let current = stateFor(board, at(0, 0), 30);

    for (let index = 1; index <= 10; index += 1) {
      const origin = at(index - 1, 0);
      const target = at(index, 0);
      const selected = resolveDiceValue({
        state: current,
        diceValue: 1,
        candidates: [candidate(`cycle-${index}`, [target], route([origin, target]))],
      }).state;
      current = resolveCaptureGroup({
        state: selected,
        group: groupFrom(selected, `cycle-${index}`),
        postCaptureCandidates: [],
      }).state;

      expect(current.turn.phase).toBe('REROLL_REQUIRED');
    }

    expect(current.activePlayerIndex).toBe(0);
    expect(current.players[0]?.score).toBe(10);
  });

  it('TC-ORD-001 and REG-011 — rotates two, three, and four players cyclically without elimination', () => {
    for (const playerCount of [2, 3, 4] as const) {
      let current = stateFor(createEmptyIntersectionBoard(), null, 20, playerCount);
      const indices: number[] = [];
      for (let index = 0; index < playerCount; index += 1) {
        current = endTurn(current);
        indices.push(current.activePlayerIndex);
      }
      expect(indices).toEqual([...Array.from({ length: playerCount - 1 }, (_, index) => index + 1), 0]);
    }
  });

  it('TC-MCH-001 — final capture finishes immediately, preserves endpoint, and resolves the final score', () => {
    const board = withPawn(withOncak(createEmptyIntersectionBoard(), [['BLACK', at(1, 0)]]), at(0, 0), 'pawn-p1');
    const baseState = stateFor(board, at(0, 0), 1);
    const initial: RuntimeGameState = {
      ...baseState,
      players: baseState.players.map((player) => (player.id === 'p1' ? { ...player, score: 119 } : player)),
    };
    const selected = resolveDiceValue({
      state: initial,
      diceValue: 1,
      candidates: [candidate('final-group', [at(1, 0)], route([at(0, 0), at(1, 0)]))],
    }).state;

    const result = resolveCaptureGroup({
      state: selected,
      group: groupFrom(selected, 'final-group'),
      postCaptureCandidates: [],
    }).state;

    expect(result.matchStatus).toBe('MATCH_FINISHED');
    expect(result.result).toEqual({ kind: 'WINNER', winnerId: 'p1' });
    expect(result.activePlayerIndex).toBe(0);
    expect(result.players[0]?.score).toBe(120);
    expect(result.players[0]?.pawn.state).toEqual({ status: 'ON_BOARD', position: at(1, 0) });
    expect(result.turn).toMatchObject({ phase: 'TURN_END', currentDiceValue: null, rerollRequired: false });
  });
});

function stateFor(
  board: IntersectionBoard,
  pawnPosition: IntersectionCoordinate | null,
  remainingOncak: number,
  playerCount: 2 | 3 | 4 = 2,
): RuntimeGameState {
  return {
    gameMode: 'LOCAL_MULTIPLAYER',
    playerCount,
    board,
    players: Array.from({ length: playerCount }, (_, index) => {
      const id = `p${index + 1}`;
      return {
        id,
        name: id,
        controllerType: 'HUMAN' as const,
        score: 0,
        pawn: {
          id: `pawn-${id}`,
          playerId: id,
          state:
            index === 0 && pawnPosition
              ? { status: 'ON_BOARD' as const, position: pawnPosition }
              : { status: 'OFF_BOARD' as const, position: null },
        },
      };
    }),
    activePlayerIndex: 0,
    remainingOncak,
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

function groupFrom(state: RuntimeGameState, opportunityId: string): CaptureGroup {
  const opportunity = state.legalOpportunities.find((candidateOpportunity) => candidateOpportunity.id === opportunityId);
  if (!opportunity) {
    throw new Error(`Missing legal opportunity: ${opportunityId}`);
  }
  const routeForGroup = opportunity.routes[0];
  if (!routeForGroup) {
    throw new Error(`Missing route for: ${opportunityId}`);
  }
  return {
    opportunityId: opportunity.id,
    oncakColor: opportunity.oncakColor,
    oncakIds: opportunity.candidateOncakIds,
    oncakCoordinates: opportunity.candidateOncakCoordinates,
    route: routeForGroup,
    finalEndpoint: routeForGroup.finalEndpoint,
  };
}

function at(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
}

function candidate(id: string, oncakCoordinates: ReadonlyArray<IntersectionCoordinate>, captureRoute: CaptureRoute) {
  return { id, oncakCoordinates, route: captureRoute };
}

function route(waypoints: ReadonlyArray<IntersectionCoordinate>): CaptureRoute {
  const segments = waypoints.slice(1).map((end, index) => ({
    start: waypoints[index] as IntersectionCoordinate,
    end,
    direction: directionBetween(waypoints[index] as IntersectionCoordinate, end),
  }));
  const intersections = segments.flatMap((segment, index) => {
    const points = pointsAlongSegment(segment.start, segment.end);
    return index === 0 ? points : points.slice(1);
  });

  return {
    intersections: intersections.length > 0 ? intersections : [waypoints[0] as IntersectionCoordinate],
    segments,
    finalEndpoint: waypoints[waypoints.length - 1] as IntersectionCoordinate,
  };
}

function directionBetween(start: IntersectionCoordinate, end: IntersectionCoordinate): 'UP' | 'RIGHT' | 'DOWN' | 'LEFT' {
  if (start.x === end.x) {
    return start.y < end.y ? 'DOWN' : 'UP';
  }
  return start.x < end.x ? 'RIGHT' : 'LEFT';
}

function pointsAlongSegment(start: IntersectionCoordinate, end: IntersectionCoordinate): IntersectionCoordinate[] {
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
