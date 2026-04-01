import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { navigate } from '../router';
import { IcShield, IcX } from '../icons';

export default function PinEntry() {
  const { s, d } = useApp();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [err, setErr] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const refs = [useRef(), useRef(), useRef(), useRef()];
  useEffect(() => refs[0].current?.focus(), []);
  useEffect(() => {
    if (!lockedUntil) {
      return undefined;
    }

    const remaining = lockedUntil - Date.now();
    if (remaining <= 0) {
      setLockedUntil(0);
      setErr('');
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setLockedUntil(0);
      setErr('');
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [lockedUntil]);

  function go(i, v) {
    if (!/^\d?$/.test(v)) return;
    const nd = [...digits]; nd[i] = v; setDigits(nd); setErr('');
    if (v && i < 3) refs[i + 1].current?.focus();
    if (i === 3 && v) tryPin(nd.join(''));
  }

  function tryPin(pin) {
    if (Date.now() < lockedUntil) {
      setErr(`Too many attempts. Try again in ${Math.ceil((lockedUntil - Date.now()) / 1000)}s.`);
      return;
    }

    if (pin === s.pin) {
      setFailedAttempts(0);
      d({ t: 'LOGIN', pin });
      navigate('/parent/dashboard');
      return;
    }

    const nextFailures = failedAttempts + 1;
    setFailedAttempts(nextFailures);
    setDigits(['', '', '', '']);

    if (nextFailures >= 5) {
      setFailedAttempts(0);
      setLockedUntil(Date.now() + 30000);
      setErr('Too many attempts. Try again in 30s.');
    } else {
      setErr('Incorrect PIN. Try again.');
    }

    setTimeout(() => refs[0].current?.focus(), 50);
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-[#aaa] hover:text-white mb-8 text-sm">
          <IcX size={16} />Cancel
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IcShield size={28} cls="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">Parent Mode</h1>
          <p className="text-[#aaa] text-sm mt-1">Enter your PIN to manage settings</p>
        </div>
        <div className="flex justify-center gap-3 mb-6">
          {digits.map((dg, i) => (
            <input key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1} value={dg}
              onChange={e => go(i, e.target.value)}
              onKeyDown={e => e.key === 'Backspace' && !dg && i > 0 && refs[i - 1].current?.focus()}
              className="w-14 h-14 text-center text-2xl font-bold bg-[#1f1f1f] border-2 border-[#3f3f3f] focus:border-blue-500 rounded-xl text-white outline-none transition-colors"
            />
          ))}
        </div>
        {err && <p className="text-red-400 text-sm text-center mb-4">{err}</p>}
        <button onClick={() => tryPin(digits.join(''))} disabled={Date.now() < lockedUntil}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
          Unlock
        </button>
      </div>
    </div>
  );
}
