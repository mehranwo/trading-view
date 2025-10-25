import type { Balances } from '@/state/useBalanceStore';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateOrder(
  side: 'buy' | 'sell',
  qty: number,
  price: number,
  balances: Balances
): ValidationResult {
  if (qty <= 0) {
    return {
      valid: false,
      error: 'Quantity must be greater than 0',
    };
  }

  if (price <= 0) {
    return {
      valid: false,
      error: 'Price must be greater than 0',
    };
  }

  if (side === 'buy') {
    const cost = calculateCost(qty, price);
    if (cost > balances.USD) {
      return {
        valid: false,
        error: `Insufficient USD balance. Required: $${cost.toFixed(2)}, Available: $${balances.USD.toFixed(2)}`,
      };
    }
  } else {
    if (qty > balances.BTC) {
      return {
        valid: false,
        error: `Insufficient BTC balance. Required: ${qty.toFixed(8)}, Available: ${balances.BTC.toFixed(8)}`,
      };
    }
  }

  return { valid: true };
}

export function calculateCost(qty: number, price: number): number {
  return qty * price;
}

export function estimatePnL(
  side: 'buy' | 'sell',
  qty: number,
  entryPrice: number,
  movePercent: number
): number {
  const newPrice = entryPrice * (1 + movePercent / 100);
  const priceDiff = newPrice - entryPrice;
  
  if (side === 'buy') {
    return priceDiff * qty;
  } else {
    return -priceDiff * qty;
  }
}

