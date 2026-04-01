import { useApp } from '../context/AppContext';
import { navigate } from '../router';
import { IcShield } from '../icons';

export default function KidLayout({ children }) {
  const { s } = useApp();
  const pending = s.requests.length;

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <header className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-[#272727] flex items-center justify-between px-4 h-14">
        <button onClick={() => navigate('/')} className="select-none">
          <svg viewBox="0 0 108 22" width="108" height="22">
            <rect x="0" y="0" width="30" height="22" rx="5" fill="#ff0000" />
            <polygon points="11,4 11,18 23,11" fill="white" />
            <text x="34" y="17" fontFamily="Arial" fontWeight="700" fontSize="17" fill="white">KidTube</text>
          </svg>
        </button>
        <span className="hidden sm:block text-[#555] text-xs">Safe videos, hand-picked for you.</span>
        <button
          onClick={() => navigate('/parent')}
          className="relative flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] text-[#aaa] hover:text-white rounded-full px-3 py-1.5 text-sm font-medium"
        >
          <IcShield size={14} />Parent
          {pending > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {pending}
            </span>
          )}
        </button>
      </header>
      <div className="border-b border-[#1f1f1f] bg-[#121212] px-4 py-2">
        <div className="no-scrollbar max-w-7xl mx-auto flex items-center gap-2 text-xs text-[#8f8f8f] overflow-x-auto whitespace-nowrap">
          <span className="rounded-full bg-[#1f1f1f] px-3 py-1 text-white">Home</span>
          <span>Fresh uploads</span>
          <span className="text-[#444]">|</span>
          <span>Trusted channels</span>
          <span className="text-[#444]">|</span>
          <span>Parent-approved picks</span>
          <span className="text-[#444]">|</span>
          <span>Shorts hidden when blocked</span>
        </div>
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
