'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TabKey = 'trending' | 'top';

export const FilterBar: React.FC<{
  activeTab: TabKey;
  trendingParams: { windowDays: number; minPlays: number; genre?: string };
  topParams: { timeRange: 'all' | 'week' | 'month' | 'year'; genre?: string };
  tags: string[];
  onTrendingChange: (params: { windowDays: number; minPlays: number; genre?: string }) => void;
  onTopChange: (params: { timeRange: 'all' | 'week' | 'month' | 'year'; genre?: string }) => void;
}> = ({ activeTab, trendingParams, topParams, tags, onTrendingChange, onTopChange }) => {
  if (activeTab === 'trending') {
    return (
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {[7, 14, 30].map((days) => (
            <Button
              key={days}
              variant={trendingParams.windowDays === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTrendingChange({ ...trendingParams, windowDays: days })}
              className="rounded-full text-xs"
            >
              {days}d
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 min-w-[220px]">
          <span className="text-sm text-muted-foreground">Min Plays:</span>
          <Slider
            value={[trendingParams.minPlays]}
            onValueChange={([value]) => onTrendingChange({ ...trendingParams, minPlays: value })}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-mono w-10 text-right">{trendingParams.minPlays}</span>
        </div>

        <Select
          value={trendingParams.genre || 'all'}
          onValueChange={(value) =>
            onTrendingChange({ ...trendingParams, genre: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex gap-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'week', label: 'Week' },
          { key: 'month', label: 'Month' },
          { key: 'year', label: 'Year' },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={topParams.timeRange === (key as any) ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTopChange({ ...topParams, timeRange: key as any })}
            className="rounded-full text-xs"
          >
            {label}
          </Button>
        ))}
      </div>

      <Select
        value={topParams.genre || 'all'}
        onValueChange={(value) =>
          onTopChange({ ...topParams, genre: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Genre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Genres</SelectItem>
          {tags.map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
