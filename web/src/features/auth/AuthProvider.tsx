import { useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { fetchCsrfToken, clearCsrfToken } from '../../shared/api/csrf';
import { setAccessToken, clearAccessToken, getAccessToken } from '../../shared/api';
import { isApiError } from '../../shared/api/error';
import type { AuthState, User, LoginRequest, RegistrationRequest, LoginResponse } from './types';
import {
  login as apiLogin,
  register as apiRegister,
  refreshAccessToken as apiRefreshAccessToken,
  logout as apiLogout,
  getCurrentUser as apiGetCurrentUser,
} from './api';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';

type AuthAction =
  | { type: 'RESTORING_START' }
  | { type: 'RESTORE_SUCCESS'; payload: { user: User; accessToken: string } }
  | { type: 'RESTORE_FAILURE' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string } }
  | { type: 'LOGOUT' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORING_START':
      return { ...state, isRestoring: true };
    case 'RESTORE_SUCCESS':
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isRestoring: false,
      };
    case 'RESTORE_FAILURE':
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isRestoring: false,
      };
    case 'LOGIN_SUCCESS':
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isRestoring: false,
      };
    case 'LOGOUT':
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isRestoring: false,
      };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isRestoring: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const refreshPromiseRef = useRef<Promise<LoginResponse> | null>(null);

  const restoreSession = useCallback(async () => {
    dispatch({ type: 'RESTORING_START' });

    try {
      const user = await apiGetCurrentUser();
      const token = getAccessToken();
      if (token) {
        dispatch({ type: 'RESTORE_SUCCESS', payload: { user, accessToken: token } });
      } else {
        dispatch({ type: 'RESTORE_FAILURE' });
      }
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        try {
          const refreshResponse = await refreshWithDeduplication();
          setAccessToken(refreshResponse.accessToken);
          const user = await apiGetCurrentUser();
          dispatch({ type: 'RESTORE_SUCCESS', payload: { user, accessToken: refreshResponse.accessToken } });
        } catch {
          clearAccessToken();
          clearCsrfToken();
          dispatch({ type: 'RESTORE_FAILURE' });
        }
      } else {
        clearAccessToken();
        clearCsrfToken();
        dispatch({ type: 'RESTORE_FAILURE' });
      }
    }
  }, []);

  async function refreshWithDeduplication(): Promise<LoginResponse> {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const promise = apiRefreshAccessToken().finally(() => {
      refreshPromiseRef.current = null;
    });

    refreshPromiseRef.current = promise;
    return promise;
  }

  useEffect(() => {
    let mounted = true;

    fetchCsrfToken()
      .then(() => {
        if (mounted) {
          restoreSession();
        }
      })
      .catch(() => {
        if (mounted) {
          dispatch({ type: 'RESTORE_FAILURE' });
        }
      });

    return () => {
      mounted = false;
    };
  }, [restoreSession]);

  const login = useCallback(async (request: LoginRequest) => {
    const loginResponse: LoginResponse = await apiLogin(request);
    setAccessToken(loginResponse.accessToken);
    const user = await apiGetCurrentUser();
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken: loginResponse.accessToken } });
  }, []);

  const register = useCallback(async (request: RegistrationRequest) => {
    await apiRegister(request);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearAccessToken();
      clearCsrfToken();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const refresh = useCallback(async () => {
    const refreshResponse = await refreshWithDeduplication();
    setAccessToken(refreshResponse.accessToken);
    const user = await apiGetCurrentUser();
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken: refreshResponse.accessToken } });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}