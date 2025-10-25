import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Balances {
  USD: number;
  BTC: number;
}

interface BalanceStore extends Balances {
  update: (balances: Partial<Balances>) => void;
  reset: () => void;
  canBuy: (qty: number, price: number) => boolean;
  canSell: (qty: number) => boolean;
}

const DEFAULT_BALANCES: Balances = {
  USD: 10000,
  BTC: 0.25,
};

export const useBalanceStore = create<BalanceStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_BALANCES,

      update: (partial) => {
        set((state) => ({
          USD: partial.USD ?? state.USD,
          BTC: partial.BTC ?? state.BTC,
        }));
        console.log('[BalanceStore] Updated balances');
      },

      reset: () => {
        set(DEFAULT_BALANCES);
        console.log('[BalanceStore] Reset to default balances');
      },

      canBuy: (qty, price) => {
        const { USD } = get();
        return qty * price <= USD;
      },

      canSell: (qty) => {
        const { BTC } = get();
        return qty <= BTC;
      },
    }),
    {
      name: 'trading-balances',
      partialize: (state) => ({ USD: state.USD, BTC: state.BTC }),
    }
  )
);

