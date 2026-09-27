import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { server } from '../../../test/mocks/server';
import { setAccessToken, clearAccessToken } from '../../../shared/api';
import {
  getMyListings,
  getListing,
  createListing,
  activateListing,
  cancelListing,
  markListingSold,
  updateListing,
  deleteListing,
  browseListings,
} from '../api';
import { normalizeError, isApiError } from '../../../shared/api/error';
import { ListingResponseSchema } from '../types';
import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8080/api/v1';

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

describe('Marketplace API', () => {
  describe('getMyListings', () => {
    it('returns paginated listings on success', async () => {
      setAccessToken('valid-token');
      const result = await getMyListings({ page: 0, size: 10 });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].title).toBe('Fresh Tomatoes');
      expect(result.totalElements).toBe(1);
      expect(result.number).toBe(0);
      expect(result.size).toBe(10);
    });

    it('throws normalized ApiError on unauthorized', async () => {
      clearAccessToken();
      await expect(getMyListings()).rejects.toMatchObject({
        status: 401,
        code: 'UNAUTHORIZED',
      });
    });

    it('throws ApiError instance', async () => {
      clearAccessToken();
      try {
        await getMyListings();
      } catch (error) {
        expect(isApiError(error)).toBe(true);
      }
    });

    it('uses correct query parameters', async () => {
      setAccessToken('valid-token');
      const result = await getMyListings({ page: 1, size: 5, sort: 'title' });
      expect(result.content).toHaveLength(1);
    });
  });

  describe('getListing', () => {
    it('returns ListingResponse on success', async () => {
      setAccessToken('valid-token');
      const result = await getListing('123e4567-e89b-12d3-a456-426614174000');
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.title).toBe('Fresh Tomatoes');
      expect(result.status).toBe('ACTIVE');
    });

    it('throws normalized ApiError on not found', async () => {
      setAccessToken('valid-token');
      await expect(getListing('00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
      });
    });

    it('throws normalized ApiError on forbidden', async () => {
      setAccessToken('valid-token');
      await expect(getListing('99999999-9999-9999-9999-999999999999')).rejects.toMatchObject({
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
      });
    });
  });

  describe('createListing', () => {
    it('returns ListingResponse on successful creation', async () => {
      setAccessToken('valid-token');
      const result = await createListing({
        title: 'New Listing',
        description: 'Description',
      });
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.title).toBe('Fresh Tomatoes');
      expect(result.status).toBe('ACTIVE');
    });

    it('throws normalized ApiError on validation error', async () => {
      setAccessToken('valid-token');
      await expect(createListing({ title: '', description: 'test' })).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('activateListing', () => {
    it('returns ListingResponse on success', async () => {
      setAccessToken('valid-token');
      const result = await activateListing('123e4567-e89b-12d3-a456-426614174000');
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.status).toBe('ACTIVE');
    });

    it('throws normalized ApiError on invalid state transition', async () => {
      setAccessToken('valid-token');
      await expect(activateListing('invalid-state')).rejects.toMatchObject({
        status: 409,
        code: 'INVALID_LISTING_STATE_TRANSITION',
      });
    });
  });

  describe('cancelListing', () => {
    it('returns ListingResponse on success', async () => {
      setAccessToken('valid-token');
      const result = await cancelListing('123e4567-e89b-12d3-a456-426614174000');
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.status).toBe('CANCELLED');
    });

    it('throws normalized ApiError on invalid state transition', async () => {
      setAccessToken('valid-token');
      await expect(cancelListing('invalid-state')).rejects.toMatchObject({
        status: 409,
        code: 'INVALID_LISTING_STATE_TRANSITION',
      });
    });
  });

  describe('markListingSold', () => {
    it('returns ListingResponse on success', async () => {
      setAccessToken('valid-token');
      const result = await markListingSold('123e4567-e89b-12d3-a456-426614174000');
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.status).toBe('SOLD');
    });

    it('throws normalized ApiError on invalid state transition', async () => {
      setAccessToken('valid-token');
      await expect(markListingSold('invalid-state')).rejects.toMatchObject({
        status: 409,
        code: 'INVALID_LISTING_STATE_TRANSITION',
      });
    });
  });

  describe('updateListing', () => {
    it('returns ListingResponse on success', async () => {
      setAccessToken('valid-token');
      const result = await updateListing('123e4567-e89b-12d3-a456-426614174000', {
        title: 'Updated Title',
        description: 'Updated Description',
      });
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.title).toBe('Updated Title');
    });

    it('throws normalized ApiError on invalid state transition', async () => {
      setAccessToken('valid-token');
      await expect(updateListing('invalid-state', { title: 'New Title' })).rejects.toMatchObject({
        status: 409,
        code: 'INVALID_LISTING_STATE_TRANSITION',
      });
    });

    it('throws normalized ApiError on validation error', async () => {
      setAccessToken('valid-token');
      await expect(updateListing('123e4567-e89b-12d3-a456-426614174000', { title: '' })).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('deleteListing', () => {
    it('completes without error on success', async () => {
      setAccessToken('valid-token');
      await expect(deleteListing('123e4567-e89b-12d3-a456-426614174000')).resolves.toBeUndefined();
    });

    it('throws normalized ApiError on invalid state', async () => {
      setAccessToken('valid-token');
      await expect(deleteListing('invalid-state')).rejects.toMatchObject({
        status: 409,
        code: 'INVALID_LISTING_STATE_TRANSITION',
      });
    });

    it('throws normalized ApiError on not found', async () => {
      setAccessToken('valid-token');
      await expect(deleteListing('00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
      });
    });
  });

  describe('browseListings', () => {
    it('returns paginated listings on success', async () => {
      const result = await browseListings({ page: 0, size: 10 });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].title).toBe('Fresh Tomatoes');
      expect(result.totalElements).toBe(1);
      expect(result.number).toBe(0);
      expect(result.size).toBe(10);
    });

    it('works with search parameter', async () => {
      const result = await browseListings({ search: 'tomato', page: 0, size: 5 });
      expect(result.content).toHaveLength(1);
    });

    it('works with sort parameter', async () => {
      const result = await browseListings({ sort: 'title', page: 0, size: 10 });
      expect(result.content).toHaveLength(1);
    });

    it('uses default pagination when params omitted', async () => {
      const result = await browseListings({});
      expect(result.content).toHaveLength(1);
      expect(result.number).toBe(0);
      expect(result.size).toBe(20);
    });
  });

  describe('error handling', () => {
    it('preserves backend error codes like INVALID_LISTING_STATE_TRANSITION', () => {
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

    it('preserves VALIDATION_ERROR error code with details', () => {
      const error = normalizeError(
        createAxiosError({
          status: 400,
          data: {
            timestamp: new Date().toISOString(),
            status: 400,
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            path: '/api/v1/marketplace/listings',
            details: { title: 'Title is required' },
          },
          config: { url: '/api/v1/marketplace/listings' },
        })
      );
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ title: 'Title is required' });
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
  });

  describe('ListingResponse schema validation', () => {
    const validListingResponse = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      sellerId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Fresh Tomatoes',
      description: 'Organic farm tomatoes',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('accepts a valid ListingResponse', () => {
      expect(() => ListingResponseSchema.parse(validListingResponse)).not.toThrow();
    });

    it('rejects ListingResponse with missing id', () => {
      const invalid = { ...validListingResponse };
      delete (invalid as Record<string, unknown>).id;
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });

    it('rejects ListingResponse with invalid UUID id', () => {
      const invalid = { ...validListingResponse, id: 'not-a-uuid' };
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });

    it('rejects ListingResponse with missing sellerId', () => {
      const invalid = { ...validListingResponse };
      delete (invalid as Record<string, unknown>).sellerId;
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });

    it('rejects ListingResponse with missing title', () => {
      const invalid = { ...validListingResponse };
      delete (invalid as Record<string, unknown>).title;
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });

    it('rejects ListingResponse with missing description', () => {
      const invalid = { ...validListingResponse };
      delete (invalid as Record<string, unknown>).description;
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });

    it('rejects ListingResponse with invalid status', () => {
      const invalid = { ...validListingResponse, status: 'INVALID_STATUS' };
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });

    it('rejects ListingResponse with missing createdAt', () => {
      const invalid = { ...validListingResponse };
      delete (invalid as Record<string, unknown>).createdAt;
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });

    it('rejects ListingResponse with invalid datetime createdAt', () => {
      const invalid = { ...validListingResponse, createdAt: 'not-a-date' };
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });

    it('rejects ListingResponse with missing updatedAt', () => {
      const invalid = { ...validListingResponse };
      delete (invalid as Record<string, unknown>).updatedAt;
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });

    it('rejects ListingResponse with invalid datetime updatedAt', () => {
      const invalid = { ...validListingResponse, updatedAt: 'not-a-date' };
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });

    it('rejects ListingResponse with extra unknown fields (strict)', () => {
      const invalid = { ...validListingResponse, extraField: 'not allowed' };
      expect(() => ListingResponseSchema.parse(invalid)).toThrow();
    });
  });

  describe('ListingResponse runtime validation in API calls', () => {
    it('getListing rejects invalid response at runtime', async () => {
      setAccessToken('valid-token');
      server.use(
        http.get(`${API_BASE}/marketplace/listings/:listingId`, () => {
          return HttpResponse.json({ invalid: 'response' }, { status: 200 });
        })
      );
      await expect(getListing('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow();
    });

    it('createListing rejects invalid response at runtime', async () => {
      setAccessToken('valid-token');
      server.use(
        http.post(`${API_BASE}/marketplace/listings`, () => {
          return HttpResponse.json({ invalid: 'response' }, { status: 201 });
        })
      );
      await expect(createListing({ title: 'Test', description: 'Desc' })).rejects.toThrow();
    });

    it('activateListing rejects invalid response at runtime', async () => {
      setAccessToken('valid-token');
      server.use(
        http.post(`${API_BASE}/marketplace/listings/:listingId/activate`, () => {
          return HttpResponse.json({ invalid: 'response' }, { status: 200 });
        })
      );
      await expect(activateListing('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow();
    });

    it('cancelListing rejects invalid response at runtime', async () => {
      setAccessToken('valid-token');
      server.use(
        http.post(`${API_BASE}/marketplace/listings/:listingId/cancel`, () => {
          return HttpResponse.json({ invalid: 'response' }, { status: 200 });
        })
      );
      await expect(cancelListing('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow();
    });

    it('markListingSold rejects invalid response at runtime', async () => {
      setAccessToken('valid-token');
      server.use(
        http.post(`${API_BASE}/marketplace/listings/:listingId/mark-sold`, () => {
          return HttpResponse.json({ invalid: 'response' }, { status: 200 });
        })
      );
      await expect(markListingSold('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow();
    });

    it('updateListing rejects invalid response at runtime', async () => {
      setAccessToken('valid-token');
      server.use(
        http.patch(`${API_BASE}/marketplace/listings/:listingId`, () => {
          return HttpResponse.json({ invalid: 'response' }, { status: 200 });
        })
      );
      await expect(updateListing('123e4567-e89b-12d3-a456-426614174000', { title: 'Test' })).rejects.toThrow();
    });

    it('browseListings rejects invalid response at runtime', async () => {
      server.use(
        http.get(`${API_BASE}/marketplace/listings`, () => {
          return HttpResponse.json({ invalid: 'response' }, { status: 200 });
        })
      );
      await expect(browseListings({})).rejects.toThrow();
    });

    it('getMyListings rejects invalid response at runtime', async () => {
      setAccessToken('valid-token');
      server.use(
        http.get(`${API_BASE}/marketplace/listings/mine`, () => {
          return HttpResponse.json({ invalid: 'response' }, { status: 200 });
        })
      );
      await expect(getMyListings({})).rejects.toThrow();
    });
  });
});