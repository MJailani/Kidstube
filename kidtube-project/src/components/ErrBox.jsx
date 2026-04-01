import { IcRefresh } from '../icons';

export default function ErrBox({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
      <div className="text-4xl">⚠️</div>
      <p className="text-white font-semibold">Couldn't load videos</p>
      <p className="text-[#aaa] text-sm max-w-xs">Check your internet or YouTube API quota.</p>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm mt-1">
          <IcRefresh size={14} />Try again
        </button>
      )}
    </div>
  );
}
