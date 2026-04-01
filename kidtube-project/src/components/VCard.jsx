import { Link } from '../router';
import { useApp } from '../context/AppContext';
import { getAllChannels } from '../api';

export default function VCard({ v, showCh = true }) {
  const { s } = useApp();
  const ch = getAllChannels(s).find((channel) => channel.id === v.ch);
  const isPinned = v.pinned;

  return (
    <Link to={`/watch/${v.id}`} className="block group">
      <div className="thumb">
        <img
          src={v.thumb}
          alt={v.title}
          onError={(event) => { event.target.onerror = null; event.target.src = `https://i.ytimg.com/vi/${v.yt}/mqdefault.jpg`; }}
        />
        <span className="dur">{v.dur}</span>
        {isPinned && <span className="absolute top-2 left-2 bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">Pick</span>}
      </div>
      <div className="flex gap-3 mt-3 rounded-2xl p-2 -mx-2 group-hover:bg-[#1a1a1a] transition-colors">
        {ch && (
          <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-hidden mt-0.5" style={{ background: ch.color, fontSize: 14 }}>
            {ch.thumb
              ? <img src={ch.thumb} alt="" className="w-full h-full object-cover" onError={(event) => { event.target.style.display = 'none'; }} />
              : ch.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium clamp2 leading-snug">{v.title}</p>
          {showCh && <p className="text-[#aaa] text-xs mt-0.5">{ch?.name || v.chName}</p>}
          <p className="text-[#aaa] text-xs mt-0.5">{v.views}</p>
          <p className="text-[#666] text-[11px] mt-0.5">{v.date}</p>
        </div>
      </div>
    </Link>
  );
}
