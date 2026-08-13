import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { KingdomShell } from '../components/layout/KingdomShell';
import { Button } from '../components/ui/Button';
import { useScratchCardStore } from '../store/useScratchCardStore';
import {
  finalAchievement,
  getArchiveProgressCount,
  getProfileLevel,
  loadTreasureProgress,
  persistTreasureProgress,
  treasureCollections,
} from './treasureData';
import type { TreasureCollection, TreasureProgress } from './treasureData';

/** Royal archive hub for historical treasures and collection achievements. */
export function TreasuresPage(): JSX.Element {
  const [progress] = useState<TreasureProgress>(() => loadTreasureProgress());
  const coins = useScratchCardStore((state) => state.coins + state.missionCoins);
  const hearts = useScratchCardStore((state) => state.hearts + state.missionHearts);
  const missions = useScratchCardStore((state) => state.missions);
  const lastRewardNotice = useScratchCardStore((state) => state.lastRewardNotice);
  const completedCount = progress.completedArchiveIds.length;
  const hasGuardianAchievement = completedCount === treasureCollections.length;
  const totalAchievements = treasureCollections.length + 1;
  const unlockedAchievementCount = completedCount + (hasGuardianAchievement ? 1 : 0);
  const progressPercent = Math.round((unlockedAchievementCount / totalAchievements) * 100);
  const profileLevel = useMemo(() => getProfileLevel(progress), [progress]);

  useEffect(() => {
    persistTreasureProgress(progress);
  }, [progress]);

  return (
    <KingdomShell eyebrow="Royal Treasury" title="Treasures of Sriwijaya">
      <section className="relative overflow-hidden rounded-card border border-primary-gold/25 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.18),transparent_30%),linear-gradient(135deg,rgba(74,39,24,0.78),rgba(8,7,6,0.94))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.35)] md:p-8">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#D4AF37_1px,transparent_1px),linear-gradient(#D4AF37_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-primary-amber">
              Arsip Kerajaan Digital
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-surface-parchment md:text-5xl">
              Discover the royal archive of Sriwijaya.
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-surface-parchment/76 md:text-base">
              Jelajahi pusaka sejarah, interaksi budaya Islam Nusantara, warisan Palembang, dan
              perjalanan pelestarian permainan CUKI dalam ruang museum digital yang hidup.
            </p>
          </div>
          <ProfilePanel
            hasGuardianAchievement={hasGuardianAchievement}
            knowledgePoints={progress.knowledgePoints}
            progressPercent={progressPercent}
            profileLevel={profileLevel}
            totalAchievements={totalAchievements}
            unlockedAchievementCount={unlockedAchievementCount}
          />
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <RewardWallet coins={coins} hearts={hearts} lastRewardNotice={lastRewardNotice} />
        <MissionLedger missions={missions} />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {treasureCollections.map((treasure) => (
          <TreasureArchiveCard
            key={treasure.id}
            isUnlocked={progress.completedArchiveIds.includes(treasure.id)}
            isVisited={progress.visitedArchiveIds.includes(treasure.id)}
            progressCount={getArchiveProgressCount(treasure, progress)}
            treasure={treasure}
          />
        ))}
      </section>

    </KingdomShell>
  );
}

function RewardWallet({
  coins,
  hearts,
  lastRewardNotice,
}: {
  readonly coins: number;
  readonly hearts: number;
  readonly lastRewardNotice: { readonly title: string; readonly description: string } | null;
}): JSX.Element {
  return (
    <article className="rounded-card border border-primary-gold/25 bg-bg-dark/62 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)]">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">
        Currencies
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-primary-gold/20 bg-primary-gold/8 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Coins</p>
          <p className="mt-2 font-display text-3xl text-primary-gold">{coins}</p>
        </div>
        <div className="rounded-2xl border border-primary-gold/20 bg-primary-gold/8 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Hearts</p>
          <p className="mt-2 font-display text-3xl text-primary-gold">{hearts}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-primary-gold/15 bg-bg-dark-slate/55 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-gold">
          Reward Feedback
        </p>
        <p className="mt-2 text-sm text-surface-parchment/82">
          {lastRewardNotice ? lastRewardNotice.title : 'Belum ada reward baru.'}
        </p>
        {lastRewardNotice ? (
          <p className="mt-1 text-xs leading-5 text-text-muted">{lastRewardNotice.description}</p>
        ) : null}
      </div>
    </article>
  );
}

function MissionLedger({
  missions,
}: {
  readonly missions: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly progress: number;
    readonly target: number;
    readonly completed: boolean;
    readonly claimed: boolean;
  }>;
}): JSX.Element {
  return (
    <article className="rounded-card border border-primary-gold/25 bg-bg-dark/62 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)]">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">
        Missions
      </p>
      <div className="mt-4 space-y-3">
        {missions.map((mission) => (
          <div key={mission.id} className="rounded-2xl border border-primary-gold/15 bg-bg-dark-slate/55 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-surface-parchment">{mission.title}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">{mission.description}</p>
              </div>
              <span className="rounded-full border border-primary-gold/20 px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-primary-gold">
                {mission.completed ? 'Done' : 'Open'}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-parchment/10">
              <div
                className="h-full rounded-full bg-primary-gold"
                style={{ width: `${Math.min(100, (mission.progress / mission.target) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {mission.progress} / {mission.target} · {mission.claimed ? 'Claimed' : 'Unclaimed'}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function AchievementLedger({
  achievements,
}: {
  readonly achievements: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly category: string;
    readonly unlocked: boolean;
  }>;
}): JSX.Element {
  return (
    <article className="rounded-card border border-primary-gold/25 bg-bg-dark/62 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)]">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">
        Achievements
      </p>
      <div className="mt-4 space-y-3">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="rounded-2xl border border-primary-gold/15 bg-bg-dark-slate/55 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-surface-parchment">{achievement.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-primary-gold">
                  {achievement.category}
                </p>
              </div>
              <span className="rounded-full border border-primary-gold/20 px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-primary-gold">
                {achievement.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-text-muted">{achievement.description}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function ProfilePanel({
  hasGuardianAchievement,
  knowledgePoints,
  profileLevel,
  progressPercent,
  totalAchievements,
  unlockedAchievementCount,
}: {
  readonly hasGuardianAchievement: boolean;
  readonly knowledgePoints: number;
  readonly profileLevel: string;
  readonly progressPercent: number;
  readonly totalAchievements: number;
  readonly unlockedAchievementCount: number;
}): JSX.Element {
  return (
    <aside className="rounded-card border border-primary-gold/30 bg-bg-dark/62 p-5 shadow-[0_0_42px_rgba(212,175,55,0.12)] backdrop-blur-md">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-gold">
        Pewaris Sriwijaya
      </p>
      <div className="mt-5 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full border border-primary-gold bg-primary-gold/15 text-primary-gold shadow-[0_0_28px_rgba(212,175,55,0.24)]">
          <ShieldCheck aria-hidden="true" className="h-8 w-8" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">User Level</p>
          <p className="font-display text-2xl font-semibold text-surface-parchment">
            {profileLevel}
          </p>
          <p className="mt-1 text-xs font-semibold text-primary-gold">{knowledgePoints} XP</p>
        </div>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-surface-parchment">Treasures Discovered</span>
          <span className="text-primary-gold">
            {unlockedAchievementCount} / {totalAchievements}
          </span>
        </div>
        <div
          aria-label="Treasures Discovered progress"
          aria-valuemax={totalAchievements}
          aria-valuemin={0}
          aria-valuenow={unlockedAchievementCount}
          className="mt-3 h-3 overflow-hidden rounded-full bg-surface-parchment/12"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary-gold shadow-[0_0_18px_rgba(212,175,55,0.45)] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-text-muted">
        {hasGuardianAchievement
          ? finalAchievement.description
          : 'Buka archive detail, selesaikan tantangan, lalu nyalakan badge kerajaan.'}
      </p>
    </aside>
  );
}

function TreasureArchiveCard({
  isUnlocked,
  isVisited,
  progressCount,
  treasure,
}: {
  readonly isUnlocked: boolean;
  readonly isVisited: boolean;
  readonly progressCount: number;
  readonly treasure: TreasureCollection;
}): JSX.Element {
  const Icon = treasure.icon;

  return (
    <article
      className={`group rounded-card border bg-bg-dark/64 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-primary-gold/45 hover:shadow-[0_0_40px_rgba(212,175,55,0.14)] ${
        isUnlocked ? 'border-primary-gold/55' : 'border-primary-gold/20'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`grid h-14 w-14 place-items-center rounded-full border ${
            isUnlocked
              ? 'border-primary-gold bg-primary-gold text-text-dark shadow-[0_0_28px_rgba(212,175,55,0.35)]'
              : 'border-primary-gold/30 bg-primary-gold/10 text-primary-gold'
          }`}
        >
          <Icon aria-hidden="true" className="h-7 w-7" />
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
            isUnlocked
              ? 'bg-primary-gold text-text-dark'
              : 'border border-primary-gold/25 text-text-muted'
          }`}
        >
          {isUnlocked ? 'Unlocked' : isVisited ? 'Opened' : 'Locked'}
        </span>
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold text-primary-gold">
        {treasure.title}
      </h2>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-amber/80">
        {treasure.theme}
      </p>
      <p className="mt-4 text-sm leading-6 text-surface-parchment/70">{treasure.description}</p>
      <div className="mt-5 rounded-2xl border border-primary-gold/20 bg-primary-gold/5 p-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          <span>Archive Progress</span>
          <span className="text-primary-gold">
            {progressCount} / {treasure.totalProgress}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-parchment/10">
          <div
            className="h-full rounded-full bg-primary-gold transition-all"
            style={{ width: `${(progressCount / treasure.totalProgress) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-surface-parchment/64">
          Achievement preview: {treasure.achievement}
        </p>
      </div>
      <Button
        asChild
        className="mt-5 w-full rounded-full border-primary-gold/45 bg-bg-mahogany/70"
        variant={isUnlocked ? 'primary' : 'secondary'}
      >
        <Link to={`/treasures/${treasure.id}`}>{isUnlocked ? 'Open Again' : 'Open Archive'}</Link>
      </Button>
    </article>
  );
}

function AchievementBadge({
  description,
  icon: Icon,
  isUnlocked,
  title,
}: {
  readonly description: string;
  readonly icon: LucideIcon;
  readonly isUnlocked: boolean;
  readonly title: string;
}): JSX.Element {
  return (
    <article
      className={`group rounded-card border p-5 text-center transition duration-300 hover:-translate-y-1 ${
        isUnlocked
          ? 'border-primary-gold/55 bg-primary-gold/10 shadow-[0_0_34px_rgba(212,175,55,0.18)]'
          : 'border-primary-gold/15 bg-bg-dark/55 opacity-75'
      }`}
    >
      <div
        className={`mx-auto grid h-20 w-20 place-items-center rounded-full border-2 transition ${
          isUnlocked
            ? 'border-primary-gold bg-primary-gold text-text-dark shadow-[0_0_32px_rgba(212,175,55,0.4)]'
            : 'border-primary-gold/24 bg-black/30 text-text-muted'
        }`}
      >
        {isUnlocked ? (
          <Icon aria-hidden="true" className="h-9 w-9" />
        ) : (
          <LockKeyhole aria-hidden="true" className="h-8 w-8" />
        )}
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-primary-gold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-text-muted">
        {isUnlocked ? description : 'Terkunci sampai knowledge challenge diselesaikan.'}
      </p>
    </article>
  );
}
