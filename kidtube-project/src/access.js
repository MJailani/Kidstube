export function getVideoRestriction(video, filters) {
  if (!video) {
    return { code: 'missing', why: 'Video unavailable', unlockable: false };
  }

  if (video.short && filters.blockShorts) {
    return { code: 'shorts', why: 'Shorts are blocked', unlockable: false };
  }

  if (video.secs > 0 && video.secs < filters.minSecs) {
    return { code: 'duration', why: `Too short (${video.dur})`, unlockable: true };
  }

  const haystack = `${video.title} ${video.desc}`.toLowerCase();
  const keyword = filters.keywords.find((entry) =>
    haystack.includes(entry.toLowerCase()),
  );

  if (keyword) {
    return { code: 'keyword', why: `Keyword: "${keyword}"`, unlockable: true };
  }

  return null;
}

export function canUseApprovedOverride(video, state) {
  const restriction = getVideoRestriction(video, state.filters);
  if (!restriction) {
    return true;
  }

  if (restriction.code === 'shorts') {
    return false;
  }

  return state.approved.includes(video.id);
}

export function isVideoAllowed(video, state) {
  if (!video) {
    return false;
  }

  if (video.pinned) {
    return true;
  }

  if (!state.wl.includes(video.ch)) {
    return false;
  }

  return canUseApprovedOverride(video, state);
}

export function splitVideosByAccess(videos, state) {
  const allowed = [];
  const blocked = [];
  const hiddenShorts = [];

  videos.forEach((video) => {
    const restriction = getVideoRestriction(video, state.filters);

    if (!restriction) {
      allowed.push(video);
      return;
    }

    if (restriction.code === 'shorts') {
      hiddenShorts.push({ ...video, why: restriction.why, unlockable: false });
      return;
    }

    if (state.approved.includes(video.id)) {
      allowed.push(video);
      return;
    }

    blocked.push({ ...video, why: restriction.why, unlockable: restriction.unlockable });
  });

  return { allowed, blocked, hiddenShorts };
}
