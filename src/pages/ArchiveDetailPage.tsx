import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, XCircle } from 'lucide-react';

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
  const isCukiArchive = treasure.id === 'legacy' && Boolean(treasure.cukiSlides?.length);

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

          {isCukiArchive ? (
            <CukiArchiveCarousel slides={treasure.cukiSlides ?? []} />
          ) : (
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
          )}
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

function CukiArchiveCarousel({
  slides,
}: {
  readonly slides: readonly {
    readonly id: string;
    readonly label: string;
    readonly title: string;
    readonly description: string;
    readonly image: string;
    readonly fit: 'cover' | 'contain';
  }[];
}): JSX.Element {
  const slideCount = slides.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const activeSlide = slides[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [slides]);

  useEffect(() => {
    if (slideCount <= 1 || isPaused) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      setDirection(1);
      setIsAnimating(true);
      setActiveIndex((current) => (current + 1) % slideCount);
    }, 7000);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isPaused, slideCount]);

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    const animationTimeout = window.setTimeout(() => {
      setIsAnimating(false);
    }, 520);

    return () => window.clearTimeout(animationTimeout);
  }, [activeIndex, isAnimating]);

  const goToSlide = (nextIndex: number, nextDirection: 1 | -1): void => {
    if (slideCount === 0) {
      return;
    }

    setDirection(nextDirection);
    setIsAnimating(true);
    setActiveIndex((nextIndex + slideCount) % slideCount);
  };

  const goPrevious = (): void => goToSlide(activeIndex - 1, -1);
  const goNext = (): void => goToSlide(activeIndex + 1, 1);

  const handleTouchEnd = (touchEndX: number): void => {
    if (touchStartX === null) {
      return;
    }

    const delta = touchEndX - touchStartX;
    if (Math.abs(delta) > 40) {
      if (delta > 0) {
        goPrevious();
      } else {
        goNext();
      }
    }

    setTouchStartX(null);
  };

  if (slideCount === 0) {
    return <div />;
  }

  return (
    <section
      aria-label="Jejak CUKI"
      className="group relative overflow-hidden rounded-card border border-primary-gold/25 bg-[linear-gradient(180deg,rgba(44,24,13,0.92),rgba(12,8,6,0.98))] shadow-[inset_0_0_90px_rgba(212,175,55,0.08)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={(event) => {
        setIsPaused(true);
        setTouchStartX(event.touches[0]?.clientX ?? null);
      }}
      onTouchEnd={(event) => {
        handleTouchEnd(event.changedTouches[0]?.clientX ?? 0);
        setIsPaused(false);
      }}
    >
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#D4AF37_1px,transparent_1px),linear-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="relative p-5 md:p-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-primary-amber">JEJAK CUKI</p>
          <p className="mt-3 text-sm leading-7 text-surface-parchment/74 md:text-base">
            Dari dokumentasi sejarah, pelestari, hingga dimainkan kembali.
          </p>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-[1.6rem] border border-primary-gold/20 bg-[linear-gradient(180deg,rgba(26,17,10,0.8),rgba(10,8,7,0.98))]">
          <div className="relative aspect-[4/3] min-h-[320px] w-full sm:aspect-[16/10] lg:aspect-[21/10]">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;
              const enteringFromRight = direction === 1;
              const translateClass = isActive
                ? 'translate-x-0 opacity-100'
                : enteringFromRight
                  ? '-translate-x-3 opacity-0'
                  : 'translate-x-3 opacity-0';

              return (
                <img
                  key={slide.id}
                  alt={slide.title}
                  className={`absolute inset-0 h-full w-full transition-all duration-[520ms] ease-out ${translateClass} ${
                    slide.fit === 'contain' ? 'object-contain bg-[#100b08]' : 'object-cover'
                  }`}
                  src={slide.image}
                />
              );
            })}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,6,0.08)_0%,rgba(18,10,6,0.2)_42%,rgba(12,8,6,0.7)_100%)]" />
            <button
              aria-label="Sebelumnya"
              className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-primary-gold/30 bg-bg-dark/72 text-primary-gold shadow-[0_10px_28px_rgba(0,0,0,0.32)] transition hover:border-primary-gold hover:bg-bg-mahogany/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-amber"
              type="button"
              onClick={goPrevious}
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              aria-label="Berikutnya"
              className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-primary-gold/30 bg-bg-dark/72 text-primary-gold shadow-[0_10px_28px_rgba(0,0,0,0.32)] transition hover:border-primary-gold hover:bg-bg-mahogany/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-amber"
              type="button"
              onClick={goNext}
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <div className="relative border-t border-primary-gold/15 bg-[linear-gradient(180deg,rgba(26,16,10,0.85),rgba(18,11,7,0.96))] px-5 py-4 md:px-6 md:py-5">
            <div
              className={`transition-all duration-[520ms] ease-out ${
                isAnimating ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
              }`}
            >
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-primary-amber">
                {activeSlide?.label}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-surface-parchment md:text-[2rem]">
                {activeSlide?.title}
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-surface-parchment/76 md:text-[1.02rem] md:leading-7">
                {activeSlide?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2.5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              aria-label={`Buka slide ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'w-8 bg-primary-gold shadow-[0_0_16px_rgba(212,175,55,0.45)]'
                  : 'w-2.5 bg-surface-parchment/28 hover:bg-surface-parchment/45'
              }`}
              type="button"
              onClick={() => goToSlide(index, index > activeIndex ? 1 : -1)}
            />
          ))}
        </div>
      </div>
    </section>
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
