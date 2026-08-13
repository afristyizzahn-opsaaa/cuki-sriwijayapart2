import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { canAppendSequentialCaptureStep, rollDice } from '../game/rules';
import { chooseAICapture, chooseAIMoveCoordinate } from '../game/ai';
import { useGameStore } from '../stores/useGameStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useScratchCardStore } from '../store/useScratchCardStore';
import type { CaptureGroup, IntersectionCoordinate, SequentialCaptureDraft } from '../types/game';
import { Dice3D } from './Dice3D';
import { PageContainer } from './layout/PageContainer';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { CukiBoard } from './CukiBoard';

/**
 * Live arena orchestration. It contains no game rules: rolls and direct board selections are
 * dispatched to the store, whose pure engine validates and resolves every capture atomically.
 */
export function CukiArena(): JSX.Element {
  const gameState = useGameStore((state) => state.gameState);
  const activePlayer = useGameStore((state) => state.activePlayer);
  const diceValue = useGameStore((state) => state.diceValue);
  const opportunities = useGameStore((state) => state.legalCaptureOpportunities);
  const selectedRoute = useGameStore((state) => state.selectedRoute);
  const result = useGameStore((state) => state.result);
  const turnPassNotice = useGameStore((state) => state.turnPassNotice);
  const resolveDice = useGameStore((state) => state.resolveDice);
  const selectCaptureOpportunity = useGameStore((state) => state.selectCaptureOpportunity);
  const executeCapture = useGameStore((state) => state.executeCapture);
  const movePawnToIntersection = useGameStore((state) => state.movePawnToIntersection);
  const endTurn = useGameStore((state) => state.endTurn);
  const endAITurnAfterCapture = useGameStore((state) => state.endAITurnAfterCapture);
  const resetMatch = useGameStore((state) => state.resetMatch);
  const dismissTurnPassNotice = useGameStore((state) => state.dismissTurnPassNotice);
  const activeAccount = useAccountStore((state) => state.activeAccount);
  const awardMatchProgress = useAccountStore((state) => state.awardMatchProgress);
  const recordMatchCompletion = useScratchCardStore((state) => state.recordMatchCompletion);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [captureDraft, setCaptureDraft] = useState<SequentialCaptureDraft | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [toastMessages, setToastMessages] = useState<ReadonlyArray<{ readonly id: number; readonly text: string }>>([]);
  const diceTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const toastIdRef = useRef(0);
  const lastAnnouncedPhaseRef = useRef<string | null>(null);
  const lastAnnouncedPlayerIdRef = useRef<string | null>(null);
  const hasAwardedMatchRef = useRef(false);
  const navigate = useNavigate();

  const pushToast = useCallback((text: string): void => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToastMessages((current) => [...current, { id, text }]);
    window.setTimeout(() => {
      setToastMessages((current) => current.filter((toast) => toast.id !== id));
    }, 2200);
  }, []);

  const rollCurrentDice = useCallback((): void => {
    if (!gameState || isDiceRolling) return;
    if (
      gameState.turn.phase !== 'WAITING_FOR_DICE_ROLL' &&
      gameState.turn.phase !== 'REROLL_REQUIRED'
    ) {
      return;
    }
    const value = rollDice(Math.random());
    setIsDiceRolling(true);
    pushToast(`${activePlayer?.name ?? 'Pemain'} melempar dadu...`);
    diceTimerRef.current = window.setTimeout(() => {
      resolveDice(value);
      setIsDiceRolling(false);
      diceTimerRef.current = null;
      pushToast(`Dadu menunjukkan ${value}.`);
    }, 900);
  }, [activePlayer?.name, gameState, isDiceRolling, pushToast, resolveDice]);

  const commitCaptureGroupObject = useCallback(
    (group: CaptureGroup): void => {
      if (!gameState || isDiceRolling || gameState.turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION') {
        return;
      }
      selectCaptureOpportunity(group.opportunityId);
      executeCapture();
      endAITurnAfterCapture();
      pushToast('AI menyelesaikan capture.');
    },
    [endAITurnAfterCapture, executeCapture, gameState, isDiceRolling, pushToast, selectCaptureOpportunity],
  );

  const stageCapturePiece = useCallback(
    (opportunityId: string, coordinate: IntersectionCoordinate): void => {
      if (
        !gameState ||
        isDiceRolling ||
        gameState.turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION' ||
        gameState.turn.currentDiceValue === null
      ) {
        return;
      }
      const opportunity = opportunities.find((candidate) => candidate.id === opportunityId);
      if (!opportunity) return;

      const currentCoordinates =
        captureDraft?.opportunityId === opportunityId ? captureDraft.selectedOncakCoordinates : [];
      if (!canAppendSequentialCaptureStep(opportunity, captureDraft, coordinate)) {
        pushToast('Pilihan buah tidak sesuai aturan. Ikuti urutan yang valid.');
        return;
      }

      const nextCoordinates = [...currentCoordinates, coordinate];
      setCaptureDraft({
        opportunityId,
        requiredDiceValue: gameState.turn.currentDiceValue,
        selectedOncakCoordinates: nextCoordinates,
      });
      if (nextCoordinates.length < gameState.turn.currentDiceValue) {
        pushToast(
          `Buah ke-${nextCoordinates.length} dipilih. Lanjut pilih ${gameState.turn.currentDiceValue - nextCoordinates.length} buah lagi.`,
        );
      } else {
        pushToast(`Buah ke-${nextCoordinates.length} dipilih. Semua sudah pas, tekan Ambil.`);
      }
    },
    [captureDraft, gameState, isDiceRolling, opportunities, pushToast],
  );

  const commitStagedCapture = useCallback((): void => {
      if (
        !gameState ||
        isDiceRolling ||
        gameState.turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION' ||
        gameState.turn.currentDiceValue === null ||
        captureDraft === null ||
        captureDraft.selectedOncakCoordinates.length !== gameState.turn.currentDiceValue
      ) {
        if (gameState?.turn.phase === 'WAITING_FOR_CAPTURE_SELECTION' && captureDraft !== null) {
          pushToast(
            `Jumlah buah belum sesuai. Harus ${gameState.turn.currentDiceValue ?? 0}, sekarang ${captureDraft.selectedOncakCoordinates.length}.`,
          );
        }
        return;
      }
    selectCaptureOpportunity(captureDraft.opportunityId);
    executeCapture();
    setCaptureDraft(null);
    pushToast('Semua buah sudah terambil dan pawn berpindah ke posisi akhir.');
  }, [captureDraft, executeCapture, gameState, isDiceRolling, pushToast, selectCaptureOpportunity]);

  useEffect(
    () => () => {
      if (diceTimerRef.current !== null) window.clearTimeout(diceTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!gameState || !activePlayer || activePlayer.controllerType !== 'AI') return undefined;
    if (
      gameState.turn.phase === 'WAITING_FOR_DICE_ROLL' ||
      gameState.turn.phase === 'REROLL_REQUIRED'
    ) {
      pushToast(`${activePlayer.name} (AI) sedang berpikir...`);
      const timer = window.setTimeout(rollCurrentDice, 350);
      return () => window.clearTimeout(timer);
    }
    if (gameState.turn.phase === 'WAITING_FOR_PAWN_MOVE') {
      const timer = window.setTimeout(() => {
        const dice = gameState.turn.currentDiceValue;
        const coordinate = dice === null ? null : chooseAIMoveCoordinate(gameState, dice);
        if (coordinate) movePawnToIntersection(coordinate);
      }, 350);
      return () => window.clearTimeout(timer);
    }
    if (gameState.turn.phase === 'WAITING_FOR_CAPTURE_SELECTION') {
      const group = chooseAICapture(gameState);
      if (!group) return undefined;
      pushToast(`${activePlayer.name} (AI) memilih langkah.`);
      const timer = window.setTimeout(() => commitCaptureGroupObject(group), 350);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [
    activePlayer,
    commitCaptureGroupObject,
    gameState,
    movePawnToIntersection,
    pushToast,
    rollCurrentDice,
  ]);

  useEffect(() => {
    if (gameState?.turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION') setCaptureDraft(null);
  }, [gameState?.turn.phase]);

  useEffect(() => {
    if (turnPassNotice === null) return undefined;
    pushToast(`Giliran ${turnPassNotice.playerName} berakhir.`);
    const timer = window.setTimeout(dismissTurnPassNotice, 1000);
    return () => window.clearTimeout(timer);
  }, [dismissTurnPassNotice, pushToast, turnPassNotice]);

  useEffect(() => {
    if (!gameState || !activePlayer) return;
    if (gameState.matchStatus !== 'ACTIVE') return;
    const phaseKey = `${activePlayer.id}:${gameState.turn.phase}:${gameState.turn.currentDiceValue ?? 'n'}`;
    if (phaseKey === lastAnnouncedPhaseRef.current) return;
    lastAnnouncedPhaseRef.current = phaseKey;

    if (activePlayer.id !== lastAnnouncedPlayerIdRef.current) {
      lastAnnouncedPlayerIdRef.current = activePlayer.id;
      if (activePlayer.controllerType === 'AI') {
        pushToast(`${activePlayer.name} sedang bermain otomatis.`);
        return;
      }
      pushToast(`Giliran ${activePlayer.name}.`);
    }

    if (activePlayer.controllerType === 'AI') {
      pushToast(`${activePlayer.name} sedang bermain otomatis.`);
      return;
    }
    if (gameState.turn.phase === 'WAITING_FOR_DICE_ROLL') {
      pushToast(`Silakan lempar dadu.`);
    } else if (gameState.turn.phase === 'WAITING_FOR_CAPTURE_SELECTION') {
      pushToast(`Pilih Oncak sesuai nilai ${gameState.turn.currentDiceValue}.`);
    } else if (gameState.turn.phase === 'REROLL_REQUIRED') {
      pushToast(`Tidak ada Oncak yang bisa diambil. Silakan roll dice lagi.`);
    }
  }, [activePlayer, gameState, pushToast]);

  useEffect(() => {
    if (!gameState || gameState.matchStatus !== 'MATCH_FINISHED' || result === null || hasAwardedMatchRef.current) {
      return;
    }

    hasAwardedMatchRef.current = true;
    awardMatchProgress(gameState, result);
    recordMatchCompletion({
      didWin: result.kind === 'WINNER' && result.winnerId === activeAccount?.id,
    });
  }, [activeAccount?.id, awardMatchProgress, gameState, recordMatchCompletion, result]);

  useEffect(() => {
    if (gameState?.matchStatus !== 'MATCH_FINISHED') {
      hasAwardedMatchRef.current = false;
    }
  }, [gameState?.matchStatus]);

  if (!gameState) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg-dark-slate px-5 text-text-light">
        <Card className="max-w-md text-center" variant="mahogany">
          <h1 className="font-display text-3xl text-primary-gold">No active CUKI match</h1>
          <p className="mt-3 text-sm text-text-muted">Choose players before entering the arena.</p>
          <Link className="mt-5 inline-block text-sm font-semibold text-primary-amber" to="/setup">
            Go to setup
          </Link>
        </Card>
      </main>
    );
  }

  const isAIPlayer = activePlayer?.controllerType === 'AI';
  const canRoll =
    !isAIPlayer &&
    !isDiceRolling &&
    (gameState.turn.phase === 'WAITING_FOR_DICE_ROLL' ||
      gameState.turn.phase === 'REROLL_REQUIRED');
  const canCapture =
    !isAIPlayer &&
    !isDiceRolling &&
    gameState.turn.phase === 'WAITING_FOR_CAPTURE_SELECTION' &&
    gameState.turn.currentDiceValue !== null &&
    captureDraft?.selectedOncakCoordinates.length === gameState.turn.currentDiceValue;
  const canEndTurn =
    !isAIPlayer &&
    !isDiceRolling &&
    (gameState.turn.phase === 'REROLL_REQUIRED' || gameState.turn.phase === 'WAITING_FOR_PAWN_MOVE');
  const canMovePawn =
    !isAIPlayer &&
    !isDiceRolling &&
    (gameState.turn.phase === 'WAITING_FOR_PAWN_MOVE' ||
      gameState.turn.phase === 'WAITING_FOR_CAPTURE_SELECTION' ||
      gameState.turn.phase === 'REROLL_REQUIRED');
  const targetCopy =
    diceValue === null
      ? 'Lempar dadu untuk menentukan jumlah Oncak yang wajib diambil.'
      : `Ambil tepat ${diceValue} Oncak satu warna, satu per satu mengikuti garis.`;

  return (
    <main className="min-h-screen bg-bg-dark-slate py-5 text-text-light sm:py-8">
      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(92vw,320px)] flex-col gap-2">
        {toastMessages.map((toast) => (
          <div
            key={toast.id}
            className="rounded-2xl border border-primary-gold/35 bg-bg-mahogany/95 px-4 py-3 text-sm font-medium text-text-light shadow-elevation-3 backdrop-blur"
          >
            {toast.text}
          </div>
        ))}
      </div>
      <PageContainer>
        <header className="mb-5 flex items-center justify-between gap-4 border-b border-primary-gold/30 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-amber">
              CUKI Arena
            </p>
            <h1 className="font-display text-3xl text-primary-gold sm:text-4xl">
              The Kingdom of Sriwijaya
            </h1>
            {activeAccount ? (
              <p className="mt-2 text-sm text-text-muted">
                Akun: <span className="font-bold text-primary-amber">{activeAccount.displayName}</span> · Level{' '}
                {Math.floor(activeAccount.xp / 100) + 1} · {activeAccount.xp} XP
              </p>
            ) : null}
          </div>
          <Link
            className="text-sm font-semibold text-primary-gold hover:text-primary-amber"
            to="/home"
          >
            Home
          </Link>
        </header>

        {turnPassNotice ? (
          <div
            aria-live="assertive"
            className="mb-5 rounded-card border border-primary-amber bg-bg-mahogany px-5 py-3 text-sm font-bold text-primary-amber shadow-elevation-2"
            role="status"
          >
            Tidak ada Oncak valid untuk nilai {turnPassNotice.diceValue}. Giliran{' '}
            {turnPassNotice.playerName} berakhir.
          </div>
        ) : null}

        <section
          aria-live="polite"
          className="mb-4 grid items-center gap-4 rounded-card border border-primary-gold/45 bg-bg-mahogany px-4 py-3 shadow-elevation-2 sm:px-5 sm:py-4 lg:grid-cols-[220px_minmax(0,1fr)]"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
              Current turn
            </p>
            <p className="mt-1 text-xl font-bold text-primary-amber">
              {activePlayer?.name ?? 'Awaiting player'}
              {isAIPlayer ? ' · AI' : ''}
            </p>
            {captureDraft ? (
              <p className="mt-1 text-xs font-semibold text-text-muted">
                Capture sequence {captureDraft.selectedOncakCoordinates.length}/
                {gameState.turn.currentDiceValue ?? 0}
              </p>
            ) : null}
          </div>
          <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-4">
            <Dice3D
              disabled={!canRoll}
              isRolling={isDiceRolling}
              value={diceValue}
              onRoll={rollCurrentDice}
            />
            <div className="min-w-0 max-w-[430px]">
              <p className="text-xs leading-5 text-text-light sm:text-sm">
                {turnInstruction(gameState.turn.phase, isAIPlayer, targetCopy)}
              </p>
              <Button className="mt-2" disabled={!canRoll} onClick={rollCurrentDice}>
                {isDiceRolling
                  ? 'Dice rolling…'
                  : gameState.turn.phase === 'REROLL_REQUIRED'
                    ? 'Reroll Dice'
                    : 'Roll Dice'}
              </Button>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button disabled={!canCapture} onClick={commitStagedCapture} variant="secondary">
                  Ambil
                </Button>
                <Button disabled={!canEndTurn} onClick={endTurn} variant="secondary">
                  Lanjut
                </Button>
                <Button onClick={() => setIsInfoOpen(true)} variant="text">
                  Info
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,920px)_280px] xl:justify-center">
          <CukiBoard
            activePlayerId={activePlayer?.id ?? null}
            board={gameState.board}
            opportunities={opportunities}
            players={gameState.players}
            selectedOncakCoordinate={
              captureDraft?.selectedOncakCoordinates[
                captureDraft.selectedOncakCoordinates.length - 1
              ] ?? null
            }
            selectedOpportunityId={captureDraft?.opportunityId ?? null}
            capturePreviewCoordinates={captureDraft?.selectedOncakCoordinates}
            captureRoute={selectedRoute}
            selectionEnabled={
              !isAIPlayer &&
              !isDiceRolling &&
              gameState.turn.phase === 'WAITING_FOR_CAPTURE_SELECTION'
            }
            onSelectOpportunity={selectCaptureOpportunity}
            onSelectOncak={stageCapturePiece}
            onMovePawn={movePawnToIntersection}
            movementEnabled={canMovePawn}
          />

          <aside className="space-y-4" aria-label="Arena controls">
            <Card className="border border-primary-gold/35" variant="mahogany">
              <div className="flex items-end justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                  Oncak remaining
                </p>
                <p className="text-3xl font-bold text-primary-gold">{gameState.remainingOncak}</p>
              </div>
              <div className="mt-4 space-y-2 border-t border-primary-gold/25 pt-3 text-sm">
                {gameState.players.map((player) => (
                  <p
                    key={player.id}
                    className={`flex justify-between ${player.id === activePlayer?.id ? 'font-bold text-primary-amber' : 'text-text-light'}`}
                  >
                    <span>{player.name}</span>
                    <span>{player.score}</span>
                  </p>
                ))}
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => setIsResetConfirmOpen(true)}
                variant="secondary"
              >
                Reset permainan
              </Button>
            </Card>
          </aside>
        </div>
      </PageContainer>

      <Modal
        isOpen={gameState.matchStatus === 'MATCH_FINISHED' && result !== null}
        onClose={() => {
          resetMatch();
          navigate('/setup');
        }}
        title="Match complete"
      >
        <p>
          {result?.kind === 'WINNER'
            ? `${gameState.players.find((player) => player.id === result.winnerId)?.name ?? result.winnerId} wins.`
            : `Draw: ${result?.kind === 'DRAW' ? result.tiedPlayerIds.join(', ') : ''}`}
        </p>
        <Button
          className="mt-5"
          onClick={() => {
            resetMatch();
            navigate('/setup');
          }}
        >
          New match
        </Button>
      </Modal>

      <Modal
        closeLabel="Cancel reset"
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Reset permainan?"
      >
        <p className="text-sm leading-6 text-text-dark">
          Semua progres pertandingan ini akan hilang dan kamu akan kembali ke setup. Lanjut reset?
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setIsResetConfirmOpen(false);
              resetMatch();
              navigate('/setup');
            }}
            variant="primary"
          >
            Ya, reset
          </Button>
          <Button onClick={() => setIsResetConfirmOpen(false)} variant="secondary">
            Batal
          </Button>
        </div>
      </Modal>

      <Modal
        closeLabel="Tutup info"
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        title="Harus ngapain sekarang?"
      >
        <p className="text-sm leading-6 text-text-dark">
          {getCurrentActionHint(gameState, activePlayer, diceValue, captureDraft, isDiceRolling)}
        </p>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => setIsInfoOpen(false)} variant="secondary">
            Tutup
          </Button>
        </div>
      </Modal>
    </main>
  );
}

function turnInstruction(phase: string, isAIPlayer: boolean, targetCopy: string): string {
  if (isAIPlayer) return 'AI mengikuti aturan dadu, garis rute, warna, dan blokir yang sama.';
  if (phase === 'WAITING_FOR_CAPTURE_SELECTION') return targetCopy;
  if (phase === 'WAITING_FOR_PAWN_MOVE') return 'Gerakkan pion ke titik grid. Setelah itu sistem akan scan buah di sekitarnya.';
  if (phase === 'REROLL_REQUIRED')
    return 'Rute dengan jumlah yang sama sudah habis. Lempar dadu lagi untuk melanjutkan giliran.';
  return 'Lempar dadu, lalu pilih Oncak legal satu per satu mengikuti garis rute.';
}

function getCurrentActionHint(
  gameState: { readonly turn: { readonly phase: string; readonly currentDiceValue: number | null } } | null,
  activePlayer: { readonly name: string; readonly controllerType: string } | null,
  diceValue: number | null,
  captureDraft: SequentialCaptureDraft | null,
  isDiceRolling: boolean,
): string {
  if (!gameState || !activePlayer) {
    return 'Belum ada pertandingan aktif. Mulai match dulu dari setup.';
  }

  if (activePlayer.controllerType === 'AI') {
    if (isDiceRolling) return 'AI sedang melempar dadu.';
    if (gameState.turn.phase === 'WAITING_FOR_CAPTURE_SELECTION') {
      return 'AI sedang memilih langkah legal. Tunggu giliran kembali ke pemain.';
    }
    if (gameState.turn.phase === 'REROLL_REQUIRED') {
      return 'AI mendapat reroll dan sedang melanjutkan turn.';
    }
    return 'AI sedang menjalankan turn otomatis.';
  }

  if (isDiceRolling) {
    return 'Dadu sedang bergulir. Tunggu hasilnya muncul, lalu lanjutkan langkah.';
  }

  if (gameState.turn.phase === 'WAITING_FOR_DICE_ROLL') {
    return 'Giliranmu. Lempar dadu untuk menentukan jumlah Oncak yang harus diambil.';
  }

  if (gameState.turn.phase === 'WAITING_FOR_CAPTURE_SELECTION') {
    if (diceValue === null) {
      return 'Pilih langkah yang tersedia sesuai aturan turn ini.';
    }
    if (captureDraft) {
      return `Kamu sedang menandai Oncak ke-${captureDraft.selectedOncakCoordinates.length} dari ${diceValue}. Ikuti urutan garis sampai penuh, lalu tekan Ambil.`;
    }
    return `Pilih ${diceValue} Oncak dengan warna sama sesuai urutan garis. Jangan melompati Oncak berikutnya.`;
  }

  if (gameState.turn.phase === 'REROLL_REQUIRED') {
    return 'Tidak ada langkah lanjutan untuk nilai ini. Tekan Roll Dice lagi untuk reroll.';
  }

  return 'Ikuti petunjuk turn yang tampil di atas. Jika bingung, tekan Info lagi.';
}

export { CukiArena as PAGE_CukiArena };
