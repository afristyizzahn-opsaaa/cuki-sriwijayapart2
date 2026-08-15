import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAccountStore } from '../stores/useAccountStore';
import { useGameStore } from '../stores/useGameStore';

type AuthMode = 'login' | 'register';

export function AuthPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeAccount = useAccountStore((state) => state.activeAccount);
  const loginAccount = useAccountStore((state) => state.loginAccount);
  const logoutAccount = useAccountStore((state) => state.logoutAccount);
  const registerAccount = useAccountStore((state) => state.registerAccount);
  const authProvider = useAccountStore((state) => state.authProvider);
  const isAuthLoading = useAccountStore((state) => state.isAuthLoading);
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'register' ? 'register' : 'login',
  );
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = useMemo(() => searchParams.get('next') ?? '/profile', [searchParams]);
  const controlsDisabled = isSubmitting || isAuthLoading;
  const authDescription =
    authProvider === 'supabase'
      ? 'Login dan progress tersambung ke Supabase.'
      : 'Mode lokal aktif sampai VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dipasang.';
  const submitLabel = isSubmitting ? 'Memproses...' : mode === 'register' ? 'Buat akun' : 'Masuk';

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      const result =
        mode === 'register'
          ? await registerAccount({ displayName, email, password })
          : await loginAccount({ email, password });

      setFeedback(result.message);
      if (result.ok && !result.requiresEmailConfirmation) {
        useGameStore.getState().restoreMatch();
        navigate(nextPath);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await logoutAccount();
    setFeedback('Akun keluar.');
  };

  const handleBack = (): void => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(nextPath === '/profile' ? '/home' : nextPath);
  };

  const switchMode = (nextMode: AuthMode): void => {
    setMode(nextMode);
    setFeedback(null);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120B08] px-5 py-10 text-text-light">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(241,200,76,0.18),transparent_30%),linear-gradient(180deg,#2b170f_0%,#120b08_40%,#0b1018_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10,15,25,0.05), rgba(10,15,25,0.44)), url('/assets/masjid-agung-sriwijaya.png')`,
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,25,0.12)_0%,rgba(10,15,25,0.46)_44%,rgba(10,15,25,0.78)_100%)]"
      />
      <PageContainer className="relative grid min-h-[calc(100vh-5rem)] place-items-center">
        <Card className="w-full max-w-2xl border border-primary-gold/35 bg-bg-dark-slate/92 shadow-elevation-4" variant="mahogany">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-amber">Akun CUKI</p>
              <h1 className="mt-2 font-display text-3xl text-primary-gold">Masuk dulu sebelum main</h1>
              <p className="mt-2 text-sm text-text-muted">{authDescription}</p>
            </div>
            {activeAccount ? (
              <Button disabled={controlsDisabled} onClick={() => void handleLogout()} variant="secondary">
                Logout
              </Button>
            ) : null}
          </div>

          {activeAccount ? (
            <section className="mt-6 rounded-card border border-primary-gold/30 bg-bg-dark-slate/60 p-4">
              <p className="text-sm text-text-muted">Akun aktif</p>
              <p className="mt-1 text-xl font-bold text-primary-gold">{activeAccount.displayName}</p>
              <p className="mt-2 text-sm text-text-light">
                Level {getAccountLevel(activeAccount.xp)} · {activeAccount.xp} XP · {activeAccount.wins} menang
              </p>
            </section>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              disabled={controlsDisabled}
              onClick={() => switchMode('login')}
              variant={mode === 'login' ? 'primary' : 'secondary'}
            >
              Login
            </Button>
            <Button
              disabled={controlsDisabled}
              onClick={() => switchMode('register')}
              variant={mode === 'register' ? 'primary' : 'secondary'}
            >
              Register
            </Button>
          </div>

          <div className="mt-7 grid gap-4">
            {mode === 'register' ? (
              <label className="grid gap-2 text-sm">
                Nama akun
                <input
                  className="min-h-11 rounded-button border border-primary-gold/30 bg-bg-dark-slate px-4 text-text-light outline-none ring-0 placeholder:text-text-muted focus:border-primary-amber disabled:opacity-60"
                  disabled={controlsDisabled}
                  placeholder="Misal: Sultan Palembang"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>
            ) : null}
            <label className="grid gap-2 text-sm">
              Email
              <input
                className="min-h-11 rounded-button border border-primary-gold/30 bg-bg-dark-slate px-4 text-text-light outline-none ring-0 placeholder:text-text-muted focus:border-primary-amber disabled:opacity-60"
                disabled={controlsDisabled}
                placeholder="nama@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Password
              <input
                className="min-h-11 rounded-button border border-primary-gold/30 bg-bg-dark-slate px-4 text-text-light outline-none ring-0 placeholder:text-text-muted focus:border-primary-amber disabled:opacity-60"
                disabled={controlsDisabled}
                placeholder="Minimal 4 karakter"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          </div>

          {feedback ? <p className="mt-5 text-sm text-primary-amber">{feedback}</p> : null}

          <div className="mt-7 flex flex-wrap gap-3">
            <Button disabled={controlsDisabled} onClick={() => void handleSubmit()}>
              {submitLabel}
            </Button>
            <Button disabled={controlsDisabled} onClick={handleBack} variant="secondary">
              Kembali
            </Button>
          </div>
          <p className="mt-5 text-xs leading-5 text-text-muted">
            Supabase menyimpan autentikasi, profil pemain, XP, kemenangan, saved match, dan progress
            Treasures. Password dikelola oleh Supabase Auth, bukan disimpan manual di tabel profil.
          </p>
        </Card>
      </PageContainer>
    </main>
  );
}

function getAccountLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}
