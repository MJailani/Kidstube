// Real YouTube channels — videos are fetched live from the YouTube Data API v3.
// Channel IDs are the real UC... identifiers from YouTube.
export const CHANNELS = [
  {
    id: 'UCM1M7IQ6wN83MOyrOQaJeog',
    name: 'Jillian and Addie Laugh',
    handle: '@JillianandAddieLaugh',
    subscribers: '2.1M',
    color: '#E91E63',
    category: 'Family',
  },
  {
    id: 'UCLbyJSPEe2lx3jY-G0CFR3g',
    name: 'Vania Mania Kids',
    handle: '@VaniaManiaKids',
    subscribers: '15.6M',
    color: '#9C27B0',
    category: 'Family',
  },
  {
    id: 'UCx790OVgpTC1UVBQIqu3gnQ',
    name: 'Kids Roma Show',
    handle: '@KidsRomaShow',
    subscribers: '34.8M',
    color: '#FF5722',
    category: 'Family',
  },
  {
    id: 'UCN5Zf3Zyb9Bp9NeqtNwnc5w',
    name: 'Jillian and Addie',
    handle: '@JillianandAddie',
    subscribers: '4.3M',
    color: '#2196F3',
    category: 'Family',
  },
];

// No static videos — all video data is fetched live from the YouTube Data API.
// See src/context/AppContext.jsx for the fetch logic and src/api.js for helpers.
export const VIDEOS = [];
