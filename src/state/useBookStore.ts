import { create } from 'zustand';
import {
  parseSnapshot,
  applyDepthUpdate,
  calculateSpread,
  calculateMidPrice,
  calculateVWAP,
  getTopLevels,
  type OrderBook,
  type DepthUpdate,
  type DepthSnapshot,
} from '@/lib/orderbook';

interface BookStore {
  book: OrderBook | null;
  isReady: boolean;
  initFromSnapshot: (snapshot: DepthSnapshot) => void;
  applyUpdate: (update: DepthUpdate) => boolean;
  reset: () => void;
  getSpread: () => number;
  getMidPrice: () => number;
  getVWAP: () => { bids: number; asks: number };
  getTopLevels: (n?: number) => ReturnType<typeof getTopLevels>;
  getBestBid: () => number | null;
  getBestAsk: () => number | null;
}

export const useBookStore = create<BookStore>((set, get) => ({
  book: null,
  isReady: false,

  initFromSnapshot: (snapshot) => {
    const book = parseSnapshot(snapshot);
    set({ book, isReady: true });
    console.log('[BookStore] Initialized from snapshot', {
      lastUpdateId: book.lastUpdateId,
      bids: book.bids.levels.length,
      asks: book.asks.levels.length,
    });
  },

  applyUpdate: (update) => {
    const { book } = get();
    if (!book) {
      console.warn('[BookStore] Cannot apply update: book not initialized');
      return false;
    }

    const newBook = applyDepthUpdate(book, update);
    if (newBook) {
      set({ book: newBook });
      return true;
    }
    return false;
  },

  reset: () => {
    set({ book: null, isReady: false });
  },

  getSpread: () => {
    const { book } = get();
    return book ? calculateSpread(book) : 0;
  },

  getMidPrice: () => {
    const { book } = get();
    return book ? calculateMidPrice(book) : 0;
  },

  getVWAP: () => {
    const { book } = get();
    if (!book) return { bids: 0, asks: 0 };
    
    return {
      bids: calculateVWAP(book.bids.levels, 20),
      asks: calculateVWAP(book.asks.levels, 20),
    };
  },

  getTopLevels: (n = 20) => {
    const { book } = get();
    if (!book) return { bids: [], asks: [] };
    return getTopLevels(book, n);
  },

  getBestBid: () => {
    const { book } = get();
    return book?.bids.levels[0]?.price ?? null;
  },

  getBestAsk: () => {
    const { book } = get();
    return book?.asks.levels[0]?.price ?? null;
  },
}));

