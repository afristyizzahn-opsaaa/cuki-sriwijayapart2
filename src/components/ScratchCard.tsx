import { AnimatePresence, motion } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';

import { useScratchCardStore, type ScratchCardReward } from '../store/useScratchCardStore';

const TRANSPARENT_ALPHA = 8;
const COVERAGE_CHECK_DELAY_MS = 140;
const SCRATCH_SOUND_DELAY_MS = 80;

interface RevealParticle {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly color: string;
}

export interface ScratchCardRevealEvent {
  readonly erasedPercentage: number;
  readonly reward: ScratchCardReward | undefined;
  readonly rewardClaimed: boolean;
}

export interface ScratchCardProps {
  readonly children: ReactNode;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly coverColor?: string;
  readonly coverText?: string;
  readonly brushSize?: number;
  /** Percentage of transparent pixels that automatically reveals the card. */
  readonly threshold?: number;
  readonly onReveal?: (event: ScratchCardRevealEvent) => void;
  readonly onScratchProgress?: (erasedPercentage: number) => void;
  /** Optional reward recorded once in the persistent ScratchCard Zustand store. */
  readonly reward?: ScratchCardReward;
  readonly disabled?: boolean;
  readonly scratchSound?: boolean;
  readonly revealSound?: boolean;
  /** Change this value to reset the opaque coating for a new card. */
  readonly resetToken?: string | number;
  readonly className?: string;
}

/**
 * A pointer-friendly canvas overlay with no game-rule assumptions. It can wrap
 * a board, prize, or any other React content and emits its result exactly once.
 */
export function ScratchCard({
  children,
  width = '100%',
  height = 360,
  coverColor = '#800020',
  coverText = 'Gores untuk membuka',
  brushSize = 30,
  threshold = 75,
  onReveal,
  onScratchProgress,
  reward,
  disabled = false,
  scratchSound = true,
  revealSound = true,
  resetToken,
  className,
}: ScratchCardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const revealTriggeredRef = useRef(false);
  const coverageTimerRef = useRef<number | null>(null);
  const lastScratchSoundRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [canvasRemoved, setCanvasRemoved] = useState(false);
  const [particles, setParticles] = useState<ReadonlyArray<RevealParticle>>([]);
  const claimScratchReward = useScratchCardStore((state) => state.claimScratchReward);

  const normalizedThreshold = clamp(threshold, 1, 100);
  const normalizedBrushSize = Math.max(2, brushSize);

  const drawCover = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
    canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, bounds.width, bounds.height);
    context.fillStyle = coverColor;
    context.fillRect(0, 0, bounds.width, bounds.height);

    const sheen = context.createLinearGradient(0, 0, bounds.width, bounds.height);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.17)');
    sheen.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
    sheen.addColorStop(1, 'rgba(10, 25, 47, 0.22)');
    context.fillStyle = sheen;
    context.fillRect(0, 0, bounds.width, bounds.height);

    if (coverText.trim()) {
      context.fillStyle = '#F3E5AB';
      context.font = `700 ${Math.max(15, Math.min(bounds.width * 0.055, 26))}px Georgia, serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(coverText, bounds.width / 2, bounds.height / 2);
    }
  }, [coverColor, coverText]);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (audioContextRef.current) {
      return audioContextRef.current;
    }

    const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextConstructor = window.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) {
      return null;
    }

    audioContextRef.current = new AudioContextConstructor();
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
      const audioContext = getAudioContext();
      if (!audioContext) {
        return;
      }

      if (audioContext.state === 'suspended') {
        void audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    },
    [getAudioContext],
  );

  const playScratchSound = useCallback(() => {
    if (!scratchSound) {
      return;
    }

    const now = performance.now();
    if (now - lastScratchSoundRef.current < SCRATCH_SOUND_DELAY_MS) {
      return;
    }
    lastScratchSoundRef.current = now;
    playTone(165, 0.045, 0.018, 'triangle');
  }, [playTone, scratchSound]);

  const playRevealSound = useCallback(() => {
    if (!revealSound) {
      return;
    }
    playTone(523.25, 0.16, 0.055, 'sine');
    window.setTimeout(() => playTone(659.25, 0.2, 0.055, 'sine'), 85);
    window.setTimeout(() => playTone(783.99, 0.28, 0.055, 'sine'), 170);
  }, [playTone, revealSound]);

  const triggerReveal = useCallback(
    (erasedPercentage: number) => {
      if (revealTriggeredRef.current) {
        return;
      }

      revealTriggeredRef.current = true;
      setRevealed(true);
      setParticles(createRevealParticles());
      playRevealSound();

      const rewardClaimed = reward ? claimScratchReward(reward) : false;
      onReveal?.({ erasedPercentage, reward, rewardClaimed });
    },
    [claimScratchReward, onReveal, playRevealSound, reward],
  );

  const calculateErasedPercentage = useCallback((): number => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || canvas.width === 0 || canvas.height === 0) {
      return 0;
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const totalPixels = canvas.width * canvas.height;
    const sampleStep = Math.max(1, Math.ceil(Math.sqrt(totalPixels / 20_000)));
    let transparentPixels = 0;
    let sampledPixels = 0;

    for (let y = 0; y < canvas.height; y += sampleStep) {
      for (let x = 0; x < canvas.width; x += sampleStep) {
        const alpha = imageData[(y * canvas.width + x) * 4 + 3] ?? 255;
        if (alpha <= TRANSPARENT_ALPHA) {
          transparentPixels += 1;
        }
        sampledPixels += 1;
      }
    }

    return sampledPixels === 0 ? 0 : (transparentPixels / sampledPixels) * 100;
  }, []);

  const checkCoverage = useCallback(() => {
    coverageTimerRef.current = null;
    if (revealTriggeredRef.current) {
      return;
    }

    const erasedPercentage = calculateErasedPercentage();
    onScratchProgress?.(erasedPercentage);
    if (erasedPercentage >= normalizedThreshold) {
      triggerReveal(erasedPercentage);
    }
  }, [calculateErasedPercentage, normalizedThreshold, onScratchProgress, triggerReveal]);

  const queueCoverageCheck = useCallback(() => {
    if (coverageTimerRef.current !== null) {
      return;
    }
    coverageTimerRef.current = window.setTimeout(checkCoverage, COVERAGE_CHECK_DELAY_MS);
  }, [checkCoverage]);

  const eraseStroke = useCallback(
    (start: { x: number; y: number }, end: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!context) {
        return;
      }

      context.save();
      context.globalCompositeOperation = 'destination-out';
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = normalizedBrushSize;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
      context.restore();
    },
    [normalizedBrushSize],
  );

  const pointerPosition = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (disabled || revealTriggeredRef.current) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const point = pointerPosition(event);
      isDrawingRef.current = true;
      lastPointRef.current = point;
      eraseStroke(point, point);
      playScratchSound();
      queueCoverageCheck();
    },
    [disabled, eraseStroke, playScratchSound, pointerPosition, queueCoverageCheck],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || disabled || revealTriggeredRef.current) {
        return;
      }

      event.preventDefault();
      const point = pointerPosition(event);
      eraseStroke(lastPointRef.current ?? point, point);
      lastPointRef.current = point;
      playScratchSound();
      queueCoverageCheck();
    },
    [disabled, eraseStroke, playScratchSound, pointerPosition, queueCoverageCheck],
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) {
      return;
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;

    if (coverageTimerRef.current !== null) {
      window.clearTimeout(coverageTimerRef.current);
      checkCoverage();
    }
  }, [checkCoverage]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const redraw = () => {
      if (!revealTriggeredRef.current) {
        drawCover();
      }
    };
    const observer = new ResizeObserver(redraw);
    observer.observe(container);
    redraw();
    return () => observer.disconnect();
  }, [drawCover]);

  useEffect(() => {
    revealTriggeredRef.current = false;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    setRevealed(false);
    setCanvasRemoved(false);
    setParticles([]);
    drawCover();
  }, [drawCover, resetToken]);

  useEffect(
    () => () => {
      if (coverageTimerRef.current !== null) {
        window.clearTimeout(coverageTimerRef.current);
      }
      void audioContextRef.current?.close();
    },
    [],
  );

  const containerStyle: CSSProperties = { width, height };

  return (
    <div
      ref={containerRef}
      className={`relative isolate overflow-hidden rounded-2xl border border-[#D4AF37]/45 bg-[#0A192F] shadow-[0_16px_38px_rgba(0,0,0,0.32)] ${className ?? ''}`}
      style={containerStyle}
    >
      <div className="absolute inset-0">{children}</div>

      {!canvasRemoved && (
        <canvas
          ref={canvasRef}
          aria-label={revealed ? 'Kartu telah terbuka' : 'Gores kartu untuk membuka hadiah'}
          className={`absolute inset-0 z-10 h-full w-full touch-none select-none transition-opacity duration-500 ${
            revealed ? 'pointer-events-none opacity-0' : 'cursor-crosshair opacity-100'
          }`}
          onPointerCancel={stopDrawing}
          onPointerDown={handlePointerDown}
          onPointerLeave={stopDrawing}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onTransitionEnd={(event) => {
            if (event.propertyName === 'opacity' && revealTriggeredRef.current) {
              setCanvasRemoved(true);
            }
          }}
        />
      )}

      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-2 w-2 rounded-full"
            style={{ backgroundColor: particle.color }}
            initial={{ opacity: 1, scale: 0.3, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: 0,
              scale: 1,
              x: particle.x,
              y: particle.y,
              rotate: particle.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function createRevealParticles(): ReadonlyArray<RevealParticle> {
  const colors = ['#D4AF37', '#F3E5AB', '#800020', '#FFFFFF'];
  return Array.from({ length: 20 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 20 + Math.random() * 0.25;
    const distance = 52 + Math.random() * 95;
    return {
      id: index,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotation: Math.round(Math.random() * 300 - 150),
      color: colors[index % colors.length] ?? '#D4AF37',
    };
  });
}
