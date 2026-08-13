import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'parchment' | 'mahogany';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly children: ReactNode;
  readonly variant?: CardVariant;
  readonly as?: 'article' | 'section' | 'div';
}

const variantClasses: Record<CardVariant, string> = {
  parchment: 'bg-surface-parchment text-text-dark',
  mahogany: 'bg-bg-mahogany text-text-light',
};

/** A responsive elevated surface using the approved 20px card radius and spacing tokens. */
export function Card({ as: Element = 'article', children, className = '', variant = 'parchment', ...props }: CardProps): JSX.Element {
  return (
    <Element {...props} className={`rounded-card p-5 shadow-elevation-2 md:p-6 ${variantClasses[variant]} ${className}`}>
      {children}
    </Element>
  );
}
