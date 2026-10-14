'use client';

import { useState } from 'react';

const SHOTS = [
  { src: '/shots/shot-login.png', title: 'Sign in', desc: 'One sign-in with the team member’s workspace account.' },
  { src: '/shots/shot-dashboard.png', title: 'On the clock', desc: 'Clock in and the screen is captured periodically, synced to the portal.' },
  { src: '/shots/shot-offline.png', title: 'Works offline', desc: 'No connection? Captures queue on disk and upload themselves once you’re back.' },
];

export function Shots() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-3">
        {SHOTS.map((s, i) => (
          <figure key={s.src} className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setActive(i)}
              className="group relative w-full rounded-card border border-border bg-card-muted p-6 transition hover:bg-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.src}
                alt={s.title}
                className="mx-auto w-[196px] rounded-[18px] shadow-xl shadow-black/15 transition group-hover:scale-[1.02]"
              />
              <span className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-ink text-bg opacity-0 transition group-hover:opacity-100">
                <i className="bx bxs-zoom-in" />
              </span>
            </button>
            <figcaption className="mt-5 text-center">
              <p className="text-lg font-semibold">{s.title}</p>
              <p className="mt-1.5 text-sm text-ink-soft">{s.desc}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <button className="absolute right-5 top-5 flex size-11 items-center justify-center rounded-full bg-bg text-ink" aria-label="Close">
            <i className="bx bx-x text-2xl" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SHOTS[active].src} alt={SHOTS[active].title} className="max-h-[85vh] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
