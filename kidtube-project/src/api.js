import { API_KEY, CHANNELS } from './config';

// ── FORMATTERS ────────────────────────────────────────────────────────────────
export function parseDuration(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

export function fmtDur(secs) {
  if (!secs && secs !== 0) return '0:00';
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtViews(n) {
  if (isNaN(n) || n === 0) return '0';
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export function channelColor(id) {
  const palette = ['#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FF9800', '#FF5722', '#795548', '#607D8B'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
export function getAllChannels(s) {
  const custom = s.customChannels || [];
  const all = [...CHANNELS];
  for (const c of custom) { if (!all.find(x => x.id === c.id)) all.push(c); }
  return all;
}

export function filterVideos(videos, filters) {
  const allowed = [], blocked = [];
  for (const v of videos) {
    if (filters.blockShorts && v.short) continue;
    if (v.secs > 0 && v.secs < filters.minSecs) { blocked.push({ ...v, why: `Too short (${v.dur})` }); continue; }
    const hay = (v.title + ' ' + v.desc).toLowerCase();
    const hit = filters.keywords.find(k => hay.includes(k.toLowerCase()));
    if (hit) { blocked.push({ ...v, why: `Keyword: "${hit}"` }); continue; }
    allowed.push(v);
  }
  return { allowed, blocked };
}

// ── API CALLS ─────────────────────────────────────────────────────────────────
export async function fetchChannelVideos(channelId, maxResults = 30) {
  const uploadsId = 'UU' + channelId.slice(2);
  const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=${maxResults}&key=${API_KEY}`);
  const plData = await plRes.json();
  if (plData.error) throw new Error(plData.error.message);
  if (!plData.items?.length) return [];
  const ids = plData.items.map(i => i.snippet.resourceId.videoId).join(',');
  const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids}&key=${API_KEY}`);
  const vidData = await vidRes.json();
  if (vidData.error) throw new Error(vidData.error.message);
  return (vidData.items || []).map(item => {
    const secs = parseDuration(item.contentDetails.duration);
    const title = item.snippet.title;
    const isShort = secs <= 61 || title.toLowerCase().includes('#shorts') || title.toLowerCase().includes('shorts');
    const thumb = item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '';
    return {
      id: item.id, ch: channelId, yt: item.id, title, thumb,
      dur: fmtDur(secs), secs,
      views: fmtViews(parseInt(item.statistics?.viewCount || '0')) + ' views',
      date: (item.snippet.publishedAt || '').split('T')[0],
      desc: (item.snippet.description || '').slice(0, 300),
      short: isShort, tags: (item.snippet.tags || []).slice(0, 5),
    };
  });
}

export async function resolveChannel(input) {
  const t = input.trim();
  if (!t) throw new Error('Enter a YouTube channel URL or @handle');
  let id = null, forHandle = null;
  if (/^UC[\w-]{21,22}$/.test(t)) { id = t; }
  else if (/youtube\.com\/channel\/(UC[\w-]+)/.test(t)) { id = t.match(/youtube\.com\/channel\/(UC[\w-]+)/)[1]; }
  else if (/youtube\.com\/@([\w.-]+)/.test(t)) { forHandle = '@' + t.match(/youtube\.com\/@([\w.-]+)/)[1]; }
  else if (t.startsWith('@')) { forHandle = t; }
  else { forHandle = '@' + t.replace(/^@/, ''); }
  const url = id
    ? `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${id}&key=${API_KEY}`
    : `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(forHandle)}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  if (!data.items?.length) throw new Error('Channel not found. Try the full YouTube channel URL.');
  const ch = data.items[0];
  return {
    id: ch.id,
    name: ch.snippet.title,
    handle: ch.snippet.customUrl || ('@' + ch.snippet.title.replace(/\s+/g, '').toLowerCase()),
    subscribers: fmtViews(parseInt(ch.statistics?.subscriberCount || '0')),
    color: channelColor(ch.id),
    category: 'Family',
    thumb: ch.snippet.thumbnails?.medium?.url || ch.snippet.thumbnails?.default?.url || '',
    builtin: false,
  };
}

export async function fetchVideoById(input) {
  const t = input.trim();
  let vid = t;
  const m = t.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  if (m) vid = m[1];
  if (!/^[\w-]{11}$/.test(vid)) throw new Error('Invalid YouTube video URL or ID');
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${vid}&key=${API_KEY}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  if (!data.items?.length) throw new Error('Video not found');
  const item = data.items[0];
  const secs = parseDuration(item.contentDetails.duration);
  return {
    id: item.id, ch: item.snippet.channelId, yt: item.id,
    title: item.snippet.title,
    thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    dur: fmtDur(secs), secs,
    views: fmtViews(parseInt(item.statistics?.viewCount || '0')) + ' views',
    date: (item.snippet.publishedAt || '').split('T')[0],
    desc: (item.snippet.description || '').slice(0, 300),
    short: false, tags: (item.snippet.tags || []).slice(0, 5),
    chName: item.snippet.channelTitle, pinned: true,
  };
}

export async function searchChannels(query, maxResults = 6) {
  const sr = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${API_KEY}`);
  const sd = await sr.json();
  if (sd.error) throw new Error(sd.error.message);
  if (!sd.items?.length) return [];
  const ids = sd.items.map(i => i.id.channelId).join(',');
  const cr = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids}&key=${API_KEY}`);
  const cd = await cr.json();
  const info = {};
  (cd.items || []).forEach(ch => {
    info[ch.id] = { subs: fmtViews(parseInt(ch.statistics?.subscriberCount || '0')), handle: ch.snippet.customUrl || '' };
  });
  return sd.items.map(item => {
    const id = item.id.channelId;
    return {
      id, name: item.snippet.title, handle: info[id]?.handle || '',
      subscribers: info[id]?.subs || '', color: channelColor(id), category: 'Family',
      thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      desc: item.snippet.description || '', builtin: false,
    };
  });
}

export async function searchVideos(query, maxResults = 8) {
  const sr = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${API_KEY}`);
  const sd = await sr.json();
  if (sd.error) throw new Error(sd.error.message);
  if (!sd.items?.length) return [];
  const ids = sd.items.map(i => i.id.videoId).join(',');
  const vr = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids}&key=${API_KEY}`);
  const vd = await vr.json();
  if (vd.error) throw new Error(vd.error.message);
  return (vd.items || []).map(item => {
    const secs = parseDuration(item.contentDetails.duration);
    const title = item.snippet.title;
    return {
      id: item.id, ch: item.snippet.channelId, yt: item.id, title,
      thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      dur: fmtDur(secs), secs,
      views: fmtViews(parseInt(item.statistics?.viewCount || '0')) + ' views',
      date: (item.snippet.publishedAt || '').split('T')[0],
      desc: (item.snippet.description || '').slice(0, 300),
      short: secs <= 61 || title.toLowerCase().includes('#shorts'),
      tags: (item.snippet.tags || []).slice(0, 5),
      chName: item.snippet.channelTitle, pinned: true,
    };
  });
}
