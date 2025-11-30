/**
 * Page Skeleton Component
 * 
 * Provides consistent loading skeletons for page transitions
 * Uses shadcn skeleton primitives for smooth loading states
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  variant?: "default" | "table" | "cards" | "form" | "dashboard";
  className?: string;
}

export function PageSkeleton({ variant = "default", className }: PageSkeletonProps) {
  return (
    <div className={cn("p-6 space-y-6 animate-in fade-in-50 duration-300", className)}>
      {variant === "default" && <DefaultSkeleton />}
      {variant === "table" && <TableSkeleton />}
      {variant === "cards" && <CardsSkeleton />}
      {variant === "form" && <FormSkeleton />}
      {variant === "dashboard" && <DashboardSkeleton />}
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <>
      {/* Header area */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>
      
      {/* Content area */}
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[150px] rounded-lg" />
          ))}
        </div>
      </div>
    </>
  );
}

function TableSkeleton() {
  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-[300px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
      
      {/* Table header */}
      <div className="border rounded-lg">
        <div className="flex items-center gap-4 p-4 border-b bg-muted/50">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        
        {/* Table rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[200px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </>
  );
}

function CardsSkeleton() {
  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      
      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <Skeleton className="h-[180px] w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Form header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      
      {/* Form fields */}
      <div className="space-y-6 border rounded-lg p-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        
        {/* Form actions */}
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-8 w-[80px]" />
            <Skeleton className="h-3 w-[120px]" />
          </div>
        ))}
      </div>
      
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 space-y-4">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-[250px] w-full" />
        </div>
        <div className="border rounded-lg p-4 space-y-4">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
      
      {/* Recent activity */}
      <div className="border rounded-lg p-4 space-y-4">
        <Skeleton className="h-5 w-[180px]" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Export individual skeletons for custom use
export { DefaultSkeleton, TableSkeleton, CardsSkeleton, FormSkeleton, DashboardSkeleton };
