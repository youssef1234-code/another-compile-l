/**
 * Main Dashboard Page
 * 
 * Role-based dashboard that displays relevant content based on user role
 */

import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@event-manager/shared';
import { LoadingSpinner } from '@/components/generic/LoadingSpinner';
import { usePageMeta } from '@/components/layout/page-meta-context';
import { useEffect } from 'react';
import {
  StudentDashboard,
  ProfessorDashboard,
  EventsOfficeDashboard,
  AdminDashboard,
  VendorDashboard,
} from '../components/RoleDashboards';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title: 'Dashboard',
      description: user ? `Welcome back, ${user.firstName}!` : 'Welcome back!',
    });
  }, [setPageMeta, user]);

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
    <div className="flex flex-col gap-6 p-6">
      {/* Role-Specific Dashboard */}
      {renderDashboard()}
    </div>
  );
}
