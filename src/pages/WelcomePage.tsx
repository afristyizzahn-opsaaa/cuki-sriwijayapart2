import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/Button';

/** Guest entry screen and CSS-only gate transition required by the frontend journey. */
export function WelcomePage(): JSX.Element {
  const [isOpening, setIsOpening] = useState(false);
  const navigate = useNavigate();

  const enterKingdom = (): void => {
    setIsOpening(true);
    window.setTimeout(() => navigate('/home'), 1200);
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-bg-dark-slate px-5 text-center text-text-light">
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1/2 border-r border-primary-gold/30 bg-bg-mahogany transition-transform duration-1000 ${isOpening ? '-translate-x-full' : ''}`}
      />
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 right-0 w-1/2 border-l border-primary-gold/30 bg-bg-mahogany transition-transform duration-1000 ${isOpening ? 'translate-x-full' : ''}`}
      />
      <section
        aria-labelledby="welcome-title"
        className="relative z-10 max-w-xl rounded-card border border-primary-gold/35 bg-bg-dark-slate/90 p-8 shadow-elevation-4 md:p-12"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-amber">
          Gerbang Sriwijaya
        </p>
        <h1
          id="welcome-title"
          className="mt-4 font-display text-4xl font-semibold text-primary-gold md:text-5xl"
        >
          CUKI
        </h1>
        <p className="mt-4 text-lg text-surface-parchment">The Kingdom of Sriwijaya</p>
        <p className="mt-6 text-sm leading-6 text-text-muted">
          Masuklah ke Kadatuan dan mulailah permainan strategi di atas papan CUKI.
        </p>
        <Button className="mt-8" disabled={isOpening} onClick={enterKingdom}>
          {isOpening ? 'Gerbang terbuka…' : 'Lanjut sebagai tamu'}
        </Button>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="secondary">
            <Link to="/auth?mode=login&next=/home">Login</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/auth?mode=register&next=/home">Register</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-text-muted">Masuk sebagai Tamu Kerajaan</p>
      </section>
    </main>
  );
}
