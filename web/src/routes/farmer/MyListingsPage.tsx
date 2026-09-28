import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyListings } from '../../features/marketplace/api';
import type { ListingResponse, Page } from '../../features/marketplace/types';
import type { ApiError } from '../../shared/api/error';

const DEFAULT_PAGE_SIZE = 20;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncateDescription(description: string, maxLength: number): string {
  if (description.length <= maxLength) return description;
  return `${description.slice(0, maxLength).trim()}…`;
}

function StatusBadge({ status }: { status: ListingResponse['status'] }) {
  const statusConfig: Record<ListingResponse['status'], { label: string; className: string }> = {
    DRAFT: { label: 'Draft', className: 'status-badge--draft' },
    ACTIVE: { label: 'Active', className: 'status-badge--active' },
    SOLD: { label: 'Sold', className: 'status-badge--sold' },
    CANCELLED: { label: 'Cancelled', className: 'status-badge--cancelled' },
  };

  const { label, className } = statusConfig[status];
  return (
    <span className={`status-badge ${className}`} aria-label={`Status: ${label}`}>
      {label}
    </span>
  );
}

function ListingTableRow({ listing }: { listing: ListingResponse }) {
  return (
    <tr>
      <td className="listings-table__cell listings-table__cell--listing">
        <Link
          to={`/app/farmer/listings/${listing.id}`}
          className="listings-table__listing-link"
          aria-label={`View ${listing.title}`}
        >
          <div className="listings-table__listing-title">{listing.title}</div>
          <div className="listings-table__listing-description">
            {truncateDescription(listing.description, 100)}
          </div>
        </Link>
      </td>
      <td className="listings-table__cell">
        <StatusBadge status={listing.status} />
      </td>
      <td className="listings-table__cell">{formatDate(listing.createdAt)}</td>
      <td className="listings-table__cell">{formatDate(listing.updatedAt)}</td>
      <td className="listings-table__cell listings-table__cell--actions">
        <Link
          to={`/app/farmer/listings/${listing.id}`}
          className="btn btn--secondary btn--sm"
          aria-label={`View ${listing.title}`}
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function ListingCard({ listing }: { listing: ListingResponse }) {
  return (
    <article className="listing-card">
      <Link
        to={`/app/farmer/listings/${listing.id}`}
        className="listing-card__link"
        aria-label={`View ${listing.title}`}
      >
        <header className="listing-card__header">
          <h3 className="listing-card__title">{listing.title}</h3>
          <StatusBadge status={listing.status} />
        </header>
        <p className="listing-card__description">{truncateDescription(listing.description, 150)}</p>
        <footer className="listing-card__footer">
          <div className="listing-card__dates">
            <span>Created: {formatDate(listing.createdAt)}</span>
            <span>Updated: {formatDate(listing.updatedAt)}</span>
          </div>
        </footer>
      </Link>
      <footer className="listing-card__actions">
        <Link
          to={`/app/farmer/listings/${listing.id}`}
          className="btn btn--secondary btn--sm"
          aria-label={`View ${listing.title}`}
        >
          View
        </Link>
      </footer>
    </article>
  );
}

function ListingsTable({ listings }: { listings: ListingResponse[] }) {
  return (
    <div className="listings-table-wrapper" role="region" aria-label="Listings table" tabIndex={0}>
      <table className="listings-table">
        <thead>
          <tr>
            <th scope="col">Listing</th>
            <th scope="col">Status</th>
            <th scope="col">Created</th>
            <th scope="col">Updated</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <ListingTableRow key={listing.id} listing={listing} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListingsCards({ listings }: { listings: ListingResponse[] }) {
  return (
    <div className="listings-cards" role="list" aria-label="Listings">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 0}
        aria-label="Previous page"
      >
        Previous
      </button>
      <span className="pagination__info" aria-live="polite">
        Page {currentPage + 1} of {totalPages}
      </span>
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages - 1}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}

function EmptyState({ onCreateListing }: { onCreateListing: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">📋</div>
      <h2 className="empty-state__title">No listings yet</h2>
      <p className="empty-state__description">
        You haven't created any crop listings yet. Get started by creating your first listing.
      </p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={onCreateListing}
      >
        Create Listing
      </button>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
  isAuthError,
}: {
  error: ApiError;
  onRetry: () => void;
  isAuthError: boolean;
}) {
  const isNetworkError = error.status === 0 || error.code === 'NETWORK_ERROR';
  const isTimeout = error.code === 'TIMEOUT';

  let title = 'Unable to load listings';
  let description = 'An unexpected error occurred. Please try again.';

  if (isAuthError || error.code === 'UNAUTHORIZED') {
    title = 'Authentication required';
    description = 'Your session has expired. Please log in again to view your listings.';
  } else if (isNetworkError) {
    title = 'Connection error';
    description = 'Unable to connect to the server. Check your internet connection and try again.';
  } else if (isTimeout) {
    title = 'Request timed out';
    description = 'The request took too long to complete. Please try again.';
  }

  return (
    <div className="error-state" role="alert">
      <div className="error-state__icon" aria-hidden="true">⚠️</div>
      <h2 className="error-state__title">{title}</h2>
      <p className="error-state__description">{description}</p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={onRetry}
        disabled={isAuthError}
      >
        {isAuthError ? 'Please log in' : 'Retry'}
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="loading-state" role="status" aria-label="Loading listings">
      <div className="loading-state__spinner" aria-hidden="true" />
      <p>Loading your listings…</p>
    </div>
  );
}

export default function MyListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchListings = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: Page<ListingResponse> = await getMyListings({ page, size: pageSize });
      setListings(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.number);
    } catch (err) {
      setError(err as ApiError);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchListings(currentPage);
  }, [fetchListings, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchListings(newPage);
    }
  };

  const handleRetry = () => {
    fetchListings(currentPage);
  };

  const handleCreateListing = () => {
    navigate('/app/farmer/listings/new');
  };

  const isAuthError = error?.code === 'UNAUTHORIZED' || error?.status === 401;

  return (
    <div className="page page--listings">
      <header className="page__header">
        <div className="page__header-content">
          <div>
            <h1 className="page__title">My Listings</h1>
            <p className="page__description">
              View and manage all your crop listings. Create new listings or edit existing ones.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleCreateListing}
            aria-label="Create a new listing"
          >
            Create Listing
          </button>
        </div>
      </header>

      {isLoading && <LoadingState />}

      {!isLoading && error && (
        <ErrorState error={error} onRetry={handleRetry} isAuthError={isAuthError} />
      )}

      {!isLoading && !error && listings.length === 0 && (
        <EmptyState onCreateListing={handleCreateListing} />
      )}

      {!isLoading && !error && listings.length > 0 && (
        <>
          <div className="listings-results-info" aria-live="polite">
            Showing {listings.length} of {totalElements} listing{totalElements !== 1 ? 's' : ''}
          </div>
          <ListingsTable listings={listings} />
          <ListingsCards listings={listings} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={isLoading}
          />
        </>
      )}
    </div>
  );
}