import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly as?: 'h1' | 'h2' | 'h3';
}

/** A reusable title block with responsive approved heading and body typography. */
export function SectionHeader({ actions, as: Heading = 'h2', description, title }: SectionHeaderProps): JSX.Element {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <Heading className="font-display text-[22px] font-semibold leading-[1.3] text-text-light md:text-[28px]">{title}</Heading>
        {description ? <p className="mt-2 text-sm leading-6 text-text-muted md:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
