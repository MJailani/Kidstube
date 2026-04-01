import { useApp } from '../../context/AppContext';
import { getAllChannels, fetchChannelVideos } from '../../api';
import { splitVideosByAccess } from '../../access';
import { navigate } from '../../router';
import VCard from '../../components/VCard';
import LockedCard from '../../components/LockedCard';
import LoadingGrid from '../../components/LoadingGrid';
import ErrBox from '../../components/ErrBox';
import { IcLeft, IcLock } from '../../icons';

export default function ChannelPage({ chId }) {
  const { s, d, requestVideoUnlock } = useApp();
  const ch = getAllChannels(s).find((channel) => channel.id === chId);

  if (!ch || !s.wl.includes(chId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <IcLock size={48} cls="text-[#aaa] mb-4" />
        <p className="text-white text-lg font-bold mb-2">Channel not available</p>
        <button onClick={() => navigate('/')} className="text-red-400 flex items-center gap-1 mt-3">
          <IcLeft size={16} />Back to home
        </button>
      </div>
    );
  }

  const loadState = s.loading[chId];
  const allVideos = s.videos[chId] || [];
  const { allowed: finalAllowed, blocked: stillBlocked, hiddenShorts } = splitVideosByAccess(allVideos, s);
  const requestedIds = s.requests.map((request) => request.vid);

  async function requestUnlock(video) {
    await requestVideoUnlock({
      vid: video.id,
      title: video.title,
      chName: ch.name,
      thumb: video.thumb,
      short: !!video.short,
    });
  }

  function retry() {
    d({ t: 'VIDS_START', ch: chId });
    fetchChannelVideos(chId)
      .then((videos) => d({ t: 'VIDS_OK', ch: chId, videos }))
      .catch(() => d({ t: 'VIDS_ERR', ch: chId }));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-[#aaa] hover:text-white mb-4 text-sm">
        <IcLeft size={16} />All channels
      </button>

      <div className="mb-6">
        <div className="h-28 rounded-2xl mb-3" style={{ background: `linear-gradient(135deg,${ch.color}88,${ch.color}22)` }} />
        <div className="flex items-end gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden ring-4 ring-[#0f0f0f] flex items-center justify-center text-white text-xl font-bold" style={{ background: ch.color }}>
            {ch.thumb ? (
              <img src={ch.thumb} alt={ch.name} className="w-full h-full object-cover" onError={(event) => { event.target.style.display = 'none'; }} />
            ) : ch.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">{ch.name}</h1>
            <p className="text-[#aaa] text-sm">{`${ch.handle} - ${ch.subscribers} subscribers`}</p>
            {s.filters.blockShorts && hiddenShorts.length > 0 && (
              <span className="inline-block mt-1 text-xs bg-[#272727] text-[#aaa] px-2 py-0.5 rounded-full">
                {hiddenShorts.length} Shorts hidden
              </span>
            )}
          </div>
        </div>
      </div>

      {loadState === 'loading' && <LoadingGrid label={`Loading ${ch.name} videos...`} />}
      {loadState === 'err' && <ErrBox onRetry={retry} />}
      {loadState === 'ok' && (
        <>
          {finalAllowed.length > 0 && (
            <div className="mb-6">
              <p className="text-[#aaa] text-xs font-semibold uppercase tracking-wide mb-3">
                {finalAllowed.length} video{finalAllowed.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {finalAllowed.map((video) => <VCard key={video.id} v={video} showCh={false} />)}
              </div>
            </div>
          )}

          {stillBlocked.length > 0 && (
            <div>
              <p className="text-[#666] text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                <IcLock size={12} />{stillBlocked.length} not available
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stillBlocked.map((video) => (
                  <LockedCard
                    key={video.id}
                    v={video}
                    onReq={requestUnlock}
                    reqd={requestedIds.includes(video.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {finalAllowed.length === 0 && stillBlocked.length === 0 && (
            <div className="text-center py-16 text-[#aaa]">
              <p className="text-white font-semibold mb-2">No videos to show</p>
              <p className="text-sm">All videos are hidden by active filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
