import { lazy } from 'react';

export const LoginPage = lazy(() => import('../routes/public/LoginPage'));
export const RegisterPage = lazy(() => import('../routes/public/RegisterPage'));
export const VerifyEmailPage = lazy(() => import('../routes/public/VerifyEmailPage'));
export const ForgotPasswordPage = lazy(() => import('../routes/public/ForgotPasswordPage'));
export const ResetPasswordPage = lazy(() => import('../routes/public/ResetPasswordPage'));
export const MarketplaceBrowsePage = lazy(() => import('../routes/authenticated/MarketplaceBrowsePage'));
export const ProfilePage = lazy(() => import('../routes/authenticated/ProfilePage'));
export const MyListingsPage = lazy(() => import('../routes/farmer/MyListingsPage'));
export const CreateListingPage = lazy(() => import('../routes/farmer/CreateListingPage'));
export const ListingDetailPage = lazy(() => import('../routes/farmer/ListingDetailPage'));