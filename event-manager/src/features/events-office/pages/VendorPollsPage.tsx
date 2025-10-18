import { ComingSoonPage } from '@/components/ComingSoonPage';

export function VendorPollsPage() {
  return (
    <ComingSoonPage
      title="Vendor Selection Polls"
      description="Create and manage polls to gather community input on vendor selection for bazaars and events. Enable democratic decision-making for vendor participation."
      features={[
        'Create vendor selection polls',
        'Multiple choice and ranked voting',
        'Set poll duration and deadlines',
        'Real-time voting results',
        'Voter authentication and validation',
        'Anonymous voting options',
        'Automated winner selection',
        'Poll results analytics and exports',
      ]}
    />
  );
}
