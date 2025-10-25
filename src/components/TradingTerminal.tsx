'use client';

import { useEffect, useState, useRef } from 'react';
import { Chart } from './Chart';
import { OrderBook } from './OrderBook';
import { OrderTicket } from './OrderTicket';
import { useBookStore } from '@/state/useBookStore';
import { useCandleStore } from '@/state/useCandleStore';
import { useConnStore } from '@/state/useConnStore';
import { createTradeStream, createDepthStream, fetchDepthSnapshot } from '@/lib/binance';

interface TradingTerminalProps {
  isDarkMode: boolean;
}

export function TradingTerminal({ isDarkMode }: TradingTerminalProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializingRef = useRef(false);
  const streamsRef = useRef<{
    trade: ReturnType<typeof createTradeStream> | null;
    depth: ReturnType<typeof createDepthStream> | null;
  }>({ trade: null, depth: null });

  const { initFromSnapshot, applyUpdate: applyBookUpdate } = useBookStore();
  const { addTrade } = useCandleStore();
  const { setTradeStatus, setDepthStatus, setLatency, updateLastUpdateTime } = useConnStore();

  useEffect(() => {
    if (isInitialized || initializingRef.current) {
      console.log('[TradingTerminal] Already initialized or initializing, skipping...');
      return;
    }

    initializingRef.current = true;
    let isActive = true;

    console.log('[TradingTerminal] Starting initialization...');

    const initTimer = setTimeout(() => {
      async function initialize() {
        try {
          console.log('[TradingTerminal] Fetching order book snapshot...');
          const snapshot = await fetchDepthSnapshot();

          if (!isActive) return;

          initFromSnapshot(snapshot);
          console.log('[TradingTerminal] Order book initialized');

          streamsRef.current.trade = createTradeStream(
            (trade) => {
              if (!isActive) return;

              addTrade(trade);

              const latency = Date.now() - trade.ts;
              setLatency(latency);
              updateLastUpdateTime();
            },
            (status) => {
              if (!isActive) return;
              setTradeStatus(status);
            }
          );

          streamsRef.current.depth = createDepthStream(
            (update) => {
              if (!isActive) return;

              const success = applyBookUpdate(update);
              if (!success) {
                console.warn('[TradingTerminal] Failed to apply book update');
              }
              updateLastUpdateTime();
            },
            (status) => {
              if (!isActive) return;
              setDepthStatus(status);
            }
          );

          setIsInitialized(true);
          console.log('[TradingTerminal] ✓ Initialization complete');
        } catch (error) {
          console.error('[TradingTerminal] Initialization error:', error);
          initializingRef.current = false;
          // Retry after 5 seconds
          setTimeout(() => {
            if (isActive) {
              initializingRef.current = false;
              initialize();
            }
          }, 5000);
        }
      }

      initialize();
    }, 500);

    return () => {
      console.log('[TradingTerminal] Cleanup starting...');
      isActive = false;
      initializingRef.current = false;
      clearTimeout(initTimer);
      
      const streams = streamsRef.current;
      if (streams.trade) {
        console.log('[TradingTerminal] Closing trade stream...');
        streams.trade.close();
        streams.trade = null;
      }
      if (streams.depth) {
        console.log('[TradingTerminal] Closing depth stream...');
        streams.depth.close();
        streams.depth = null;
      }
      
      console.log('[TradingTerminal] Cleanup completed');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full bg-linear-to-br from-blue-500/10 to-transparent">
        <div className="text-center glass rounded-2xl p-8 shadow-2xl">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto shadow-lg"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500 mx-auto animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="text-foreground font-bold text-xl mb-2">Connecting to Binance</p>
          <p className="text-gray-500 text-sm">Establishing WebSocket connections...</p>
          <div className="flex gap-1 justify-center mt-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 h-full gap-4 bg-border w-full">
      <div className="lg:col-span-2 flex flex-col gap-0.5 bg-border">
        <div className="h-[500px] bg-background">
          <Chart isDarkMode={isDarkMode} />
        </div>

        <div className="flex-1 min-h-0 bg-background">
          <OrderTicket />
        </div>
      </div>

      <div className="lg:col-span-1 h-full bg-background">
        <OrderBook />
      </div>
    </div>
  );
}