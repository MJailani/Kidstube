import React, { useState } from 'react';
import { Clock, Trash2, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { CHANNELS } from '../../mockData.js';

export default function WatchHistory() {
  const { state, dispatch } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);

  const history = state.watchHistory;

  // Group by date
  const grouped = {};
  for (const entry of history) {
    const date = new Date(entry.watchedAt).toLocaleDateString([], {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(entry);
  }

  function clearHistory() {
    if (confirmClear) {
      dispatch({ type: 'CLEAR_HISTORY' });
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white text-xl font-bold">Watch History</h2>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
              confirmClear
                ? 'bg-red-600 text-white'
                : 'text-[#9ca3af] hover:text-red-400 hover:bg-[#374151]'
            }`}
          >
            <Trash2 size={13} />
            {confirmClear ? 'Click again to confirm' : 'Clear all'}
          </button>
        )}
      </div>
      <p className="text-[#6b7280] text-sm mb-6">
        Everything your kids have watched, ordered by most recent.
      </p>

      {history.length === 0 ? (
        <div className="text-center py-16 text-[#6b7280]">
          <Clock size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-white">No watch history yet</p>
          <p className="text-sm mt-1">Videos your kids watch will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <h3 className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock size={12} />
                {date}
              </h3>
              <div className="bg-[#1f2937] rounded-xl overflow-hidden divide-y divide-[#374151]">
                {entries.map((entry, i) => {
                  const channel = CHANNELS.find(c => c.id === entry.channelId);
                  const time = new Date(entry.watchedAt).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit',
                  });
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-[#374151] transition-colors">
                      <img
                        src={entry.thumbnail}
                        alt={entry.title}
                        className="w-20 h-11 rounded-lg object-cover bg-[#374151] flex-shrink-0"
                        onError={e => { e.target.src = `https://picsum.photos/seed/h${entry.videoId}/80/45`; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium line-clamp-1">{entry.title}</p>
                        <p className="text-[#6b7280] text-xs">{entry.channelName}</p>
                        {entry.duration && (
                          <p className="text-[#4b5563] text-xs">{entry.duration}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[#6b7280] text-xs">{time}</span>
                        <a
                          href={`https://youtube.com/watch?v=${entry.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4b5563] hover:text-blue-400 transition-colors"
                          title="Open in YouTube"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
