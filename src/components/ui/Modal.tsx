import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';

export interface ModalProps {
  readonly children: ReactNode;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly closeLabel?: string;
}

/** A dialog shell that supports Escape and backdrop dismissal without owning application state. */
export function Modal({ children, closeLabel = 'Close dialog', isOpen, onClose, title }: ModalProps): JSX.Element | null {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" onMouseDown={onClose}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        role="dialog"
        className="max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-popup bg-surface-parchment p-4 text-text-dark shadow-elevation-4 md:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-[22px] font-semibold leading-[1.3] md:text-[28px]">
            {title}
          </h2>
          <button
            aria-label={closeLabel}
            className="grid min-h-11 min-w-11 place-items-center rounded-button text-xl leading-none text-text-dark transition hover:bg-primary-amber/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-amber"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="mt-4 md:mt-6">{children}</div>
      </section>
    </div>
  );
}
