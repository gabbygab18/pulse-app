'use client';

import { useEffect, useState } from 'react';

// Served from GitHub Releases (built + published by CI on each version tag).
const REL = 'https://github.com/gabbygab18/pulse-app/releases/latest/download';
const WIN_ZIP = `${REL}/Pulse-win-x64-setup.exe`;
const MAC_DMG = `${REL}/Pulse-mac.dmg`;
// CI publishes Pulse-mac.dmg to the Release, so the macOS download is live.
const MAC_READY = true;

export function DownloadButtons({ center = false, onDark = false }: { center?: boolean; onDark?: boolean }) {
  const [os, setOs] = useState<'win' | 'mac' | 'other'>('other');

  useEffect(() => {
    const p = navigator.platform.toLowerCase() + ' ' + navigator.userAgent.toLowerCase();
    if (p.includes('win')) setOs('win');
    else if (p.includes('mac')) setOs('mac');
  }, []);

  // Outline (macOS) button adapts to the section it sits on.
  const outline = onDark
    ? 'border-on-dark/25 text-on-dark hover:bg-white/5'
    : 'border-ink/15 text-ink hover:bg-card';

  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${center ? 'items-center justify-center' : 'items-start'}`}>
      <a
        href={WIN_ZIP}
        className="group inline-flex items-center gap-2.5 rounded-full bg-lime px-7 py-4 font-semibold text-ink transition hover:bg-lime-deep active:scale-[0.98]"
      >
        <i className="bx bxl-windows text-xl" />
        Download for Windows
        {os === 'win' && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs">detected</span>}
      </a>
      {MAC_READY ? (
        <a
          href={MAC_DMG}
          className={`group inline-flex items-center gap-2.5 rounded-full border bg-transparent px-7 py-4 font-semibold transition active:scale-[0.98] ${outline}`}
        >
          <i className="bx bxl-apple text-xl" />
          Download for macOS
          {os === 'mac' && <span className="rounded-full bg-current/10 px-2 py-0.5 text-xs">detected</span>}
        </a>
      ) : (
        <button
          type="button"
          disabled
          title="macOS build is pending — produced by the macOS CI build"
          className={`inline-flex cursor-not-allowed items-center gap-2.5 rounded-full border bg-transparent px-7 py-4 font-semibold opacity-70 ${outline}`}
        >
          <i className="bx bxl-apple text-xl" />
          macOS — soon
        </button>
      )}
    </div>
  );
}

export function DownloadInline() {
  return (
    <a
      href={WIN_ZIP}
      className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-ink/85"
    >
      <i className="bx bxs-download text-base" />
      Get Started
    </a>
  );
}
