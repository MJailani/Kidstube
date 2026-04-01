import { useApp } from '../context/AppContext';
import { navigate } from '../router';
import { IcGrid, IcList, IcStar, IcFilter, IcClock, IcMsg, IcTv, IcLogOut } from '../icons';
import PDash from '../pages/parent/PDash';
import PChannels from '../pages/parent/PChannels';
import PVideos from '../pages/parent/PVideos';
import PFilters from '../pages/parent/PFilters';
import PHistory from '../pages/parent/PHistory';
import PRequests from '../pages/parent/PRequests';

const P_NAV = [
  { id: 'dashboard', label: 'Dashboard',    Ic: IcGrid },
  { id: 'channels',  label: 'Channels',     Ic: IcList },
  { id: 'videos',    label: 'Picks',        Ic: IcStar },
  { id: 'filters',   label: 'Filters',      Ic: IcFilter },
  { id: 'history',   label: 'Watch History', Ic: IcClock },
  { id: 'requests',  label: 'Requests',     Ic: IcMsg, badge: true },
];

const P_PAGES = {
  dashboard: <PDash />,
  channels:  <PChannels />,
  videos:    <PVideos />,
  filters:   <PFilters />,
  history:   <PHistory />,
  requests:  <PRequests />,
};

export default function ParentLayout({ sec }) {
  const { s, d } = useApp();
  const pending = s.requests.length;

  return (
    <div className="min-h-screen bg-[#111827] text-white flex flex-col">
      <header className="bg-[#1f2937] border-b border-[#374151] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">KT</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">KidTube Parent Controls</p>
            <p className="text-[#6b7280] text-xs">Managing your family's viewing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-[#9ca3af] hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors">
            <IcTv size={14} /><span className="hidden sm:inline">Kid View</span>
          </button>
          <button onClick={() => { d({ t: 'LOGOUT' }); navigate('/'); }}
            className="flex items-center gap-1.5 text-[#9ca3af] hover:text-red-400 text-sm px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors">
            <IcLogOut size={14} /><span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <nav className="w-48 bg-[#1f2937] border-r border-[#374151] flex-col py-4 gap-1 px-2 hidden sm:flex">
          {P_NAV.map(n => (
            <button key={n.id} onClick={() => navigate(`/parent/${n.id}`)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors ${sec === n.id ? 'bg-blue-600 text-white' : 'text-[#9ca3af] hover:bg-[#374151] hover:text-white'}`}>
              <n.Ic size={16} />{n.label}
              {n.badge && pending > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pending}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom nav — mobile */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#1f2937] border-t border-[#374151] flex z-50">
          {P_NAV.map(n => (
            <button key={n.id} onClick={() => navigate(`/parent/${n.id}`)}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium ${sec === n.id ? 'text-blue-400' : 'text-[#6b7280]'}`}>
              <n.Ic size={16} />{n.label.split(' ')[0]}
              {n.badge && pending > 0 && (
                <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{pending}</span>
              )}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          {P_PAGES[sec] || <PDash />}
        </main>
      </div>
    </div>
  );
}
