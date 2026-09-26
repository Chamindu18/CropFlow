import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../../app/providers';
import VerifyEmailPage from '../VerifyEmailPage';
import { verifyEmail } from '../../../features/auth/api';
import { isApiError, type ApiError } from '../../../shared/api/error';

vi.mock('../../../features/auth/api');
vi.mock('../../../shared/api/error');

const mockVerifyEmail = vi.mocked(verifyEmail);
const mockIsApiError = vi.mocked(isApiError);

const renderVerifyEmailPage = (token?: string) => {
  const initialEntry = token ? `/verify-email?token=${token}` : '/verify-email';
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppProviders>
        <VerifyEmailPage />
      </AppProviders>
    </MemoryRouter>
  );
};

const createApiError = (code: string, status: number, message: string): ApiError => ({
  status,
  code,
  message,
  path: '/auth/verify-email',
  details: {},
});

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockIsApiError.mockReturnValue(false);
  });

  it('renders verification page', () => {
    renderVerifyEmailPage('valid-token-123');
    expect(screen.getByText('Verifying your email...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('reads token from query string', () => {
    const { container } = renderVerifyEmailPage('test-token-abc');
    expect(container).toBeInTheDocument();
  });

  it('calls verifyEmail() with the correct token on load', async () => {
    mockVerifyEmail.mockResolvedValue({ message: 'Email verification successful.' });
    mockIsApiError.mockReturnValue(false);

    renderVerifyEmailPage('correct-token-123');

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('correct-token-123');
    });
  });

  it('successful verification shows success state', async () => {
    mockVerifyEmail.mockResolvedValue({ message: 'Email verification successful.' });
    mockIsApiError.mockReturnValue(false);

    renderVerifyEmailPage('valid-token');

    await waitFor(() => {
      expect(screen.getByText('Email Verified')).toBeInTheDocument();
      expect(screen.getByText('Email verification successful.')).toBeInTheDocument();
    });
  });

  it('successful verification shows Login link/button', async () => {
    mockVerifyEmail.mockResolvedValue({ message: 'Email verification successful.' });
    mockIsApiError.mockReturnValue(false);

    renderVerifyEmailPage('valid-token');

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
    });
  });

  it('missing token does not call API', async () => {
    mockVerifyEmail.mockResolvedValue({ message: 'Email verification successful.' });

    renderVerifyEmailPage();

    await waitFor(() => {
      expect(mockVerifyEmail).not.toHaveBeenCalled();
    });
  });

  it('missing token shows invalid-link state', async () => {
    renderVerifyEmailPage();

    await waitFor(() => {
      expect(screen.getByText('Invalid Link')).toBeInTheDocument();
      expect(screen.getByText('Invalid verification link. The verification token is missing.')).toBeInTheDocument();
    });
  });

  it('expired token shows expired message', async () => {
    const error = createApiError('VERIFICATION_TOKEN_EXPIRED', 409, 'The verification token has expired.');
    mockVerifyEmail.mockRejectedValue(error);
    mockIsApiError.mockReturnValue(true);

    renderVerifyEmailPage('expired-token');

    await waitFor(() => {
      expect(screen.getByText('Link Expired')).toBeInTheDocument();
      expect(screen.getByText('Verification link expired. Please request a new verification email.')).toBeInTheDocument();
    });
  });

  it('already-used token shows appropriate message', async () => {
    const error = createApiError('VERIFICATION_TOKEN_USED', 409, 'The verification token has already been used.');
    mockVerifyEmail.mockRejectedValue(error);
    mockIsApiError.mockReturnValue(true);

    renderVerifyEmailPage('used-token');

    await waitFor(() => {
      expect(screen.getByText('Already Verified')).toBeInTheDocument();
      expect(screen.getByText('Email already verified. You can now sign in to your account.')).toBeInTheDocument();
    });
  });

  it('invalid token shows safe error message', async () => {
    const error = createApiError('INVALID_VERIFICATION_TOKEN', 400, 'The verification token is invalid.');
    mockVerifyEmail.mockRejectedValue(error);
    mockIsApiError.mockReturnValue(true);

    renderVerifyEmailPage('invalid-token');

    await waitFor(() => {
      expect(screen.getByText('Invalid Link')).toBeInTheDocument();
      expect(screen.getByText('Invalid verification link. The token is invalid or malformed.')).toBeInTheDocument();
    });
  });

  it('validation error is handled safely', async () => {
    const error = createApiError('VALIDATION_ERROR', 400, 'Validation failed');
    mockVerifyEmail.mockRejectedValue(error);
    mockIsApiError.mockReturnValue(true);

    renderVerifyEmailPage('bad-token');

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.getByText('An error occurred during verification. Please try again or request a new verification email.')).toBeInTheDocument();
    });
  });

  it('network error shows safe generic message', async () => {
    const error = createApiError('NETWORK_ERROR', 0, 'Network error. Check your connection.');
    mockVerifyEmail.mockRejectedValue(error);
    mockIsApiError.mockReturnValue(true);

    renderVerifyEmailPage('network-error-token');

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.getByText('An error occurred during verification. Please try again or request a new verification email.')).toBeInTheDocument();
    });
  });

  it('loading state is displayed while request is pending', async () => {
    let resolveVerify: () => void;
    const verifyPromise = new Promise<{ message: string }>((resolve) => {
      resolveVerify = () => resolve({ message: 'Email verification successful.' });
    });
    mockVerifyEmail.mockReturnValue(verifyPromise);
    mockIsApiError.mockReturnValue(false);

    renderVerifyEmailPage('pending-token');

    expect(screen.getByText('Verifying your email...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    resolveVerify!();
    await waitFor(() => {
      expect(screen.getByText('Email Verified')).toBeInTheDocument();
    });
  });

  it('duplicate verification request is prevented', async () => {
    let resolveVerify: () => void;
    const verifyPromise = new Promise<{ message: string }>((resolve) => {
      resolveVerify = () => resolve({ message: 'Email verification successful.' });
    });
    mockVerifyEmail.mockReturnValue(verifyPromise);
    mockIsApiError.mockReturnValue(false);

    renderVerifyEmailPage('duplicate-token');

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledTimes(1);
    });

    resolveVerify!();
  });

  it('token is not written to localStorage', () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderVerifyEmailPage('test-token');
    const tokenCalls = localStorageSpy.mock.calls.filter(
      (call) => typeof call[1] === 'string' && call[1].includes('test-token')
    );
    expect(tokenCalls.length).toBe(0);
    localStorageSpy.mockRestore();
  });

  it('token is not written to sessionStorage', () => {
    const sessionStorageSpy = vi.spyOn(sessionStorage, 'setItem');
    renderVerifyEmailPage('test-token');
    const tokenCalls = sessionStorageSpy.mock.calls.filter(
      (call) => typeof call[1] === 'string' && call[1].includes('test-token')
    );
    expect(tokenCalls.length).toBe(0);
    sessionStorageSpy.mockRestore();
  });

  it('token is not logged', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderVerifyEmailPage('secret-token-123');

    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('secret-token-123'));
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('secret-token-123'));

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('internal navigation uses React Router (Link component)', async () => {
    mockVerifyEmail.mockResolvedValue({ message: 'Email verification successful.' });
    mockIsApiError.mockReturnValue(false);

    renderVerifyEmailPage('valid-token');

    await waitFor(() => {
      const loginLink = screen.getByRole('link', { name: /go to login/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  it('page remains compatible with PublicRoute (no auth redirect on success)', async () => {
    mockVerifyEmail.mockResolvedValue({ message: 'Email verification successful.' });
    mockIsApiError.mockReturnValue(false);

    const { container } = renderVerifyEmailPage('valid-token');

    await waitFor(() => {
      expect(screen.getByText('Email Verified')).toBeInTheDocument();
    });

    expect(container.querySelector('.page__card')).toBeInTheDocument();
  });

  it('StrictMode does not cause duplicate verification requests', async () => {
    mockVerifyEmail.mockResolvedValue({ message: 'Email verification successful.' });
    mockIsApiError.mockReturnValue(false);

    const { unmount } = renderVerifyEmailPage('strict-token');
    unmount();
    renderVerifyEmailPage('strict-token');

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledTimes(2);
    });
  });

  it('already-used token shows login link', async () => {
    const error = createApiError('VERIFICATION_TOKEN_USED', 409, 'The verification token has already been used.');
    mockVerifyEmail.mockRejectedValue(error);
    mockIsApiError.mockReturnValue(true);

    renderVerifyEmailPage('used-token');

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
    });
  });

  it('expired token shows request new verification link', async () => {
    const error = createApiError('VERIFICATION_TOKEN_EXPIRED', 409, 'The verification token has expired.');
    mockVerifyEmail.mockRejectedValue(error);
    mockIsApiError.mockReturnValue(true);

    renderVerifyEmailPage('expired-token');

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /request new verification/i })).toBeInTheDocument();
    });
  });

  it('invalid token shows request new verification link', async () => {
    const error = createApiError('INVALID_VERIFICATION_TOKEN', 400, 'The verification token is invalid.');
    mockVerifyEmail.mockRejectedValue(error);
    mockIsApiError.mockReturnValue(true);

    renderVerifyEmailPage('invalid-token');

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /request new verification/i })).toBeInTheDocument();
    });
  });
});