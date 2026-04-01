import { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { useHashRouter, navigate } from './router';
import KidLayout from './layouts/KidLayout';
import ParentLayout from './layouts/ParentLayout';
import PinEntry from './layouts/PinEntry';
import KidHome from './pages/kid/KidHome';
import ChannelPage from './pages/kid/ChannelPage';
import VideoPlayer from './pages/kid/VideoPlayer';

export default function App() {
  const { s } = useApp();
  const path = useHashRouter();

  useEffect(() => {
    if (path === '/parent' && s.authed) navigate('/parent/dashboard');
  }, [path, s.authed]);

  if (path === '/' || path === '') return <KidLayout><KidHome /></KidLayout>;
  if (path.startsWith('/channel/')) return <KidLayout><ChannelPage chId={path.split('/')[2]} /></KidLayout>;
  if (path.startsWith('/watch/')) return <KidLayout><VideoPlayer vidId={path.split('/')[2]} /></KidLayout>;
  if (path === '/parent') return s.authed ? null : <PinEntry />;
  if (path.startsWith('/parent/')) return s.authed ? <ParentLayout sec={path.split('/')[2] || 'dashboard'} /> : <PinEntry />;
  return <KidLayout><KidHome /></KidLayout>;
}
