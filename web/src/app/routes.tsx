import { createBrowserRouter, Outlet } from 'react-router-dom';
import { SuspenseWrapper } from './SuspenseWrapper';
import { PublicLayout } from '../app/layout/PublicLayout';
import { MainLayout } from '../app/layout/MainLayout';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { PublicRoute } from './guards/PublicRoute';
import { FarmerRoute } from './guards/FarmerRoute';
import NotFoundPage from '../routes/NotFoundPage';
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  MarketplaceBrowsePage,
  ProfilePage,
  MyListingsPage,
  CreateListingPage,
  ListingDetailPage,
} from './lazyRoutes';

export const router = createBrowserRouter([
  {
    Component: PublicLayout,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <LandingPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'login',
        element: (
          <PublicRoute>
            <SuspenseWrapper>
              <LoginPage />
            </SuspenseWrapper>
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicRoute>
            <SuspenseWrapper>
              <RegisterPage />
            </SuspenseWrapper>
          </PublicRoute>
        ),
      },
      {
        path: 'verify-email',
        element: (
          <PublicRoute>
            <SuspenseWrapper>
              <VerifyEmailPage />
            </SuspenseWrapper>
          </PublicRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <PublicRoute>
            <SuspenseWrapper>
              <ForgotPasswordPage />
            </SuspenseWrapper>
          </PublicRoute>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <PublicRoute>
            <SuspenseWrapper>
              <ResetPasswordPage />
            </SuspenseWrapper>
          </PublicRoute>
        ),
      },
    ],
  },
  {
    Component: MainLayout,
    children: [
      {
        path: 'app',
        element: (
          <ProtectedRoute>
            <SuspenseWrapper>
              <Outlet />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <MarketplaceBrowsePage />,
          },
          {
            path: 'marketplace',
            element: <MarketplaceBrowsePage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'farmer',
            element: (
              <FarmerRoute>
                <SuspenseWrapper>
                  <Outlet />
                </SuspenseWrapper>
              </FarmerRoute>
            ),
            children: [
              {
                path: 'listings',
                element: <MyListingsPage />,
              },
              {
                path: 'listings/new',
                element: <CreateListingPage />,
              },
              {
                path: 'listings/:id',
                element: <ListingDetailPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);