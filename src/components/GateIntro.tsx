import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Button } from './ui/Button';
import { useAccountStore } from '../stores/useAccountStore';
import type { PlayerAccount } from '../types/account';

const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`;
const gateVideoUrl = asset('assets/cuki-gate-transition.mp4');

type GateIntroPhase = 'idle' | 'playing' | 'ended';

export function GateIntro(): JSX.Element {
  const gateVideoRef = useRef<HTMLVideoElement | null>(null);
  const hasStartedRef = useRef(false);
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GateIntroPhase>('idle');
  const [gateVideoReady, setGateVideoReady] = useState(false);
  const activeAccount = useAccountStore((state) => state.activeAccount);
  const isAuthLoading = useAccountStore((state) => state.isAuthLoading);
  const logoutAccount = useAccountStore((state) => state.logoutAccount);

  useEffect(() => {
    const video = gateVideoRef.current;

    if (!video || gateVideoReady) {
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setGateVideoReady(true);
    }
  }, [gateVideoReady]);

  useEffect(() => {
    if (phase !== 'playing' || !gateVideoReady) {
      return;
    }

    const video = gateVideoRef.current;
    if (!video) {
      return;
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        hasStartedRef.current = false;
        setPhase('idle');
        console.error('GATE VIDEO PLAYBACK FAILED', error);
      });
    }
  }, [gateVideoReady, phase]);

  const startVideo = (): void => {
    if (phase !== 'idle' || hasStartedRef.current) {
      return;
    }

    const video = gateVideoRef.current;

    if (!video) {
      return;
    }

    if (!gateVideoReady) {
      video.load();
    }

    hasStartedRef.current = true;
    setPhase('playing');
  };

  const accountLabel = getAccountLabel(activeAccount);
  const isPlaying = phase === 'playing';
  const showEntryUI = phase !== 'playing';
  const isEnded = phase === 'ended';

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-[#F6E8C8]">
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-screen w-screen object-cover"
        draggable="false"
        loading="eager"
        src={asset('assets/gerbang-palembang-background.png')}
        style={imageStyle(isPlaying, gateVideoReady)}
      />

      <video
        ref={gateVideoRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] h-screen w-screen object-cover"
        muted
        playsInline
        preload="auto"
        src={gateVideoUrl}
        style={videoStyle(isPlaying, gateVideoReady)}
        onCanPlay={() => setGateVideoReady(true)}
        onLoadedData={() => setGateVideoReady(true)}
        onEnded={() => {
          setPhase('ended');
          navigate('/home');
        }}
        onError={(event) => console.error('GATE VIDEO FAILED', event.currentTarget.currentSrc)}
      />

      <div
        aria-hidden={!showEntryUI}
        className="absolute inset-0 z-10 flex items-center justify-center px-4 transition-[opacity,transform] duration-500 ease-out sm:px-6"
        style={entryUiStyle(showEntryUI)}
      >
        <div className="relative w-full max-w-[56rem]">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(231,197,107,0.12)_0%,rgba(18,10,6,0)_62%),linear-gradient(180deg,rgba(10,5,2,0.18),rgba(10,5,2,0.45))]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(8,4,2,0.34)_100%)]" />

          <section className="mx-auto flex max-w-[38rem] flex-col items-center text-center text-[#F4E8D0]">
            <p
              className="font-display text-[clamp(0.82rem,1vw,0.98rem)] uppercase tracking-[0.42em] text-[#E7C56B]"
              style={revealStyle(0, showEntryUI)}
            >
              MASUK KE KERAJAAN
            </p>

            <div
              aria-hidden="true"
              className="mt-3 flex w-full max-w-[18rem] items-center justify-center gap-4"
              style={revealStyle(70, showEntryUI)}
            >
              <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(231,197,107,0.55),rgba(231,197,107,0.18))]" />
              <span className="h-2.5 w-2.5 rotate-45 bg-[#E7C56B]/85 shadow-[0_0_16px_rgba(231,197,107,0.3)]" />
              <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(231,197,107,0.18),rgba(231,197,107,0.55),transparent)]" />
            </div>

            {isAuthLoading ? (
              <p
                className="mt-6 text-[clamp(0.95rem,1.2vw,1.05rem)] tracking-[0.12em] text-[#F4E8D0]/70"
                style={revealStyle(120, showEntryUI)}
              >
                Memeriksa akun...
              </p>
            ) : accountLabel ? (
              <>
                <p
                  className="mt-6 font-display text-[clamp(1rem,1.35vw,1.2rem)] text-[#F4E8D0]/85"
                  style={revealStyle(120, showEntryUI)}
                >
                  Selamat datang kembali,
                </p>
                <p
                  className="mt-2 font-display text-[clamp(1.7rem,2.5vw,2.8rem)] leading-tight text-[#F4E8D0] drop-shadow-[0_0_14px_rgba(231,197,107,0.12)]"
                  style={revealStyle(190, showEntryUI)}
                >
                  {accountLabel}
                </p>
              </>
            ) : (
              <p
                className="mt-6 max-w-[30rem] text-[clamp(0.95rem,1.15vw,1.05rem)] leading-7 text-[#F4E8D0]/78"
                style={revealStyle(120, showEntryUI)}
              >
                Gerbang terbuka menuju jejak Sriwijaya. Silakan masuk dan lanjutkan perjalananmu.
              </p>
            )}

            {isEnded ? (
              <div style={revealStyle(260, showEntryUI)}>
                <Button
                  asChild
                  className="mt-8 min-h-[60px] min-w-[280px] rounded-[16px] border border-[#F0D37A]/40 bg-[linear-gradient(135deg,#ebcb74_0%,#d5a63a_50%,#c79022_100%)] px-8 text-[clamp(0.95rem,1.1vw,1.08rem)] font-semibold tracking-[0.18em] text-[#2A160D] shadow-[0_16px_42px_rgba(0,0,0,0.38)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_18px_50px_rgba(0,0,0,0.44),0_0_22px_rgba(231,197,107,0.16)]"
                >
                  <Link to="/home">
                    MEMASUKI KERAJAAN
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            ) : (
              <Button
                className="mt-8 min-h-[60px] min-w-[280px] rounded-[16px] border border-[#F0D37A]/32 bg-[linear-gradient(135deg,#ebcb74_0%,#d5a63a_50%,#c79022_100%)] px-8 text-[clamp(0.95rem,1.1vw,1.08rem)] font-semibold tracking-[0.16em] text-[#2A160D] shadow-[0_16px_42px_rgba(0,0,0,0.38)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_18px_50px_rgba(0,0,0,0.44),0_0_22px_rgba(231,197,107,0.16)]"
                onClick={startVideo}
                style={revealStyle(260, showEntryUI)}
                type="button"
              >
                KLIK UNTUK MASUK
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}

            <div
              className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm md:text-[0.95rem]"
              style={revealStyle(360, showEntryUI)}
            >
              {isAuthLoading ? null : accountLabel ? (
                <Button
                  className="px-0 text-[0.92rem] tracking-[0.18em] text-[#F4E8D0]/72 hover:text-[#E7C56B]"
                  onClick={() => void logoutAccount()}
                  variant="text"
                >
                  Keluar
                </Button>
              ) : (
                <>
                  <div style={revealStyle(0, showEntryUI)}>
                    <Button
                      asChild
                      className="px-0 text-[0.92rem] tracking-[0.18em] text-[#F4E8D0]/82 hover:text-[#E7C56B]"
                      variant="text"
                    >
                      <Link to="/auth?mode=login">Masuk</Link>
                    </Button>
                  </div>
                  <span className="text-[#E7C56B]/55">·</span>
                  <div style={revealStyle(0, showEntryUI)}>
                    <Button
                      asChild
                      className="px-0 text-[0.92rem] tracking-[0.18em] text-[#F4E8D0]/82 hover:text-[#E7C56B]"
                      variant="text"
                    >
                      <Link to="/auth?mode=register">Daftar</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function getAccountLabel(
  account: PlayerAccount | null,
): string | null {
  if (!account) {
    return null;
  }

  const username = account.username.trim();
  if (username.length > 0) {
    return username;
  }

  const displayName = account.displayName.trim();
  if (displayName.length > 0) {
    return displayName;
  }

  const email = account.email.trim();
  if (email.length > 0) {
    const prefix = email.split('@')[0]?.trim();
    return prefix && prefix.length > 0 ? prefix : email;
  }

  return null;
}

function revealStyle(delayMs: number, visible: boolean): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(10px)',
    transitionDelay: visible ? `${delayMs}ms` : '0ms',
    transitionProperty: 'opacity, transform',
    transitionDuration: '650ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  };
}

function entryUiStyle(visible: boolean): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(10px)',
    pointerEvents: visible ? 'auto' : 'none',
  };
}

function imageStyle(isPlaying: boolean, gateVideoReady: boolean): CSSProperties {
  const revealVideo = isPlaying && gateVideoReady;

  return {
    objectPosition: '50% 52%',
    opacity: revealVideo ? 0 : 1,
    transform: isPlaying ? 'translate3d(-1.4%, -2.8%, 0) scale(1.11)' : 'translate3d(0, 0, 0) scale(1)',
    transition:
      'opacity 460ms ease-in-out 110ms, transform 720ms cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'opacity, transform',
  };
}

function videoStyle(isPlaying: boolean, gateVideoReady: boolean): CSSProperties {
  return {
    opacity: isPlaying && gateVideoReady ? 1 : 0,
    transition: 'opacity 460ms ease-in-out 110ms',
    willChange: 'opacity',
  };
}
