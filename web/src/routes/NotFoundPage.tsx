import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page page--not-found">
      <div className="page__card">
        <h1 className="page__title">404 - Page Not Found</h1>
        <p className="page__description">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/app/marketplace" className="page__link">
          Go to Marketplace
        </Link>
      </div>
    </div>
  );
}
