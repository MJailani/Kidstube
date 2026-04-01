import { useApp } from '../../context/AppContext';
import { getAllChannels, filterVideos } from '../../api';
import { navigate } from '../../router';
import { IcClock } from '../../icons';

export default function PDash() {
  const { s } = useApp();
  const wl = getAllChannels(s).filter(c => s.wl.includes(c.id));
  let ok = 0, bl = 0, sh = 0;
  for (const ch of wl) {
    const vs = s.videos[ch.id] || [];
    sh += vs.filter(v => v.short).length;
    const { allowed, blocked } = filterVideos(vs.filter(v => !v.short), { ...s.filters, blockShorts: false });
    ok += allowed.length;
    bl += blocked.length;
  }
  const stats = [
    { l: 'Whitelisted Channels', v: wl.length,          bg: 'bg-blue-600',   to: '/parent/channels' },
    { l: 'Available Videos',     v: ok,                  bg: 'bg-green-600',  to: '/parent/channels' },
    { l: 'Videos Filtered',      v: bl + sh,             bg: 'bg-orange-500', to: '/parent/filters' },
    { l: 'Pending Requests',     v: s.requests.length,   bg: 'bg-red-500',    to: '/parent/requests' },
  ];

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">Overview</h2>
      <p className="text-[#6b7280] text-sm mb-5">Your family's viewing at a glance.</p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {stats.map(st => (
          <button key={st.l} onClick={() => navigate(st.to)}
            className="flex items-center gap-3 p-3 bg-[#1f2937] hover:bg-[#374151] rounded-xl text-left w-full transition-colors">
            <div className={`w-10 h-10 rounded-lg ${st.bg} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-lg font-bold">{st.v}</span>
            </div>
            <p className="text-[#9ca3af] text-xs leading-tight">{st.l}</p>
          </button>
        ))}
      </div>

      <div className="bg-[#1f2937] rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Active Filters</h3>
          <button onClick={() => navigate('/parent/filters')} className="text-blue-400 text-xs hover:text-blue-300">Edit →</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.filters.blockShorts && <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full">🛡️ Shorts blocked</span>}
          <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">Min {s.filters.minSecs}s</span>
          {s.filters.keywords.map(k => <span key={k} className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded-full">"{k}"</span>)}
        </div>
      </div>

      <div className="bg-[#1f2937] rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <IcClock size={14} cls="text-[#6b7280]" />Recently Watched
          </h3>
          <button onClick={() => navigate('/parent/history')} className="text-blue-400 text-xs hover:text-blue-300">View all →</button>
        </div>
        {!s.history.length
          ? <p className="text-[#6b7280] text-sm text-center py-4">No watch history yet.</p>
          : s.history.slice(0, 5).map((e, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[#374151] last:border-0">
              <img src={e.thumb} alt="" className="w-16 h-9 rounded-lg object-cover bg-[#374151] flex-shrink-0"
                onError={ev => ev.target.style.display = 'none'} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium clamp1">{e.title}</p>
                <p className="text-[#6b7280] text-xs">{e.chName}</p>
              </div>
              <span className="text-[#6b7280] text-xs flex-shrink-0">
                {new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
