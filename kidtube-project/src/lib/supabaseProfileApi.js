import { CHANNELS, DFLT } from '../config';
import { supabase, HAS_SUPABASE_CONFIG } from './supabase';

function requireSupabase() {
  if (!HAS_SUPABASE_CONFIG || !supabase) {
    throw new Error('Missing Supabase config. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.');
  }
}

export async function getCurrentParent() {
  requireSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user || null;
}

async function ensureParentAccountRow() {
  const parent = await getCurrentParent();
  if (!parent) {
    throw new Error('You need to sign in before using parent data.');
  }

  const displayName =
    parent.user_metadata?.display_name ||
    parent.email?.split('@')[0] ||
    'Parent';

  const { data: existing, error: existingError } = await supabase
    .from('parent_accounts')
    .select('id')
    .eq('id', parent.id)
    .maybeSingle();

  if (existingError) throw existingError;

  const payload = {
    id: parent.id,
    email: parent.email,
    display_name: displayName,
  };

  const { error } = existing
    ? await supabase.from('parent_accounts').update({
      email: payload.email,
      display_name: payload.display_name,
    }).eq('id', parent.id)
    : await supabase.from('parent_accounts').insert(payload);

  if (error) throw error;
  return parent;
}

export async function listChildProfiles() {
  requireSupabase();
  const { data, error } = await supabase
    .from('child_profiles')
    .select('id, name, avatar_color, is_default, created_at')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createChildProfile({ name, avatarColor = '#ff0000', isDefault = false }) {
  requireSupabase();
  const parent = await ensureParentAccountRow();

  const { data, error } = await supabase
    .from('child_profiles')
    .insert({
      parent_id: parent.id,
      name,
      avatar_color: avatarColor,
      is_default: isDefault,
    })
    .select('id, name, avatar_color, is_default, created_at')
    .single();

  if (error) throw error;

  await supabase.from('profile_filters').upsert({
    profile_id: data.id,
    block_shorts: DFLT.filters.blockShorts,
    min_secs: DFLT.filters.minSecs,
  });

  if (DFLT.filters.keywords.length) {
    const keywordRows = DFLT.filters.keywords.map((keyword) => ({
      profile_id: data.id,
      keyword,
    }));
    const { error: keywordError } = await supabase.from('profile_keywords').insert(keywordRows);
    if (keywordError) throw keywordError;
  }

  const builtinChannels = CHANNELS.map((channel) => ({
    id: channel.id,
    name: channel.name,
    handle: channel.handle,
    subscribers: channel.subscribers,
    color: channel.color,
    category: channel.category,
    thumb: channel.thumb || null,
    builtin: true,
  }));

  const { data: existingChannels, error: existingChannelsError } = await supabase
    .from('channels')
    .select('id')
    .in('id', CHANNELS.map((channel) => channel.id));

  if (existingChannelsError) throw existingChannelsError;

  const existingIds = new Set((existingChannels || []).map((channel) => channel.id));
  const missingBuiltinChannels = builtinChannels.filter((channel) => !existingIds.has(channel.id));

  if (missingBuiltinChannels.length > 0) {
    const { error: channelInsertError } = await supabase.from('channels').insert(missingBuiltinChannels);
    if (channelInsertError) throw channelInsertError;
  }

  const profileChannelRows = CHANNELS.map((channel) => ({
    profile_id: data.id,
    channel_id: channel.id,
  }));
  const { error: profileChannelsError } = await supabase.from('profile_channels').upsert(profileChannelRows, { onConflict: 'profile_id,channel_id' });
  if (profileChannelsError) throw profileChannelsError;

  return data;
}

export async function ensureInitialChildProfile() {
  const profiles = await listChildProfiles();
  if (profiles.length > 0) {
    return profiles;
  }

  const created = await createChildProfile({
    name: 'Main Kid',
    avatarColor: '#ff0000',
    isDefault: true,
  });

  return [created];
}

export async function getProfileBundle(profileId) {
  requireSupabase();

  const [
    profileResult,
    filtersResult,
    keywordsResult,
    channelsResult,
    approvalsResult,
    pinnedResult,
    requestsResult,
    historyResult,
  ] = await Promise.all([
    supabase.from('child_profiles').select('*').eq('id', profileId).single(),
    supabase.from('profile_filters').select('*').eq('profile_id', profileId).single(),
    supabase.from('profile_keywords').select('keyword').eq('profile_id', profileId).order('keyword'),
    supabase.from('profile_channels').select('channel_id, channels(*)').eq('profile_id', profileId),
    supabase.from('approved_videos').select('*').eq('profile_id', profileId),
    supabase.from('pinned_videos').select('*').eq('profile_id', profileId).order('pinned_at', { ascending: false }),
    supabase.from('unlock_requests').select('*').eq('profile_id', profileId).order('requested_at', { ascending: false }),
    supabase.from('watch_history').select('*').eq('profile_id', profileId).order('watched_at', { ascending: false }).limit(200),
  ]);

  const errors = [
    profileResult.error,
    filtersResult.error,
    keywordsResult.error,
    channelsResult.error,
    approvalsResult.error,
    pinnedResult.error,
    requestsResult.error,
    historyResult.error,
  ].filter(Boolean);

  if (errors.length) {
    throw errors[0];
  }

  return {
    profile: profileResult.data,
    filters: filtersResult.data,
    keywords: (keywordsResult.data || []).map((entry) => entry.keyword),
    channels: (channelsResult.data || []).map((entry) => entry.channels).filter(Boolean),
    approvals: approvalsResult.data || [],
    pinned: pinnedResult.data || [],
    requests: requestsResult.data || [],
    history: historyResult.data || [],
  };
}

export async function updateProfileFilters(profileId, filters) {
  requireSupabase();
  const { error } = await supabase.from('profile_filters').upsert({
    profile_id: profileId,
    block_shorts: filters.blockShorts,
    min_secs: filters.minSecs,
  });

  if (error) throw error;
}

export async function replaceProfileKeywords(profileId, keywords) {
  requireSupabase();

  const { error: deleteError } = await supabase
    .from('profile_keywords')
    .delete()
    .eq('profile_id', profileId);

  if (deleteError) throw deleteError;

  if (!keywords.length) {
    return;
  }

  const rows = keywords.map((keyword) => ({
    profile_id: profileId,
    keyword,
  }));

  const { error: insertError } = await supabase.from('profile_keywords').insert(rows);
  if (insertError) throw insertError;
}

export async function upsertCustomChannel(channel) {
  requireSupabase();
  const parent = await ensureParentAccountRow();

  const payload = {
    id: channel.id,
    name: channel.name,
    handle: channel.handle || null,
    subscribers: channel.subscribers || null,
    color: channel.color || '#ff0000',
    category: channel.category || 'Family',
    thumb: channel.thumb || null,
    builtin: !!channel.builtin,
    created_by: channel.builtin ? null : parent.id,
  };

  const { data: existing, error: existingError } = await supabase
    .from('channels')
    .select('id, builtin, created_by')
    .eq('id', payload.id)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existing) {
    const { error } = await supabase.from('channels').insert(payload);
    if (error) throw error;
    return;
  }

  if (existing.builtin) {
    return;
  }

  const { error } = await supabase
    .from('channels')
    .update({
      name: payload.name,
      handle: payload.handle,
      subscribers: payload.subscribers,
      color: payload.color,
      category: payload.category,
      thumb: payload.thumb,
    })
    .eq('id', payload.id);

  if (error) throw error;
}

export async function enableProfileChannel(profileId, channel) {
  requireSupabase();

  if (!channel.builtin) {
    await upsertCustomChannel(channel);
  }

  const { error } = await supabase.from('profile_channels').upsert({
    profile_id: profileId,
    channel_id: channel.id,
  }, { onConflict: 'profile_id,channel_id' });

  if (error) throw error;
}

export async function disableProfileChannel(profileId, channelId) {
  requireSupabase();
  const { error } = await supabase
    .from('profile_channels')
    .delete()
    .eq('profile_id', profileId)
    .eq('channel_id', channelId);

  if (error) throw error;
}

export async function deleteCustomChannel(channelId) {
  requireSupabase();
  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', channelId);

  if (error) throw error;
}

export async function createUnlockRequest(profileId, request) {
  requireSupabase();

  const { data: existingPending, error: existingError } = await supabase
    .from('unlock_requests')
    .select('*')
    .eq('profile_id', profileId)
    .eq('video_id', request.vid)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingPending) return existingPending;

  const payload = {
    profile_id: profileId,
    video_id: request.vid,
    title: request.title,
    channel_name: request.chName || null,
    thumb: request.thumb || null,
    is_short: !!request.short,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('unlock_requests')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function approveUnlockRequest(profileId, requestId) {
  requireSupabase();

  const { data: request, error: requestError } = await supabase
    .from('unlock_requests')
    .select('*')
    .eq('profile_id', profileId)
    .eq('id', requestId)
    .single();

  if (requestError) throw requestError;

  const { error: updateError } = await supabase
    .from('unlock_requests')
    .update({
      status: request.is_short ? 'denied' : 'approved',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw updateError;

  if (!request.is_short) {
    const { error: approvalError } = await supabase.from('approved_videos').upsert({
      profile_id: profileId,
      video_id: request.video_id,
      title: request.title,
      channel_name: request.channel_name,
      thumb: request.thumb,
    }, { onConflict: 'profile_id,video_id' });

    if (approvalError) throw approvalError;
  }
}

export async function denyUnlockRequest(profileId, requestId) {
  requireSupabase();
  const { error } = await supabase
    .from('unlock_requests')
    .update({
      status: 'denied',
      resolved_at: new Date().toISOString(),
    })
    .eq('profile_id', profileId)
    .eq('id', requestId);

  if (error) throw error;
}
