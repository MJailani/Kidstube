const { buildProfileChannel } = require('./_profileFeed');

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return sendJson(res, 500, { error: 'Missing YOUTUBE_API_KEY in Vercel project settings.' });
  }

  try {
    const profileId = String(req.query.profileId || '').trim();
    const channelId = String(req.query.channelId || '').trim();
    if (!profileId || !channelId) {
      return sendJson(res, 400, { error: 'Missing profileId or channelId.' });
    }

    const data = await buildProfileChannel(profileId, channelId);
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return sendJson(res, 200, { data });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Channel request failed' });
  }
};
