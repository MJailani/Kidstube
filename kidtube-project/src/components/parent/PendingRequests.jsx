import React from 'react';
import { MessageCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { CHANNELS } from '../../mockData.js';

export default function PendingRequests() {
  const { state, dispatch } = useApp();
  const requests = state.pendingRequests;

  function approve(requestId) {
    dispatch({ type: 'APPROVE_REQUEST', requestId });
  }

  function deny(requestId) {
    dispatch({ type: 'DENY_REQUEST', requestId });
  }

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">Unlock Requests</h2>
      <p className="text-[#6b7280] text-sm mb-6">
        Your kids have asked you to unlock these videos. Review and approve or deny each one.
      </p>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-[#6b7280]">
          <MessageCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-white">No pending requests</p>
          <p className="text-sm mt-1">
            When your kids tap "Ask Parent to unlock" on a blocked video, it will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map(req => {
            const channel = CHANNELS.find(c => c.id === req.channelId);
            const time = new Date(req.requestedAt).toLocaleString([], {
              month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            });

            return (
              <div
                key={req.id}
                className="bg-[#1f2937] rounded-xl p-4 flex flex-col sm:flex-row gap-4"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-full sm:w-36">
                  <div className="relative rounded-lg overflow-hidden bg-[#374151]" style={{ paddingBottom: '56.25%' }}>
                    <img
                      src={req.thumbnail}
                      alt={req.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={e => { e.target.src = `https://picsum.photos/seed/req${req.videoId}/144/81`; }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm leading-snug">{req.title}</p>
                  <p className="text-[#9ca3af] text-xs mt-1">{req.channelName}</p>
                  <div className="flex items-center gap-1 mt-1 text-[#6b7280] text-xs">
                    <Clock size={11} />
                    <span>Requested {time}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => approve(req.id)}
                      className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle size={15} />
                      Approve
                    </button>
                    <button
                      onClick={() => deny(req.id)}
                      className="flex items-center gap-1.5 bg-[#374151] hover:bg-red-800 text-[#9ca3af] hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <XCircle size={15} />
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How it works box */}
      <div className="mt-6 bg-[#1e3a5f] border border-blue-800 rounded-xl p-4 text-sm">
        <p className="text-blue-300 font-semibold mb-1">How unlock requests work</p>
        <p className="text-blue-400 text-xs leading-relaxed">
          Blocked videos (those caught by keyword or duration filters) show as locked cards in your
          kid's channel view. They can tap "Ask Parent to unlock" to send a request here.
          Approved videos bypass the filter for that specific video only — your other filter rules
          stay in place. YouTube Shorts cannot be unlocked this way; Shorts remain hidden at all times.
        </p>
      </div>
    </div>
  );
}
