import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { CukiBoard } from '../components/CukiBoard';
import { Dice } from '../components/game/Dice';
import { KingdomShell } from '../components/layout/KingdomShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  canAppendSequentialCaptureStep,
  captureGroupFromOpportunity,
  findLegalCaptureOpportunities,
  getSequentialCaptureCoordinates,
  validateCaptureGroup,
} from '../game/rules';
import type {
  CaptureGroup,
  CaptureOpportunity,
  IntersectionBoard,
  IntersectionCoordinate,
  OncakColor,
  Pawn,
  PlayerState,
  SequentialCaptureDraft,
} from '../types/game';

type TutorialDiceValue = 1 | 2 | 3 | 4 | 5 | 6;

const tutorialCards = [
  ['1', 'Lempar dadu', 'Angka dadu menentukan jumlah Oncak berwarna sama yang harus dicari pada papan.'],
  [
    '2',
    'Pilih dari papan',
    'Pilih susunan Oncak langsung pada papan. Bidak bergerak hanya pada garis horizontal dan vertikal.',
  ],
  [
    '3',
    'Selesaikan giliran',
    'Ambil kelompok yang dipilih. Jika masih ada tangkapan wajib dengan angka sama, lanjutkan; jika tidak, lempar lagi atau giliran berganti.',
  ],
] as const;

const tutorialRunPlacements: ReadonlyArray<{
  readonly color: OncakColor;
  readonly coordinates: ReadonlyArray<IntersectionCoordinate>;
}> = [
  { color: 'BLACK', coordinates: [{ x: 0, y: 1 }] },
  {
    color: 'WHITE',
    coordinates: [
      { x: 1, y: 3 },
      { x: 2, y: 3 },
    ],
  },
  {
    color: 'BLACK',
    coordinates: [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
    ],
  },
  {
    color: 'WHITE',
    coordinates: [
      { x: 6, y: 1 },
      { x: 7, y: 1 },
      { x: 8, y: 1 },
      { x: 9, y: 1 },
    ],
  },
  {
    color: 'BLACK',
    coordinates: [
      { x: 4, y: 8 },
      { x: 5, y: 8 },
      { x: 6, y: 8 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
    ],
  },
  {
    color: 'WHITE',
    coordinates: [
      { x: 1, y: 10 },
      { x: 2, y: 10 },
      { x: 3, y: 10 },
      { x: 4, y: 10 },
      { x: 5, y: 10 },
      { x: 6, y: 10 },
    ],
  },
];

const tutorialDiceToTargetRow: Record<TutorialDiceValue, number> = {
  1: 1,
  2: 3,
  3: 5,
  4: 1,
  5: 8,
  6: 10,
};

export function TutorialPage(): JSX.Element {
  const [tutorialDiceValue, setTutorialDiceValue] = useState<TutorialDiceValue | null>(null);
  const [isTutorialRolling, setIsTutorialRolling] = useState(false);
  const [hasCompletedStepOne, setHasCompletedStepOne] = useState(false);
  const [selectedTutorialCaptureGroup, setSelectedTutorialCaptureGroup] = useState<CaptureGroup | null>(null);
  const [tutorialCaptureDraft, setTutorialCaptureDraft] = useState<SequentialCaptureDraft | null>(null);
  const [selectedTutorialCoordinates, setSelectedTutorialCoordinates] = useState<ReadonlyArray<IntersectionCoordinate>>([]);
  const [tutorialStepTwoFeedback, setTutorialStepTwoFeedback] = useState<{
    readonly kind: 'idle' | 'success' | 'error';
    readonly message: string;
  }>({ kind: 'idle', message: '' });
  const [hasCompletedStepTwo, setHasCompletedStepTwo] = useState(false);
  const [isTutorialTaking, setIsTutorialTaking] = useState(false);
  const [tutorialOncakTakenCount, setTutorialOncakTakenCount] = useState(0);
  const [hasCompletedStepThree, setHasCompletedStepThree] = useState(false);
  const rollTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const takeTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const tutorialBoard = buildTutorialBoard();
  const tutorialPawn: Pawn = {
    id: 'tutorial-pawn',
    playerId: 'tutorial-player',
    state: { status: 'OFF_BOARD', position: null },
  };
  const tutorialPlayer: PlayerState = {
    id: 'tutorial-player',
    name: 'Pemandu Tutorial',
    controllerType: 'HUMAN',
    score: 0,
    pawn: tutorialPawn,
  };
  const tutorialOpportunities = tutorialDiceValue
    ? findLegalCaptureOpportunities(tutorialBoard, tutorialPawn, tutorialDiceValue)
    : [];
  const tutorialBoardPreview = buildTutorialBoardPreview(tutorialBoard, selectedTutorialCoordinates, tutorialOncakTakenCount);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current !== null) {
        window.clearTimeout(rollTimerRef.current);
      }
      if (takeTimerRef.current !== null) {
        window.clearTimeout(takeTimerRef.current);
      }
    };
  }, []);

  const resetTutorialProgress = (): void => {
    if (rollTimerRef.current !== null) {
      window.clearTimeout(rollTimerRef.current);
      rollTimerRef.current = null;
    }
    if (takeTimerRef.current !== null) {
      window.clearTimeout(takeTimerRef.current);
      takeTimerRef.current = null;
    }

    setTutorialDiceValue(null);
    setIsTutorialRolling(false);
    setHasCompletedStepOne(false);
    setSelectedTutorialCaptureGroup(null);
    setTutorialCaptureDraft(null);
    setSelectedTutorialCoordinates([]);
    setTutorialStepTwoFeedback({ kind: 'idle', message: '' });
    setHasCompletedStepTwo(false);
    setIsTutorialTaking(false);
    setTutorialOncakTakenCount(0);
    setHasCompletedStepThree(false);
  };

  const handleRollTutorialDice = (): void => {
    if (isTutorialRolling) return;

    setIsTutorialRolling(true);
    setHasCompletedStepOne(false);
    setHasCompletedStepTwo(false);
    setHasCompletedStepThree(false);
    setSelectedTutorialCaptureGroup(null);
    setTutorialCaptureDraft(null);
    setSelectedTutorialCoordinates([]);
    setTutorialStepTwoFeedback({ kind: 'idle', message: '' });
    setTutorialOncakTakenCount(0);
    setIsTutorialTaking(false);

    rollTimerRef.current = window.setTimeout(() => {
      const value = (Math.floor(Math.random() * 6) + 1) as TutorialDiceValue;
      setTutorialDiceValue(value);
      setIsTutorialRolling(false);
      setHasCompletedStepOne(true);
      setSelectedTutorialCaptureGroup(null);
      setTutorialCaptureDraft(null);
      setSelectedTutorialCoordinates([]);
      setTutorialStepTwoFeedback({ kind: 'idle', message: '' });
      setHasCompletedStepThree(false);
      setTutorialOncakTakenCount(0);
      rollTimerRef.current = null;
    }, 780);
  };

  const handleSelectTutorialIntersection = (coordinate: IntersectionCoordinate): void => {
    if (!hasCompletedStepOne || isTutorialRolling || tutorialDiceValue === null || hasCompletedStepTwo || isTutorialTaking) {
      return;
    }

    const opportunity = tutorialOpportunities.find((candidate) =>
      candidate.candidateOncakCoordinates.some((candidateCoordinate) => sameCoordinate(candidateCoordinate, coordinate)),
    );
    if (!opportunity) {
      setSelectedTutorialCaptureGroup(null);
      setTutorialCaptureDraft(null);
      setSelectedTutorialCoordinates([coordinate]);
      setTutorialStepTwoFeedback({
        kind: 'error',
        message: `Cari susunan ${tutorialDiceValue} Oncak berwarna sama yang sesuai dengan aturan papan.`,
      });
      return;
    }

    const selectedGroup = captureGroupFromOpportunity(opportunity);
    if (!selectedGroup) {
      return;
    }

    const currentDraft: SequentialCaptureDraft | null =
      tutorialCaptureDraft?.opportunityId === opportunity.id
        ? tutorialCaptureDraft
        : {
            opportunityId: opportunity.id,
            requiredDiceValue: tutorialDiceValue,
            selectedOncakCoordinates: [],
          };

    if (!canAppendSequentialCaptureStep(opportunity, currentDraft, coordinate)) {
      setSelectedTutorialCaptureGroup(null);
      setTutorialCaptureDraft(currentDraft);
      setSelectedTutorialCoordinates(currentDraft.selectedOncakCoordinates);
      setTutorialStepTwoFeedback({
        kind: 'error',
        message: `Cari susunan ${tutorialDiceValue} Oncak berwarna sama yang sesuai dengan aturan papan.`,
      });
      return;
    }

    const nextCoordinates = [...currentDraft.selectedOncakCoordinates, coordinate];
    const nextDraft: SequentialCaptureDraft = {
      opportunityId: opportunity.id,
      requiredDiceValue: tutorialDiceValue,
      selectedOncakCoordinates: nextCoordinates,
    };
    setTutorialCaptureDraft(nextDraft);
    setSelectedTutorialCoordinates(nextCoordinates);

    const orderedCoordinates = getSequentialCaptureCoordinates(opportunity);
    if (nextCoordinates.length < orderedCoordinates.length) {
      setTutorialStepTwoFeedback({
        kind: 'idle',
        message: `Lanjutkan urutan makan. Sudah ${nextCoordinates.length} dari ${tutorialDiceValue} Oncak.`,
      });
      return;
    }

    const validation = validateCaptureGroup(tutorialBoardPreview, tutorialPawn, tutorialDiceValue, selectedGroup, tutorialOpportunities);
    if (!validation.group) {
      setTutorialStepTwoFeedback({
        kind: 'error',
        message: `Cari susunan ${tutorialDiceValue} Oncak berwarna sama yang sesuai dengan aturan papan.`,
      });
      return;
    }

    setSelectedTutorialCaptureGroup(validation.group);
    setTutorialStepTwoFeedback({
      kind: 'success',
      message: `Kamu menemukan ${validation.group.oncakCoordinates.length} Oncak berwarna sama yang dapat diambil.`,
    });
    startTutorialCaptureAnimation(validation.group.oncakCoordinates);
  };

  const startTutorialCaptureAnimation = (coordinates: ReadonlyArray<IntersectionCoordinate>): void => {
    setIsTutorialTaking(true);
    setTutorialOncakTakenCount(0);

    const steps = coordinates.length;
    const stepDuration = Math.max(140, Math.floor(700 / steps));
    let taken = 0;

    takeTimerRef.current = window.setInterval(() => {
      taken += 1;
      setTutorialOncakTakenCount(taken);

      if (taken >= steps) {
        if (takeTimerRef.current !== null) {
          window.clearInterval(takeTimerRef.current);
          takeTimerRef.current = null;
        }

        window.setTimeout(() => {
          setIsTutorialTaking(false);
          setHasCompletedStepTwo(true);
          setHasCompletedStepThree(true);
        }, 180);
      }
    }, stepDuration);
  };

  const handleTakeTutorialOncak = (): void => {
    if (!hasCompletedStepTwo || tutorialDiceValue === null || selectedTutorialCaptureGroup === null || isTutorialTaking) {
      return;
    }

    startTutorialCaptureAnimation(selectedTutorialCaptureGroup.oncakCoordinates);
  };

  return (
    <KingdomShell eyebrow="Balai Pembelajaran" title="Tutorial CUKI">
      <p className="max-w-2xl text-base leading-7 text-text-muted">
        Pelajari ritme dasar permainan sebelum memasuki papan. Semua keputusan sah tetap ditentukan
        oleh aturan CUKI di dalam permainan.
      </p>
      <div className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary-gold/75">
        Progres Tutorial: {hasCompletedStepThree ? '3/3' : hasCompletedStepTwo ? '2/3' : hasCompletedStepOne ? '1/3' : '0/3'}
      </div>
      <ol className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="border border-primary-gold/25" variant="mahogany">
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-gold font-bold text-text-dark">
                1
              </span>
              {hasCompletedStepOne ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-gold/40 bg-primary-gold/10 px-3 py-1 text-xs font-semibold text-primary-gold">
                  <span aria-hidden="true">✓</span>
                  Langkah 1 dipahami
                </span>
              ) : null}
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold text-primary-gold">Lempar dadu</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Angka dadu menentukan jumlah Oncak berwarna sama yang harus dicari pada papan.
            </p>

            <div className="mt-4 grid gap-4 rounded-2xl border border-primary-gold/15 bg-bg-dark-slate/20 p-4">
              <div className="flex items-center gap-4">
                <Dice
                  disabled={isTutorialRolling}
                  isRolling={isTutorialRolling}
                  value={tutorialDiceValue as 1 | 2 | 3 | 4 | 5 | 6 | null}
                  onRoll={handleRollTutorialDice}
                />
                <div className="min-w-0 flex-1">
                  {!isTutorialRolling && tutorialDiceValue === null ? (
                    <p className="text-sm leading-6 text-text-muted">
                      Tekan tombol di bawah untuk mencoba lemparan pertama.
                    </p>
                  ) : null}
                  {isTutorialRolling ? (
                    <p className="text-sm font-medium text-primary-gold">Dadu sedang dilempar...</p>
                  ) : null}
                  {tutorialDiceValue !== null ? (
                    <div className="mt-2 rounded-xl border border-primary-gold/25 bg-primary-gold/10 px-3 py-2">
                      <p className="text-base font-semibold text-primary-gold">
                        Hasil dadu: <span className="text-lg">{tutorialDiceValue}</span>
                      </p>
                      <p className="mt-1 text-sm leading-6 text-text-light">
                        Cari kelompok {tutorialDiceValue} Oncak berwarna sama pada papan.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button aria-busy={isTutorialRolling} disabled={isTutorialRolling} onClick={handleRollTutorialDice}>
                  {tutorialDiceValue === null ? 'Coba Lempar Dadu' : 'Lempar Lagi'}
                </Button>
                {hasCompletedStepOne ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-gold/80">
                    Checkpoint tercapai
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <Card
          className={`border border-primary-gold/25 transition duration-200 ${hasCompletedStepOne ? '' : 'opacity-80'}`}
          variant="mahogany"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-gold font-bold text-sm text-text-dark">
                2
              </span>
              {hasCompletedStepTwo ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-gold/40 bg-primary-gold/10 px-3 py-1 text-xs font-semibold text-primary-gold">
                  <span aria-hidden="true">✓</span>
                  Langkah 2 dipahami
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 font-display text-[1.75rem] font-semibold leading-tight text-primary-gold">
              Pilih dari papan
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              {tutorialDiceValue === null
                ? 'Selesaikan langkah 1 terlebih dahulu.'
                : `Temukan susunan ${tutorialDiceValue} Oncak berwarna sama pada papan.`}
            </p>

            <div className={`mt-3 rounded-2xl border border-primary-gold/15 bg-bg-dark-slate/20 p-2.5 ${hasCompletedStepOne ? '' : 'pointer-events-none'}`}>
              <div className="mx-auto w-full max-w-[460px]">
                <CukiBoard
                  activePlayerId={tutorialPlayer.id}
                  board={tutorialBoardPreview}
                  capturePreviewCoordinates={selectedTutorialCoordinates}
                  movementEnabled={false}
                  opportunities={tutorialOpportunities}
                  players={[tutorialPlayer]}
                  selectedOncakCoordinate={selectedTutorialCoordinates[selectedTutorialCoordinates.length - 1] ?? null}
                  selectedOpportunityId={selectedTutorialCaptureGroup?.opportunityId ?? null}
                  selectionEnabled={hasCompletedStepOne && !isTutorialRolling && !hasCompletedStepTwo && !isTutorialTaking}
                  pawnInteractionEnabled={false}
                  sizeVariant="compact"
                  onMovePawn={() => undefined}
                  onSelectOpportunity={() => undefined}
                  onSelectOncak={(_, coordinate) => handleSelectTutorialIntersection(coordinate)}
                />
              </div>

              <div className="mt-3 rounded-xl border border-primary-gold/20 bg-bg-mahogany/40 px-3 py-2 text-sm leading-6 text-text-light">
                {hasCompletedStepOne ? (
                  tutorialStepTwoFeedback.kind === 'success' ? (
                    <>
                      <p className="font-semibold text-primary-gold">Pilihan benar.</p>
                      <p className="mt-1">{tutorialStepTwoFeedback.message}</p>
                    </>
                  ) : tutorialStepTwoFeedback.kind === 'error' ? (
                    <>
                      <p className="font-semibold text-[#e7b38d]">Belum tepat.</p>
                      <p className="mt-1">{tutorialStepTwoFeedback.message}</p>
                    </>
                  ) : (
                    <p className="text-text-muted">
                      Temukan susunan {tutorialDiceValue ?? '-'} Oncak berwarna sama pada papan.
                    </p>
                  )
                ) : (
                  <p className="text-text-muted">Selesaikan langkah 1 terlebih dahulu.</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card
          className={`border border-primary-gold/25 transition duration-200 ${hasCompletedStepTwo ? '' : 'opacity-80'}`}
          variant="mahogany"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-gold font-bold text-sm text-text-dark">
                3
              </span>
              {hasCompletedStepThree ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-gold/40 bg-primary-gold/10 px-3 py-1 text-xs font-semibold text-primary-gold">
                  <span aria-hidden="true">✓</span>
                  Langkah 3 dipahami
                </span>
              ) : null}
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold text-primary-gold">Selesaikan giliran</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              {hasCompletedStepTwo
                ? 'Kelompok Oncak sudah dipilih. Ambil Oncak untuk menyelesaikan giliran.'
                : 'Selesaikan langkah 2 terlebih dahulu.'}
            </p>

            <div className={`mt-4 rounded-2xl border border-primary-gold/15 bg-bg-dark-slate/20 p-4 ${hasCompletedStepTwo ? '' : 'pointer-events-none'}`}>
              <div className="rounded-xl border border-primary-gold/20 bg-bg-mahogany/40 px-3 py-2">
                <p className="text-sm leading-6 text-text-muted">
                  {tutorialDiceValue === null
                    ? 'Oncak yang akan diambil: -'
                    : `Oncak yang akan diambil: ${tutorialDiceValue}`}
                </p>
                <p className="mt-1 text-sm leading-6 text-text-light">
                  Oncak diambil: {tutorialOncakTakenCount}
                </p>
              </div>

              <div className="mt-4 flex justify-center">
                <div
                  className={`flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-4 py-4 transition duration-300 ${
                    hasCompletedStepThree
                      ? 'border-primary-gold/50 bg-primary-gold/10'
                      : 'border-primary-gold/20 bg-surface-parchment/10'
                  }`}
                >
                  {selectedTutorialCaptureGroup === null ? (
                    <span className="text-sm text-text-muted">
                      Pilih susunan yang benar di langkah 2 untuk melihat target pengambilan.
                    </span>
                  ) : (
                    selectedTutorialCaptureGroup.oncakCoordinates.map((coordinate, index) => {
                      const isTaken = index < tutorialOncakTakenCount;
                      const cell = getBoardCellLabel(coordinate);
                      return (
                        <span
                          key={`${cell}-${index}`}
                          className={`grid h-8 w-8 place-items-center rounded-full border text-[10px] font-bold transition duration-200 ${
                            isTaken
                              ? 'scale-75 border-transparent opacity-0'
                              : selectedTutorialCaptureGroup.oncakColor === 'BLACK'
                                ? 'border-black/70 bg-black text-white'
                                : 'border-[#e0d9ca] bg-white text-text-dark'
                          } ${hasCompletedStepThree ? 'ring-2 ring-primary-gold/75' : ''}`}
                        >
                          {index + 1}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  aria-busy={isTutorialTaking}
                  disabled={!hasCompletedStepTwo || isTutorialTaking || selectedTutorialCaptureGroup === null || hasCompletedStepThree}
                  onClick={handleTakeTutorialOncak}
                >
                  {hasCompletedStepThree ? 'Oncak Sudah Diambil' : 'Ambil Oncak'}
                </Button>
                {hasCompletedStepThree ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-gold/80">
                    Checkpoint tercapai
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">
                    {hasCompletedStepTwo ? 'Siap mengambil kelompok yang dipilih.' : 'Selesaikan langkah 2 terlebih dahulu.'}
                  </span>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-primary-gold/20 bg-bg-mahogany/40 px-3 py-2 text-sm leading-6 text-text-light">
                {hasCompletedStepThree ? (
                  <>
                    <p className="font-semibold text-primary-gold">
                      {tutorialDiceValue} Oncak berhasil diambil.
                    </p>
                    <p className="mt-1">Giliran selesai.</p>
                  </>
                ) : hasCompletedStepTwo ? (
                  <p className="text-text-muted">
                    Tekan Ambil Oncak untuk menyelesaikan simulasi satu giliran tutorial.
                  </p>
                ) : (
                  <p className="text-text-muted">Selesaikan langkah 2 terlebih dahulu.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </ol>

      <Card className="mt-6 border border-primary-gold/30" variant="parchment">
        {hasCompletedStepOne && hasCompletedStepTwo && hasCompletedStepThree ? (
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-2xl font-semibold">Latihan selesai</h2>
            <p className="text-sm leading-6 text-text-muted">
              Kamu telah memahami alur dasar permainan CUKI. Saatnya mencoba permainan sebenarnya.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link className="inline-flex" to="/setup">
                <Button>Mulai Permainan</Button>
              </Link>
              <Button variant="secondary" onClick={resetTutorialProgress}>
                Ulangi Latihan
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-semibold">Siap memasuki papan?</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Mulai pertandingan lokal dan gunakan dadu serta papan sebagai pusat setiap aksi.
            </p>
            <Link className="mt-5 inline-flex" to="/setup">
              <Button>Mulai permainan</Button>
            </Link>
          </>
        )}
      </Card>
    </KingdomShell>
  );
}

function startTutorialCaptureAnimation(
  coordinates: ReadonlyArray<IntersectionCoordinate>,
  setIsTutorialTaking: (value: boolean) => void,
  setTutorialOncakTakenCount: (value: number) => void,
  setHasCompletedStepTwo: (value: boolean) => void,
  setHasCompletedStepThree: (value: boolean) => void,
  takeTimerRef: { current: ReturnType<typeof window.setTimeout> | null },
): void {
  setIsTutorialTaking(true);
  setTutorialOncakTakenCount(0);

  const steps = coordinates.length;
  const stepDuration = Math.max(140, Math.floor(700 / steps));
  let taken = 0;

  takeTimerRef.current = window.setInterval(() => {
    taken += 1;
    setTutorialOncakTakenCount(taken);

    if (taken >= steps) {
      if (takeTimerRef.current !== null) {
        window.clearInterval(takeTimerRef.current);
        takeTimerRef.current = null;
      }

      window.setTimeout(() => {
        setIsTutorialTaking(false);
        setHasCompletedStepTwo(true);
        setHasCompletedStepThree(true);
      }, 180);
    }
  }, stepDuration);
}

function buildTutorialBoard(): IntersectionBoard {
  const occupied = new Map<string, OncakColor>();
  for (const placement of tutorialRunPlacements) {
    for (const coordinate of placement.coordinates) {
      occupied.set(`${coordinate.x}-${coordinate.y}`, placement.color);
    }
  }

  return Array.from({ length: 11 }, (_, y) =>
    Array.from({ length: 11 }, (_, x) => {
      const coordinate = { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
      if (x === 5 && y === 5) {
        return { coordinate, kind: 'CENTRAL_LOGO' as const, oncak: null, pawnOccupantId: null };
      }

      const color = occupied.get(`${x}-${y}`);
      if (color) {
        return {
          coordinate,
          kind: 'ONCAK' as const,
          oncak: {
            id: `tutorial-oncak-${x}-${y}`,
            color,
            state: 'PRESENT' as const,
            position: coordinate,
          },
          pawnOccupantId: null,
        };
      }

      return { coordinate, kind: 'EMPTY' as const, oncak: null, pawnOccupantId: null };
    }),
  );
}

function buildTutorialBoardPreview(
  board: IntersectionBoard,
  selectedCoordinates: ReadonlyArray<IntersectionCoordinate>,
  takenCount: number,
): IntersectionBoard {
  if (selectedCoordinates.length === 0 || takenCount <= 0) {
    return board;
  }

  const takenKeys = new Set(
    selectedCoordinates.slice(0, takenCount).map((coordinate) => `${coordinate.x}-${coordinate.y}`),
  );
  return board.map((row) =>
    row.map((intersection) => {
      const key = `${intersection.coordinate.x}-${intersection.coordinate.y}`;
      if (!takenKeys.has(key) || intersection.kind !== 'ONCAK') {
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

function sameCoordinate(first: IntersectionCoordinate, second: IntersectionCoordinate): boolean {
  return first.x === second.x && first.y === second.y;
}

function getBoardCellLabel(coordinate: IntersectionCoordinate): string {
  return `${String.fromCharCode(65 + coordinate.y)}${coordinate.x + 1}`;
}
