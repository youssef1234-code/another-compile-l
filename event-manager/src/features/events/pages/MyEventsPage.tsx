import { usePageMeta } from '@/components/layout/page-meta-context';
import { useEffect } from 'react';

export function MyEventsPage() {
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title: 'My Events',
      description: 'Events you have created',
    });
  }, [setPageMeta]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center py-12">
        <p className="text-muted-foreground">You haven't created any events yet</p>
      </div>
    </div>
  );
}
