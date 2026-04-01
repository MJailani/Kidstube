import { useState, useEffect } from 'react';

export function useHashRouter() {
  const get = () => window.location.hash.replace(/^#/, '') || '/';
  const [path, setPath] = useState(get);
  useEffect(() => {
    const h = () => setPath(get());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return path;
}

export function navigate(to) {
  window.location.hash = to;
}

export function Link({ to, className, children, ...p }) {
  return <a href={`#${to}`} className={className} {...p}>{children}</a>;
}
