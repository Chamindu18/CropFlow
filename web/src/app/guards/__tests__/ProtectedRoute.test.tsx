import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../../features/auth/hooks/useAuth';

vi.mock('../../../features/auth/hooks/useAuth');

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      {component}
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state when isRestoring is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isRestoring: true,
      user: null,
      accessToken: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected">Protected</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Restoring session...')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isRestoring: false,
      user: { userId: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', phone: null, role: 'FARMER', status: 'ACTIVE', emailVerified: true },
      accessToken: 'token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="protected">Protected</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('redirects when user role not in allowedRoles', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isRestoring: false,
      user: { userId: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', phone: null, role: 'BUYER', status: 'ACTIVE', emailVerified: true },
      accessToken: 'token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['FARMER']}>
        <div data-testid="protected">Protected</div>
      </ProtectedRoute>
    );

    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('allows access when user role in allowedRoles', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isRestoring: false,
      user: { userId: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', phone: null, role: 'FARMER', status: 'ACTIVE', emailVerified: true },
      accessToken: 'token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
        <div data-testid="protected">Protected</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });
});