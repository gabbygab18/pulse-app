import { useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, Play, Square, Video, ExternalLink, Minus, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/glint/button';
import { Input } from '@/components/glint/input';
import { Badge } from '@/components/glint/badge';
import { GlowBorder } from '@/components/glint/glow-border';
import { AvatarSvg } from '@/avatar/avatar-svg';
import { useAvatarPlayer } from '@/avatar/use-player';
import { defaultProject } from '@/avatar/engine';
import type { AgentState } from './isla';

const CAST = defaultProject().avatars;
const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

/** Deterministic avatar per person, so each staff member keeps the same face. */
function castFor(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CAST[h % CAST.length];
}

function LiveAvatar({ seed, size = 72 }: { seed: string; size?: number }) {
  const avatar = useMemo(() => castFor(seed), [seed]);
  const { frame } = useAvatarPlayer(avatar, { ambient: true });
  return (
    <span style={{ width: size, height: size }} className="block shrink-0">
      <AvatarSvg avatar={avatar} face={frame.face} color={frame.color} blink={frame.blink} float={frame.float} className="h-full w-full" />
    </span>
  );
}

export function App() {
  const [s, setS] = useState<AgentState | null>(null);

  useEffect(() => {
    window.isla.getState().then(setS);
    window.isla.onState(setS);
  }, []);

  if (s && s.mode === 'island') return <Island s={s} />;

  return (
    <div className="flex h-screen flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
      <header style={drag} className="flex items-center gap-2 border-b border-border bg-background/60 px-3 py-2">
        <CaptureDot capturing={!!s?.capturing} clockedIn={!!s?.clockedIn} />
        <span className="text-sm font-semibold">Pulse</span>
        <span className="flex-1" />
        <button style={noDrag} onClick={() => window.isla.setMode('island')} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Collapse to pill">
          <Minimize2 className="size-4" />
        </button>
        <button style={noDrag} onClick={() => window.close()} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Hide">
          <Minus className="size-4" />
        </button>
      </header>

      <main style={noDrag} className="flex flex-1 flex-col gap-4 overflow-auto p-4">
        {!s ? null : s.authed ? <Dashboard s={s} /> : <Login s={s} />}
      </main>
    </div>
  );
}

/** Compact pill (Orbit-style island): avatar + status, click the arrow to expand. */
function Island({ s }: { s: AgentState }) {
  const label = !s.authed ? 'Sign in'
    : s.capturing ? 'Capturing'
    : s.clockedIn ? 'On the clock'
    : 'Idle';
  const sub = s.capturing && s.queued > 0 ? `${s.queued} queued` : (s.authed ? (s.user?.name ?? '') : 'Pulse');

  return (
    <div className="flex h-screen items-center justify-center p-1">
      <div style={drag} className="flex w-full items-center gap-2.5 rounded-full border border-border bg-card/95 px-2.5 py-1.5 shadow-xl backdrop-blur">
        {s.authed
          ? <LiveAvatar seed={s.user?.email || 'pulse'} size={34} />
          : <span className="flex size-[34px] items-center justify-center rounded-full bg-ink/10"><CaptureDot capturing={false} clockedIn={false} /></span>}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <CaptureDot capturing={!!s.capturing} clockedIn={!!s.clockedIn} />
            <span className="truncate text-[13px] font-semibold">{label}</span>
          </div>
          <div className="truncate text-[11px] text-muted-foreground">{sub}</div>
        </div>
        <button style={noDrag} onClick={() => window.isla.setMode('panel')} className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/70" aria-label="Expand">
          <Maximize2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function CaptureDot({ capturing, clockedIn }: { capturing: boolean; clockedIn: boolean }) {
  const color = capturing ? 'bg-destructive' : clockedIn ? 'bg-emerald-500' : 'bg-muted-foreground';
  return (
    <span className="relative flex size-2.5">
      {capturing && <span className={`absolute inset-0 animate-ping rounded-full ${color} opacity-75`} />}
      <span className={`relative size-2.5 rounded-full ${color}`} />
    </span>
  );
}

function Login({ s }: { s: AgentState }) {
  const [apiUrl, setApiUrl] = useState(s.apiUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr('');
    setBusy(true);
    try {
      await window.isla.setApiUrl(apiUrl.trim());
      await window.isla.login({ email: email.trim(), password });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="mx-auto">
        <GlowBorder className="rounded-full p-1">
          <LiveAvatar seed="isla-tracker" size={64} />
        </GlowBorder>
      </div>
      <p className="text-center text-xs text-muted-foreground">Sign in with your workspace account.</p>
      <Input size="sm" placeholder="https://your-workspace.com" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
      <Input size="sm" type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        size="sm"
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={err || undefined}
      />
      <Button type="submit" size="sm" loading={busy} startIcon={<LogIn />} className="w-full">
        Sign in
      </Button>
    </form>
  );
}

function Dashboard({ s }: { s: AgentState }) {
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const name = s.user?.name || s.user?.email || '';

  async function toggleClock() {
    setErr('');
    setBusy(true);
    try {
      await (s.clockedIn ? window.isla.clockOut() : window.isla.clockIn());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <LiveAvatar seed={s.user?.email || name} size={56} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{name}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.user?.role}</div>
        </div>
        <span className="flex-1" />
        <Badge variant={s.clockedIn ? 'success' : 'secondary'} dot pulse={s.clockedIn}>
          {s.clockedIn ? 'Clocked in' : 'Clocked out'}
        </Badge>
      </div>

      <Button
        size="sm"
        variant={s.clockedIn ? 'destructive' : 'default'}
        loading={busy}
        onClick={toggleClock}
        startIcon={s.clockedIn ? <Square /> : <Play />}
        className="w-full"
      >
        {s.clockedIn ? 'Clock out' : 'Clock in'}
      </Button>
      {err && <p className="text-center text-xs text-destructive">{err}</p>}

      <RecordButton />

      <div className="rounded-lg border border-border bg-background/50 p-3 text-center text-xs text-muted-foreground">
        {s.capturing ? (
          <>
            <span className="font-medium text-foreground">● Capturing screen</span>
            {s.lastShotAt && <> · last {new Date(s.lastShotAt).toLocaleTimeString()}</>}
            {s.queued > 0 && <div className="mt-1 text-amber-500">{s.queued} upload{s.queued > 1 ? 's' : ''} queued (offline)</div>}
            {!s.clockedIn && <div className="mt-1">Capture continues after clock-out, as configured by your workspace.</div>}
          </>
        ) : (
          'Capture idle'
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button size="sm" variant="link" onClick={() => window.isla.openPortal()} startIcon={<ExternalLink />}>
          Open Portal
        </Button>
        <Button size="sm" variant="ghost" onClick={() => window.isla.logout()} startIcon={<LogOut />}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

function RecordButton() {
  const [rec, setRec] = useState<null | { stop(): void }>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function start() {
    setErr('');
    setBusy(true);
    try {
      const sourceId = await window.isla.getScreenSource();
      if (!sourceId) throw new Error('No screen to record');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        // chromeMediaSource is a Chromium-only constraint Electron understands.
        video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId } } as MediaTrackConstraints,
      });

      let recorder: MediaRecorder;
      let timer: ReturnType<typeof setTimeout>;
      const clip = () => {
        const chunks: Blob[] = [];
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          try {
            await window.isla.uploadRecording(await blob.arrayBuffer());
          } catch {
            /* main-process queue handles retries */
          }
        };
        recorder.start();
        timer = setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
          clip();
        }, 60_000);
      };
      clip();

      setRec({
        stop() {
          clearTimeout(timer);
          if (recorder.state === 'recording') recorder.stop();
          stream.getTracks().forEach((t) => t.stop());
        },
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Recording failed');
    } finally {
      setBusy(false);
    }
  }

  function stop() {
    rec?.stop();
    setRec(null);
  }

  return (
    <>
      <Button
        size="sm"
        variant={rec ? 'destructive' : 'outline'}
        loading={busy}
        onClick={() => (rec ? stop() : start())}
        startIcon={<Video />}
        className="w-full"
      >
        {rec ? 'Stop recording' : 'Start recording'}
      </Button>
      {err && <p className="text-center text-xs text-destructive">{err}</p>}
    </>
  );
}
