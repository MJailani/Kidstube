import { useEffect, useMemo, useState } from 'react';

const DISMISS_KEY = 'kt_install_prompt_dismissed';

export default function InstallPrompt({ bottomOffset = 16 }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {}
  }, []);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setInstalled(standalone);

    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }

    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(DISMISS_KEY, '1');
      } catch {}
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isiPhoneInstall = useMemo(() => {
    const ua = navigator.userAgent || '';
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    return isIos && !standalone;
  }, []);

  if (installed || dismissed) {
    return null;
  }

  const canPromptInstall = !!deferredPrompt;
  if (!canPromptInstall && !isiPhoneInstall) {
    return null;
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setDeferredPrompt(null);
  }

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
  }

  return (
    <div
      className="fixed left-4 right-4 z-[70] mx-auto max-w-md rounded-3xl border border-[#2a2a2a] bg-[#111111]/95 backdrop-blur px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      style={{ bottom: `calc(env(safe-area-inset-bottom) + ${bottomOffset}px)` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
          KT
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold">Install KidTube</p>
          <p className="text-[#a8a8a8] text-sm mt-1">
            {canPromptInstall
              ? 'Add KidTube to the home screen for a full-screen, app-like experience.'
              : 'On iPhone, tap Share and then Add to Home Screen to install KidTube.'}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {canPromptInstall && (
              <button
                onClick={install}
                className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium hover:bg-[#ededed] transition-colors"
              >
                Install
              </button>
            )}
            <button
              onClick={dismiss}
              className="rounded-full bg-[#222] text-white px-4 py-2 text-sm font-medium hover:bg-[#2d2d2d] transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
