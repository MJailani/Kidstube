import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { CHANNELS, VIDEOS, applyFilters } from '../../mockData.js';

function VideoCard({ video, channel, isBlocked, blockReason, onRequest, isRequested }) {
  const navigate = useNavigate();

  if (isBlocked) {
    return (
      <div className="group block opacity-60">
        {/* Blurred Thumbnail */}
        <div className="thumb-ratio rounded-xl overflow-hidden bg-[#272727] relative">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover blur-sm scale-105"
            onError={e => { e.target.src = `https://picsum.photos/seed/fallback${video.id}/480/270`; }}
          />
          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
            <Lock size={24} className="text-white mb-1" />
            <span className="text-white text-xs text-center px-2 leading-tight">{blockReason}</span>
          </div>
          <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded font-mono">
            {video.duration}
          </span>
        </div>
        {/* Meta + Ask Parent button */}
        <div className="flex gap-2 mt-2 items-start">
          <div
            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: channel?.color || '#555' }}
          >
            {channel?.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#888] text-sm font-medium line-clamp-2 leading-snug">{video.title}</p>
            <p className="text-[#666] text-xs mt-0.5">{channel?.name}</p>
            <button
              onClick={() => onRequest(video)}
              disabled={isRequested}
              className={`mt-1 flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                isRequested
                  ? 'bg-[#272727] text-[#666] cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
              }`}
            >
              <MessageCircle size={11} />
              {isRequested ? 'Request sent!' : 'Ask Parent to unlock'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/watch/${video.id}`} className="group block">
      <div className="thumb-ratio rounded-xl overflow-hidden bg-[#272727]">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={e => { e.target.src = `https://picsum.photos/seed/fallback${video.id}/480/270`; }}
        />
        <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded font-mono">
          {video.duration}
        </span>
      </div>
      <div className="flex gap-2 mt-2">
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: channel?.color || '#555' }}
        >
          {channel?.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{video.title}</p>
          <p className="text-[#aaa] text-xs mt-0.5">{video.views}</p>
          <p className="text-[#aaa] text-xs">{video.publishedAt}</p>
        </div>
      </div>
    </Link>
  );
}

export default function ChannelPage() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const channel = CHANNELS.find(c => c.id === channelId);

  // If channel not whitelisted, redirect home
  if (!channel || !state.whitelistedChannelIds.includes(channelId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-white text-lg font-bold mb-2">This channel isn't available</p>
        <p className="text-[#aaa] mb-4">Ask a parent to add it to your channel list.</p>
        <button onClick={() => navigate('/')} className="text-red-400 hover:text-red-300 flex items-center gap-1">
          <ArrowLeft size={16} /> Back to home
        </button>
      </div>
    );
  }

  const allChannelVideos = VIDEOS.filter(v => v.channelId === channelId);
  const { allowed, blocked } = applyFilters(allChannelVideos, state.filters);
  // Also filter out shorts completely
  const shortsCount = allChannelVideos.filter(v => v.isShort).length;

  function handleRequest(video) {
    dispatch({
      type: 'REQUEST_VIDEO',
      request: {
        videoId: video.id,
        title: video.title,
        channelId: video.channelId,
        channelName: channel.name,
        thumbnail: video.thumbnail,
      },
    });
  }

  const requestedIds = state.pendingRequests.map(r => r.videoId);
  const approvedIds = state.approvedVideoIds || [];

  // Move approved blocked videos to allowed
  const stillBlocked = blocked.filter(v => !approvedIds.includes(v.id));
  const approvedFromBlocked = blocked.filter(v => approvedIds.includes(v.id));
  const finalAllowed = [...allowed, ...approvedFromBlocked];

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-[#aaa] hover:text-white mb-4 text-sm"
      >
        <ArrowLeft size={16} /> All channels
      </button>

      {/* Channel Header */}
      <div className="relative mb-6">
        {/* Banner */}
        <div
          className="h-32 sm:h-40 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${channel.color}99, ${channel.color}33)` }}
        >
          <img
            src={channel.banner}
            alt=""
            className="w-full h-full object-cover opacity-30"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Channel info overlay */}
        <div className="flex items-end gap-4 mt-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ring-4 ring-[#0f0f0f]"
            style={{ backgroundColor: channel.color }}
          >
            {channel.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{channel.name}</h1>
            <p className="text-[#aaa] text-sm">{channel.handle} · {channel.subscribers} subscribers</p>
            {shortsCount > 0 && state.filters.blockShorts && (
              <span className="inline-block mt-1 text-xs bg-[#272727] text-[#aaa] px-2 py-0.5 rounded-full">
                {shortsCount} Short{shortsCount !== 1 ? 's' : ''} hidden
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Videos */}
      {finalAllowed.length === 0 && stillBlocked.length === 0 ? (
        <div className="text-center py-16 text-[#aaa]">
          <p className="text-lg">No videos available right now.</p>
          <p className="text-sm mt-1">Check back later!</p>
        </div>
      ) : (
        <>
          {/* Allowed videos */}
          {finalAllowed.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide text-[#aaa]">
                {finalAllowed.length} video{finalAllowed.length !== 1 ? 's' : ''}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {finalAllowed.map(v => (
                  <VideoCard key={v.id} video={v} channel={channel} isBlocked={false} />
                ))}
              </div>
            </div>
          )}

          {/* Blocked videos (not Shorts) */}
          {stillBlocked.length > 0 && (
            <div>
              <h2 className="text-[#666] font-semibold mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <Lock size={13} />
                {stillBlocked.length} video{stillBlocked.length !== 1 ? 's' : ''} not available
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stillBlocked.map(v => (
                  <VideoCard
                    key={v.id}
                    video={v}
                    channel={channel}
                    isBlocked={true}
                    blockReason={v.blockReason}
                    onRequest={handleRequest}
                    isRequested={requestedIds.includes(v.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
