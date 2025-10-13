/**
 * Main Dashboard Page
 * 
 * Role-based dashboard that displays relevant content based on user role
 */

import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@event-manager/shared';
import { LoadingSpinner } from '@/components/generic/LoadingSpinner';
import {
  StudentDashboard,
  ProfessorDashboard,
  EventsOfficeDashboard,
  AdminDashboard,
  VendorDashboard,
} from '../components/RoleDashboards';

export function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (user.role) {
      case UserRole.STUDENT:
      case UserRole.STAFF:
      case UserRole.TA:
        return <StudentDashboard />;
      case UserRole.PROFESSOR:
        return <ProfessorDashboard />;
      case UserRole.EVENT_OFFICE:
        return <EventsOfficeDashboard />;
      case UserRole.ADMIN:
        return <AdminDashboard />;
      case UserRole.VENDOR:
        return <VendorDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Role-Specific Dashboard */}
      {renderDashboard()}
    </div>
  );
}
