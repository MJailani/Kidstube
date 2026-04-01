import { useApp } from '../../context/AppContext';
import { IcMsg, IcClock, IcOk, IcXcirc } from '../../icons';

export default function PRequests() {
  const { s, d } = useApp();
  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">Unlock Requests</h2>
      <p className="text-[#6b7280] text-sm mb-5">Review videos your kids want to watch.</p>

      {!s.requests.length
        ? (
          <div className="text-center py-16 text-[#6b7280]">
            <IcMsg size={40} cls="mx-auto mb-3 opacity-40" />
            <p className="text-white font-medium mb-1">No pending requests</p>
            <p className="text-sm">When your kids tap "Ask Parent to unlock", requests appear here.</p>
          </div>
        )
        : (
          <div className="flex flex-col gap-3">
            {s.requests.map(r => (
              <div key={r.rid} className="bg-[#1f2937] rounded-xl p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-shrink-0 w-full sm:w-36">
                  <div className="thumb rounded-lg">
                    <img src={r.thumb} alt={r.title} onError={e => e.target.style.display = 'none'} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{r.title}</p>
                  <p className="text-[#9ca3af] text-xs mt-1">{r.chName}</p>
                  <p className="text-[#6b7280] text-xs flex items-center gap-1 mt-1">
                    <IcClock size={11} />
                    {new Date(r.at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => d({ t: 'APPROVE', rid: r.rid })}
                      className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
                      <IcOk size={14} />Approve
                    </button>
                    <button onClick={() => d({ t: 'DENY', rid: r.rid })}
                      className="flex items-center gap-1.5 bg-[#374151] hover:bg-red-800 text-[#9ca3af] hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
                      <IcXcirc size={14} />Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      <div className="mt-5 bg-[#1e3a5f] border border-blue-800 rounded-xl p-4 text-xs text-blue-400">
        <p className="text-blue-300 font-semibold mb-1">How unlock requests work</p>
        Approved videos bypass the filter for that video only. Shorts can never be unlocked.
      </div>
    </div>
  );
}
