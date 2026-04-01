import { useApp } from '../../context/AppContext';
import { getAllChannels, filterVideos } from '../../api';
import { Link, navigate } from '../../router';
import VCard from '../../components/VCard';
import Spinner from '../../components/Spinner';
import LoadingGrid from '../../components/LoadingGrid';

export default function KidHome() {
  const { s } = useApp();
  const allChs = getAllChannels(s);
  const wl = allChs.filter(c => s.wl.includes(c.id));
  const globalLoading = wl.some(ch => s.loading[ch.id] === 'loading');
  const allLoaded = wl.every(ch => s.loading[ch.id] === 'ok' || s.loading[ch.id] === 'err');
  const pinned = s.pinned || [];
  const recent = wl
    .flatMap(ch => filterVideos(s.videos[ch.id] || [], s.filters).allowed)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  if (!wl.length && !pinned.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">📺</div>
        <h2 className="text-xl font-bold mb-2">No channels yet!</h2>
        <p className="text-[#aaa]">Ask a parent to add some channels.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {wl.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-500 rounded-full inline-block" />Your Channels
            {globalLoading && <Spinner size={16} />}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {wl.map(ch => {
              const vids = s.videos[ch.id] || [];
              const { allowed } = filterVideos(vids, s.filters);
              const isLoading = s.loading[ch.id] === 'loading';
              const hasErr = s.loading[ch.id] === 'err';
              return (
                <Link key={ch.id} to={`/channel/${ch.id}`}
                  className="group flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-[#1f1f1f] transition-colors cursor-pointer">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#272727] group-hover:ring-red-500 transition-all flex items-center justify-center text-white text-3xl font-bold" style={{ background: ch.color }}>
                      {ch.thumb
                        ? <img src={ch.thumb} alt={ch.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                        : ch.name[0]}
                    </div>
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-white text-xs font-medium clamp2 max-w-[120px]">{ch.name}</p>
                    <p className="text-[#aaa] text-xs mt-0.5">
                      {isLoading ? 'Loading…' : hasErr ? 'Error' : `${allowed.length} videos`}
                    </p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: ch.color }}>{ch.category}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {pinned.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-yellow-400 rounded-full inline-block" />Parent's Picks
            <span className="text-xs text-yellow-400 font-normal">★ hand-picked for you</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pinned.map(v => <VCard key={v.id} v={v} />)}
          </div>
        </section>
      )}

      {!allLoaded && recent.length === 0 && pinned.length === 0 && <LoadingGrid label="Loading your channels…" />}
      {allLoaded && recent.length === 0 && pinned.length === 0 && (
        <div className="text-center py-16 text-[#aaa]">
          <p className="text-white font-semibold mb-2">No videos available</p>
          <p className="text-sm">Try adjusting filters in Parent Controls.</p>
        </div>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-500 rounded-full inline-block" />Recent Videos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recent.map(v => <VCard key={v.id} v={v} />)}
          </div>
        </section>
      )}
    </div>
  );
}
