import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Sparkles, XCircle } from 'lucide-react';

import { KingdomShell } from '../components/layout/KingdomShell';
import { Button } from '../components/ui/Button';
import {
  completeArchive,
  getArchiveProgressCount,
  getProfileLevel,
  getTreasureById,
  loadTreasureProgress,
  persistTreasureProgress,
  visitArchive,
} from './treasureData';
import type { QuizOption, TreasureProgress } from './treasureData';
import { useScratchCardStore } from '../store/useScratchCardStore';

type ChallengeState = 'reading' | 'challenge' | 'completed';

/** Dedicated archive exploration page with story, challenge, and reward flow. */
export function ArchiveDetailPage(): JSX.Element {
  const { archiveId } = useParams();
  const treasure = getTreasureById(archiveId);
  const [progress, setProgress] = useState<TreasureProgress>(() => loadTreasureProgress());
  const [challengeState, setChallengeState] = useState<ChallengeState>('reading');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submittedOption, setSubmittedOption] = useState<QuizOption | null>(null);
  const [earnedReward, setEarnedReward] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const recordQuizSuccess = useScratchCardStore((state) => state.recordQuizSuccess);

  const profileLevel = useMemo(() => getProfileLevel(progress), [progress]);
  const isCompleted = treasure ? progress.completedArchiveIds.includes(treasure.id) : false;

  useEffect(() => {
    if (!treasure) {
      return;
    }

    setProgress((current) => {
      const next = visitArchive(current, treasure.id);
      persistTreasureProgress(next);
      return next;
    });
  }, [recordQuizSuccess, treasure]);

  if (!treasure) {
    return <Navigate replace to="/treasures" />;
  }

  const Icon = treasure.icon;
  const progressCount = getArchiveProgressCount(treasure, progress);
  const correctOption = treasure.quizOptions.find((option) => option.isCorrect);
  const score = submittedOption?.isCorrect ? 1 : 0;
  const storyLabel = treasure.storyLabel ?? 'Story';
  const factsLabel = treasure.factsLabel ?? 'Historical Facts';
  const challengeLabel = treasure.challengeLabel ?? 'Knowledge Challenge';
  const rewardLabel = treasure.rewardLabel ?? 'Reward';
  const progressLabel = treasure.progressLabel ?? `${progressCount} / ${treasure.totalProgress} Progress`;
  const backLinkLabel = treasure.backLinkLabel ?? 'Kembali ke Treasures';
  const treasureProgressLabel = treasure.treasureProgressLabel ?? '+1 Treasure Progress';
  const achievementProgressLabel = treasure.achievementProgressLabel ?? 'Achievement Progress Updated';

  const submitAnswer = (): void => {
    const selectedOption = treasure.quizOptions.find((option) => option.id === selectedOptionId);
    if (!selectedOption) {
      return;
    }

    setSubmittedOption(selectedOption);
    if (selectedOption.isCorrect) {
      setEarnedReward(!isCompleted);
      recordQuizSuccess();
      setProgress((current) => {
        const next = completeArchive(current, treasure.id);
        persistTreasureProgress(next);
        return next;
      });
      setChallengeState('completed');
    }
  };

  const retryChallenge = (): void => {
    setSelectedOptionId(null);
    setSubmittedOption(null);
  };

  return (
    <KingdomShell eyebrow="Archive Exploration" title={treasure.title}>
      <div className="mb-6">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-gold transition hover:text-primary-amber"
          to="/treasures"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {backLinkLabel}
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-card border border-primary-gold/25 bg-[radial-gradient(circle_at_75%_20%,rgba(212,175,55,0.2),transparent_28%),linear-gradient(135deg,rgba(74,39,24,0.82),rgba(8,7,6,0.96))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.36)] md:p-8">
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(90deg,#D4AF37_1px,transparent_1px),linear-gradient(#D4AF37_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-primary-amber">
              {treasure.theme}
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-surface-parchment md:text-5xl">
              {treasure.title}
            </h2>
            <p className="mt-3 font-display text-2xl text-primary-gold">{treasure.subtitle}</p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-surface-parchment/76 md:text-base">
              {treasure.heroDescription ?? treasure.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.15em]">
              <span className="rounded-full border border-primary-gold/30 px-3 py-2 text-primary-gold">
                {progressLabel}
              </span>
              <span className="rounded-full border border-primary-gold/30 px-3 py-2 text-surface-parchment/70">
                {progress.knowledgePoints} XP
              </span>
              <span className="rounded-full border border-primary-gold/30 px-3 py-2 text-surface-parchment/70">
                {profileLevel}
              </span>
            </div>
          </div>

          <div className="group relative min-h-[320px] overflow-hidden rounded-card border border-primary-gold/25 bg-[linear-gradient(180deg,rgba(38,22,13,0.32),rgba(10,8,7,0.88))] shadow-[inset_0_0_80px_rgba(212,175,55,0.08)]">
            {!imageFailed && treasure.image ? (
              <img
                alt={treasure.imageTitle ?? treasure.title}
                className="h-full w-full object-cover object-center opacity-90 brightness-[0.85] contrast-[1.05] sepia-[0.2] transition-transform duration-[450ms] ease-out group-hover:scale-[1.02]"
                src={treasure.image}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.12),transparent_42%),linear-gradient(180deg,rgba(60,38,18,0.72),rgba(14,9,6,0.92))]"
              >
                <div className="text-center text-surface-parchment/70">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-gold/80">
                    Visual Arsip
                  </p>
                </div>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(25,14,8,0.08)_0%,rgba(25,14,8,0.18)_42%,rgba(17,10,6,0.74)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(18,11,7,0.9))] px-5 pb-5 pt-16">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-surface-parchment/80">
                {treasure.imageTitle ?? `Visual ${treasure.title}`}
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-surface-parchment/72">
                {treasure.imageDescription ?? 'Visual arsip yang merepresentasikan isi koleksi ini.'}
              </p>
              {treasure.imageCredit ? (
                <p className="mt-3 text-[0.7rem] leading-5 tracking-[0.08em] text-surface-parchment/52">
                  {treasure.imageCredit}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
        <article className="rounded-card border border-primary-gold/20 bg-bg-dark/62 p-6 shadow-[0_20px_64px_rgba(0,0,0,0.26)] md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">{storyLabel}</p>
          <div className="mt-5 space-y-5">
            {treasure.story.map((paragraph) => (
              <p key={paragraph} className="text-base leading-8 text-surface-parchment/82">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">
              {factsLabel}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {treasure.facts.map((fact) => (
                <div
                  key={fact}
                  className="flex items-start gap-3 rounded-2xl border border-primary-gold/16 bg-primary-gold/5 px-4 py-3 text-sm leading-6 text-surface-parchment/78"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary-gold"
                  />
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>
          {challengeState === 'reading' ? (
            <Button
              className="mt-8 rounded-full px-6"
              onClick={() => setChallengeState('challenge')}
            >
              Mulai Tantangan
            </Button>
          ) : null}
        </article>

        <aside className="rounded-card border border-primary-gold/25 bg-bg-dark/72 p-5 shadow-[0_24px_66px_rgba(0,0,0,0.3)]">
          {challengeState === 'reading' ? (
            <ChallengeIntro
              achievementProgressLabel={achievementProgressLabel}
              challengeLabel={challengeLabel}
              isCompleted={isCompleted}
              rewardLabel={rewardLabel}
              rewardXp={treasure.rewardXp}
              treasureProgressLabel={treasureProgressLabel}
            />
          ) : null}
          {challengeState === 'challenge' ? (
            <ChallengePanel
              correctOptionLabel={correctOption?.label ?? ''}
              options={treasure.quizOptions}
              question={treasure.quizQuestion}
              score={score}
              selectedOptionId={selectedOptionId}
              submittedOption={submittedOption}
              onRetry={retryChallenge}
              onSelect={setSelectedOptionId}
              onSubmit={submitAnswer}
            />
          ) : null}
          {challengeState === 'completed' ? (
            <RewardPanel
              earnedReward={earnedReward}
              achievementProgressLabel={achievementProgressLabel}
              progressCount={progressCount}
              rewardXp={treasure.rewardXp}
              treasureProgressLabel={treasureProgressLabel}
              title={treasure.achievement}
              totalProgress={treasure.totalProgress}
            />
          ) : null}
        </aside>
      </section>
    </KingdomShell>
  );
}

function ChallengeIntro({
  achievementProgressLabel,
  challengeLabel,
  isCompleted,
  rewardLabel,
  rewardXp,
  treasureProgressLabel,
}: {
  readonly achievementProgressLabel: string;
  readonly challengeLabel: string;
  readonly isCompleted: boolean;
  readonly rewardLabel: string;
  readonly rewardXp: number;
  readonly treasureProgressLabel: string;
}): JSX.Element {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-amber">
        {challengeLabel}
      </p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-primary-gold">
        Tantangan Pengetahuan
      </h2>
      <p className="mt-4 text-sm leading-7 text-text-muted">
        Selesaikan pertanyaan arsip untuk membuka badge dan memperbarui progress koleksi.
      </p>
      <div className="mt-6 rounded-2xl border border-primary-gold/20 bg-primary-gold/8 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-gold">{rewardLabel}</p>
        <p className="mt-2 text-sm text-surface-parchment/78">
          {isCompleted ? 'Arsip sudah selesai. Reward XP tidak digandakan.' : `+${rewardXp} XP`}
        </p>
        <p className="mt-1 text-sm text-surface-parchment/78">{treasureProgressLabel}</p>
        <p className="mt-1 text-sm text-surface-parchment/78">{achievementProgressLabel}</p>
      </div>
    </>
  );
}

function ChallengePanel({
  correctOptionLabel,
  onRetry,
  onSelect,
  onSubmit,
  options,
  question,
  score,
  selectedOptionId,
  submittedOption,
}: {
  readonly correctOptionLabel: string;
  readonly onRetry: () => void;
  readonly onSelect: (optionId: string) => void;
  readonly onSubmit: () => void;
  readonly options: readonly QuizOption[];
  readonly question: string;
  readonly score: number;
  readonly selectedOptionId: string | null;
  readonly submittedOption: QuizOption | null;
}): JSX.Element {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-amber">
        Tantangan Pengetahuan
      </p>
      <h2 className="mt-3 font-display text-2xl font-semibold text-primary-gold">Pertanyaan</h2>
      <p className="mt-4 text-base leading-7 text-surface-parchment/86">{question}</p>
      <div className="mt-5 space-y-3">
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isSubmittedOption = submittedOption?.id === option.id;

          return (
            <button
              key={option.id}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                isSelected
                  ? 'border-primary-gold bg-primary-gold/14 text-surface-parchment'
                  : 'border-primary-gold/18 bg-bg-dark/55 text-text-muted hover:border-primary-gold/45 hover:text-surface-parchment'
              } ${isSubmittedOption && submittedOption?.isCorrect ? 'shadow-[0_0_24px_rgba(212,175,55,0.2)]' : ''}`}
              type="button"
              onClick={() => onSelect(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {submittedOption ? (
        <div
          className={`mt-5 rounded-2xl border p-4 ${
            submittedOption.isCorrect
              ? 'border-primary-gold/35 bg-primary-gold/10 text-surface-parchment'
              : 'border-state-error/40 bg-state-error/10 text-surface-parchment'
          }`}
        >
          <div className="flex items-start gap-3">
            {submittedOption.isCorrect ? (
              <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-primary-gold" />
            ) : (
              <XCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-state-error" />
            )}
            <div>
              <p className="text-sm font-semibold">
                {submittedOption.isCorrect ? 'Benar.' : 'Belum tepat.'} Score: {score} / 1
              </p>
              {!submittedOption.isCorrect ? (
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  Jawaban yang benar adalah: {correctOptionLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row xl:flex-col">
        <Button disabled={!selectedOptionId} onClick={onSubmit}>
          Jawab
        </Button>
        {submittedOption && !submittedOption.isCorrect ? (
          <Button variant="secondary" onClick={onRetry}>
            Coba Lagi
          </Button>
        ) : null}
      </div>
    </>
  );
}

function RewardPanel({
  achievementProgressLabel,
  earnedReward,
  progressCount,
  rewardXp,
  title,
  totalProgress,
  treasureProgressLabel,
}: {
  readonly achievementProgressLabel: string;
  readonly earnedReward: boolean;
  readonly progressCount: number;
  readonly rewardXp: number;
  readonly title: string;
  readonly totalProgress: number;
  readonly treasureProgressLabel: string;
}): JSX.Element {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-primary-gold bg-primary-gold/15 text-primary-gold shadow-[0_0_36px_rgba(212,175,55,0.3)]">
        <Sparkles aria-hidden="true" className="h-9 w-9" />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-primary-amber">
        Archive Completed
      </p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-primary-gold">{title}</h2>
      <div className="mt-6 space-y-3 rounded-2xl border border-primary-gold/25 bg-primary-gold/8 p-4 text-left">
        <p className="text-sm text-surface-parchment/84">✓ {title} discovered</p>
        <p className="text-sm text-surface-parchment/84">
          {earnedReward ? `+${rewardXp} XP` : '+0 XP already claimed'}
        </p>
        <p className="text-sm text-surface-parchment/84">
          {treasureProgressLabel}: {progressCount} / {totalProgress}
        </p>
        <p className="text-sm text-surface-parchment/84">{achievementProgressLabel}</p>
      </div>
      <Button asChild className="mt-6 w-full rounded-full">
        <Link to="/treasures">Lihat Badge</Link>
      </Button>
    </div>
  );
}
