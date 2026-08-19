import { useState } from 'react';
import { BookOpen, Crown, Gamepad2, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { PlaySelectorOverlay } from '../components/PlaySelectorOverlay';
import { KingdomShell } from '../components/layout/KingdomShell';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../stores/useGameStore';

import heroBackground from '../../references/bacground cuki dekstop landing.jpeg';
import cukiLogo from '../../references/logo_cuki_sriwijaya-removebg-preview.png';

export function HomePage(): JSX.Element {
  const location = useLocation();
  const hasSavedMatch = useGameStore((state) => state.gameState !== null);
  const [showPlaySelector, setShowPlaySelector] = useState(false);
  const shouldFadeInFromGate = Boolean(
    (location.state as { fromGateIntro?: boolean } | null)?.fromGateIntro,
  );

  return (
    <div className={shouldFadeInFromGate ? 'gate-page-fade-in' : undefined}>
      <KingdomShell title="Game of CUKI" variant="landing">
        <section
          aria-labelledby="landing-title"
          className="hero-portal relative isolate min-h-screen overflow-hidden px-5 pb-8 pt-28 text-text-light sm:px-8 lg:px-12"
        >
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-30 h-full w-full object-cover object-center"
            src={heroBackground}
          />
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_74%_38%,rgba(212,175,55,0.24),transparent_30%),radial-gradient(circle_at_18%_16%,rgba(245,230,200,0.1),transparent_22%),linear-gradient(90deg,rgba(8,7,6,0.92)_0%,rgba(8,7,6,0.78)_40%,rgba(8,7,6,0.68)_64%,rgba(8,7,6,0.58)_100%)]" />
          <div className="golden-light absolute inset-0 -z-10 opacity-42" />
          <div className="golden-sheen absolute inset-0 -z-10" />

          <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-content flex-col justify-center gap-12">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
              <div className="hero-content max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-gold/45 bg-bg-dark/45 px-3.5 py-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-primary-gold shadow-[0_0_22px_rgba(212,175,55,0.18)] backdrop-blur-md sm:px-4 sm:text-[0.82rem] sm:tracking-[0.24em]">
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  Warisan Kesultanan Palembang Darussalam
                </span>
                <h1
                  id="landing-title"
                  className="mt-6 font-display text-[clamp(4rem,6.2vw,5.25rem)] font-semibold leading-[0.86] text-surface-parchment"
                >
                  Game of
                  <span className="block text-[1.08em] text-primary-gold drop-shadow-[0_0_26px_rgba(212,175,55,0.28)]">
                    CUKI
                  </span>
                </h1>
                <p className="mt-5 max-w-[560px] text-[0.98rem] leading-[1.6] text-surface-parchment/90 sm:text-[1.05rem]">
                  Jelajahi kekayaan budaya Palembang melalui permainan tradisional Cuki. Telusuri
                  jejak sejarah dan warisan Kesultanan Palembang Darussalam dalam pengalaman
                  digital yang interaktif dan menyenangkan.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Button
                    className="min-h-[3.25rem] rounded-full px-7 text-base shadow-[0_0_34px_rgba(212,175,55,0.3)]"
                    onClick={() => setShowPlaySelector(true)}
                  >
                    Mulai Bermain
                  </Button>
                  <Button
                    asChild
                    className="min-h-[3.25rem] rounded-full border-primary-gold/55 bg-bg-dark/35 px-7 text-base backdrop-blur-md"
                    variant="secondary"
                  >
                    <Link to="/tutorial">Pelajari Dulu</Link>
                  </Button>
                </div>
                {hasSavedMatch ? (
                  <Link
                    className="mt-4 inline-flex text-sm font-semibold text-primary-gold underline decoration-primary-gold/35 underline-offset-4 transition hover:text-primary-amber"
                    to="/game"
                  >
                    Lanjutkan permainan tersimpan
                  </Link>
                ) : null}
              </div>

              <div className="hero-logo-float justify-self-center lg:justify-self-end">
                <div className="cuki-logo-orbit relative aspect-square w-[min(72vw,390px)] overflow-hidden rounded-full border border-primary-gold/35 bg-bg-dark/18 p-4 shadow-[0_0_70px_rgba(212,175,55,0.28)] backdrop-blur-sm sm:w-[min(54vw,420px)] sm:p-5">
                  <div className="absolute inset-4 rounded-full border border-primary-gold/20" />
                  <div className="grid h-full w-full place-items-center rounded-full border border-primary-gold/45 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.22),rgba(74,39,24,0.28)_48%,rgba(8,7,6,0.18)_100%)] p-3 sm:p-4">
                    <img
                      alt="Logo CUKI Palembang Darussalam"
                      className="h-full w-full object-contain drop-shadow-[0_0_18px_rgba(212,175,55,0.28)]"
                      src={cukiLogo}
                    />
                  </div>
                </div>
              </div>
            </div>

            <section aria-label="Fitur CUKI" className="grid w-full gap-4 md:grid-cols-3 md:gap-5">
              <FeatureCard
                description="Jelajahi pusaka, sejarah, seni, tokoh, dan warisan Kesultanan Palembang Darussalam."
                icon={Crown}
                title="Khazanah Kesultanan"
                to="/treasures"
              />
              <FeatureCard
                description="Pelajari aturan dan cara bermain Cuki melalui panduan interaktif."
                icon={BookOpen}
                title="Cara Bermain"
                to="/tutorial"
              />
              <FeatureCard
                description="Masuki arena dan mainkan permainan tradisional Cuki secara digital."
                icon={Gamepad2}
                title="Main Cuki"
                to="/setup"
              />
            </section>
          </div>
        </section>
        {showPlaySelector ? (
          <PlaySelectorOverlay onClose={() => setShowPlaySelector(false)} />
        ) : null}
      </KingdomShell>
    </div>
  );
}

function FeatureCard({
  description,
  icon: Icon,
  title,
  to,
}: {
  readonly description: string;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly to: string;
}): JSX.Element {
  return (
    <Link
      className="group min-h-[11.5rem] rounded-[1rem] border border-primary-gold/30 bg-bg-dark/60 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-primary-gold/70 hover:shadow-[0_0_42px_rgba(212,175,55,0.16)] sm:p-6"
      to={to}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-primary-gold/35 bg-primary-gold/10 text-primary-gold transition group-hover:bg-primary-gold group-hover:text-text-dark">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-xl font-semibold text-primary-gold sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-surface-parchment/78">{description}</p>
    </Link>
  );
}
