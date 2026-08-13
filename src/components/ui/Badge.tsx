import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone = 'default' | 'success' | 'error' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly children: ReactNode;
  readonly tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  default: 'bg-primary-gold text-text-dark',
  success: 'bg-state-success text-text-light',
  error: 'bg-state-error text-text-light',
  info: 'bg-state-info text-text-light',
};

/** A compact status label using approved feedback colors. */
export function Badge({ children, className = '', tone = 'default', ...props }: BadgeProps): JSX.Element {
  return (
    <span {...props} className={`inline-flex items-center rounded-full p-2 text-xs font-semibold leading-4 ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}
