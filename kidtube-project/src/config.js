export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();
export const HAS_PROXY_URL = API_BASE_URL.length > 0;

export const CHANNELS = [
  { id: 'UCM1M7IQ6wN83MOyrOQaJeog', name: 'Jillian and Addie Laugh', handle: '@JillianandAddieLaugh', subscribers: '2.1M', color: '#E91E63', category: 'Family', builtin: true },
  { id: 'UCLbyJSPEe2lx3jY-G0CFR3g', name: 'Vania Mania Kids', handle: '@VaniaManiaKids', subscribers: '15.6M', color: '#9C27B0', category: 'Family', builtin: true },
  { id: 'UCx790OVgpTC1UVBQIqu3gnQ', name: 'Kids Roma Show', handle: '@KidsRomaShow', subscribers: '34.8M', color: '#FF5722', category: 'Family', builtin: true },
  { id: 'UCN5Zf3Zyb9Bp9NeqtNwnc5w', name: 'Jillian and Addie', handle: '@JillianandAddie', subscribers: '4.3M', color: '#2196F3', category: 'Family', builtin: true },
];

export const DFLT = {
  authed: false,
  pin: '1234',
  wl: CHANNELS.map((channel) => channel.id),
  filters: { blockShorts: true, minSecs: 60, keywords: ['prank', 'challenge'] },
  history: [],
  requests: [],
  approved: [],
  customChannels: [],
  pinned: [],
  videos: {},
  loading: {},
};
