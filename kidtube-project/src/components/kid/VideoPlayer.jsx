import React, { useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { useApp, useIsVideoAllowed } from '../../context/AppContext.jsx';
import { VIDEOS, CHANNELS, applyFilters } from '../../mockData.js';

export default function VideoPlayer() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const isAllowed = useIsVideoAllowed();

  const video = VIDEOS.find(v => v.id === videoId);
  const channel = video ? CHANNELS.find(c => c.id === video.channelId) : null;

  // Check access
  const channelWhitelisted = video && state.whitelistedChannelIds.includes(video.channelId);
  const allowed = video ? isAllowed(video) : false;

  // Log to watch history when playing
  const hasLogged = useRef(false);
  useEffect(() => {
    if (video && channelWhitelisted && allowed === true && !hasLogged.current) {
      hasLogged.current = true;
      dispatch({
        type: 'ADD_TO_HISTORY',
        entry: {
          videoId: video.id,
          title: video.title,
          channelId: video.channelId,
          channelName: channel?.name || '',
          thumbnail: video.thumbnail,
          duration: video.duration,
        },
      });
    }
  }, [video?.id]);

  // Get related videos from the same channel (allowed only)
  const relatedVideos = video
    ? (() => {
        const channelVids = VIDEOS.filter(v => v.channelId === video.channelId && v.id !== video.id);
        const { allowed: allowedVids } = applyFilters(channelVids, state.filters);
        return allowedVids.slice(0, 6);
      })()
    : [];

  // ── Not found ──
  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">🎬</div>
        <p className="text-white text-lg font-bold mb-2">Video not found</p>
        <button onClick={() => navigate('/')} className="text-red-400 hover:text-red-300 flex items-center gap-1 mt-2">
          <ArrowLeft size={16} /> Back to home
        </button>
      </div>
    );
  }

  // ── Blocked or not whitelisted ──
  if (!channelWhitelisted || allowed !== true) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock size={48} className="text-[#aaa] mb-4" />
        <p className="text-white text-lg font-bold mb-2">This video isn't available</p>
        <p className="text-[#aaa] max-w-sm mb-6">
          {!channelWhitelisted
            ? 'This channel hasn\'t been added to your list yet.'
            : 'This video has been restricted by a parent filter.'}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-red-400 hover:text-red-300 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Go back
        </button>
      </div>
    );
  }

  // ── Shorts hidden entirely ──
  if (video.isShort && state.filters.blockShorts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock size={48} className="text-[#aaa] mb-4" />
        <p className="text-white text-lg font-bold mb-2">Shorts are hidden</p>
        <p className="text-[#aaa] max-w-sm mb-6">
          A parent has turned off YouTube Shorts. Ask them to enable it in Parent Settings.
        </p>
        <button onClick={() => navigate(-1)} className="text-red-400 hover:text-red-300 flex items-center gap-1">
          <ArrowLeft size={16} /> Go back
        </button>
      </div>
    );
  }

  // YouTube embed params: no related videos from other channels, modest branding, no annotations
  const embedParams = new URLSearchParams({
    autoplay: '1',
    rel: '0',           // no related from other channels
    modestbranding: '1',
    iv_load_policy: '3', // hide annotations
    cc_load_policy: '0',
    disablekb: '0',
    fs: '1',
  }).toString();

  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?${embedParams}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Main video area ── */}
        <div className="flex-1 min-w-0">
          {/* Back */}
          <button
            onClick={() => navigate(`/channel/${video.channelId}`)}
            className="flex items-center gap-1 text-[#aaa] hover:text-white mb-3 text-sm"
          >
            <ArrowLeft size={16} /> Back to {channel.name}
          </button>

          {/* Player */}
          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              title={video.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          </div>

          {/* Video meta */}
          <div className="mt-4">
            <h1 className="text-white text-lg font-bold leading-tight">{video.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Link
                to={`/channel/${channel.id}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: channel.color }}
                >
                  {channel.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{channel.name}</p>
                  <p className="text-[#aaa] text-xs">{channel.subscribers} subscribers</p>
                </div>
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-3 flex items-center gap-3 text-[#aaa] text-sm">
              <span>{video.views}</span>
              <span>·</span>
              <span>{video.publishedAt}</span>
              <span>·</span>
              <span>{video.duration}</span>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-3 p-3 bg-[#1f1f1f] rounded-xl">
                <p className="text-white text-sm leading-relaxed">{video.description}</p>
              </div>
            )}

            {/* KidTube badge */}
            <div className="mt-4 flex items-center gap-2 text-xs text-[#666] border border-[#272727] rounded-xl p-2">
              <span>🛡️</span>
              <span>This video has been approved by a parent. No comments or recommendations from YouTube are shown.</span>
            </div>
          </div>
        </div>

        {/* ── Sidebar: more from this channel ── */}
        {relatedVideos.length > 0 && (
          <aside className="lg:w-80 flex-shrink-0">
            <h3 className="text-white font-semibold text-sm mb-3">More from {channel.name}</h3>
            <div className="flex flex-col gap-3">
              {relatedVideos.map(rv => (
                <Link
                  key={rv.id}
                  to={`/watch/${rv.id}`}
                  className="flex gap-2 group hover:bg-[#1f1f1f] rounded-lg p-1 transition-colors"
                >
                  <div className="flex-shrink-0 w-32 relative">
                    <div className="thumb-ratio rounded-lg overflow-hidden bg-[#272727]">
                      <img
                        src={rv.thumbnail}
                        alt={rv.title}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = `https://picsum.photos/seed/fallback${rv.id}/320/180`; }}
                      />
                      <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-[10px] px-1 rounded font-mono">
                        {rv.duration}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium line-clamp-2 leading-snug">{rv.title}</p>
                    <p className="text-[#aaa] text-xs mt-1">{rv.views}</p>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
