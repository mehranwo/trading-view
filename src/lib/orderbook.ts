export type Price = number;

export interface Level {
  price: Price;
  size: number;
}

export interface BookSide {
  levels: Level[];
  cumul: number[];
}

export interface OrderBook {
  bids: BookSide;
  asks: BookSide;
  lastUpdateId: number;
}

export interface DepthUpdate {
  u: number;
  U: number;
  b: [string, string][];
  a: [string, string][];
}

export interface DepthSnapshot {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export function parseSnapshot(snapshot: DepthSnapshot): OrderBook {
  const bids = snapshot.bids
    .map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }))
    .filter((level) => level.size > 0)
    .sort((a, b) => b.price - a.price);

  const asks = snapshot.asks
    .map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }))
    .filter((level) => level.size > 0)
    .sort((a, b) => a.price - b.price);

  return {
    bids: { levels: bids, cumul: calculateCumulatives(bids) },
    asks: { levels: asks, cumul: calculateCumulatives(asks) },
    lastUpdateId: snapshot.lastUpdateId,
  };
}

export function applyDepthUpdate(
  book: OrderBook,
  update: DepthUpdate
): OrderBook | null {
  if (update.u <= book.lastUpdateId) {
    return null;
  }

  if (update.U > book.lastUpdateId + 1) {
    console.warn('Gap in order book updates, re-sync needed');
    return null;
  }

  let newBids = [...book.bids.levels];
  for (const [priceStr, sizeStr] of update.b) {
    const price = parseFloat(priceStr);
    const size = parseFloat(sizeStr);
    newBids = updateLevel(newBids, price, size, 'desc');
  }

  let newAsks = [...book.asks.levels];
  for (const [priceStr, sizeStr] of update.a) {
    const price = parseFloat(priceStr);
    const size = parseFloat(sizeStr);
    newAsks = updateLevel(newAsks, price, size, 'asc');
  }

  return {
    bids: { levels: newBids, cumul: calculateCumulatives(newBids) },
    asks: { levels: newAsks, cumul: calculateCumulatives(newAsks) },
    lastUpdateId: update.u,
  };
}

function updateLevel(
  levels: Level[],
  price: Price,
  size: number,
  order: 'asc' | 'desc'
): Level[] {
  const index = levels.findIndex((l) => l.price === price);

  if (size === 0) {
    if (index !== -1) {
      return [...levels.slice(0, index), ...levels.slice(index + 1)];
    }
    return levels;
  }

  if (index !== -1) {
    const updated = [...levels];
    updated[index] = { price, size };
    return updated;
  }

  const newLevel = { price, size };
  const newLevels = [...levels, newLevel];
  
  if (order === 'desc') {
    newLevels.sort((a, b) => b.price - a.price);
  } else {
    newLevels.sort((a, b) => a.price - b.price);
  }
  
  return newLevels;
}

export function calculateCumulatives(levels: Level[]): number[] {
  const cumul: number[] = [];
  let sum = 0;
  for (const level of levels) {
    sum += level.size;
    cumul.push(sum);
  }
  return cumul;
}

export function calculateSpread(book: OrderBook): number {
  const bestBid = book.bids.levels[0]?.price ?? 0;
  const bestAsk = book.asks.levels[0]?.price ?? 0;
  return bestAsk - bestBid;
}

export function calculateMidPrice(book: OrderBook): number {
  const bestBid = book.bids.levels[0]?.price ?? 0;
  const bestAsk = book.asks.levels[0]?.price ?? 0;
  return (bestBid + bestAsk) / 2;
}

export function calculateVWAP(levels: Level[], depth: number = 20): number {
  const topLevels = levels.slice(0, depth);
  if (topLevels.length === 0) return 0;

  let totalValue = 0;
  let totalSize = 0;

  for (const level of topLevels) {
    totalValue += level.price * level.size;
    totalSize += level.size;
  }

  return totalSize > 0 ? totalValue / totalSize : 0;
}

export function getTopLevels(book: OrderBook, n: number = 20) {
  return {
    bids: book.bids.levels.slice(0, n),
    asks: book.asks.levels.slice(0, n),
  };
}

