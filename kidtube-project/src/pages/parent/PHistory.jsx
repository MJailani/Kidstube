import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IcClock, IcTrash } from '../../icons';

export default function PHistory() {
  const { s, d } = useApp();
  const [conf, setConf] = useState(false);
  const grouped = {};
  for (const e of s.history) {
    const dt = new Date(e.at).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    grouped[dt] = grouped[dt] || [];
    grouped[dt].push(e);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white text-xl font-bold">Watch History</h2>
        {s.history.length > 0 && (
          <button
            onClick={() => conf ? (d({ t: 'CLR_HIST' }), setConf(false)) : setConf(true)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${conf ? 'bg-red-600 text-white' : 'text-[#9ca3af] hover:text-red-400 hover:bg-[#374151]'}`}>
            <IcTrash size={13} />{conf ? 'Click again to confirm' : 'Clear all'}
          </button>
        )}
      </div>
      <p className="text-[#6b7280] text-sm mb-5">Everything your kids have watched.</p>

      {!s.history.length
        ? (
          <div className="text-center py-16 text-[#6b7280]">
            <IcClock size={40} cls="mx-auto mb-3 opacity-40" />
            <p className="text-white font-medium">No history yet</p>
          </div>
        )
        : Object.entries(grouped).map(([date, entries]) => (
          <div key={date} className="mb-5">
            <h3 className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <IcClock size={11} />{date}
            </h3>
            <div className="bg-[#1f2937] rounded-xl overflow-hidden divide-y divide-[#374151]">
              {entries.map((e, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-[#374151] transition-colors">
                  <img src={e.thumb} alt="" className="w-20 h-11 rounded-lg object-cover bg-[#374151] flex-shrink-0"
                    onError={ev => ev.target.style.display = 'none'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium clamp1">{e.title}</p>
                    <p className="text-[#6b7280] text-xs">{e.chName} · {e.dur}</p>
                  </div>
                  <span className="text-[#6b7280] text-xs flex-shrink-0">
                    {new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
