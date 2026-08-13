import { cloneElement, isValidElement } from 'react';
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

interface ButtonBaseProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly variant?: ButtonVariant;
}

export type NativeButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    readonly asChild?: false;
  };

export interface SlottedButtonProps extends ButtonBaseProps {
  readonly asChild: true;
  readonly children: ReactElement<{ readonly className?: string }>;
}

export type ButtonProps = NativeButtonProps | SlottedButtonProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-gold text-text-dark shadow-elevation-1 hover:bg-primary-amber active:translate-y-px disabled:bg-text-muted',
  secondary:
    'border-2 border-primary-gold bg-bg-mahogany text-text-light hover:border-primary-amber hover:text-primary-amber disabled:border-text-muted',
  text: 'text-primary-gold hover:text-primary-amber disabled:text-text-muted',
};

/** A keyboard-accessible action button with the approved touch target and focus treatment. */
export function Button(props: ButtonProps): JSX.Element {
  if (props.asChild === true) {
    const { children, className = '', variant = 'primary' } = props;
    const classes = getButtonClasses(variant, className);

    if (!isValidElement(children)) {
      throw new Error('Button with asChild requires a valid React element child.');
    }

    return cloneElement(children, {
      className: `${classes} ${children.props.className ?? ''}`,
    });
  }

  const { children, className = '', variant = 'primary', type = 'button', ...buttonProps } = props;
  const classes = getButtonClasses(variant, className);

  return (
    <button {...buttonProps} type={type} className={classes}>
      {children}
    </button>
  );
}

function getButtonClasses(variant: ButtonVariant, className: string): string {
  return `inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-button px-4 py-2 text-sm font-semibold tracking-wide transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-amber disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`;
}
