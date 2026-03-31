const API_KEY = 'AIzaSyD7hy8SWw8uIzx0ks986PnyGamm25brpY0';

export function parseDuration(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

export function fmtDur(secs) {
  if (!secs && secs !== 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
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

export async function fetchChannelVideos(channelId, maxResults = 30) {
  const uploadsId = 'UU' + channelId.slice(2);
  const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=${maxResults}&key=${API_KEY}`;
  const plRes = await fetch(plUrl);
  const plData = await plRes.json();
  if (plData.error) throw new Error(plData.error.message);
  if (!plData.items || plData.items.length === 0) return [];

  const videoIds = plData.items.map(item => item.snippet.resourceId.videoId).join(',');
  const vidUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${API_KEY}`;
  const vidRes = await fetch(vidUrl);
  const vidData = await vidRes.json();
  if (vidData.error) throw new Error(vidData.error.message);

  return (vidData.items || []).map(item => {
    const secs = parseDuration(item.contentDetails.duration);
    const title = item.snippet.title;
    const titleLc = title.toLowerCase();
    const isShort = secs <= 61 || titleLc.includes('#shorts') || titleLc.includes('shorts');
    const thumb =
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.default?.url || '';
    return {
      id: item.id,
      ch: channelId,
      yt: item.id,
      title,
      thumb,
      dur: fmtDur(secs),
      secs,
      views: fmtViews(parseInt(item.statistics?.viewCount || '0')) + ' views',
      date: (item.snippet.publishedAt || '').split('T')[0],
      desc: (item.snippet.description || '').slice(0, 300),
      short: isShort,
      tags: (item.snippet.tags || []).slice(0, 5),
    };
  });
}
