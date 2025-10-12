/**
 * React Router Configuration
 * 
 * @module app/router
 */

import { ROUTES } from '@/lib/constants';
import { createBrowserRouter, Navigate } from 'react-router-dom';


// Pages
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RequestVerificationPage } from '@/features/auth/pages/RequestVerificationPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { SignupPage } from '@/features/auth/pages/SignupPage';
import { SignupVendorPage } from '@/features/auth/pages/SignupVendorPage';
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage';

// Protected Route Component

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
  }
]);
