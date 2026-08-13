import { create } from 'zustand';

import {
  initializeCanonicalGameState,
  type CanonicalGameInitializationInput,
} from '../engine/board/initialization';
import {
  endTurn as resolveTurnEnd,
  endAITurnAfterCapture as resolveAITurnAfterCapture,
  movePawn as resolvePawnMove,
  refreshLegalOpportunities,
  resolveCaptureAction,
  resolveDiceRoll,
  movePawnToIntersection as resolvePawnMoveToIntersection,
} from '../game/engine';
import { clearGameSession, loadGameSession, saveGameSession } from '../services/storage';
import type {
  CaptureGroup,
  CaptureOpportunity,
  CaptureRoute,
  DiceValue,
  MatchResult,
  PlayerState,
  RuntimeGameState,
} from '../types/game';

export interface TurnPassNotice {
  readonly playerName: string;
  readonly diceValue: DiceValue;
}

export interface GameStoreState {
  readonly gameState: RuntimeGameState | null;
  readonly activePlayer: PlayerState | null;
  readonly diceValue: DiceValue | null;
  readonly legalCaptureOpportunities: ReadonlyArray<CaptureOpportunity>;
  readonly selectedOpportunity: CaptureOpportunity | null;
  readonly selectedRoute: CaptureRoute | null;
  readonly result: MatchResult | null;
  readonly turnPassNotice: TurnPassNotice | null;
  startMatch: (input: CanonicalGameInitializationInput) => void;
  resolveDice: (diceValue: DiceValue) => void;
  selectCaptureOpportunity: (opportunityId: string, routeIndex?: number) => void;
  executeCapture: () => void;
  movePawn: (route: CaptureRoute) => void;
  movePawnToIntersection: (coordinate: RuntimeGameState['board'][number][number]['coordinate']) => void;
  endTurn: () => void;
  endAITurnAfterCapture: () => void;
  dismissTurnPassNotice: () => void;
  restoreMatch: () => boolean;
  resetMatch: () => void;
}

const emptyGameStoreState = {
  gameState: null,
  activePlayer: null,
  diceValue: null,
  legalCaptureOpportunities: [],
  selectedOpportunity: null,
  selectedRoute: null,
  result: null,
  turnPassNotice: null,
} as const;

/**
 * Application-facing gameplay state. Every authoritative state update comes from an existing
 * pure engine function; this store does not implement rules, movement, or random generation.
 */
export const useGameStore = create<GameStoreState>((set, get) => ({
  ...initialGameStoreState(),

  startMatch: (input) => {
    publishGameState(set, initializeCanonicalGameState(input), null, null, null);
  },

  resolveDice: (diceValue) => {
    const current = get().gameState;
    if (!current) {
      return;
    }

    const next = resolveDiceRoll(current, diceValue);
    publishGameState(
      set,
      next,
      get().selectedOpportunity,
      get().selectedRoute,
      didExpireTurnAfterRoll(current, next)
        ? { playerName: get().activePlayer?.name ?? 'Pemain aktif', diceValue }
        : null,
    );
  },

  selectCaptureOpportunity: (opportunityId, routeIndex = 0) => {
    const current = get().gameState;
    if (!current) {
      return;
    }

    const opportunity =
      current.legalOpportunities.find((item) => item.id === opportunityId) ?? null;
    const route = opportunity?.routes[routeIndex] ?? null;
    if (!opportunity || !route) {
      return;
    }

    set({ selectedOpportunity: opportunity, selectedRoute: route });
  },

  executeCapture: () => {
    const current = get().gameState;
    const selectedOpportunity = get().selectedOpportunity;
    const selectedRoute = get().selectedRoute;
    if (!current || !selectedOpportunity || !selectedRoute) {
      return;
    }

    const next = resolveCaptureAction(current, toCaptureGroup(selectedOpportunity, selectedRoute));
    const accepted = next !== current;
    publishGameState(
      set,
      next,
      accepted ? null : selectedOpportunity,
      accepted ? null : selectedRoute,
      null,
    );
  },

  movePawn: (route) => {
    const current = get().gameState;
    if (!current) {
      return;
    }
    const next = resolvePawnMove(current, route);
    if (next === current) {
      return;
    }
    publishGameState(set, next, null, null, null);
  },

  movePawnToIntersection: (coordinate) => {
    const current = get().gameState;
    if (!current) return;
    const next = resolvePawnMoveToIntersection(current, coordinate);
    if (next === current) return;
    publishGameState(set, next, null, null, null);
  },

  endTurn: () => {
    const current = get().gameState;
    if (!current) {
      return;
    }

    const next = resolveTurnEnd(current);
    if (next === current) {
      return;
    }
    publishGameState(set, next, null, null, null);
  },

  endAITurnAfterCapture: () => {
    const current = get().gameState;
    if (!current) return;
    const next = resolveAITurnAfterCapture(current);
    if (next === current) return;
    publishGameState(set, next, null, null, null);
  },

  dismissTurnPassNotice: () => set({ turnPassNotice: null }),

  restoreMatch: () => {
    const restoredState = loadGameSession();
    if (!restoredState) {
      return false;
    }
    set({
      ...projectGameState(refreshLegalOpportunities(restoredState), null, null),
      turnPassNotice: null,
    });
    return true;
  },

  resetMatch: () => {
    clearGameSession();
    set(emptyGameStoreState);
  },
}));

function initialGameStoreState():
  | typeof emptyGameStoreState
  | (ReturnType<typeof projectGameState> & Pick<GameStoreState, 'turnPassNotice'>) {
  const restoredState = loadGameSession();
  return restoredState
    ? {
        ...projectGameState(refreshLegalOpportunities(restoredState), null, null),
        turnPassNotice: null,
      }
    : emptyGameStoreState;
}

function publishGameState(
  set: (partial: Partial<GameStoreState>) => void,
  gameState: RuntimeGameState,
  selectedOpportunity: CaptureOpportunity | null,
  selectedRoute: CaptureRoute | null,
  turnPassNotice: TurnPassNotice | null,
): void {
  const refreshedGameState = refreshLegalOpportunities(gameState);
  saveGameSession(refreshedGameState);
  set({
    ...projectGameState(refreshedGameState, selectedOpportunity, selectedRoute),
    turnPassNotice,
  });
}

function projectGameState(
  gameState: RuntimeGameState,
  selectedOpportunity: CaptureOpportunity | null,
  selectedRoute: CaptureRoute | null,
): Pick<
  GameStoreState,
  | 'gameState'
  | 'activePlayer'
  | 'diceValue'
  | 'legalCaptureOpportunities'
  | 'selectedOpportunity'
  | 'selectedRoute'
  | 'result'
> {
  const legalCaptureOpportunities = gameState.legalOpportunities;
  const selectedIsStillLegal = selectedOpportunity
    ? legalCaptureOpportunities.some((opportunity) => opportunity.id === selectedOpportunity.id)
    : false;

  return {
    gameState,
    activePlayer: gameState.players[gameState.activePlayerIndex] ?? null,
    diceValue: gameState.turn.currentDiceValue,
    legalCaptureOpportunities,
    selectedOpportunity: selectedIsStillLegal ? selectedOpportunity : null,
    selectedRoute: selectedIsStillLegal ? selectedRoute : null,
    result: gameState.result,
  };
}

function toCaptureGroup(opportunity: CaptureOpportunity, route: CaptureRoute): CaptureGroup {
  return {
    opportunityId: opportunity.id,
    oncakColor: opportunity.oncakColor,
    oncakIds: opportunity.candidateOncakIds,
    oncakCoordinates: opportunity.candidateOncakCoordinates,
    route,
    finalEndpoint: route.finalEndpoint,
  };
}

function didExpireTurnAfterRoll(previous: RuntimeGameState, next: RuntimeGameState): boolean {
  const rolledFromEligiblePhase =
    previous.turn.phase === 'WAITING_FOR_DICE_ROLL' || previous.turn.phase === 'REROLL_REQUIRED';
  return (
    rolledFromEligiblePhase &&
    next.activePlayerIndex !== previous.activePlayerIndex &&
    next.turn.phase === 'WAITING_FOR_DICE_ROLL' &&
    next.turn.currentDiceValue === null
  );
}
