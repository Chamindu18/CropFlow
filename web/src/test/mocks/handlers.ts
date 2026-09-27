import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8080/api/v1';

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

const mockLoginResponse = {
  accessToken: 'mock-access-token',
  tokenType: 'Bearer' as const,
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  userId: mockUser.userId,
  email: mockUser.email,
  role: mockUser.role,
};

const mockRegistrationResponse = {
  message: 'Registration successful. Please verify your email.',
  userId: mockUser.userId,
  email: mockUser.email,
  status: 'PENDING_VERIFICATION' as const,
};

const mockListing = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  sellerId: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Fresh Tomatoes',
  description: 'Organic farm tomatoes',
  status: 'ACTIVE' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockPage = {
  content: [mockListing],
  pageable: {
    sort: { empty: false, sorted: true, unsorted: false },
    offset: 0,
    pageNumber: 0,
    pageSize: 20,
    paged: true,
    unpaged: false,
  },
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 1,
  empty: false,
};

export const handlers = [
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'test@example.com' && body.password === 'validpassword123') {
      return HttpResponse.json(mockLoginResponse, { status: 200 });
    }
    return HttpResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
        path: '/api/v1/auth/login',
        details: {},
      },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string };
    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 409,
          code: 'REGISTRATION_CONFLICT',
          message: 'Email already registered.',
          path: '/api/v1/auth/register',
          details: {},
        },
        { status: 409 }
      );
    }
    return HttpResponse.json(mockRegistrationResponse, { status: 201 });
  }),

  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json(mockLoginResponse, { status: 200 });
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE}/users/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Authentication is required.',
          path: '/api/v1/users/me',
          details: {},
        },
        { status: 401 }
      );
    }
    return HttpResponse.json(mockUser, { status: 200 });
  }),

  http.post(`${API_BASE}/auth/verify-email`, () => {
    return HttpResponse.json({ message: 'Email verification successful.' }, { status: 200 });
  }),

  http.post(`${API_BASE}/auth/forgot-password`, () => {
    return HttpResponse.json(
      { message: 'If the account exists, a password reset email has been sent.' },
      { status: 202 }
    );
  }),

  http.post(`${API_BASE}/auth/reset-password`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE}/security/csrf`, () => {
    return HttpResponse.json(
      {
        parameterName: '_csrf',
        headerName: 'X-XSRF-TOKEN',
        token: 'mock-csrf-token',
      },
      { status: 200 }
    );
  }),

  // Marketplace endpoints
  http.get(`${API_BASE}/marketplace/listings/mine`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Authentication is required.',
          path: '/api/v1/marketplace/listings/mine',
          details: {},
        },
        { status: 401 }
      );
    }
    const url = new URL(request.url);
    const size = Number(url.searchParams.get('size') ?? '20');
    return HttpResponse.json({ ...mockPage, size }, { status: 200 });
  }),

  http.get(`${API_BASE}/marketplace/listings`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '20');

    if (page < 0 || size <= 0 || size > 50) {
      return new HttpResponse(null, { status: 400 });
    }

    return HttpResponse.json({ ...mockPage, size }, { status: 200 });
  }),

  http.get(`${API_BASE}/marketplace/listings/:listingId`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Authentication is required.',
          path: '/api/v1/marketplace/listings/123e4567-e89b-12d3-a456-426614174000',
          details: {},
        },
        { status: 401 }
      );
    }
    const listingId = params.listingId;
    if (listingId === '00000000-0000-0000-0000-000000000000') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
          path: `/api/v1/marketplace/listings/${listingId}`,
          details: {},
        },
        { status: 404 }
      );
    }
    if (listingId === '99999999-9999-9999-9999-999999999999') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
          path: `/api/v1/marketplace/listings/${listingId}`,
          details: {},
        },
        { status: 404 }
      );
    }
    return HttpResponse.json(mockListing, { status: 200 });
  }),

  http.post(`${API_BASE}/marketplace/listings`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Authentication is required.',
          path: '/api/v1/marketplace/listings',
          details: {},
        },
        { status: 401 }
      );
    }
    const body = await request.json() as { title: string; description?: string };
    if (!body.title || body.title.trim() === '') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          path: '/api/v1/marketplace/listings',
          details: { title: 'Title is required' },
        },
        { status: 400 }
      );
    }
    return HttpResponse.json(mockListing, { status: 201 });
  }),

  http.post(`${API_BASE}/marketplace/listings/:listingId/activate`, ({ params }) => {
    const listingId = params.listingId;
    if (listingId === 'invalid-state') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 409,
          code: 'INVALID_LISTING_STATE_TRANSITION',
          message: 'Cannot transition from SOLD to ACTIVE.',
          path: `/api/v1/marketplace/listings/${listingId}/activate`,
          details: {},
        },
        { status: 409 }
      );
    }
    return HttpResponse.json({ ...mockListing, status: 'ACTIVE' }, { status: 200 });
  }),

  http.post(`${API_BASE}/marketplace/listings/:listingId/cancel`, ({ params }) => {
    const listingId = params.listingId;
    if (listingId === 'invalid-state') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 409,
          code: 'INVALID_LISTING_STATE_TRANSITION',
          message: 'Cannot transition from CANCELLED to CANCELLED.',
          path: `/api/v1/marketplace/listings/${listingId}/cancel`,
          details: {},
        },
        { status: 409 }
      );
    }
    return HttpResponse.json({ ...mockListing, status: 'CANCELLED' }, { status: 200 });
  }),

  http.post(`${API_BASE}/marketplace/listings/:listingId/mark-sold`, ({ params }) => {
    const listingId = params.listingId;
    if (listingId === 'invalid-state') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 409,
          code: 'INVALID_LISTING_STATE_TRANSITION',
          message: 'Cannot transition from DRAFT to SOLD.',
          path: `/api/v1/marketplace/listings/${listingId}/mark-sold`,
          details: {},
        },
        { status: 409 }
      );
    }
    return HttpResponse.json({ ...mockListing, status: 'SOLD' }, { status: 200 });
  }),

  http.patch(`${API_BASE}/marketplace/listings/:listingId`, async ({ request, params }) => {
    const listingId = params.listingId;
    if (listingId === 'invalid-state') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 409,
          code: 'INVALID_LISTING_STATE_TRANSITION',
          message: 'Cannot update a non-DRAFT listing.',
          path: `/api/v1/marketplace/listings/${listingId}`,
          details: {},
        },
        { status: 409 }
      );
    }
    const body = await request.json() as { title?: string; description?: string };
    if (body.title !== undefined && body.title.trim() === '') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          path: '/api/v1/marketplace/listings/123',
          details: { title: 'Title must be between 1 and 150 characters' },
        },
        { status: 400 }
      );
    }
    return HttpResponse.json({ ...mockListing, title: body.title ?? mockListing.title }, { status: 200 });
  }),

  http.delete(`${API_BASE}/marketplace/listings/:listingId`, ({ params }) => {
    const listingId = params.listingId;
    if (listingId === '00000000-0000-0000-0000-000000000000') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
          path: `/api/v1/marketplace/listings/${listingId}`,
          details: {},
        },
        { status: 404 }
      );
    }
    if (listingId === 'invalid-state') {
      return HttpResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 409,
          code: 'INVALID_LISTING_STATE_TRANSITION',
          message: 'Can only delete DRAFT listings.',
          path: `/api/v1/marketplace/listings/${listingId}`,
          details: {},
        },
        { status: 409 }
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),
];