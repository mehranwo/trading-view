import type { Trade } from './candles';
import type { DepthUpdate, DepthSnapshot } from './orderbook';

const TRADE_WS_URL = 'wss://stream.binance.com:9443/ws/btcusdt@trade';
const DEPTH_WS_URL = 'wss://stream.binance.com:9443/ws/btcusdt@depth@100ms';
const DEPTH_REST_URL = 'https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=1000';

const MIN_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 8000;
const JITTER_FACTOR = 0.2;

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

interface BinanceTradeMessage {
  E: number;
  p: string;
  q: string;
}

interface BinanceDepthMessage {
  U: number;
  u: number;
  b: [string, string][];
  a: [string, string][];
}

export function createTradeStream(
  onTrade: (trade: Trade) => void,
  onStatusChange: (status: ConnectionStatus) => void
): { ws: WebSocket | null; reconnect: () => void; close: () => void } {
  let ws: WebSocket | null = null;
  let reconnectAttempt = 0;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    
    if (typeof window === 'undefined') {
      console.warn('[TradeStream] Skipping: not in browser environment');
      return;
    }
    
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      console.warn('[TradeStream] Already connected or connecting');
      return;
    }

    onStatusChange(reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
    console.log('[TradeStream] Connecting to:', TRADE_WS_URL);

    try {
      ws = new WebSocket(TRADE_WS_URL);

      ws.onopen = () => {
        console.log('[TradeStream] Connected');
        reconnectAttempt = 0;
        onStatusChange('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as BinanceTradeMessage;
          const trade: Trade = {
            ts: data.E,
            price: parseFloat(data.p),
            qty: parseFloat(data.q),
          };
          onTrade(trade);
        } catch (error) {
          console.error('[TradeStream] Parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[TradeStream] WebSocket error (will auto-reconnect):', error);
      };

      ws.onclose = () => {
        console.log('[TradeStream] Disconnected');
        onStatusChange('disconnected');
        
        if (!isClosed) {
          scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('[TradeStream] Connection error (will retry):', error);
      onStatusChange('disconnected');
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (isClosed) return;
    if (reconnectTimeout) return;

    reconnectAttempt++;
    
    const baseDelay = Math.min(MIN_RECONNECT_DELAY * Math.pow(2, reconnectAttempt - 1), MAX_RECONNECT_DELAY);
    const jitter = baseDelay * JITTER_FACTOR * (Math.random() * 2 - 1);
    const delay = baseDelay + jitter;

    console.log(`[TradeStream] Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempt})`);

    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      connect();
    }, delay);
  }

  function close() {
    isClosed = true;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Client closing');
      }
      ws = null;
    }
  }

  function reconnect() {
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Reconnecting');
      }
    }
    reconnectAttempt = 0;
    setTimeout(() => connect(), 500);
  }

  connect();

  return { ws, reconnect, close };
}

export function createDepthStream(
  onUpdate: (update: DepthUpdate) => void,
  onStatusChange: (status: ConnectionStatus) => void
): { ws: WebSocket | null; reconnect: () => void; close: () => void } {
  let ws: WebSocket | null = null;
  let reconnectAttempt = 0;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    
    if (typeof window === 'undefined') {
      console.warn('[DepthStream] Skipping: not in browser environment');
      return;
    }
    
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      console.warn('[DepthStream] Already connected or connecting');
      return;
    }

    onStatusChange(reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
    console.log('[DepthStream] Connecting to:', DEPTH_WS_URL);

    try {
      ws = new WebSocket(DEPTH_WS_URL);

      ws.onopen = () => {
        console.log('[DepthStream] Connected');
        reconnectAttempt = 0;
        onStatusChange('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as BinanceDepthMessage;
          const update: DepthUpdate = {
            U: data.U,
            u: data.u,
            b: data.b,
            a: data.a,
          };
          onUpdate(update);
        } catch (error) {
          console.error('[DepthStream] Parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[DepthStream] WebSocket error (will auto-reconnect):', error);
      };

      ws.onclose = () => {
        console.log('[DepthStream] Disconnected');
        onStatusChange('disconnected');
        
        if (!isClosed) {
          scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('[DepthStream] Connection error (will retry):', error);
      onStatusChange('disconnected');
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (isClosed) return;
    if (reconnectTimeout) return;

    reconnectAttempt++;
    
    const baseDelay = Math.min(MIN_RECONNECT_DELAY * Math.pow(2, reconnectAttempt - 1), MAX_RECONNECT_DELAY);
    const jitter = baseDelay * JITTER_FACTOR * (Math.random() * 2 - 1);
    const delay = baseDelay + jitter;

    console.log(`[DepthStream] Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempt})`);

    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      connect();
    }, delay);
  }

  function close() {
    isClosed = true;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Client closing');
      }
      ws = null;
    }
  }

  function reconnect() {
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Reconnecting');
      }
    }
    reconnectAttempt = 0;
    setTimeout(() => connect(), 500);
  }

  connect();

  return { ws, reconnect, close };
}

export async function fetchDepthSnapshot(): Promise<DepthSnapshot> {
  try {
    const response = await fetch(DEPTH_REST_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data as DepthSnapshot;
  } catch (error) {
    console.error('[DepthSnapshot] Fetch error:', error);
    throw error;
  }
}

