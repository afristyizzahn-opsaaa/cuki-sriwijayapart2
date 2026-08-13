import { Navigate, useLocation } from 'react-router-dom';

import { useAccountStore } from '../../stores/useAccountStore';

export function RequireAccount({ children }: { readonly children: JSX.Element }): JSX.Element {
  const activeAccount = useAccountStore((state) => state.activeAccount);
  const isAuthLoading = useAccountStore((state) => state.isAuthLoading);
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg-dark-slate px-5 text-center text-text-light">
        <p className="font-display text-2xl text-primary-gold">Memulihkan sesi CUKI...</p>
      </main>
    );
  }

  if (!activeAccount) {
    return <Navigate replace to={`/auth?next=${encodeURIComponent(location.pathname)}`} />;
  }

  return children;
}
