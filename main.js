'use strict';

const {
  app, BrowserWindow, Tray, Menu, ipcMain, desktopCapturer, screen, shell, nativeImage,
} = require('electron');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config (userData/config.json — no extra dependency)
// ---------------------------------------------------------------------------
const CONFIG_PATH = () => path.join(app.getPath('userData'), 'config.json');
const QUEUE_DIR = () => path.join(app.getPath('userData'), 'queue');

const DEFAULTS = {
  // Set per deployment on the sign-in screen (or ship a build with this prefilled).
  apiUrl: '',
  token: null,
  user: null,
  captureIntervalMs: 10 * 60 * 1000, // ~10 min between screenshots (Hubstaff-style)
  // Requirement: capture starts at clock-in and is NOT stopped by clock-out.
  // ponytail: single global flag; make it per-user policy only if the business needs it.
  keepCapturingAfterClockOut: true,
  retryMs: 30 * 1000, // how often to retry a failed/offline upload
};

function loadConfig() {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_PATH(), 'utf8')) };
  } catch {
    return { ...DEFAULTS };
  }
}
function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH(), JSON.stringify(cfg, null, 2));
}

let config = DEFAULTS;
let state = { clockedIn: false, capturing: false, sessionId: null, lastShotAt: null, queued: 0 };
let captureTimer = null;
let drainTimer = null;
let win = null;
let tray = null;

// ---------------------------------------------------------------------------
// Portal API (all network from the main process → no CORS)
// ---------------------------------------------------------------------------
async function api(pathname, { method = 'GET', body, auth = true, form = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (auth && config.token) headers.Authorization = `Bearer ${config.token}`;
  if (!form && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${config.apiUrl}/api/agent${pathname}`, {
    method,
    headers,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ---------------------------------------------------------------------------
// Offline upload queue — each item is a media file + a .json sidecar of its
// form fields. Survives restarts; drained on an interval and after each enqueue.
// ---------------------------------------------------------------------------
function ensureQueueDir() {
  fs.mkdirSync(QUEUE_DIR(), { recursive: true });
}
function countQueued() {
  try {
    return fs.readdirSync(QUEUE_DIR()).filter((f) => f.endsWith('.json')).length;
  } catch {
    return 0;
  }
}
function enqueue(buffer, filename, meta) {
  ensureQueueDir();
  const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  fs.writeFileSync(path.join(QUEUE_DIR(), `${base}.bin`), buffer);
  fs.writeFileSync(path.join(QUEUE_DIR(), `${base}.json`), JSON.stringify({ filename, meta }));
  state.queued = countQueued();
  pushState();
  drainQueue();
}

let draining = false;
async function drainQueue() {
  if (draining || !config.token) return;
  draining = true;
  try {
    ensureQueueDir();
    const jobs = fs.readdirSync(QUEUE_DIR()).filter((f) => f.endsWith('.json')).sort();
    for (const jobFile of jobs) {
      const base = jobFile.slice(0, -5);
      const binPath = path.join(QUEUE_DIR(), `${base}.bin`);
      const jsonPath = path.join(QUEUE_DIR(), jobFile);
      let job;
      try { job = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch { fs.rmSync(jsonPath, { force: true }); continue; }
      if (!fs.existsSync(binPath)) { fs.rmSync(jsonPath, { force: true }); continue; }

      const buf = fs.readFileSync(binPath);
      const fd = new FormData();
      for (const [k, v] of Object.entries(job.meta)) if (v != null) fd.append(k, String(v));
      const mime = job.filename.endsWith('.webm') ? 'video/webm' : 'image/png';
      fd.append('file', new Blob([buf], { type: mime }), job.filename);

      try {
        await api('/upload', { method: 'POST', body: fd, form: true });
        fs.rmSync(binPath, { force: true });
        fs.rmSync(jsonPath, { force: true });
        state.lastShotAt = job.meta.taken_at || new Date().toISOString();
      } catch (err) {
        // Offline / server down / auth: stop and let the retry timer try later.
        console.error('upload queued, will retry:', err.message);
        break;
      }
    }
  } finally {
    draining = false;
    state.queued = countQueued();
    pushState();
  }
}

// ---------------------------------------------------------------------------
// Screen capture
// ---------------------------------------------------------------------------
async function captureAndQueue() {
  try {
    const d = screen.getPrimaryDisplay();
    const scale = d.scaleFactor || 1;
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.round(d.size.width * scale), height: Math.round(d.size.height * scale) },
    });
    if (!sources.length) return;

    const png = sources[0].thumbnail.toPNG();
    enqueue(png, `screen-${Date.now()}.png`, {
      type: 'screenshot',
      taken_at: new Date().toISOString(),
      ...(state.sessionId ? { time_session_id: state.sessionId } : {}),
    });
  } catch (err) {
    console.error('capture failed:', err.message);
  }
}

function startCapture() {
  if (captureTimer) return;
  state.capturing = true;
  captureAndQueue(); // first shot immediately
  const jitter = () => config.captureIntervalMs + Math.floor(Math.random() * 60_000);
  const tick = () => { captureTimer = setTimeout(() => { captureAndQueue(); tick(); }, jitter()); };
  tick();
  pushState();
  updateTray();
}

function stopCapture() {
  if (captureTimer) clearTimeout(captureTimer);
  captureTimer = null;
  state.capturing = false;
  pushState();
  updateTray();
}

// ---------------------------------------------------------------------------
// Clock in / out
// ---------------------------------------------------------------------------
async function clockIn() {
  const res = await api('/clock-in', { method: 'POST' });
  state.clockedIn = true;
  state.sessionId = res.shift?.id ?? null;
  startCapture(); // capture begins at clock-in
  pushState();
  updateTray();
}

async function clockOut() {
  await api('/clock-out', { method: 'POST' });
  state.clockedIn = false;
  // Requirement: capture must NOT stop on clock-out.
  if (!config.keepCapturingAfterClockOut) stopCapture();
  pushState();
  updateTray();
}

// ---------------------------------------------------------------------------
// Windows / tray
// ---------------------------------------------------------------------------
function currentState() {
  return { ...state, user: config.user, authed: !!config.token, apiUrl: config.apiUrl };
}
function pushState() {
  if (win && !win.isDestroyed()) win.webContents.send('state', currentState());
}

function createWindow() {
  win = new BrowserWindow({
    width: 320,
    height: 520,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'dist', 'index.html'));
  win.on('ready-to-show', pushState);
  win.on('close', (e) => { e.preventDefault(); win.hide(); }); // live in tray
}

function updateTray() {
  if (!tray) return;
  const label = state.clockedIn ? 'Clocked in' : (state.capturing ? 'Capturing (off the clock)' : 'Idle');
  tray.setToolTip(`Pulse — ${label}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: `Pulse — ${label}`, enabled: false },
    { type: 'separator' },
    { label: 'Show widget', click: () => showWindow() },
    {
      label: state.clockedIn ? 'Clock out' : 'Clock in',
      enabled: !!config.token,
      click: () => (state.clockedIn ? clockOut() : clockIn()).catch(console.error),
    },
    { label: 'Open Portal', click: () => shell.openExternal(config.apiUrl) },
    { type: 'separator' },
    { label: 'Quit', click: () => { stopCapture(); app.exit(0); } },
  ]));
}

// placeholder 16x16 tray icon (no asset file needed)
function trayIcon() {
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVR42mNgGAWjYBSMglEwCkbBKBgFo2AUjIJRMApGwSgYBaNgFIyCUTAKRsEoAAB3QAABJzQd3QAAAABJRU5ErkJggg==',
  );
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------
ipcMain.handle('get-state', () => currentState());

ipcMain.handle('set-api-url', (_e, url) => {
  config.apiUrl = (url || '').replace(/\/+$/, '') || DEFAULTS.apiUrl;
  saveConfig(config);
  return config.apiUrl;
});

ipcMain.handle('login', async (_e, { email, password }) => {
  const res = await api('/login', { method: 'POST', body: { email, password }, auth: false });
  config.token = res.token;
  config.user = res.user;
  saveConfig(config);
  // Reflect any shift already running on the portal.
  try {
    const st = await api('/status');
    if (st.shift) { state.clockedIn = true; state.sessionId = st.shift.id; startCapture(); }
  } catch { /* ignore */ }
  drainQueue();
  pushState();
  updateTray();
  return res.user;
});

ipcMain.handle('logout', async () => {
  stopCapture();
  state = { clockedIn: false, capturing: false, sessionId: null, lastShotAt: null, queued: countQueued() };
  config.token = null; config.user = null;
  saveConfig(config);
  pushState();
  updateTray();
});

ipcMain.handle('clock-in', () => clockIn());
ipcMain.handle('clock-out', () => clockOut());
ipcMain.handle('open-portal', () => shell.openExternal(config.apiUrl));

ipcMain.handle('upload-recording', (_e, arrayBuffer) => {
  enqueue(Buffer.from(arrayBuffer), `rec-${Date.now()}.webm`, {
    type: 'recording',
    taken_at: new Date().toISOString(),
    ...(state.sessionId ? { time_session_id: state.sessionId } : {}),
  });
});

ipcMain.handle('get-screen-source', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  return sources[0]?.id || null;
});

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
const showWindow = () => { if (win && !win.isDestroyed()) { win.show(); win.focus(); } };

if (!app.requestSingleInstanceLock()) app.exit(0);
app.on('second-instance', showWindow);

app.whenReady().then(() => {
  config = loadConfig();
  state.queued = countQueued();
  createWindow();
  tray = new Tray(trayIcon());
  updateTray();
  tray.on('click', () => {
    if (!win || win.isDestroyed()) return;
    win.isVisible() ? win.hide() : showWindow();
  });

  // Retry drainer — clears the backlog once the network/portal is reachable.
  drainTimer = setInterval(() => drainQueue(), config.retryMs);
  drainQueue();
});

app.on('window-all-closed', () => { /* stay alive in tray */ });
