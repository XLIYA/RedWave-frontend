'use client';

import React from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EmptyState: React.FC<{ onReload: () => void; message?: string }> = ({
  onReload,
  message = 'No tracks found',
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
      <Play className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium mb-2">{message}</h3>
    <p className="text-muted-foreground mb-4">Try adjusting your filters or reload the page</p>
    <Button onClick={onReload} variant="outline">
      <RefreshCw className="h-4 w-4 mr-2" />
      Reload
    </Button>
  </div>
);
