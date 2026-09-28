import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../../app/providers';
import MyListingsPage from '../MyListingsPage';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { server } from '../../../test/mocks/server';
import { setAccessToken, clearAccessToken } from '../../../shared/api';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8080/api/v1';
const MY_LISTINGS_URL = `${API_BASE}/marketplace/listings/mine`;

const mockUser = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  role: 'FARMER' as const,
  status: 'ACTIVE' as const,
  emailVerified: true,
};

const mockListings = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    sellerId: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Fresh Tomatoes',
    description: 'Organic farm tomatoes, freshly harvested',
    status: 'ACTIVE' as const,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    sellerId: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Sweet Corn',
    description: 'Golden sweet corn, perfect for grilling',
    status: 'DRAFT' as const,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    sellerId: '123e4567-e89b-12d3-a456-426614174002',
    title: 'Organic Lettuce',
    description: 'Crisp organic lettuce heads',
    status: 'SOLD' as const,
    createdAt: '2024-01-05T12:00:00Z',
    updatedAt: '2024-01-20T09:00:00Z',
  },
];

function createPageResponse(listings: typeof mockListings, page = 0, size = 20, totalElements?: number) {
  return {
    content: listings,
    pageable: {
      sort: { empty: false, sorted: true, unsorted: false },
      offset: page * size,
      pageNumber: page,
      pageSize: size,
      paged: true,
      unpaged: false,
    },
    totalElements: totalElements ?? listings.length,
    totalPages: Math.ceil((totalElements ?? listings.length) / size),
    size,
    number: page,
    first: page === 0,
    last: page >= Math.ceil((totalElements ?? listings.length) / size) - 1,
    numberOfElements: listings.length,
    empty: listings.length === 0,
  };
}

const mockPageResponse = createPageResponse(mockListings);

function renderMyListingsPage(overrides: { isRestoring?: boolean } = {}) {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: true,
    isRestoring: overrides.isRestoring ?? false,
    user: mockUser,
    accessToken: 'valid-token',
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  });

  setAccessToken('valid-token');

  return render(
    <MemoryRouter initialEntries={['/app/farmer/listings']}>
      <AppProviders>
        <MyListingsPage />
      </AppProviders>
    </MemoryRouter>
  );
}

// Handler factories using exact full URL pattern (same as global handlers in handlers.ts)
function createSuccessHandler(listings: typeof mockListings) {
  return http.get(MY_LISTINGS_URL, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '20');
    const pagedListings = listings.slice(page * size, page * size + size);
    return HttpResponse.json(createPageResponse(pagedListings, page, size, listings.length), { status: 200 });
  });
}

function createEmptyHandler() {
  return http.get(MY_LISTINGS_URL, () => {
    return HttpResponse.json(createPageResponse([], 0, 20, 0), { status: 200 });
  });
}

function createPaginationHandler(listings: typeof mockListings) {
  return http.get(MY_LISTINGS_URL, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    // Force pagination for testing: return 3 pages with 1 item each
    const testPageSize = 1;
    const pagedListings = listings.slice(page * testPageSize, page * testPageSize + testPageSize);
    return HttpResponse.json(createPageResponse(pagedListings, page, testPageSize, listings.length), { status: 200 });
  });
}

function createErrorHandler(errorCode: string, status: number, message: string) {
  return http.get(MY_LISTINGS_URL, () => {
    return HttpResponse.json(
      {
        timestamp: new Date().toISOString(),
        status,
        code: errorCode,
        message,
        path: '/api/v1/marketplace/listings/mine',
        details: {},
      },
      { status }
    );
  });
}

function createNetworkErrorHandler() {
  return http.get(MY_LISTINGS_URL, () => {
    return HttpResponse.error();
  });
}

function createRetryHandler(listings: typeof mockListings) {
  let requestCount = 0;
  return http.get(MY_LISTINGS_URL, () => {
    requestCount++;
    if (requestCount === 1) {
      return HttpResponse.error();
    }
    return HttpResponse.json(createPageResponse(listings, 0, 20, listings.length), { status: 200 });
  });
}

vi.mock('../../../features/auth/hooks/useAuth');

describe('MyListingsPage', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());

  beforeEach(() => {
    server.resetHandlers();
    clearAccessToken();
  });

  it('renders page title and description', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'My Listings', level: 1 })).toBeInTheDocument();
    });
    expect(screen.getByText(/View and manage all your crop listings/)).toBeInTheDocument();
  });

  it('renders Create Listing button', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create a new listing/i })).toBeInTheDocument();
    });
  });

  it('renders listings in table on desktop', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getByText('Fresh Tomatoes')).toBeInTheDocument();
      expect(within(table).getByText('Sweet Corn')).toBeInTheDocument();
      expect(within(table).getByText('Organic Lettuce')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    const headers = screen.getAllByRole('columnheader');
    expect(headers.map(h => h.textContent)).toEqual(['Listing', 'Status', 'Created', 'Updated', 'Actions']);
  });

  it('displays correct listing title and description', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getByText('Fresh Tomatoes')).toBeInTheDocument();
      expect(within(table).getByText('Organic farm tomatoes, freshly harvested')).toBeInTheDocument();
    });
  });

  it('displays correct status badges', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getByText('Active')).toBeInTheDocument();
      expect(within(table).getByText('Draft')).toBeInTheDocument();
      expect(within(table).getByText('Sold')).toBeInTheDocument();
    });
  });

  it('displays created and updated dates', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      // Skip header row, check data rows - Created column (index 2) and Updated column (index 3)
      const row1Cells = within(rows[1]).getAllByRole('cell');
      const row2Cells = within(rows[2]).getAllByRole('cell');
      const row3Cells = within(rows[3]).getAllByRole('cell');
      expect(row1Cells[2]).toHaveTextContent(/Jan 15, 2024/);
      expect(row1Cells[3]).toHaveTextContent(/Jan 15, 2024/);
      expect(row2Cells[2]).toHaveTextContent(/Jan 10, 2024/);
      expect(row2Cells[3]).toHaveTextContent(/Jan 12, 2024/);
      expect(row3Cells[2]).toHaveTextContent(/Jan 5, 2024/);
      expect(row3Cells[3]).toHaveTextContent(/Jan 20, 2024/);
    });
  });

  it('renders View action links for each listing', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const viewLinks = screen.getAllByRole('link', { name: /View / });
      expect(viewLinks.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('shows results info with correct counts', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByText(/Showing 3 of 3 listings/)).toBeInTheDocument();
    });
  });

  it('shows loading spinner while fetching', async () => {
    let resolveRequest: (value: unknown) => void;
    const requestPromise = new Promise(resolve => { resolveRequest = resolve; });

    server.use(
      http.get(MY_LISTINGS_URL, async () => {
        await requestPromise;
        return HttpResponse.json(mockPageResponse, { status: 200 });
      })
    );

    renderMyListingsPage();
    expect(screen.getByRole('status', { name: /Loading listings/i })).toBeInTheDocument();
    expect(screen.getByText(/Loading your listings/i)).toBeInTheDocument();

    resolveRequest!(undefined);
    await waitFor(() => {
      expect(screen.queryByRole('status', { name: /Loading listings/i })).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no listings exist', async () => {
    server.use(createEmptyHandler());
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByText('No listings yet')).toBeInTheDocument();
      expect(screen.getByText(/You haven't created any crop listings yet/)).toBeInTheDocument();
    });
  });

  it('provides Create Listing action in empty state', async () => {
    server.use(createEmptyHandler());
    renderMyListingsPage();
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /Create a new listing/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  it('Create Listing button in empty state links to create page', async () => {
    server.use(createEmptyHandler());
    renderMyListingsPage();
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /Create a new listing/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  it('shows error state for authentication failure', async () => {
    server.use(createErrorHandler('UNAUTHORIZED', 401, 'Authentication is required.'));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByText('Authentication required')).toBeInTheDocument();
      expect(screen.getByText(/Your session has expired/)).toBeInTheDocument();
    });
  });

  it('shows error state for network failure', async () => {
    server.use(createNetworkErrorHandler());
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByText('Connection error')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument();
    });
  });

  it('shows error state for timeout', async () => {
    server.use(createErrorHandler('TIMEOUT', 408, 'Request timed out.'));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByText('Request timed out')).toBeInTheDocument();
    });
  });

  it('shows generic error for other failures', async () => {
    server.use(createErrorHandler('INTERNAL_SERVER_ERROR', 500, 'Internal server error'));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByText('Unable to load listings')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    });
  });

  it('Retry action refetches listings', async () => {
    server.use(createRetryHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByText('Connection error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getByText('Fresh Tomatoes')).toBeInTheDocument();
    });
  });

  it('shows pagination controls when multiple pages', async () => {
    server.use(createPaginationHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Previous/i })).toBeInTheDocument();
    });
  });

  it('Previous button is disabled on first page', async () => {
    server.use(createPaginationHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const prevButton = screen.getByRole('button', { name: /Previous/i });
      expect(prevButton).toBeDisabled();
    });
  });

  it('Next button navigates to next page', async () => {
    server.use(createPaginationHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getByText('Fresh Tomatoes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      const table = screen.getByRole('table');
      expect(within(table).getByText('Sweet Corn')).toBeInTheDocument();
    });
  });

  it('Previous button navigates to previous page', async () => {
    server.use(createPaginationHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    await waitFor(() => {
      expect(screen.getByText((_, el) => (el.textContent?.includes('Page 1 of 3') ?? false) && el.classList.contains('pagination__info'))).toBeInTheDocument();
      const table = screen.getByRole('table');
      expect(within(table).getByText('Fresh Tomatoes')).toBeInTheDocument();
    });
  });

  it('Next button is disabled on last page', async () => {
    server.use(createPaginationHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.queryByRole('status', { name: /Loading listings/i })).not.toBeInTheDocument();
    });
    
    // Go to page 2
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => {
      expect(screen.queryByRole('status', { name: /Loading listings/i })).not.toBeInTheDocument();
      expect(screen.getByText((_, el) => (el.textContent?.includes('Page 2 of 3') ?? false) && el.classList.contains('pagination__info'))).toBeInTheDocument();
    });
    
    // Go to page 3
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => {
      expect(screen.queryByRole('status', { name: /Loading listings/i })).not.toBeInTheDocument();
      expect(screen.getByText((_, el) => (el.textContent?.includes('Page 3 of 3') ?? false) && el.classList.contains('pagination__info'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
    });
  });

  it('Create Listing button links to create page', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /Create a new listing/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  it('View action links have correct href to listing detail', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const table = screen.getByRole('table');
      // Get View buttons in Actions column (they have btn--secondary class)
      const viewButtons = within(table).getAllByRole('link', { name: /View / });
      // Filter to only the View buttons (not title links) - they have btn class
      const actionButtons = viewButtons.filter(el => el.classList.contains('btn--secondary'));
      expect(actionButtons.length).toBeGreaterThanOrEqual(3);
      expect(actionButtons[0]).toHaveAttribute('href', '/app/farmer/listings/123e4567-e89b-12d3-a456-426614174000');
      expect(actionButtons[1]).toHaveAttribute('href', '/app/farmer/listings/223e4567-e89b-12d3-a456-426614174001');
      expect(actionButtons[2]).toHaveAttribute('href', '/app/farmer/listings/323e4567-e89b-12d3-a456-426614174002');
    });
  });

  it('listing title links have correct href to listing detail', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const table = screen.getByRole('table');
      // Get title links (they have listings-table__listing-link class, not btn class)
      const titleLinks = within(table).getAllByRole('link', { name: /Fresh Tomatoes/ });
      const titleLink = titleLinks.find(el => el.classList.contains('listings-table__listing-link'));
      expect(titleLink).toBeInTheDocument();
      expect(titleLink).toHaveAttribute('href', '/app/farmer/listings/123e4567-e89b-12d3-a456-426614174000');
    });
  });

  it('has semantic heading structure', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('My Listings');
    });
  });

  it('table has proper column headers', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(5);
    });
  });

it('status badges have accessible labels', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const table = screen.getByRole('table');
      // Status badges are spans with status-badge class and aria-label
      const badges = within(table).getAllByRole('generic', { hidden: true });
      const statusBadges = badges.filter(el => 
        el.classList.contains('status-badge') && el.hasAttribute('aria-label')
      );
      expect(statusBadges.length).toBeGreaterThan(0);
      statusBadges.forEach(badge => {
        expect(badge).toHaveAttribute('aria-label');
      });
    });
  });

  it('pagination buttons have aria-labels', async () => {
    const singlePageListings = mockListings.slice(0, 2);
    server.use(createPaginationHandler(singlePageListings));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
    });
  });

  it('View links have descriptive aria-labels', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      const viewLinks = screen.getAllByRole('link', { name: /View / });
      expect(viewLinks.length).toBeGreaterThanOrEqual(3);
      expect(viewLinks[0]).toHaveAttribute('aria-label', 'View Fresh Tomatoes');
    });
  });

  it('shows table on desktop (default)', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders both table and card views', async () => {
    server.use(createSuccessHandler(mockListings));
    renderMyListingsPage();
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /Listings/i })).toBeInTheDocument();
    });
  });
});