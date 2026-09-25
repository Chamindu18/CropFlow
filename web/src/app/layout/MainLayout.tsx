import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

export function MainLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/app/marketplace', label: 'Marketplace' },
    { path: '/app/profile', label: 'Profile' },
  ];

  const farmerNavItems = [
    { path: '/app/farmer/listings', label: 'My Listings' },
    { path: '/app/farmer/listings/new', label: 'Create Listing' },
  ];

  const isFarmer = user?.role === 'FARMER';

  return (
    <div className="main-layout">
      <header className="main-layout__header">
        <nav className="main-layout__nav" aria-label="Main navigation">
          <ul className="main-layout__nav-list">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`main-layout__nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {isFarmer && farmerNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`main-layout__nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="main-layout__user-section">
            {isAuthenticated && user && (
              <>
                <span className="main-layout__user-info">
                  {user.firstName} {user.lastName} ({user.role})
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="main-layout__logout-btn"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="main-layout__main">
        <Outlet />
      </main>
    </div>
  );
}