import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface BaseFieldProps {
  readonly error?: string;
  readonly label: string;
}

export interface TextFieldProps extends BaseFieldProps, InputHTMLAttributes<HTMLInputElement> {}

export interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {}

const controlClasses =
  'mt-2 min-h-11 w-full rounded-button border-2 border-bg-mahogany bg-surface-parchment px-4 text-text-dark outline-none transition placeholder:text-text-muted focus:border-primary-amber focus:ring-2 focus:ring-primary-amber/30 disabled:cursor-not-allowed disabled:opacity-50';

/** A labelled text input with an accessible inline validation message. */
export function TextField({ error, id, label, ...props }: TextFieldProps): JSX.Element {
  const errorId = error && id ? `${id}-error` : undefined;
  return (
    <label className="block text-sm font-medium leading-5 text-text-light" htmlFor={id}>
      {label}
      <input {...props} aria-describedby={errorId} aria-invalid={error ? true : undefined} id={id} className={controlClasses} />
      {error ? <span id={errorId} className="mt-2 block text-sm text-state-error">{error}</span> : null}
    </label>
  );
}

/** A labelled select control that shares the same touch, focus, and error treatment. */
export function SelectField({ children, error, id, label, ...props }: SelectFieldProps): JSX.Element {
  const errorId = error && id ? `${id}-error` : undefined;
  return (
    <label className="block text-sm font-medium leading-5 text-text-light" htmlFor={id}>
      {label}
      <select {...props} aria-describedby={errorId} aria-invalid={error ? true : undefined} id={id} className={controlClasses}>
        {children}
      </select>
      {error ? <span id={errorId} className="mt-2 block text-sm text-state-error">{error}</span> : null}
    </label>
  );
}
