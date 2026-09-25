import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { server } from '../../../test/mocks/server';
import { setAccessToken, clearAccessToken } from '../../../shared/api';
import {
  login,
  register,
  refreshAccessToken,
  logout,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../api';
import { normalizeError, isApiError } from '../../../shared/api/error';
import { AxiosError } from 'axios';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  server.resetHandlers();
  clearAccessToken();
});

function createAxiosError(response: { status: number; data: unknown; config?: { url?: string } }, code?: string) {
  const error = new Error('Request failed') as AxiosError;
  error.response = response as AxiosError['response'];
  error.config = response.config as AxiosError['config'];
  if (code) error.code = code;
  return error;
}

describe('Auth API', () => {
  describe('login', () => {
    it('returns LoginResponse on successful login', async () => {
      const result = await login({ email: 'test@example.com', password: 'validpassword123' });
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.role).toBe('FARMER');
    });

    it('throws normalized ApiError on invalid credentials', async () => {
      await expect(login({ email: 'test@example.com', password: 'wrong' })).rejects.toMatchObject({
        status: 401,
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('throws ApiError instance', async () => {
      try {
        await login({ email: 'test@example.com', password: 'wrong' });
      } catch (error) {
        expect(isApiError(error)).toBe(true);
      }
    });
  });

  describe('register', () => {
    it('returns RegistrationResponse on successful registration', async () => {
      const result = await register({
        email: 'new@example.com',
        password: 'validpassword123',
        firstName: 'New',
        lastName: 'User',
        role: 'FARMER',
      });
      expect(result.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.status).toBe('PENDING_VERIFICATION');
    });

    it('throws ApiError with REGISTRATION_CONFLICT on duplicate email', async () => {
      await expect(
        register({
          email: 'existing@example.com',
          password: 'validpassword123',
          firstName: 'Existing',
          lastName: 'User',
          role: 'FARMER',
        })
      ).rejects.toMatchObject({
        status: 409,
        code: 'REGISTRATION_CONFLICT',
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('returns new LoginResponse on successful refresh', async () => {
      const result = await refreshAccessToken();
      expect(result.accessToken).toBe('mock-access-token');
    });
  });

  describe('logout', () => {
    it('completes without error', async () => {
      await expect(logout()).resolves.toBeUndefined();
    });
  });

  describe('getCurrentUser', () => {
    it('returns User when authenticated', async () => {
      setAccessToken('valid-token');
      const result = await getCurrentUser();
      expect(result.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('FARMER');
    });

    it('throws ApiError with UNAUTHORIZED when not authenticated', async () => {
      clearAccessToken();
      await expect(getCurrentUser()).rejects.toMatchObject({
        status: 401,
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('verifyEmail', () => {
    it('returns EmailVerificationResponse', async () => {
      const result = await verifyEmail('valid-token');
      expect(result.message).toBe('Email verification successful.');
    });
  });

  describe('forgotPassword', () => {
    it('returns ForgotPasswordResponse', async () => {
      const result = await forgotPassword({ email: 'test@example.com' });
      expect(result.message).toContain('password reset email has been sent');
    });
  });

  describe('resetPassword', () => {
    it('completes without error', async () => {
      await expect(resetPassword({ token: 'reset-token', newPassword: 'newpassword123' })).resolves.toBeUndefined();
    });
  });
});

describe('normalizeError', () => {
  it('preserves backend error codes like REFRESH_TOKEN_REVOKED', () => {
    const error = normalizeError(
      createAxiosError({
        status: 401,
        data: {
          timestamp: new Date().toISOString(),
          status: 401,
          code: 'REFRESH_TOKEN_REVOKED',
          message: 'Refresh token has been revoked.',
          path: '/api/v1/auth/refresh',
          details: {},
        },
        config: { url: '/api/v1/auth/refresh' },
      })
    );
    expect(error.code).toBe('REFRESH_TOKEN_REVOKED');
    expect(error.status).toBe(401);
  });

  it('preserves FORBIDDEN error code', () => {
    const error = normalizeError(
      createAxiosError({
        status: 403,
        data: {
          timestamp: new Date().toISOString(),
          status: 403,
          code: 'FORBIDDEN',
          message: 'You do not have permission.',
          path: '/api/v1/marketplace/listings/123',
          details: {},
        },
        config: { url: '/api/v1/marketplace/listings/123' },
      })
    );
    expect(error.code).toBe('FORBIDDEN');
    expect(error.status).toBe(403);
  });

  it('preserves INVALID_LISTING_STATE_TRANSITION error code', () => {
    const error = normalizeError(
      createAxiosError({
        status: 409,
        data: {
          timestamp: new Date().toISOString(),
          status: 409,
          code: 'INVALID_LISTING_STATE_TRANSITION',
          message: 'Cannot transition from SOLD to ACTIVE.',
          path: '/api/v1/marketplace/listings/123/activate',
          details: {},
        },
        config: { url: '/api/v1/marketplace/listings/123/activate' },
      })
    );
    expect(error.code).toBe('INVALID_LISTING_STATE_TRANSITION');
    expect(error.status).toBe(409);
  });

  it('preserves VALIDATION_ERROR error code', () => {
    const error = normalizeError(
      createAxiosError({
        status: 400,
        data: {
          timestamp: new Date().toISOString(),
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          path: '/api/v1/auth/login',
          details: { email: 'Email must be valid' },
        },
        config: { url: '/api/v1/auth/login' },
      })
    );
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual({ email: 'Email must be valid' });
  });

  it('handles network errors', () => {
    const error = normalizeError(createAxiosError({ status: 0, data: null, config: { url: '' } }, 'ERR_NETWORK'));
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.status).toBe(0);
  });

  it('handles timeout errors', () => {
    const error = normalizeError(createAxiosError({ status: 0, data: null, config: { url: '' } }, 'ECONNABORTED'));
    expect(error.code).toBe('TIMEOUT');
    expect(error.status).toBe(408);
  });

  it('handles unknown errors', () => {
    const error = normalizeError(new Error('Something went wrong'));
    expect(error.code).toBe('UNKNOWN');
    expect(error.status).toBe(500);
  });

  it('handles completely unknown errors', () => {
    const error = normalizeError('string error');
    expect(error.code).toBe('UNKNOWN');
    expect(error.status).toBe(500);
  });
});

describe('isApiError', () => {
  it('returns true for ApiError instances', () => {
    const error = normalizeError(createAxiosError({ status: 401, data: { code: 'TEST' }, config: { url: '' } }));
    expect(isApiError(error)).toBe(true);
  });

  it('returns false for non-ApiError objects', () => {
    expect(isApiError(new Error('test'))).toBe(false);
    expect(isApiError({})).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
    expect(isApiError('string')).toBe(false);
  });
});