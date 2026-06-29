// Secure Node.js/Express backend proxy for Anthropic Claude API

require('dotenv').config();
const express = require('express');
const path = require('path');
const Parser = require('rss-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '300') * 1000;
const parser = new Parser();

const RSS_FEEDS = {
  general: process.env.GENERAL_RSS_FEED_URL || process.env.RSS_FEED_URL || 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms',
  technology: process.env.TECHNOLOGY_RSS_FEED_URL || 'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms',
  business: process.env.BUSINESS_RSS_FEED_URL || 'https://timesofindia.indiatimes.com/rssfeedsvideo/3813458.cms',
  sports: process.env.SPORTS_RSS_FEED_URL || 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms',
  astrology: process.env.ASTROLOGY_RSS_FEED_URL || 'https://timesofindia.indiatimes.com/rssfeeds/65857041.cms',
  science: process.env.SCIENCE_RSS_FEED_URL || process.env.ASTROLOGY_RSS_FEED_URL || 'https://timesofindia.indiatimes.com/rssfeeds/65857041.cms',
  entertainment: process.env.ENTERTAINMENT_RSS_FEED_URL || 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',
  health: process.env.HEALTH_RSS_FEED_URL || process.env.ASTROLOGY_RSS_FEED_URL || 'https://timesofindia.indiatimes.com/rssfeeds/65857041.cms'
};

const cache = {};

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/news', async (req, res) => {
  const rawCategory = (req.query.category || 'general').toLowerCase().trim();
  const category = rawCategory === 'health' ? 'astrology' : rawCategory;
  const allowed = ['general', 'technology', 'business', 'sports', 'astrology', 'science', 'entertainment', 'health'];
  if (!allowed.includes(rawCategory) && !allowed.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  const cached = cache[category];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const feedUrl = RSS_FEEDS[category] || RSS_FEEDS.general;
    const feed = await parser.parseURL(feedUrl);
    const items = (feed.items || []).slice(0, 12).map((item) => ({
      title: item.title || 'Untitled article',
      description: (item.contentSnippet || item.content || item.summary || 'No summary available.').replace(/<[^>]*>/g, '').trim(),
      source: { name: feed.title || 'RSS Feed' },
      url: item.link || '#',
      publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      author: item.creator || item.author || null,
      image: item.enclosure?.url || item['media:content']?.$?.url || null
    }));

    cache[category] = { data: items, timestamp: Date.now() };
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cache/clear', (req, res) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  Object.keys(cache).forEach((k) => delete cache[k]);
  res.json({ message: 'Cache cleared.' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Daily News running at http://localhost:${PORT}`);
});
