import { createContext } from 'react';
import type { AuthState } from './types';
import type { LoginRequest, RegistrationRequest } from './types';

interface AuthContextValue extends AuthState {
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegistrationRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };
export type { AuthContextValue };