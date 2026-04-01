import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { navigate } from '../router';
import { IcShield, IcX } from '../icons';

function PinFallback() {
  const { s, loginParent } = useApp();
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

  function go(index, value) {
    if (!/^\d?$/.test(value)) return;
    const nextDigits = [...digits];
    nextDigits[index] = value;
    setDigits(nextDigits);
    setErr('');

    if (value && index < 3) refs[index + 1].current?.focus();
    if (index === 3 && value) tryPin(nextDigits.join(''));
  }

  async function tryPin(pin) {
    if (Date.now() < lockedUntil) {
      setErr(`Too many attempts. Try again in ${Math.ceil((lockedUntil - Date.now()) / 1000)}s.`);
      return;
    }

    try {
      await loginParent({ pin });
      setFailedAttempts(0);
      navigate('/parent/dashboard');
      return;
    } catch (error) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      setDigits(['', '', '', '']);

      if (nextFailures >= 5) {
        setFailedAttempts(0);
        setLockedUntil(Date.now() + 30000);
        setErr('Too many attempts. Try again in 30s.');
      } else {
        setErr(error.message || 'Incorrect PIN. Try again.');
      }

      setTimeout(() => refs[0].current?.focus(), 50);
    }
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <IcShield size={28} cls="text-white" />
        </div>
        <h1 className="text-white text-2xl font-bold">Parent Mode</h1>
        <p className="text-[#aaa] text-sm mt-1">Enter your PIN to manage settings</p>
        <p className="text-[#666] text-xs mt-3">Supabase is not configured, so KidTube is using the local parent PIN fallback.</p>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={refs[index]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => go(index, event.target.value)}
            onKeyDown={(event) => event.key === 'Backspace' && !digit && index > 0 && refs[index - 1].current?.focus()}
            className="w-14 h-14 text-center text-2xl font-bold bg-[#1f1f1f] border-2 border-[#3f3f3f] focus:border-blue-500 rounded-xl text-white outline-none transition-colors"
          />
        ))}
      </div>

      {err && <p className="text-red-400 text-sm text-center mb-4">{err}</p>}

      <button
        onClick={() => tryPin(digits.join(''))}
        disabled={Date.now() < lockedUntil}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Unlock
      </button>
    </>
  );
}

function SupabaseAuthForm() {
  const { loginParent, signupParent } = useApp();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const title = mode === 'login' ? 'Parent Sign In' : 'Create Parent Account';
  const subtitle = mode === 'login'
    ? 'Use your email and password to manage family settings securely.'
    : 'Create a parent account so each family keeps its own channels, filters, and approvals.';

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) return false;
    if (mode === 'signup' && !displayName.trim()) return false;
    return true;
  }, [displayName, email, mode, password]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || busy) return;

    setBusy(true);
    setErr('');
    setInfo('');

    try {
      if (mode === 'login') {
        await loginParent({ email: email.trim(), password });
        navigate('/parent/dashboard');
      } else {
        const result = await signupParent({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        });

        if (result.needsEmailConfirmation) {
          setInfo('Account created. Check your email to confirm the account, then sign in.');
          setMode('login');
        } else {
          navigate('/parent/dashboard');
        }
      }
    } catch (error) {
      setErr(error.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <IcShield size={28} cls="text-white" />
        </div>
        <h1 className="text-white text-2xl font-bold">{title}</h1>
        <p className="text-[#aaa] text-sm mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6 rounded-2xl bg-[#171717] p-1">
        <button
          onClick={() => { setMode('login'); setErr(''); setInfo(''); }}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-black' : 'text-[#a9a9a9] hover:text-white'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode('signup'); setErr(''); setInfo(''); }}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white text-black' : 'text-[#a9a9a9] hover:text-white'}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <label className="block">
            <span className="block text-sm text-[#b9b9b9] mb-2">Parent name</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-xl bg-[#1b1b1b] border border-[#323232] px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="Mom, Dad, or your name"
            />
          </label>
        )}

        <label className="block">
          <span className="block text-sm text-[#b9b9b9] mb-2">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl bg-[#1b1b1b] border border-[#323232] px-4 py-3 text-white outline-none focus:border-blue-500"
            placeholder="parent@example.com"
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="block text-sm text-[#b9b9b9] mb-2">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl bg-[#1b1b1b] border border-[#323232] px-4 py-3 text-white outline-none focus:border-blue-500"
            placeholder="At least 6 characters"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {err && <p className="text-red-400 text-sm text-center">{err}</p>}
        {info && <p className="text-emerald-400 text-sm text-center">{info}</p>}

        <button
          type="submit"
          disabled={!canSubmit || busy}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {busy ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </>
  );
}

export default function PinEntry() {
  const { hasSupabaseAuth } = useApp();

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-[#aaa] hover:text-white mb-8 text-sm">
          <IcX size={16} />Cancel
        </button>
        {hasSupabaseAuth ? <SupabaseAuthForm /> : <PinFallback />}
      </div>
    </div>
  );
}
