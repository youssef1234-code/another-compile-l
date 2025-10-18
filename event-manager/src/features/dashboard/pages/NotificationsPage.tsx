import { ComingSoonPage } from '@/components/ComingSoonPage';

export function NotificationsPage() {
  return (
    <ComingSoonPage
      title="Notifications Center"
      description="Stay informed with real-time notifications about your events, registrations, bookings, and important updates from the GUC Events platform."
      features={[
        'Real-time event notifications',
        'Registration confirmations and updates',
        'Booking reminders and alerts',
        'Vendor application status updates',
        'System announcements and news',
        'Customizable notification preferences',
        'Email and in-app notifications',
        'Mark as read/unread functionality',
      ]}
    />
  );
}
