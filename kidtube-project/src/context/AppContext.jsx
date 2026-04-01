import { createContext, useContext, useReducer, useEffect } from 'react';
import { CHANNELS, DFLT } from '../config';
import { getAllChannels, fetchChannelVideos } from '../api';

const STORAGE_KEY = 'kt4';

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return s ? { ...DFLT, ...s, authed: false, videos: {}, loading: {} } : DFLT;
  } catch { return DFLT; }
}

function save(s) {
  try {
    const { authed, videos, loading, ...r } = s;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  } catch {}
}

function reducer(s, a) {
  switch (a.t) {
    case 'LOGIN':      return a.pin === s.pin ? { ...s, authed: true } : s;
    case 'LOGOUT':     return { ...s, authed: false };
    case 'PIN':        return { ...s, pin: a.pin };
    case 'TOGGLE_CH':  { const w = s.wl; return { ...s, wl: w.includes(a.id) ? w.filter(x => x !== a.id) : [...w, a.id] }; }
    case 'ADD_CH': {
      const ccs = s.customChannels || [];
      if (ccs.find(x => x.id === a.ch.id) || CHANNELS.find(x => x.id === a.ch.id)) return s;
      return { ...s, customChannels: [...ccs, a.ch], wl: [...s.wl, a.ch.id] };
    }
    case 'DEL_CH':     return { ...s, customChannels: (s.customChannels || []).filter(x => x.id !== a.id), wl: s.wl.filter(x => x !== a.id) };
    case 'SET_F':      return { ...s, filters: { ...s.filters, [a.k]: a.v } };
    case 'ADD_KW':     { const k = a.kw.trim().toLowerCase(); return (!k || s.filters.keywords.includes(k)) ? s : { ...s, filters: { ...s.filters, keywords: [...s.filters.keywords, k] } }; }
    case 'DEL_KW':     return { ...s, filters: { ...s.filters, keywords: s.filters.keywords.filter(k => k !== a.kw) } };
    case 'LOG':        { const e = { ...a.e, at: new Date().toISOString() }; return { ...s, history: [e, ...s.history.filter(x => x.id !== e.id)].slice(0, 200) }; }
    case 'REQ':        return s.requests.find(r => r.vid === a.r.vid) ? s : { ...s, requests: [{ ...a.r, rid: Date.now() + '', at: new Date().toISOString() }, ...s.requests] };
    case 'APPROVE':    { const r = s.requests.find(x => x.rid === a.rid); return { ...s, requests: s.requests.filter(x => x.rid !== a.rid), approved: r && !s.approved.includes(r.vid) ? [...s.approved, r.vid] : s.approved }; }
    case 'DENY':       return { ...s, requests: s.requests.filter(x => x.rid !== a.rid) };
    case 'CLR_HIST':   return { ...s, history: [] };
    case 'ADD_PIN':    { const ps = s.pinned || []; return ps.find(x => x.id === a.v.id) ? s : { ...s, pinned: [a.v, ...ps] }; }
    case 'DEL_PIN':    return { ...s, pinned: (s.pinned || []).filter(x => x.id !== a.id) };
    case 'VIDS_START': return { ...s, loading: { ...s.loading, [a.ch]: 'loading' } };
    case 'VIDS_OK':    return { ...s, loading: { ...s.loading, [a.ch]: 'ok' }, videos: { ...s.videos, [a.ch]: a.videos } };
    case 'VIDS_ERR':   return { ...s, loading: { ...s.loading, [a.ch]: 'err' } };
    default:           return s;
  }
}

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [s, d] = useReducer(reducer, undefined, load);
  useEffect(() => save(s), [s]);

  // Fetch all channels (built-in + custom saved in localStorage) on mount
  useEffect(() => {
    getAllChannels(s).forEach(ch => {
      d({ t: 'VIDS_START', ch: ch.id });
      fetchChannelVideos(ch.id)
        .then(videos => d({ t: 'VIDS_OK', ch: ch.id, videos }))
        .catch(err => { console.error('KidTube API error', ch.name, err); d({ t: 'VIDS_ERR', ch: ch.id }); });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch newly added channels that don't have data yet
  useEffect(() => {
    s.wl.forEach(chId => {
      if (!s.loading[chId]) {
        d({ t: 'VIDS_START', ch: chId });
        fetchChannelVideos(chId)
          .then(videos => d({ t: 'VIDS_OK', ch: chId, videos }))
          .catch(() => d({ t: 'VIDS_ERR', ch: chId }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.wl.join(',')]);

  return <Ctx.Provider value={{ s, d }}>{children}</Ctx.Provider>;
}

export function useApp() { return useContext(Ctx); }
