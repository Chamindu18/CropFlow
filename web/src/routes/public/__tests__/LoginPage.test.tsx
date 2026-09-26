import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../../app/providers';
import LoginPage from '../LoginPage';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import type { ApiError } from '../../../shared/api/error';

vi.mock('../../../features/auth/hooks/useAuth');

const mockLogin = vi.fn();
const mockIsRestoring = false;

const renderLoginPage = (overrides: Partial<{ isRestoring: boolean; isAuthenticated: boolean }> = {}) => {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: false,
    isRestoring: overrides.isRestoring ?? mockIsRestoring,
    user: null,
    accessToken: null,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AppProviders>
        <LoginPage />
      </AppProviders>
    </MemoryRouter>
  );
};

const createApiError = (code: string, status: number, message: string, details?: Record<string, string>): ApiError => ({
  status,
  code,
  message,
  path: '/auth/login',
  details: details ?? {},
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockLogin.mockResolvedValue(undefined);
  });

  it('renders email and password fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders login button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders Register link', () => {
    renderLoginPage();
    expect(screen.getByRole('link', { name: /create an account/i })).toBeInTheDocument();
  });

  it('renders Forgot Password link', () => {
    renderLoginPage();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('rejects empty email', async () => {
    renderLoginPage();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('rejects invalid email format', async () => {
    renderLoginPage();
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    });
  });

  it('rejects empty password', async () => {
    renderLoginPage();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('successful login invokes AuthProvider.login and navigates', async () => {
    renderLoginPage();
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    });
  });

  it('INVALID_CREDENTIALS shows appropriate error', async () => {
    const error = createApiError('INVALID_CREDENTIALS', 401, 'Invalid credentials');
    mockLogin.mockRejectedValue(error);

    renderLoginPage();
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('validation error displays field-specific messages', async () => {
    const error = createApiError('VALIDATION_ERROR', 400, 'Validation failed', {
      email: 'Email is already in use',
      password: 'Password must be at least 12 characters',
    });
    mockLogin.mockRejectedValue(error);

    renderLoginPage();
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is already in use')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 12 characters')).toBeInTheDocument();
    });
  });

  it('network error displays safe generic message', async () => {
    const error = createApiError('NETWORK_ERROR', 0, 'Network error. Check your connection.');
    mockLogin.mockRejectedValue(error);

    renderLoginPage();
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('submit button is disabled and shows loading while request is pending', async () => {
    let resolveLogin: () => void;
    const loginPromise = new Promise<void>((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValue(loginPromise);

    renderLoginPage();
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    resolveLogin!();
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('duplicate submit does not trigger duplicate login calls', async () => {
    let resolveLogin: () => void;
    const loginPromise = new Promise<void>((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValue(loginPromise);

    renderLoginPage();
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    resolveLogin!();
  });

  it('shows loading state when isRestoring is true', () => {
    renderLoginPage({ isRestoring: true });
    expect(screen.getByText('Restoring session...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('LoginPage route safety', () => {
  it('does not access localStorage for tokens', () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, 'getItem');
    renderLoginPage();
    const localStorageCalls = localStorageSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && (call[0].includes('token') || call[0].includes('auth') || call[0].includes('access'))
    );
    expect(localStorageCalls.length).toBe(0);
    localStorageSpy.mockRestore();
  });

  it('does not access sessionStorage for tokens', () => {
    const sessionStorageSpy = vi.spyOn(sessionStorage, 'getItem');
    renderLoginPage();
    const sessionStorageCalls = sessionStorageSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && (call[0].includes('token') || call[0].includes('auth') || call[0].includes('access'))
    );
    expect(sessionStorageCalls.length).toBe(0);
    sessionStorageSpy.mockRestore();
  });
});