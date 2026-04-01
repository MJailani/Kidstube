import { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { useHashRouter, navigate } from './router';
import KidLayout from './layouts/KidLayout';
import ParentLayout from './layouts/ParentLayout';
import PinEntry from './layouts/PinEntry';
import KidHome from './pages/kid/KidHome';
import ChannelPage from './pages/kid/ChannelPage';
import VideoPlayer from './pages/kid/VideoPlayer';
import LoadingGrid from './components/LoadingGrid';

export default function App() {
  const { s, authReady, hasSupabaseAuth } = useApp();
  const path = useHashRouter();

  useEffect(() => {
    if (path === '/parent' && s.authed) navigate('/parent/dashboard');
  }, [path, s.authed]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [path]);

  if (hasSupabaseAuth && !authReady) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
        <LoadingGrid label="Checking parent account..." />
      </div>
    );
  }

  if (path === '/' || path === '') return <KidLayout><KidHome /></KidLayout>;
  if (path.startsWith('/channel/')) return <KidLayout><ChannelPage chId={path.split('/')[2]} /></KidLayout>;
  if (path.startsWith('/watch/')) return <KidLayout><VideoPlayer vidId={path.split('/')[2]} /></KidLayout>;
  if (path === '/parent') return s.authed ? null : <PinEntry />;
  if (path.startsWith('/parent/')) return s.authed ? <ParentLayout sec={path.split('/')[2] || 'dashboard'} /> : <PinEntry />;
  return <KidLayout><KidHome /></KidLayout>;
}
