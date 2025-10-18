import { ComingSoonPage } from '@/components/ComingSoonPage';

export function CommentsPage() {
  return (
    <ComingSoonPage
      title="Comments & Feedback Management"
      description="Monitor and manage user comments, feedback, and reviews across all events. Ensure quality discussions and address concerns promptly."
      features={[
        'View all event comments and feedback',
        'Moderate inappropriate content',
        'Respond to user concerns',
        'Flag and review reported comments',
        'Analyze sentiment and feedback trends',
        'Export feedback reports',
        'User reputation management',
        'Automated spam detection',
      ]}
    />
  );
}
