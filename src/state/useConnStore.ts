import { create } from 'zustand';
import type { ConnectionStatus } from '@/lib/binance';

interface ConnStore {
  tradeStatus: ConnectionStatus;
  depthStatus: ConnectionStatus;
  latency: number | null;
  lastUpdateTime: number | null;
  setTradeStatus: (status: ConnectionStatus) => void;
  setDepthStatus: (status: ConnectionStatus) => void;
  setLatency: (latency: number) => void;
  updateLastUpdateTime: () => void;
  reset: () => void;
  isFullyConnected: () => boolean;
  isReconnecting: () => boolean;
}

export const useConnStore = create<ConnStore>((set, get) => ({
  tradeStatus: 'disconnected',
  depthStatus: 'disconnected',
  latency: null,
  lastUpdateTime: null,

  setTradeStatus: (status) => {
    set({ tradeStatus: status });
    console.log('[ConnStore] Trade status:', status);
  },

  setDepthStatus: (status) => {
    set({ depthStatus: status });
    console.log('[ConnStore] Depth status:', status);
  },

  setLatency: (latency) => {
    set({ latency });
  },

  updateLastUpdateTime: () => {
    set({ lastUpdateTime: Date.now() });
  },

  reset: () => {
    set({
      tradeStatus: 'disconnected',
      depthStatus: 'disconnected',
      latency: null,
      lastUpdateTime: null,
    });
  },

  isFullyConnected: () => {
    const { tradeStatus, depthStatus } = get();
    return tradeStatus === 'connected' && depthStatus === 'connected';
  },

  isReconnecting: () => {
    const { tradeStatus, depthStatus } = get();
    return tradeStatus === 'reconnecting' || depthStatus === 'reconnecting';
  },
}));

