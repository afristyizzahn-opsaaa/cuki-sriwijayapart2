/**
 * Pure reward resolution for scratch cards. This is deliberately separate from
 * the Cuki match engine: a scratch reward must never alter captured Oncak or a
 * match winner without an explicit game-rule integration.
 */
export type ScratchRewardKind = 'COINS' | 'HEARTS' | 'BOARD_EFFECT';

export type ScratchBoardEffect = 'NONE' | 'GOLDEN_REVEAL' | 'LUCKY_TURN';

export interface ScratchCardReward {
  readonly id: string;
  readonly kind: ScratchRewardKind;
  readonly amount?: number;
  readonly boardEffect?: Exclude<ScratchBoardEffect, 'NONE'>;
}

export interface ScratchRewardState {
  readonly coins: number;
  readonly hearts: number;
  readonly activeBoardEffect: ScratchBoardEffect;
}

/** Applies one validated scratch reward without mutating the previous state. */
export function resolveScratchCardReward(
  state: ScratchRewardState,
  reward: ScratchCardReward,
): ScratchRewardState {
  const amount = Math.max(0, Math.floor(reward.amount ?? 0));

  switch (reward.kind) {
    case 'COINS':
      return { ...state, coins: state.coins + amount };
    case 'HEARTS':
      return { ...state, hearts: state.hearts + amount };
    case 'BOARD_EFFECT':
      return {
        ...state,
        activeBoardEffect: reward.boardEffect ?? 'GOLDEN_REVEAL',
      };
  }
}
