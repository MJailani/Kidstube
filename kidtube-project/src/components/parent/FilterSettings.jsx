import React, { useState } from 'react';
import { ShieldCheck, Plus, X, Key } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full flex-shrink-0 mt-0.5 transition-colors ${
          checked ? 'bg-blue-600' : 'bg-[#374151]'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {description && <p className="text-[#6b7280] text-xs mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}

export default function FilterSettings() {
  const { state, dispatch } = useApp();
  const { filters } = state;

  const [newKeyword, setNewKeyword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [saved, setSaved] = useState(false);

  function updateFilter(key, value) {
    dispatch({ type: 'UPDATE_FILTERS', filters: { [key]: value } });
    flash();
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addKeyword() {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw) return;
    dispatch({ type: 'ADD_KEYWORD', keyword: kw });
    setNewKeyword('');
    flash();
  }

  function removeKeyword(kw) {
    dispatch({ type: 'REMOVE_KEYWORD', keyword: kw });
    flash();
  }

  function changePin() {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinMsg('PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinMsg('PINs do not match.');
      return;
    }
    dispatch({ type: 'CHANGE_PIN', newPin });
    setNewPin('');
    setConfirmPin('');
    setPinMsg('PIN updated successfully!');
    setTimeout(() => setPinMsg(''), 3000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white text-xl font-bold">Filter Settings</h2>
        {saved && (
          <span className="text-green-400 text-xs flex items-center gap-1">
            <ShieldCheck size={13} /> Saved
          </span>
        )}
      </div>
      <p className="text-[#6b7280] text-sm mb-6">
        Control exactly what your kids can see. Changes take effect immediately.
      </p>

      {/* ── Shorts ── */}
      <section className="bg-[#1f2937] rounded-xl p-4 mb-4">
        <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
          <ShieldCheck size={15} className="text-blue-400" />
          YouTube Shorts
        </h3>
        <div className="border-t border-[#374151]">
          <Toggle
            checked={filters.blockShorts}
            onChange={v => updateFilter('blockShorts', v)}
            label="Block all Shorts"
            description="Hides all videos under 60 seconds and any video with '#shorts' in the title. Shorts are identified by multiple signals so very few slip through."
          />
        </div>
      </section>

      {/* ── Duration ── */}
      <section className="bg-[#1f2937] rounded-xl p-4 mb-4">
        <h3 className="text-white font-semibold text-sm mb-3">Minimum Video Duration</h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={300}
            step={15}
            value={filters.minDurationSeconds}
            onChange={e => updateFilter('minDurationSeconds', Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="text-white font-mono w-14 text-right text-sm">
            {filters.minDurationSeconds === 0
              ? 'Any'
              : filters.minDurationSeconds >= 60
              ? `${Math.floor(filters.minDurationSeconds / 60)}m`
              : `${filters.minDurationSeconds}s`}
          </span>
        </div>
        <p className="text-[#6b7280] text-xs mt-2">
          Videos shorter than this will be shown as locked. Set to 0 to allow any length.
        </p>
      </section>

      {/* ── Keywords ── */}
      <section className="bg-[#1f2937] rounded-xl p-4 mb-4">
        <h3 className="text-white font-semibold text-sm mb-1">Blocked Keywords</h3>
        <p className="text-[#6b7280] text-xs mb-3">
          Any video whose title or description contains these words will be shown as locked.
        </p>

        {/* Keyword chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {filters.blockedKeywords.length === 0 && (
            <span className="text-[#6b7280] text-xs italic">No keywords blocked</span>
          )}
          {filters.blockedKeywords.map(kw => (
            <span
              key={kw}
              className="flex items-center gap-1 bg-red-900 text-red-300 text-xs px-2.5 py-1 rounded-full"
            >
              {kw}
              <button onClick={() => removeKeyword(kw)} className="hover:text-white ml-0.5">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>

        {/* Add keyword */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a keyword..."
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKeyword()}
            className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={addKeyword}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </section>

      {/* ── Change PIN ── */}
      <section className="bg-[#1f2937] rounded-xl p-4">
        <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
          <Key size={15} className="text-blue-400" />
          Change Parent PIN
        </h3>
        <p className="text-[#6b7280] text-xs mb-3">Current PIN: {state.parentPin}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            placeholder="New PIN (4 digits)"
            maxLength={4}
            inputMode="numeric"
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="Confirm PIN"
            maxLength={4}
            inputMode="numeric"
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={changePin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            Update PIN
          </button>
        </div>
        {pinMsg && (
          <p className={`text-xs mt-2 ${pinMsg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
            {pinMsg}
          </p>
        )}
      </section>
    </div>
  );
}
