import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { CHANNELS, DFLT } from '../config';
import { fetchChannelVideos } from '../api';
import { HAS_SUPABASE_CONFIG, supabase } from '../lib/supabase';
import {
  approveUnlockRequest,
  createChildProfile,
  createUnlockRequest,
  deleteCustomChannel,
  denyUnlockRequest,
  disableProfileChannel,
  enableProfileChannel,
  ensureInitialChildProfile,
  getProfileBundle,
  replaceProfileKeywords,
  updateProfileFilters,
} from '../lib/supabaseProfileApi';

const STORAGE_KEY = 'kt4';
const PROFILE_STORAGE_PREFIX = 'kt_active_profile_';

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return s ? { ...DFLT, ...s, authed: false, videos: {}, loading: {} } : DFLT;
  } catch {
    return DFLT;
  }
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
    case 'AUTH_SET':   return { ...s, authed: !!a.value };
    case 'PIN':        return { ...s, pin: a.pin };
    case 'SET_FILTERS': return { ...s, filters: a.filters };
    case 'SET_PROFILE_CHANNELS':
      return {
        ...s,
        wl: a.whitelist,
        customChannels: a.customChannels || [],
      };
    case 'SET_PROFILE_MODERATION':
      return {
        ...s,
        requests: a.requests || [],
        approved: a.approved || [],
      };
    case 'TOGGLE_CH':  { const w = s.wl; return { ...s, wl: w.includes(a.id) ? w.filter((x) => x !== a.id) : [...w, a.id] }; }
    case 'ADD_CH': {
      const ccs = s.customChannels || [];
      if (ccs.find((entry) => entry.id === a.ch.id) || CHANNELS.find((entry) => entry.id === a.ch.id)) return s;
      return { ...s, customChannels: [...ccs, a.ch], wl: [...s.wl, a.ch.id] };
    }
    case 'DEL_CH':     return { ...s, customChannels: (s.customChannels || []).filter((entry) => entry.id !== a.id), wl: s.wl.filter((entry) => entry !== a.id) };
    case 'SET_F':      return { ...s, filters: { ...s.filters, [a.k]: a.v } };
    case 'ADD_KW':     { const k = a.kw.trim().toLowerCase(); return (!k || s.filters.keywords.includes(k)) ? s : { ...s, filters: { ...s.filters, keywords: [...s.filters.keywords, k] } }; }
    case 'DEL_KW':     return { ...s, filters: { ...s.filters, keywords: s.filters.keywords.filter((entry) => entry !== a.kw) } };
    case 'LOG':        { const e = { ...a.e, at: new Date().toISOString() }; return { ...s, history: [e, ...s.history.filter((entry) => entry.id !== e.id)].slice(0, 200) }; }
    case 'REQ':        return s.requests.find((request) => request.vid === a.r.vid) ? s : { ...s, requests: [{ ...a.r, rid: Date.now() + '', at: new Date().toISOString() }, ...s.requests] };
    case 'APPROVE':    {
      const r = s.requests.find((entry) => entry.rid === a.rid);
      return {
        ...s,
        requests: s.requests.filter((entry) => entry.rid !== a.rid),
        approved:
          r && !r.short && !s.approved.includes(r.vid)
            ? [...s.approved, r.vid]
            : s.approved,
      };
    }
    case 'DENY':       return { ...s, requests: s.requests.filter((entry) => entry.rid !== a.rid) };
    case 'CLR_HIST':   return { ...s, history: [] };
    case 'ADD_PIN':    { const ps = s.pinned || []; return ps.find((entry) => entry.id === a.v.id) ? s : { ...s, pinned: [a.v, ...ps] }; }
    case 'DEL_PIN':    return { ...s, pinned: (s.pinned || []).filter((entry) => entry.id !== a.id) };
    case 'VIDS_START': return { ...s, loading: { ...s.loading, [a.ch]: 'loading' } };
    case 'VIDS_OK':    return { ...s, loading: { ...s.loading, [a.ch]: 'ok' }, videos: { ...s.videos, [a.ch]: a.videos } };
    case 'VIDS_ERR':   return { ...s, loading: { ...s.loading, [a.ch]: 'err' } };
    default:           return s;
  }
}

function profileStorageKey(userId) {
  return `${PROFILE_STORAGE_PREFIX}${userId}`;
}

function mapBundleToModeration(bundle) {
  const requests = (bundle.requests || [])
    .filter((request) => request.status === 'pending')
    .map((request) => ({
      rid: request.id,
      vid: request.video_id,
      title: request.title,
      chName: request.channel_name || '',
      thumb: request.thumb || '',
      short: !!request.is_short,
      at: request.requested_at,
    }));

  const approved = (bundle.approvals || []).map((entry) => entry.video_id);
  return { requests, approved };
}

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [s, d] = useReducer(reducer, undefined, load);
  const [authReady, setAuthReady] = useState(!HAS_SUPABASE_CONFIG);
  const [authUser, setAuthUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState('');
  const [profilesReady, setProfilesReady] = useState(!HAS_SUPABASE_CONFIG);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => save(s), [s]);

  useEffect(() => {
    if (!HAS_SUPABASE_CONFIG || !supabase) {
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('Supabase session error', error);
      }

      const user = data.session?.user || null;
      setAuthUser(user);
      d({ t: 'AUTH_SET', value: !!user });
      setAuthReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setAuthUser(user);
      d({ t: 'AUTH_SET', value: !!user });
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const channelIds = [...new Set([...CHANNELS.map((channel) => channel.id), ...s.wl, ...(s.customChannels || []).map((channel) => channel.id)])];

    channelIds.forEach((chId) => {
      if (!s.loading[chId]) {
        d({ t: 'VIDS_START', ch: chId });
        fetchChannelVideos(chId)
          .then((videos) => d({ t: 'VIDS_OK', ch: chId, videos }))
          .catch((err) => {
            console.error('KidTube API error', chId, err);
            d({ t: 'VIDS_ERR', ch: chId });
          });
      }
    });
  }, [s.customChannels, s.loading, s.wl]);

  useEffect(() => {
    if (!HAS_SUPABASE_CONFIG) {
      setProfilesReady(true);
      return;
    }

    if (!authUser) {
      setProfiles([]);
      setActiveProfileId('');
      setProfilesReady(true);
      setProfileError('');
      return;
    }

    let cancelled = false;

    async function loadProfiles() {
      setProfilesReady(false);
      setProfileError('');

      try {
        const nextProfiles = await ensureInitialChildProfile();
        if (cancelled) return;

        setProfiles(nextProfiles);

        let preferredId = '';
        try {
          preferredId = localStorage.getItem(profileStorageKey(authUser.id)) || '';
        } catch {}

        const selected =
          nextProfiles.find((profile) => profile.id === preferredId) ||
          nextProfiles.find((profile) => profile.is_default) ||
          nextProfiles[0];

        setActiveProfileId(selected?.id || '');
      } catch (error) {
        if (cancelled) return;
        setProfileError(error.message || 'Could not load child profiles.');
      } finally {
        if (!cancelled) {
          setProfilesReady(true);
        }
      }
    }

    loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  useEffect(() => {
    if (!HAS_SUPABASE_CONFIG || !authUser || !activeProfileId) {
      return;
    }

    try {
      localStorage.setItem(profileStorageKey(authUser.id), activeProfileId);
    } catch {}
  }, [activeProfileId, authUser]);

  useEffect(() => {
    if (!HAS_SUPABASE_CONFIG || !authUser || !activeProfileId) {
      return;
    }

    let cancelled = false;

    async function loadProfileBundle() {
      setProfileBusy(true);
      setProfileError('');

      try {
        const bundle = await getProfileBundle(activeProfileId);
        if (cancelled) return;

        d({
          t: 'SET_FILTERS',
          filters: {
            blockShorts: bundle.filters?.block_shorts ?? DFLT.filters.blockShorts,
            minSecs: bundle.filters?.min_secs ?? DFLT.filters.minSecs,
            keywords: bundle.keywords?.length ? bundle.keywords : [],
          },
        });

        const customChannels = (bundle.channels || []).filter((channel) => !channel.builtin);
        const whitelist = (bundle.channels || []).map((channel) => channel.id);

        d({
          t: 'SET_PROFILE_CHANNELS',
          whitelist,
          customChannels,
        });

        d({
          t: 'SET_PROFILE_MODERATION',
          ...mapBundleToModeration(bundle),
        });
      } catch (error) {
        if (!cancelled) {
          setProfileError(error.message || 'Could not load profile settings.');
        }
      } finally {
        if (!cancelled) {
          setProfileBusy(false);
        }
      }
    }

    loadProfileBundle();

    return () => {
      cancelled = true;
    };
  }, [activeProfileId, authUser]);

  async function loginParent({ email, password, pin }) {
    if (HAS_SUPABASE_CONFIG && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const user = data.user || data.session?.user || null;
      setAuthUser(user);
      d({ t: 'AUTH_SET', value: !!user });
      return { user };
    }

    if (pin === s.pin) {
      d({ t: 'LOGIN', pin });
      return { user: { id: 'local-parent' } };
    }

    throw new Error('Incorrect PIN. Try again.');
  }

  async function signupParent({ email, password, displayName }) {
    if (!HAS_SUPABASE_CONFIG || !supabase) {
      throw new Error('Supabase is not configured yet.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    if (error) throw error;

    const user = data.user || data.session?.user || null;
    if (user) {
      setAuthUser(user);
      d({ t: 'AUTH_SET', value: true });
    }

    return {
      user,
      needsEmailConfirmation: !data.session,
    };
  }

  async function logoutParent() {
    if (HAS_SUPABASE_CONFIG && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthUser(null);
      setProfiles([]);
      setActiveProfileId('');
      d({ t: 'AUTH_SET', value: false });
      return;
    }

    d({ t: 'LOGOUT' });
  }

  async function selectProfile(profileId) {
    setActiveProfileId(profileId);
  }

  async function addProfile(name) {
    if (!HAS_SUPABASE_CONFIG || !authUser) {
      throw new Error('Supabase profiles are not available.');
    }

    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Enter a profile name.');
    }

    const palette = ['#ff0000', '#2563eb', '#7c3aed', '#16a34a', '#ea580c', '#db2777'];
    const profile = await createChildProfile({
      name: trimmed,
      avatarColor: palette[profiles.length % palette.length],
      isDefault: profiles.length === 0,
    });

    const nextProfiles = [...profiles, profile];
    setProfiles(nextProfiles);
    setActiveProfileId(profile.id);
    return profile;
  }

  async function setProfileFilter(key, value) {
    if (!HAS_SUPABASE_CONFIG || !activeProfileId) {
      d({ t: 'SET_F', k: key, v: value });
      return;
    }

    const nextFilters = { ...s.filters, [key]: value };
    d({ t: 'SET_FILTERS', filters: nextFilters });
    await updateProfileFilters(activeProfileId, nextFilters);
  }

  async function addProfileKeyword(keyword) {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed || s.filters.keywords.includes(trimmed)) {
      return;
    }

    const nextKeywords = [...s.filters.keywords, trimmed];
    d({ t: 'SET_FILTERS', filters: { ...s.filters, keywords: nextKeywords } });

    if (HAS_SUPABASE_CONFIG && activeProfileId) {
      await replaceProfileKeywords(activeProfileId, nextKeywords);
    }
  }

  async function removeProfileKeyword(keyword) {
    const nextKeywords = s.filters.keywords.filter((entry) => entry !== keyword);
    d({ t: 'SET_FILTERS', filters: { ...s.filters, keywords: nextKeywords } });

    if (HAS_SUPABASE_CONFIG && activeProfileId) {
      await replaceProfileKeywords(activeProfileId, nextKeywords);
    }
  }

  async function toggleProfileChannel(channel) {
    const enabled = s.wl.includes(channel.id);

    if (!HAS_SUPABASE_CONFIG || !activeProfileId) {
      d({ t: 'TOGGLE_CH', id: channel.id });
      return;
    }

    const nextWhitelist = enabled
      ? s.wl.filter((id) => id !== channel.id)
      : [...s.wl, channel.id];

    const customChannelExists = (s.customChannels || []).some((entry) => entry.id === channel.id);
    const nextCustomChannels = !channel.builtin && !customChannelExists
      ? [...(s.customChannels || []), channel]
      : s.customChannels;

    d({
      t: 'SET_PROFILE_CHANNELS',
      whitelist: nextWhitelist,
      customChannels: nextCustomChannels,
    });

    if (enabled) {
      await disableProfileChannel(activeProfileId, channel.id);
    } else {
      await enableProfileChannel(activeProfileId, channel);
    }
  }

  async function addCustomProfileChannel(channel) {
    if (!HAS_SUPABASE_CONFIG || !activeProfileId) {
      d({ t: 'ADD_CH', ch: channel });
      return;
    }

    await enableProfileChannel(activeProfileId, channel);

    const customChannels = (s.customChannels || []).some((entry) => entry.id === channel.id)
      ? s.customChannels
      : [...(s.customChannels || []), channel];

    d({
      t: 'SET_PROFILE_CHANNELS',
      whitelist: [...s.wl, channel.id],
      customChannels,
    });
  }

  async function removeCustomProfileChannel(channelId) {
    if (!HAS_SUPABASE_CONFIG || !activeProfileId) {
      d({ t: 'DEL_CH', id: channelId });
      return;
    }

    await disableProfileChannel(activeProfileId, channelId);
    await deleteCustomChannel(channelId);

    d({
      t: 'SET_PROFILE_CHANNELS',
      whitelist: s.wl.filter((entry) => entry !== channelId),
      customChannels: (s.customChannels || []).filter((entry) => entry.id !== channelId),
    });
  }

  async function requestVideoUnlock(request) {
    if (!HAS_SUPABASE_CONFIG || !activeProfileId) {
      d({ t: 'REQ', r: request });
      return;
    }

    const created = await createUnlockRequest(activeProfileId, request);
    const nextRequests = s.requests.find((entry) => entry.vid === request.vid)
      ? s.requests
      : [{
        rid: created.id,
        vid: request.vid,
        title: request.title,
        chName: request.chName || '',
        thumb: request.thumb || '',
        short: !!request.short,
        at: created.requested_at || new Date().toISOString(),
      }, ...s.requests];

    d({
      t: 'SET_PROFILE_MODERATION',
      requests: nextRequests,
      approved: s.approved,
    });
  }

  async function approveVideoRequest(requestId) {
    if (!HAS_SUPABASE_CONFIG || !activeProfileId) {
      d({ t: 'APPROVE', rid: requestId });
      return;
    }

    const request = s.requests.find((entry) => entry.rid === requestId);
    await approveUnlockRequest(activeProfileId, requestId);

    d({
      t: 'SET_PROFILE_MODERATION',
      requests: s.requests.filter((entry) => entry.rid !== requestId),
      approved:
        request && !request.short && !s.approved.includes(request.vid)
          ? [...s.approved, request.vid]
          : s.approved,
    });
  }

  async function denyVideoRequest(requestId) {
    if (!HAS_SUPABASE_CONFIG || !activeProfileId) {
      d({ t: 'DENY', rid: requestId });
      return;
    }

    await denyUnlockRequest(activeProfileId, requestId);
    d({
      t: 'SET_PROFILE_MODERATION',
      requests: s.requests.filter((entry) => entry.rid !== requestId),
      approved: s.approved,
    });
  }

  return (
    <Ctx.Provider
      value={{
        s,
        d,
        authReady,
        authUser,
        hasSupabaseAuth: HAS_SUPABASE_CONFIG,
        loginParent,
        signupParent,
        logoutParent,
        profiles,
        activeProfileId,
        activeProfile: profiles.find((profile) => profile.id === activeProfileId) || null,
        profilesReady,
        profileBusy,
        profileError,
        selectProfile,
        addProfile,
        setProfileFilter,
        addProfileKeyword,
        removeProfileKeyword,
        toggleProfileChannel,
        addCustomProfileChannel,
        removeCustomProfileChannel,
        requestVideoUnlock,
        approveVideoRequest,
        denyVideoRequest,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  return useContext(Ctx);
}
