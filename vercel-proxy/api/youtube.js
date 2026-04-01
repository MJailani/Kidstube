const {
  channelColor,
  fetchChannelVideos,
  fetchVideoById,
  resolveChannel,
  searchChannels,
  searchVideos,
} = require('./_youtube');

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(body));
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
    const { action } = req.query;
    let data;

    switch (action) {
      case 'channelVideos':
        data = await fetchChannelVideos(req.query.channelId, req.query.maxResults, apiKey);
        break;
      case 'resolveChannel':
        data = await resolveChannel(req.query.input, apiKey);
        break;
      case 'videoById':
        data = await fetchVideoById(req.query.input, apiKey);
        break;
      case 'searchChannels':
        data = await searchChannels(req.query.query, req.query.maxResults, apiKey);
        break;
      case 'searchVideos':
        data = await searchVideos(req.query.query, req.query.maxResults, apiKey);
        break;
      default:
        return sendJson(res, 400, { error: 'Unknown action' });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
    return sendJson(res, 200, { data });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Proxy request failed' });
  }
};
