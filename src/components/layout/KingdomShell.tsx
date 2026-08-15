import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { PageContainer } from './PageContainer';
import { PlaySelectorOverlay } from '../PlaySelectorOverlay';
import { Button } from '../ui/Button';
import { useAccountStore } from '../../stores/useAccountStore';

export interface KingdomShellProps {
  readonly children: ReactNode;
  readonly eyebrow?: string;
  readonly title: string;
  readonly variant?: 'default' | 'landing';
}

/** Shared frontend framing for the Sriwijaya destination screens. */
export function KingdomShell({
  children,
  eyebrow = 'Kadatuan Sriwijaya',
  title,
  variant = 'default',
}: KingdomShellProps): JSX.Element {
  const isLanding = variant === 'landing';
  const [showPlaySelector, setShowPlaySelector] = useState(false);
  const activeAccount = useAccountStore((state) => state.activeAccount);

  return (
    <main className="min-h-screen bg-bg-dark text-text-light">
      <nav
        aria-label="Kingdom navigation"
        className="fixed left-1/2 top-4 z-50 w-[calc(100vw-1.5rem)] max-w-[1180px] -translate-x-1/2 rounded-full border border-primary-gold/25 bg-bg-dark/48 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:w-[calc(100vw-3rem)] sm:px-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="font-display text-xl font-semibold tracking-wide text-primary-gold drop-shadow-[0_0_16px_rgba(212,175,55,0.24)]"
            to="/home"
          >
            CUKI
          </Link>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-2 gap-y-2 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-surface-parchment sm:gap-x-3 sm:text-xs sm:tracking-[0.1em]">
            <NavItem to="/home">Beranda</NavItem>
            <NavItem to="/treasures">Khazanah Kesultanan</NavItem>
            <NavItem to="/tutorial">Cara Bermain</NavItem>
            <button
              className={navItemClassName}
              type="button"
              onClick={() => setShowPlaySelector(true)}
            >
              Main Cuki
            </button>
            <NavItem to="/product">Produk</NavItem>
            {activeAccount ? (
              <Button
                asChild
                className="rounded-full px-3 py-1 text-[0.68rem] uppercase tracking-[0.08em]"
                variant="secondary"
              >
                <Link to="/profile">
                  {activeAccount.displayName} Lv {Math.floor(activeAccount.xp / 100) + 1}
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                className="rounded-full px-3 py-1 text-[0.68rem] uppercase tracking-[0.08em]"
                variant="secondary"
              >
                <Link to="/auth?mode=login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {isLanding ? (
        <>
          <h1 className="sr-only">{title}</h1>
          {children}
        </>
      ) : (
        <PageContainer className="py-28 md:py-32">
          <header className="mb-8 border-b border-primary-gold/25 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-amber">
                {eyebrow}
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-primary-gold md:text-4xl">
                {title}
              </h1>
            </div>
          </header>
          {children}
        </PageContainer>
      )}
      {showPlaySelector ? <PlaySelectorOverlay onClose={() => setShowPlaySelector(false)} /> : null}
    </main>
  );
}

const navItemClassName =
  'whitespace-nowrap rounded-full px-1.5 py-1 text-primary-gold/90 transition hover:text-primary-amber focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-amber';

function NavItem({
  children,
  to,
}: {
  readonly children: ReactNode;
  readonly to: string;
}): JSX.Element {
  return (
    <Link className={navItemClassName} to={to}>
      {children}
    </Link>
  );
}
