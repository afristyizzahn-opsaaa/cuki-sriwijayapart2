import { useEffect } from 'react';
import { ExternalLink, Gamepad2, Sparkles, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SCRATCH_GAME_URL } from '../constants/gameEntry';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export function PlaySelectorOverlay({ onClose }: { readonly onClose: () => void }): JSX.Element {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[80] grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-md"
      role="dialog"
      onClick={onClose}
    >
      <Card
        className="relative w-full max-w-5xl border border-primary-gold/25 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_35%),linear-gradient(180deg,rgba(74,39,24,0.98),rgba(15,11,8,0.99))] shadow-[0_30px_90px_rgba(0,0,0,0.42)]"
        variant="mahogany"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Tutup pilihan game"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary-gold/25 text-primary-gold transition hover:bg-primary-gold/10 hover:text-primary-amber"
          type="button"
          onClick={onClose}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="pr-14">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">
            Gameplay Gateway
          </p>
          <h2 className="mt-3 font-display text-3xl text-primary-gold md:text-4xl">
            Choose Your CUKI Version
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-surface-parchment/78 md:text-base">
            Pilih apakah kamu ingin main versi klasik Scratch atau lanjut ke versi web yang
            tersambung ke profil dan progress.
          </p>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <PlayOptionCard
            badge="CLASSIC"
            cta="Main via Scratch"
            description="Mainkan versi klasik CUKI yang sudah siap dimainkan."
            external
            href={SCRATCH_GAME_URL}
            icon={Sparkles}
            helper="Stable gameplay version. Open in a new tab."
          />
          <PlayOptionCard
            badge="PROGRESS ENABLED"
            cta="Main di Website"
            description="Main langsung di website dan simpan progress permainanmu."
            href="/setup"
            icon={Gamepad2}
            helper="Connected to your profile and Supabase progress."
          />
        </div>
      </Card>
    </div>
  );
}

function PlayOptionCard({
  badge,
  cta,
  description,
  external = false,
  href,
  helper,
  icon: Icon,
}: {
  readonly badge: string;
  readonly cta: string;
  readonly description: string;
  readonly external?: boolean;
  readonly href: string;
  readonly helper: string;
  readonly icon: LucideIcon;
}): JSX.Element {
  return (
    <article className="rounded-card border border-primary-gold/25 bg-bg-dark/60 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)]">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-primary-gold/25 bg-primary-gold/10 text-primary-gold">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">
            {badge}
          </p>
          <p className="mt-2 text-sm leading-7 text-surface-parchment/78">{description}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-text-muted">{helper}</p>
        </div>
      </div>
      <div className="mt-5">
        {external ? (
          <Button asChild className="w-full" variant="primary">
            <a href={href} rel="noreferrer" target="_blank">
              {cta}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        ) : (
          <Button asChild className="w-full" variant="primary">
            <Link to={href}>{cta}</Link>
          </Button>
        )}
      </div>
    </article>
  );
}
