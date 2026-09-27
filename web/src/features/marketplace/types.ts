import { z } from 'zod';

export const ListingStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'SOLD', 'CANCELLED']);
export type ListingStatus = z.infer<typeof ListingStatusSchema>;

export const ListingResponseSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: ListingStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();
export type ListingResponse = z.infer<typeof ListingResponseSchema>;

export const ListingRequestSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(2000).optional().nullable(),
});
export type ListingRequest = z.infer<typeof ListingRequestSchema>;

export const ListingUpdateRequestSchema = z.object({
  title: z.string().min(1).max(150).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});
export type ListingUpdateRequest = z.infer<typeof ListingUpdateRequestSchema>;

export const PageSchema = z.object({
  content: z.array(z.unknown()),
  pageable: z.object({
    sort: z.object({
      empty: z.boolean(),
      sorted: z.boolean(),
      unsorted: z.boolean(),
    }),
    offset: z.number().int(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    paged: z.boolean(),
    unpaged: z.boolean(),
  }),
  totalElements: z.number().int(),
  totalPages: z.number().int(),
  size: z.number().int(),
  number: z.number().int(),
  first: z.boolean(),
  last: z.boolean(),
  numberOfElements: z.number().int(),
  empty: z.boolean(),
});
export type Page<T> = {
  content: T[];
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

export const BrowseListingsParamsSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).max(50).optional(),
  sort: z.string().optional(),
});
export type BrowseListingsParams = z.infer<typeof BrowseListingsParamsSchema>;

export const GetMyListingsParamsSchema = z.object({
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).max(50).optional(),
  sort: z.string().optional(),
});
export type GetMyListingsParams = z.infer<typeof GetMyListingsParamsSchema>;