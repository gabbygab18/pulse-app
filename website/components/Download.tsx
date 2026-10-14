'use client';

import { useEffect, useState } from 'react';

// Served from GitHub Releases (built + published by CI on each version tag).
const REL = 'https://github.com/gabbygab18/pulse-app/releases/latest/download';
const WIN_URL = `${REL}/Pulse-win-x64-setup.exe`;
const MAC_URL = `${REL}/Pulse-mac.dmg`;
const MAC_READY = true;

type OS = 'win' | 'mac' | 'other';

/** Best-effort OS detection (userAgentData first, then UA/platform strings). */
function useOS(): OS {
  const [os, setOs] = useState<OS>('other');
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const hay = `${nav.userAgentData?.platform ?? ''} ${nav.platform ?? ''} ${nav.userAgent ?? ''}`.toLowerCase();
    if (/mac|iphone|ipad|ipod/.test(hay)) setOs('mac');
    else if (/win/.test(hay)) setOs('win');
    else setOs('other');
  }, []);
  return os;
}

const base = 'group inline-flex items-center gap-2.5 rounded-full px-7 py-4 font-semibold transition active:scale-[0.98]';
const limeBtn = `${base} bg-lime text-ink hover:bg-lime-deep`;
const outlineBtn = (onDark: boolean) =>
  `${base} border bg-transparent ${onDark ? 'border-on-dark/25 text-on-dark hover:bg-white/5' : 'border-ink/15 text-ink hover:bg-card'}`;

function WinBtn({ primary, onDark, detected }: { primary: boolean; onDark: boolean; detected: boolean }) {
  return (
    <a href={WIN_URL} className={primary ? limeBtn : outlineBtn(onDark)}>
      <i className="bx bxl-windows text-xl" />
      Download for Windows
      {detected && <span className="rounded-full bg-current/15 px-2 py-0.5 text-xs">detected</span>}
    </a>
  );
}

function MacBtn({ primary, onDark, detected }: { primary: boolean; onDark: boolean; detected: boolean }) {
  if (!MAC_READY) {
    return (
      <button type="button" disabled title="macOS build is pending" className={`${outlineBtn(onDark)} cursor-not-allowed opacity-70`}>
        <i className="bx bxl-apple text-xl" /> macOS — soon
      </button>
    );
  }
  return (
    <a href={MAC_URL} className={primary ? limeBtn : outlineBtn(onDark)}>
      <i className="bx bxl-apple text-xl" />
      Download for macOS
      {detected && <span className="rounded-full bg-current/15 px-2 py-0.5 text-xs">detected</span>}
    </a>
  );
}

export function DownloadButtons({ center = false, onDark = false }: { center?: boolean; onDark?: boolean }) {
  const os = useOS();
  const macFirst = os === 'mac';

  const win = <WinBtn key="win" primary={os === 'win'} onDark={onDark} detected={os === 'win'} />;
  const mac = <MacBtn key="mac" primary={os === 'mac'} onDark={onDark} detected={os === 'mac'} />;

  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${center ? 'items-center justify-center' : 'items-start'}`}>
      {macFirst ? [mac, win] : [win, mac]}
    </div>
  );
}

/** Single smart button that points at the viewer's OS (hero / inline CTAs). */
export function PrimaryDownload({ className = '' }: { className?: string }) {
  const os = useOS();
  const mac = os === 'mac' && MAC_READY;
  return (
    <a
      href={mac ? MAC_URL : WIN_URL}
      className={`inline-flex items-center gap-2.5 rounded-full bg-lime px-6 py-3.5 font-semibold text-ink transition hover:bg-lime-deep active:scale-[0.98] ${className}`}
    >
      <i className={`bx ${mac ? 'bxl-apple' : 'bxl-windows'} text-xl`} />
      {mac ? 'Download for macOS' : 'Download for Windows'}
    </a>
  );
}

export function DownloadInline() {
  return (
    <a
      href={WIN_URL}
      className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-ink/85"
    >
      <i className="bx bxs-download text-base" />
      Get Started
    </a>
  );
}
