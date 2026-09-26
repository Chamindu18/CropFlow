import { createContext } from 'react';
import type { AuthState } from './types';
import type { LoginRequest, RegistrationRequest, RegistrationResponse } from './types';

interface AuthContextValue extends AuthState {
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegistrationRequest) => Promise<RegistrationResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };
export type { AuthContextValue };