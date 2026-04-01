import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IcKey, IcPlus, IcX } from '../../icons';

function Toggle({ on, change, label, desc }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <button onClick={() => change(!on)}
        className={`relative w-11 h-6 rounded-full flex-shrink-0 mt-0.5 transition-colors ${on ? 'bg-blue-600' : 'bg-[#374151]'}`}>
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
  const { s, d } = useApp();
  const { filters: f } = s;
  const [kw, setKw] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [pm, setPm] = useState('');
  const [saved, setSaved] = useState(false);

  function set(k, v) { d({ t: 'SET_F', k, v }); flash(); }
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  function addKw() { if (!kw.trim()) return; d({ t: 'ADD_KW', kw }); setKw(''); flash(); }
  function changePin() {
    if (!/^\d{4}$/.test(p1)) return setPm('PIN must be 4 digits.');
    if (p1 !== p2) return setPm('PINs do not match.');
    d({ t: 'PIN', pin: p1 }); setP1(''); setP2(''); setPm('Updated!');
    setTimeout(() => setPm(''), 3000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white text-xl font-bold">Filter Settings</h2>
        {saved && <span className="text-green-400 text-xs">✓ Saved</span>}
      </div>
      <p className="text-[#6b7280] text-sm mb-5">Changes take effect immediately.</p>

      <div className="bg-[#1f2937] rounded-xl p-4 mb-4">
        <h3 className="text-white font-semibold text-sm mb-1">YouTube Shorts</h3>
        <div className="border-t border-[#374151]">
          <Toggle on={f.blockShorts} change={v => set('blockShorts', v)}
            label="Block all Shorts" desc="Hides videos under 62s and anything with #shorts in the title." />
        </div>
      </div>

      <div className="bg-[#1f2937] rounded-xl p-4 mb-4">
        <h3 className="text-white font-semibold text-sm mb-3">Minimum Video Duration</h3>
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={300} step={15} value={f.minSecs}
            onChange={e => set('minSecs', +e.target.value)} className="flex-1 accent-blue-500" />
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
          {f.keywords.map(k => (
            <span key={k} className="flex items-center gap-1 bg-red-900 text-red-300 text-xs px-2.5 py-1 rounded-full">
              {k}
              <button onClick={() => { d({ t: 'DEL_KW', kw: k }); flash(); }} className="hover:text-white ml-0.5">
                <IcX size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={kw} onChange={e => setKw(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKw()}
            placeholder="Add keyword…"
            className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500" />
          <button onClick={addKw} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
            <IcPlus size={16} />
          </button>
        </div>
      </div>

      <div className="bg-[#1f2937] rounded-xl p-4">
        <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
          <IcKey size={14} cls="text-blue-400" />Change Parent PIN
        </h3>
        <p className="text-[#6b7280] text-xs mb-3">Current PIN: {s.pin}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="password" placeholder="New PIN (4 digits)" maxLength={4} inputMode="numeric"
            value={p1} onChange={e => setP1(e.target.value.replace(/\D/g, ''))}
            className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500" />
          <input type="password" placeholder="Confirm PIN" maxLength={4} inputMode="numeric"
            value={p2} onChange={e => setP2(e.target.value.replace(/\D/g, ''))}
            className="flex-1 bg-[#111827] border border-[#374151] text-white placeholder-[#4b5563] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500" />
          <button onClick={changePin} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap">
            Update PIN
          </button>
        </div>
        {pm && <p className={`text-xs mt-2 ${pm === 'Updated!' ? 'text-green-400' : 'text-red-400'}`}>{pm}</p>}
      </div>
    </div>
  );
}
