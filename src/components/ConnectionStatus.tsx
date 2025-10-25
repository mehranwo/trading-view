'use client';

import { memo } from 'react';
import { useConnStore } from '@/state/useConnStore';
import { Badge } from '@/components/ui/badge';

export const ConnectionStatus = memo(function ConnectionStatus() {
  const { tradeStatus, depthStatus, isFullyConnected, isReconnecting } = useConnStore();

  const status = isFullyConnected()
    ? 'connected'
    : isReconnecting()
    ? 'reconnecting'
    : 'disconnected';

  const statusConfig = {
    connected: {
      label: 'Connected',
      color: 'bg-green-500',
      textColor: 'text-green-500',
    },
    reconnecting: {
      label: 'Reconnecting...',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
    },
    disconnected: {
      label: 'Disconnected',
      color: 'bg-red-500',
      textColor: 'text-red-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={status === 'connected' ? 'default' : status === 'reconnecting' ? 'secondary' : 'destructive'}
        className="font-medium"
      >
        <div className="relative mr-2">
          <div className={`w-2 h-2 rounded-full ${config.color} ${status === 'reconnecting' ? 'animate-pulse' : ''}`} />
          {status === 'connected' && (
            <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.color} animate-ping opacity-75`} />
          )}
        </div>
        {config.label}
      </Badge>
    </div>
  );
});

