import { API_BASE_URL, CHANNELS, HAS_PROXY_URL } from './config';

export function parseDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0, 10) * 3600) + (parseInt(match[2] || 0, 10) * 60) + parseInt(match[3] || 0, 10);
}

export function fmtDur(secs) {
  if (!secs && secs !== 0) return '0:00';
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function fmtViews(n) {
  if (Number.isNaN(n) || n === 0) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export function channelColor(id) {
  const palette = ['#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FF9800', '#FF5722', '#795548', '#607D8B'];
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (Math.imul(hash, 31) + id.charCodeAt(index)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

export function getAllChannels(state) {
  const customChannels = state.customChannels || [];
  const allChannels = [...CHANNELS];
  customChannels.forEach((channel) => {
    if (!allChannels.find((entry) => entry.id === channel.id)) {
      allChannels.push(channel);
    }
  });
  return allChannels;
}

function requireProxyUrl() {
  if (!HAS_PROXY_URL) {
    throw new Error('Missing proxy URL. Add VITE_API_BASE_URL to a .env.local file.');
  }
}

async function proxyRequest(action, params = {}) {
  requireProxyUrl();
  const url = new URL(`${API_BASE_URL.replace(/\/$/, '')}/youtube`);
  url.searchParams.set('action', action);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Proxy request failed with ${response.status}`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.data;
}

async function proxyPathRequest(path, params = {}) {
  requireProxyUrl();
  const url = new URL(`${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Proxy request failed with ${response.status}`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.data;
}

export async function fetchChannelVideos(channelId, maxResults = 30) {
  return proxyRequest('channelVideos', { channelId, maxResults });
}

export async function resolveChannel(input) {
  return proxyRequest('resolveChannel', { input });
}

export async function fetchVideoById(input) {
  return proxyRequest('videoById', { input });
}

export async function searchChannels(query, maxResults = 6) {
  return proxyRequest('searchChannels', { query, maxResults });
}

export async function searchVideos(query, maxResults = 8) {
  return proxyRequest('searchVideos', { query, maxResults });
}

export async function fetchProfileFeed(profileId) {
  return proxyPathRequest('feed', { profileId });
}

export async function fetchProfileChannel(profileId, channelId) {
  return proxyPathRequest('channel', { profileId, channelId });
}

export async function fetchProfileWatch(profileId, videoId) {
  return proxyPathRequest('watch', { profileId, videoId });
}
