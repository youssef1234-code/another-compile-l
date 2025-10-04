/**
 * React Router Configuration
 * 
 * @module app/router
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

// Layouts
import { AppLayout } from '@/components/layout/AppLayout';

// Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { SignupPage } from '@/features/auth/pages/SignupPage';
import { SignupVendorPage } from '@/features/auth/pages/SignupVendorPage';
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { EventsPage } from '@/features/events/pages/EventsPage';
import { EventDetailsPage } from '@/features/events/pages/EventDetailsPage';
import { MyEventsPage } from '@/features/events/pages/MyEventsPage';
import { FavoritesPage } from '@/features/events/pages/FavoritesPage';
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';

// Protected Route Component
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  // Auth Routes (no layout wrapper - each page handles its own layout)
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.SIGNUP,
    element: <SignupPage />,
  },
  {
    path: ROUTES.SIGNUP_VENDOR,
    element: <SignupVendorPage />,
  },
  {
    path: ROUTES.VERIFY_EMAIL,
    element: <VerifyEmailPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.EVENTS,
        element: <EventsPage />,
      },
      {
        path: ROUTES.EVENT_DETAILS,
        element: <EventDetailsPage />,
      },
      {
        path: ROUTES.MY_EVENTS,
        element: <MyEventsPage />,
      },
      {
        path: ROUTES.FAVORITES,
        element: <FavoritesPage />,
      },
      {
        path: ROUTES.PROFILE,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.ADMIN_USERS,
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
