import { ComingSoonPage } from '@/components/ComingSoonPage';

export function MySessionsPage() {
  return (
    <ComingSoonPage
      title="My Sessions"
      description="View and manage your gym session registrations. This page is under construction."
      features={[
        'See upcoming and past sessions',
        'Cancel or reschedule a session',
        'Add sessions to calendar',
        'Get reminders and notifications',
      ]}
    />
  );
}
