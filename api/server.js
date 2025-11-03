import express from 'express';
import axios from 'axios';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Simple in-memory cache: key -> { data, expiresAt }
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

async function fetchCoinData(coinId) {
  // CoinGecko API: https://www.coingecko.com/en/api
  // We'll use the full coin endpoint to get name and symbol; price from market_data
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
  const response = await axios.get(url, { timeout: 12000 });
  const coin = response.data;

  if (!coin || !coin.id || !coin.symbol || !coin.name) {
    throw new Error('Invalid response from data provider');
  }

  const price = coin?.market_data?.current_price?.usd;
  if (typeof price !== 'number') {
    throw new Error('Price not available from data provider');
  }

  return {
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    price,
    currency: 'USD'
  };
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setToCache(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// GET /price/:id → { name, symbol, price }
app.get('/price/:id', async (req, res) => {
  const coinId = String(req.params.id || '').trim();
  if (!coinId) {
    return res.status(400).json({ error: 'Missing coin id' });
  }

  const cacheKey = `price:${coinId.toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const data = await fetchCoinData(coinId);
    setToCache(cacheKey, data, CACHE_TTL_MS);
    res.json({ ...data, cached: false });
  } catch (err) {
    const status = err?.response?.status || 500;
    const message = err?.response?.data?.error || err?.message || 'Unknown error';
    res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Crypto Price API listening on port ${port}`);
});


