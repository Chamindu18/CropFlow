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
];