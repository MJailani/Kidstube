// ── CONFIG ────────────────────────────────────────────────────────────────────
export const API_KEY = 'AIzaSyD7hy8SWw8uIzx0ks986PnyGamm25brpY0';

// Built-in channels — always present, can be toggled but not deleted
export const CHANNELS = [
  { id: 'UCM1M7IQ6wN83MOyrOQaJeog', name: 'Jillian and Addie Laugh', handle: '@JillianandAddieLaugh', subscribers: '2.1M', color: '#E91E63', category: 'Family', builtin: true },
  { id: 'UCLbyJSPEe2lx3jY-G0CFR3g', name: 'Vania Mania Kids',         handle: '@VaniaManiaKids',       subscribers: '15.6M', color: '#9C27B0', category: 'Family', builtin: true },
  { id: 'UCx790OVgpTC1UVBQIqu3gnQ', name: 'Kids Roma Show',            handle: '@KidsRomaShow',         subscribers: '34.8M', color: '#FF5722', category: 'Family', builtin: true },
  { id: 'UCN5Zf3Zyb9Bp9NeqtNwnc5w', name: 'Jillian and Addie',         handle: '@JillianandAddie',      subscribers: '4.3M',  color: '#2196F3', category: 'Family', builtin: true },
];

export const DFLT = {
  authed: false,
  pin: '1234',
  wl: CHANNELS.map(c => c.id),
  filters: { blockShorts: true, minSecs: 60, keywords: ['prank', 'challenge'] },
  history: [],
  requests: [],
  approved: [],
  customChannels: [],  // parent-added channels
  pinned: [],          // parent-pinned videos (bypass all filters)
  videos: {},          // NOT persisted
  loading: {},         // NOT persisted
};
