import { usePageMeta } from '@/components/layout/AppLayout';
import { useEffect } from 'react';

export function FavoritesPage() {
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title: 'Favorites',
      description: 'Your favorite events',
    });
  }, [setPageMeta]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center py-12">
        <p className="text-muted-foreground">No favorite events yet</p>
      </div>
    </div>
  );
}
