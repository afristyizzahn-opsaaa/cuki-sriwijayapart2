import { beforeEach, describe, expect, it } from 'vitest';

import { initializeCanonicalGameState } from '../../src/engine/board/initialization';
import { useGameStore } from '../../src/stores/useGameStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useUIStore } from '../../src/stores/useUIStore';
import type {
  IntersectionBoard,
  IntersectionCoordinate,
  RuntimeGameState,
} from '../../src/types/game';

const RESOLVED_RANDOM_VALUES = createResolvedRandomValues(119 * 32);

describe('Zustand engine integration', () => {
  beforeEach(() => {
    useGameStore.getState().resetMatch();
    useUIStore.getState().resetUI();
    useSettingsStore.getState().resetSettings();
  });

  it('delegates startMatch to canonical initialization with 120 Oncak and OFF_BOARD Pawns', () => {
    useGameStore.getState().startMatch(initializationInput());
    const store = useGameStore.getState();

    expect(store.gameState?.remainingOncak).toBe(120);
    expect(
      store.gameState?.board.flat().filter((intersection) => intersection.kind === 'ONCAK'),
    ).toHaveLength(120);
    expect(
      store.gameState?.players.every((player) => player.pawn.state.status === 'OFF_BOARD'),
    ).toBe(true);
    expect(store.activePlayer?.id).toBe('p1');
  });

  it('delegates resolved dice values and returns to reroll only after the endpoint re-evaluation', () => {
    useGameStore.getState().startMatch(initializationInput());
    useGameStore.getState().resolveDice(1);
    const firstOpportunity = useGameStore.getState().legalCaptureOpportunities[0];
    expect(firstOpportunity).toBeDefined();
    useGameStore.getState().selectCaptureOpportunity(firstOpportunity?.id ?? '');
    useGameStore.getState().executeCapture();
    const store = useGameStore.getState();

    expect(store.gameState?.players[0]?.score).toBe(1);
    expect(store.diceValue).toBe(1);
    expect(store.gameState?.turn).toMatchObject({
      phase: 'REROLL_REQUIRED',
      mandatorySameDiceCaptureRequired: false,
      rerollRequired: true,
    });
    expect(store.legalCaptureOpportunities).toHaveLength(0);
  });

  it('preserves REROLL_REQUIRED and finishes a fully locked board', () => {
    const rerollState = stateWithOnlyOncak(2);
    useGameStore.setState(projectState(rerollState));
    useGameStore.getState().resolveDice(1);
    const rerollOpportunity = useGameStore.getState().legalCaptureOpportunities[0];
    useGameStore.getState().selectCaptureOpportunity(rerollOpportunity?.id ?? '');
    useGameStore.getState().executeCapture();

    expect(useGameStore.getState().gameState?.turn).toMatchObject({
      phase: 'REROLL_REQUIRED',
      rerollRequired: true,
    });

    useGameStore.getState().resetMatch();
    useGameStore.setState(projectState(stateWithOnlyOncak(120, false)));
    useGameStore.getState().resolveDice(6);
    const afterFailedRoll = useGameStore.getState();

    expect(afterFailedRoll.gameState?.matchStatus).toBe('MATCH_FINISHED');
    expect(afterFailedRoll.gameState?.turn.phase).toBe('TURN_END');
    expect(afterFailedRoll.gameState?.result).toEqual({
      kind: 'DRAW',
      tiedPlayerIds: ['p1', 'p2'],
    });
  });

  it('preserves MATCH_FINISHED and result state returned by the final-capture engine transition', () => {
    const gameState = finalCaptureState();
    useGameStore.setState(projectState(gameState));

    useGameStore.getState().resolveDice(1);
    const finalOpportunity = useGameStore.getState().legalCaptureOpportunities[0];
    useGameStore.getState().selectCaptureOpportunity(finalOpportunity?.id ?? '');
    useGameStore.getState().executeCapture();
    const store = useGameStore.getState();

    expect(store.gameState?.matchStatus).toBe('MATCH_FINISHED');
    expect(store.result).toEqual({ kind: 'WINNER', winnerId: 'p1' });
    expect(store.gameState?.activePlayerIndex).toBe(0);
    expect(store.gameState?.turn).toMatchObject({ phase: 'TURN_END', rerollRequired: false });
  });

  it('keeps authoritative state unchanged for invalid store actions', () => {
    useGameStore.getState().startMatch(initializationInput());
    useGameStore.getState().resolveDice(1);
    const before = useGameStore.getState().gameState;

    useGameStore.getState().selectCaptureOpportunity('missing');
    useGameStore.getState().executeCapture();
    useGameStore.getState().resolveDice(1);
    const after = useGameStore.getState().gameState;

    expect(before).not.toBeNull();
    expect(after).toBe(before);
  });

  it('keeps UI and settings stores presentation/configuration-only and unable to alter gameplay state', () => {
    useGameStore.getState().startMatch(initializationInput());
    const gameState = useGameStore.getState().gameState;

    useUIStore.getState().setActiveModal('PAUSE');
    useUIStore.getState().setActiveMenu('GAME');
    useUIStore.getState().setActivePanel('SETTINGS');
    useSettingsStore.getState().setBgmVolume(2);
    useSettingsStore.getState().toggleMute();

    expect(useGameStore.getState().gameState).toBe(gameState);
    expect(useUIStore.getState()).toMatchObject({
      activeModal: 'PAUSE',
      activeMenu: 'GAME',
      activePanel: 'SETTINGS',
    });
    expect(useSettingsStore.getState()).toMatchObject({ bgmVolume: 1, isMuted: true });
  });
});

function initializationInput() {
  return {
    gameMode: 'LOCAL_MULTIPLAYER' as const,
    playerCount: 2 as const,
    players: [
      { id: 'p1', name: 'P1', controllerType: 'HUMAN' as const },
      { id: 'p2', name: 'P2', controllerType: 'HUMAN' as const },
    ],
    randomValues: RESOLVED_RANDOM_VALUES,
    maxLayoutAttempts: 32,
  };
}

function finalCaptureState(): RuntimeGameState {
  return stateWithOnlyOncak(1, true);
}

function stateWithOnlyOncak(
  remainingOncak: number,
  scoreForFinalCapture = false,
): RuntimeGameState {
  const base = initializeCanonicalGameState(initializationInput());
  const board =
    scoreForFinalCapture || remainingOncak === 2
      ? retainOnlyOncak(base.board, at(0, 0))
      : emptyBoard(base.board);

  return {
    ...base,
    board,
    remainingOncak,
    players: base.players.map((player, index) =>
      index === 0 && scoreForFinalCapture ? { ...player, score: 119 } : player,
    ),
  };
}

function projectState(gameState: RuntimeGameState) {
  return {
    gameState,
    activePlayer: gameState.players[gameState.activePlayerIndex] ?? null,
    diceValue: gameState.turn.currentDiceValue,
    legalCaptureOpportunities: gameState.legalOpportunities,
    selectedOpportunity: null,
    selectedRoute: null,
    result: gameState.result,
  };
}

function retainOnlyOncak(
  board: IntersectionBoard,
  target: IntersectionCoordinate,
): IntersectionBoard {
  return board.map((row) =>
    row.map((intersection) => {
      if (intersection.kind !== 'ONCAK' || sameCoordinate(intersection.coordinate, target)) {
        return intersection;
      }
      return {
        coordinate: intersection.coordinate,
        kind: 'EMPTY' as const,
        oncak: null,
        pawnOccupantId: null,
      };
    }),
  );
}

function emptyBoard(board: IntersectionBoard): IntersectionBoard {
  return board.map((row) =>
    row.map((intersection) =>
      intersection.kind === 'ONCAK'
        ? {
            coordinate: intersection.coordinate,
            kind: 'EMPTY' as const,
            oncak: null,
            pawnOccupantId: null,
          }
        : intersection,
    ),
  );
}

function at(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
}

function sameCoordinate(first: IntersectionCoordinate, second: IntersectionCoordinate): boolean {
  return first.x === second.x && first.y === second.y;
}

function createResolvedRandomValues(length: number): ReadonlyArray<number> {
  let state = 123456789;
  return Array.from({ length }, () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  });
}
