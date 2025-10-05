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
import { RequestVerificationPage } from '@/features/auth/pages/RequestVerificationPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';

// Dashboard
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { NotificationsPage } from '@/features/dashboard/pages';

// Events
import { EventsPage } from '@/features/events/pages/EventsPage';
import { EventDetailsPage } from '@/features/events/pages/EventDetailsPage';
import { MyEventsPage } from '@/features/events/pages/MyEventsPage';
import { FavoritesPage } from '@/features/events/pages/FavoritesPage';
import {
  MyRegistrationsPage,
  CreateWorkshopPage,
  MyWorkshopsPage,
  CreateTripPage,
  CreateBazaarPage,
  CreateConferencePage,
} from '@/features/events/pages';

// Vendors
import {
  BazaarsListPage,
  VendorApplicationsPage,
  LoyaltyProgramPage,
  VendorRequestsPage,
} from '@/features/vendors/pages';

// Gym & Sports
import {
  GymSchedulePage,
  MySessionsPage,
  CourtBookingsPage,
  ManageSessionsPage,
} from '@/features/gym/pages';

// Admin
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage';
import {
  AcademicRoleApprovalsPage,
  VendorApprovalsPage,
  CommentsPage,
  ManageAccountsPage,
  ReportsPage,
} from '@/features/admin/pages';

// Events Office
import {
  WorkshopApprovalsPage,
  VendorPollsPage,
  EventOfficeReportsPage,
  QRCodesPage,
} from '@/features/events-office/pages';

// Wallet
import { WalletPage } from '@/features/wallet/pages';

// Profile
import { ProfilePage } from '@/features/profile/pages/ProfilePage';

// Protected Route Component
import { ProtectedRoute, AdminRoute } from '@/components/auth/ProtectedRoute';

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
    path: '/request-verification',
    element: <RequestVerificationPage />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: <ResetPasswordPage />,
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
        path: ROUTES.NOTIFICATIONS,
        element: <NotificationsPage />,
      },
      
      // Events Routes
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
        path: ROUTES.MY_REGISTRATIONS,
        element: <MyRegistrationsPage />,
      },
      {
        path: ROUTES.FAVORITES,
        element: <FavoritesPage />,
      },
      {
        path: ROUTES.CREATE_WORKSHOP,
        element: <CreateWorkshopPage />,
      },
      {
        path: ROUTES.MY_WORKSHOPS,
        element: <MyWorkshopsPage />,
      },
      {
        path: ROUTES.CREATE_TRIP,
        element: <CreateTripPage />,
      },
      {
        path: ROUTES.CREATE_BAZAAR,
        element: <CreateBazaarPage />,
      },
      {
        path: ROUTES.CREATE_CONFERENCE,
        element: <CreateConferencePage />,
      },
      
      // Vendor Routes
      {
        path: ROUTES.BROWSE_BAZAARS,
        element: <BazaarsListPage />,
      },
      {
        path: ROUTES.VENDOR_APPLICATIONS,
        element: <VendorApplicationsPage />,
      },
      {
        path: ROUTES.LOYALTY_PROGRAM,
        element: <LoyaltyProgramPage />,
      },
      {
        path: ROUTES.VENDOR_REQUESTS,
        element: <VendorRequestsPage />,
      },
      
      // Gym & Sports Routes
      {
        path: ROUTES.GYM_SCHEDULE,
        element: <GymSchedulePage />,
      },
      {
        path: ROUTES.MY_SESSIONS,
        element: <MySessionsPage />,
      },
      {
        path: ROUTES.COURT_BOOKINGS,
        element: <CourtBookingsPage />,
      },
      {
        path: ROUTES.MANAGE_SESSIONS,
        element: <ManageSessionsPage />,
      },
      
      // Admin Routes
      {
        path: ROUTES.ADMIN_USERS,
        element: (
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_ROLE_APPROVALS,
        element: (
          <AdminRoute>
            <AcademicRoleApprovalsPage />
          </AdminRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_VENDOR_APPROVALS,
        element: (
          <AdminRoute>
            <VendorApprovalsPage />
          </AdminRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_COMMENTS,
        element: (
          <AdminRoute>
            <CommentsPage />
          </AdminRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_MANAGE_ACCOUNTS,
        element: (
          <AdminRoute>
            <ManageAccountsPage />
          </AdminRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_REPORTS,
        element: (
          <AdminRoute>
            <ReportsPage />
          </AdminRoute>
        ),
      },
      
      // Events Office Routes
      {
        path: ROUTES.WORKSHOP_APPROVALS,
        element: <WorkshopApprovalsPage />,
      },
      {
        path: ROUTES.VENDOR_POLLS,
        element: <VendorPollsPage />,
      },
      {
        path: ROUTES.EVENT_OFFICE_REPORTS,
        element: <EventOfficeReportsPage />,
      },
      {
        path: ROUTES.QR_CODES,
        element: <QRCodesPage />,
      },
      
      // Wallet
      {
        path: ROUTES.WALLET,
        element: <WalletPage />,
      },
      
      // Profile
      {
        path: ROUTES.PROFILE,
        element: <ProfilePage />,
      },
    ],
  },
]);
