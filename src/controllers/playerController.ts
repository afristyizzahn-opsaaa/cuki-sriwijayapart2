import { getLegalCaptureOpportunities } from '../engine/rules/legalCaptureOpportunities';
import type { CaptureOpportunity, ControllerType, RuntimeGameState } from '../types/game';

export interface PlayerController {
  readonly type: ControllerType;
  chooseCaptureOpportunity(state: RuntimeGameState): CaptureOpportunity | null;
}

/** Human inputs are intentionally supplied by the UI, never manufactured by a controller. */
export const humanController: PlayerController = {
  type: 'HUMAN',
  chooseCaptureOpportunity: () => null,
};

/** Easy AI deterministically selects the first action returned by the canonical engine API. */
export const easyAIController: PlayerController = {
  type: 'AI',
  chooseCaptureOpportunity: (state) => {
    const diceValue = state.turn.currentDiceValue;
    if (diceValue === null) {
      return null;
    }
    return getLegalCaptureOpportunities(state, diceValue)[0] ?? null;
  },
};

export function controllerFor(type: ControllerType): PlayerController {
  return type === 'AI' ? easyAIController : humanController;
}
