import {
  validateOrder,
  calculateCost,
  estimatePnL,
} from '@/lib/risk';
import type { Balances } from '@/state/useBalanceStore';

describe('risk', () => {
  const mockBalances: Balances = {
    USD: 10000,
    BTC: 0.25,
  };

  describe('validateOrder', () => {
    describe('buy orders', () => {
      it('should pass validation when balance is sufficient', () => {
        const result = validateOrder('buy', 0.1, 50000, mockBalances);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should fail when USD balance is insufficient', () => {
        const result = validateOrder('buy', 1.0, 50000, mockBalances);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Insufficient USD balance');
      });

      it('should fail when quantity is zero', () => {
        const result = validateOrder('buy', 0, 50000, mockBalances);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Quantity must be greater than 0');
      });

      it('should fail when quantity is negative', () => {
        const result = validateOrder('buy', -0.1, 50000, mockBalances);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Quantity must be greater than 0');
      });

      it('should fail when price is zero', () => {
        const result = validateOrder('buy', 0.1, 0, mockBalances);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Price must be greater than 0');
      });

      it('should fail when price is negative', () => {
        const result = validateOrder('buy', 0.1, -50000, mockBalances);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Price must be greater than 0');
      });

      it('should handle exact balance match', () => {
        const result = validateOrder('buy', 0.2, 50000, mockBalances);
        // 0.2 * 50000 = 10000 (exact match)
        expect(result.valid).toBe(true);
      });
    });

    describe('sell orders', () => {
      it('should pass validation when BTC balance is sufficient', () => {
        const result = validateOrder('sell', 0.1, 50000, mockBalances);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should fail when BTC balance is insufficient', () => {
        const result = validateOrder('sell', 0.5, 50000, mockBalances);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Insufficient BTC balance');
      });

      it('should fail when quantity is zero', () => {
        const result = validateOrder('sell', 0, 50000, mockBalances);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Quantity must be greater than 0');
      });

      it('should fail when quantity is negative', () => {
        const result = validateOrder('sell', -0.1, 50000, mockBalances);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Quantity must be greater than 0');
      });

      it('should handle exact balance match', () => {
        const result = validateOrder('sell', 0.25, 50000, mockBalances);
        // Exactly all BTC
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly', () => {
      expect(calculateCost(0.1, 50000)).toBe(5000);
      expect(calculateCost(1, 100)).toBe(100);
      expect(calculateCost(2.5, 1000)).toBe(2500);
    });

    it('should handle zero values', () => {
      expect(calculateCost(0, 50000)).toBe(0);
      expect(calculateCost(0.1, 0)).toBe(0);
    });

    it('should handle small quantities', () => {
      expect(calculateCost(0.001, 50000)).toBe(50);
    });
  });

  describe('estimatePnL', () => {
    describe('buy orders', () => {
      it('should calculate profit when price increases', () => {
        const pnl = estimatePnL('buy', 0.1, 50000, 0.5);
        // Entry: 50000, New: 50250 (+0.5%)
        // Profit: (50250 - 50000) * 0.1 = 25
        expect(pnl).toBeCloseTo(25, 6);
      });

      it('should calculate loss when price decreases', () => {
        const pnl = estimatePnL('buy', 0.1, 50000, -0.5);
        // Entry: 50000, New: 49750 (-0.5%)
        // Loss: (49750 - 50000) * 0.1 = -25
        expect(pnl).toBeCloseTo(-25, 6);
      });

      it('should return zero when price does not change', () => {
        const pnl = estimatePnL('buy', 0.1, 50000, 0);
        expect(pnl).toBeCloseTo(0, 6);
      });
    });

    describe('sell orders', () => {
      it('should calculate profit when price decreases', () => {
        const pnl = estimatePnL('sell', 0.1, 50000, -0.5);
        // Entry: 50000, New: 49750 (-0.5%)
        // Profit: -(49750 - 50000) * 0.1 = 25
        expect(pnl).toBeCloseTo(25, 6);
      });

      it('should calculate loss when price increases', () => {
        const pnl = estimatePnL('sell', 0.1, 50000, 0.5);
        // Entry: 50000, New: 50250 (+0.5%)
        // Loss: -(50250 - 50000) * 0.1 = -25
        expect(pnl).toBeCloseTo(-25, 6);
      });

      it('should return zero when price does not change', () => {
        const pnl = estimatePnL('sell', 0.1, 50000, 0);
        expect(pnl).toBeCloseTo(0, 6);
      });
    });

    describe('different quantities and prices', () => {
      it('should handle large quantities', () => {
        const pnl = estimatePnL('buy', 10, 1000, 1);
        // (1010 - 1000) * 10 = 100
        expect(pnl).toBe(100);
      });

      it('should handle small quantities', () => {
        const pnl = estimatePnL('buy', 0.001, 50000, 1);
        // (50500 - 50000) * 0.001 = 0.5
        expect(pnl).toBe(0.5);
      });

      it('should handle large price movements', () => {
        const pnl = estimatePnL('buy', 0.1, 50000, 10);
        // (55000 - 50000) * 0.1 = 500
        expect(pnl).toBeCloseTo(500, 6);
      });
    });
  });
});

