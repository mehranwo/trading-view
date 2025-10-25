# BTC/USDT Trading Micro-App

A production-ready, browser-based cryptocurrency trading terminal built with Next.js 16, featuring real-time price charts, L2 order book depth, and simulated order execution.

## Features

### Live Price Chart
- **1-minute OHLC candles** aggregated client-side from trade stream
- **Rolling 60-minute window** with automatic updates
- **Real-time price display** with session % change
- Built with TradingView Lightweight Charts
- Responsive chart with automatic resizing

### Level-2 Order Book
- **Real-time depth updates** via WebSocket diff stream
- **REST snapshot initialization** with sequence validation
- **Top-20 levels** per side with cumulative depth
- **Heatmap visualization** showing order concentration
- **Tick animations** (green/red) on price level updates
- **Spread, mid-price, and VWAP** calculations

### Order Ticket
- **Buy/Sell orders** with real-time price estimation
- **Simulated balance management** (USD: $10,000, BTC: 0.25)
- **Client-side risk validation** before order placement
- **PnL estimation** at ±0.5% price movements
- **LocalStorage persistence** for balances across sessions
- **Success notifications** with order confirmations

### Resilience & UX
- **Auto-reconnect** with exponential backoff + jitter
- **Connection status** indicators for both streams
- **Latency measurement** (WS event → UI paint time)
- **Dark/light mode** with persistence
- **Keyboard accessible** forms
- **Responsive layout** (desktop-first)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Charting:** TradingView Lightweight Charts
- **Testing:** Jest + React Testing Library
- **Exchange:** Binance WebSocket & REST APIs

## Project Structure

```
/src
  /app
    page.tsx              # Main layout & WebSocket orchestration
    layout.tsx            # Root layout
    globals.css           # Tailwind + CSS variables
  /components
    Chart.tsx             # Price chart with candles
    OrderBook.tsx         # L2 depth with heatmap
    OrderTicket.tsx       # Order form with validation
    ConnectionStatus.tsx  # WebSocket status badge
    LatencyBadge.tsx      # Latency indicator
    Number.tsx            # Formatted number component
  /lib
    orderbook.ts          # Order book logic + calculations
    candles.ts            # Trade → OHLC aggregator
    risk.ts               # Order validation & PnL
    binance.ts            # WebSocket & REST clients
    format.ts             # Number formatting utilities
    storage.ts            # LocalStorage helpers
  /state
    useBookStore.ts       # Order book state
    useCandleStore.ts     # Candle data state
    useConnStore.ts       # Connection state
    useBalanceStore.ts    # Balance state
  /tests
    orderbook.test.ts     # Order book unit tests
    candles.test.ts       # Candle aggregator tests
    risk.test.ts          # Risk validation tests
```

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test:ci

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests in watch mode
- `pnpm test:ci` - Run tests once (for CI)
- `pnpm lint` - Run ESLint

## Data Sources

All data comes from Binance public APIs (no authentication required):

- **Trade Stream:** `wss://stream.binance.com:9443/ws/btcusdt@trade`
- **Depth Stream:** `wss://stream.binance.com:9443/ws/btcusdt@depth@100ms`
- **Depth Snapshot:** `https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=1000`

## Architecture Highlights

### Client-Side OHLC Aggregation
Trades are aggregated into 1-minute candles in the browser using the `CandleAggregator` class. This ensures:
- Real-time candle updates as trades arrive
- Efficient rolling window management (max 60 candles)
- Accurate OHLCV calculation

### Order Book Synchronization
The order book follows Binance's recommended sync pattern:
1. Fetch REST snapshot (`lastUpdateId`)
2. Buffer incoming WebSocket updates
3. Drop events where `u <= lastUpdateId`
4. Validate sequence continuity (`U <= lastUpdateId + 1`)
5. Apply updates and maintain sorted price levels

### WebSocket Resilience
Both trade and depth streams implement:
- Exponential backoff (1s → 2s → 4s → 8s max)
- Random jitter (±20%) to prevent thundering herd
- Automatic reconnection on disconnect
- Connection state tracking

### State Management
Zustand stores provide:
- Minimal re-renders via selector pattern
- Derived state (spread, VWAP, etc.)
- Clean separation of concerns
- Easy testing without mocking

## Testing

The app includes comprehensive unit tests for all business logic:

```bash
pnpm test:ci
```

**Test Coverage:**
- ✅ Order book snapshot parsing
- ✅ Depth update sequencing & validation
- ✅ Price level updates (add/remove/modify)
- ✅ Candle aggregation across minute boundaries
- ✅ Rolling window management
- ✅ Risk validation (balance checks)
- ✅ PnL calculations

**Test Results:** 58 tests pass, 3 test suites