import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllChannels, resolveChannel, searchChannels } from '../../api';
import { splitVideosByAccess } from '../../access';
import Spinner from '../../components/Spinner';
import { IcOk, IcPlus, IcSearch, IcTrash, IcX, IcXcirc } from '../../icons';

export default function PChannels() {
  const {
    s,
    activeProfile,
    hasSupabaseAuth,
    profileBusy,
    toggleProfileChannel,
    addCustomProfileChannel,
    removeCustomProfileChannel,
  } = useApp();

  const [filterQ, setFilterQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [searchErr, setSearchErr] = useState('');
  const [added, setAdded] = useState({});
  const [savingId, setSavingId] = useState('');
  const allChannels = getAllChannels(s);
  const list = allChannels.filter((channel) =>
    channel.name.toLowerCase().includes(filterQ.toLowerCase()) ||
    channel.category.toLowerCase().includes(filterQ.toLowerCase()),
  );

  async function doSearch() {
    const query = searchQ.trim();
    if (!query) return;

    setSearching(true);
    setSearchErr('');
    setResults(null);

    try {
      let nextResults;
      if (query.includes('youtube.com') || /^UC[\w-]{21,22}$/.test(query) || query.startsWith('@')) {
        const channel = await resolveChannel(query);
        nextResults = [channel];
      } else {
        nextResults = await searchChannels(query);
      }

      setResults(nextResults);
      if (!nextResults.length) {
        setSearchErr('No channels found. Try different keywords.');
      }
    } catch (error) {
      setSearchErr(error.message || 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function addChannel(channel) {
    try {
      setSavingId(channel.id);
      await addCustomProfileChannel(channel);
      setAdded((current) => ({ ...current, [channel.id]: true }));
    } catch (error) {
      setSearchErr(error.message || 'Could not add channel.');
    } finally {
      setSavingId('');
    }
  }

  function closeAdd() {
    setShowAdd(false);
    setSearchQ('');
    setResults(null);
    setSearchErr('');
    setAdded({});
  }

  async function toggleChannel(channel) {
    try {
      setSavingId(channel.id);
      await toggleProfileChannel(channel);
    } catch (error) {
      setSearchErr(error.message || 'Could not update channel.');
    } finally {
      setSavingId('');
    }
  }

  async function removeChannel(channelId) {
    try {
      setSavingId(channelId);
      await removeCustomProfileChannel(channelId);
    } catch (error) {
      setSearchErr(error.message || 'Could not remove channel.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-white text-xl font-bold">Channel Whitelist</h2>
          {hasSupabaseAuth && activeProfile && (
            <p className="text-[#6b7280] text-xs mt-1">
              Editing allowed channels for <span className="text-white">{activeProfile.name}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => (showAdd ? closeAdd() : setShowAdd(true))}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${showAdd ? 'bg-[#374151] text-[#9ca3af]' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {showAdd ? <><IcX size={14} />Close</> : <><IcPlus size={14} />Add Channel</>}
        </button>
      </div>
      <p className="text-[#6b7280] text-sm mb-4">Only enabled channels appear for your kids.</p>

      {showAdd && (
        <div className="bg-[#1f2937] border border-blue-700 rounded-xl p-4 mb-5">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <IcSearch size={14} cls="text-blue-400" />Search for a Channel
          </h3>
          <div className="flex gap-2 mb-1">
            <input
              value={searchQ}
              onChange={(event) => { setSearchQ(event.target.value); setSearchErr(''); }}
              onKeyDown={(event) => event.key === 'Enter' && doSearch()}
              placeholder="e.g. SciShow Kids, @NatGeoKids, or paste a channel URL..."
              className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2.5 rounded-lg text-sm outline-none focus:border-blue-500"
            />
            <button
              onClick={doSearch}
              disabled={searching || !searchQ.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {searching ? <><Spinner size={14} />Searching...</> : <><IcSearch size={14} />Search</>}
            </button>
          </div>
          <p className="text-[#4b5563] text-xs mb-3">Search by name, topic, or paste a YouTube channel URL / @handle</p>

          {searchErr && <p className="text-red-400 text-xs mb-3 flex items-center gap-1"><IcXcirc size={12} />{searchErr}</p>}

          {results && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {results.map((channel) => {
                const alreadyHave = !!allChannels.find((entry) => entry.id === channel.id);
                const enabled = s.wl.includes(channel.id);
                const justAdded = added[channel.id];
                const busy = savingId === channel.id;
                return (
                  <div key={channel.id} className="bg-[#111827] border border-[#374151] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-lg font-bold" style={{ background: channel.color }}>
                      {channel.thumb ? (
                        <img src={channel.thumb} alt="" className="w-full h-full object-cover" onError={(event) => { event.target.style.display = 'none'; }} />
                      ) : channel.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{channel.name}</p>
                      <p className="text-[#6b7280] text-xs truncate">{channel.handle}{channel.subscribers ? ` - ${channel.subscribers} subs` : ''}</p>
                      {channel.desc && <p className="text-[#4b5563] text-xs clamp1 mt-0.5">{channel.desc}</p>}
                    </div>
                    <div className="flex-shrink-0">
                      {enabled || justAdded
                        ? <span className="flex items-center gap-1 text-green-400 text-xs px-2 py-1"><IcOk size={12} />Added</span>
                        : (
                          <button
                            onClick={() => addChannel(channel)}
                            disabled={busy || profileBusy}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            {busy ? <Spinner size={12} /> : <IcPlus size={12} />}
                            Add
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {results && results.length === 0 && !searchErr && (
            <p className="text-[#6b7280] text-sm text-center py-4">No results found.</p>
          )}
        </div>
      )}

      <div className="relative mb-4">
        <IcSearch size={16} cls="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
        <input
          value={filterQ}
          onChange={(event) => setFilterQ(event.target.value)}
          placeholder="Filter your channels..."
          className="w-full bg-[#1f2937] border border-[#374151] text-white placeholder-[#6b7280] pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-500"
        />
      </div>
      <p className="text-[#6b7280] text-xs mb-3">{s.wl.length} of {allChannels.length} enabled</p>

      <div className="flex flex-col gap-2">
        {list.map((channel) => {
          const enabled = s.wl.includes(channel.id);
          const videos = s.videos[channel.id] || [];
          const { allowed, hiddenShorts } = splitVideosByAccess(videos, s);
          const isLoading = s.loading[channel.id] === 'loading';
          const busy = savingId === channel.id;

          return (
            <div key={channel.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${enabled ? 'bg-[#1f2937] border-blue-700' : 'bg-[#111827] border-[#374151] opacity-60'}`}>
              <div onClick={() => !busy && toggleChannel(channel)} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-lg font-bold" style={{ background: channel.color }}>
                  {channel.thumb ? (
                    <img src={channel.thumb} alt="" className="w-full h-full object-cover" onError={(event) => { event.target.style.display = 'none'; }} />
                  ) : channel.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white text-sm font-medium truncate">{channel.name}</p>
                    {!channel.builtin && <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded-full flex-shrink-0">Custom</span>}
                  </div>
                  <p className="text-[#6b7280] text-xs">{channel.subscribers}{channel.subscribers ? ' - ' : ''}{channel.category}</p>
                  <div className="flex gap-3 mt-1">
                    {isLoading
                      ? <span className="text-[#6b7280] text-xs flex items-center gap-1"><Spinner size={10} />Loading...</span>
                      : <span className="text-green-400 text-xs">{allowed.length} available</span>}
                    <span className="text-[#6b7280] text-xs">{hiddenShorts.length} Shorts</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!channel.builtin && (
                  <button
                    onClick={() => removeChannel(channel.id)}
                    className="p-1.5 text-[#6b7280] hover:text-red-400 hover:bg-[#374151] rounded-lg transition-colors"
                    title="Remove channel"
                    disabled={busy || profileBusy}
                  >
                    {busy ? <Spinner size={14} /> : <IcTrash size={14} />}
                  </button>
                )}
                <button
                  onClick={() => toggleChannel(channel)}
                  disabled={busy || profileBusy}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-60 ${enabled ? 'bg-blue-600' : 'bg-[#374151]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow m-1 transition-all ${enabled ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
