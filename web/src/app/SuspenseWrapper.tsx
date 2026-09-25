import { Suspense } from 'react';

export function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="auth-loading" role="status"><div className="auth-loading__spinner" /><p>Loading...</p></div>}>
      {children}
    </Suspense>
  );
}