import { useAuth } from '../../features/auth/hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="page">
      <h1 className="page__title">Profile</h1>
      <p className="page__description">
        View and manage your account settings and preferences.
      </p>
      {user && (
        <div className="page__user-info">
          <h2>Account Information</h2>
          <dl>
            <dt>Name</dt>
            <dd>{user.firstName} {user.lastName}</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Role</dt>
            <dd>{user.role}</dd>
            <dt>Status</dt>
            <dd>{user.status}</dd>
            <dt>Email Verified</dt>
            <dd>{user.emailVerified ? 'Yes' : 'No'}</dd>
          </dl>
        </div>
      )}
      <div className="page__placeholder">
        <p>Profile management features will be implemented here.</p>
      </div>
    </div>
  );
}
