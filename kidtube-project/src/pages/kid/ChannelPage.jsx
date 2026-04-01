import { useApp } from '../../context/AppContext';
import { getAllChannels, filterVideos, fetchChannelVideos } from '../../api';
import { navigate } from '../../router';
import VCard from '../../components/VCard';
import LockedCard from '../../components/LockedCard';
import LoadingGrid from '../../components/LoadingGrid';
import ErrBox from '../../components/ErrBox';
import { IcLeft, IcLock } from '../../icons';

export default function ChannelPage({ chId }) {
  const { s, d } = useApp();
  const ch = getAllChannels(s).find(c => c.id === chId);

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
  const all = s.videos[chId] || [];
  const shorts = all.filter(v => v.short);
  const { allowed, blocked } = filterVideos(all, s.filters);
  const finalAllowed = [...allowed, ...blocked.filter(v => s.approved.includes(v.id))];
  const stillBlocked = blocked.filter(v => !s.approved.includes(v.id));
  const reqIds = s.requests.map(r => r.vid);

  function req(v) { d({ t: 'REQ', r: { vid: v.id, title: v.title, chName: ch.name, thumb: v.thumb } }); }
  function retry() {
    d({ t: 'VIDS_START', ch: chId });
    fetchChannelVideos(chId)
      .then(videos => d({ t: 'VIDS_OK', ch: chId, videos }))
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
            {ch.thumb
              ? <img src={ch.thumb} alt={ch.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
              : ch.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">{ch.name}</h1>
            <p className="text-[#aaa] text-sm">{ch.handle} · {ch.subscribers} subscribers</p>
            {s.filters.blockShorts && shorts.length > 0 && (
              <span className="inline-block mt-1 text-xs bg-[#272727] text-[#aaa] px-2 py-0.5 rounded-full">{shorts.length} Shorts hidden</span>
            )}
          </div>
        </div>
      </div>

      {loadState === 'loading' && <LoadingGrid label={`Loading ${ch.name} videos…`} />}
      {loadState === 'err' && <ErrBox onRetry={retry} />}
      {loadState === 'ok' && (
        <>
          {finalAllowed.length > 0 && (
            <div className="mb-6">
              <p className="text-[#aaa] text-xs font-semibold uppercase tracking-wide mb-3">
                {finalAllowed.length} video{finalAllowed.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {finalAllowed.map(v => <VCard key={v.id} v={v} showCh={false} />)}
              </div>
            </div>
          )}
          {stillBlocked.length > 0 && (
            <div>
              <p className="text-[#666] text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                <IcLock size={12} />{stillBlocked.length} not available
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stillBlocked.map(v => <LockedCard key={v.id} v={v} onReq={req} reqd={reqIds.includes(v.id)} />)}
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
