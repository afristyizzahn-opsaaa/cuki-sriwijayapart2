import { ExternalLink, Sparkles, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { KingdomShell } from '../components/layout/KingdomShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SCRATCH_GAME_URL, hasScratchGameUrl } from '../constants/gameEntry';

const OPTIONS = [
  {
    badge: 'CLASSIC',
    title: 'CUKI Classic — Scratch Version',
    description: 'Mainkan versi klasik CUKI yang sudah siap dimainkan.',
    cta: 'Main via Scratch',
    helper: 'Stable gameplay version. Open in a new tab.',
    icon: Sparkles,
    href: SCRATCH_GAME_URL,
    external: true,
    disabled: !hasScratchGameUrl(),
  },
  {
    badge: 'PROGRESS ENABLED',
    title: 'CUKI Web — Integrated Version',
    description: 'Main langsung di website dan simpan progress permainanmu.',
    cta: 'Main di Website',
    helper: 'Connected to your profile and Supabase progress.',
    icon: Gamepad2,
    href: '/setup',
    external: false,
    disabled: false,
  },
] as const;

export function PlaySelectionPage(): JSX.Element {
  return (
    <KingdomShell eyebrow="Gameplay Gateway" title="Choose Your CUKI Version">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <Card
              key={option.title}
              className="border border-primary-gold/25 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_35%),linear-gradient(180deg,rgba(74,39,24,0.96),rgba(15,11,8,0.98))] shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
              variant="mahogany"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-full border border-primary-gold/25 bg-primary-gold/10 text-primary-gold">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">
                      {option.badge}
                    </p>
                    <h2 className="mt-2 font-display text-2xl text-primary-gold">{option.title}</h2>
                  </div>
                </div>
                <span className="rounded-full border border-primary-gold/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-gold">
                  {option.external ? 'Open new tab' : 'In site'}
                </span>
              </div>

              <p className="mt-5 text-sm leading-7 text-surface-parchment/78">{option.description}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-text-muted">
                {option.helper}
              </p>

              <div className="mt-6">
                {option.external ? (
                  hasScratchGameUrl() ? (
                    <Button asChild className="w-full" variant="primary">
                      <a href={option.href} rel="noreferrer" target="_blank">
                        {option.cta}
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </Button>
                  ) : (
                    <Button className="w-full" disabled variant="primary">
                      {option.cta}
                    </Button>
                  )
                ) : (
                  <Button asChild className="w-full" variant="primary">
                    <Link to={option.href}>{option.cta}</Link>
                  </Button>
                )}
              </div>

              {option.external && !hasScratchGameUrl() ? (
                <p className="mt-3 text-xs leading-5 text-text-muted">
                  SCRATCH_GAME_URL belum diisi di environment. Tambahkan URL Scratch untuk mengaktifkan versi klasik.
                </p>
              ) : null}
            </Card>
          );
        })}
      </section>
    </KingdomShell>
  );
}
