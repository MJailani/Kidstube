import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllChannels } from '../../api';
import { isVideoAllowed, splitVideosByAccess } from '../../access';
import { Link, navigate } from '../../router';
import LoadingGrid from '../../components/LoadingGrid';
import { IcClock, IcLeft, IcLock, IcShield, IcStar, IcVideo } from '../../icons';

function uniqueVideos(videos) {
  const seen = new Set();
  return videos.filter((video) => {
    if (!video || seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  });
}

export default function VideoPlayer({ vidId }) {
  const { s, logWatchForProfile } = useApp();
  const allVideos = [...Object.values(s.videos).flat(), ...(s.pinned || [])];
  const video = allVideos.find((entry) => entry.id === vidId);
  const allChannels = getAllChannels(s);
  const channel = video ? allChannels.find((entry) => entry.id === video.ch) : null;
  const logged = useRef(false);
  const allowed = isVideoAllowed(video, s);

  useEffect(() => {
    if (video && allowed && !logged.current) {
      logged.current = true;
      logWatchForProfile({
          id: video.id,
          title: video.title,
          ch: video.ch,
          chName: channel?.name || video.chName || '',
          thumb: video.thumb,
          dur: video.dur,
        }).catch((error) => {
          console.error('Could not log watch history', error);
        });
    }
  }, [allowed, channel, logWatchForProfile, vidId, video]);

  const related = useMemo(() => {
    if (!video) return [];
    return splitVideosByAccess((s.videos[video.ch] || []).filter((entry) => entry.id !== video.id), s).allowed.slice(0, 8);
  }, [s, video]);

  const moreToExplore = useMemo(() => {
    if (!video) return [];

    const fromHistory = s.history
      .filter((entry) => entry.id !== video.id)
      .map((entry) => allVideos.find((candidate) => candidate.id === entry.id))
      .filter(Boolean);

    const fromPinned = (s.pinned || []).filter((entry) => entry.id !== video.id);
    const fromAll = allVideos.filter((entry) => entry.id !== video.id && entry.ch !== video.ch && isVideoAllowed(entry, s));

    return uniqueVideos([...fromHistory, ...fromPinned, ...fromAll]).slice(0, 6);
  }, [allVideos, s, video]);

  if (!video && Object.values(s.loading).some((value) => value === 'loading')) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingGrid label="Loading video..." /></div>;
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <button onClick={() => navigate('/')} className="text-red-400 flex items-center gap-1"><IcLeft size={16} />Home</button>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <IcLock size={48} cls="text-[#aaa] mb-4" />
        <p className="text-white text-lg font-bold mb-2">
          {video.short && s.filters.blockShorts ? 'Shorts are hidden' : 'Video not available'}
        </p>
        <p className="text-[#aaa] max-w-xs mb-4">
          {video.short && s.filters.blockShorts ? 'A parent has turned off Shorts.' : 'This video is restricted.'}
        </p>
        <button onClick={() => window.history.back()} className="text-red-400 flex items-center gap-1">
          <IcLeft size={16} />Go back
        </button>
      </div>
    );
  }

  const params = 'autoplay=1&rel=0&modestbranding=1&iv_load_policy=3';

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-5">
      <div className="flex items-center gap-2 text-xs text-[#8b8b8b] mb-4 overflow-x-auto whitespace-nowrap no-scrollbar">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1 rounded-full border border-[#2b2b2b] px-3 py-1.5 hover:bg-[#1a1a1a] hover:text-white transition-colors"
        >
          <IcLeft size={14} />Home
        </button>
        {channel && (
          <>
            <span>|</span>
            <button
              onClick={() => navigate(`/channel/${channel.id}`)}
              className="hover:text-white transition-colors"
            >
              {channel.name}
            </button>
          </>
        )}
        <span>|</span>
        <span className="text-[#d7d7d7]">{video.title}</span>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.65fr)_380px] gap-6 items-start">
        <section className="min-w-0">
          <div className="rounded-[24px] border border-[#232323] bg-[#141414] overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
            <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.yt}?${params}`}
                title={video.title}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-same-origin allow-scripts allow-presentation"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>

            <div className="p-4 md:p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  <IcVideo size={12} />Now Watching
                </span>
                {video.pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
                    <IcStar size={12} />Parent Pick
                  </span>
                )}
              </div>

              <h1 className="text-white text-xl md:text-2xl font-bold leading-tight">{video.title}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#b0b0b0]">
                <span>{video.views}</span>
                <span>|</span>
                <span>{video.date}</span>
                <span>|</span>
                <span>{video.dur}</span>
              </div>

              <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <Link to={channel ? `/channel/${channel.id}` : '/'} className="flex items-center gap-3 hover:opacity-90 transition-opacity min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white text-base font-bold flex-shrink-0 ring-4 ring-[#0f0f0f]" style={{ background: channel?.color || '#555' }}>
                    {channel?.thumb ? (
                      <img src={channel.thumb} alt="" className="w-full h-full object-cover" onError={(event) => { event.target.style.display = 'none'; }} />
                    ) : (channel?.name[0] || '?')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-base font-semibold clamp1">{channel?.name || video.chName}</p>
                    {channel && <p className="text-[#9c9c9c] text-sm">{channel.subscribers} subscribers</p>}
                  </div>
                </Link>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(channel ? `/channel/${channel.id}` : '/')}
                    className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium hover:bg-[#e6e6e6] transition-colors"
                  >
                    View channel
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="rounded-full bg-[#232323] text-white px-4 py-2 text-sm font-medium hover:bg-[#2d2d2d] transition-colors"
                  >
                    Back to feed
                  </button>
                </div>
              </div>

              <div className="mt-5 grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[#1a1a1a] border border-[#252525] px-4 py-3">
                  <p className="text-[#7f7f7f] text-[11px] uppercase tracking-[0.16em]">Watch mode</p>
                  <p className="text-white font-medium mt-1">Kid-safe player</p>
                </div>
                <div className="rounded-2xl bg-[#1a1a1a] border border-[#252525] px-4 py-3">
                  <p className="text-[#7f7f7f] text-[11px] uppercase tracking-[0.16em]">Comments</p>
                  <p className="text-white font-medium mt-1">Hidden</p>
                </div>
                <div className="rounded-2xl bg-[#1a1a1a] border border-[#252525] px-4 py-3">
                  <p className="text-[#7f7f7f] text-[11px] uppercase tracking-[0.16em]">Recommendations</p>
                  <p className="text-white font-medium mt-1">Parent-filtered</p>
                </div>
              </div>

              {video.desc && (
                <div className="mt-5 rounded-3xl border border-[#262626] bg-[#1a1a1a] px-4 py-4">
                  <p className="text-[#878787] text-[11px] uppercase tracking-[0.18em] mb-2">About this video</p>
                  <p className="text-white text-sm leading-relaxed whitespace-pre-line">{video.desc}</p>
                </div>
              )}

              <div className="mt-4 rounded-3xl border border-[#233240] bg-[#10171d] px-4 py-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#173047] text-sky-300 flex items-center justify-center flex-shrink-0">
                  <IcShield size={18} />
                </div>
                <div>
                  <p className="text-white font-semibold">Parent-approved mode is active</p>
                  <p className="text-[#9fb6c6] text-sm mt-1">
                    Comments, unsafe distractions, and unrestricted recommendations stay out of the watch experience here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="xl:sticky xl:top-[104px] space-y-4">
          {related.length > 0 && (
            <section className="rounded-[24px] border border-[#232323] bg-[#141414] overflow-hidden">
              <div className="px-4 py-4 border-b border-[#232323]">
                <p className="text-white font-semibold">More from {channel?.name}</p>
                <p className="text-[#8b8b8b] text-sm mt-1">Safe videos from the same channel</p>
              </div>
              <div className="p-2">
                {related.map((entry) => (
                  <Link key={entry.id} to={`/watch/${entry.id}`} className="flex gap-3 rounded-2xl p-2 hover:bg-[#1c1c1c] transition-colors">
                    <div className="w-40 flex-shrink-0">
                      <div className="thumb rounded-xl">
                        <img src={entry.thumb} alt={entry.title} onError={(event) => { event.target.onerror = null; event.target.src = `https://i.ytimg.com/vi/${entry.yt}/mqdefault.jpg`; }} />
                        <span className="dur">{entry.dur}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium clamp2 leading-snug">{entry.title}</p>
                      <p className="text-[#aaaaaa] text-xs mt-1">{entry.views}</p>
                      <p className="text-[#6c6c6c] text-xs mt-1">{entry.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {moreToExplore.length > 0 && (
            <section className="rounded-[24px] border border-[#232323] bg-[#141414] overflow-hidden">
              <div className="px-4 py-4 border-b border-[#232323]">
                <p className="text-white font-semibold">Keep exploring</p>
                <p className="text-[#8b8b8b] text-sm mt-1">More safe videos from your home feed</p>
              </div>
              <div className="p-3 space-y-3">
                {moreToExplore.map((entry) => (
                  <Link key={entry.id} to={`/watch/${entry.id}`} className="flex items-center gap-3 rounded-2xl border border-[#212121] bg-[#181818] px-3 py-3 hover:bg-[#1d1d1d] transition-colors">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#242424] flex-shrink-0">
                      <img src={entry.thumb} alt={entry.title} className="w-full h-full object-cover" onError={(event) => { event.target.onerror = null; event.target.src = `https://i.ytimg.com/vi/${entry.yt}/mqdefault.jpg`; }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium clamp2">{entry.title}</p>
                      <p className="text-[#8b8b8b] text-xs mt-1">{entry.chName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-[24px] border border-[#232323] bg-[#141414] overflow-hidden">
            <div className="px-4 py-4 border-b border-[#232323]">
              <p className="text-white font-semibold">Watching now</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-[#1a1a1a] px-3 py-3">
                <div className="w-10 h-10 rounded-full bg-[#251b1b] text-red-300 flex items-center justify-center flex-shrink-0">
                  <IcClock size={16} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Play time</p>
                  <p className="text-[#8d8d8d] text-xs">{video.dur} runtime</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-[#1a1a1a] px-3 py-3">
                <div className="w-10 h-10 rounded-full bg-[#1f251b] text-lime-300 flex items-center justify-center flex-shrink-0">
                  <IcShield size={16} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Filter status</p>
                  <p className="text-[#8d8d8d] text-xs">All active parent rules still apply</p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
