import { create } from 'zustand';
import { CandleAggregator, type Trade, type Candle } from '@/lib/candles';

interface CandleStore {
  aggregator: CandleAggregator;
  candles: Candle[];
  lastPrice: number | null;
  sessionOpen: number | null;
  percentChange: number | null;
  addTrade: (trade: Trade) => void;
  reset: () => void;
  getAllCandles: () => Candle[];
}

export const useCandleStore = create<CandleStore>((set, get) => ({
  aggregator: new CandleAggregator(),
  candles: [],
  lastPrice: null,
  sessionOpen: null,
  percentChange: null,

  addTrade: (trade) => {
    const { aggregator } = get();
    
    const completedCandle = aggregator.addTrade(trade);
    
    const candles = aggregator.getAllCandles();
    const lastPrice = aggregator.getLastPrice();
    const sessionOpen = aggregator.getSessionOpen();
    const percentChange = aggregator.getPercentChange();
    
    set({
      candles,
      lastPrice,
      sessionOpen,
      percentChange,
    });
    
    if (completedCandle) {
      console.log('[CandleStore] Completed candle', {
        time: new Date(completedCandle.t).toISOString(),
        o: completedCandle.o,
        h: completedCandle.h,
        l: completedCandle.l,
        c: completedCandle.c,
        v: completedCandle.v,
      });
    }
  },

  reset: () => {
    const newAggregator = new CandleAggregator();
    set({
      aggregator: newAggregator,
      candles: [],
      lastPrice: null,
      sessionOpen: null,
      percentChange: null,
    });
  },

  getAllCandles: () => {
    const { aggregator } = get();
    return aggregator.getAllCandles();
  },
}));

