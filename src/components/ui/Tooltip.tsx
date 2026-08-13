import { useId } from 'react';
import type { ReactNode } from 'react';

export interface TooltipProps {
  readonly children: ReactNode;
  readonly content: string;
}

/** A hover and keyboard-focus tooltip for controls that need short explanatory text. */
export function Tooltip({ children, content }: TooltipProps): JSX.Element {
  const tooltipId = useId();

  return (
    <span aria-describedby={tooltipId} className="group relative inline-flex">
      {children}
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-max -translate-x-1/2 rounded-button bg-bg-mahogany p-2 text-xs leading-4 text-text-light opacity-0 shadow-elevation-4 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
