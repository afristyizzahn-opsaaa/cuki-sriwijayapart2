import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { GameBoard } from '../../src/components/game/GameBoard';
import { initializeCanonicalGameState } from '../../src/engine/board/initialization';
import type { IntersectionBoard, PlayerState } from '../../src/types/game';

const RANDOM_VALUES = createResolvedRandomValues(119 * 32);

describe('game board presentation', () => {
  it('aligns a 10x10 visual grid with all 11x11 gameplay intersections and the central logo', () => {
    const state = initialState();
    const markup = renderBoard(state.board, state.players);

    expect((markup.match(/data-testid="board-cell"/g) ?? [])).toHaveLength(100);
    expect((markup.match(/data-testid="intersection-/g) ?? [])).toHaveLength(121);
    expect(markup).toContain('data-testid="intersection-5-5"');
    expect(markup).toContain('data-testid="central-logo"');
  });

  it('renders the canonical initial 120 Oncak and keeps OFF_BOARD Pawns off the board', () => {
    const state = initialState();
    const markup = renderBoard(state.board, state.players);

    expect((markup.match(/data-testid="oncak-/g) ?? [])).toHaveLength(120);
    expect(markup).not.toContain('data-testid="pawn-');
  });

  it('renders an ON_BOARD Pawn at its intersection', () => {
    const state = initialState();
    const players = state.players.map((player, index) =>
      index === 0
        ? { ...player, pawn: { ...player.pawn, state: { status: 'ON_BOARD' as const, position: { x: 0 as const, y: 0 as const } } } }
        : player,
    );
    const markup = renderBoard(state.board, players);

    const pawnStart = markup.indexOf(`data-testid="pawn-${players[0]?.pawn.id}"`);
    const pawn = markup.slice(pawnStart, pawnStart + 600);
    expect(pawn).toContain('left:0%;top:0%');
  });
});

function initialState() {
  return initializeCanonicalGameState({
    gameMode: 'LOCAL_MULTIPLAYER',
    playerCount: 2,
    players: [
      { id: 'p1', name: 'Player 1', controllerType: 'HUMAN' },
      { id: 'p2', name: 'Player 2', controllerType: 'HUMAN' },
    ],
    randomValues: RANDOM_VALUES,
    maxLayoutAttempts: 32,
  });
}

function renderBoard(board: IntersectionBoard, players: ReadonlyArray<PlayerState>): string {
  return renderToStaticMarkup(
    <GameBoard activePlayerId={players[0]?.id ?? null} board={board} opportunities={[]} players={players} selectedOpportunityId={null} onSelectOpportunity={() => undefined} />,
  );
}

function createResolvedRandomValues(length: number): ReadonlyArray<number> {
  let state = 123456789;
  return Array.from({ length }, () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  });
}
