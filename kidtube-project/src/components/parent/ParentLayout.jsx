import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, Filter, Clock, MessageCircle, LogOut, Tv } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

const NAV = [
  { to: '/parent/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/parent/channels', icon: List, label: 'Channels' },
  { to: '/parent/filters', icon: Filter, label: 'Filters' },
  { to: '/parent/history', icon: Clock, label: 'Watch History' },
  { to: '/parent/requests', icon: MessageCircle, label: 'Requests', badge: true },
];

export default function ParentLayout() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  function logout() {
    dispatch({ type: 'PARENT_LOGOUT' });
    navigate('/');
  }

  const pendingCount = state.pendingRequests.length;

  return (
    <div className="min-h-screen bg-[#111827] text-white flex flex-col">
      {/* ── Top Bar ── */}
      <header className="bg-[#1f2937] border-b border-[#374151] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">KT</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-none">KidTube Parent Controls</h1>
            <p className="text-[#6b7280] text-xs mt-0.5">Managing your family's viewing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-[#9ca3af] hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors"
          >
            <Tv size={14} />
            <span className="hidden sm:inline">Kid View</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-[#9ca3af] hover:text-red-400 text-sm px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar Nav ── */}
        <nav className="w-48 bg-[#1f2937] border-r border-[#374151] flex flex-col py-4 gap-1 px-2 hidden sm:flex">
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-[#9ca3af] hover:bg-[#374151] hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
              {badge && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Mobile Bottom Nav ── */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#1f2937] border-t border-[#374151] flex z-50">
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium relative ${
                  isActive ? 'text-blue-400' : 'text-[#6b7280]'
                }`
              }
            >
              <Icon size={18} />
              {label.split(' ')[0]}
              {badge && pendingCount > 0 && (
                <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
