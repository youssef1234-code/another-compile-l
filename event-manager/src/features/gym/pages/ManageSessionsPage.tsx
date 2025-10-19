import { usePageMeta } from '@/components/layout/page-meta-context';
import { useEffect } from 'react';

export function ManageSessionsPage() {
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title: 'Manage Gym Sessions',
      description: 'Create and manage gym sessions',
    });
  }, [setPageMeta]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center py-12">
        <p className="text-muted-foreground">No sessions created yet</p>
      </div>
    </div>
  );
}
