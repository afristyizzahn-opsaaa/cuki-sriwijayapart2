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
import { cukiAudioManager } from '../services/cukiAudioManager';
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
    const video = gateVideoRef.current;
    if (!video) {
      return;
    }

    cukiAudioManager.bindGateVideo(video);

    return () => {
      cukiAudioManager.releaseGateVideo(video);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing' || !gateVideoReady) {
      return;
    }

    const video = gateVideoRef.current;
    if (!video) {
      return;
    }

    video.muted = true;
    video.volume = 1;

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
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-black text-[#F6E8C8] md:h-screen md:w-screen md:overflow-hidden">
      <img
        alt=""
        aria-hidden="true"
        className="gate-background-image pointer-events-none fixed inset-0 z-0 h-screen w-screen object-cover"
        draggable="false"
        loading="eager"
        src={asset('assets/gerbang-palembang-background.png')}
        style={imageStyle(isPlaying, gateVideoReady)}
      />

      <video
        ref={gateVideoRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] h-screen w-screen object-cover"
        playsInline
        preload="auto"
        src={gateVideoUrl}
        style={videoStyle(isPlaying, gateVideoReady, isVideoExiting)}
        onCanPlay={() => setGateVideoReady(true)}
        onLoadedData={() => setGateVideoReady(true)}
        onPlay={() => cukiAudioManager.handleGateVideoPlay()}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          cukiAudioManager.handleGateVideoProgress(video.currentTime, video.duration);

          if (!Number.isFinite(video.duration) || video.duration <= videoExitFadeSeconds) {
            return;
          }

          if (video.duration - video.currentTime <= videoExitFadeSeconds) {
            setIsVideoExiting(true);
          }
        }}
        onEnded={() => {
          cukiAudioManager.handleGateVideoEnded();
          setPhase('ended');
          navigate('/home', { state: { fromGateIntro: true } });
        }}
        onError={(event) => console.error('GATE VIDEO FAILED', event.currentTarget.currentSrc)}
      />

      <div
        aria-hidden={!showEntryUI}
        className="relative z-10 flex min-h-[100dvh] items-start justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 transition-[opacity,transform] duration-500 ease-out sm:px-6 md:absolute md:inset-0 md:items-start md:px-4 md:pb-0 md:pt-0"
        style={entryUiStyle(showEntryUI)}
      >
        <div className="relative flex h-full w-full max-w-[86rem] items-stretch justify-center">
          <div aria-hidden="true" className="gate-overlay-light" />

          <section className="gate-titah relative flex min-h-[100dvh] w-full max-w-[78rem] flex-col justify-start gap-6 px-4 py-[clamp(1.2rem,2.8vh,1.9rem)] text-[#F4E8D0] sm:px-6 md:h-full md:justify-start md:gap-0 md:px-0 md:py-[clamp(2.2rem,4.4vh,3.2rem)]">
            <header
              className="gate-title-block flex flex-col items-center pt-[clamp(0.55rem,1.4vh,1rem)] text-center md:mx-auto md:max-w-[760px] md:pt-[clamp(1rem,2vh,1.45rem)] md:text-center"
              style={revealStyle(0, showEntryUI)}
            >
              <p className="gate-royal-label text-[clamp(0.66rem,0.8vw,0.78rem)] uppercase tracking-[0.48em] text-[#E3C77A]/84 sm:tracking-[0.66em] md:text-[12px] md:font-medium md:tracking-[0.36em] lg:text-[13px]">
                KESULTANAN PALEMBANG DARUSSALAM
              </p>
              <div aria-hidden="true" className="gate-title-line mt-4 md:mt-5" />
              <p className="gate-display-copy mt-4 text-[clamp(1.05rem,1.9vw,1.55rem)] font-semibold normal-case tracking-[0.01em] text-[#f8edda] sm:tracking-[0.01em] md:mt-6 md:max-w-[760px] md:text-[56px] md:leading-[0.88] lg:max-w-[820px] lg:text-[64px] xl:text-[68px]">
                Assalamu&apos;alaikum,
                <br />
                Pengembara.
              </p>
              <p className="gate-body-copy mt-[18px] max-w-[620px] text-[clamp(0.96rem,4.3vw,1.18rem)] leading-[1.58] text-[#F4E8D0]/86 sm:text-[clamp(1rem,1.28vw,1.18rem)] md:mt-5 md:max-w-[430px] md:text-[15px] md:leading-[1.45] lg:max-w-[430px] lg:text-[16px]">
                Sebuah perjalanan menuju warisan Palembang Darussalam menantimu.
              </p>
            </header>

            <div aria-hidden="true" className="hidden md:block md:h-[170px] lg:h-[150px] xl:h-[180px]" />

            <section className="gate-footer relative self-center text-center">
              <div className="mx-auto flex w-full max-w-[min(760px,92vw)] flex-col items-center md:max-w-[760px] lg:max-w-[820px]">
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
                  aria-hidden="true"
                  className="gate-card mt-[clamp(1.1rem,3vh,1.9rem)] w-full max-w-[min(780px,88vw)] md:mt-0 md:max-w-[610px] lg:max-w-[720px] xl:max-w-[780px]"
                  style={revealStyle(540, showEntryUI)}
                >
                  <div className="gate-card-frame relative rounded-[26px] border border-[#c9a456]/70 bg-[rgba(12,8,5,0.72)] px-[clamp(1.1rem,2.55vw,2.5rem)] py-[clamp(1.5rem,3.1vw,2.55rem)] shadow-[0_0_0_1px_rgba(201,162,77,0.24),0_18px_48px_rgba(0,0,0,0.48)] backdrop-blur-[3px] sm:px-[clamp(1.5rem,2.55vw,2.5rem)] sm:py-[clamp(1.85rem,3.1vw,2.55rem)] md:px-9 md:py-7 lg:px-10 lg:py-8">
                    <div className="gate-card-crown absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#E3C77A]/60 bg-[#090604] px-3 py-1 text-[#E3C77A] shadow-[0_0_18px_rgba(201,162,77,0.18)]">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div aria-hidden="true" className="gate-card-center-top" />

                    <div className="flex flex-col items-center gap-4 text-center md:gap-6">
                      <div className="flex items-center gap-2 text-[#E3C77A] sm:gap-4 md:gap-4">
                        <span className="gate-panel-spark" aria-hidden="true" />
                        <p className="gate-display-copy text-[clamp(1.28rem,5.2vw,2.15rem)] font-semibold text-[#f6ead4] sm:text-[clamp(1.7rem,2.35vw,2.15rem)] md:text-[26px] lg:text-[28px]">
                          Selamat Datang, Pengembara!
                        </p>
                        <span className="gate-panel-spark" aria-hidden="true" />
                      </div>

                      <p className="gate-body-copy max-w-[620px] text-[clamp(0.95rem,4vw,1.08rem)] leading-[1.65] text-[#F4E8D0]/88 sm:text-[clamp(1rem,1.08vw,1.08rem)] md:mt-3 md:max-w-[490px] md:text-[14px] md:leading-[1.55] lg:text-[15px]">
                        Kamu akan menjelajahi jejak sejarah, mengungkap kisah leluhur, dan menemukan
                        harta karun budaya yang tersembunyi di tanah Palembang Darussalam.
                      </p>

                      <div className="mt-2 grid w-full grid-cols-1 gap-4 pt-5 sm:flex sm:flex-row sm:items-center md:mt-7 md:grid md:grid-cols-4 md:gap-5 md:pt-0">
                        <div className="flex-1 text-center">
                          <BookOpenText className="mx-auto h-12 w-12 text-[#E3C77A] drop-shadow-[0_0_12px_rgba(201,162,77,0.26)] md:h-[44px] md:w-[44px] lg:h-[48px] lg:w-[48px]" />
                          <p className="gate-body-copy mt-3 text-[clamp(0.92rem,0.98vw,1rem)] text-[#E3C77A]/95 md:text-[0.95rem] lg:text-[1rem]">
                            Jelajahi
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <ScrollText className="mx-auto h-12 w-12 text-[#E3C77A] drop-shadow-[0_0_12px_rgba(201,162,77,0.26)] md:h-[44px] md:w-[44px] lg:h-[48px] lg:w-[48px]" />
                          <p className="gate-body-copy mt-3 text-[clamp(0.92rem,0.98vw,1rem)] text-[#E3C77A]/95 md:text-[0.95rem] lg:text-[1rem]">
                            Ungkap Kisah
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <Archive className="mx-auto h-12 w-12 text-[#E3C77A] drop-shadow-[0_0_12px_rgba(201,162,77,0.26)] md:h-[44px] md:w-[44px] lg:h-[48px] lg:w-[48px]" />
                          <p className="gate-body-copy mt-3 text-[clamp(0.92rem,0.98vw,1rem)] text-[#E3C77A]/95 md:text-[0.95rem] lg:text-[1rem]">
                            Temukan Harta
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <Crown className="mx-auto h-12 w-12 text-[#E3C77A] drop-shadow-[0_0_12px_rgba(201,162,77,0.26)] md:h-[44px] md:w-[44px] lg:h-[48px] lg:w-[48px]" />
                          <p className="gate-body-copy mt-3 text-[clamp(0.92rem,0.98vw,1rem)] text-[#E3C77A]/95 md:text-[0.95rem] lg:text-[1rem]">
                            Jaga Warisan
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="gate-actions mt-[clamp(1.2rem,2.9vh,1.7rem)] flex flex-col items-center gap-4 pb-2 md:mt-[22px] md:pb-0"
                  style={revealStyle(760, showEntryUI)}
                >
                  {isEnded ? (
                    <Button
                      asChild
                      className="gate-cta group inline-flex min-h-[82px] min-w-full items-center justify-center rounded-[18px] border border-[#ECC265]/80 bg-[linear-gradient(180deg,rgba(112,76,22,0.92),rgba(47,29,8,0.96))] px-6 py-5 shadow-[inset_0_1px_0_rgba(255,235,184,0.22),0_8px_30px_rgba(0,0,0,0.35),0_0_24px_rgba(202,151,54,0.12)] transition duration-[280ms] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,235,184,0.28),0_10px_34px_rgba(0,0,0,0.38),0_0_28px_rgba(202,151,54,0.18)] sm:min-w-[min(560px,88vw)] sm:px-8 md:min-h-[64px] md:min-w-[600px] md:px-10 lg:min-h-[68px] lg:min-w-[640px] lg:px-12"
                    >
                      <Link to="/home">
                        <span className="flex flex-col items-center text-center">
                          <span className="gate-cta-title gate-royal-label text-[clamp(0.98rem,4.5vw,1.3rem)] font-bold uppercase tracking-[0.04em] text-[#FFE7A6] sm:text-[clamp(1.05rem,1.45vw,1.3rem)] md:text-[1.1rem] lg:text-[1.15rem] xl:text-[1.2rem]">
                            BISMILLAH, MASUK GERBANG
                          </span>
                          <span className="gate-body-copy mt-2 text-[clamp(0.8rem,3.4vw,0.92rem)] text-[#F4E8D0]/88 md:text-[0.95rem] lg:text-[0.98rem]">
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
                      className="gate-cta group relative inline-flex min-h-[82px] min-w-full items-center justify-center rounded-[18px] border border-[#ECC265]/80 bg-[linear-gradient(180deg,rgba(112,76,22,0.92),rgba(47,29,8,0.96))] px-6 py-5 shadow-[inset_0_1px_0_rgba(255,235,184,0.22),0_8px_30px_rgba(0,0,0,0.35),0_0_24px_rgba(202,151,54,0.12)] transition duration-[280ms] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,235,184,0.28),0_10px_34px_rgba(0,0,0,0.38),0_0_28px_rgba(202,151,54,0.18)] sm:min-w-[min(560px,88vw)] sm:px-8 md:min-h-[64px] md:min-w-[600px] md:px-10 lg:min-h-[68px] lg:min-w-[640px] lg:px-12"
                      onClick={startVideo}
                      type="button"
                    >
                      <span className="flex flex-col items-center text-center">
                        <span className="gate-cta-title gate-royal-label text-[clamp(0.98rem,4.5vw,1.3rem)] font-bold uppercase tracking-[0.04em] text-[#FFE7A6] sm:text-[clamp(1.05rem,1.45vw,1.3rem)] md:text-[1.1rem] lg:text-[1.15rem] xl:text-[1.2rem]">
                          BISMILLAH, MASUK GERBANG
                        </span>
                        <span className="gate-body-copy mt-2 text-[clamp(0.8rem,3.4vw,0.92rem)] text-[#F4E8D0]/88 md:text-[0.95rem] lg:text-[0.98rem]">
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
                        className="gate-secondary gate-body-copy px-0 text-[0.76rem] font-normal tracking-[0.16em] text-[#EEDBB9]/78 hover:text-[#E3C77A]"
                        onClick={() => void logoutAccount()}
                        variant="text"
                      >
                        Dikenali sebagai {' '}
                        <span className="font-semibold tracking-[0.18em] text-[#F3E0BE]">
                          {accountLabel.toUpperCase()}
                        </span>
                      </Button>
                    ) : (
                      <>
                        <Button
                          asChild
                          className="gate-secondary gate-body-copy px-0 text-[0.76rem] font-normal tracking-[0.16em] text-[#EEDBB9]/78 hover:text-[#E3C77A]"
                          variant="text"
                        >
                          <Link to="/auth?mode=login&next=%2F">Masuk</Link>
                        </Button>
                        <span className="text-[#E3C77A]/50">·</span>
                        <Button
                          asChild
                          className="gate-secondary gate-body-copy px-0 text-[0.76rem] font-normal tracking-[0.16em] text-[#EEDBB9]/78 hover:text-[#E3C77A]"
                          variant="text"
                        >
                          <Link to="/auth?mode=register&next=%2F">Daftar</Link>
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
