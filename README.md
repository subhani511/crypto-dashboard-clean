# Crypto Dashboard

A cryptocurrency dashboard built with **Next.js**, **TypeScript**, **React Query**, and **Tailwind CSS**, deployed on **Vercel**.  
It fetches market data from the [CoinGecko API](https://www.coingecko.com/en/api) and provides highlights such as trending coins, gainers, losers, and more.

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

npm install
# or
yarn install

Setup environment variables

Create a .env.local file in the root of the project based on .env.example.

NEXT_PUBLIC_COINGECKO_BASE=https://api.coingecko.com/api/v3

Run the development server
npm run dev

Build for production
npm run build
npm start

Tech Stack

Frontend Framework: Next.js
 (App Router, TypeScript)

UI & Styling: Tailwind CSS

State/Data Fetching: TanStack React Query

Deployment: Vercel

API: CoinGecko API

Architecture Overview

App Router (Next.js 15+)
Pages and API routes organized under src/app.

Components

src/components/FiltersTabs.tsx: tabbed navigation for dashboard sections.

src/components/highlights/HighlightsSection.tsx: displays trending, gainers, losers, etc.

src/components/tables/CoinsTable.tsx: table of coins with modal details.

API Routes (server-side)

/api/coins → fetches market data.

/api/categories → fetches categories.

/api/market-chart/[id] → fetches market chart data for a specific coin.

Adapters & Types

src/lib/types.ts: type definitions (RawCoin, Coin).

src/lib/coinAdapter.ts: normalizes raw API responses into internal Coin objects.

🎯 Design Patterns Used

Adapter Pattern → coinAdapter.ts normalizes external API (CoinGecko) into an internal type (Coin).

Separation of Concerns → API logic in src/lib/api.ts, UI components in src/components, types in src/lib/types.ts.

React Query Pattern → centralized data fetching and caching with automatic background refetching.

Container/Presentational Pattern → Hooks (data) separated from UI components for maintainability.

📌 Assumptions

Using free CoinGecko endpoints without authentication.

Limited coin data (per_page=100) is sufficient for the dashboard.

Basic UI focus on highlights rather than exhaustive analytics.

Future Improvements

Add authentication (NextAuth) and user preferences.

Integrate WebSocket streams for live price updates.

Add charts with historical data using Recharts
 or Chart.js
.

Expand to support portfolio tracking and alerts.

Implement testing (Jest/React Testing Library).

Environment Variables

Environment variables are required for both local development and Vercel deployment.

Create a .env.local file:

# CoinGecko base URL
NEXT_PUBLIC_COINGECKO_BASE=https://api.coingecko.com/api/v3

.env.example

Include this file in your repo:

# Example environment variables for Crypto Dashboard
# Copy this file to `.env.local` and update values as needed.

NEXT_PUBLIC_COINGECKO_BASE=https://api.coingecko.com/api/v3

---

✅ This is a **single complete README.md** file you can paste directly into your GitHub repo.  

Do you want me to also generate a **minimal `.env.example` file separately** so you can commit it alongside `README.md`?
