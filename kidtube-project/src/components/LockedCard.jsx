import { useApp } from '../context/AppContext';
import { getAllChannels } from '../api';
import { IcLock, IcMsg } from '../icons';

export default function LockedCard({ v, onReq, reqd }) {
  const { s } = useApp();
  const ch = getAllChannels(s).find(c => c.id === v.ch);
  return (
    <div>
      <div className="thumb" style={{ opacity: 0.6 }}>
        <img
          src={v.thumb} alt={v.title}
          style={{ filter: 'blur(3px)', transform: 'scale(1.05)' }}
          onError={e => { e.target.onerror = null; e.target.src = `https://i.ytimg.com/vi/${v.yt}/mqdefault.jpg`; }}
        />
        <span className="dur">{v.dur}</span>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
          <IcLock size={22} cls="text-white mb-1" />
          <span className="text-white text-xs text-center px-2">{v.why}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-2 items-start">
        {ch && (
          <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-hidden" style={{ background: ch.color, fontSize: 14 }}>
            {ch.thumb
              ? <img src={ch.thumb} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
              : ch.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[#888] text-sm clamp2">{v.title}</p>
          <button
            onClick={() => onReq(v)} disabled={reqd}
            className={`mt-1.5 flex items-center gap-1 text-xs px-2 py-1 rounded-full ${reqd ? 'bg-[#272727] text-[#555] cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'}`}
          >
            <IcMsg size={11} />{reqd ? 'Request sent!' : 'Ask Parent to unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
