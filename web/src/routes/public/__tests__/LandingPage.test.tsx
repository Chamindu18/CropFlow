import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../../app/providers';
import LandingPage from '../LandingPage';

const renderLandingPage = () => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppProviders>
        <LandingPage />
      </AppProviders>
    </MemoryRouter>
  );
};

describe('LandingPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders main headline', () => {
    renderLandingPage();
    expect(screen.getByRole('heading', { name: /Connecting Agriculture, Empowering Farmers/i })).toBeInTheDocument();
  });

  it('renders hero description', () => {
    renderLandingPage();
    expect(screen.getByText(/CropFlow is the digital marketplace/i)).toBeInTheDocument();
  });

  it('renders navbar with CropFlow branding', () => {
    renderLandingPage();
    const nav = screen.getByRole('navigation', { name: /Main navigation/i });
    expect(within(nav).getByText('CropFlow')).toBeInTheDocument();
  });

  it('renders navbar navigation links', () => {
    renderLandingPage();
    const nav = screen.getByRole('navigation', { name: /Main navigation/i });
    expect(within(nav).getByRole('link', { name: /Marketplace/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /How It Works/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /About/i })).toBeInTheDocument();
  });

  it('renders navbar Sign In link', () => {
    renderLandingPage();
    const nav = screen.getByRole('navigation', { name: /Main navigation/i });
    expect(within(nav).getByRole('link', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('renders navbar Get Started CTA', () => {
    renderLandingPage();
    const nav = screen.getByRole('navigation', { name: /Main navigation/i });
    expect(within(nav).getByRole('link', { name: /Get Started/i })).toBeInTheDocument();
  });

  it('renders Explore Marketplace CTA in hero', () => {
    renderLandingPage();
    const hero = screen.getByRole('region', { name: /Connecting Agriculture, Empowering Farmers/i });
    const cta = within(hero).getByRole('link', { name: /Explore Marketplace/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/app/marketplace');
  });

  it('renders Get Started CTA in hero', () => {
    renderLandingPage();
    const hero = screen.getByRole('region', { name: /Connecting Agriculture, Empowering Farmers/i });
    const cta = within(hero).getByRole('link', { name: /Get Started/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/register');
  });

  it('renders value proposition section', () => {
    renderLandingPage();
    expect(screen.getByRole('heading', { name: /Why Choose CropFlow/i })).toBeInTheDocument();
    expect(screen.getByText(/Sell Your Harvest/i)).toBeInTheDocument();
    expect(screen.getByText(/Discover Products/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect with Buyers/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Listings/i)).toBeInTheDocument();
  });

  it('renders How It Works section', () => {
    renderLandingPage();
    expect(screen.getByRole('heading', { name: /How It Works/i })).toBeInTheDocument();
    expect(screen.getByText(/Create Your Account/i)).toBeInTheDocument();
    expect(screen.getByText(/List or Discover/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect and Transact/i)).toBeInTheDocument();
  });

  it('renders Marketplace Preview section', () => {
    renderLandingPage();
    expect(screen.getByRole('heading', { name: /Marketplace Preview/i })).toBeInTheDocument();
    expect(screen.getByText(/Fresh Organic Tomatoes/i)).toBeInTheDocument();
    expect(screen.getByText(/Sweet Corn - Bulk/i)).toBeInTheDocument();
    expect(screen.getByText(/Crisp Lettuce Heads/i)).toBeInTheDocument();
  });

  it('renders Explore Full Marketplace CTA', () => {
    renderLandingPage();
    const cta = screen.getByRole('link', { name: /Explore Full Marketplace/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/app/marketplace');
  });

  it('renders final CTA section', () => {
    renderLandingPage();
    expect(screen.getByRole('heading', { name: /Ready to Join CropFlow/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Get Started Free/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse Marketplace/i })).toBeInTheDocument();
  });

  it('renders footer with branding', () => {
    renderLandingPage();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText('CropFlow')).toBeInTheDocument();
    expect(within(footer).getByText(/digital marketplace connecting farmers/i)).toBeInTheDocument();
  });

  it('renders footer navigation links', () => {
    renderLandingPage();
    expect(screen.getByRole('link', { name: /Privacy Policy/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Terms of Service/i })).toBeInTheDocument();
  });

  it('renders footer authentication links', () => {
    renderLandingPage();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: /Sign In/i })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: /Get Started/i })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: /Forgot Password/i })).toBeInTheDocument();
  });

  it('renders footer copyright', () => {
    renderLandingPage();
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} CropFlow`))).toBeInTheDocument();
  });

  it('has accessible navigation structure', () => {
    renderLandingPage();
    const nav = screen.getByRole('navigation', { name: /Main navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it('has proper heading hierarchy', () => {
    renderLandingPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Connecting Agriculture/);
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(4);
  });

  it('mobile menu toggle is accessible', () => {
    renderLandingPage();
    const toggle = screen.getByRole('button', { name: /Toggle navigation menu/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'landing-nav-mobile');
  });
});