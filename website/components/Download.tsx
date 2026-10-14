'use client';

import { useEffect, useState } from 'react';

// Served from GitHub Releases (built + published by CI on each version tag).
const REL = 'https://github.com/gabbygab18/pulse-app/releases/latest/download';
const WIN_ZIP = `${REL}/Pulse-win-x64.exe`;
const MAC_DMG = `${REL}/Pulse-mac.dmg`;
// CI publishes Pulse-mac.dmg to the Release, so the macOS download is live.
const MAC_READY = true;

export function DownloadButtons({ center = false }: { center?: boolean }) {
  const [os, setOs] = useState<'win' | 'mac' | 'other'>('other');

  useEffect(() => {
    const p = navigator.platform.toLowerCase() + ' ' + navigator.userAgent.toLowerCase();
    if (p.includes('win')) setOs('win');
    else if (p.includes('mac')) setOs('mac');
  }, []);

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
          className="group inline-flex items-center gap-2.5 rounded-full border border-ink/15 bg-transparent px-7 py-4 font-semibold text-ink transition hover:bg-card active:scale-[0.98]"
        >
          <i className="bx bxl-apple text-xl" />
          Download for macOS
          {os === 'mac' && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs">detected</span>}
        </a>
      ) : (
        <button
          type="button"
          disabled
          title="macOS build is pending — produced by the macOS CI build"
          className="inline-flex cursor-not-allowed items-center gap-2.5 rounded-full border border-ink/15 bg-transparent px-7 py-4 font-semibold text-ink-soft"
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
