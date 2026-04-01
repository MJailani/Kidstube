import { useApp } from '../../context/AppContext';
import { getAllChannels } from '../../api';
import { splitVideosByAccess } from '../../access';
import { Link } from '../../router';
import VCard from '../../components/VCard';
import Spinner from '../../components/Spinner';
import LoadingGrid from '../../components/LoadingGrid';

export default function KidHome() {
  const { s } = useApp();
  const allChannels = getAllChannels(s);
  const whitelistedChannels = allChannels.filter((channel) => s.wl.includes(channel.id));
  const globalLoading = whitelistedChannels.some((channel) => s.loading[channel.id] === 'loading');
  const allLoaded = whitelistedChannels.every((channel) => s.loading[channel.id] === 'ok' || s.loading[channel.id] === 'err');
  const pinned = s.pinned || [];
  const recent = whitelistedChannels
    .flatMap((channel) => splitVideosByAccess(s.videos[channel.id] || [], s).allowed)
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 8);

  if (!whitelistedChannels.length && !pinned.length) {
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
      {whitelistedChannels.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-500 rounded-full inline-block" />Your Channels
            {globalLoading && <Spinner size={16} />}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {whitelistedChannels.map((channel) => {
              const videos = s.videos[channel.id] || [];
              const { allowed } = splitVideosByAccess(videos, s);
              const isLoading = s.loading[channel.id] === 'loading';
              const hasError = s.loading[channel.id] === 'err';

              return (
                <Link
                  key={channel.id}
                  to={`/channel/${channel.id}`}
                  className="group flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#272727] group-hover:ring-red-500 transition-all flex items-center justify-center text-white text-3xl font-bold" style={{ background: channel.color }}>
                      {channel.thumb ? (
                        <img src={channel.thumb} alt={channel.name} className="w-full h-full object-cover" onError={(event) => { event.target.style.display = 'none'; }} />
                      ) : channel.name[0]}
                    </div>
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-white text-xs font-medium clamp2 max-w-[120px]">{channel.name}</p>
                    <p className="text-[#aaa] text-xs mt-0.5">
                      {isLoading ? 'Loading...' : hasError ? 'Error' : `${allowed.length} videos`}
                    </p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: channel.color }}>
                      {channel.category}
                    </span>
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
            {pinned.map((video) => <VCard key={video.id} v={video} />)}
          </div>
        </section>
      )}

      {!allLoaded && recent.length === 0 && pinned.length === 0 && (
        <LoadingGrid label="Loading your channels..." />
      )}

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
            {recent.map((video) => <VCard key={video.id} v={video} />)}
          </div>
        </section>
      )}
    </div>
  );
}
