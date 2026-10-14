import { LiveAvatar } from '@/components/LiveAvatar';
import { DownloadButtons, DownloadInline } from '@/components/Download';
import { Shots } from '@/components/Shots';

function SectionLabel({ n, label, dark = false }: { n: string; label: string; dark?: boolean }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className={`index-num text-6xl sm:text-7xl ${dark ? 'on-dark' : ''}`}>{n}</span>
      <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${dark ? 'text-on-dark-soft' : 'text-ink-soft'}`}>
        {label}
      </span>
    </div>
  );
}

const PLATFORMS = [
  { icon: 'bxl-windows', name: 'Windows' },
  { icon: 'bxl-apple', name: 'macOS' },
  { icon: 'bxl-tux', name: 'Linux' },
  { icon: 'bxs-buildings', name: 'Your workspace' },
  { icon: 'bxs-camera', name: 'Screen capture' },
  { icon: 'bxs-cloud', name: 'Offline queue' },
];

const STEPS = [
  { icon: 'bxs-download', title: 'Download & extract', desc: 'Grab the Windows ZIP and unzip anywhere — Desktop or Documents is fine.' },
  { icon: 'bxs-rocket', title: 'Run Pulse', desc: 'Open “Pulse.exe”. SmartScreen may warn (unsigned): More info → Run anyway.' },
  { icon: 'bxs-user-circle', title: 'Sign in & clock in', desc: 'Sign in with your your workspace account, press Clock in, and you’re tracked.' },
];

export default function Page() {
  return (
    <main>
      {/* NAV */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink">
            <LiveAvatar name="Ember" color="#f4a564" size={24} shadow={false} />
          </span>
          <span className="text-lg font-bold tracking-tight">Pulse</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-soft md:flex">
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#stats" className="hover:text-ink">About</a>
          <a href="#platforms" className="hover:text-ink">Platforms</a>
          <a href="#install" className="hover:text-ink">Install</a>
        </nav>
        <DownloadInline />
      </header>

      {/* HERO — portfolio-style split: text left, visual right */}
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-6 lg:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          {/* left */}
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/25 px-4 py-2 text-sm font-medium text-ink">
              <span className="size-2 rounded-full bg-lime-deep" /> Available now
            </span>
            <h1 className="display text-5xl sm:text-6xl lg:text-[64px]">
              Prove every hour<br />you work.
            </h1>
            <p className="max-w-md text-lg font-medium">
              The desktop time-tracking widget for your team.
            </p>
            <p className="max-w-md text-ink-soft">
              Clock in and your screen is captured periodically and synced to the your workspace — so worked hours
              are backed by proof, not guesswork. Light, always-on-top, and out of your way.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a
                href="https://github.com/gabbygab18/pulse-app/releases/latest/download/Pulse-win-x64.exe"
                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-ink px-6 font-semibold text-bg transition hover:bg-ink/85 active:scale-[0.98]"
              >
                <i className="bx bxs-download text-lg" /> Download Now
              </a>
              <a
                href="#install"
                className="inline-flex h-12 items-center gap-2.5 rounded-full border border-ink/15 bg-card px-6 font-semibold text-ink shadow-sm transition hover:bg-bg active:scale-[0.98]"
              >
                See how it works
                <span className="flex size-5 items-center justify-center rounded-full bg-ink text-bg"><i className="bx bxs-right-arrow text-[9px]" /></span>
              </a>
            </div>
          </div>

          {/* right visual */}
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="relative overflow-hidden rounded-[34px] card-gradient p-8 sm:p-10">
              <div className="float mx-auto w-fit rounded-[22px] bg-ink/10 p-3 backdrop-blur-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/shots/shot-dashboard.png" alt="Pulse widget" className="w-[210px] rounded-[16px] shadow-2xl shadow-black/30" />
              </div>
            </div>
            {/* floating deco */}
            <div className="float absolute -left-5 top-10 flex size-20 rotate-[-18deg] items-center justify-center rounded-3xl bg-lime text-ink shadow-xl">
              <i className="bx bxs-time-five text-3xl" />
            </div>
            <div className="absolute -bottom-4 right-6 flex size-12 rotate-[12deg] items-center justify-center rounded-2xl bg-ink text-bg shadow-xl">
              <i className="bx bxs-camera text-xl" />
            </div>
            {/* rotating caption badge */}
            <div className="pointer-events-none absolute -right-6 -top-6 hidden size-24 sm:block">
              <svg viewBox="0 0 100 100" className="spin-slow size-full">
                <defs><path id="circ" d="M50,50 m-34,0 a34,34 0 1,1 68,0 a34,34 0 1,1 -68,0" /></defs>
                <text className="fill-ink text-[9px] font-semibold uppercase tracking-[0.15em]">
                  <textPath href="#circ">• capture • clock in • prove hours </textPath>
                </text>
              </svg>
            </div>
            {/* live, moving procedural avatar (avatar-app engine) */}
            <LiveAvatar name="Nacho" size={132} className="pointer-events-none absolute -bottom-12 left-1/2 z-10 -translate-x-1/2" />
          </div>
        </div>

        {/* trust row */}
        <div className="mt-12 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-card-muted px-4 py-2 text-sm font-medium text-ink-soft">
            <i className="bx bxs-devices" /> Windows · macOS · Linux
          </span>
          <span className="flex items-center gap-2 rounded-full bg-card-muted px-4 py-2 text-sm font-medium text-ink-soft">
            <i className="bx bxs-shield-alt-2 text-lime-deep" /> Disclosed & transparent
          </span>
          <span className="flex items-center gap-2 rounded-full bg-card-muted px-4 py-2 text-sm font-medium text-ink-soft">
            <i className="bx bxs-cloud" /> Works offline
          </span>
        </div>
      </section>

      {/* 01 FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <SectionLabel n="01" label="Features" />
        <div className="mt-6 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="display text-4xl sm:text-5xl">Best features, built right in</h2>
            <p className="mt-5 max-w-sm text-ink-soft">
              Built for fair, transparent time tracking. It saves you reconciliation, disputes and guesswork —
              hours are backed by proof.
            </p>
            <div className="mt-7 flex gap-3">
              <DownloadInline />
              <a href="#install" className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold hover:bg-card">
                Learn More
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* dark highlighted tile */}
            <div className="rounded-card bg-dark p-6 text-on-dark sm:row-span-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Tracking</span>
                <i className="bx bxs-camera text-lime" />
              </div>
              <svg viewBox="0 0 120 40" className="mt-5 h-12 w-full">
                <polyline points="0,30 18,24 32,28 48,14 64,20 82,8 100,16 120,6" fill="none" stroke="var(--lime)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-4 text-sm text-on-dark-soft">Periodic screen captures, synced to the portal.</p>
            </div>
            {[
              { icon: 'bxs-time-five', title: 'Protection', desc: 'One shared timesheet with the your workspace.' },
              { icon: 'bxs-cloud', title: 'Flexibility', desc: 'Offline captures queue and retry on their own.' },
              { icon: 'bxs-show', title: 'Easiness', desc: 'Role-scoped viewing for staff, managers, clients.' },
            ].map((f) => (
              <div key={f.title} className="rounded-card bg-card-muted p-6 tile">
                <i className={`bx ${f.icon} text-2xl text-ink`} />
                <p className="mt-6 font-semibold">{f.title}</p>
                <p className="mt-1.5 text-sm text-ink-soft">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 02 STATS */}
      <section id="stats" className="mx-auto max-w-6xl px-6 py-16">
        <SectionLabel n="02" label="About Us" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <h2 className="display text-4xl sm:text-5xl">Get to know more about the tracker</h2>
          <p className="max-w-md text-ink-soft lg:pb-2">
            A standalone desktop app that proves worked hours without getting in the way — it talks to your
            workspace over HTTPS and nothing else.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ['~10 min', 'Capture cadence, with jitter'],
            ['0', 'Captures lost — queued offline'],
            ['4 roles', 'Scoped viewing: admin, manager, client, staff'],
          ].map(([big, small]) => (
            <div key={big} className="rounded-card bg-card-muted p-8">
              <p className="display text-5xl">{big}</p>
              <p className="mt-3 text-sm text-ink-soft">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 03 DARK CTA */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="relative overflow-hidden rounded-card bg-dark px-8 py-14 text-on-dark sm:px-14">
          <SectionLabel n="03" label="Get Started" dark />
          <div className="mt-4 grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="display text-4xl sm:text-5xl">Meet your tracking future, starting now</h2>
              <a href="https://github.com/gabbygab18/pulse-app/releases/latest/download/Pulse-win-x64.exe" className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-lime px-7 py-4 font-semibold text-ink transition hover:bg-lime-deep">
                <i className="bx bxs-download text-xl" /> Try Pulse Now
              </a>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="float rotate-6 rounded-[22px] card-gradient p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/shots/shot-offline.png" alt="Offline capture queue" className="w-[180px] rounded-[16px] shadow-2xl shadow-black/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 04 PLATFORMS */}
      <section id="platforms" className="mx-auto max-w-6xl px-6 py-20">
        <SectionLabel n="04" label="Platforms" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <h2 className="display text-4xl sm:text-5xl">Runs everywhere your team does</h2>
          <p className="max-w-md text-ink-soft lg:pb-2">
            One standalone app for every desktop OS, wired straight to the your workspace.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {PLATFORMS.map((p) => (
            <div key={p.name} className="tile flex h-28 flex-col items-center justify-center gap-3 rounded-card bg-card-muted text-ink-soft">
              <i className={`bx ${p.icon} text-3xl`} />
              <span className="text-sm font-medium">{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SCREENS */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="display text-center text-4xl sm:text-5xl">See it in action</h2>
        <p className="mx-auto mt-3 max-w-md text-center text-ink-soft">Click any screen to enlarge.</p>
        <div className="mt-12"><Shots /></div>
      </section>

      {/* 05 INSTALL */}
      <section id="install" className="mx-auto max-w-6xl px-6 py-20">
        <SectionLabel n="05" label="How it works" />
        <h2 className="mt-6 display text-4xl sm:text-5xl">Install in three steps</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-card bg-card-muted p-7">
              <span className="index-num absolute right-6 top-5 text-5xl">{i + 1}</span>
              <i className={`bx ${s.icon} text-3xl text-ink`} />
              <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10"><DownloadButtons /></div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-card bg-dark px-8 py-16 text-center text-on-dark sm:px-14">
          <h2 className="display mx-auto max-w-2xl text-4xl sm:text-6xl">Connect your time, effortlessly</h2>
          <p className="mx-auto mt-4 max-w-md text-on-dark-soft">
            Disclosed, transparent tracking. A red indicator shows the whole time capture is active.
          </p>
          <div className="mt-8 flex justify-center">
            <DownloadButtons center onDark />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-6xl px-6 pb-10">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-ink-soft sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-ink"><LiveAvatar name="Ember" color="#f4a564" size={18} shadow={false} /></span>
            <span className="font-semibold text-ink">Pulse</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#install" className="hover:text-ink">Install</a>
            <span>© {new Date().getFullYear()} Pulse</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
