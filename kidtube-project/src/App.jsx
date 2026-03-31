import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext.jsx';

// Kid Mode
import KidLayout from './components/kid/KidLayout.jsx';
import KidHome from './components/kid/KidHome.jsx';
import ChannelPage from './components/kid/ChannelPage.jsx';
import VideoPlayer from './components/kid/VideoPlayer.jsx';

// Parent Mode
import PinEntry from './components/parent/PinEntry.jsx';
import ParentLayout from './components/parent/ParentLayout.jsx';
import Dashboard from './components/parent/Dashboard.jsx';
import ChannelManager from './components/parent/ChannelManager.jsx';
import FilterSettings from './components/parent/FilterSettings.jsx';
import WatchHistory from './components/parent/WatchHistory.jsx';
import PendingRequests from './components/parent/PendingRequests.jsx';

// Guard: redirect to PIN if parent isn't authenticated
function ParentGuard({ children }) {
  const { state } = useApp();
  if (!state.isParentAuthed) return <Navigate to="/parent" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Kid Routes ───────────────────────────────── */}
      <Route element={<KidLayout />}>
        <Route index element={<KidHome />} />
        <Route path="channel/:channelId" element={<ChannelPage />} />
        <Route path="watch/:videoId" element={<VideoPlayer />} />
      </Route>

      {/* ── Parent Routes ────────────────────────────── */}
      <Route path="/parent" element={<PinEntry />} />
      <Route
        path="/parent/*"
        element={
          <ParentGuard>
            <ParentLayout />
          </ParentGuard>
        }
      >
        <Route index element={<Navigate to="/parent/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="channels" element={<ChannelManager />} />
        <Route path="filters" element={<FilterSettings />} />
        <Route path="history" element={<WatchHistory />} />
        <Route path="requests" element={<PendingRequests />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
