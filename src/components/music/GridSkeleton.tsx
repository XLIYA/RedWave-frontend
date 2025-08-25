'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'grid' | 'list';

export const GridSkeleton: React.FC<{ viewMode: ViewMode }> = ({ viewMode }) => {
  const items = Array.from({ length: 12 }, (_, i) => i);

  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="w-12 h-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {items.map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};
