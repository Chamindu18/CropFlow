import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <div className="auth-loading" role="status" aria-label="Restoring authentication">
        <div className="auth-loading__spinner" />
        <p>Restoring session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app/marketplace" replace />;
  }

  return <>{children}</>;
}