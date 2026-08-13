import { useCallback, useEffect, useState } from 'react';

import { canAppendSequentialCaptureStep, canControlPawn } from '../game/rules';
import type {
  CaptureOpportunity,
  DiceValue,
  IntersectionBoard,
  IntersectionCoordinate,
  PlayerCount,
  PlayerState,
  SequentialCaptureDraft,
  TurnState,
} from '../types/game';
import { Dice3D } from './Dice3D';
import { CukiBoard } from './CukiBoard';
import { Button } from './ui/Button';

export interface BoardProps {
  readonly board: IntersectionBoard;
  readonly players: ReadonlyArray<PlayerState>;
  readonly totalPlayers: PlayerCount;
  readonly activePlayerIndex: number;
  readonly activeDiceValue: DiceValue | null;
  readonly turn: TurnState;
  readonly opportunities: ReadonlyArray<CaptureOpportunity>;
  readonly selectedOpportunityId: string | null;
  readonly isDiceRolling?: boolean;
  readonly turnPassNotice?: string | null;
  readonly onTurnPassNoticeDismiss?: () => void;
  readonly onRollDice: () => void;
  readonly onSelectPawn: (pawnId: string) => void;
  readonly onMovePawn: (coordinate: IntersectionCoordinate) => void;
  /** Stores the complete candidate, but never resolves the capture before Ambil is clicked. */
  readonly onSelectOpportunity: (opportunityId: string) => void;
  readonly onSelectOncak?: (opportunityId: string, coordinate: IntersectionCoordinate) => void;
  /** Resolves the fully staged capture and publishes the canonical same-V loop or reroll phase. */
  readonly onCapture: () => void;
  readonly onEndTurn: () => void;
}

/**
 * Controlled arena board. It keeps visual Oncak uniform and stages only the next legal
 * capture coordinate. The authoritative engine remains responsible for final validation.
 */
export function Board({
  board,
  players,
  totalPlayers,
  activePlayerIndex,
  activeDiceValue,
  turn,
  opportunities,
  selectedOpportunityId,
  isDiceRolling = false,
  turnPassNotice = null,
  onTurnPassNoticeDismiss,
  onRollDice,
  onSelectPawn,
  onMovePawn,
  onSelectOpportunity,
  onSelectOncak,
  onCapture,
  onEndTurn,
}: BoardProps): JSX.Element {
  const [captureDraft, setCaptureDraft] = useState<SequentialCaptureDraft | null>(null);
  const [visibleTurnPassNotice, setVisibleTurnPassNotice] = useState<string | null>(turnPassNotice);
  const activePlayer = players[activePlayerIndex] ?? null;
  const canRoll =
    !isDiceRolling && (turn.phase === 'WAITING_FOR_DICE_ROLL' || turn.phase === 'REROLL_REQUIRED');
  const captureIsReady =
    activeDiceValue !== null && captureDraft?.selectedOncakCoordinates.length === activeDiceValue;
  const canCapture =
    !isDiceRolling && turn.phase === 'WAITING_FOR_CAPTURE_SELECTION' && captureIsReady;
  const canEndTurn =
    !isDiceRolling &&
    (turn.phase === 'WAITING_FOR_CAPTURE_SELECTION' || turn.phase === 'REROLL_REQUIRED');

  useEffect(() => {
    if (turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION' || activeDiceValue === null) {
      setCaptureDraft(null);
    }
  }, [activeDiceValue, turn.phase]);

  useEffect(() => {
    setVisibleTurnPassNotice(turnPassNotice);
    if (turnPassNotice === null) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setVisibleTurnPassNotice(null);
      onTurnPassNoticeDismiss?.();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [onTurnPassNoticeDismiss, turnPassNotice]);

  const stageOncak = useCallback(
    (opportunityId: string, coordinate: IntersectionCoordinate): void => {
      if (
        turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION' ||
        activeDiceValue === null ||
        isDiceRolling
      ) {
        return;
      }
      const opportunity = opportunities.find((candidate) => candidate.id === opportunityId);
      if (!opportunity || !canAppendSequentialCaptureStep(opportunity, captureDraft, coordinate)) {
        return;
      }

      const previous =
        captureDraft?.opportunityId === opportunityId ? captureDraft.selectedOncakCoordinates : [];
      const nextCoordinates = [...previous, coordinate];
      setCaptureDraft({
        opportunityId,
        requiredDiceValue: activeDiceValue,
        selectedOncakCoordinates: nextCoordinates,
      });
      onSelectOpportunity(opportunityId);
      onSelectOncak?.(opportunityId, coordinate);
    },
    [
      activeDiceValue,
      captureDraft,
      isDiceRolling,
      onSelectOncak,
      onSelectOpportunity,
      opportunities,
      turn.phase,
    ],
  );

  const commitCapture = useCallback((): void => {
    if (!canCapture) {
      return;
    }
    onCapture();
    setCaptureDraft(null);
  }, [canCapture, onCapture]);

  return (
    <section aria-label="CUKI turn board" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-primary-gold/45 bg-bg-mahogany px-4 py-3 shadow-elevation-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
            Current Turn
          </p>
          <p className="mt-1 text-xl font-bold text-primary-amber">
            {activePlayer?.name ?? 'No active player'}
          </p>
          {activeDiceValue !== null ? (
            <p className="mt-1 text-xs text-text-muted">Target: {activeDiceValue} Oncak.</p>
          ) : null}
        </div>
        <Dice3D
          disabled={!canRoll}
          isRolling={isDiceRolling}
          value={activeDiceValue}
          onRoll={onRollDice}
        />
      </header>

      <div aria-label="Player turn order" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {players.slice(0, totalPlayers).map((player, index) => (
          <div
            key={player.id}
            className={`rounded-button border px-3 py-2 text-sm transition ${
              index === activePlayerIndex
                ? 'border-primary-amber bg-primary-amber/15 font-bold text-primary-amber'
                : 'border-primary-gold/30 bg-bg-dark-slate/45 text-text-muted'
            }`}
          >
            Player {index + 1}: {player.name}
          </div>
        ))}
      </div>

      <div className="relative">
        <CukiBoard
          activePlayerId={activePlayer?.id ?? null}
          board={board}
          capturePreviewCoordinates={captureDraft?.selectedOncakCoordinates}
          opportunities={opportunities}
          players={players}
          selectedOncakCoordinate={
            captureDraft?.selectedOncakCoordinates[
              captureDraft.selectedOncakCoordinates.length - 1
            ] ?? null
          }
          selectedOpportunityId={captureDraft?.opportunityId ?? selectedOpportunityId}
          selectionEnabled={turn.phase === 'WAITING_FOR_CAPTURE_SELECTION' && !isDiceRolling}
          pawnInteractionEnabled={turn.phase === 'WAITING_FOR_CAPTURE_SELECTION' && !isDiceRolling}
          movementEnabled={
            turn.phase === 'WAITING_FOR_CAPTURE_SELECTION' &&
            !isDiceRolling &&
            captureDraft === null &&
            activePlayer?.pawn.state.status === 'ON_BOARD'
          }
          onMovePawn={onMovePawn}
          onSelectOncak={stageOncak}
          onSelectOpportunity={onSelectOpportunity}
          onSelectPawn={(pawnId) => {
            const pawnOwner = players.find((player) => player.pawn.id === pawnId);
            if (pawnOwner && canControlPawn(pawnOwner.pawn, activePlayer?.id ?? null)) {
              onSelectPawn(pawnId);
            }
          }}
        />
        {visibleTurnPassNotice ? (
          <div
            aria-live="assertive"
            className="absolute inset-x-4 top-4 z-50 rounded-button border border-primary-amber bg-bg-mahogany/95 px-4 py-3 text-center text-sm font-bold text-primary-amber shadow-elevation-3"
            role="status"
          >
            {visibleTurnPassNotice}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button disabled={!canRoll} onClick={onRollDice}>
          {isDiceRolling
            ? 'Mengacak…'
            : turn.phase === 'REROLL_REQUIRED'
              ? 'Acak Dadu Lagi'
              : 'Acak Dadu'}
        </Button>
        <Button disabled={!canCapture} onClick={commitCapture}>
          Ambil
        </Button>
        <Button disabled={!canEndTurn} onClick={onEndTurn} variant="secondary">
          Lanjut
        </Button>
      </div>
    </section>
  );
}
