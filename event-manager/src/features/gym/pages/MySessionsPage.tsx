import { usePageMeta } from '@/components/layout/AppLayout';
import { useEffect } from 'react';

export function MySessionsPage() {
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title: 'My Sessions',
      description: 'View your registered gym sessions',
    });
  }, [setPageMeta]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center py-12">
        <p className="text-muted-foreground">No sessions registered yet</p>
      </div>
    </div>
  );
}
