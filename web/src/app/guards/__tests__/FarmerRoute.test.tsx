import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FarmerRoute } from '../FarmerRoute';
import { useAuth } from '../../../features/auth/hooks/useAuth';

vi.mock('../../../features/auth/hooks/useAuth');

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <MemoryRouter initialEntries={['/app/farmer/listings']}>
      {component}
    </MemoryRouter>
  );
};

describe('FarmerRoute', () => {
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
      <FarmerRoute>
        <div data-testid="farmer">Farmer</div>
      </FarmerRoute>
    );

    expect(screen.getByText('Restoring session...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
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
      <FarmerRoute>
        <div data-testid="farmer">Farmer</div>
      </FarmerRoute>
    );

    expect(screen.queryByTestId('farmer')).not.toBeInTheDocument();
  });

  it('redirects to marketplace when user is not FARMER', () => {
    const roles = ['BUYER', 'TRANSPORTER', 'ADMIN'];

    roles.forEach((role) => {
      vi.resetAllMocks();
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isRestoring: false,
        user: { userId: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', phone: null, role, status: 'ACTIVE', emailVerified: true },
        accessToken: 'token',
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refresh: vi.fn(),
      });

      const { unmount } = renderWithRouter(
        <FarmerRoute>
          <div data-testid="farmer">Farmer</div>
        </FarmerRoute>
      );

      expect(screen.queryByTestId('farmer')).not.toBeInTheDocument();
      unmount();
    });
  });

  it('renders children when user is FARMER', () => {
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
      <FarmerRoute>
        <div data-testid="farmer">Farmer</div>
      </FarmerRoute>
    );

    expect(screen.getByTestId('farmer')).toBeInTheDocument();
  });
});