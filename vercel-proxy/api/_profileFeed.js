const { fetchChannelVideos } = require('./_youtube');

function uniqueVideos(videos) {
  const seen = new Set();
  return videos.filter((video) => {
    if (!video || seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  });
}

function parseViews(label) {
  if (!label) return 0;
  const match = String(label).match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return 0;

  switch ((match[2] || '').toUpperCase()) {
    case 'B': return value * 1e9;
    case 'M': return value * 1e6;
    case 'K': return value * 1e3;
    default: return value;
  }
}

function getVideoRestriction(video, filters) {
  if (!video) return { code: 'missing', why: 'Video unavailable', unlockable: false };
  if (video.short && filters.blockShorts) {
    return { code: 'shorts', why: 'Shorts are blocked', unlockable: false };
  }
  if (video.secs > 0 && video.secs < filters.minSecs) {
    return { code: 'duration', why: `Too short (${video.dur})`, unlockable: true };
  }

  const haystack = `${video.title} ${video.desc}`.toLowerCase();
  const keyword = (filters.keywords || []).find((entry) => haystack.includes(String(entry).toLowerCase()));
  if (keyword) {
    return { code: 'keyword', why: `Keyword: "${keyword}"`, unlockable: true };
  }

  return null;
}

function splitVideosByAccess(videos, filters, approvedIds) {
  const allowed = [];
  const blocked = [];
  const hiddenShorts = [];

  videos.forEach((video) => {
    const restriction = getVideoRestriction(video, filters);
    if (!restriction) {
      allowed.push(video);
      return;
    }

    if (restriction.code === 'shorts') {
      hiddenShorts.push({ ...video, why: restriction.why, unlockable: false });
      return;
    }

    if (approvedIds.has(video.id)) {
      allowed.push(video);
      return;
    }

    blocked.push({ ...video, why: restriction.why, unlockable: restriction.unlockable });
  });

  return { allowed, blocked, hiddenShorts };
}

function supabaseHeaders() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Vercel project settings.');
  }

  return {
    url,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  };
}

async function getAuthenticatedParentId(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const match = String(authHeader).match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const error = new Error('Missing parent session.');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = match[1].trim();
  const { url, headers } = supabaseHeaders();
  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      apikey: headers.apikey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  if (!response.ok || !data?.id) {
    const error = new Error('Invalid or expired parent session.');
    error.statusCode = 401;
    throw error;
  }

  return data.id;
}

async function supabaseRest(path, query = '') {
  const { url, headers } = supabaseHeaders();
  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}${query}`, { headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `Supabase request failed with ${response.status}`);
  }
  return data;
}

async function loadProfileBundle(profileId, parentId) {
  const [profileRows, filterRows, keywordRows, profileChannelRows, approvalRows, pinnedRows, historyRows] = await Promise.all([
    supabaseRest('child_profiles', `?id=eq.${encodeURIComponent(profileId)}&parent_id=eq.${encodeURIComponent(parentId)}&select=id,name,avatar_color,is_default,parent_id`),
    supabaseRest('profile_filters', `?profile_id=eq.${encodeURIComponent(profileId)}&select=block_shorts,min_secs`),
    supabaseRest('profile_keywords', `?profile_id=eq.${encodeURIComponent(profileId)}&select=keyword&order=keyword.asc`),
    supabaseRest('profile_channels', `?profile_id=eq.${encodeURIComponent(profileId)}&select=channel_id`),
    supabaseRest('approved_videos', `?profile_id=eq.${encodeURIComponent(profileId)}&select=video_id`),
    supabaseRest('pinned_videos', `?profile_id=eq.${encodeURIComponent(profileId)}&select=video_id,youtube_id,title,channel_id,channel_name,thumb,duration_label,views_label,published_date,description&order=pinned_at.desc`),
    supabaseRest('watch_history', `?profile_id=eq.${encodeURIComponent(profileId)}&select=video_id,title,channel_id,channel_name,thumb,duration_label,watched_at&order=watched_at.desc&limit=50`),
  ]);

  const profile = profileRows[0];
  if (!profile) {
    throw new Error('Profile not found.');
  }

  const channelIds = profileChannelRows.map((row) => row.channel_id);
  const channels = channelIds.length
    ? await supabaseRest('channels', `?id=in.(${channelIds.map((id) => `"${id}"`).join(',')})&select=id,name,handle,subscribers,color,category,thumb,builtin`)
    : [];

  return {
    profile,
    filters: {
      blockShorts: filterRows[0]?.block_shorts ?? true,
      minSecs: filterRows[0]?.min_secs ?? 60,
      keywords: keywordRows.map((row) => row.keyword),
    },
    channels,
    approvedIds: new Set(approvalRows.map((row) => row.video_id)),
    pinned: pinnedRows.map((video) => ({
      id: video.video_id,
      yt: video.youtube_id,
      ch: video.channel_id,
      chName: video.channel_name || '',
      title: video.title,
      thumb: video.thumb || '',
      dur: video.duration_label || '0:00',
      views: video.views_label || '0 views',
      date: video.published_date || '',
      desc: video.description || '',
      pinned: true,
    })),
    history: historyRows.map((entry) => ({
      id: entry.video_id,
      title: entry.title,
      ch: entry.channel_id,
      chName: entry.channel_name || '',
      thumb: entry.thumb || '',
      dur: entry.duration_label || '',
      at: entry.watched_at,
    })),
  };
}

async function loadChannelRows(bundle, maxResults = 30) {
  return Promise.all(
    bundle.channels.map(async (channel) => {
      const videos = await fetchChannelVideos(channel.id, maxResults, process.env.YOUTUBE_API_KEY);
      const split = splitVideosByAccess(videos, bundle.filters, bundle.approvedIds);
      return {
        channel,
        loadingState: 'ok',
        allowed: split.allowed,
        blocked: split.blocked,
        hiddenShorts: split.hiddenShorts,
        blockedCount: split.blocked.length,
        hiddenShortsCount: split.hiddenShorts.length,
        featured: split.allowed[0] || null,
      };
    }),
  );
}

async function buildProfileFeed(profileId, parentId) {
  const bundle = await loadProfileBundle(profileId, parentId);
  const channelRows = await loadChannelRows(bundle, 30);

  const allAllowed = uniqueVideos(channelRows.flatMap((entry) => entry.allowed));
  const recent = [...allAllowed].sort((left, right) => new Date(right.date) - new Date(left.date));
  const popular = [...allAllowed].sort((left, right) => parseViews(right.views) - parseViews(left.views));
  const longerVideos = allAllowed
    .filter((video) => video.secs >= 8 * 60)
    .sort((left, right) => right.secs - left.secs);

  const featured = bundle.pinned[0] || popular[0] || recent[0] || null;
  const queue = uniqueVideos([
    ...bundle.pinned,
    ...recent,
    ...popular,
    ...channelRows.map((entry) => entry.featured),
  ]).filter((video) => video.id !== featured?.id).slice(0, 4);

  return {
    profile: {
      id: bundle.profile.id,
      name: bundle.profile.name,
      avatarColor: bundle.profile.avatar_color,
      isDefault: bundle.profile.is_default,
    },
    filters: bundle.filters,
    channels: bundle.channels,
    channelRows,
    shelves: {
      featured,
      queue,
      pinned: bundle.pinned.slice(0, 10),
      recent: recent.slice(0, 12),
      popular: popular.slice(0, 12),
      longerVideos: longerVideos.slice(0, 12),
    },
    stats: {
      totalAllowed: allAllowed.length,
    },
  };
}

async function buildProfileChannel(profileId, channelId, parentId) {
  const bundle = await loadProfileBundle(profileId, parentId);
  const channel = bundle.channels.find((entry) => entry.id === channelId);
  if (!channel) {
    throw new Error('Channel not available for this profile.');
  }

  const videos = await fetchChannelVideos(channel.id, 30, process.env.YOUTUBE_API_KEY);
  const split = splitVideosByAccess(videos, bundle.filters, bundle.approvedIds);
  return {
    profile: {
      id: bundle.profile.id,
      name: bundle.profile.name,
    },
    channel,
    filters: bundle.filters,
    allowed: split.allowed,
    blocked: split.blocked,
    hiddenShorts: split.hiddenShorts,
  };
}

async function buildProfileWatch(profileId, videoId, parentId) {
  const bundle = await loadProfileBundle(profileId, parentId);
  const channelRows = await loadChannelRows(bundle, 30);
  const allAllowed = uniqueVideos([
    ...channelRows.flatMap((entry) => entry.allowed),
    ...bundle.pinned,
  ]);

  const video = allAllowed.find((entry) => entry.id === videoId) || null;
  if (!video) {
    throw new Error('Video not available for this profile.');
  }

  const channel = bundle.channels.find((entry) => entry.id === video.ch) || null;
  const relatedRow = channelRows.find((entry) => entry.channel.id === video.ch);
  const related = uniqueVideos((relatedRow?.allowed || []).filter((entry) => entry.id !== video.id)).slice(0, 8);

  const moreToExplore = uniqueVideos([
    ...bundle.history
      .filter((entry) => entry.id !== video.id)
      .map((entry) => allAllowed.find((candidate) => candidate.id === entry.id))
      .filter(Boolean),
    ...bundle.pinned.filter((entry) => entry.id !== video.id),
    ...allAllowed.filter((entry) => entry.id !== video.id && entry.ch !== video.ch),
  ]).slice(0, 6);

  return {
    profile: {
      id: bundle.profile.id,
      name: bundle.profile.name,
    },
    video,
    channel,
    related,
    moreToExplore,
    filters: bundle.filters,
  };
}

module.exports = {
  buildProfileChannel,
  buildProfileFeed,
  buildProfileWatch,
  getAuthenticatedParentId,
};
