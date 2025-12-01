/**
 * React Router Configuration
 *
 * @module app/router
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { PageSkeleton } from "@/components/ui/page-skeleton";

// Layouts
import { AppLayout } from "@/components/layout/AppLayout";

// Auth Pages (loaded eagerly - critical path)
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SignupPage } from "@/features/auth/pages/SignupPage";
import { SignupVendorPage } from "@/features/auth/pages/SignupVendorPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { RequestVerificationPage } from "@/features/auth/pages/RequestVerificationPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";

// Landing (loaded eagerly - entry point)
import { LandingPage } from "@/features/landing/LandingPage";

// Protected Route Components
import {
  ProtectedRoute,
  AdminRoute,
  VendorRoute,
  EventOfficeRoute,
  EventManagementRoute,
} from "@/components/auth/ProtectedRoute";

// Lazy loaded pages - wrapped with Suspense fallback
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType>, variant: "default" | "table" | "cards" | "form" | "dashboard" = "default") => (
  <Suspense fallback={<PageSkeleton variant={variant} />}>
    <Component />
  </Suspense>
);

// Dashboard & Core
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
// NotificationsPage removed - notifications are now in the header bell expandable dialog

// Events
const EventsPage = lazy(() => import("@/features/events/pages").then(m => ({ default: m.EventsPage })));
const EventDetailsPage = lazy(() => import("@/features/events/pages").then(m => ({ default: m.EventDetailsPage })));
const MyEventsPage = lazy(() => import("@/features/events/pages/MyEventsPage").then(m => ({ default: m.MyEventsPage })));
const EditBazaarPage = lazy(() => import("@/features/events/pages/EditBazaarPage").then(m => ({ default: m.EditBazaarPage })));
const CreateTripPage = lazy(() => import("@/features/events/pages").then(m => ({ default: m.CreateTripPage })));
const CreateBazaarPage = lazy(() => import("@/features/events/pages").then(m => ({ default: m.CreateBazaarPage })));
const CreateConferencePage = lazy(() => import("@/features/events/pages").then(m => ({ default: m.CreateConferencePage })));
const EditWorkshopPage = lazy(() => import("@/features/events/pages").then(m => ({ default: m.EditWorkshopPage })));
const EditTripPage = lazy(() => import("@/features/events/pages").then(m => ({ default: m.EditTripPage })));
const EditConferencePage = lazy(() => import("@/features/events/pages").then(m => ({ default: m.EditConferencePage })));
const BackOfficeEventsPage = lazy(() => import("@/features/events/pages").then(m => ({ default: m.BackOfficeEventsPage })));

// Vendors
const BazaarsListPage = lazy(() => import("@/features/vendors/pages").then(m => ({ default: m.BazaarsListPage })));
const VendorApplicationsPage = lazy(() => import("@/features/vendors/pages").then(m => ({ default: m.VendorApplicationsPage })));
const LoyaltyProgramPage = lazy(() => import("@/features/vendors/pages").then(m => ({ default: m.LoyaltyProgramPage })));
const VendorLoyaltyPage = lazy(() => import("@/features/vendors/pages").then(m => ({ default: m.VendorLoyaltyPage })));
const VendorRequestsPage = lazy(() => import("@/features/vendors/pages").then(m => ({ default: m.VendorRequestsPage })));
const PlatformBoothApplicationPage = lazy(() => import("@/features/vendors/pages").then(m => ({ default: m.PlatformBoothApplicationPage })));

// Platform
const PlatformSetupPage = lazy(() => import("@/features/platform/pages/PlatformSetupPage").then(m => ({ default: m.PlatformSetupPage })));

// Gym & Sports
const GymSchedulePage = lazy(() => import("@/features/gym/pages").then(m => ({ default: m.GymSchedulePage })));
// MySessionsPage removed - Coming Soon placeholder
// ManageSessionsPage removed - Coming Soon placeholder
const CourtBookingsPage = lazy(() => import("@/features/gym/pages").then(m => ({ default: m.CourtBookingsPage })));
const CourtManagementPage = lazy(() => import("@/features/gym/pages/CourtManagementPage").then(m => ({ default: m.CourtManagementPage })));

// Admin
const AdminUsersPage = lazy(() => import("@/features/admin/pages/AdminUsersPage").then(m => ({ default: m.AdminUsersPage })));

// Events Office
const BazaarManagementPage = lazy(() => import("@/features/events-office/pages/BazaarManagementPage").then(m => ({ default: m.BazaarManagementPage })));
const VendorPollsPage = lazy(() => import("@/features/events-office/pages").then(m => ({ default: m.VendorPollsPage })));

// Wallet
const WalletPage = lazy(() => import("@/features/wallet/pages").then(m => ({ default: m.WalletPage })));

// Profile
const ProfilePage = lazy(() => import("@/features/profile/pages/ProfilePage").then(m => ({ default: m.ProfilePage })));

// Reports
const EventsReportPage = lazy(() => import("@/features/reports/EventsReportPage").then(m => ({ default: m.EventsReportPage })));
const SalesReportPage = lazy(() => import("@/features/reports/SalesReportPage").then(m => ({ default: m.SalesReportPage })));

// Payments
const PaymentPage = lazy(() => import("@/features/payments/pages/PaymentPage"));
const InsufficientFundsPage = lazy(() => import("@/features/payments/pages/InsufficientFundsPage"));
const PaymentSuccessPage = lazy(() => import("@/features/payments/pages/PaymentSuccessPage"));

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
        element: withSuspense(DashboardPage, "dashboard"),
      },
      // Notifications are now handled via NotificationBell expandable dialog in header

      // Events Routes
      {
        path: ROUTES.EVENTS,
        element: withSuspense(EventsPage, "cards"),
      },
      {
        path: ROUTES.EVENT_DETAILS,
        element: withSuspense(EventDetailsPage, "default"),
      },
      {
        path: ROUTES.MY_EVENTS,
        element: withSuspense(MyEventsPage, "cards"),
      },
      {
        path: ROUTES.MY_REGISTRATIONS,
        element: <Navigate to={`${ROUTES.EVENTS}?tab=registrations`} replace />,
      },
      {
        path: ROUTES.FAVORITES,
        element: <Navigate to={`${ROUTES.EVENTS}?tab=favorites`} replace />,
      },
      {
        path: ROUTES.LOYALTY_PROGRAM,
        element: withSuspense(LoyaltyProgramPage, "cards"),
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
        element: withSuspense(CreateTripPage, "form"),
      },
      {
        path: ROUTES.CREATE_BAZAAR,
        element: withSuspense(CreateBazaarPage, "form"),
      },
      {
        path: ROUTES.CREATE_CONFERENCE,
        element: withSuspense(CreateConferencePage, "form"),
      },
      {
        path: ROUTES.EDIT_WORKSHOP,
        element: withSuspense(EditWorkshopPage, "form"),
      },
      {
        path: ROUTES.EDIT_TRIP,
        element: withSuspense(EditTripPage, "form"),
      },
      {
        path: ROUTES.EDIT_CONFERENCE,
        element: withSuspense(EditConferencePage, "form"),
      },
      {
        path: ROUTES.EDIT_BAZAAR,
        element: withSuspense(EditBazaarPage, "form"),
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
        path: "/checkout/:registrationId",
        element: withSuspense(PaymentPage, "default"), // requires auth wrapper if all app is protected
      },
      {
        path: ROUTES.VENDOR_CHECKOUT,
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <PaymentPage isVendor={true} />
          </Suspense>
        ),
      },
      {
        path: ROUTES.CHECKOUT_PAGE,
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <PaymentPage isVendor={false} />
          </Suspense>
        ),
      },
      {
        path: ROUTES.PAY_SUCCESS,
        element: withSuspense(PaymentSuccessPage, "default"),
      },
      {
        path: ROUTES.PAY_INSUFFICIENT,
        element: withSuspense(InsufficientFundsPage, "default"),
      },

      // Vendor Routes
      {
        path: ROUTES.BROWSE_BAZAARS,
        element: withSuspense(BazaarsListPage, "cards"),
      },
      {
        path: ROUTES.VENDOR_APPLICATIONS,
        element: withSuspense(VendorApplicationsPage, "table"),
      },
      {
        path: ROUTES.APPLY_PLATFORM_BOOTH,
        element: withSuspense(PlatformBoothApplicationPage, "form"),
      },
      {
        path: ROUTES.VENDOR_LOYALTY,
        element: (
          <VendorRoute>
            <Suspense fallback={<PageSkeleton variant="cards" />}>
              <VendorLoyaltyPage />
            </Suspense>
          </VendorRoute>
        ),
      },
      {
        path: ROUTES.VENDOR_REQUESTS,
        element: (
          <EventManagementRoute>
            <Suspense fallback={<PageSkeleton variant="table" />}>
              <VendorRequestsPage />
            </Suspense>
          </EventManagementRoute>
        ),
      },
      {
        path: ROUTES.PLATFORM_SETUP,
        element: (
          <EventManagementRoute>
            <Suspense fallback={<PageSkeleton variant="form" />}>
              <PlatformSetupPage />
            </Suspense>
          </EventManagementRoute>
        ),
      },
      {
        path: ROUTES.ALL_APPLICATIONS,
        element: (
          <EventManagementRoute>
            <Suspense fallback={<PageSkeleton variant="table" />}>
              <VendorRequestsPage />
            </Suspense>
          </EventManagementRoute>
        ),
      },

      // Gym & Sports Routes
      {
        path: ROUTES.GYM_SCHEDULE,
        element: withSuspense(GymSchedulePage, "cards"),
      },
      // My Sessions page was removed (Coming Soon placeholder)
      {
        path: ROUTES.COURT_BOOKINGS,
        element: withSuspense(CourtBookingsPage, "cards"),
      },
      {
        path: ROUTES.COURT_MANAGEMENT,
        element: (
          <EventManagementRoute>
            <Suspense fallback={<PageSkeleton variant="table" />}>
              <CourtManagementPage />
            </Suspense>
          </EventManagementRoute>
        ),
      },
      // Manage Sessions page was removed (Coming Soon placeholder)

      // Admin Routes
      {
        path: ROUTES.ADMIN_USERS,
        element: (
          <AdminRoute>
            <Suspense fallback={<PageSkeleton variant="table" />}>
              <AdminUsersPage />
            </Suspense>
          </AdminRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_EVENTS,
        element: (
          <EventManagementRoute>
            <Suspense fallback={<PageSkeleton variant="table" />}>
              <BackOfficeEventsPage />
            </Suspense>
          </EventManagementRoute>
        ),
      },

      {
        path: ROUTES.ADMIN_LOYALTY,
        element: withSuspense(LoyaltyProgramPage, "cards"),
      },

      // Events Office Routes
      {
        path: ROUTES.WORKSHOP_APPROVALS,
        element: <Navigate to={ROUTES.ADMIN_EVENTS} replace />, // Redirects to BackOfficeEventsPage
      },
      {
        path: ROUTES.VENDOR_POLLS,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageSkeleton variant="cards" />}>
              <VendorPollsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.BAZAAR_MANAGEMENT,
        element: (
          <EventOfficeRoute>
            <Suspense fallback={<PageSkeleton variant="table" />}>
              <BazaarManagementPage />
            </Suspense>
          </EventOfficeRoute>
        ),
      },

      {
        path: ROUTES.EVENTS_REPORTS,
        element: (
          <EventOfficeRoute>
            <Suspense fallback={<PageSkeleton variant="cards" />}>
              <EventsReportPage />
            </Suspense>
          </EventOfficeRoute>
        ),
      },
      {
        path: ROUTES.SALES_REPORTS,
        element: (
          <EventOfficeRoute>
            <Suspense fallback={<PageSkeleton variant="cards" />}>
              <SalesReportPage />
            </Suspense>
          </EventOfficeRoute>
        ),
      },

      // Wallet
      {
        path: ROUTES.WALLET,
        element: withSuspense(WalletPage, "cards"),
      },

      // Profile
      {
        path: ROUTES.PROFILE,
        element: withSuspense(ProfilePage, "form"),
      },
    ],
  },
]);
