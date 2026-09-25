import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PublicRoute } from '../PublicRoute';
import { useAuth } from '../../../features/auth/hooks/useAuth';

vi.mock('../../../features/auth/hooks/useAuth');

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      {component}
    </MemoryRouter>
  );
};

describe('PublicRoute', () => {
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
      <PublicRoute>
        <div data-testid="public">Public</div>
      </PublicRoute>
    );

    expect(screen.getByText('Restoring session...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders children when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isRestoring: false,
      user: null,
      accessToken: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(
      <PublicRoute>
        <div data-testid="public">Public</div>
      </PublicRoute>
    );

    expect(screen.getByTestId('public')).toBeInTheDocument();
  });

  it('redirects to marketplace when authenticated', () => {
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
      <PublicRoute>
        <div data-testid="public">Public</div>
      </PublicRoute>
    );

    expect(screen.queryByTestId('public')).not.toBeInTheDocument();
  });
});