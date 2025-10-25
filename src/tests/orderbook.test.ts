import {
  parseSnapshot,
  applyDepthUpdate,
  calculateCumulatives,
  calculateSpread,
  calculateMidPrice,
  calculateVWAP,
  getTopLevels,
  type DepthSnapshot,
  type DepthUpdate,
  type OrderBook,
} from '@/lib/orderbook';

describe('orderbook', () => {
  describe('parseSnapshot', () => {
    it('should parse snapshot and sort levels correctly', () => {
      const snapshot: DepthSnapshot = {
        lastUpdateId: 1000,
        bids: [
          ['100.00', '1.5'],
          ['99.50', '2.0'],
          ['101.00', '1.0'],
        ],
        asks: [
          ['102.00', '1.0'],
          ['103.00', '1.5'],
          ['101.50', '2.0'],
        ],
      };

      const book = parseSnapshot(snapshot);

      expect(book.lastUpdateId).toBe(1000);
      expect(book.bids.levels).toHaveLength(3);
      expect(book.asks.levels).toHaveLength(3);

      // Bids should be sorted descending
      expect(book.bids.levels[0].price).toBe(101.0);
      expect(book.bids.levels[1].price).toBe(100.0);
      expect(book.bids.levels[2].price).toBe(99.5);

      // Asks should be sorted ascending
      expect(book.asks.levels[0].price).toBe(101.5);
      expect(book.asks.levels[1].price).toBe(102.0);
      expect(book.asks.levels[2].price).toBe(103.0);
    });

    it('should filter out zero-size levels', () => {
      const snapshot: DepthSnapshot = {
        lastUpdateId: 1000,
        bids: [
          ['100.00', '1.5'],
          ['99.50', '0.0'],
        ],
        asks: [
          ['102.00', '0.0'],
          ['103.00', '1.5'],
        ],
      };

      const book = parseSnapshot(snapshot);

      expect(book.bids.levels).toHaveLength(1);
      expect(book.asks.levels).toHaveLength(1);
    });
  });

  describe('applyDepthUpdate', () => {
    let book: OrderBook;

    beforeEach(() => {
      book = parseSnapshot({
        lastUpdateId: 1000,
        bids: [
          ['100.00', '1.0'],
          ['99.00', '2.0'],
        ],
        asks: [
          ['101.00', '1.0'],
          ['102.00', '2.0'],
        ],
      });
    });

    it('should apply valid update', () => {
      const update: DepthUpdate = {
        U: 1001,
        u: 1002,
        b: [['100.00', '1.5']], // update existing bid
        a: [['101.00', '0.5']], // update existing ask
      };

      const newBook = applyDepthUpdate(book, update);

      expect(newBook).not.toBeNull();
      expect(newBook!.lastUpdateId).toBe(1002);
      expect(newBook!.bids.levels[0].size).toBe(1.5);
      expect(newBook!.asks.levels[0].size).toBe(0.5);
    });

    it('should add new levels', () => {
      const update: DepthUpdate = {
        U: 1001,
        u: 1002,
        b: [['98.00', '3.0']], // new bid
        a: [['103.00', '3.0']], // new ask
      };

      const newBook = applyDepthUpdate(book, update);

      expect(newBook).not.toBeNull();
      expect(newBook!.bids.levels).toHaveLength(3);
      expect(newBook!.asks.levels).toHaveLength(3);
      expect(newBook!.bids.levels[2].price).toBe(98.0);
      expect(newBook!.asks.levels[2].price).toBe(103.0);
    });

    it('should remove levels with zero size', () => {
      const update: DepthUpdate = {
        U: 1001,
        u: 1002,
        b: [['100.00', '0.0']], // remove bid
        a: [['101.00', '0.0']], // remove ask
      };

      const newBook = applyDepthUpdate(book, update);

      expect(newBook).not.toBeNull();
      expect(newBook!.bids.levels).toHaveLength(1);
      expect(newBook!.asks.levels).toHaveLength(1);
    });

    it('should reject updates with old sequence number', () => {
      const update: DepthUpdate = {
        U: 999,
        u: 999,
        b: [],
        a: [],
      };

      const newBook = applyDepthUpdate(book, update);

      expect(newBook).toBeNull();
    });

    it('should reject updates with sequence gap', () => {
      const update: DepthUpdate = {
        U: 1010,
        u: 1011,
        b: [],
        a: [],
      };

      const newBook = applyDepthUpdate(book, update);

      expect(newBook).toBeNull();
    });

    it('should maintain sort order after updates', () => {
      const update: DepthUpdate = {
        U: 1001,
        u: 1002,
        b: [
          ['101.00', '1.0'], // new best bid
          ['97.00', '1.0'], // new lowest bid
        ],
        a: [
          ['100.50', '1.0'], // new best ask
          ['104.00', '1.0'], // new highest ask
        ],
      };

      const newBook = applyDepthUpdate(book, update);

      expect(newBook).not.toBeNull();

      // Check bids are still sorted descending
      for (let i = 0; i < newBook!.bids.levels.length - 1; i++) {
        expect(newBook!.bids.levels[i].price).toBeGreaterThan(
          newBook!.bids.levels[i + 1].price
        );
      }

      // Check asks are still sorted ascending
      for (let i = 0; i < newBook!.asks.levels.length - 1; i++) {
        expect(newBook!.asks.levels[i].price).toBeLessThan(
          newBook!.asks.levels[i + 1].price
        );
      }
    });
  });

  describe('calculateCumulatives', () => {
    it('should calculate cumulative sizes', () => {
      const levels = [
        { price: 100, size: 1.0 },
        { price: 99, size: 2.0 },
        { price: 98, size: 1.5 },
      ];

      const cumul = calculateCumulatives(levels);

      expect(cumul).toEqual([1.0, 3.0, 4.5]);
    });

    it('should handle empty levels', () => {
      const cumul = calculateCumulatives([]);
      expect(cumul).toEqual([]);
    });
  });

  describe('calculateSpread', () => {
    it('should calculate spread correctly', () => {
      const book = parseSnapshot({
        lastUpdateId: 1000,
        bids: [['100.00', '1.0']],
        asks: [['102.00', '1.0']],
      });

      const spread = calculateSpread(book);
      expect(spread).toBe(2.0);
    });

    it('should handle empty book', () => {
      const book: OrderBook = {
        bids: { levels: [], cumul: [] },
        asks: { levels: [], cumul: [] },
        lastUpdateId: 0,
      };

      const spread = calculateSpread(book);
      expect(spread).toBe(0);
    });
  });

  describe('calculateMidPrice', () => {
    it('should calculate mid price correctly', () => {
      const book = parseSnapshot({
        lastUpdateId: 1000,
        bids: [['100.00', '1.0']],
        asks: [['102.00', '1.0']],
      });

      const mid = calculateMidPrice(book);
      expect(mid).toBe(101.0);
    });
  });

  describe('calculateVWAP', () => {
    it('should calculate VWAP correctly', () => {
      const levels = [
        { price: 100, size: 1.0 },
        { price: 99, size: 2.0 },
        { price: 98, size: 1.0 },
      ];

      const vwap = calculateVWAP(levels, 3);
      // (100*1 + 99*2 + 98*1) / (1+2+1) = 396 / 4 = 99
      expect(vwap).toBe(99);
    });

    it('should handle empty levels', () => {
      const vwap = calculateVWAP([], 20);
      expect(vwap).toBe(0);
    });

    it('should limit to specified depth', () => {
      const levels = [
        { price: 100, size: 1.0 },
        { price: 99, size: 1.0 },
        { price: 98, size: 1.0 },
      ];

      const vwap = calculateVWAP(levels, 2);
      // (100*1 + 99*1) / (1+1) = 199 / 2 = 99.5
      expect(vwap).toBe(99.5);
    });
  });

  describe('getTopLevels', () => {
    it('should return top N levels', () => {
      const book = parseSnapshot({
        lastUpdateId: 1000,
        bids: [
          ['100', '1'],
          ['99', '1'],
          ['98', '1'],
        ],
        asks: [
          ['101', '1'],
          ['102', '1'],
          ['103', '1'],
        ],
      });

      const top = getTopLevels(book, 2);

      expect(top.bids).toHaveLength(2);
      expect(top.asks).toHaveLength(2);
      expect(top.bids[0].price).toBe(100);
      expect(top.asks[0].price).toBe(101);
    });
  });
});

