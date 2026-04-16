// api/news.js — Vercel Serverless Function
// Fetches YouTube RSS + Google News RSS and returns clean JSON
// Cached for 30 minutes via Vercel edge cache

const SOURCES = {
  immigration: {
    youtube: [
      { handle: 'askkubeir', name: 'AskKubeir' },
    ],
    news: [
      'https://news.google.com/rss/search?q=Canada+Express+Entry+PR+draw&hl=en-CA&gl=CA&ceid=CA:en',
      'https://news.google.com/rss/search?q=IRCC+Canada+immigration+policy&hl=en-CA&gl=CA&ceid=CA:en',
      'https://news.google.com/rss/search?q=Canada+permanent+residence+citizenship+2025&hl=en-CA&gl=CA&ceid=CA:en',
    ]
  },
  celpip: {
    youtube: [
      { handle: 'hzadeducation', name: 'HZad Education' },
      { handle: 'careeraxis',    name: 'CareerAxis' },
    ],
    news: [
      'https://news.google.com/rss/search?q=CELPIP+test+Canada&hl=en-CA&gl=CA&ceid=CA:en',
      'https://news.google.com/rss/search?q=IELTS+Canada+immigration+language+test&hl=en-CA&gl=CA&ceid=CA:en',
    ]
  },
  jobs: {
    youtube: [],
    news: [
      'https://news.google.com/rss/search?q=Canada+tech+jobs+hiring+2026&hl=en-CA&gl=CA&ceid=CA:en',
      'https://news.google.com/rss/search?q=Waterloo+Toronto+tech+jobs+newcomer&hl=en-CA&gl=CA&ceid=CA:en',
      'https://news.google.com/rss/search?q=Canada+immigration+job+market+skilled+workers&hl=en-CA&gl=CA&ceid=CA:en',
      'https://news.google.com/rss/search?q=Canada+software+engineer+jobs+2026&hl=en-CA&gl=CA&ceid=CA:en',
    ]
  }
};

// Fetch text from a URL with a timeout
async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    clearTimeout(id);
    return text;
  } catch (e) {
    clearTimeout(id);
    return null;
  }
}

// Parse RSS/Atom XML into array of items
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title   = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) || /<title>(.*?)<\/title>/.exec(block) || [])[1] || '';
    const link    = (/<link>(.*?)<\/link>/.exec(block) || /<link.*?href="(.*?)"/.exec(block) || [])[1] || '';
    const pubDate = (/<pubDate>(.*?)<\/pubDate>/.exec(block) || [])[1] || '';
    const source  = (/<source[^>]*>(.*?)<\/source>/.exec(block) || [])[1] || '';
    if (title && link) {
      items.push({
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim(),
        link: link.trim(),
        pubDate: pubDate.trim(),
        source: source.replace(/&amp;/g, '&').trim(),
        type: 'news'
      });
    }
  }
  return items;
}

// Parse YouTube RSS feed (Atom format)
function parseYouTubeRSS(xml, channelName) {
  const items = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const title     = (/<title>(.*?)<\/title>/.exec(block) || [])[1] || '';
    const link      = (/<link rel="alternate" href="(.*?)"/.exec(block) || [])[1] || '';
    const published = (/<published>(.*?)<\/published>/.exec(block) || [])[1] || '';
    const videoId   = (/<yt:videoId>(.*?)<\/yt:videoId>/.exec(block) || [])[1] || '';
    if (title && link) {
      items.push({
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(),
        link: link.trim(),
        pubDate: published.trim(),
        source: channelName,
        videoId: videoId.trim(),
        thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '',
        type: 'youtube'
      });
    }
  }
  return items;
}

// Resolve YouTube channel ID from handle using oembed trick
async function getChannelFeedUrl(handle) {
  // Try handle-based RSS directly (works for many channels)
  // YouTube RSS by channel handle isn't officially supported,
  // but we can try fetching the channel page to extract the channel ID
  const pageHtml = await fetchWithTimeout(`https://www.youtube.com/@${handle}`, 6000);
  if (!pageHtml) return null;
  const idMatch = /"channelId":"(UC[^"]+)"/.exec(pageHtml) || /channel\/(UC[A-Za-z0-9_-]{22})/.exec(pageHtml);
  if (idMatch) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${idMatch[1]}`;
  }
  return null;
}

// Format pubDate to relative time string
function relativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const diffH  = Math.floor(diffMs / 3600000);
    const diffD  = Math.floor(diffH / 24);
    if (diffH < 1)  return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7)  return `${diffD}d ago`;
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600'); // 30 min cache

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const tab = req.query.tab || 'immigration';
  const config = SOURCES[tab] || SOURCES.immigration;

  const results = { youtube: [], news: [] };

  // --- Fetch YouTube feeds ---
  const seenYT = new Set();
  for (const ch of config.youtube) {
    const feedUrl = await getChannelFeedUrl(ch.handle);
    if (!feedUrl) continue;
    const xml = await fetchWithTimeout(feedUrl, 6000);
    if (!xml) continue;
    const items = parseYouTubeRSS(xml, ch.name);
    for (const item of items.slice(0, 6)) {
      if (!seenYT.has(item.link)) {
        seenYT.add(item.link);
        results.youtube.push({ ...item, age: relativeTime(item.pubDate) });
      }
    }
  }

  // Sort YouTube by date, newest first
  results.youtube.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // --- Fetch News feeds ---
  const seenNews = new Set();
  for (const url of config.news) {
    const xml = await fetchWithTimeout(url, 6000);
    if (!xml) continue;
    const items = parseRSS(xml);
    for (const item of items.slice(0, 8)) {
      if (!seenNews.has(item.title)) {
        seenNews.add(item.title);
        results.news.push({ ...item, age: relativeTime(item.pubDate) });
      }
    }
  }

  // Sort news by date, newest first, cap at 15
  results.news.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  results.news = results.news.slice(0, 15);

  res.status(200).json({ tab, ...results, fetchedAt: new Date().toISOString() });
}
