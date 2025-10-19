/**
 * App Layout Component
 * 
 * Uses shadcn dashboard-01 block sidebar
 * Provides consistent layout for all authenticated pages
 */

import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import type { PageMeta, PageMetaContext } from './page-meta-context';

export function AppLayout() {
  const [pageMeta, setPageMeta] = useState<PageMeta>({ title: 'Event Manager' });

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col w-full">
        {/* Header with dynamic title and description */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">{pageMeta.title}</h1>
            {pageMeta.description && (
              <p className="text-xs text-muted-foreground truncate">{pageMeta.description}</p>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Outlet context={{ setPageMeta } satisfies PageMetaContext} />
        </div>
      </main>
    </SidebarProvider>
  );
}
