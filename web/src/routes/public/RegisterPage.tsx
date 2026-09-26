import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { type RegistrationRole } from '../../features/auth/types';
import { isApiError } from '../../shared/api/error';
import { z } from 'zod';

type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  server?: string;
};

const ROLE_OPTIONS: { value: RegistrationRole; label: string; description: string }[] = [
  { value: 'FARMER', label: 'Farmer', description: 'Sell crops and manage listings' },
  { value: 'BUYER', label: 'Buyer', description: 'Purchase crops from farmers' },
  { value: 'TRANSPORTER', label: 'Transporter', description: 'Provide logistics and transport services' },
];

const emailSchema = z.string().email().max(254);
const passwordSchema = z.string().min(12).max(128);
const firstNameSchema = z.string().min(2).max(100);
const lastNameSchema = z.string().min(2).max(100);
const phoneSchema = z.string().max(20).optional().nullable();
const roleSchema = z.enum(['FARMER', 'BUYER', 'TRANSPORTER']);

export default function RegisterPage() {
  const { register, isRestoring } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<RegistrationRole | ''>('BUYER');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'email') {
      if (!value) return 'Email is required';
      const result = emailSchema.safeParse(value);
      if (!result.success) return result.error.issues[0]?.message ?? 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      const result = passwordSchema.safeParse(value);
      if (!result.success) return result.error.issues[0]?.message ?? 'Password must be between 12 and 128 characters';
    }
    if (name === 'confirmPassword') {
      if (!value) return 'Please confirm your password';
      if (value !== password) return 'Passwords do not match';
    }
    if (name === 'firstName') {
      if (!value) return 'First name is required';
      const result = firstNameSchema.safeParse(value);
      if (!result.success) return result.error.issues[0]?.message ?? 'First name must be between 2 and 100 characters';
    }
    if (name === 'lastName') {
      if (!value) return 'Last name is required';
      const result = lastNameSchema.safeParse(value);
      if (!result.success) return result.error.issues[0]?.message ?? 'Last name must be between 2 and 100 characters';
    }
    if (name === 'phone' && value) {
      const result = phoneSchema.safeParse(value);
      if (!result.success) return result.error.issues[0]?.message ?? 'Phone must not exceed 20 characters';
    }
    if (name === 'role') {
      if (!value) return 'Please select a role';
      const result = roleSchema.safeParse(value);
      if (!result.success) return 'Invalid role selected';
    }
    return undefined;
  };

  const handleChange = (name: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (submitAttempted) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: string, value: string) => {
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateAll = (): boolean => {
    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);
    const confirmPasswordError = validateField('confirmPassword', confirmPassword);
    const firstNameError = validateField('firstName', firstName);
    const lastNameError = validateField('lastName', lastName);
    const phoneError = validateField('phone', phone);
    const roleError = validateField('role', role);

    const hasErrors = emailError || passwordError || confirmPasswordError || firstNameError || lastNameError || phoneError || roleError;

    setErrors({
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      firstName: firstNameError,
      lastName: lastNameError,
      phone: phoneError,
      role: roleError,
    });

    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!validateAll()) {
      return;
    }

    setErrors((prev) => ({ ...prev, server: undefined }));
    setIsSubmitting(true);

    try {
      const response = await register({ email, password, firstName, lastName, phone: phone || null, role: role as RegistrationRole });
      setSuccessMessage(response.message || 'Registration successful. Please verify your email.');
      setIsSuccess(true);
    } catch (error) {
      if (isApiError(error)) {
        if (error.code === 'CONFLICT' || error.code === 'REGISTRATION_CONFLICT' || (error.status === 409 && error.message.includes('already exists'))) {
          setErrors((prev) => ({ ...prev, email: 'An account with this email already exists' }));
        } else if (error.code === 'VALIDATION_ERROR' && error.details) {
          const fieldErrors: FormErrors = {};
          const validFields: (keyof FormErrors)[] = ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'phone', 'role'];
          for (const [field, message] of Object.entries(error.details)) {
            if (validFields.includes(field as keyof FormErrors)) {
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

  if (isSuccess) {
    return (
      <div className="page page--auth">
        <div className="page__card">
          <h1 className="page__title">Registration Successful</h1>
          <p className="page__description">
            {successMessage}
          </p>
          <div className="page__placeholder" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
            <p>A verification email has been sent to {email}. Please check your inbox and click the verification link to activate your account.</p>
          </div>
          <div className="login-form__links">
            <Link to="/login" className="page__link">
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--auth">
      <div className="page__card">
        <h1 className="page__title">Create Account</h1>
        <p className="page__description">
          Join CropFlow to access the marketplace. Choose your role as a Farmer, Buyer, or Transporter.
        </p>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-field">
            <label htmlFor="firstName" className="form-field__label">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => handleChange('firstName', e.target.value, setFirstName)}
              onBlur={() => handleBlur('firstName', firstName)}
              className={`form-field__input ${errors.firstName ? 'form-field__input--error' : ''}`}
              disabled={isSubmitting}
              aria-invalid={errors.firstName ? 'true' : 'false'}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <p id="firstName-error" className="form-field__error" role="alert">
                {errors.firstName}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="lastName" className="form-field__label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => handleChange('lastName', e.target.value, setLastName)}
              onBlur={() => handleBlur('lastName', lastName)}
              className={`form-field__input ${errors.lastName ? 'form-field__input--error' : ''}`}
              disabled={isSubmitting}
              aria-invalid={errors.lastName ? 'true' : 'false'}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="form-field__error" role="alert">
                {errors.lastName}
              </p>
            )}
          </div>

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
              onChange={(e) => handleChange('email', e.target.value, setEmail)}
              onBlur={() => handleBlur('email', email)}
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => handleChange('password', e.target.value, setPassword)}
              onBlur={() => handleBlur('password', password)}
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

          <div className="form-field">
            <label htmlFor="confirmPassword" className="form-field__label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value, setConfirmPassword)}
              onBlur={() => handleBlur('confirmPassword', confirmPassword)}
              className={`form-field__input ${errors.confirmPassword ? 'form-field__input--error' : ''}`}
              disabled={isSubmitting}
              aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="form-field__error" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="phone" className="form-field__label">
              Phone (Optional)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              value={phone}
              onChange={(e) => handleChange('phone', e.target.value, setPhone)}
              onBlur={() => handleBlur('phone', phone)}
              className={`form-field__input ${errors.phone ? 'form-field__input--error' : ''}`}
              disabled={isSubmitting}
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="form-field__error" role="alert">
                {errors.phone}
              </p>
            )}
          </div>

          <fieldset className="form-field form-field--radio">
            <legend className="form-field__label">Role</legend>
            <div className="form-field__radio-group" role="radiogroup" aria-label="Select your role">
              {ROLE_OPTIONS.map((option) => (
                <label key={option.value} className="form-field__radio-option">
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={() => {
                      setRole(option.value);
                      if (submitAttempted) {
                        const error = validateField('role', option.value);
                        setErrors((prev) => ({ ...prev, role: error }));
                      }
                    }}
                    disabled={isSubmitting}
                    className="form-field__radio-input"
                    aria-label={option.label}
                    aria-describedby={`${option.value}-description`}
                  />
                  <div className="form-field__radio-content">
                    <span className="form-field__radio-label">{option.label}</span>
                    <span id={`${option.value}-description`} className="form-field__radio-description">
                      {option.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {errors.role && (
              <p className="form-field__error" role="alert">
                {errors.role}
              </p>
            )}
          </fieldset>

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
                <span>Creating account...</span>
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="login-form__links">
          <span>Already have an account?</span>
          <Link to="/login" className="page__link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}