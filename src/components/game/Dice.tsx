import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import type { DiceValue } from '../../types/game';

export interface DiceProps {
  readonly disabled: boolean;
  readonly isRolling: boolean;
  readonly onRoll: () => void;
  readonly value: DiceValue | null;
}

const faceDots: Record<DiceValue, ReadonlyArray<number>> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

/** A board-game dice control whose value is resolved outside the pure engine. */
export function Dice({ disabled, isRolling, onRoll, value }: DiceProps): JSX.Element {
  const [rollingFace, setRollingFace] = useState<DiceValue>(1);
  const visibleValue = isRolling ? rollingFace : value ?? 1;

  useEffect(() => {
    if (!isRolling) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setRollingFace((face) => (face === 6 ? 1 : ((face + 1) as DiceValue)));
    }, 90);
    return () => window.clearInterval(timer);
  }, [isRolling]);

  return (
    <motion.button
      aria-label={isRolling ? 'Dice rolling' : value === null ? 'Roll dice' : `Roll dice, current value ${value}`}
      className="grid h-20 w-20 place-items-center rounded-[18px] border-4 border-primary-gold bg-surface-parchment p-2 text-text-dark shadow-elevation-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-amber disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || isRolling}
      type="button"
      animate={isRolling ? { rotate: [0, -10, 10, -7, 0], scale: [1, 1.08, 0.96, 1.04, 1], y: [-6, 6, -3, 0] } : { rotate: 0, scale: 1, y: 0 }}
      transition={isRolling ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      onClick={onRoll}
    >
      <span aria-hidden="true" className="grid h-full w-full grid-cols-3 grid-rows-3 gap-1">
        {Array.from({ length: 9 }, (_, index) => index + 1).map((position) => (
          <span key={position} className="grid place-items-center">
            {faceDots[visibleValue].includes(position) ? <span className="h-2.5 w-2.5 rounded-full bg-bg-mahogany shadow-sm" /> : null}
          </span>
        ))}
      </span>
      <span className="sr-only">{isRolling ? 'Rolling' : value === null ? 'Roll dice' : `Result ${value}`}</span>
    </motion.button>
  );
}
