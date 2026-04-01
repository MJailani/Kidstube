import { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllChannels } from '../../api';
import { isVideoAllowed, splitVideosByAccess } from '../../access';
import { Link, navigate } from '../../router';
import LoadingGrid from '../../components/LoadingGrid';
import { IcLeft, IcLock } from '../../icons';

export default function VideoPlayer({ vidId }) {
  const { s, d } = useApp();
  const allVideos = [...Object.values(s.videos).flat(), ...(s.pinned || [])];
  const video = allVideos.find((entry) => entry.id === vidId);
  const allChannels = getAllChannels(s);
  const channel = video ? allChannels.find((entry) => entry.id === video.ch) : null;
  const logged = useRef(false);
  const allowed = isVideoAllowed(video, s);

  useEffect(() => {
    if (video && allowed && !logged.current) {
      logged.current = true;
      d({
        t: 'LOG',
        e: {
          id: video.id,
          title: video.title,
          ch: video.ch,
          chName: channel?.name || video.chName || '',
          thumb: video.thumb,
          dur: video.dur,
        },
      });
    }
  }, [allowed, channel, d, vidId, video]);

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

  const related = splitVideosByAccess((s.videos[video.ch] || []).filter((entry) => entry.id !== video.id), s).allowed.slice(0, 6);
  const params = 'autoplay=1&rel=0&modestbranding=1&iv_load_policy=3';

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => (video.ch ? navigate(`/channel/${video.ch}`) : navigate('/'))}
            className="flex items-center gap-1 text-[#aaa] hover:text-white mb-3 text-sm"
          >
            <IcLeft size={16} />Back{channel ? ` to ${channel.name}` : ''}
          </button>

          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${video.yt}?${params}`}
              title={video.title}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          <div className="mt-4">
            <h1 className="text-white text-lg font-bold leading-tight">{video.title}</h1>
            {video.pinned && (
              <span className="inline-block mt-1 text-xs bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded-full">Parent Pick</span>
            )}
            <div className="flex items-center gap-3 mt-2">
              <Link to={channel ? `/channel/${channel.id}` : ''} className="flex items-center gap-2 hover:opacity-80">
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: channel?.color || '#555', fontSize: 14 }}>
                  {channel?.thumb ? (
                    <img src={channel.thumb} alt="" className="w-full h-full object-cover" onError={(event) => { event.target.style.display = 'none'; }} />
                  ) : (channel?.name[0] || '?')}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{channel?.name || video.chName}</p>
                  {channel && <p className="text-[#aaa] text-xs">{channel.subscribers} subscribers</p>}
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3 mt-3 text-[#aaa] text-sm">
              <span>{video.views}</span><span>-</span><span>{video.date}</span><span>-</span><span>{video.dur}</span>
            </div>
            {video.desc && (
              <div className="mt-3 p-3 bg-[#1f1f1f] rounded-xl text-white text-sm leading-relaxed whitespace-pre-line">{video.desc}</div>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-[#666] border border-[#272727] rounded-xl p-2">
              <span>Parent-approved mode: comments and algorithm recommendations are hidden.</span>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <aside className="lg:w-80 flex-shrink-0">
            <h3 className="text-white font-semibold text-sm mb-3">More from {channel?.name}</h3>
            <div className="flex flex-col gap-3">
              {related.map((entry) => (
                <Link key={entry.id} to={`/watch/${entry.id}`} className="flex gap-2 hover:bg-[#1f1f1f] rounded-lg p-1 transition-colors">
                  <div className="flex-shrink-0 w-32">
                    <div className="thumb rounded-lg">
                      <img src={entry.thumb} alt={entry.title} onError={(event) => { event.target.onerror = null; event.target.src = `https://i.ytimg.com/vi/${entry.yt}/mqdefault.jpg`; }} />
                      <span className="dur">{entry.dur}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium clamp2 leading-snug">{entry.title}</p>
                    <p className="text-[#aaa] text-xs mt-1">{entry.views}</p>
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
