import { ComingSoonPage } from '@/components/ComingSoonPage';

export function ReportsPage() {
  return (
    <ComingSoonPage
      title="Admin Reports & Analytics"
      description="Comprehensive reporting and analytics dashboard for monitoring platform performance, user activities, and event statistics across the entire Another Compile L system."
      features={[
        'Platform-wide usage statistics',
        'User registration and activity trends',
        'Event performance analytics',
        'Revenue and transaction reports',
        'Vendor performance metrics',
        'Custom report generation',
        'Data export in multiple formats',
        'Scheduled automated reports',
      ]}
    />
  );
}
