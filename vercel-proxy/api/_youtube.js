const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function fmtViews(n) {
  if (Number.isNaN(n) || n === 0) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function parseDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0, 10) * 3600) + (parseInt(match[2] || 0, 10) * 60) + parseInt(match[3] || 0, 10);
}

function fmtDur(secs) {
  if (!secs && secs !== 0) return '0:00';
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function channelColor(id) {
  const palette = ['#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FF9800', '#FF5722', '#795548', '#607D8B'];
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (Math.imul(hash, 31) + id.charCodeAt(index)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

async function youtubeFetch(path, params, apiKey) {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `YouTube request failed with ${response.status}`);
  }
  return data;
}

function mapVideo(item, channelIdOverride) {
  const secs = parseDuration(item.contentDetails.duration);
  const title = item.snippet.title;
  return {
    id: item.id,
    ch: channelIdOverride || item.snippet.channelId,
    yt: item.id,
    title,
    thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
    dur: fmtDur(secs),
    secs,
    views: `${fmtViews(parseInt(item.statistics?.viewCount || '0', 10))} views`,
    date: (item.snippet.publishedAt || '').split('T')[0],
    desc: (item.snippet.description || '').slice(0, 300),
    short: secs <= 61 || title.toLowerCase().includes('#shorts') || title.toLowerCase().includes('shorts'),
    tags: (item.snippet.tags || []).slice(0, 5),
    chName: item.snippet.channelTitle,
  };
}

async function fetchChannelVideos(channelId, maxResults, apiKey) {
  const uploadsId = `UU${channelId.slice(2)}`;
  const playlistData = await youtubeFetch(
    'playlistItems',
    { part: 'snippet', playlistId: uploadsId, maxResults: maxResults || 30 },
    apiKey,
  );

  if (!playlistData.items?.length) {
    return [];
  }

  const ids = playlistData.items.map((item) => item.snippet.resourceId.videoId).join(',');
  const videosData = await youtubeFetch(
    'videos',
    { part: 'snippet,contentDetails,statistics', id: ids },
    apiKey,
  );

  return (videosData.items || []).map((item) => mapVideo(item, channelId));
}

async function resolveChannel(input, apiKey) {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    throw new Error('Enter a YouTube channel URL or @handle');
  }

  let id = null;
  let forHandle = null;
  if (/^UC[\w-]{21,22}$/.test(trimmed)) {
    id = trimmed;
  } else if (/youtube\.com\/channel\/(UC[\w-]+)/.test(trimmed)) {
    id = trimmed.match(/youtube\.com\/channel\/(UC[\w-]+)/)[1];
  } else if (/youtube\.com\/@([\w.-]+)/.test(trimmed)) {
    forHandle = `@${trimmed.match(/youtube\.com\/@([\w.-]+)/)[1]}`;
  } else if (trimmed.startsWith('@')) {
    forHandle = trimmed;
  } else {
    forHandle = `@${trimmed.replace(/^@/, '')}`;
  }

  const data = await youtubeFetch(
    'channels',
    id
      ? { part: 'snippet,statistics', id }
      : { part: 'snippet,statistics', forHandle },
    apiKey,
  );

  if (!data.items?.length) {
    throw new Error('Channel not found. Try the full YouTube channel URL.');
  }

  const channel = data.items[0];
  return {
    id: channel.id,
    name: channel.snippet.title,
    handle: channel.snippet.customUrl || `@${channel.snippet.title.replace(/\s+/g, '').toLowerCase()}`,
    subscribers: fmtViews(parseInt(channel.statistics?.subscriberCount || '0', 10)),
    color: channelColor(channel.id),
    category: 'Family',
    thumb: channel.snippet.thumbnails?.medium?.url || channel.snippet.thumbnails?.default?.url || '',
    builtin: false,
  };
}

async function fetchVideoById(input, apiKey) {
  const trimmed = (input || '').trim();
  let videoId = trimmed;
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  if (match) {
    videoId = match[1];
  }

  if (!/^[\w-]{11}$/.test(videoId)) {
    throw new Error('Invalid YouTube video URL or ID');
  }

  const data = await youtubeFetch(
    'videos',
    { part: 'snippet,contentDetails,statistics', id: videoId },
    apiKey,
  );

  if (!data.items?.length) {
    throw new Error('Video not found');
  }

  return {
    ...mapVideo(data.items[0]),
    pinned: true,
  };
}

async function searchChannels(query, maxResults, apiKey) {
  const searchData = await youtubeFetch(
    'search',
    { part: 'snippet', type: 'channel', q: query, maxResults: maxResults || 6 },
    apiKey,
  );

  if (!searchData.items?.length) {
    return [];
  }

  const ids = searchData.items.map((item) => item.id.channelId).join(',');
  const channelsData = await youtubeFetch(
    'channels',
    { part: 'snippet,statistics', id: ids },
    apiKey,
  );

  const info = {};
  (channelsData.items || []).forEach((channel) => {
    info[channel.id] = {
      subs: fmtViews(parseInt(channel.statistics?.subscriberCount || '0', 10)),
      handle: channel.snippet.customUrl || '',
    };
  });

  return searchData.items.map((item) => {
    const id = item.id.channelId;
    return {
      id,
      name: item.snippet.title,
      handle: info[id]?.handle || '',
      subscribers: info[id]?.subs || '',
      color: channelColor(id),
      category: 'Family',
      thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      desc: item.snippet.description || '',
      builtin: false,
    };
  });
}

async function searchVideos(query, maxResults, apiKey) {
  const searchData = await youtubeFetch(
    'search',
    { part: 'snippet', type: 'video', q: query, maxResults: maxResults || 8 },
    apiKey,
  );

  if (!searchData.items?.length) {
    return [];
  }

  const ids = searchData.items.map((item) => item.id.videoId).join(',');
  const videosData = await youtubeFetch(
    'videos',
    { part: 'snippet,contentDetails,statistics', id: ids },
    apiKey,
  );

  return (videosData.items || []).map((item) => ({
    ...mapVideo(item),
    pinned: true,
  }));
}

module.exports = {
  channelColor,
  fetchChannelVideos,
  fetchVideoById,
  fmtDur,
  fmtViews,
  mapVideo,
  parseDuration,
  resolveChannel,
  searchChannels,
  searchVideos,
  youtubeFetch,
};
