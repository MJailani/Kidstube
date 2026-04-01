import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllChannels } from '../../api';
import { splitVideosByAccess } from '../../access';
import { Link } from '../../router';
import VCard from '../../components/VCard';
import Spinner from '../../components/Spinner';
import LoadingGrid from '../../components/LoadingGrid';

function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function parseViews(label) {
  if (!label) return 0;
  const match = String(label).match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return 0;

  switch ((match[2] || '').toUpperCase()) {
    case 'B': return value * 1e9;
    case 'M': return value * 1e6;
    case 'K': return value * 1e3;
    default: return value;
  }
}

function uniqueVideos(videos) {
  const seen = new Set();
  return videos.filter((video) => {
    if (!video || seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  });
}

function HomeShelf({ title, subtitle, videos, accent = 'bg-red-500', sectionId }) {
  if (!videos.length) return null;

  return (
    <section id={sectionId} className="mb-10 scroll-mt-24">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className={`w-1 h-5 rounded-full inline-block ${accent}`} />
            {title}
          </h2>
          {subtitle && <p className="text-[#9a9a9a] text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="feed-shelf">
        {videos.map((video) => (
          <div key={video.id} className="feed-shelf-item">
            <VCard v={video} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ChannelShortcut({ channel, count, loadingState }) {
  const isLoading = loadingState === 'loading';
  const hasError = loadingState === 'err';

  return (
    <Link
      to={`/channel/${channel.id}`}
      className="group relative overflow-hidden rounded-3xl border border-[#272727] bg-[#181818] p-4 hover:border-[#3a3a3a] hover:bg-[#202020] transition-all"
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{ background: `radial-gradient(circle at top right, ${channel.color}44, transparent 55%)` }}
      />
      <div className="relative flex items-center gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden ring-4 ring-[#101010] flex items-center justify-center text-white text-xl font-bold" style={{ background: channel.color }}>
          {channel.thumb ? (
            <img src={channel.thumb} alt={channel.name} className="w-full h-full object-cover" onError={(event) => { event.target.style.display = 'none'; }} />
          ) : channel.name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold clamp1">{channel.name}</p>
          <p className="text-[#a8a8a8] text-xs mt-1">
            {isLoading ? 'Loading videos...' : hasError ? 'Could not load right now' : `${count} ready to watch`}
          </p>
          <span className="inline-flex mt-2 text-[10px] uppercase tracking-[0.18em] text-white/90 rounded-full px-2.5 py-1" style={{ background: `${channel.color}cc` }}>
            {channel.category}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function KidHome() {
  const { s } = useApp();
  const allChannels = getAllChannels(s);
  const whitelistedChannels = allChannels.filter((channel) => s.wl.includes(channel.id));
  const globalLoading = whitelistedChannels.some((channel) => s.loading[channel.id] === 'loading');
  const allLoaded = whitelistedChannels.every((channel) => s.loading[channel.id] === 'ok' || s.loading[channel.id] === 'err');
  const pinned = s.pinned || [];

  const channelRows = useMemo(() => (
    whitelistedChannels.map((channel) => {
      const videos = s.videos[channel.id] || [];
      const allowed = splitVideosByAccess(videos, s).allowed;
      return {
        channel,
        loadingState: s.loading[channel.id],
        allowed,
        featured: allowed[0] || null,
      };
    })
  ), [s, whitelistedChannels]);

  const allAllowed = useMemo(() => uniqueVideos(channelRows.flatMap((entry) => entry.allowed)), [channelRows]);

  const recent = useMemo(() => (
    [...allAllowed].sort((left, right) => new Date(right.date) - new Date(left.date))
  ), [allAllowed]);

  const popular = useMemo(() => (
    [...allAllowed].sort((left, right) => parseViews(right.views) - parseViews(left.views))
  ), [allAllowed]);

  const longerVideos = useMemo(() => (
    allAllowed
      .filter((video) => video.secs >= 8 * 60)
      .sort((left, right) => right.secs - left.secs)
  ), [allAllowed]);

  const featured = pinned[0] || popular[0] || recent[0] || null;
  const queue = uniqueVideos([
    ...pinned,
    ...recent,
    ...popular,
    ...channelRows.map((entry) => entry.featured),
  ]).filter((video) => video.id !== featured?.id).slice(0, 4);

  const chips = [
    { label: 'All', value: allAllowed.length, targetId: 'browse-channels' },
    { label: 'Parent Picks', value: pinned.length, targetId: 'parents-picks' },
    { label: 'Fresh', value: recent.slice(0, 12).length, targetId: 'fresh-uploads' },
    { label: 'Popular', value: popular.slice(0, 12).length, targetId: 'popular-right-now' },
    { label: 'Longer Videos', value: longerVideos.length, targetId: 'longer-watch-time' },
    ...whitelistedChannels.slice(0, 4).map((channel) => ({
      label: channel.category,
      value: channelRows.find((entry) => entry.channel.id === channel.id)?.allowed.length || 0,
      targetId: `channel-shelf-${channel.id}`,
    })),
  ];

  if (!whitelistedChannels.length && !pinned.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">TV</div>
        <h2 className="text-xl font-bold mb-2">No channels yet!</h2>
        <p className="text-[#aaa]">Ask a parent to add some channels.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <section className="mb-6 rounded-[28px] border border-[#252525] bg-[#161616] overflow-hidden">
        <div className="grid lg:grid-cols-[1.4fr_0.9fr]">
          {featured ? (
            <Link to={`/watch/${featured.id}`} className="relative block p-6 md:p-8 min-h-[320px] group">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${featured.pinned ? '#facc15' : '#ff2d55'}22 0%, #0f0f0f 58%, #0f0f0f 100%)` }} />
              <img src={featured.thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 transition-transform duration-500 group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,15,0.08),rgba(15,15,15,0.92))]" />
              <div className="relative max-w-2xl h-full flex flex-col justify-end">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    Home
                  </span>
                  <span className="inline-flex rounded-full bg-[#121212]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white border border-white/10">
                    {featured.pinned ? 'Featured Parent Pick' : 'Featured Video'}
                  </span>
                  {globalLoading && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#202020] px-3 py-1 text-xs text-[#d0d0d0]">
                      <Spinner size={14} />
                      Loading your feed
                    </span>
                  )}
                </div>
                <div className="rounded-3xl bg-[#121212]/78 backdrop-blur p-4 md:p-5 border border-white/10 max-w-xl transition-colors group-hover:border-white/20">
                  <p className="text-white text-2xl md:text-3xl font-black clamp2 group-hover:text-red-300 transition-colors">
                    {featured.title}
                  </p>
                  <p className="text-[#b7b7b7] text-sm md:text-base mt-3">
                    {featured.chName} | {featured.views} | {featured.dur}
                  </p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="relative p-6 md:p-8 min-h-[320px] flex flex-col justify-end">
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #ff2d5522 0%, #0f0f0f 58%, #0f0f0f 100%)' }} />
              <div className="relative max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    Home
                  </span>
                  {globalLoading && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#202020] px-3 py-1 text-xs text-[#d0d0d0]">
                      <Spinner size={14} />
                      Loading your feed
                    </span>
                  )}
                </div>
                <div className="mt-6 rounded-3xl bg-[#121212]/80 backdrop-blur p-4 border border-white/10 max-w-xl">
                  <p className="text-white font-semibold">Your safe feed is getting ready.</p>
                  <p className="text-[#a8a8a8] text-sm mt-1">As soon as the channels finish loading, shelves will appear here.</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t lg:border-t-0 lg:border-l border-[#252525] bg-[#121212] p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-white font-semibold">Up next on your feed</p>
                <p className="text-[#8d8d8d] text-sm">Quick picks from trusted videos and channels</p>
              </div>
              <span className="text-xs rounded-full bg-[#202020] px-3 py-1 text-[#c6c6c6]">
                {allAllowed.length} videos ready
              </span>
            </div>
            <div className="space-y-3">
              {queue.map((video) => (
                <Link key={video.id} to={`/watch/${video.id}`} className="flex gap-3 rounded-2xl p-2 hover:bg-[#1c1c1c] transition-colors">
                  <div className="w-36 flex-shrink-0">
                    <div className="thumb rounded-xl">
                      <img src={video.thumb} alt={video.title} onError={(event) => { event.target.onerror = null; event.target.src = `https://i.ytimg.com/vi/${video.yt}/mqdefault.jpg`; }} />
                      <span className="dur">{video.dur}</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium clamp2">{video.title}</p>
                    <p className="text-[#a8a8a8] text-xs mt-1">{video.chName}</p>
                    <p className="text-[#767676] text-xs mt-1">{video.views}</p>
                  </div>
                </Link>
              ))}
              {!queue.length && (
                <div className="rounded-2xl border border-dashed border-[#2b2b2b] px-4 py-6 text-center text-sm text-[#8f8f8f]">
                  More picks will show up here once your safe channels finish loading.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, index) => (
            <button
              key={`${chip.label}-${index}`}
              type="button"
              onClick={() => scrollToSection(chip.targetId)}
              className={`rounded-full px-4 py-2 text-sm border ${index === 0 ? 'bg-white text-black border-white' : 'bg-[#1c1c1c] text-[#f1f1f1] border-[#303030]'}`}
            >
              {chip.label}
              <span className={`ml-2 text-xs ${index === 0 ? 'text-black/70' : 'text-[#aaaaaa]'}`}>{chip.value}</span>
            </button>
          ))}
        </div>
      </section>

      <section id="browse-channels" className="mb-10 scroll-mt-24">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-1 h-5 bg-red-500 rounded-full inline-block" />
            Browse Channels
          </h2>
          {globalLoading && <Spinner size={16} />}
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {channelRows.map((entry) => (
            <ChannelShortcut
              key={entry.channel.id}
              channel={entry.channel}
              count={entry.allowed.length}
              loadingState={entry.loadingState}
            />
          ))}
        </div>
      </section>

      {pinned.length > 0 && (
        <HomeShelf
          sectionId="parents-picks"
          title="Parent's Picks"
          subtitle="Hand-picked videos that always stay easy to find."
          videos={pinned.slice(0, 10)}
          accent="bg-yellow-400"
        />
      )}

      {!allLoaded && allAllowed.length === 0 && pinned.length === 0 && (
        <LoadingGrid label="Loading your channels..." />
      )}

      {allLoaded && allAllowed.length === 0 && pinned.length === 0 && (
        <div className="text-center py-16 text-[#aaa]">
          <p className="text-white font-semibold mb-2">No videos available</p>
          <p className="text-sm">Try adjusting filters in Parent Controls.</p>
        </div>
      )}

      <HomeShelf
        sectionId="fresh-uploads"
        title="Fresh Uploads"
        subtitle="The newest safe videos from your approved channels."
        videos={recent.slice(0, 12)}
      />

      <HomeShelf
        sectionId="popular-right-now"
        title="Popular Right Now"
        subtitle="The biggest videos across your trusted channels."
        videos={popular.slice(0, 12)}
        accent="bg-pink-500"
      />

      <HomeShelf
        sectionId="longer-watch-time"
        title="Longer Watch Time"
        subtitle="Great when kids want something closer to a full episode."
        videos={longerVideos.slice(0, 12)}
        accent="bg-blue-500"
      />

      {channelRows
        .filter((entry) => entry.allowed.length > 0)
        .map((entry) => (
          <HomeShelf
            key={entry.channel.id}
            sectionId={`channel-shelf-${entry.channel.id}`}
            title={entry.channel.name}
            subtitle={`${entry.channel.category} videos from a trusted channel`}
            videos={entry.allowed.slice(0, 10)}
            accent="bg-emerald-500"
          />
        ))}
    </div>
  );
}
