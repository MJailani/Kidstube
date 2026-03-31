import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CHANNELS } from '../mockData.js';
import { fetchChannelVideos } from '../api.js';

// ─────────────────────────────────────────────────────────────────────────────
// Default state
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  blockShorts: true,
  minDurationSeconds: 60,
  blockedKeywords: ['prank', 'challenge'],
};

const DEFAULT_STATE = {
  isParentAuthed: false,
  parentPin: '1234',
  whitelistedChannelIds: CHANNELS.map(c => c.id),
  filters: DEFAULT_FILTERS,
  watchHistory: [],
  pendingRequests: [],
  approvedVideoIds: [],
  // Video data loaded from API (not persisted)
  videos: {},    // channelId → array of video objects
  loading: {},   // channelId → 'loading' | 'ok' | 'err'
};

// ─────────────────────────────────────────────────────────────────────────────
// Load/save
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'kidtube_state_v3';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...saved,
      isParentAuthed: false,
      videos: {},
      loading: {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state) {
  try {
    const { isParentAuthed, videos, loading, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'PARENT_LOGIN':
      return action.pin === state.parentPin ? { ...state, isParentAuthed: true } : state;

    case 'PARENT_LOGOUT':
      return { ...state, isParentAuthed: false };

    case 'CHANGE_PIN':
      return { ...state, parentPin: action.newPin };

    case 'TOGGLE_CHANNEL': {
      const id = action.channelId;
      const current = state.whitelistedChannelIds;
      const updated = current.includes(id)
        ? current.filter(c => c !== id)
        : [...current, id];
      return { ...state, whitelistedChannelIds: updated };
    }

    case 'UPDATE_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };

    case 'ADD_KEYWORD': {
      const kw = action.keyword.trim().toLowerCase();
      if (!kw || state.filters.blockedKeywords.includes(kw)) return state;
      return { ...state, filters: { ...state.filters, blockedKeywords: [...state.filters.blockedKeywords, kw] } };
    }

    case 'REMOVE_KEYWORD':
      return { ...state, filters: { ...state.filters, blockedKeywords: state.filters.blockedKeywords.filter(k => k !== action.keyword) } };

    case 'ADD_TO_HISTORY': {
      const entry = { ...action.entry, watchedAt: new Date().toISOString() };
      const recent = state.watchHistory.slice(0, 10);
      const isDuplicate = recent.some(h => h.videoId === entry.videoId);
      const history = isDuplicate ? state.watchHistory : [entry, ...state.watchHistory].slice(0, 200);
      return { ...state, watchHistory: history };
    }

    case 'REQUEST_VIDEO': {
      if (state.pendingRequests.find(r => r.videoId === action.request.videoId)) return state;
      return {
        ...state,
        pendingRequests: [
          { ...action.request, requestedAt: new Date().toISOString(), id: Date.now().toString() },
          ...state.pendingRequests,
        ],
      };
    }

    case 'APPROVE_REQUEST': {
      const req = state.pendingRequests.find(r => r.id === action.requestId);
      const updatedReqs = state.pendingRequests.filter(r => r.id !== action.requestId);
      const approvedVideoIds = [...(state.approvedVideoIds || [])];
      if (req && !approvedVideoIds.includes(req.videoId)) approvedVideoIds.push(req.videoId);
      return { ...state, pendingRequests: updatedReqs, approvedVideoIds };
    }

    case 'DENY_REQUEST':
      return { ...state, pendingRequests: state.pendingRequests.filter(r => r.id !== action.requestId) };

    case 'CLEAR_HISTORY':
      return { ...state, watchHistory: [] };

    // API video loading
    case 'VIDS_START':
      return { ...state, loading: { ...state.loading, [action.channelId]: 'loading' } };

    case 'VIDS_OK':
      return {
        ...state,
        loading: { ...state.loading, [action.channelId]: 'ok' },
        videos: { ...state.videos, [action.channelId]: action.videos },
      };

    case 'VIDS_ERR':
      return { ...state, loading: { ...state.loading, [action.channelId]: 'err' } };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => { saveState(state); }, [state]);

  // Fetch all channels on mount
  useEffect(() => {
    CHANNELS.forEach(ch => {
      dispatch({ type: 'VIDS_START', channelId: ch.id });
      fetchChannelVideos(ch.id)
        .then(videos => dispatch({ type: 'VIDS_OK', channelId: ch.id, videos }))
        .catch(err => {
          console.error('KidTube API error:', ch.name, err);
          dispatch({ type: 'VIDS_ERR', channelId: ch.id });
        });
    });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter helper
// ─────────────────────────────────────────────────────────────────────────────
export function filterVideos(videos, filters) {
  const allowed = [], blocked = [];
  for (const v of videos) {
    if (filters.blockShorts && v.short) continue;
    if (v.secs > 0 && v.secs < filters.minDurationSeconds) {
      blocked.push({ ...v, why: `Too short (${v.dur})` }); continue;
    }
    const hay = (v.title + ' ' + v.desc).toLowerCase();
    const hit = filters.blockedKeywords?.find(k => hay.includes(k.toLowerCase()));
    if (hit) { blocked.push({ ...v, why: `Keyword: "${hit}"` }); continue; }
    allowed.push(v);
  }
  return { allowed, blocked };
}
