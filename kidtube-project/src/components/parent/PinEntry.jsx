import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function PinEntry() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function handleDigit(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
    // Auto-submit when 4 digits filled
    if (index === 3 && value) {
      const pin = [...next].join('');
      submit(pin);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function submit(pin) {
    if (pin === state.parentPin) {
      dispatch({ type: 'PARENT_LOGIN', pin });
      navigate('/parent/dashboard');
    } else {
      setError('Incorrect PIN. Try again.');
      setShake(true);
      setDigits(['', '', '', '']);
      setTimeout(() => {
        setShake(false);
        inputs.current[0]?.focus();
      }, 600);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit(digits.join(''));
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Back to kid mode */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-[#aaa] hover:text-white mb-8 text-sm"
        >
          <X size={16} /> Cancel
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">Parent Mode</h1>
          <p className="text-[#aaa] text-sm mt-1">Enter your PIN to manage settings</p>
          <p className="text-[#555] text-xs mt-2">Default PIN: 1234</p>
        </div>

        {/* PIN Form */}
        <form onSubmit={handleSubmit}>
          <div className={`flex justify-center gap-3 mb-6 ${shake ? 'animate-bounce' : ''}`}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-14 h-14 text-center text-2xl font-bold bg-[#1f1f1f] border-2 border-[#3f3f3f] focus:border-blue-500 rounded-xl text-white outline-none transition-colors"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
