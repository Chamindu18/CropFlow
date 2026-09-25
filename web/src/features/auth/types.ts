import { z } from 'zod';

export const UserRoleSchema = z.enum(['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const RegistrationRoleSchema = z.enum(['FARMER', 'BUYER', 'TRANSPORTER']);
export type RegistrationRole = z.infer<typeof RegistrationRoleSchema>;

export const UserSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  emailVerified: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresAt: z.string().datetime(),
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.string(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RegistrationRequestSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  phone: z.string().max(20).optional().nullable(),
  role: RegistrationRoleSchema,
});
export type RegistrationRequest = z.infer<typeof RegistrationRequestSchema>;

export const RegistrationResponseSchema = z.object({
  message: z.string(),
  userId: z.string().uuid(),
  email: z.string().email(),
  status: UserStatusSchema,
});
export type RegistrationResponse = z.infer<typeof RegistrationResponseSchema>;

export const EmailVerificationResponseSchema = z.object({
  message: z.string(),
});
export type EmailVerificationResponse = z.infer<typeof EmailVerificationResponseSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email().max(254),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ForgotPasswordResponseSchema = z.object({
  message: z.string(),
});
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;

export const ResetPasswordRequestSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(12).max(128),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const ResetPasswordResponseSchema = z.object({
  message: z.string(),
});
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
}