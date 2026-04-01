import { useApp } from '../../context/AppContext';
import { getAllChannels } from '../../api';
import { splitVideosByAccess } from '../../access';
import { navigate } from '../../router';
import { IcClock } from '../../icons';

export default function PDash() {
  const { s, activeProfile, hasSupabaseAuth } = useApp();
  const whitelistedChannels = getAllChannels(s).filter((channel) => s.wl.includes(channel.id));

  let availableCount = 0;
  let blockedCount = 0;
  let hiddenShortsCount = 0;

  whitelistedChannels.forEach((channel) => {
    const videos = s.videos[channel.id] || [];
    const { allowed, blocked, hiddenShorts } = splitVideosByAccess(videos, s);
    availableCount += allowed.length;
    blockedCount += blocked.length;
    hiddenShortsCount += hiddenShorts.length;
  });

  const stats = [
    { label: 'Whitelisted Channels', value: whitelistedChannels.length, bg: 'bg-blue-600', to: '/parent/channels' },
    { label: 'Available Videos', value: availableCount, bg: 'bg-green-600', to: '/parent/channels' },
    { label: 'Videos Filtered', value: blockedCount + hiddenShortsCount, bg: 'bg-orange-500', to: '/parent/filters' },
    { label: 'Pending Requests', value: s.requests.length, bg: 'bg-red-500', to: '/parent/requests' },
  ];

  const recentHistory = s.history.slice(0, 5);

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">Overview</h2>
      <p className="text-[#6b7280] text-sm mb-5">Your family's viewing at a glance.</p>

      {hasSupabaseAuth && activeProfile && (
        <div className="bg-[#1f2937] rounded-xl p-4 mb-4">
          <p className="text-[#6b7280] text-xs uppercase tracking-[0.18em] mb-1">Active Child Profile</p>
          <p className="text-white font-semibold">{activeProfile.name}</p>
          <p className="text-[#9ca3af] text-sm mt-1">
            Filters, channels, approvals, parent picks, requests, and watch history now load from Supabase for this profile.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.to)}
            className="flex items-center gap-3 p-3 bg-[#1f2937] hover:bg-[#374151] rounded-xl text-left w-full transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-lg font-bold">{stat.value}</span>
            </div>
            <p className="text-[#9ca3af] text-xs leading-tight">{stat.label}</p>
          </button>
        ))}
      </div>

      <div className="bg-[#1f2937] rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Active Filters</h3>
          <button
            onClick={() => navigate('/parent/filters')}
            className="text-blue-400 text-xs hover:text-blue-300"
          >
            Edit
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.filters.blockShorts && (
            <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full">
              Shorts blocked
            </span>
          )}
          <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">
            Min {s.filters.minSecs}s
          </span>
          {s.filters.keywords.map((keyword) => (
            <span key={keyword} className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded-full">
              "{keyword}"
            </span>
          ))}
        </div>
      </div>

      <div className="bg-[#1f2937] rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <IcClock size={14} cls="text-[#6b7280]" />
            Recently Watched
          </h3>
          <button
            onClick={() => navigate('/parent/history')}
            className="text-blue-400 text-xs hover:text-blue-300"
          >
            View all
          </button>
        </div>

        {recentHistory.length === 0 ? (
          <p className="text-[#6b7280] text-sm text-center py-4">No watch history yet.</p>
        ) : (
          recentHistory.map((entry, index) => (
            <div key={index} className="flex items-center gap-3 py-2 border-b border-[#374151] last:border-0">
              <img
                src={entry.thumb}
                alt=""
                className="w-16 h-9 rounded-lg object-cover bg-[#374151] flex-shrink-0"
                onError={(event) => {
                  event.target.style.display = 'none';
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium clamp1">{entry.title}</p>
                <p className="text-[#6b7280] text-xs">{entry.chName}</p>
              </div>
              <span className="text-[#6b7280] text-xs flex-shrink-0">
                {new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
