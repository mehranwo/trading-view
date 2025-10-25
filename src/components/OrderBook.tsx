'use client';

import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { useBookStore } from '@/state/useBookStore';
import { formatPrice, formatSize } from '@/lib/format';
import { Number } from './Number';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const OrderBook = memo(function OrderBook() {
  const { book, isReady, getSpread, getMidPrice, getVWAP, getTopLevels } = useBookStore();
  const [prevPrices, setPrevPrices] = useState<Map<number, number>>(new Map());
  const updateTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const topLevels = useMemo(() => getTopLevels(20), [getTopLevels]);
  const spread = useMemo(() => getSpread(), [getSpread]);
  const midPrice = useMemo(() => getMidPrice(), [getMidPrice]);
  const vwap = useMemo(() => getVWAP(), [getVWAP]);

  // Track price changes for tick animation
  useEffect(() => {
    if (!book) return;

    const newPrices = new Map<number, number>();
    const timeouts = updateTimeouts.current;
    
    // Track all prices
    [...topLevels.bids, ...topLevels.asks].forEach((level) => {
      newPrices.set(level.price, level.size);
    });

    // Clear old timeouts
    timeouts.forEach((timeout) => clearTimeout(timeout));
    timeouts.clear();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrevPrices(newPrices);

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, [book, topLevels]);

  if (!isReady || !book) {
    return (
      <div className="flex items-center justify-center h-full bg-linear-to-br from-blue-500/10 to-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-3 shadow-lg"></div>
          <div className="text-gray-500 font-semibold">Loading order book...</div>
        </div>
      </div>
    );
  }

  const maxBidCumul = topLevels.bids[0]
    ? book.bids.cumul[book.bids.levels.indexOf(topLevels.bids[topLevels.bids.length - 1])] || 0
    : 0;
  const maxAskCumul = topLevels.asks[0]
    ? book.asks.cumul[book.asks.levels.indexOf(topLevels.asks[topLevels.asks.length - 1])] || 0
    : 0;
  const maxCumul = Math.max(maxBidCumul, maxAskCumul);

  return (
    <Card className="flex flex-col h-full text-sm border-0 rounded-none">
      <CardHeader className="bg-linear-to-r from-transparent via-blue-500/10 to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <div>
            <CardTitle>Order Book</CardTitle>
            <CardDescription>Real-time L2 depth</CardDescription>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <p className="text-muted-foreground">Spread</p>
            <Badge variant="outline" className="font-mono">
              <Number value={formatPrice(spread, 2)} />
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Mid Price</p>
            <Badge variant="outline" className="font-mono">
              <Number value={formatPrice(midPrice, 2)} />
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">VWAP Bid</p>
            <Badge variant="outline" className="font-mono text-green-500">
              <Number value={formatPrice(vwap.bids, 2)} color="green" />
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">VWAP Ask</p>
            <Badge variant="outline" className="font-mono text-red-500">
              <Number value={formatPrice(vwap.asks, 2)} color="red" />
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="grid grid-cols-3 px-6 py-3 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0 z-10">
          <div className="text-left">Price (USDT)</div>
          <div className="text-right">Size (BTC)</div>
          <div className="text-right">Total</div>
        </div>

        <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col-reverse">
          {topLevels.asks.slice(0, 20).reverse().map((level) => {
            const levelIdx = book.asks.levels.indexOf(level);
            const cumul = book.asks.cumul[levelIdx] || 0;
            const depth = maxCumul > 0 ? (cumul / maxCumul) * 100 : 0;
            const prevSize = prevPrices.get(level.price);
            const hasChanged = prevSize !== undefined && prevSize !== level.size;

            return (
              <div
                key={`ask-${level.price}`}
                className="relative grid grid-cols-3 px-6 py-2 hover:bg-card-hover transition-smooth cursor-pointer group"
              >
                <div
                  className="absolute inset-0 bg-linear-to-l from-red-500/10 via-red-500/5 to-transparent transition-smooth group-hover:from-red-500/20"
                  style={{ width: `${depth}%`, right: 0, left: 'auto' }}
                />
                
                <div className="relative z-10 font-semibold">
                  <Number value={formatPrice(level.price, 2)} color="red" animate={hasChanged} />
                </div>
                <div className="relative z-10 text-right font-mono">
                  <Number value={formatSize(level.size)} />
                </div>
                <div className="relative z-10 text-right text-gray-500 font-mono text-xs">
                  <Number value={formatSize(cumul)} />
                </div>
              </div>
            );
          })}
        </div>

          <div className="px-6 py-3 bg-linear-to-r from-blue-500/10 via-transparent to-blue-500/10 text-center">
            <Separator className="mb-3" />
            <Badge variant="secondary" className="text-sm font-mono">
              Spread: <Number value={formatPrice(spread, 2)} /> ({((spread / midPrice) * 100).toFixed(3)}%)
            </Badge>
            <Separator className="mt-3" />
          </div>

        <div>
          {topLevels.bids.slice(0, 20).map((level) => {
            const levelIdx = book.bids.levels.indexOf(level);
            const cumul = book.bids.cumul[levelIdx] || 0;
            const depth = maxCumul > 0 ? (cumul / maxCumul) * 100 : 0;
            const prevSize = prevPrices.get(level.price);
            const hasChanged = prevSize !== undefined && prevSize !== level.size;

            return (
              <div
                key={`bid-${level.price}`}
                className="relative grid grid-cols-3 px-6 py-2 hover:bg-card-hover transition-smooth cursor-pointer group"
              >
                <div
                  className="absolute inset-0 bg-linear-to-l from-green-500/10 via-green-500/5 to-transparent transition-smooth group-hover:from-green-500/20"
                  style={{ width: `${depth}%`, right: 0, left: 'auto' }}
                />
                
                <div className="relative z-10 font-semibold">
                  <Number value={formatPrice(level.price, 2)} color="green" animate={hasChanged} />
                </div>
                <div className="relative z-10 text-right font-mono">
                  <Number value={formatSize(level.size)} />
                </div>
                <div className="relative z-10 text-right text-gray-500 font-mono text-xs">
                  <Number value={formatSize(cumul)} />
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

