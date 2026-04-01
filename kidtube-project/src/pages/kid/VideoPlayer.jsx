import { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllChannels, filterVideos } from '../../api';
import { Link, navigate } from '../../router';
import LoadingGrid from '../../components/LoadingGrid';
import { IcLeft, IcLock } from '../../icons';

export default function VideoPlayer({ vidId }) {
  const { s, d } = useApp();
  const allVids = [...Object.values(s.videos).flat(), ...(s.pinned || [])];
  const v = allVids.find(x => x.id === vidId);
  const allChs = getAllChannels(s);
  const ch = v ? allChs.find(c => c.id === v.ch) : null;
  const chOk = v && (s.wl.includes(v.ch) || v.pinned);
  const isApproved = s.approved.includes(vidId);
  const logged = useRef(false);

  function isAllowed(v) {
    if (!v) return false;
    if (v.pinned || isApproved) return true;
    if (v.short && s.filters.blockShorts) return false;
    if (v.secs > 0 && v.secs < s.filters.minSecs) return false;
    const hay = (v.title + ' ' + v.desc).toLowerCase();
    return !s.filters.keywords.some(k => hay.includes(k.toLowerCase()));
  }

  const ok = isAllowed(v);

  useEffect(() => {
    if (v && chOk && ok && !logged.current) {
      logged.current = true;
      d({ t: 'LOG', e: { id: v.id, title: v.title, ch: v.ch, chName: ch?.name || v.chName || '', thumb: v.thumb, dur: v.dur } });
    }
  }, [vidId]);

  if (!v && Object.values(s.loading).some(l => l === 'loading')) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingGrid label="Loading video…" /></div>;
  }
  if (!v) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <button onClick={() => navigate('/')} className="text-red-400 flex items-center gap-1"><IcLeft size={16} />Home</button>
      </div>
    );
  }
  if (!chOk || !ok) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <IcLock size={48} cls="text-[#aaa] mb-4" />
        <p className="text-white text-lg font-bold mb-2">
          {v.short && s.filters.blockShorts ? 'Shorts are hidden' : 'Video not available'}
        </p>
        <p className="text-[#aaa] max-w-xs mb-4">
          {v.short && s.filters.blockShorts ? 'A parent has turned off Shorts.' : 'This video is restricted.'}
        </p>
        <button onClick={() => window.history.back()} className="text-red-400 flex items-center gap-1">
          <IcLeft size={16} />Go back
        </button>
      </div>
    );
  }

  const related = filterVideos((s.videos[v.ch] || []).filter(x => x.id !== v.id), s.filters).allowed.slice(0, 6);
  const params = `autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => v.ch ? navigate(`/channel/${v.ch}`) : navigate('/')}
            className="flex items-center gap-1 text-[#aaa] hover:text-white mb-3 text-sm"
          >
            <IcLeft size={16} />Back{ch ? ` to ${ch.name}` : ''}
          </button>

          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${v.yt}?${params}`}
              title={v.title}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          <div className="mt-4">
            <h1 className="text-white text-lg font-bold leading-tight">{v.title}</h1>
            {v.pinned && (
              <span className="inline-block mt-1 text-xs bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded-full">★ Parent's Pick</span>
            )}
            <div className="flex items-center gap-3 mt-2">
              <Link to={ch ? `/channel/${ch.id}` : ''} className="flex items-center gap-2 hover:opacity-80">
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: ch?.color || '#555', fontSize: 14 }}>
                  {ch?.thumb
                    ? <img src={ch.thumb} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    : (ch?.name[0] || '?')}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{ch?.name || v.chName}</p>
                  {ch && <p className="text-[#aaa] text-xs">{ch.subscribers} subscribers</p>}
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3 mt-3 text-[#aaa] text-sm">
              <span>{v.views}</span><span>·</span><span>{v.date}</span><span>·</span><span>{v.dur}</span>
            </div>
            {v.desc && (
              <div className="mt-3 p-3 bg-[#1f1f1f] rounded-xl text-white text-sm leading-relaxed whitespace-pre-line">{v.desc}</div>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-[#666] border border-[#272727] rounded-xl p-2">
              🛡️ <span>Approved by a parent. No comments or algorithm recommendations shown.</span>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <aside className="lg:w-80 flex-shrink-0">
            <h3 className="text-white font-semibold text-sm mb-3">More from {ch?.name}</h3>
            <div className="flex flex-col gap-3">
              {related.map(rv => (
                <Link key={rv.id} to={`/watch/${rv.id}`} className="flex gap-2 hover:bg-[#1f1f1f] rounded-lg p-1 transition-colors">
                  <div className="flex-shrink-0 w-32">
                    <div className="thumb rounded-lg">
                      <img src={rv.thumb} alt={rv.title} onError={e => { e.target.onerror = null; e.target.src = `https://i.ytimg.com/vi/${rv.yt}/mqdefault.jpg`; }} />
                      <span className="dur">{rv.dur}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium clamp2 leading-snug">{rv.title}</p>
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
