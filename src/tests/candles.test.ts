import { CandleAggregator, type Trade } from '@/lib/candles';

describe('CandleAggregator', () => {
  let aggregator: CandleAggregator;

  beforeEach(() => {
    aggregator = new CandleAggregator();
  });

  describe('addTrade', () => {
    it('should create first candle from first trade', () => {
      const trade: Trade = {
        ts: 1000000,
        price: 100,
        qty: 1.5,
      };

      const completed = aggregator.addTrade(trade);

      expect(completed).toBeNull(); // First trade, no completed candle
      const current = aggregator.getCurrentCandle();
      expect(current).not.toBeNull();
      expect(current!.o).toBe(100);
      expect(current!.h).toBe(100);
      expect(current!.l).toBe(100);
      expect(current!.c).toBe(100);
      expect(current!.v).toBe(1.5);
    });

    it('should update current candle with trades in same minute', () => {
      const baseTime = 60000; // 1 minute mark

      aggregator.addTrade({ ts: baseTime, price: 100, qty: 1 });
      aggregator.addTrade({ ts: baseTime + 1000, price: 102, qty: 2 });
      aggregator.addTrade({ ts: baseTime + 2000, price: 98, qty: 1.5 });
      aggregator.addTrade({ ts: baseTime + 3000, price: 101, qty: 1 });

      const current = aggregator.getCurrentCandle();
      expect(current!.o).toBe(100);
      expect(current!.h).toBe(102);
      expect(current!.l).toBe(98);
      expect(current!.c).toBe(101);
      expect(current!.v).toBe(5.5);
    });

    it('should complete candle and start new one on minute boundary', () => {
      const minute1 = 60000;
      const minute2 = 120000;

      aggregator.addTrade({ ts: minute1, price: 100, qty: 1 });
      aggregator.addTrade({ ts: minute1 + 1000, price: 102, qty: 1 });

      const completed = aggregator.addTrade({ ts: minute2, price: 105, qty: 2 });

      expect(completed).not.toBeNull();
      expect(completed!.o).toBe(100);
      expect(completed!.h).toBe(102);
      expect(completed!.c).toBe(102);
      expect(completed!.v).toBe(2);

      const current = aggregator.getCurrentCandle();
      expect(current!.t).toBe(minute2);
      expect(current!.o).toBe(105);
      expect(current!.c).toBe(105);
      expect(current!.v).toBe(2);
    });

    it('should maintain rolling 60-minute window', () => {
      const baseTime = 60000;

      // Add 65 candles
      for (let i = 0; i < 65; i++) {
        aggregator.addTrade({
          ts: baseTime + i * 60000,
          price: 100 + i,
          qty: 1,
        });
      }

      const candles = aggregator.getCandles();
      // Should have 60 completed candles (65 total - 1 current - 4 dropped)
      expect(candles.length).toBe(60);
      
      // First candle should be the 5th one (indices 0-3 were dropped)
      expect(candles[0].o).toBe(104); // 100 + 4
    });
  });

  describe('getAllCandles', () => {
    it('should return all candles including current', () => {
      const baseTime = 60000;

      aggregator.addTrade({ ts: baseTime, price: 100, qty: 1 });
      aggregator.addTrade({ ts: baseTime + 60000, price: 101, qty: 1 });
      aggregator.addTrade({ ts: baseTime + 120000, price: 102, qty: 1 });

      const all = aggregator.getAllCandles();
      expect(all.length).toBe(3); // 2 completed + 1 current
    });
  });

  describe('getSessionOpen', () => {
    it('should return first candle open', () => {
      aggregator.addTrade({ ts: 60000, price: 100, qty: 1 });
      aggregator.addTrade({ ts: 120000, price: 105, qty: 1 });

      expect(aggregator.getSessionOpen()).toBe(100);
    });

    it('should return null when no candles', () => {
      expect(aggregator.getSessionOpen()).toBeNull();
    });

    it('should return current candle open if no completed candles', () => {
      aggregator.addTrade({ ts: 60000, price: 100, qty: 1 });
      expect(aggregator.getSessionOpen()).toBe(100);
    });
  });

  describe('getLastPrice', () => {
    it('should return current candle close', () => {
      aggregator.addTrade({ ts: 60000, price: 100, qty: 1 });
      aggregator.addTrade({ ts: 61000, price: 105, qty: 1 });

      expect(aggregator.getLastPrice()).toBe(105);
    });

    it('should return last completed candle close if no current', () => {
      aggregator.addTrade({ ts: 60000, price: 100, qty: 1 });
      aggregator.addTrade({ ts: 120000, price: 105, qty: 1 });
      
      // Current candle exists, so it returns that
      expect(aggregator.getLastPrice()).toBe(105);
    });

    it('should return null when no candles', () => {
      expect(aggregator.getLastPrice()).toBeNull();
    });
  });

  describe('getPercentChange', () => {
    it('should calculate percent change correctly', () => {
      aggregator.addTrade({ ts: 60000, price: 100, qty: 1 });
      aggregator.addTrade({ ts: 120000, price: 110, qty: 1 });

      const change = aggregator.getPercentChange();
      expect(change).toBe(10);
    });

    it('should handle negative change', () => {
      aggregator.addTrade({ ts: 60000, price: 100, qty: 1 });
      aggregator.addTrade({ ts: 120000, price: 95, qty: 1 });

      const change = aggregator.getPercentChange();
      expect(change).toBe(-5);
    });

    it('should return null when no candles', () => {
      expect(aggregator.getPercentChange()).toBeNull();
    });
  });

  describe('reset', () => {
    it('should clear all candles', () => {
      aggregator.addTrade({ ts: 60000, price: 100, qty: 1 });
      aggregator.addTrade({ ts: 120000, price: 105, qty: 1 });

      aggregator.reset();

      expect(aggregator.getCandles()).toHaveLength(0);
      expect(aggregator.getCurrentCandle()).toBeNull();
      expect(aggregator.getSessionOpen()).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle trades at exact minute boundaries', () => {
      aggregator.addTrade({ ts: 60000, price: 100, qty: 1 });
      aggregator.addTrade({ ts: 120000, price: 101, qty: 1 });
      aggregator.addTrade({ ts: 180000, price: 102, qty: 1 });

      const candles = aggregator.getAllCandles();
      expect(candles).toHaveLength(3);
      expect(candles[0].t).toBe(60000);
      expect(candles[1].t).toBe(120000);
      expect(candles[2].t).toBe(180000);
    });

    it('should handle out-of-order timestamps within same minute', () => {
      const baseTime = 60000;
      
      aggregator.addTrade({ ts: baseTime + 5000, price: 100, qty: 1 });
      aggregator.addTrade({ ts: baseTime + 1000, price: 98, qty: 1 });
      aggregator.addTrade({ ts: baseTime + 10000, price: 102, qty: 1 });

      const current = aggregator.getCurrentCandle();
      expect(current!.o).toBe(100); // First trade processed
      expect(current!.h).toBe(102);
      expect(current!.l).toBe(98);
      expect(current!.c).toBe(102); // Last trade processed
    });
  });
});

