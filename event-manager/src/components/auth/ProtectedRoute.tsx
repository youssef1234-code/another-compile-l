/**
 * Protected Route Component
 * 
 * Protects routes that require authentication and/or specific roles
 * 
 * Features:
 * - Authentication check
 * - Role-based access control
 * - Multiple role support
 * - Automatic redirects
 * 
 * @module components/auth/ProtectedRoute
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../lib/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Single required role */
  requiredRole?: string;
  /** Multiple allowed roles (user needs at least one) */
  allowedRoles?: string[];
  /** Redirect path if not authorized (default: dashboard) */
  redirectTo?: string;
}

/**
 * Protected Route wrapper that checks authentication and authorization
 * 
 * Usage:
 * ```tsx
 * // Require authentication only
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * 
 * // Require specific role
 * <ProtectedRoute requiredRole="ADMIN">
 *   <AdminPage />
 * </ProtectedRoute>
 * 
 * // Allow multiple roles
 * <ProtectedRoute allowedRoles={['ADMIN', 'EVENT_OFFICE']}>
 *   <ManageEventsPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles,
  redirectTo = ROUTES.DASHBOARD 
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Check role requirements
  if (requiredRole && user.role !== requiredRole) {
    // User doesn't have the required role
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Check if user has at least one of the allowed roles
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // All checks passed - render children
  return <>{children}</>;
}

/**
 * Higher-order component for creating role-specific protected routes
 * 
 * Usage:
 * ```tsx
 * const AdminRoute = createRoleRoute('ADMIN');
 * const EventOfficeRoute = createRoleRoute(['ADMIN', 'EVENT_OFFICE']);
 * 
 * <AdminRoute>
 *   <AdminPage />
 * </AdminRoute>
 * ```
 */
function createRoleRoute(role: string | string[]) {
  return function RoleRoute({ children }: { children: React.ReactNode }) {
    if (typeof role === 'string') {
      return <ProtectedRoute requiredRole={role}>{children}</ProtectedRoute>;
    }
    return <ProtectedRoute allowedRoles={role}>{children}</ProtectedRoute>;
  };
}

// Pre-configured role routes for common use cases
export const AdminRoute = createRoleRoute('ADMIN');
export const EventOfficeRoute = createRoleRoute(['ADMIN', 'EVENT_OFFICE']);
export const ProfessorRoute = createRoleRoute('PROFESSOR');
export const VendorRoute = createRoleRoute('VENDOR');
export const EventManagementRoute = createRoleRoute(['ADMIN', 'EVENT_OFFICE', 'PROFESSOR']);
