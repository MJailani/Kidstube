const { fetchChannelVideos } = require('./_youtube');

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

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

function canUseApprovedOverride(video, filters, approvedIds) {
  const restriction = getVideoRestriction(video, filters);
  if (!restriction) return true;
  if (restriction.code === 'shorts') return false;
  return approvedIds.has(video.id);
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

async function supabaseRest(path, query = '') {
  const { url, headers } = supabaseHeaders();
  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}${query}`, { headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `Supabase request failed with ${response.status}`);
  }
  return data;
}

async function loadProfileBundle(profileId) {
  const [profileRows, filterRows, keywordRows, profileChannelRows, approvalRows, pinnedRows] = await Promise.all([
    supabaseRest('child_profiles', `?id=eq.${encodeURIComponent(profileId)}&select=id,name,avatar_color,is_default,parent_id`),
    supabaseRest('profile_filters', `?profile_id=eq.${encodeURIComponent(profileId)}&select=block_shorts,min_secs`),
    supabaseRest('profile_keywords', `?profile_id=eq.${encodeURIComponent(profileId)}&select=keyword&order=keyword.asc`),
    supabaseRest('profile_channels', `?profile_id=eq.${encodeURIComponent(profileId)}&select=channel_id`),
    supabaseRest('approved_videos', `?profile_id=eq.${encodeURIComponent(profileId)}&select=video_id`),
    supabaseRest('pinned_videos', `?profile_id=eq.${encodeURIComponent(profileId)}&select=video_id,youtube_id,title,channel_id,channel_name,thumb,duration_label,views_label,published_date,description&order=pinned_at.desc`),
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
  };
}

async function buildProfileFeed(profileId, apiKey) {
  const bundle = await loadProfileBundle(profileId);
  const channelVideos = await Promise.all(
    bundle.channels.map(async (channel) => {
      const videos = await fetchChannelVideos(channel.id, 30, apiKey);
      const split = splitVideosByAccess(videos, bundle.filters, bundle.approvedIds);
      return {
        channel,
        loadingState: 'ok',
        allowed: split.allowed,
        blockedCount: split.blocked.length,
        hiddenShortsCount: split.hiddenShorts.length,
        featured: split.allowed[0] || null,
      };
    }),
  );

  const allAllowed = uniqueVideos(channelVideos.flatMap((entry) => entry.allowed));
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
    ...channelVideos.map((entry) => entry.featured),
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
    channelRows: channelVideos,
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

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return sendJson(res, 500, { error: 'Missing YOUTUBE_API_KEY in Vercel project settings.' });
  }

  try {
    const profileId = String(req.query.profileId || '').trim();
    if (!profileId) {
      return sendJson(res, 400, { error: 'Missing profileId.' });
    }

    const data = await buildProfileFeed(profileId, apiKey);
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return sendJson(res, 200, { data });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Feed request failed' });
  }
};
