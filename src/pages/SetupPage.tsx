import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useAccountStore } from '../stores/useAccountStore';
import { useGameStore } from '../stores/useGameStore';
import type { PlayerCount } from '../types/game';
import { createLocalMatchInput } from './matchSetup';

const PLAYER_COUNTS: ReadonlyArray<PlayerCount> = [2, 3, 4];

/** Collects only match configuration; canonical board creation remains in the store/engine. */
export function SetupPage(): JSX.Element {
  const [playerCount, setPlayerCount] = useState<PlayerCount | null>(null);
  const [includeEasyAI, setIncludeEasyAI] = useState(false);
  const startMatch = useGameStore((state) => state.startMatch);
  const activeAccount = useAccountStore((state) => state.activeAccount);
  const navigate = useNavigate();

  const beginMatch = (): void => {
    if (playerCount === null) {
      return;
    }
    startMatch(createLocalMatchInput(playerCount, includeEasyAI, activeAccount?.displayName));
    navigate('/game');
  };

  return (
    <main className="min-h-screen bg-bg-dark-slate py-10 text-text-light">
      <PageContainer className="grid min-h-[70vh] place-items-center">
        <Card className="w-full max-w-xl" variant="mahogany">
          <SectionHeader
            description="Choose how many people will play this local match."
            title="Set up match"
          />
          <div className="mt-4 rounded-card border border-primary-gold/25 bg-bg-dark-slate/45 p-4 text-sm">
            <p className="text-text-muted">Akun aktif</p>
            <p className="mt-1 font-bold text-primary-gold">
              {activeAccount?.displayName ?? 'Belum login'}
            </p>
            {activeAccount ? (
              <p className="mt-1 text-text-light">
                Level {Math.floor(activeAccount.xp / 100) + 1} · {activeAccount.xp} XP ·{' '}
                {activeAccount.matchesPlayed} match
              </p>
            ) : null}
          </div>
          <fieldset
            className="mt-7"
            aria-describedby={playerCount === null ? 'player-count-help' : undefined}
          >
            <legend className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Player count
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {PLAYER_COUNTS.map((count) => (
                <button
                  key={count}
                  aria-pressed={playerCount === count}
                  className={`min-h-16 rounded-button border-2 text-lg font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-amber ${
                    playerCount === count
                      ? 'border-primary-amber bg-primary-amber text-text-dark'
                      : 'border-primary-gold bg-bg-mahogany text-primary-gold hover:bg-primary-gold/15'
                  }`}
                  type="button"
                  onClick={() => setPlayerCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
            <p id="player-count-help" className="mt-3 text-sm text-text-muted">
              {playerCount === null
                ? 'Choose a player count to continue.'
                : `${playerCount} local players selected.`}
            </p>
          </fieldset>
          <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-button border border-primary-gold/30 p-3 text-sm font-medium text-text-light">
            <input
              checked={includeEasyAI}
              className="h-4 w-4 accent-primary-amber"
              type="checkbox"
              onChange={(event) => setIncludeEasyAI(event.target.checked)}
            />
            Include one Easy AI player
          </label>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button disabled={playerCount === null} onClick={beginMatch}>
              Start game
            </Button>
            <Link className="text-sm text-primary-gold hover:text-primary-amber" to="/home">
              Back to home
            </Link>
          </div>
        </Card>
      </PageContainer>
    </main>
  );
}
