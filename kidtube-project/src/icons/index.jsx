function Sv({ d, size = 16, cls = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      {[].concat(d).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

export const IcLeft    = p => <Sv {...p} d={['M19 12H5', 'M12 5l-7 7 7 7']} />;
export const IcShield  = p => <Sv {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
export const IcLock    = p => <Sv {...p} d={['M5 11h14v10H5z', 'M8 11V7a4 4 0 018 0v4']} />;
export const IcMsg     = p => <Sv {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />;
export const IcOk      = p => <Sv {...p} d={['M22 11.08V12a10 10 0 11-5.93-9.14', 'M22 4L12 14.01l-3-3']} />;
export const IcX       = p => <Sv {...p} d={['M18 6L6 18', 'M6 6l12 12']} />;
export const IcXcirc   = p => <Sv {...p} d={['M18 6L6 18', 'M6 6l12 12', 'M12 2a10 10 0 100 20A10 10 0 0012 2z']} />;
export const IcPlus    = p => <Sv {...p} d={['M12 5v14', 'M5 12h14']} />;
export const IcSearch  = p => <Sv {...p} d={['M11 17a6 6 0 100-12 6 6 0 000 12z', 'M21 21l-4.35-4.35']} />;
export const IcTrash   = p => <Sv {...p} d={['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6']} />;
export const IcClock   = p => <Sv {...p} d={['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 6v6l4 2']} />;
export const IcLogOut  = p => <Sv {...p} d={['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9']} />;
export const IcTv      = p => <Sv {...p} d={['M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z', 'M8 21h8', 'M12 17v4']} />;
export const IcKey     = p => <Sv {...p} d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />;
export const IcGrid    = p => <Sv {...p} d={['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z']} />;
export const IcFilter  = p => <Sv {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />;
export const IcList    = p => <Sv {...p} d={['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01']} />;
export const IcRefresh = p => <Sv {...p} d={['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15']} />;
export const IcLink    = p => <Sv {...p} d={['M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71']} />;
export const IcStar    = p => <Sv {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
export const IcVideo   = p => <Sv {...p} d={['M15 10l4.553-2.07A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z']} />;
