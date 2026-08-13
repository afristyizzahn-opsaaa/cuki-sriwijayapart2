import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  resolveScratchCardReward,
  type ScratchCardReward,
  type ScratchRewardState,
} from '../engine/scratch/rewardResolution';

export type { ScratchBoardEffect, ScratchCardReward } from '../engine/scratch/rewardResolution';

export type MissionId = 'MIS_01' | 'MIS_02' | 'MIS_03';
export type AchievementId = 'FIRST_VICTORY';

export type RewardKind = 'COINS' | 'HEARTS' | 'ACHIEVEMENT';

export interface RewardNotice {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly kind: RewardKind;
  readonly amount?: number;
  readonly createdAt: string;
}

export interface MissionReward {
  readonly kind: 'COINS' | 'HEARTS';
  readonly amount: number;
}

export interface MissionDefinition {
  readonly id: MissionId;
  readonly title: string;
  readonly description: string;
  readonly type: 'MATCH_COMPLETED' | 'MATCH_WON' | 'QUIZ_CORRECT';
  readonly target: number;
  readonly reward: MissionReward | readonly MissionReward[];
  readonly progress: number;
  readonly completed: boolean;
  readonly claimed: boolean;
}

export interface AchievementDefinition {
  readonly id: AchievementId;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly unlocked: boolean;
  readonly unlockedAt: string | null;
}

export interface RewardLedgerState extends ScratchRewardState {
  readonly missionCoins: number;
  readonly missionHearts: number;
  readonly missions: ReadonlyArray<MissionDefinition>;
  readonly achievements: ReadonlyArray<AchievementDefinition>;
  readonly lastRewardNotice: RewardNotice | null;
}

export interface ScratchCardStoreState extends ScratchRewardState {
  readonly missionCoins: number;
  readonly missionHearts: number;
  readonly missions: ReadonlyArray<MissionDefinition>;
  readonly achievements: ReadonlyArray<AchievementDefinition>;
  readonly lastRewardNotice: RewardNotice | null;
  readonly revealedCardIds: ReadonlyArray<string>;
  /** Returns false when the card was already claimed. */
  claimScratchReward: (reward: ScratchCardReward) => boolean;
  grantCoins: (amount: number, source?: string) => void;
  grantHeart: (amount: number, source?: string) => void;
  recordMatchCompletion: (input: { readonly didWin: boolean }) => void;
  recordQuizSuccess: () => void;
  clearBoardEffect: () => void;
  resetScratchRewards: () => void;
  getTotalCoins: () => number;
  getTotalHearts: () => number;
}

const initialState: ScratchRewardState = {
  coins: 0,
  hearts: 0,
  activeBoardEffect: 'NONE',
};

/**
 * Persistent presentation/reward state for ScratchCard. Match state remains in
 * `src/stores/useGameStore.ts`; this store only records optional card rewards.
 */
export const useScratchCardStore = create<ScratchCardStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      missionCoins: 0,
      missionHearts: 1,
      missions: createInitialMissions(),
      achievements: createInitialAchievements(),
      lastRewardNotice: null,
      revealedCardIds: [],

      claimScratchReward: (reward) => {
        if (get().revealedCardIds.includes(reward.id)) {
          return false;
        }

        set((state) => ({
          ...resolveScratchCardReward(state, reward),
          revealedCardIds: [...state.revealedCardIds, reward.id],
        }));
        return true;
      },

      grantCoins: (amount, source = 'Reward') => {
        const amountSafe = clampAmount(amount);
        if (amountSafe <= 0) return;
        set((state) => ({
          coins: state.coins + amountSafe,
          missionCoins: state.missionCoins + amountSafe,
          lastRewardNotice: {
            id: makeRewardNoticeId(),
            title: `${source} +${amountSafe} Coins`,
            description: 'Sriwijaya Coins berhasil ditambahkan ke wallet pemain.',
            kind: 'COINS',
            amount: amountSafe,
            createdAt: new Date().toISOString(),
          },
        }));
      },

      grantHeart: (amount, source = 'Reward') => {
        const amountSafe = clampAmount(amount);
        if (amountSafe <= 0) return;
        set((state) => ({
          hearts: state.hearts + amountSafe,
          missionHearts: state.missionHearts + amountSafe,
          lastRewardNotice: {
            id: makeRewardNoticeId(),
            title: `${source} +${amountSafe} Heart`,
            description: 'Heart token berhasil ditambahkan ke inventory pemain.',
            kind: 'HEARTS',
            amount: amountSafe,
            createdAt: new Date().toISOString(),
          },
        }));
      },

      recordMatchCompletion: ({ didWin }) => {
        applyMissionProgress(set, get, 'MIS_01', 1);
        if (didWin) {
          applyMissionProgress(set, get, 'MIS_02', 1);
          unlockFirstVictoryAchievement(set, get);
        }
      },

      recordQuizSuccess: () => {
        applyMissionProgress(set, get, 'MIS_03', 1);
      },

      clearBoardEffect: () => set({ activeBoardEffect: 'NONE' }),

      resetScratchRewards: () =>
        set({
          ...initialState,
          missionCoins: 0,
          missionHearts: 1,
          missions: createInitialMissions(),
          achievements: createInitialAchievements(),
          lastRewardNotice: null,
          revealedCardIds: [],
        }),
      getTotalCoins: () => get().coins + get().missionCoins,
      getTotalHearts: () => get().hearts + get().missionHearts,
    }),
    {
      name: 'cuki-scratch-card-rewards',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        coins: state.coins,
        hearts: state.hearts,
        missionCoins: state.missionCoins,
        missionHearts: state.missionHearts,
        missions: state.missions,
        achievements: state.achievements,
        lastRewardNotice: state.lastRewardNotice,
        activeBoardEffect: state.activeBoardEffect,
        revealedCardIds: state.revealedCardIds,
      }),
    },
  ),
);

function createInitialMissions(): ReadonlyArray<MissionDefinition> {
  return [
    {
      id: 'MIS_01',
      title: 'First Journey',
      description: "Complete the player's first CUKI match.",
      type: 'MATCH_COMPLETED',
      target: 1,
      reward: { kind: 'COINS', amount: 50 },
      progress: 0,
      completed: false,
      claimed: false,
    },
    {
      id: 'MIS_02',
      title: 'First Victory',
      description: "Win the player's first CUKI match.",
      type: 'MATCH_WON',
      target: 1,
      reward: [
        { kind: 'COINS', amount: 100 },
        { kind: 'HEARTS', amount: 1 },
      ],
      progress: 0,
      completed: false,
      claimed: false,
    },
    {
      id: 'MIS_03',
      title: 'Keeper of Knowledge',
      description: 'Answer one eligible Royal Scroll / Mini Quiz question correctly.',
      type: 'QUIZ_CORRECT',
      target: 1,
      reward: { kind: 'HEARTS', amount: 1 },
      progress: 0,
      completed: false,
      claimed: false,
    },
  ];
}

function createInitialAchievements(): ReadonlyArray<AchievementDefinition> {
  return [
    {
      id: 'FIRST_VICTORY',
      title: 'First Victory',
      description: 'Perjalananmu sebagai pejuang Cuki telah dimulai.',
      category: 'Chicken Legacy',
      unlocked: false,
      unlockedAt: null,
    },
  ];
}

function applyMissionProgress(
  set: (partial: Partial<ScratchCardStoreState> | ((state: ScratchCardStoreState) => Partial<ScratchCardStoreState>)) => void,
  get: () => ScratchCardStoreState,
  missionId: MissionId,
  progressDelta: number,
): void {
  const current = get().missions.find((mission) => mission.id === missionId);
  if (!current) return;

  const nextProgress = Math.min(current.target, current.progress + progressDelta);
  const completed = nextProgress >= current.target;
  const shouldGrant = completed && !current.claimed;
  const nextMissions = get().missions.map((mission) =>
    mission.id === missionId
      ? { ...mission, progress: nextProgress, completed, claimed: mission.claimed || shouldGrant }
      : mission,
  );

  set({ missions: nextMissions });

  if (!shouldGrant) {
    return;
  }

  const updatedState = get();
  const mission = updatedState.missions.find((item) => item.id === missionId);
  if (!mission) return;
  grantMissionReward(set, get, mission);
}

function grantMissionReward(
  set: (partial: Partial<ScratchCardStoreState>) => void,
  get: () => ScratchCardStoreState,
  mission: MissionDefinition,
): void {
  const rewards = Array.isArray(mission.reward) ? mission.reward : [mission.reward];
  let coins = 0;
  let hearts = 0;

  for (const reward of rewards) {
    if (reward.kind === 'COINS') coins += clampAmount(reward.amount);
    if (reward.kind === 'HEARTS') hearts += clampAmount(reward.amount);
  }

  const current = get();
  set({
    coins: current.coins + coins,
    hearts: current.hearts + hearts,
    missionCoins: current.missionCoins + coins,
    missionHearts: current.missionHearts + hearts,
    lastRewardNotice: {
      id: makeRewardNoticeId(),
      title: `${mission.title} completed`,
      description: formatRewardDescription(rewards),
      kind: rewards.length > 0 ? rewards[0]!.kind : 'COINS',
      amount: coins + hearts,
      createdAt: new Date().toISOString(),
    },
  });
}

function unlockFirstVictoryAchievement(
  set: (partial: Partial<ScratchCardStoreState>) => void,
  get: () => ScratchCardStoreState,
): void {
  const achievement = get().achievements.find((item) => item.id === 'FIRST_VICTORY');
  if (!achievement || achievement.unlocked) {
    return;
  }

  set({
    achievements: get().achievements.map((item) =>
      item.id === 'FIRST_VICTORY'
        ? {
            ...item,
            unlocked: true,
            unlockedAt: new Date().toISOString(),
          }
        : item,
    ),
    lastRewardNotice: {
      id: makeRewardNoticeId(),
      title: 'Achievement Unlocked',
      description: 'Chicken Legacy → First Victory',
      kind: 'ACHIEVEMENT',
      createdAt: new Date().toISOString(),
    },
  });
}

function formatRewardDescription(rewards: ReadonlyArray<MissionReward>): string {
  return rewards
    .map((reward) => (reward.kind === 'COINS' ? `+${reward.amount} Coins` : `+${reward.amount} Heart`))
    .join(' • ');
}

function clampAmount(value: number): number {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function makeRewardNoticeId(): string {
  return `reward-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
