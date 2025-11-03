# Crypto News Test Task

This project contains:
- A simple Cryptocurrency Price API (Node.js + Express) with 1-minute caching and Docker.
- A WordPress plugin that uses the Interactivity API to render a live-updating price ticker that fetches from the API every minute.

## Part 1: Cryptocurrency Price API

- Endpoint: `/price/{id}` (example: `/price/bitcoin`)
- Returns JSON: `{ name, symbol, price, currency, cached }`
- Data provider: CoinGecko
- Cache: in-memory, 1 minute

### Run locally

cd api
npm install
npm start
# API on http://localhost:3000

Health check:
http://localhost:3000/health

Sample price:
http://localhost:3000/price/bitcoin

### Docker

cd api
docker build -t crypto-price-api .
docker run -p 3000:3000 --name crypto-price-api crypto-price-api

## Part 2: WordPress Plugin

Path: `wp-plugin/crypto-price-ticker`

- Provides a shortcode: `[crypto_price_ticker id="bitcoin"]`
- Uses the Interactivity API to auto-refresh every minute
- Configurable API Base URL under Settings → Reading → "Crypto API Base URL"

### Install

1. Zip the folder `wp-plugin/crypto-price-ticker` and upload via WordPress Plugins → Add New → Upload.
2. Activate the plugin.
3. Visit Settings → Reading and set "Crypto API Base URL" to your API (e.g., `http://localhost:3000`).
4. Use the shortcode in posts/pages: `[crypto_price_ticker id="bitcoin"]`.