import { api } from '../../shared/api';
import { normalizeError } from '../../shared/api/error';
import type {
  LoginRequest,
  LoginResponse,
  RegistrationRequest,
  RegistrationResponse,
  EmailVerificationResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  User,
} from './types';

async function handleResponse<T>(promise: Promise<{ data: T }>): Promise<T> {
  try {
    const response = await promise;
    return response.data;
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

export async function login(request: LoginRequest): Promise<LoginResponse> {
  return handleResponse(api.post<LoginResponse>('/auth/login', request));
}

export async function register(request: RegistrationRequest): Promise<RegistrationResponse> {
  return handleResponse(api.post<RegistrationResponse>('/auth/register', request));
}

export async function refreshAccessToken(): Promise<LoginResponse> {
  return handleResponse(api.post<LoginResponse>('/auth/refresh'));
}

export async function logout(): Promise<void> {
  return handleNoContentResponse(api.post('/auth/logout'));
}

export async function getCurrentUser(): Promise<User> {
  return handleResponse(api.get<User>('/users/me'));
}

export async function verifyEmail(token: string): Promise<EmailVerificationResponse> {
  return handleResponse(api.post<EmailVerificationResponse>('/auth/verify-email', null, { params: { token } }));
}

export async function forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  return handleResponse(api.post<ForgotPasswordResponse>('/auth/forgot-password', request));
}

export async function resetPassword(request: ResetPasswordRequest): Promise<void> {
  return handleNoContentResponse(api.post('/auth/reset-password', request));
}

export { normalizeError } from '../../shared/api/error';