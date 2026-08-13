import { Link } from 'react-router-dom';

import { KingdomShell } from '../components/layout/KingdomShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const tutorialSteps = [
  ['1', 'Lempar dadu', 'Angka dadu menentukan jumlah Oncak dengan warna sama yang harus diambil.'],
  [
    '2',
    'Pilih dari papan',
    'Pilih kelompok Oncak langsung pada papan. Bidak bergerak hanya pada garis horizontal dan vertikal.',
  ],
  [
    '3',
    'Selesaikan giliran',
    'Ambil kelompok yang dipilih. Jika masih ada tangkapan wajib dengan angka sama, lanjutkan; jika tidak, lempar lagi atau giliran berganti.',
  ],
] as const;

/** Static guided explanation of the already-canonical gameplay flow. */
export function TutorialPage(): JSX.Element {
  return (
    <KingdomShell eyebrow="Balai Pembelajaran" title="Tutorial CUKI">
      <p className="max-w-2xl text-base leading-7 text-text-muted">
        Pelajari ritme dasar permainan sebelum memasuki papan. Semua keputusan sah tetap ditentukan
        oleh aturan CUKI di dalam permainan.
      </p>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {tutorialSteps.map(([number, title, description]) => (
          <Card key={number} className="border border-primary-gold/25" variant="mahogany">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-gold font-bold text-text-dark">
              {number}
            </span>
            <h2 className="mt-5 font-display text-2xl font-semibold text-primary-gold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">{description}</p>
          </Card>
        ))}
      </ol>
      <Card className="mt-6 border border-primary-gold/30" variant="parchment">
        <h2 className="font-display text-2xl font-semibold">Siap memasuki papan?</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Mulai pertandingan lokal dan gunakan dadu serta papan sebagai pusat setiap aksi.
        </p>
        <Link className="mt-5 inline-flex" to="/setup">
          <Button>Mulai permainan</Button>
        </Link>
      </Card>
    </KingdomShell>
  );
}
