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
  // Capture runs only while clocked in — it stops on clock-out.
  keepCapturingAfterClockOut: false,
  retryMs: 30 * 1000, // how often to retry a failed/offline upload
  mode: 'panel', // last display mode: 'panel' | 'island'
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

// Window sizes for the two display modes.
const SIZES = { panel: { width: 320, height: 520 }, island: { width: 248, height: 68 } };

let config = DEFAULTS;
let mode = 'panel'; // 'panel' (full) | 'island' (compact pill)
let state = { clockedIn: false, onBreak: false, capturing: false, sessionId: null, lastShotAt: null, queued: 0 };
let captureTimer = null;
let drainTimer = null;
let statusTimer = null;
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
      const mime = job.filename.endsWith('.webm') ? 'video/webm'
        : job.filename.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
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

    // JPEG keeps the upload small; the portal re-encodes it to a compact WebP.
    const jpg = sources[0].thumbnail.toJPEG(55);
    enqueue(jpg, `screen-${Date.now()}.jpg`, {
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
// ---------------------------------------------------------------------------
// Two-way clock sync: the portal's Shift is the source of truth. The widget
// polls it so a clock-in/out done on the web portal is reflected here (and the
// widget's own clock-in writes the same Shift, so the portal sees it too).
// ---------------------------------------------------------------------------
function reconcileShift(shift) {
  const running = !!shift;
  if (running) {
    state.sessionId = shift.id;
    state.onBreak = !!shift.break_started_at;
    if (!state.clockedIn) { state.clockedIn = true; startCapture(); }
  } else if (state.clockedIn) {
    state.clockedIn = false;
    state.onBreak = false;
    if (!config.keepCapturingAfterClockOut) stopCapture();
  }
  pushState();
  updateTray();
}

async function pollStatus() {
  if (!config.token) return;
  try {
    const res = await api('/status');
    reconcileShift(res.shift);
  } catch { /* offline / transient — try again next tick */ }
}

function startStatusSync() {
  pollStatus(); // immediate
  if (!statusTimer) statusTimer = setInterval(pollStatus, 8_000);
}
function stopStatusSync() {
  if (statusTimer) clearInterval(statusTimer);
  statusTimer = null;
}

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
  state.onBreak = false;
  if (!config.keepCapturingAfterClockOut) stopCapture(); // capture stops on clock-out
  pushState();
  updateTray();
}

async function startBreak() {
  const res = await api('/break/start', { method: 'POST' });
  state.onBreak = !!res.shift?.break_started_at;
  pushState();
  updateTray();
}

async function endBreak() {
  const res = await api('/break/end', { method: 'POST' });
  state.onBreak = !!res.shift?.break_started_at;
  pushState();
  updateTray();
}

// ---------------------------------------------------------------------------
// Windows / tray
// ---------------------------------------------------------------------------
function currentState() {
  return { ...state, mode, user: config.user, authed: !!config.token, apiUrl: config.apiUrl };
}
function pushState() {
  if (win && !win.isDestroyed()) win.webContents.send('state', currentState());
}

function createWindow() {
  win = new BrowserWindow({
    width: SIZES[mode].width,
    height: SIZES[mode].height,
    frame: false,
    // Resizable transparent windows on Windows draw a non-client frame
    // (the dark rectangle). Keep it off for clean edges, like Orbit; the
    // panel/island toggle handles sizing instead.
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    backgroundColor: '#00000000', // fully transparent — no painted rectangle
    hasShadow: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
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

// Pulse mark, 32px (inlined so no asset file needs packaging).
function trayIcon() {
  return nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAEgklEQVRYhc1XbVBUZRTeP9EP+7H33pn22g8tXVAW0AW0D9TRChDiY0tISDMEgklFjQyoQRyKFASXBVmUGPlSYxCB0LBCPidpBqFRB6206YflBx9q8bUsu+z2NOcFAUdgaQnGd+bMO+9573uf5znnvLvnSiRP4uC4Z504QcyUCuI1KS/2c4IIa4zO0js4QczgOJmjZWS5/GmOlx3hBNFsLegUZuJ4USuRKGymABfrZwH4UePFuglJSHnZ0VkHH7OsiXJunkMCJo6TOYwREMTMOQQfLlBBlj4WfkH283QPqtauQH7sRlw7thsPymJxvyQabVmhyI3ygt8rjv+BgHh1XP7FPksHXB2WoDFzBwy1B2GoS2XzYPV+6M/tw8CZOOhO70L/V++jOsEfLnaLLBPgxd7xKZjyYW83Z3RWJsLYqIHxghZDTUfYbGzQwFCTPEzi64+hO7UdfSfCcFMbDA+XJRZJTIuAq4MdOir2MbChH3NgaimAqfU4TBcL2NrYkI7B6i+gP/vpaBS6C97D75pAKG1fmDmB2rRwGGpTmGICNV8uwT9t5Ww2XcyH8YcsGGpSoK/ai4HyaPQXR6CnMAQPct9BVYzHzAio1jiz8BpqU2G8kA1TaxHMbeXA9e9gbiuDqaWQ+ake9OcSMFDxEfqLI0cJdGYHwnuFnfUE8qL9mTJSSEovnUhEVLAHLpemwXypGEPNeSMRSEbL4Qhs93FGc0rAGAFtADK2vGw9gavaUJZbyrGhQY24XZEI2RyE1csWM3AqRkO9GoPfJyEuKoztuS2dz2rg/pfB6MzagKZ4D+sJdBVFsOqm8PZ9mwSlwhbL7eUQ+Wegq9MMg58/gN7KeCgV8pG9eejK3YR7Rzei4/Bb+O2A1wwI5G+FrnQnBipjoK9KwCrHBZBx87DaaSEM55OZcvLTvpv9c2xv1dL5LPxd2YG4m6HC9SRP6wlcSXubVTUjUbEHrZlh2OG/Ej9pI6H/Jh76M58wv640Cs3JAdjm5YCmRB/cywlCR9YG3FH7ojFmnfUEciJfRU/RVna3dSXboDu9EwNlH7LrRjOtyd9/Mpw993feu8O51wbgrsYft9LegDrY1XoCPi/Z469jm9FdGILe46HoOxnOyFBUaKY1+ano6DkCp9C3Z76J24d88EeyJzyVi2f2Q3Q21pPllNR1529hYHTNaKY1+Wmfio6Ut2eocFvtiz9T1qPsg8mv4LQJOMkX4kaqigGQQgJ7aLQmP6mmiqewk3ICv7J3HZYtWjBzApwgwl1pixsH/VhhkcqHRut2As5QsYK7lerNwk7grzlN/T/wCAEpL/Zaelgpfx6Vu9fiTrrfmKl9mWIGnLIeN/e741TkixaVk0kFsceqhsTLxRaaTSvZ9fr1c3f88tnrqN+zBoeCXOC53HIfMGFDwlHfPs2D/5dJBZl6XFMqc2SN4twRMPG8qBglwEjwonYOCWRKHh8KG44Xa2c/9GKNRCJ5agICNBQ29NEwS+kwjSifDFwyOuijgfp2qtTpdMyTquXFPvYOQaZ+LOdPyvgXO7SzpIGrNwYAAAAASUVORK5CYII=');
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
  startStatusSync(); // reflect any running shift + keep in sync
  drainQueue();
  pushState();
  updateTray();
  return res.user;
});

ipcMain.handle('logout', async () => {
  stopStatusSync();
  stopCapture();
  state = { clockedIn: false, onBreak: false, capturing: false, sessionId: null, lastShotAt: null, queued: countQueued() };
  config.token = null; config.user = null;
  saveConfig(config);
  pushState();
  updateTray();
});

ipcMain.handle('clock-in', () => clockIn());
ipcMain.handle('clock-out', () => clockOut());
ipcMain.handle('break-start', () => startBreak());
ipcMain.handle('break-end', () => endBreak());
ipcMain.handle('open-portal', () => shell.openExternal(config.apiUrl));

ipcMain.handle('set-mode', (_e, m) => {
  mode = m === 'island' ? 'island' : 'panel';
  config.mode = mode;
  saveConfig(config);
  if (win && !win.isDestroyed()) {
    win.setResizable(true);
    win.setSize(SIZES[mode].width, SIZES[mode].height, true);
    win.setResizable(false);
  }
  pushState();
  return mode;
});

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
// Bring the widget back reliably: recreate if gone, restore if minimized, and
// re-center if it ended up off-screen (otherwise show() is a silent no-op when
// Electron still thinks the off-screen window is "visible").
function isOnScreen(bounds) {
  return screen.getAllDisplays().some((d) => {
    const w = d.workArea;
    return bounds.x < w.x + w.width && bounds.x + bounds.width > w.x
        && bounds.y < w.y + w.height && bounds.y + bounds.height > w.y;
  });
}

const showWindow = () => {
  if (!win || win.isDestroyed()) { createWindow(); return; }
  if (win.isMinimized()) win.restore();
  if (!isOnScreen(win.getBounds())) win.center();
  win.show();
  win.setAlwaysOnTop(true);
  win.moveTop();
  win.focus();
  pollStatus(); // refresh clock state the moment the widget is opened
};

if (!app.requestSingleInstanceLock()) app.exit(0);
app.on('second-instance', showWindow);

app.whenReady().then(() => {
  config = loadConfig();
  mode = config.mode === 'island' ? 'island' : 'panel';
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

  // Already signed in? Sync clock state with the portal right away.
  if (config.token) startStatusSync();
});

app.on('window-all-closed', () => { /* stay alive in tray */ });
