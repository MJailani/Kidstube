import React, { useState } from 'react';
import { CheckCircle, Circle, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { CHANNELS, VIDEOS, applyFilters } from '../../mockData.js';

export default function ChannelManager() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');

  const filtered = CHANNELS.filter(ch =>
    ch.name.toLowerCase().includes(search.toLowerCase()) ||
    ch.category.toLowerCase().includes(search.toLowerCase())
  );

  function toggleChannel(channelId) {
    dispatch({ type: 'TOGGLE_CHANNEL', channelId });
  }

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">Channel Whitelist</h2>
      <p className="text-[#6b7280] text-sm mb-4">
        Only channels you enable here will be visible to your kids.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
        <input
          type="text"
          placeholder="Search channels..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#1f2937] border border-[#374151] text-white placeholder-[#6b7280] pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Summary */}
      <p className="text-[#6b7280] text-xs mb-3">
        {state.whitelistedChannelIds.length} of {CHANNELS.length} channels enabled
      </p>

      {/* Channel List */}
      <div className="flex flex-col gap-2">
        {filtered.map(ch => {
          const isEnabled = state.whitelistedChannelIds.includes(ch.id);
          const vids = VIDEOS.filter(v => v.channelId === ch.id);
          const { allowed } = applyFilters(vids, state.filters);
          const total = vids.length;
          const blocked = total - allowed.length - vids.filter(v => v.isShort).length;

          return (
            <div
              key={ch.id}
              onClick={() => toggleChannel(ch.id)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                isEnabled
                  ? 'bg-[#1f2937] border-blue-700 hover:border-blue-500'
                  : 'bg-[#111827] border-[#374151] hover:border-[#4b5563] opacity-60'
              }`}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: ch.color }}
              >
                {ch.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{ch.name}</p>
                <p className="text-[#6b7280] text-xs">{ch.subscribers} subscribers · {ch.category}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-green-400 text-xs">{allowed.length} available</span>
                  {blocked > 0 && <span className="text-orange-400 text-xs">{blocked} filtered</span>}
                  {vids.filter(v => v.isShort).length > 0 && (
                    <span className="text-[#6b7280] text-xs">
                      {vids.filter(v => v.isShort).length} Shorts hidden
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle */}
              <div className={`flex-shrink-0 ${isEnabled ? 'text-blue-400' : 'text-[#4b5563]'}`}>
                {isEnabled ? <CheckCircle size={22} /> : <Circle size={22} />}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[#6b7280]">
          <p>No channels match your search.</p>
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-[#1e3a5f] border border-blue-800 rounded-xl p-4 text-sm text-blue-300">
        <p className="font-semibold mb-1">Adding more channels</p>
        <p className="text-blue-400 text-xs leading-relaxed">
          This demo includes 6 built-in educational channels. When connected to the YouTube Data API,
          you'll be able to add any channel by pasting its URL or handle — and all new videos from
          that channel will be automatically fetched and filtered.
        </p>
      </div>
    </div>
  );
}
