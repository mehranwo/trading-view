'use client';

import { memo, useEffect, useState } from 'react';
import { useConnStore } from '@/state/useConnStore';
import { Badge } from '@/components/ui/badge';

export const LatencyBadge = memo(function LatencyBadge() {
  const { latency, lastUpdateTime } = useConnStore();
  const [paintLatency, setPaintLatency] = useState<number | null>(null);

  useEffect(() => {
    if (lastUpdateTime) {
      // Measure time from last WS update to paint
      requestAnimationFrame(() => {
        const now = performance.now();
        const updatePerf = lastUpdateTime;
        const diff = now - updatePerf;
        setPaintLatency(diff);
      });
    }
  }, [lastUpdateTime]);

  const displayLatency = paintLatency ?? latency;

  if (displayLatency === null) {
    return (
      <Badge variant="outline" className="font-mono text-white">
        -- ms
      </Badge>
    );
  }

  const variant =
    displayLatency < 50
      ? 'default'
      : displayLatency < 100
      ? 'secondary'
      : 'destructive';

  return (
    <Badge variant={variant} className="font-mono font-bold">
      {displayLatency.toFixed(0)}ms
    </Badge>
  );
});

