import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { ReactNode } from 'react';

interface FarmerRouteProps {
  children: ReactNode;
}

export function FarmerRoute({ children }: FarmerRouteProps) {
  const { isAuthenticated, isRestoring, user } = useAuth();

  if (isRestoring) {
    return (
      <div className="auth-loading" role="status" aria-label="Restoring authentication">
        <div className="auth-loading__spinner" />
        <p>Restoring session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'FARMER') {
    return <Navigate to="/app/marketplace" replace />;
  }

  return <>{children}</>;
}