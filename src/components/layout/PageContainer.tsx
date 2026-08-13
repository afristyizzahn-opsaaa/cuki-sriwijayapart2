import type { HTMLAttributes, ReactNode } from 'react';

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}

/** Centers page content within the approved 1280px grid container and responsive gutters. */
export function PageContainer({ children, className = '', ...props }: PageContainerProps): JSX.Element {
  return (
    <div {...props} className={`mx-auto w-full max-w-content px-4 md:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}
