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
    <KingdomShell eyebrow="Khazanah Kesultanan" title="Khazanah Kesultanan">
      <div className="sr-only">Heritage Guardian</div>
      <section className="relative overflow-hidden rounded-card border border-primary-gold/25 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.18),transparent_30%),linear-gradient(135deg,rgba(74,39,24,0.78),rgba(8,7,6,0.94))] p-7 shadow-[0_28px_90px_rgba(0,0,0,0.35)] md:p-10">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#D4AF37_1px,transparent_1px),linear-gradient(#D4AF37_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,2.65fr)_minmax(300px,0.85fr)] lg:items-stretch">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-primary-amber">
              Arsip Kesultanan Digital
            </p>
            <h2 className="mt-4 max-w-[22ch] font-display text-[2rem] font-semibold leading-[1.07] text-surface-parchment md:max-w-[24ch] md:text-[2.8rem] lg:max-w-[27ch] lg:text-[3rem] xl:text-[3.15rem]">
              <span className="block">Jelajahi Khazanah</span>
              <span className="block">Kesultanan Palembang Darussalam.</span>
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-surface-parchment/76 md:text-[1.02rem]">
              Telusuri sejarah, pusaka, seni, tradisi, dan warisan Kesultanan Palembang Darussalam
              melalui arsip digital interaktif CUKI.
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

      <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.7fr)] lg:items-start">
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
  const rewardTitle = lastRewardNotice ? formatRewardTitle(lastRewardNotice.title) : null;
  const rewardDescription = lastRewardNotice
    ? formatRewardDescription(lastRewardNotice.description)
    : null;

  return (
    <article className="h-full rounded-card border border-primary-gold/25 bg-bg-dark/62 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)] md:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">
        Sumber Daya
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-primary-gold/20 bg-primary-gold/8 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Koin</p>
          <p className="mt-2 font-display text-3xl text-primary-gold">{coins}</p>
        </div>
        <div className="rounded-2xl border border-primary-gold/20 bg-primary-gold/8 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Nyawa Cadangan</p>
          <p className="mt-2 font-display text-3xl text-primary-gold">{hearts}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-primary-gold/15 bg-bg-dark-slate/55 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-gold">Hasil Hadiah</p>
        <p className="mt-2 text-sm text-surface-parchment/82">
          {rewardTitle ?? 'Belum ada hadiah baru.'}
        </p>
        {rewardDescription ? (
          <p className="mt-1 text-xs leading-5 text-text-muted">{rewardDescription}</p>
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
    <article className="min-h-full rounded-card border border-primary-gold/25 bg-bg-dark/62 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)] md:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">Misi</p>
      <div className="mt-4 space-y-3">
        {missions.map((mission) => (
          <div key={mission.id} className="rounded-2xl border border-primary-gold/15 bg-bg-dark-slate/55 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-surface-parchment">{formatMissionTitle(mission.title)}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">
                  {formatMissionDescription(mission.description)}
                </p>
              </div>
              <span className="rounded-full border border-primary-gold/20 px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-primary-gold">
                {mission.completed ? 'SELESAI' : 'TERBUKA'}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-parchment/10">
              <div
                className="h-full rounded-full bg-primary-gold"
                style={{ width: `${Math.min(100, (mission.progress / mission.target) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {mission.progress} / {mission.target} · {mission.claimed ? 'Diklaim' : 'Belum Diklaim'}
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
    <aside className="h-full rounded-card border border-primary-gold/30 bg-bg-dark/62 p-6 shadow-[0_0_42px_rgba(212,175,55,0.12)] backdrop-blur-md md:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-gold">
        Penjelajah Khazanah
      </p>
      <div className="mt-6 flex items-center gap-5">
        <div className="grid h-18 w-18 place-items-center rounded-full border border-primary-gold bg-primary-gold/15 text-primary-gold shadow-[0_0_28px_rgba(212,175,55,0.24)]">
          <ShieldCheck aria-hidden="true" className="h-8 w-8" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Tingkat Pengguna</p>
          <p className="font-display text-2xl font-semibold text-surface-parchment">
            {profileLevel}
          </p>
          <p className="mt-1 text-xs font-semibold text-primary-gold">{knowledgePoints} XP</p>
        </div>
      </div>
      <div className="mt-7">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-surface-parchment">Khazanah Ditemukan</span>
          <span className="text-primary-gold">
            {unlockedAchievementCount} / {totalAchievements}
          </span>
        </div>
        <div
          aria-label="Treasures Discovered progress"
          aria-valuemax={totalAchievements}
          aria-valuemin={0}
          aria-valuenow={unlockedAchievementCount}
        className="mt-3 h-3.5 overflow-hidden rounded-full bg-surface-parchment/12"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary-gold shadow-[0_0_18px_rgba(212,175,55,0.45)] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <p className="mt-5 text-xs leading-5 text-text-muted">
        {hasGuardianAchievement
          ? finalAchievement.description
          : 'Buka setiap arsip, selesaikan tantangan, dan kumpulkan lencana warisan.'}
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
          <span>Progres Arsip</span>
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
          Pratinjau Pencapaian: {treasure.achievement}
        </p>
      </div>
      <Button
        asChild
        className="mt-5 w-full rounded-full border-primary-gold/45 bg-bg-mahogany/70"
        variant={isUnlocked ? 'primary' : 'secondary'}
      >
        <Link to={`/treasures/${treasure.id}`}>{isUnlocked ? 'Buka Kembali' : 'Buka Arsip'}</Link>
      </Button>
    </article>
  );
}

function formatMissionTitle(title: string): string {
  switch (title) {
    case 'First Journey':
      return 'Perjalanan Pertama';
    case 'First Victory':
      return 'Kemenangan Pertama';
    case 'Keeper of Knowledge':
      return 'Penjaga Pengetahuan';
    default:
      return title;
  }
}

function formatMissionDescription(description: string): string {
  switch (description) {
    case "Complete the player's first CUKI match.":
      return 'Selesaikan pertandingan CUKI pertama.';
    case "Win the player's first CUKI match.":
      return 'Menangkan pertandingan CUKI pertama.';
    case 'Answer one eligible Royal Scroll / Mini Quiz question correctly.':
      return 'Jawab dengan benar satu pertanyaan Gulungan Kerajaan / Kuis Mini yang memenuhi syarat.';
    default:
      return description;
  }
}

function formatRewardTitle(title: string): string {
  return title
    .replace('First Journey completed', 'Perjalanan Pertama selesai')
    .replace('First Victory completed', 'Kemenangan Pertama selesai')
    .replace('Keeper of Knowledge completed', 'Penjaga Pengetahuan selesai')
    .replace(/Coins/g, 'Koin');
}

function formatRewardDescription(description: string): string {
  return description.replace(/Sriwijaya Coins/g, 'Koin').replace(/Coins/g, 'Koin');
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
