import { AxiosError } from 'axios';
import { z } from 'zod';

const ApiErrorResponseSchema = z.object({
  timestamp: z.string().datetime(),
  status: z.number().int(),
  code: z.string(),
  message: z.string(),
  path: z.string(),
  details: z.record(z.string(), z.string()).optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export interface ApiError {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly details: Record<string, string>;
}

export function createApiError(
  status: number,
  code: string,
  message: string,
  path: string,
  details: Record<string, string>
): ApiError {
  return { status, code, message, path, details };
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'code' in error &&
    'message' in error &&
    'path' in error &&
    'details' in error
  );
}

function toStringRecord(value: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = String(val);
  }
  return result;
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    if (error.response?.data) {
      const parsed = ApiErrorResponseSchema.safeParse(error.response.data);
      if (parsed.success) {
        const data = parsed.data;
        return createApiError(
          data.status,
          data.code,
          data.message,
          data.path,
          (data.details ?? {}) as Record<string, string>
        );
      }
      if (typeof error.response.data === 'object' && error.response.data !== null) {
        return createApiError(
          error.response.status,
          'UNKNOWN',
          'An unexpected error occurred.',
          error.config?.url ?? '',
          toStringRecord(error.response.data as Record<string, unknown>)
        );
      }
    }

    if (error.response?.status) {
      const status = error.response.status;
      let code = 'REQUEST_ERROR';
      let message = error.message;

      switch (status) {
        case 401:
          code = 'UNAUTHORIZED';
          message = 'Authentication is required.';
          break;
        case 403:
          code = 'FORBIDDEN';
          message = 'You do not have permission to access this resource.';
          break;
        case 404:
          code = 'RESOURCE_NOT_FOUND';
          message = 'The requested resource was not found.';
          break;
        case 409:
          code = 'CONFLICT';
          break;
        case 400:
          code = 'VALIDATION_ERROR';
          break;
        case 500:
          code = 'INTERNAL_SERVER_ERROR';
          message = 'An unexpected server error occurred.';
          break;
      }

      return createApiError(status, code, message, error.config?.url ?? '', {});
    }

    if (error.code === 'ECONNABORTED') {
      return createApiError(408, 'TIMEOUT', 'Request timed out.', '', {});
    }

    if (error.code === 'ERR_NETWORK') {
      return createApiError(0, 'NETWORK_ERROR', 'Network error. Check your connection.', '', {});
    }
  }

  if (error instanceof Error) {
    return createApiError(500, 'UNKNOWN', error.message, '', {});
  }

  return createApiError(500, 'UNKNOWN', 'An unknown error occurred.', '', {});
}