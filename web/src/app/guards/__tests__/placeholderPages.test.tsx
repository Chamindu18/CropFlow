import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../providers';
import LoginPage from '../../../routes/public/LoginPage';
import RegisterPage from '../../../routes/public/RegisterPage';
import MarketplaceBrowsePage from '../../../routes/authenticated/MarketplaceBrowsePage';
import ProfilePage from '../../../routes/authenticated/ProfilePage';
import MyListingsPage from '../../../routes/farmer/MyListingsPage';
import CreateListingPage from '../../../routes/farmer/CreateListingPage';
import ListingDetailPage from '../../../routes/farmer/ListingDetailPage';
import NotFoundPage from '../../../routes/NotFoundPage';
import { useAuth } from '../../../features/auth/hooks/useAuth';

vi.mock('../../../features/auth/hooks/useAuth');

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <MemoryRouter>
      <AppProviders>
        {component}
      </AppProviders>
    </MemoryRouter>
  );
};

describe('Placeholder Pages', () => {
  it('renders LoginPage', () => {
    render(<LoginPage />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders RegisterPage', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('renders MarketplaceBrowsePage', () => {
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
    renderWithProviders(<MarketplaceBrowsePage />);
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('renders ProfilePage', () => {
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
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders MyListingsPage', () => {
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
    renderWithProviders(<MyListingsPage />);
    expect(screen.getByText('My Listings')).toBeInTheDocument();
  });

  it('renders CreateListingPage', () => {
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
    renderWithProviders(<CreateListingPage />);
    expect(screen.getByText('Create Listing')).toBeInTheDocument();
  });

  it('renders ListingDetailPage', () => {
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
    renderWithProviders(<ListingDetailPage />);
    expect(screen.getByText('Listing Details')).toBeInTheDocument();
  });

  it('renders NotFoundPage', () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
  });
});

describe('Route safety', () => {
  it('does not access localStorage for tokens', () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, 'getItem');
    
    render(<LoginPage />);
    
    const localStorageCalls = localStorageSpy.mock.calls.filter(
      call => typeof call[0] === 'string' && (call[0].includes('token') || call[0].includes('auth') || call[0].includes('access'))
    );
    expect(localStorageCalls.length).toBe(0);
    localStorageSpy.mockRestore();
  });

  it('does not access sessionStorage for tokens', () => {
    const sessionStorageSpy = vi.spyOn(sessionStorage, 'getItem');
    
    render(<LoginPage />);
    
    const sessionStorageCalls = sessionStorageSpy.mock.calls.filter(
      call => typeof call[0] === 'string' && (call[0].includes('token') || call[0].includes('auth') || call[0].includes('access'))
    );
    expect(sessionStorageCalls.length).toBe(0);
    sessionStorageSpy.mockRestore();
  });
});