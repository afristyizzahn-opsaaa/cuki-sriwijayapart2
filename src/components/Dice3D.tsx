import { motion } from 'framer-motion';

import type { DiceValue } from '../types/game';

export interface Dice3DProps {
  readonly disabled: boolean;
  readonly isRolling: boolean;
  readonly value: DiceValue | null;
  readonly onRoll: () => void;
}

/** A CSS 3D D6: the settled rotation always brings the resolved face to the front. */
export function Dice3D({ disabled, isRolling, value, onRoll }: Dice3DProps): JSX.Element {
  const visibleValue = value ?? 1;
  const settledRotation = FACE_ROTATIONS[visibleValue];

  return (
    <button
      aria-label={
        isRolling
          ? 'Dice rolling'
          : value === null
            ? 'Roll dice'
            : `Roll dice, current value ${value}`
      }
      className="relative grid h-20 w-20 shrink-0 place-items-center rounded-button border border-primary-gold/60 bg-bg-dark-slate/40 shadow-elevation-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-amber disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || isRolling}
      style={{ perspective: 600 }}
      type="button"
      onClick={onRoll}
    >
      <motion.span
        aria-hidden="true"
        className="relative block h-12 w-12"
        style={{ transformStyle: 'preserve-3d' }}
        animate={
          isRolling
            ? {
                rotateX: [settledRotation.x, settledRotation.x + 360, settledRotation.x + 720],
                rotateY: [settledRotation.y, settledRotation.y + 450, settledRotation.y + 900],
                rotateZ: [0, 180, 360],
                scale: [1, 1.08, 1],
              }
            : { rotateX: settledRotation.x, rotateY: settledRotation.y, rotateZ: 0, scale: 1 }
        }
        transition={
          isRolling
            ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
            : { duration: 0.35, ease: 'easeOut' }
        }
      >
        {DICE_FACES.map((face) => (
          <DiceFace key={face.value} transform={face.transform} value={face.value} />
        ))}
      </motion.span>
      <span className="sr-only">{isRolling ? 'Rolling' : `Dice result ${visibleValue}`}</span>
    </button>
  );
}

const FACE_ROTATIONS: Record<DiceValue, { readonly x: number; readonly y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
};

const DICE_FACES: ReadonlyArray<{ readonly value: DiceValue; readonly transform: string }> = [
  { value: 1, transform: 'translateZ(24px)' },
  { value: 2, transform: 'rotateY(90deg) translateZ(24px)' },
  { value: 3, transform: 'rotateX(90deg) translateZ(24px)' },
  { value: 4, transform: 'rotateX(-90deg) translateZ(24px)' },
  { value: 5, transform: 'rotateY(-90deg) translateZ(24px)' },
  { value: 6, transform: 'rotateY(180deg) translateZ(24px)' },
];

function DiceFace({
  value,
  transform,
}: {
  readonly value: DiceValue;
  readonly transform: string;
}): JSX.Element {
  const dots: Record<DiceValue, ReadonlyArray<number>> = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };
  return (
    <span
      className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1.5 rounded-lg border border-primary-gold/70 bg-surface-parchment p-1.5 shadow-inner [backface-visibility:hidden]"
      style={{ transform }}
    >
      {Array.from({ length: 9 }, (_, index) => index + 1).map((position) => (
        <span key={position} className="grid place-items-center">
          {dots[value].includes(position) ? (
            <span className="h-2.5 w-2.5 rounded-full bg-bg-mahogany" />
          ) : null}
        </span>
      ))}
    </span>
  );
}
