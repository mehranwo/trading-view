'use client';

import { useEffect, useRef, memo } from 'react';
import { createChart, ColorType, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { useCandleStore } from '@/state/useCandleStore';
import { formatPrice, formatPercent } from '@/lib/format';
import { Number } from './Number';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChartProps {
  isDarkMode: boolean;
}

export const Chart = memo(function Chart({ isDarkMode }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const { candles, lastPrice, percentChange } = useCandleStore();
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDarkMode ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: isDarkMode ? '#262626' : '#e5e5e5' },
        horzLines: { color: isDarkMode ? '#262626' : '#e5e5e5' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: isDarkMode ? '#262626' : '#e5e5e5',
      },
      crosshair: {
        mode: 1,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) {
        return;
      }
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });

    resizeObserver.observe(chartContainerRef.current);
    resizeObserverRef.current = resizeObserver;

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const chartData = candles.map((candle) => ({
      time: Math.floor(candle.t / 1000) as unknown as import('lightweight-charts').Time,
      open: candle.o,
      high: candle.h,
      low: candle.l,
      close: candle.c,
    }));

    seriesRef.current.setData(chartData);
  }, [candles]);

  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDarkMode ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: isDarkMode ? '#262626' : '#e5e5e5' },
        horzLines: { color: isDarkMode ? '#262626' : '#e5e5e5' },
      },
      rightPriceScale: {
        borderColor: 'neutral',
      },
    });
  }, [isDarkMode]);

  const priceColor = isDarkMode ? 'neutral' : 'neutral';

  return (
    <Card className="flex flex-col h-full border-0 rounded-none">
      <CardHeader className="bg-linear-to-r from-transparent via-blue-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold">BTC/USDT</div>
            <div>
              <CardTitle>Price Chart</CardTitle>
              <CardDescription>1-minute candles (60min rolling)</CardDescription>
            </div>
          </div>
          {lastPrice !== null && (
            <div className="text-right">
              <div className="text-3xl font-bold font-mono tracking-tight">
                <Number value={formatPrice(lastPrice, 2)} color={priceColor} />
              </div>
              {percentChange !== null && (
                <Badge 
                  variant={percentChange >= 0 ? 'default' : 'destructive'} 
                  className={`mt-2 ${percentChange >= 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  <Number value={formatPercent(percentChange)} color={priceColor} />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2">
        <div ref={chartContainerRef} className="w-full h-full" />
      </CardContent>
    </Card>
  );
});

