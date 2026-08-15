import { motion } from 'framer-motion';
import { useState, type CSSProperties } from 'react';

import boardImg from '../assets/papan cuki reborn.jpeg';
import { coordinateToBoardLabel } from '../game/boardCoordinates';
import type {
  CaptureOpportunity,
  CaptureRoute,
  IntersectionBoard,
  IntersectionCoordinate,
  PlayerState,
} from '../types/game';

export interface CukiBoardProps {
  readonly board: IntersectionBoard;
  readonly activePlayerId: string | null;
  readonly players: ReadonlyArray<PlayerState>;
  readonly opportunities: ReadonlyArray<CaptureOpportunity>;
  readonly selectedOpportunityId: string | null;
  readonly selectedOncakCoordinate?: IntersectionCoordinate | null;
  readonly onSelectOpportunity: (opportunityId: string) => void;
  readonly onSelectOncak?: (opportunityId: string, coordinate: IntersectionCoordinate) => void;
  readonly onSelectPawn?: (pawnId: string) => void;
  readonly onMovePawn?: (coordinate: IntersectionCoordinate) => void;
  readonly capturePreviewCoordinates?: ReadonlyArray<IntersectionCoordinate>;
  readonly captureRoute?: CaptureRoute | null;
  readonly selectionEnabled?: boolean;
  readonly pawnInteractionEnabled?: boolean;
  readonly movementEnabled?: boolean;
  readonly sizeVariant?: 'default' | 'compact';
}

/**
 * The physical board artwork is the complete visual surface. The inset below maps game
 * coordinates 0..10 onto the first and final printed grid intersections in that artwork.
 */
export function CukiBoard({
  activePlayerId,
  board,
  players,
  opportunities,
  selectedOpportunityId,
  selectedOncakCoordinate = null,
  onSelectOpportunity,
  onSelectOncak,
  onSelectPawn,
  onMovePawn,
  capturePreviewCoordinates = [],
  captureRoute = null,
  selectionEnabled = true,
  pawnInteractionEnabled = false,
  movementEnabled = false,
  sizeVariant = 'default',
}: CukiBoardProps): JSX.Element {
  const [hoveredOpportunityId, setHoveredOpportunityId] = useState<string | null>(null);
  const offBoardPlayers = players
    .map((player, paletteIndex) => ({ player, paletteIndex }))
    .filter(({ player }) => player.pawn.state.status === 'OFF_BOARD');
  const selectedOpportunity =
    opportunities.find((opportunity) => opportunity.id === selectedOpportunityId) ?? null;
  const activePlayer = players.find((player) => player.id === activePlayerId) ?? null;
  const capturePath = createCapturePath(activePlayer, capturePreviewCoordinates, captureRoute);

  return (
    <section aria-label="CUKI 11 by 11 intersection board" className="mx-auto w-full max-w-[920px]">
      <div className="space-y-4">
        <div
          data-testid="game-board"
          className="relative isolate aspect-[1600/1346] w-full overflow-hidden select-none"
        >
          <img
            alt="Cuki physical game board"
            className="absolute inset-0 block h-full w-full object-fill"
            draggable={false}
            src={boardImg}
          />

          <div className="absolute inset-[6.1%_5.38%_5.85%_5.25%]">
            <div aria-hidden="true" className="sr-only">
              {Array.from({ length: 100 }, (_, index) => (
                <span key={index} data-testid="board-cell" />
              ))}
            </div>

            {capturePath.length > 1 ? (
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible"
                data-testid="capture-path"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <motion.polyline
                  animate={{ pathLength: 1, opacity: 0.95 }}
                  className="fill-none stroke-[#ffd15c] opacity-40 blur-[1px]"
                  initial={{ pathLength: 0, opacity: 0 }}
                  points={capturePath.map(toSvgPoint).join(' ')}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3.5"
                  vectorEffect="non-scaling-stroke"
                />
                <motion.polyline
                  animate={{ pathLength: 1, opacity: 1 }}
                  className="fill-none stroke-[#fff1a8]"
                  initial={{ pathLength: 0, opacity: 0 }}
                  points={capturePath.map(toSvgPoint).join(' ')}
                  strokeDasharray="0.8 0.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : null}

            {board.flat().map((intersection) => {
              const { coordinate } = intersection;
              const boardLabel = coordinateToBoardLabel(coordinate);
              const opportunity = opportunityAt(coordinate, opportunities);
              const isCentralLogo = coordinate.x === 5 && coordinate.y === 5;
              const isHoveredOpportunity = opportunity?.id === hoveredOpportunityId;
              const isSelectedOpportunity = opportunity?.id === selectedOpportunityId;
              const isSelectableOpportunityPiece =
                selectionEnabled &&
                opportunity !== undefined &&
                onSelectOncak !== undefined;
              const isPreviewedOncak =
                selectedOpportunity?.candidateOncakCoordinates.some((candidate) =>
                  sameCoordinate(candidate, coordinate),
                ) ?? false;
              const isCapturedPreview = capturePreviewCoordinates.some((candidate) =>
                sameCoordinate(candidate, coordinate),
              );

              return (
                <div
                  key={`${coordinate.x}-${coordinate.y}`}
                  data-testid={`intersection-${coordinate.x}-${coordinate.y}`}
                  data-board-coordinate={boardLabel}
                  data-board-row={boardLabel[0]}
                  data-board-column={coordinate.x + 1}
                  aria-label={`Papan ${boardLabel}`}
                  className="absolute z-10 grid h-[clamp(1.25rem,4.3vw,1.75rem)] w-[clamp(1.25rem,4.3vw,1.75rem)] -translate-x-1/2 -translate-y-1/2 place-items-center"
                  style={gridPositionStyle(coordinate)}
                >
                  {isCentralLogo ? (
                    <span
                      aria-label={`Central Cuki Kingdom Logo hard block at ${boardLabel}`}
                      data-hard-block="true"
                      data-testid="central-logo"
                      title="Central Logo — permanently blocked"
                      className="pointer-events-none absolute h-[210%] w-[210%] rounded-full"
                    />
                  ) : opportunity && isSelectableOpportunityPiece ? (
                    <button
                      aria-label={`Capture legal Oncak group ${opportunity.id}`}
                      aria-pressed={selectedOpportunityId === opportunity.id}
                      className={`cuki-round-hitbox group relative grid shrink-0 place-items-center rounded-full transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-amber disabled:cursor-not-allowed ${
                        isHoveredOpportunity || isSelectedOpportunity
                          ? sizeVariant === 'compact'
                            ? 'scale-102'
                            : 'scale-110'
                          : 'scale-100'
                      } ${sizeVariant === 'compact' ? 'h-4 w-4' : ''}`}
                      disabled={!selectionEnabled}
                      type="button"
                      onClick={() => selectOncak(opportunity.id, coordinate, onSelectOncak, onSelectOpportunity)}
                      onPointerEnter={() => setHoveredOpportunityId(opportunity.id)}
                      onPointerLeave={() =>
                        setHoveredOpportunityId((current) => (current === opportunity.id ? null : current))
                      }
                      onPointerMove={(event) => {
                        if (!selectionEnabled || event.pointerType !== 'mouse') return;
                        setHoveredOpportunityId(opportunity.id);
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute inset-[-16%] rounded-full transition-all duration-200 ${
                          isHoveredOpportunity || isSelectedOpportunity
                            ? sizeVariant === 'compact'
                              ? 'scale-110 bg-primary-amber/18 blur-[1px]'
                              : 'scale-125 bg-primary-amber/20 blur-[2px]'
                            : 'scale-100 bg-primary-amber/0'
                        }`}
                      />
                      <span
                        aria-hidden="true"
                        className={`absolute inset-[-32%] rounded-full border transition-all duration-200 ${
                          isHoveredOpportunity
                            ? 'border-primary-amber/75 shadow-[0_0_0_6px_rgba(255,201,91,0.18)]'
                            : isSelectedOpportunity
                              ? sizeVariant === 'compact'
                                ? 'border-primary-amber/45 shadow-[0_0_0_2px_rgba(255,201,91,0.10)]'
                                : 'border-primary-amber/55 shadow-[0_0_0_4px_rgba(255,201,91,0.12)]'
                              : 'border-transparent'
                        }`}
                      />
                      {isCapturedPreview ? null : (
                        <IntersectionContent
                          intersection={intersection}
                          isSelected={sameCoordinate(coordinate, selectedOncakCoordinate) || isPreviewedOncak}
                          sizeVariant={sizeVariant}
                        />
                      )}
                    </button>
                  ) :
                    (intersection.kind === 'EMPTY' || intersection.kind === 'ONCAK') &&
                    onMovePawn ? (
                    <button
                      aria-label={`Move active pawn to ${boardLabel}`}
                      className={`cuki-round-hitbox shrink-0 cursor-pointer rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-amber disabled:cursor-not-allowed ${
                        sizeVariant === 'compact' ? 'h-4 w-4' : ''
                      }`}
                      disabled={!movementEnabled}
                      type="button"
                      onClick={() => onMovePawn(coordinate)}
                    >
                      <IntersectionContent intersection={intersection} isSelected={false} sizeVariant={sizeVariant} />
                    </button>
                  ) : isCapturedPreview ? null : (
                    <IntersectionContent
                      intersection={intersection}
                      isSelected={sameCoordinate(coordinate, selectedOncakCoordinate)}
                      sizeVariant={sizeVariant}
                    />
                  )}
                </div>
              );
            })}

            {players.map((player, paletteIndex) => {
              const previewPosition =
                player.id === activePlayerId
                  ? capturePreviewCoordinates[capturePreviewCoordinates.length - 1]
                  : undefined;
              const position =
                previewPosition ??
                (player.pawn.state.status === 'ON_BOARD' ? player.pawn.state.position : null);
              if (!position) return null;
              const isActive = player.id === activePlayerId;

              return (
                <div
                  key={player.pawn.id}
                  data-testid={`pawn-${player.pawn.id}`}
                  data-board-coordinate={position ? coordinateToBoardLabel(position) : undefined}
                  className={`cuki-round-pawn absolute z-[15] -translate-x-1/2 -translate-y-1/2 ${
                    sizeVariant === 'compact' ? 'h-5 w-5' : ''
                  }`}
                  style={gridPositionStyle(position)}
                >
                  <motion.button
                    aria-label={`${player.name} pawn at ${coordinateToBoardLabel(position)}`}
                    className={`h-full w-full rounded-full border-2 shadow-elevation-2 transition duration-200 ${
                      isActive ? 'border-primary-amber ring-4 ring-primary-amber/45' : 'disabled:opacity-70'
                    } ${PAWN_VISUALS[paletteIndex % PAWN_VISUALS.length]} ${
                      boardHasVisibleOncakUnderPawn(board, position) ? 'opacity-90' : ''
                    }`}
                    disabled={!isActive || !pawnInteractionEnabled || !onSelectPawn}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={isActive ? { scale: 1.08 } : undefined}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    type="button"
                    onClick={() => onSelectPawn?.(player.pawn.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <OffBoardPawnHolders players={offBoardPlayers} />
      </div>
    </section>
  );
}

function OffBoardPawnHolders({
  players,
}: {
  readonly players: ReadonlyArray<{ readonly player: PlayerState; readonly paletteIndex: number }>;
}): JSX.Element | null {
  if (players.length === 0) return null;
  return (
    <div
      aria-label="Off-board pawn holders"
      className="grid grid-cols-2 gap-3 rounded-card border border-primary-gold/25 bg-bg-mahogany/70 p-4 shadow-elevation-2 sm:grid-cols-4"
    >
      {players.map(({ player, paletteIndex }) => {
        return (
          <div
            key={player.pawn.id}
            aria-label={`${player.name} off-board pawn holder`}
            data-testid={`offboard-pawn-${player.pawn.id}`}
            className={`flex min-h-20 items-center justify-center rounded-2xl border px-3 py-4 text-center shadow-elevation-2 ${
              PAWN_VISUALS[paletteIndex % PAWN_VISUALS.length]
            }`}
            title={`${player.name} is OFF_BOARD`}
          />
        );
      })}
    </div>
  );
}

function IntersectionContent({
  intersection,
  isSelected,
  sizeVariant,
}: {
  readonly intersection: IntersectionBoard[number][number];
  readonly isSelected: boolean;
  readonly sizeVariant: 'default' | 'compact';
}): JSX.Element | null {
  if (intersection.kind !== 'ONCAK') return null;
  return (
    <span
      aria-label={`${intersection.oncak.color} Oncak at ${coordinateToBoardLabel(intersection.coordinate)}`}
      data-testid={`oncak-${intersection.oncak.id}`}
      data-board-coordinate={coordinateToBoardLabel(intersection.coordinate)}
      className={`cuki-round-token shrink-0 rounded-full border shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-transform duration-150 ${
        isSelected ? (sizeVariant === 'compact' ? 'scale-105' : 'scale-125') : 'scale-100'
      } ${
        sizeVariant === 'compact' ? 'h-2 w-2' : 'h-4 w-4'
      } ${
        intersection.oncak.color === 'BLACK'
          ? 'border-primary-amber bg-black'
          : 'border-bg-mahogany bg-white'
      }`}
    />
  );
}


const PAWN_VISUALS = [
  'border-[#7654A8] bg-[#C8B4ED] text-[#3B2858]',
  'border-[#317E79] bg-[#96E1D7] text-[#173F3D]',
  'border-[#B85E83] bg-[#F3B3CB] text-[#5D1F3B]',
  'border-[#31496F] bg-[#788DB5] text-[#F7F1DF]',
] as const;

function sameCoordinate(first: IntersectionCoordinate, second: IntersectionCoordinate | null): boolean {
  return second !== null && first.x === second.x && first.y === second.y;
}

function gridPositionStyle(coordinate: IntersectionCoordinate): CSSProperties {
  return {
    left: `${coordinate.x * 10}%`,
    top: `${coordinate.y * 10}%`,
  };
}

function createCapturePath(
  activePlayer: PlayerState | null,
  selectedCoordinates: ReadonlyArray<IntersectionCoordinate>,
  route: CaptureRoute | null,
): ReadonlyArray<IntersectionCoordinate> {
  if (selectedCoordinates.length === 0) return [];
  if (route) {
    const lastSelected = selectedCoordinates[selectedCoordinates.length - 1];
    const lastIndex = route.intersections.findIndex((coordinate) =>
      sameCoordinate(coordinate, lastSelected),
    );
    if (lastIndex >= 0) return route.intersections.slice(0, lastIndex + 1);
  }
  const origin =
    activePlayer?.pawn.state.status === 'ON_BOARD' ? activePlayer.pawn.state.position : null;
  if (!origin || sameCoordinate(origin, selectedCoordinates[0])) return selectedCoordinates;
  return [origin, ...selectedCoordinates];
}

function toSvgPoint(coordinate: IntersectionCoordinate): string {
  return `${coordinate.x * 10},${coordinate.y * 10}`;
}

function boardHasVisibleOncakUnderPawn(
  board: IntersectionBoard,
  position: IntersectionCoordinate,
): boolean {
  return board[position.y]?.[position.x]?.kind === 'ONCAK';
}

function opportunityAt(
  coordinate: IntersectionCoordinate,
  opportunities: ReadonlyArray<CaptureOpportunity>,
): CaptureOpportunity | undefined {
  return opportunities.find((opportunity) =>
    opportunity.candidateOncakCoordinates.some(
      (candidate) => candidate.x === coordinate.x && candidate.y === coordinate.y,
    ),
  );
}

function selectOncak(
  opportunityId: string,
  coordinate: IntersectionCoordinate,
  onSelectOncak: CukiBoardProps['onSelectOncak'],
  onSelectOpportunity: CukiBoardProps['onSelectOpportunity'],
): void {
  if (onSelectOncak) {
    onSelectOncak(opportunityId, coordinate);
    return;
  }
  onSelectOpportunity(opportunityId);
}
