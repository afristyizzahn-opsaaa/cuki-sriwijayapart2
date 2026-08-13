import { useState } from 'react';

import { KingdomShell } from '../components/layout/KingdomShell';
import { Card } from '../components/ui/Card';

const landmarks = [
  {
    id: 'palembang',
    label: 'Palembang',
    detail: 'Pusat Kadatuan Sriwijaya dan jalur perdagangan Sungai Musi.',
  },
  {
    id: 'kedukan',
    label: 'Kedukan Bukit',
    detail: 'Prasasti penting yang merekam perjalanan awal Sriwijaya.',
  },
  {
    id: 'malaka',
    label: 'Selat Malaka',
    detail: 'Lintasan laut yang menghubungkan perdagangan Nusantara dan Asia.',
  },
] as const;

/** Static informational map; pins only reveal historical context. */
export function MapPage(): JSX.Element {
  const [activeLandmark, setActiveLandmark] =
    useState<(typeof landmarks)[number]['id']>('palembang');
  const active = landmarks.find((landmark) => landmark.id === activeLandmark) ?? landmarks[0];

  return (
    <KingdomShell eyebrow="Peta Kerajaan" title="Jejak Sriwijaya">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section
          aria-label="Static Sriwijaya map"
          className="relative min-h-[420px] overflow-hidden rounded-card border-2 border-primary-gold/40 bg-bg-mahogany shadow-elevation-3"
        >
          <div
            aria-hidden="true"
            className="absolute inset-6 rounded-card border border-primary-gold/25 bg-bg-dark-slate/40"
          />
          <p className="absolute left-8 top-8 font-display text-2xl text-primary-gold">
            Nusantara Maritim
          </p>
          {landmarks.map((landmark, index) => (
            <button
              key={landmark.id}
              aria-pressed={activeLandmark === landmark.id}
              className={`absolute grid h-11 w-11 place-items-center rounded-full border-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-amber ${activeLandmark === landmark.id ? 'border-primary-amber bg-primary-amber text-text-dark' : 'border-primary-gold bg-bg-dark-slate text-primary-gold'}`}
              style={{ left: `${20 + index * 28}%`, top: `${56 - index * 14}%` }}
              type="button"
              onClick={() => setActiveLandmark(landmark.id)}
            >
              {index + 1}
            </button>
          ))}
        </section>
        <Card className="border border-primary-gold/30" variant="parchment">
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Lokasi terpilih
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold">{active?.label}</h2>
          <p className="mt-4 text-sm leading-7 text-text-muted">{active?.detail}</p>
          <p className="mt-8 text-xs leading-5 text-text-muted">
            Peta ini bersifat informatif; tidak memuat quest, level, atau sistem unlock.
          </p>
        </Card>
      </div>
    </KingdomShell>
  );
}
