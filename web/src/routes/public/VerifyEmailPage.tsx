import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../../features/auth/api';
import { isApiError } from '../../shared/api/error';

type VerificationState = 'loading' | 'success' | 'invalid-token' | 'expired' | 'already-used' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    let cancelled = false;

    const runVerification = async () => {
      if (!token) {
        if (!cancelled) {
          setState('invalid-token');
          setMessage('Invalid verification link. The verification token is missing.');
        }
        return;
      }

      try {
        const response = await verifyEmail(token);
        if (!cancelled) {
          setState('success');
          setMessage(response.message || 'Email verified successfully.');
        }
      } catch (error) {
        if (cancelled) return;

        if (isApiError(error)) {
          switch (error.code) {
            case 'VERIFICATION_TOKEN_EXPIRED':
              setState('expired');
              setMessage('Verification link expired. Please request a new verification email.');
              break;
            case 'VERIFICATION_TOKEN_USED':
              setState('already-used');
              setMessage('Email already verified. You can now sign in to your account.');
              break;
            case 'INVALID_VERIFICATION_TOKEN':
              setState('invalid-token');
              setMessage('Invalid verification link. The token is invalid or malformed.');
              break;
            case 'INVALID_ACCOUNT_STATE':
              setState('error');
              setMessage('This account cannot be verified in its current state.');
              break;
            default:
              setState('error');
              setMessage('An error occurred during verification. Please try again or request a new verification email.');
          }
        } else {
          setState('error');
          setMessage('An unexpected error occurred. Please try again.');
        }
      }
    };

    runVerification();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === 'loading') {
    return (
      <div className="page page--auth">
        <div className="page__card">
          <div className="auth-loading" role="status" aria-live="polite" aria-label="Verifying email">
            <div className="auth-loading__spinner" />
            <p>Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (state) {
      case 'success':
        return {
          title: 'Email Verified',
          icon: '✓',
          iconClass: 'status-icon--success',
          description: message,
          action: (
            <Link to="/login" className="btn btn--primary">
              Go to Login
            </Link>
          ),
        };
      case 'expired':
        return {
          title: 'Link Expired',
          icon: '⏱',
          iconClass: 'status-icon--warning',
          description: message,
          action: (
            <Link to="/forgot-password" className="btn btn--secondary">
              Request New Verification
            </Link>
          ),
        };
      case 'already-used':
        return {
          title: 'Already Verified',
          icon: '✓',
          iconClass: 'status-icon--info',
          description: message,
          action: (
            <Link to="/login" className="btn btn--primary">
              Go to Login
            </Link>
          ),
        };
      case 'invalid-token':
        return {
          title: 'Invalid Link',
          icon: '✕',
          iconClass: 'status-icon--error',
          description: message,
          action: (
            <Link to="/forgot-password" className="btn btn--secondary">
              Request New Verification
            </Link>
          ),
        };
      default:
        return {
          title: 'Verification Failed',
          icon: '⚠',
          iconClass: 'status-icon--error',
          description: message || 'An error occurred. Please try again.',
          action: (
            <Link to="/forgot-password" className="btn btn--secondary">
              Request New Verification
            </Link>
          ),
        };
    }
  };

  const { title, icon, iconClass, description, action } = getStatusConfig();

  return (
    <div className="page page--auth">
      <div className="page__card">
        <div className={`verification-status ${iconClass}`}>
          <span className="status-icon" aria-hidden="true">{icon}</span>
          <h1 className="page__title">{title}</h1>
          <p className="page__description">{description}</p>
          <div className="verification-status__actions">
            {action}
          </div>
        </div>
      </div>
    </div>
  );
}