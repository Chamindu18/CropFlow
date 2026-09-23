import { z } from 'zod';
import { api } from './client';

export const CsrfTokenResponseSchema = z.object({
  parameterName: z.string(),
  headerName: z.string(),
  token: z.string(),
});

export type CsrfTokenResponse = z.infer<typeof CsrfTokenResponseSchema>;

let csrfToken: string | null = null;
let csrfHeaderName: string = 'X-XSRF-TOKEN';

export async function fetchCsrfToken(): Promise<void> {
  const response = await api.get<CsrfTokenResponse>('/security/csrf');
  const parsed = CsrfTokenResponseSchema.safeParse(response.data);
  if (parsed.success) {
    csrfToken = parsed.data.token;
    csrfHeaderName = parsed.data.headerName;
  } else {
    csrfToken = null;
  }
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function getCsrfHeaderName(): string {
  return csrfHeaderName;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}