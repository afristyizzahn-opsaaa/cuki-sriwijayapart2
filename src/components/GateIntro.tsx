import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  BookOpenText,
  Crown,
  Pointer,
  ScrollText,
  Sparkles,
} from 'lucide-react';

import { Button } from './ui/Button';
import { useAccountStore } from '../stores/useAccountStore';
import type { PlayerAccount } from '../types/account';

const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`;
const gateVideoUrl = asset('assets/cuki-gate-transition.mp4');
const videoExitFadeDurationMs = 1250;
const videoExitFadeSeconds = videoExitFadeDurationMs / 1000;

type GateIntroPhase = 'idle' | 'playing' | 'ended';

export function GateIntro(): JSX.Element {
  const gateVideoRef = useRef<HTMLVideoElement | null>(null);
  const hasStartedRef = useRef(false);
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GateIntroPhase>('idle');
  const [gateVideoReady, setGateVideoReady] = useState(false);
  const [isVideoExiting, setIsVideoExiting] = useState(false);
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
    video.currentTime = 0;
    setIsVideoExiting(false);
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
        style={videoStyle(isPlaying, gateVideoReady, isVideoExiting)}
        onCanPlay={() => setGateVideoReady(true)}
        onLoadedData={() => setGateVideoReady(true)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;

          if (!Number.isFinite(video.duration) || video.duration <= videoExitFadeSeconds) {
            return;
          }

          if (video.duration - video.currentTime <= videoExitFadeSeconds) {
            setIsVideoExiting(true);
          }
        }}
        onEnded={() => {
          setPhase('ended');
          navigate('/home', { state: { fromGateIntro: true } });
        }}
        onError={(event) => console.error('GATE VIDEO FAILED', event.currentTarget.currentSrc)}
      />

      <div
        aria-hidden={!showEntryUI}
        className="absolute inset-0 z-10 flex items-start justify-center px-4 transition-[opacity,transform] duration-500 ease-out sm:px-6"
        style={entryUiStyle(showEntryUI)}
      >
        <div className="relative flex h-full w-full max-w-[86rem] items-stretch justify-center">
          <div aria-hidden="true" className="gate-overlay-light" />

          <section className="gate-titah relative flex h-full w-full max-w-[78rem] flex-col justify-between px-4 py-[clamp(1.2rem,2.8vh,1.9rem)] text-[#F4E8D0] sm:px-6">
            <header
              className="gate-title-block flex flex-col items-center pt-[clamp(0.55rem,1.4vh,1rem)] text-center"
              style={revealStyle(0, showEntryUI)}
            >
              <p className="text-[clamp(0.68rem,0.8vw,0.78rem)] uppercase tracking-[0.66em] text-[#E3C77A]/84">
                KESULTANAN PALEMBANG DARUSSALAM
              </p>
              <div aria-hidden="true" className="gate-title-line mt-4" />
              <p className="mt-4 font-display text-[clamp(1.15rem,1.9vw,1.55rem)] font-medium tracking-[0.34em] text-[#F2E8D5]/94">
                GERBANG DARUSSALAM
              </p>
            </header>

            <div aria-hidden="true" className="flex-1" />

            <section className="gate-footer relative self-center text-center">
              <div className="mx-auto flex w-full max-w-[min(760px,92vw)] flex-col items-center">
                <div
                  aria-hidden="true"
                  className="gate-divider-line flex w-full items-center gap-4"
                  style={revealStyle(160, showEntryUI)}
                >
                  <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(201,162,77,0.76),rgba(201,162,77,0.14))]" />
                  <span className="gate-songket-mark relative h-3 w-8">
                    <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[#C9A24D]/60 bg-[#C9A24D]/10" />
                  </span>
                  <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(201,162,77,0.14),rgba(201,162,77,0.76),transparent)]" />
                </div>

                <div
                  className="mt-[clamp(1.15rem,2.8vh,1.7rem)] flex w-full flex-col items-center text-center"
                  style={revealStyle(300, showEntryUI)}
                >
                  <div className="gate-salutation-wrap max-w-[680px]">
                    <p className="gate-salutation max-w-[560px] font-display text-[clamp(2.9rem,4.8vw,4.95rem)] font-medium leading-[0.98] text-[#FFF4DC]">
                      Assalamu&apos;alaikum, Pengembara.
                    </p>
                  </div>
                  <div className="gate-subtitle-wrap mt-4 max-w-[680px]">
                    <p className="gate-subtitle max-w-[600px] text-[clamp(1rem,1.28vw,1.18rem)] leading-[1.58] text-[#F4E8D0]/86">
                      Sebuah perjalanan menuju warisan Palembang Darussalam menantimu.
                    </p>
                  </div>
                </div>

                <div
                  aria-hidden="true"
                  className="gate-card mt-[clamp(1.3rem,3vh,1.9rem)] w-full max-w-[min(780px,88vw)]"
                  style={revealStyle(540, showEntryUI)}
                >
                  <div className="gate-card-frame relative rounded-[26px] border border-[#E3C77A]/84 bg-[rgba(5,3,2,0.78)] px-[clamp(1.5rem,2.55vw,2.5rem)] py-[clamp(1.85rem,3.1vw,2.55rem)] shadow-[0_0_0_1px_rgba(201,162,77,0.24),0_18px_48px_rgba(0,0,0,0.48)] backdrop-blur-[3px]">
                    <div className="gate-card-crown absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#E3C77A]/60 bg-[#090604] px-3 py-1 text-[#E3C77A] shadow-[0_0_18px_rgba(201,162,77,0.18)]">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div aria-hidden="true" className="gate-card-center-top" />

                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="flex items-center gap-4 text-[#E3C77A]">
                        <span className="gate-panel-spark" aria-hidden="true" />
                        <p className="font-display text-[clamp(1.7rem,2.35vw,2.15rem)] text-[#F2E8D5]">
                          Selamat Datang, Pengembara!
                        </p>
                        <span className="gate-panel-spark" aria-hidden="true" />
                      </div>

                      <p className="max-w-[620px] text-[clamp(1rem,1.08vw,1.08rem)] leading-[1.65] text-[#F4E8D0]/88">
                        Kamu akan menjelajahi jejak sejarah, mengungkap kisah leluhur, dan menemukan
                        harta karun budaya yang tersembunyi di tanah Palembang Darussalam.
                      </p>

                      <div className="mt-2 flex w-full items-center gap-4 pt-5">
                        <div className="flex-1 text-center">
                          <BookOpenText className="mx-auto h-12 w-12 text-[#E3C77A] drop-shadow-[0_0_12px_rgba(201,162,77,0.26)]" />
                          <p className="mt-3 text-[clamp(0.92rem,0.98vw,1rem)] text-[#E3C77A]/95">
                            Jelajahi
                          </p>
                        </div>
                        <div className="h-16 w-px bg-[#E3C77A]/18" />
                        <div className="flex-1 text-center">
                          <ScrollText className="mx-auto h-12 w-12 text-[#E3C77A] drop-shadow-[0_0_12px_rgba(201,162,77,0.26)]" />
                          <p className="mt-3 text-[clamp(0.92rem,0.98vw,1rem)] text-[#E3C77A]/95">
                            Ungkap Kisah
                          </p>
                        </div>
                        <div className="h-16 w-px bg-[#E3C77A]/18" />
                        <div className="flex-1 text-center">
                          <Archive className="mx-auto h-12 w-12 text-[#E3C77A] drop-shadow-[0_0_12px_rgba(201,162,77,0.26)]" />
                          <p className="mt-3 text-[clamp(0.92rem,0.98vw,1rem)] text-[#E3C77A]/95">
                            Temukan Harta
                          </p>
                        </div>
                        <div className="h-16 w-px bg-[#E3C77A]/18" />
                        <div className="flex-1 text-center">
                          <Crown className="mx-auto h-12 w-12 text-[#E3C77A] drop-shadow-[0_0_12px_rgba(201,162,77,0.26)]" />
                          <p className="mt-3 text-[clamp(0.92rem,0.98vw,1rem)] text-[#E3C77A]/95">
                            Jaga Warisan
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="gate-actions mt-[clamp(1.2rem,2.9vh,1.7rem)] flex flex-col items-center gap-4"
                  style={revealStyle(760, showEntryUI)}
                >
                  {isEnded ? (
                    <Button
                      asChild
                      className="gate-cta group inline-flex min-h-[90px] min-w-[min(560px,88vw)] items-center justify-center rounded-[18px] border border-[#ECC265]/80 bg-[linear-gradient(180deg,rgba(112,76,22,0.92),rgba(47,29,8,0.96))] px-8 py-5 shadow-[inset_0_1px_0_rgba(255,235,184,0.22),0_8px_30px_rgba(0,0,0,0.35),0_0_24px_rgba(202,151,54,0.12)] transition duration-[280ms] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,235,184,0.28),0_10px_34px_rgba(0,0,0,0.38),0_0_28px_rgba(202,151,54,0.18)]"
                    >
                      <Link to="/home">
                        <span className="flex flex-col items-center text-center">
                          <span className="gate-cta-title font-display text-[clamp(1.05rem,1.45vw,1.3rem)] font-bold uppercase tracking-[0.04em] text-[#FFE7A6]">
                            BISMILLAH, MASUK GERBANG
                          </span>
                          <span className="mt-2 text-[clamp(0.82rem,0.95vw,0.92rem)] text-[#F4E8D0]/88">
                            Klik untuk memulai perjalanan
                          </span>
                        </span>
                        <span className="absolute bottom-4 right-5 inline-flex items-center gap-1 text-[#FFE7A6]">
                          <Pointer className="gate-cta-pointer h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      className="gate-cta group relative inline-flex min-h-[90px] min-w-[min(560px,88vw)] items-center justify-center rounded-[18px] border border-[#ECC265]/80 bg-[linear-gradient(180deg,rgba(112,76,22,0.92),rgba(47,29,8,0.96))] px-8 py-5 shadow-[inset_0_1px_0_rgba(255,235,184,0.22),0_8px_30px_rgba(0,0,0,0.35),0_0_24px_rgba(202,151,54,0.12)] transition duration-[280ms] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,235,184,0.28),0_10px_34px_rgba(0,0,0,0.38),0_0_28px_rgba(202,151,54,0.18)]"
                      onClick={startVideo}
                      type="button"
                    >
                      <span className="flex flex-col items-center text-center">
                        <span className="gate-cta-title font-display text-[clamp(1.05rem,1.45vw,1.3rem)] font-bold uppercase tracking-[0.04em] text-[#FFE7A6]">
                          BISMILLAH, MASUK GERBANG
                        </span>
                        <span className="mt-2 text-[clamp(0.82rem,0.95vw,0.92rem)] text-[#F4E8D0]/88">
                          Klik untuk memulai perjalanan
                        </span>
                      </span>
                      <span className="absolute bottom-4 right-5 inline-flex items-center gap-1 text-[#FFE7A6]">
                        <Pointer className="gate-cta-pointer h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </Button>
                  )}

                  <div
                    className="flex flex-wrap items-center justify-center gap-3 text-[0.76rem] font-normal tracking-[0.18em] text-[#F4E8D0]/78"
                    style={revealStyle(920, showEntryUI)}
                  >
                    {isAuthLoading ? null : accountLabel ? (
                      <Button
                        className="gate-secondary px-0 text-[0.76rem] font-normal tracking-[0.16em] text-[#F4E8D0]/78 hover:text-[#E3C77A]"
                        onClick={() => void logoutAccount()}
                        variant="text"
                      >
                        Dikenali sebagai {accountLabel}
                      </Button>
                    ) : (
                      <>
                        <Button
                          asChild
                          className="gate-secondary px-0 text-[0.76rem] font-normal tracking-[0.16em] text-[#F4E8D0]/78 hover:text-[#E3C77A]"
                          variant="text"
                        >
                          <Link to="/auth?mode=login">Masuk</Link>
                        </Button>
                        <span className="text-[#E3C77A]/70">·</span>
                        <Button
                          asChild
                          className="gate-secondary px-0 text-[0.76rem] font-normal tracking-[0.16em] text-[#F4E8D0]/78 hover:text-[#E3C77A]"
                          variant="text"
                        >
                          <Link to="/auth?mode=register">Daftar</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

function getAccountLabel(account: PlayerAccount | null): string | null {
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
    transform: isPlaying
      ? 'translate3d(-1.4%, -2.8%, 0) scale(1.11)'
      : 'translate3d(0, 0, 0) scale(1)',
    transition: 'opacity 460ms ease-in-out 110ms, transform 720ms cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'opacity, transform',
  };
}

function videoStyle(
  isPlaying: boolean,
  gateVideoReady: boolean,
  isVideoExiting: boolean,
): CSSProperties {
  return {
    opacity: isPlaying && gateVideoReady && !isVideoExiting ? 1 : 0,
    transition: isVideoExiting
      ? `opacity ${videoExitFadeDurationMs}ms ease-out`
      : 'opacity 460ms ease-in-out 110ms',
    willChange: 'opacity',
  };
}
