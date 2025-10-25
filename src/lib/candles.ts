export interface Trade {
  ts: number;
  price: number;
  qty: number;
}

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

const MINUTE_MS = 60 * 1000;
const MAX_CANDLES = 60;

export class CandleAggregator {
  private candles: Candle[] = [];
  private currentCandle: Candle | null = null;

  addTrade(trade: Trade): Candle | null {
    const candleTime = this.getCandleTime(trade.ts);
    
    if (!this.currentCandle || this.currentCandle.t !== candleTime) {
      let completedCandle: Candle | null = null;
      if (this.currentCandle) {
        completedCandle = { ...this.currentCandle };
        this.candles.push(completedCandle);
        
        if (this.candles.length > MAX_CANDLES) {
          this.candles.shift();
        }
      }
      
      this.currentCandle = {
        t: candleTime,
        o: trade.price,
        h: trade.price,
        l: trade.price,
        c: trade.price,
        v: trade.qty,
      };
      
      return completedCandle;
    }
    
    this.currentCandle.h = Math.max(this.currentCandle.h, trade.price);
    this.currentCandle.l = Math.min(this.currentCandle.l, trade.price);
    this.currentCandle.c = trade.price;
    this.currentCandle.v += trade.qty;
    
    return null;
  }

  getCurrentCandle(): Candle | null {
    return this.currentCandle ? { ...this.currentCandle } : null;
  }

  getCandles(): Candle[] {
    return [...this.candles];
  }

  getAllCandles(): Candle[] {
    const all = [...this.candles];
    if (this.currentCandle) {
      all.push({ ...this.currentCandle });
    }
    return all;
  }

  getSessionOpen(): number | null {
    if (this.candles.length > 0) {
      return this.candles[0].o;
    }
    if (this.currentCandle) {
      return this.currentCandle.o;
    }
    return null;
  }

  getLastPrice(): number | null {
    if (this.currentCandle) {
      return this.currentCandle.c;
    }
    if (this.candles.length > 0) {
      return this.candles[this.candles.length - 1].c;
    }
    return null;
  }

  getPercentChange(): number | null {
    const open = this.getSessionOpen();
    const last = this.getLastPrice();
    
    if (open === null || last === null || open === 0) {
      return null;
    }
    
    return ((last - open) / open) * 100;
  }

  private getCandleTime(ts: number): number {
    return Math.floor(ts / MINUTE_MS) * MINUTE_MS;
  }

  reset(): void {
    this.candles = [];
    this.currentCandle = null;
  }
}

