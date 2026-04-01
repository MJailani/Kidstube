import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchVideoById, searchVideos } from '../../api';
import Spinner from '../../components/Spinner';
import { IcSearch, IcStar, IcTrash, IcXcirc, IcLink } from '../../icons';

export default function PVideos() {
  const { s, d } = useApp();
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [searchErr, setSearchErr] = useState('');
  const [pinnedNow, setPinnedNow] = useState({});
  const pinned = s.pinned || [];

  async function doSearch() {
    const query = searchQ.trim();
    if (!query) return;

    setSearching(true);
    setSearchErr('');
    setResults(null);

    try {
      let nextResults;
      const urlMatch = query.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      const bareId = /^[\w-]{11}$/.test(query);

      if (urlMatch || bareId) {
        const video = await fetchVideoById(query);
        nextResults = [video];
      } else {
        nextResults = await searchVideos(query);
      }

      setResults(nextResults);
      if (!nextResults.length) {
        setSearchErr('No videos found. Try different keywords.');
      }
    } catch (error) {
      setSearchErr(error.message || 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function pinVideo(video) {
    if (pinned.find((entry) => entry.id === video.id)) return;
    d({ t: 'ADD_PIN', v: video });
    setPinnedNow((current) => ({ ...current, [video.id]: true }));
  }

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">Parent's Picks</h2>
      <p className="text-[#6b7280] text-sm mb-5">
        Search for videos to pin for your kids. They appear in a special row on the home screen and bypass the normal filters.
      </p>

      <div className="bg-[#1f2937] rounded-xl p-4 mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <IcSearch size={14} cls="text-blue-400" />Search for a Video
        </h3>
        <div className="flex gap-2 mb-1">
          <input value={searchQ}
            onChange={(event) => { setSearchQ(event.target.value); setSearchErr(''); }}
            onKeyDown={(event) => event.key === 'Enter' && doSearch()}
            placeholder="e.g. Baby Shark, dinosaur songs for kids, or paste a video URL..."
            className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2.5 rounded-lg text-sm outline-none focus:border-blue-500"
          />
          <button onClick={doSearch} disabled={searching || !searchQ.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 whitespace-nowrap">
            {searching ? <><Spinner size={14} />Searching...</> : <><IcSearch size={14} />Search</>}
          </button>
        </div>
        <p className="text-[#4b5563] text-xs mb-3">Search by title/topic or paste a YouTube video URL</p>

        {searchErr && <p className="text-red-400 text-xs mb-2 flex items-center gap-1"><IcXcirc size={12} />{searchErr}</p>}

        {results && results.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {results.map((video) => {
              const alreadyPinned = !!pinned.find((entry) => entry.id === video.id) || pinnedNow[video.id];
              return (
                <div key={video.id} className="bg-[#111827] border border-[#374151] rounded-xl p-3 flex gap-3 items-center">
                  <div className="flex-shrink-0 w-24 sm:w-32">
                    <div className="thumb rounded-lg">
                      <img src={video.thumb} alt={video.title}
                        onError={(event) => { event.target.onerror = null; event.target.src = `https://i.ytimg.com/vi/${video.yt}/mqdefault.jpg`; }} />
                      <span className="dur">{video.dur}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium clamp2 leading-snug">{video.title}</p>
                    <p className="text-[#6b7280] text-xs mt-0.5">{video.chName}</p>
                    <p className="text-[#6b7280] text-xs">{video.views} · {video.date}</p>
                    {video.short && <span className="inline-block mt-1 text-[10px] bg-orange-900 text-orange-300 px-1.5 py-0.5 rounded-full">Short</span>}
                  </div>
                  <div className="flex-shrink-0">
                    {alreadyPinned
                      ? <span className="flex items-center gap-1 text-yellow-400 text-xs px-2 py-1"><IcStar size={12} />Pinned</span>
                      : <button onClick={() => pinVideo(video)}
                        className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                        <IcStar size={12} />Pin
                      </button>}
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

      <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
        <IcStar size={14} cls="text-yellow-400" />Pinned Videos ({pinned.length})
      </h3>
      {!pinned.length ? (
        <div className="text-center py-10 text-[#6b7280] bg-[#1f2937] rounded-xl">
          <IcStar size={36} cls="mx-auto mb-3 opacity-30" />
          <p className="text-white font-medium mb-1">No pinned videos yet</p>
          <p className="text-sm">Search above and pin videos for your kids.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pinned.map((video) => (
            <div key={video.id} className="bg-[#1f2937] rounded-xl p-3 flex gap-3 items-center">
              <div className="flex-shrink-0 w-24 sm:w-32">
                <div className="thumb rounded-lg">
                  <img src={video.thumb} alt={video.title} onError={(event) => { event.target.style.display = 'none'; }} />
                  <span className="dur">{video.dur}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm clamp2">{video.title}</p>
                <p className="text-[#6b7280] text-xs mt-0.5">{video.chName}</p>
                <p className="text-[#6b7280] text-xs">{video.views} · {video.date}</p>
                <a href={`https://www.youtube.com/watch?v=${video.yt}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 text-xs mt-1 hover:text-blue-300">
                  <IcLink size={10} />View on YouTube
                </a>
              </div>
              <button onClick={() => d({ t: 'DEL_PIN', id: video.id })}
                className="p-2 text-[#6b7280] hover:text-red-400 hover:bg-[#374151] rounded-lg transition-colors flex-shrink-0" title="Remove">
                <IcTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 bg-[#1e3a5f] border border-blue-800 rounded-xl p-4 text-xs text-blue-400">
        <p className="text-blue-300 font-semibold mb-1">How pinned videos work</p>
        Pinned videos bypass all filters and appear in a "Parent's Picks" row on the kids' home screen, even if the channel is not whitelisted.
      </div>
    </div>
  );
}
