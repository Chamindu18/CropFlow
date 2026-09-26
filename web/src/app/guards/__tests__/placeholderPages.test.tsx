import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../providers';
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