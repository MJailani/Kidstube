import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import Spinner from '../../components/Spinner';
import { IcKey, IcPlus, IcX } from '../../icons';

function Toggle({ on, change, label, desc, disabled }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <button
        onClick={() => change(!on)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full flex-shrink-0 mt-0.5 transition-colors disabled:opacity-60 ${on ? 'bg-blue-600' : 'bg-[#374151]'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
      </button>
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {desc && <p className="text-[#6b7280] text-xs mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

export default function PFilters() {
  const {
    s,
    profiles,
    activeProfile,
    hasSupabaseAuth,
    profilesReady,
    profileBusy,
    profileError,
    selectProfile,
    addProfile,
    renameProfile,
    removeProfile,
    setProfileFilter,
    addProfileKeyword,
    removeProfileKeyword,
  } = useApp();

  const { filters: f } = s;
  const [kw, setKw] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [pm, setPm] = useState('');
  const [saved, setSaved] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [addingProfile, setAddingProfile] = useState(false);
  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [renamingProfile, setRenamingProfile] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    setProfileNameDraft(activeProfile?.name || '');
  }, [activeProfile]);

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function setFilter(key, value) {
    await setProfileFilter(key, value);
    flash();
  }

  async function addKeyword() {
    if (!kw.trim()) return;
    await addProfileKeyword(kw);
    setKw('');
    flash();
  }

  async function deleteKeyword(keyword) {
    await removeProfileKeyword(keyword);
    flash();
  }

  async function handleAddProfile() {
    if (!newProfileName.trim()) {
      setProfileMsg('Enter a profile name first.');
      return;
    }

    try {
      setAddingProfile(true);
      setProfileMsg('');
      await addProfile(newProfileName);
      setNewProfileName('');
      setProfileMsg('Child profile created.');
    } catch (error) {
      setProfileMsg(error.message || 'Could not create profile.');
    } finally {
      setAddingProfile(false);
    }
  }

  async function handleRenameProfile() {
    if (!activeProfile) {
      return;
    }

    if (!profileNameDraft.trim()) {
      setProfileMsg('Enter a profile name first.');
      return;
    }

    if (profileNameDraft.trim() === activeProfile.name) {
      setProfileMsg('That profile name is already in use.');
      return;
    }

    try {
      setRenamingProfile(true);
      setProfileMsg('');
      await renameProfile(activeProfile.id, profileNameDraft);
      setProfileMsg('Profile renamed.');
    } catch (error) {
      setProfileMsg(error.message || 'Could not rename profile.');
    } finally {
      setRenamingProfile(false);
    }
  }

  async function handleDeleteProfile() {
    if (!activeProfile || profiles.length <= 1) {
      setProfileMsg('At least one child profile is required.');
      return;
    }

    const confirmed = window.confirm(`Delete ${activeProfile.name}? This will remove its filters, requests, parent picks, and watch history.`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingProfile(true);
      setProfileMsg('');
      await removeProfile(activeProfile.id);
      setProfileMsg('Profile deleted.');
    } catch (error) {
      setProfileMsg(error.message || 'Could not delete profile.');
    } finally {
      setDeletingProfile(false);
    }
  }

  function changePin() {
    if (!/^\d{4}$/.test(p1)) return setPm('PIN must be 4 digits.');
    if (p1 !== p2) return setPm('PINs do not match.');
    setP1('');
    setP2('');
    setPm('PIN settings now belong in Supabase Auth. Use email/password sign-in instead.');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white text-xl font-bold">Filter Settings</h2>
        {saved && <span className="text-green-400 text-xs">Saved</span>}
      </div>
      <p className="text-[#6b7280] text-sm mb-5">Changes take effect immediately for the active child profile.</p>

      {hasSupabaseAuth && (
        <div className="bg-[#1f2937] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-white font-semibold text-sm">Child Profiles</h3>
              <p className="text-[#6b7280] text-xs mt-1">Each profile gets its own filter settings in Supabase.</p>
            </div>
            {profileBusy && <Spinner size={16} />}
          </div>

          {!profilesReady ? (
            <div className="py-3">
              <Spinner size={20} />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => selectProfile(profile.id)}
                    className={`rounded-full px-3 py-2 text-sm transition-colors ${activeProfile?.id === profile.id ? 'bg-white text-black' : 'bg-[#111827] text-white hover:bg-[#374151]'}`}
                  >
                    {profile.name}
                    {profile.is_default && <span className="ml-2 text-[10px] uppercase opacity-70">Default</span>}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newProfileName}
                  onChange={(event) => setNewProfileName(event.target.value)}
                  placeholder="Add another child profile"
                  className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddProfile}
                  disabled={addingProfile}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap inline-flex items-center justify-center gap-2"
                >
                  {addingProfile ? <Spinner size={14} /> : <IcPlus size={14} />}
                  Add Profile
                </button>
              </div>

              {activeProfile && (
                <div className="mt-4 rounded-xl border border-[#374151] bg-[#111827] p-3">
                  <p className="text-[#9ca3af] text-xs uppercase tracking-[0.16em] mb-2">Manage Active Profile</p>
                  <p className="text-[#9ca3af] text-xs mb-3">
                    Active profile: <span className="text-white font-medium">{activeProfile.name}</span>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={profileNameDraft}
                      onChange={(event) => setProfileNameDraft(event.target.value)}
                      placeholder="Rename child profile"
                      className="flex-1 bg-[#0b1220] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleRenameProfile}
                      disabled={renamingProfile || deletingProfile}
                      className="bg-slate-200 hover:bg-white disabled:opacity-60 text-black px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap inline-flex items-center justify-center"
                    >
                      {renamingProfile ? <Spinner size={14} /> : 'Rename'}
                    </button>
                    <button
                      onClick={handleDeleteProfile}
                      disabled={deletingProfile || renamingProfile || profiles.length <= 1}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap inline-flex items-center justify-center"
                    >
                      {deletingProfile ? <Spinner size={14} /> : 'Delete'}
                    </button>
                  </div>
                  {profiles.length <= 1 && (
                    <p className="text-[#6b7280] text-xs mt-2">Create another profile before deleting this one.</p>
                  )}
                </div>
              )}
              {(profileMsg || profileError) && (
                <p className={`text-xs mt-2 ${profileError ? 'text-red-400' : 'text-green-400'}`}>
                  {profileError || profileMsg}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="bg-[#1f2937] rounded-xl p-4 mb-4">
        <h3 className="text-white font-semibold text-sm mb-1">YouTube Shorts</h3>
        <div className="border-t border-[#374151]">
          <Toggle
            on={f.blockShorts}
            change={(value) => setFilter('blockShorts', value)}
            label="Block all Shorts"
            desc="Hides videos under 62s and anything with #shorts in the title."
            disabled={profileBusy}
          />
        </div>
      </div>

      <div className="bg-[#1f2937] rounded-xl p-4 mb-4">
        <h3 className="text-white font-semibold text-sm mb-3">Minimum Video Duration</h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={300}
            step={15}
            value={f.minSecs}
            onChange={(event) => setFilter('minSecs', +event.target.value)}
            className="flex-1 accent-blue-500"
            disabled={profileBusy}
          />
          <span className="text-white font-mono w-12 text-right text-sm">
            {f.minSecs === 0 ? 'Any' : f.minSecs >= 60 ? `${Math.floor(f.minSecs / 60)}m` : `${f.minSecs}s`}
          </span>
        </div>
        <p className="text-[#6b7280] text-xs mt-2">Videos shorter than this are shown as locked.</p>
      </div>

      <div className="bg-[#1f2937] rounded-xl p-4 mb-4">
        <h3 className="text-white font-semibold text-sm mb-1">Blocked Keywords</h3>
        <p className="text-[#6b7280] text-xs mb-3">Videos whose title or description contains these words are locked.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {!f.keywords.length && <span className="text-[#6b7280] text-xs italic">No keywords</span>}
          {f.keywords.map((keyword) => (
            <span key={keyword} className="flex items-center gap-1 bg-red-900 text-red-300 text-xs px-2.5 py-1 rounded-full">
              {keyword}
              <button onClick={() => deleteKeyword(keyword)} className="hover:text-white ml-0.5">
                <IcX size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={kw}
            onChange={(event) => setKw(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && addKeyword()}
            placeholder="Add keyword..."
            className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
          />
          <button onClick={addKeyword} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
            <IcPlus size={16} />
          </button>
        </div>
      </div>

      <div className="bg-[#1f2937] rounded-xl p-4">
        <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
          <IcKey size={14} cls="text-blue-400" />Parent Sign-In
        </h3>
        <p className="text-[#6b7280] text-xs mb-3">
          Parent access now uses Supabase email/password sign-in instead of a local-only PIN.
        </p>
        {hasSupabaseAuth ? (
          <div className="rounded-xl border border-[#374151] bg-[#111827] px-3 py-3 text-sm text-[#9ca3af]">
            Use the Parent sign-in screen to manage the account. Password reset and stronger account recovery will come from Supabase Auth settings.
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                placeholder="New PIN (4 digits)"
                maxLength={4}
                inputMode="numeric"
                value={p1}
                onChange={(event) => setP1(event.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
              />
              <input
                type="password"
                placeholder="Confirm PIN"
                maxLength={4}
                inputMode="numeric"
                value={p2}
                onChange={(event) => setP2(event.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
              />
              <button onClick={changePin} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap">
                Update PIN
              </button>
            </div>
            {pm && <p className={`text-xs mt-2 ${pm === 'Updated!' ? 'text-green-400' : 'text-red-400'}`}>{pm}</p>}
          </>
        )}
      </div>
    </div>
  );
}
