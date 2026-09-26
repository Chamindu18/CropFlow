import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { LoginRequestSchema } from '../../features/auth/types';
import { isApiError } from '../../shared/api/error';

interface FormErrors {
  email?: string;
  password?: string;
  server?: string;
}

export default function LoginPage() {
  const { login, isRestoring } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'email') {
      if (!value) return 'Email is required';
      const result = LoginRequestSchema.shape.email.safeParse(value);
      if (!result.success) return 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
    }
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (submitAttempted) {
      const error = validateField('email', value);
      setErrors((prev) => ({ ...prev, email: error }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (submitAttempted) {
      const error = validateField('password', value);
      setErrors((prev) => ({ ...prev, password: error }));
    }
  };

  const handleEmailBlur = () => {
    const error = validateField('email', email);
    setErrors((prev) => ({ ...prev, email: error }));
  };

  const handlePasswordBlur = () => {
    const error = validateField('password', password);
    setErrors((prev) => ({ ...prev, password: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);

    if (emailError || passwordError) {
      setErrors((prev) => ({ ...prev, email: emailError, password: passwordError }));
      return;
    }

    setErrors((prev) => ({ ...prev, server: undefined }));
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/app/marketplace', { replace: true });
    } catch (error) {
      if (isApiError(error)) {
        if (error.code === 'INVALID_CREDENTIALS') {
          setErrors((prev) => ({ ...prev, server: 'Invalid email or password' }));
        } else if (error.code === 'VALIDATION_ERROR' && error.details) {
          const fieldErrors: FormErrors = {};
          for (const [field, message] of Object.entries(error.details)) {
            if (field === 'email' || field === 'password') {
              fieldErrors[field as keyof FormErrors] = message;
            }
          }
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        } else {
          setErrors((prev) => ({ ...prev, server: 'An error occurred. Please try again.' }));
        }
      } else {
        setErrors((prev) => ({ ...prev, server: 'An unexpected error occurred. Please try again.' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRestoring) {
    return (
      <div className="auth-loading" role="status" aria-label="Restoring authentication">
        <div className="auth-loading__spinner" />
        <p>Restoring session...</p>
      </div>
    );
  }

  return (
    <div className="page page--auth">
      <div className="page__card">
        <h1 className="page__title">Login</h1>
        <p className="page__description">
          Sign in to your CropFlow account to access the marketplace and manage your listings.
        </p>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-field">
            <label htmlFor="email" className="form-field__label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              className={`form-field__input ${errors.email ? 'form-field__input--error' : ''}`}
              disabled={isSubmitting}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="form-field__error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password" className="form-field__label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              className={`form-field__input ${errors.password ? 'form-field__input--error' : ''}`}
              disabled={isSubmitting}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="form-field__error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {errors.server && (
            <div className="form-field__server-error" role="alert">
              {errors.server}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary login-form__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="btn__spinner" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="login-form__links">
          <Link to="/register" className="page__link">
            Create an account
          </Link>
          <span className="login-form__separator" aria-hidden="true">
            &middot;
          </span>
          <Link to="/forgot-password" className="page__link">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}