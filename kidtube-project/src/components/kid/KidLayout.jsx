import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function KidLayout() {
  const navigate = useNavigate();
  const { state } = useApp();
  const pendingCount = state.pendingRequests.length;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-[#272727] flex items-center justify-between px-4 py-2 h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 select-none">
          <svg viewBox="0 0 90 20" width="90" height="20">
            <rect x="0" y="0" width="28" height="20" rx="4" fill="#ff0000" />
            <polygon points="11,4 11,16 21,10" fill="white" />
            <text x="32" y="15" fontFamily="Arial" fontWeight="700" fontSize="16" fill="white">
              KidTube
            </text>
          </svg>
        </Link>

        {/* Center — brand tagline */}
        <span className="hidden sm:block text-[#aaa] text-sm">
          Safe videos, hand-picked for you
        </span>

        {/* Right — Parent mode button */}
        <button
          onClick={() => navigate('/parent')}
          className="relative flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] text-[#aaa] hover:text-white rounded-full px-3 py-1.5 text-sm font-medium"
        >
          <Shield size={15} />
          <span>Parent</span>
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
