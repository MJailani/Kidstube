import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { CHANNELS, VIDEOS, applyFilters } from '../../mockData.js';
import { Play } from 'lucide-react';

function ChannelCard({ channel }) {
  const { state } = useApp();
  const channelVideos = VIDEOS.filter(v => v.channelId === channel.id);
  const { allowed } = applyFilters(channelVideos, state.filters);
  const videoCount = allowed.length;

  return (
    <Link
      to={`/channel/${channel.id}`}
      className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-[#1f1f1f] transition-colors cursor-pointer"
    >
      {/* Channel Avatar */}
      <div className="relative">
        <img
          src={channel.thumbnail}
          alt={channel.name}
          className="w-24 h-24 rounded-full object-cover ring-4 ring-[#272727] group-hover:ring-red-500 transition-all"
          onError={e => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div
          className="w-24 h-24 rounded-full hidden items-center justify-center text-3xl font-bold text-white"
          style={{ backgroundColor: channel.color, display: 'none' }}
        >
          {channel.name.charAt(0)}
        </div>
        {/* Play overlay */}
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
          <Play size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
        </div>
      </div>

      {/* Channel Info */}
      <div className="text-center">
        <p className="text-white text-sm font-medium leading-tight line-clamp-2 max-w-[120px]">
          {channel.name}
        </p>
        <p className="text-[#aaa] text-xs mt-1">
          {videoCount} video{videoCount !== 1 ? 's' : ''}
        </p>
        <span
          className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: channel.color }}
        >
          {channel.category}
        </span>
      </div>
    </Link>
  );
}

export default function KidHome() {
  const { state } = useApp();
  const whitelisted = CHANNELS.filter(c => state.whitelistedChannelIds.includes(c.id));

  // Recent videos section — last 8 allowed videos across all channels
  const recentVideos = [];
  for (const ch of whitelisted) {
    const vids = VIDEOS.filter(v => v.channelId === ch.id);
    const { allowed } = applyFilters(vids, state.filters);
    recentVideos.push(...allowed);
  }
  recentVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const featuredVideos = recentVideos.slice(0, 8);

  if (whitelisted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">📺</div>
        <h2 className="text-xl font-bold text-white mb-2">No channels yet!</h2>
        <p className="text-[#aaa] max-w-sm">
          Ask a parent to add some channels so you can start watching great videos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* ── Channels Section ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-red-500 rounded-full inline-block"></span>
          Your Channels
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {whitelisted.map(ch => (
            <ChannelCard key={ch.id} channel={ch} />
          ))}
        </div>
      </section>

      {/* ── Recent Videos Section ── */}
      {featuredVideos.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-500 rounded-full inline-block"></span>
            Recent Videos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredVideos.map(video => {
              const channel = CHANNELS.find(c => c.id === video.channelId);
              return (
                <VideoCard key={video.id} video={video} channel={channel} />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function VideoCard({ video, channel }) {
  return (
    <Link to={`/watch/${video.id}`} className="group block">
      {/* Thumbnail */}
      <div className="thumb-ratio rounded-xl overflow-hidden bg-[#272727]">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={e => { e.target.src = `https://picsum.photos/seed/fallback${video.id}/480/270`; }}
        />
        {/* Duration badge */}
        <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded font-mono">
          {video.duration}
        </span>
      </div>
      {/* Meta */}
      <div className="flex gap-2 mt-2">
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: channel?.color || '#555' }}
        >
          {channel?.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{video.title}</p>
          <p className="text-[#aaa] text-xs mt-0.5">{channel?.name}</p>
          <p className="text-[#aaa] text-xs">{video.views}</p>
        </div>
      </div>
    </Link>
  );
}
