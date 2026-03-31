import React from 'react';
import { Link } from 'react-router-dom';
import { Tv, ShieldCheck, Clock, MessageCircle, ChevronRight, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { CHANNELS, VIDEOS, applyFilters } from '../../mockData.js';

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className={`bg-[#1f2937] rounded-xl p-4 flex items-center gap-3 ${to ? 'hover:bg-[#374151] transition-colors cursor-pointer' : ''}`}>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-[#9ca3af] text-xs">{label}</p>
        <p className="text-white text-xl font-bold">{value}</p>
      </div>
      {to && <ChevronRight size={16} className="text-[#6b7280] ml-auto" />}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : <div>{content}</div>;
}

function RecentWatchItem({ entry }) {
  const channel = CHANNELS.find(c => c.id === entry.channelId);
  const date = new Date(entry.watchedAt);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#374151] last:border-0">
      <img
        src={entry.thumbnail}
        alt={entry.title}
        className="w-16 h-9 rounded-lg object-cover bg-[#374151] flex-shrink-0"
        onError={e => { e.target.src = `https://picsum.photos/seed/hist${entry.videoId}/64/36`; }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium line-clamp-1">{entry.title}</p>
        <p className="text-[#6b7280] text-xs">{entry.channelName}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[#9ca3af] text-xs">{timeStr}</p>
        <p className="text-[#6b7280] text-xs">{dateStr}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state } = useApp();

  const whitelisted = CHANNELS.filter(c => state.whitelistedChannelIds.includes(c.id));

  // Count available videos
  let totalAllowed = 0;
  let totalBlocked = 0;
  let totalHiddenShorts = 0;
  for (const ch of whitelisted) {
    const vids = VIDEOS.filter(v => v.channelId === ch.id);
    const shorts = vids.filter(v => v.isShort);
    totalHiddenShorts += shorts.length;
    const nonShorts = vids.filter(v => !v.isShort);
    const { allowed, blocked } = applyFilters(nonShorts, { ...state.filters, blockShorts: false });
    totalAllowed += allowed.length;
    totalBlocked += blocked.length;
  }

  const recentHistory = state.watchHistory.slice(0, 5);

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">Overview</h2>
      <p className="text-[#6b7280] text-sm mb-6">Here's what's happening with your family's viewing.</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={Tv}
          label="Whitelisted Channels"
          value={whitelisted.length}
          color="bg-blue-600"
          to="/parent/channels"
        />
        <StatCard
          icon={CheckCircle}
          label="Available Videos"
          value={totalAllowed}
          color="bg-green-600"
          to="/parent/channels"
        />
        <StatCard
          icon={ShieldCheck}
          label="Videos Blocked"
          value={totalBlocked + totalHiddenShorts}
          color="bg-orange-500"
          to="/parent/filters"
        />
        <StatCard
          icon={MessageCircle}
          label="Pending Requests"
          value={state.pendingRequests.length}
          color="bg-red-500"
          to="/parent/requests"
        />
      </div>

      {/* Active filters summary */}
      <div className="bg-[#1f2937] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Active Filters</h3>
          <Link to="/parent/filters" className="text-blue-400 text-xs hover:text-blue-300">Edit →</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {state.filters.blockShorts && (
            <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck size={10} /> Shorts blocked
            </span>
          )}
          <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">
            Min {state.filters.minDurationSeconds}s duration
          </span>
          {state.filters.blockedKeywords.map(kw => (
            <span key={kw} className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded-full">
              "{kw}" blocked
            </span>
          ))}
          {state.filters.blockedKeywords.length === 0 && (
            <span className="text-[#6b7280] text-xs">No keyword filters</span>
          )}
        </div>
      </div>

      {/* Recent watch history */}
      <div className="bg-[#1f2937] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Clock size={15} className="text-[#6b7280]" />
            Recently Watched
          </h3>
          <Link to="/parent/history" className="text-blue-400 text-xs hover:text-blue-300">View all →</Link>
        </div>
        {recentHistory.length === 0 ? (
          <p className="text-[#6b7280] text-sm text-center py-4">No watch history yet.</p>
        ) : (
          recentHistory.map((entry, i) => <RecentWatchItem key={i} entry={entry} />)
        )}
      </div>
    </div>
  );
}
