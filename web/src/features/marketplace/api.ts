import { api } from '../../shared/api';
import { normalizeError } from '../../shared/api/error';
import { z } from 'zod';
import type {
  ListingResponse,
  ListingRequest,
  ListingUpdateRequest,
  BrowseListingsParams,
  GetMyListingsParams,
  Page,
} from './types';
import {
  ListingResponseSchema,
} from './types';

async function handleValidatedResponse<T>(promise: Promise<{ data: unknown }>, schema: z.ZodType<T>): Promise<T> {
  try {
    const response = await promise;
    return schema.parse(response.data);
  } catch (error) {
    throw normalizeError(error);
  }
}

async function handleNoContentResponse(promise: Promise<{ data: unknown }>): Promise<void> {
  try {
    await promise;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function parsePageResponse<T>(
  promise: Promise<{ data: unknown }>,
  itemSchema: z.ZodType<T>
): Promise<Page<T>> {
  try {
    const response = await promise;
    const data = response.data as Record<string, unknown>;
    const content = data.content as unknown[];
    const parsedContent = content.map((item) => itemSchema.parse(item));
    return {
      content: parsedContent,
      pageable: data.pageable as Page<T>['pageable'],
      totalElements: data.totalElements as number,
      totalPages: data.totalPages as number,
      size: data.size as number,
      number: data.number as number,
      first: data.first as boolean,
      last: data.last as boolean,
      numberOfElements: data.numberOfElements as number,
      empty: data.empty as boolean,
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getMyListings(params: GetMyListingsParams = {}): Promise<Page<ListingResponse>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));
  if (params.sort !== undefined) searchParams.set('sort', params.sort);

  const queryString = searchParams.toString();
  const url = `/marketplace/listings/mine${queryString ? `?${queryString}` : ''}`;

  return parsePageResponse(api.get<unknown>(url), ListingResponseSchema);
}

export async function getListing(listingId: string): Promise<ListingResponse> {
  return handleValidatedResponse(api.get<unknown>(`/marketplace/listings/${listingId}`), ListingResponseSchema);
}

export async function createListing(request: ListingRequest): Promise<ListingResponse> {
  return handleValidatedResponse(api.post<unknown>('/marketplace/listings', request), ListingResponseSchema);
}

export async function activateListing(listingId: string): Promise<ListingResponse> {
  return handleValidatedResponse(api.post<unknown>(`/marketplace/listings/${listingId}/activate`), ListingResponseSchema);
}

export async function cancelListing(listingId: string): Promise<ListingResponse> {
  return handleValidatedResponse(api.post<unknown>(`/marketplace/listings/${listingId}/cancel`), ListingResponseSchema);
}

export async function markListingSold(listingId: string): Promise<ListingResponse> {
  return handleValidatedResponse(api.post<unknown>(`/marketplace/listings/${listingId}/mark-sold`), ListingResponseSchema);
}

export async function updateListing(listingId: string, request: ListingUpdateRequest): Promise<ListingResponse> {
  return handleValidatedResponse(api.patch<unknown>(`/marketplace/listings/${listingId}`, request), ListingResponseSchema);
}

export async function deleteListing(listingId: string): Promise<void> {
  return handleNoContentResponse(api.delete(`/marketplace/listings/${listingId}`));
}

export async function browseListings(params: BrowseListingsParams = {}): Promise<Page<ListingResponse>> {
  const searchParams = new URLSearchParams();
  if (params.search !== undefined && params.search !== '') searchParams.set('search', params.search);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));
  if (params.sort !== undefined) searchParams.set('sort', params.sort);

  const queryString = searchParams.toString();
  const url = `/marketplace/listings${queryString ? `?${queryString}` : ''}`;

  return parsePageResponse(api.get<unknown>(url), ListingResponseSchema);
}