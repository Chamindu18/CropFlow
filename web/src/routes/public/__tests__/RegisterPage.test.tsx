import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../../app/providers';
import RegisterPage from '../RegisterPage';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { type ApiError } from '../../../shared/api/error';

vi.mock('../../../features/auth/hooks/useAuth');

const mockRegister = vi.fn();
const mockIsRestoring = false;

const renderRegisterPage = (overrides: Partial<{ isRestoring: boolean; isAuthenticated: boolean }> = {}) => {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: false,
    isRestoring: overrides.isRestoring ?? mockIsRestoring,
    user: null,
    accessToken: null,
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
    refresh: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AppProviders>
        <RegisterPage />
      </AppProviders>
    </MemoryRouter>
  );
};

const createApiError = (code: string, status: number, message: string, details?: Record<string, string>): ApiError => ({
  status,
  code,
  message,
  path: '/auth/register',
  details: details ?? {},
});

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRegister.mockResolvedValue({
      message: 'Registration successful. Please verify your email.',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      status: 'PENDING_VERIFICATION',
    });
  });

  it('renders all required fields', () => {
    renderRegisterPage();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone (Optional)')).toBeInTheDocument();
  });

  it('renders role selection with FARMER, BUYER, TRANSPORTER', () => {
    renderRegisterPage();
    expect(screen.getByRole('radio', { name: 'Farmer' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Buyer' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Transporter' })).toBeInTheDocument();
  });

  it('does not render ADMIN role', () => {
    renderRegisterPage();
    expect(screen.queryByRole('radio', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'ADMIN' })).not.toBeInTheDocument();
  });

  it('renders login link', () => {
    renderRegisterPage();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('rejects missing required fields', async () => {
    renderRegisterPage();
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      // Role is pre-selected as BUYER by default, so no role error expected
    });
  });

  it('rejects invalid email', async () => {
    renderRegisterPage();
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('rejects invalid password (too short)', async () => {
    renderRegisterPage();
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.blur(passwordInput);
    await waitFor(() => {
      expect(screen.getByText('Too small: expected string to have >=12 characters')).toBeInTheDocument();
    });
  });

  it('rejects mismatched password confirmation', async () => {
    renderRegisterPage();
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'different123456' } });
    fireEvent.blur(confirmInput);
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('submits valid FARMER registration', async () => {
    renderRegisterPage();
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const farmerRadio = screen.getByRole('radio', { name: 'Farmer' });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'farmer@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'password123456' } });
    fireEvent.click(farmerRadio);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'farmer@example.com',
        password: 'password123456',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        role: 'FARMER',
      });
    });
  });

  it('submits valid BUYER registration', async () => {
    renderRegisterPage();
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const buyerRadio = screen.getByRole('radio', { name: 'Buyer' });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
    fireEvent.change(emailInput, { target: { value: 'buyer@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'password123456' } });
    fireEvent.click(buyerRadio);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'buyer@example.com',
        password: 'password123456',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: null,
        role: 'BUYER',
      });
    });
  });

  it('submits valid TRANSPORTER registration', async () => {
    renderRegisterPage();
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const phoneInput = screen.getByLabelText('Phone (Optional)');
    const transporterRadio = screen.getByRole('radio', { name: 'Transporter' });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'Bob' } });
    fireEvent.change(lastNameInput, { target: { value: 'Wilson' } });
    fireEvent.change(emailInput, { target: { value: 'transporter@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'password123456' } });
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    fireEvent.click(transporterRadio);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'transporter@example.com',
        password: 'password123456',
        firstName: 'Bob',
        lastName: 'Wilson',
        phone: '+1234567890',
        role: 'TRANSPORTER',
      });
    });
  });

  it('successful registration shows verification/success state', async () => {
    renderRegisterPage();
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const farmerRadio = screen.getByRole('radio', { name: 'Farmer' });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'farmer@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'password123456' } });
    fireEvent.click(farmerRadio);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Registration Successful')).toBeInTheDocument();
      expect(screen.getByText('Registration successful. Please verify your email.')).toBeInTheDocument();
      expect(screen.getByText(/A verification email has been sent to farmer@example\.com\./)).toBeInTheDocument();
    });
  });

  it('REGISTRATION_CONFLICT displays appropriate message', async () => {
    const error = createApiError('CONFLICT', 409, 'Conflict', {
      email: 'An account with this email already exists.',
    });
    mockRegister.mockRejectedValue(error);

    renderRegisterPage();
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const farmerRadio = screen.getByRole('radio', { name: 'Farmer' });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'password123456' } });
    fireEvent.click(farmerRadio);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists')).toBeInTheDocument();
    });
  });

  it('backend validation error displays field messages', async () => {
    const error = createApiError('VALIDATION_ERROR', 400, 'Validation failed', {
      firstName: 'First name must be between 2 and 100 characters',
      password: 'Password must be between 12 and 128 characters',
    });
    mockRegister.mockRejectedValue(error);

    renderRegisterPage();
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const farmerRadio = screen.getByRole('radio', { name: 'Farmer' });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'password123456' } });
    fireEvent.click(farmerRadio);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('First name must be between 2 and 100 characters')).toBeInTheDocument();
      expect(screen.getByText('Password must be between 12 and 128 characters')).toBeInTheDocument();
    });
  });

  it('network error displays safe generic message', async () => {
    const error = createApiError('NETWORK_ERROR', 0, 'Network error. Check your connection.');
    mockRegister.mockRejectedValue(error);

    renderRegisterPage();
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const farmerRadio = screen.getByRole('radio', { name: 'Farmer' });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'password123456' } });
    fireEvent.click(farmerRadio);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('submit button is disabled and shows loading while request is pending', async () => {
    let resolveRegister: () => void;
    const registerPromise = new Promise<void>((resolve) => {
      resolveRegister = resolve;
    });
    mockRegister.mockReturnValue(registerPromise);

    renderRegisterPage();
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const farmerRadio = screen.getByRole('radio', { name: 'Farmer' });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'password123456' } });
    fireEvent.click(farmerRadio);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
    });

    resolveRegister!();
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('duplicate submission is prevented', async () => {
    let resolveRegister: () => void;
    const registerPromise = new Promise<void>((resolve) => {
      resolveRegister = resolve;
    });
    mockRegister.mockReturnValue(registerPromise);

    renderRegisterPage();
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const farmerRadio = screen.getByRole('radio', { name: 'Farmer' });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123456' } });
    fireEvent.change(confirmInput, { target: { value: 'password123456' } });
    fireEvent.click(farmerRadio);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });

    resolveRegister!();
  });

  it('shows loading state when isRestoring is true', () => {
    renderRegisterPage({ isRestoring: true });
    expect(screen.getByText('Restoring session...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('RegisterPage route safety', () => {
  it('does not access localStorage for tokens', () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, 'getItem');
    renderRegisterPage();
    const localStorageCalls = localStorageSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && (call[0].includes('token') || call[0].includes('auth') || call[0].includes('access'))
    );
    expect(localStorageCalls.length).toBe(0);
    localStorageSpy.mockRestore();
  });

  it('does not access sessionStorage for tokens', () => {
    const sessionStorageSpy = vi.spyOn(sessionStorage, 'getItem');
    renderRegisterPage();
    const sessionStorageCalls = sessionStorageSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && (call[0].includes('token') || call[0].includes('auth') || call[0].includes('access'))
    );
    expect(sessionStorageCalls.length).toBe(0);
    sessionStorageSpy.mockRestore();
  });

  it('does not log password values', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderRegisterPage();
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'secretpassword123' } });

    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('secretpassword123'));
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('secretpassword123'));

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});