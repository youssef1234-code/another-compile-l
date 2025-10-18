/**
 * Platform Applications Page (Placeholder)
 * 
 * This page is a placeholder for future functionality.
 * Currently redirects to Platform Booth Application page.
 */

import { usePageMeta } from '@/components/layout/AppLayout';
import { useEffect } from 'react';

export function PlatformApplicationsPage() {
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title: 'Platform Applications',
      description: 'View your platform booth applications',
    });
  }, [setPageMeta]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center py-12">
        <p className="text-muted-foreground">No platform applications yet</p>
      </div>
    </div>
  );
}
