/**
 * React Router Configuration
 *
 * @module app/router
 */

import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";

// Layouts
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SignupPage } from "@/features/auth/pages/SignupPage";
import { SignupVendorPage } from "@/features/auth/pages/SignupVendorPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { RequestVerificationPage } from "@/features/auth/pages/RequestVerificationPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";

// Dashboard
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { NotificationsPage } from "@/features/dashboard/pages";

// Events
import { EventsPage, EventDetailsPage } from "@/features/events/pages";
import { MyEventsPage } from "@/features/events/pages/MyEventsPage";
import { FavoritesPage } from "@/features/events/pages/FavoritesPage";
import { EditBazaarPage } from "@/features/events/pages/EditBazaarPage";
import {
  MyRegistrationsPage,
  CreateTripPage,
  CreateBazaarPage,
  CreateConferencePage,
  EditWorkshopPage,
  EditTripPage,
  EditConferencePage,
} from "@/features/events/pages";

// Vendors
import {
  BazaarsListPage,
  VendorApplicationsPage,
  LoyaltyProgramPage,
  VendorLoyaltyPage,
  VendorRequestsPage,
  PlatformBoothApplicationPage,
} from "@/features/vendors/pages";

// Platform
import { PlatformSetupPage } from "@/features/platform/pages/PlatformSetupPage";

// Gym & Sports
import {
  GymSchedulePage,
  MySessionsPage,
  ManageSessionsPage,
  CourtBookingsPage,
} from "@/features/gym/pages";
import { CourtManagementPage } from "@/features/gym/pages/CourtManagementPage";

// Landing
import { LandingPage } from "@/features/landing/LandingPage";

// Admin
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage";
import {
  CommentsPage,
  ReportsPage,
} from "@/features/admin/pages";

// Events - Back Office
import { BackOfficeEventsPage } from "@/features/events/pages";

// Events Office
import { BazaarManagementPage } from "@/features/events-office/pages/BazaarManagementPage";
import {
  // WorkshopApprovalsPage, // Removed - functionality moved to BackOfficeEventsPage
  VendorPollsPage,
  EventOfficeReportsPage,
  QRCodesPage,
} from "@/features/events-office/pages";

// Wallet
import { WalletPage } from "@/features/wallet/pages";

// Profile
import { ProfilePage } from "@/features/profile/pages/ProfilePage";

// Reports
import { EventsReportPage } from "@/features/reports/EventsReportPage";
import { SalesReportPage } from "@/features/reports/SalesReportPage";

// Protected Route Component
import {
  ProtectedRoute,
  AdminRoute,
  VendorRoute,
  EventOfficeRoute,
  EventManagementRoute
} from "@/components/auth/ProtectedRoute";
import InsufficientFundsPage from "@/features/payments/pages/InsufficientFundsPage";
import PaymentSuccessPage from "@/features/payments/pages/PaymentSuccessPage";
import PaymentPage from "@/features/payments/pages/PaymentPage";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
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
    path: "/request-verification",
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
    path: "/",
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
        path: ROUTES.LOYALTY_PROGRAM,
        element: <LoyaltyProgramPage />,
      },
      {
        path: ROUTES.CREATE_WORKSHOP,
        element: <Navigate to={ROUTES.ADMIN_EVENTS} replace />, // Redirects to BackOfficeEventsPage - use Create button
      },
      {
        path: ROUTES.MY_WORKSHOPS,
        element: <Navigate to={ROUTES.ADMIN_EVENTS} replace />, // Redirects to BackOfficeEventsPage
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
      {
        path: ROUTES.EDIT_WORKSHOP,
        element: <EditWorkshopPage />,
      },
      {
        path: ROUTES.EDIT_TRIP,
        element: <EditTripPage />,
      },
      {
        path: ROUTES.EDIT_CONFERENCE,
        element: <EditConferencePage />,
      },
      {
        path: ROUTES.EDIT_BAZAAR,
        element: <EditBazaarPage />,
      },

      // {
      //   path: ROUTES.EVENT_PAY,
      //   element: <PaymentChoicePage />,
      // },
      // {
      //   path: "/events/:eventId/registrations/:registrationId/pay",
      //   element: <PaymentMethodsPage />,
      // },
      // {
      //   path: "/checkout/:paymentId", // << you’re using this shape
      //   element: <CardCheckoutPage />,
      // },
      // {
      //   path: "/payments/result/:paymentId",
      //   element: <PaymentResultPage />,
      // },
      // payments
      {
        path: ROUTES.VENDOR_CHECKOUT,
        element: <PaymentPage isVendor={true} />, // requires auth wrapper if all app is protected
      },
      {
        path: ROUTES.CHECKOUT_PAGE,
        element: <PaymentPage isVendor={false} />, 
      },
      {
        path: ROUTES.PAY_SUCCESS,
        element: <PaymentSuccessPage />,
      },
      {
        path: ROUTES.PAY_INSUFFICIENT,
        element: <InsufficientFundsPage />,
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
        path: ROUTES.APPLY_PLATFORM_BOOTH,
        element: <PlatformBoothApplicationPage />,
      },
      {
        path: ROUTES.VENDOR_LOYALTY,
        element: (
          <VendorRoute>
            <VendorLoyaltyPage />
          </VendorRoute>
        ),
      },
      {
        path: ROUTES.VENDOR_REQUESTS,
        element: (
          <EventManagementRoute>
            <VendorRequestsPage />
          </EventManagementRoute>
        ),
      },
      {
        path: ROUTES.PLATFORM_SETUP,
        element: (
          <EventManagementRoute>
            <PlatformSetupPage />
          </EventManagementRoute>
        ),
      },
      {
        path: ROUTES.ALL_APPLICATIONS,
        element: (
          <EventManagementRoute>
            <VendorRequestsPage />
          </EventManagementRoute>
        ),
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
        path: ROUTES.COURT_MANAGEMENT,
        element: (
          <EventManagementRoute>
            <CourtManagementPage />
          </EventManagementRoute>
        ),
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
        path: ROUTES.ADMIN_EVENTS,
        element: (
          <EventManagementRoute>
            <BackOfficeEventsPage />
          </EventManagementRoute>
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
        path: ROUTES.ADMIN_REPORTS,
        element: (
          <AdminRoute>
            <ReportsPage />
          </AdminRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_LOYALTY,
        element: <LoyaltyProgramPage />,
      },

      // Events Office Routes
      {
        path: ROUTES.WORKSHOP_APPROVALS,
        element: <Navigate to={ROUTES.ADMIN_EVENTS} replace />, // Redirects to BackOfficeEventsPage
      },
      {
        path: ROUTES.VENDOR_POLLS,
        element: (
          <EventOfficeRoute>
            <VendorPollsPage />
          </EventOfficeRoute>
        ),
      },
      {
        path: ROUTES.EVENT_OFFICE_REPORTS,
        element: (
          <EventOfficeRoute>
            <EventOfficeReportsPage />
          </EventOfficeRoute>
        ),
      },
      {
        path: ROUTES.QR_CODES,
        element: (
          <EventOfficeRoute>
            <QRCodesPage />
          </EventOfficeRoute>
        ),
      },
      {
        path: ROUTES.BAZAAR_MANAGEMENT,
        element: (
          <EventOfficeRoute>
            <BazaarManagementPage />
          </EventOfficeRoute>
        ),
      },

      {
        path: ROUTES.EVENTS_REPORTS,
        element: (
          <EventOfficeRoute>
            <EventsReportPage />
          </EventOfficeRoute>
        ),
      },
      {
        path: ROUTES.SALES_REPORTS,
        element: (
          <EventOfficeRoute>
            <SalesReportPage />
          </EventOfficeRoute>
        ),
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
