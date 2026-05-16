/*
  Sage PWA — application logic.

  Architecture:

    - IndexedDB stores sessions, messages, and settings locally
    - Web Crypto encrypts message bodies at rest using a key in IndexedDB
    - Sync state machine: messages flow pending → synced → acked
    - All actual UI updates triggered by data changes, not the other way
    - Service worker (sw.js) caches the app shell for offline use

  Encryption model (explicit acceptance):
    - Phone-side encryption protects backups and developer access
    - It does NOT protect against an attacker with an unlocked phone
    - The phone's lock screen is the line of defense for unlocked access

  Sync model:
    - send_message writes locally with state=pending, returns immediately
    - Sync runs periodically + on send + on resume
    - Sage's response arrives on the NEXT sync, not the current one
    - Three-step confirmed-delete: write local → POST → ack on next sync
*/

// ============================================================================
// Configuration
// ============================================================================

const DB_NAME = 'sage';
const DB_VERSION = 1;
const SYNC_INTERVAL_MS = 90_000;   // 90 seconds — quiet polling
const SYNC_DEBOUNCE_MS = 800;       // batch multiple sends within window

// ============================================================================
// IndexedDB helpers
// ============================================================================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sessions')) {
        const s = db.createObjectStore('sessions', { keyPath: 'session_uuid' });
        s.createIndex('started_at', 'started_at');
        s.createIndex('status', 'status');
      }
      if (!db.objectStoreNames.contains('messages')) {
        const m = db.createObjectStore('messages', { keyPath: 'message_uuid' });
        m.createIndex('session_uuid', 'session_uuid');
        m.createIndex('timestamp', 'timestamp');
        m.createIndex('state', 'state');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('inbox_acks')) {
        // Track which inbound message_uuids we've stored locally
        // and should ack on next sync
        db.createObjectStore('inbox_acks', { keyPath: 'message_uuid' });
      }
    };
  });
}

function tx(db, stores, mode) {
  const transaction = db.transaction(stores, mode);
  return stores.reduce((acc, name) => {
    acc[name] = transaction.objectStore(name);
    return acc;
  }, { _tx: transaction });
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function promisifyTx(tx) {
  return new Promise((resolve, reject) => {
    tx._tx.oncomplete = () => resolve();
    tx._tx.onerror = () => reject(tx._tx.error);
    tx._tx.onabort = () => reject(tx._tx.error);
  });
}

// ============================================================================
// Settings + Device ID + Encryption Key
// ============================================================================

async function getSetting(key) {
  const db = await openDB();
  const t = tx(db, ['settings'], 'readonly');
  const result = await promisifyRequest(t.settings.get(key));
  return result ? result.value : null;
}

async function setSetting(key, value) {
  const db = await openDB();
  const t = tx(db, ['settings'], 'readwrite');
  t.settings.put({ key, value });
  await promisifyTx(t);
}

async function ensureDeviceId() {
  let deviceId = await getSetting('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    await setSetting('device_id', deviceId);
  }
  return deviceId;
}

async function ensureEncryptionKey() {
  const db = await openDB();
  const t = tx(db, ['settings'], 'readonly');
  const existing = await promisifyRequest(t.settings.get('encryption_key'));
  if (existing) {
    return await crypto.subtle.importKey(
      'raw',
      existing.value,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  // Generate fresh key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  await setSetting('encryption_key', raw);
  return key;
}

async function encrypt(plaintext) {
  const key = await ensureEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { iv, cipher: new Uint8Array(cipher) };
}

async function decrypt(record) {
  const key = await ensureEncryptionKey();
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: record.iv },
      key,
      record.cipher
    );
    return new TextDecoder().decode(plain);
  } catch (err) {
    console.error('Decrypt failed for message', record.message_uuid);
    return '(unable to decrypt — encryption key changed?)';
  }
}

// ============================================================================
// Session and message storage
// ============================================================================

async function createSession(now) {
  now = now || new Date();
  const session = {
    session_uuid: crypto.randomUUID(),
    started_at: now.toISOString(),
    status: 'open',
    closed_at: null,
  };
  const db = await openDB();
  const t = tx(db, ['sessions'], 'readwrite');
  t.sessions.put(session);
  await promisifyTx(t);
  return session;
}

async function getSession(session_uuid) {
  const db = await openDB();
  const t = tx(db, ['sessions'], 'readonly');
  return await promisifyRequest(t.sessions.get(session_uuid));
}

async function allSessions() {
  const db = await openDB();
  const t = tx(db, ['sessions'], 'readonly');
  return await promisifyRequest(t.sessions.getAll());
}

async function closeSession(session_uuid, now) {
  now = now || new Date();
  const db = await openDB();
  const t = tx(db, ['sessions'], 'readwrite');
  const session = await promisifyRequest(t.sessions.get(session_uuid));
  if (!session) return;
  session.status = 'closed';
  session.closed_at = now.toISOString();
  // Also record a close-intent for next sync
  session.pending_close_intent = true;
  t.sessions.put(session);
  await promisifyTx(t);
}

async function appendMessage(session_uuid, role, body, now) {
  now = now || new Date();
  const encrypted = await encrypt(body);
  const message = {
    message_uuid: crypto.randomUUID(),
    session_uuid,
    timestamp: now.toISOString(),
    role,
    iv: encrypted.iv,
    cipher: encrypted.cipher,
    state: role === 'student' ? 'pending' : 'synced',
    // store plaintext temporarily? No — we re-decrypt on read.
  };
  const db = await openDB();
  const t = tx(db, ['messages'], 'readwrite');
  t.messages.put(message);
  await promisifyTx(t);
  return message;
}

async function appendInboundMessage(inbound) {
  // Server-provided message (e.g. Sage's response). Store with state=synced.
  const encrypted = await encrypt(inbound.body);
  const message = {
    message_uuid: inbound.message_uuid,
    session_uuid: inbound.session_uuid,
    timestamp: inbound.timestamp,
    role: inbound.role,
    iv: encrypted.iv,
    cipher: encrypted.cipher,
    state: 'synced',
  };
  const db = await openDB();
  const t = tx(db, ['messages', 'inbox_acks'], 'readwrite');
  // Idempotent: only insert if not already present
  const existing = await promisifyRequest(t.messages.get(inbound.message_uuid));
  if (!existing) {
    t.messages.put(message);
  }
  // Always record the ack so we tell the server we have it
  t.inbox_acks.put({ message_uuid: inbound.message_uuid });
  await promisifyTx(t);
}

async function messagesForSession(session_uuid) {
  const db = await openDB();
  const t = tx(db, ['messages'], 'readonly');
  const idx = t.messages.index('session_uuid');
  const messages = await promisifyRequest(idx.getAll(session_uuid));
  // Decrypt and sort by timestamp
  const decrypted = await Promise.all(messages.map(async m => ({
    ...m,
    body: await decrypt(m),
  })));
  decrypted.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return decrypted;
}

async function pendingMessages() {
  const db = await openDB();
  const t = tx(db, ['messages'], 'readonly');
  const idx = t.messages.index('state');
  const messages = await promisifyRequest(idx.getAll('pending'));
  const decrypted = await Promise.all(messages.map(async m => ({
    ...m,
    body: await decrypt(m),
  })));
  return decrypted;
}

async function markMessageSynced(message_uuid) {
  const db = await openDB();
  const t = tx(db, ['messages'], 'readwrite');
  const m = await promisifyRequest(t.messages.get(message_uuid));
  if (m) {
    m.state = 'synced';
    t.messages.put(m);
  }
  await promisifyTx(t);
}

async function pendingAcks() {
  const db = await openDB();
  const t = tx(db, ['inbox_acks'], 'readonly');
  return await promisifyRequest(t.inbox_acks.getAll());
}

async function clearAcks(message_uuids) {
  const db = await openDB();
  const t = tx(db, ['inbox_acks'], 'readwrite');
  for (const uuid of message_uuids) {
    t.inbox_acks.delete(uuid);
  }
  await promisifyTx(t);
}

async function sessionsWithPendingCloseIntent() {
  const all = await allSessions();
  return all.filter(s => s.pending_close_intent);
}

async function clearCloseIntent(session_uuid) {
  const db = await openDB();
  const t = tx(db, ['sessions'], 'readwrite');
  const s = await promisifyRequest(t.sessions.get(session_uuid));
  if (s) {
    delete s.pending_close_intent;
    t.sessions.put(s);
  }
  await promisifyTx(t);
}

// ============================================================================
// Sync state machine
// ============================================================================

let syncInFlight = false;
let lastSyncAt = null;
let syncDebounceTimer = null;

async function performSync() {
  if (syncInFlight) return { ok: false, reason: 'already_syncing' };

  const serverUrl = await getSetting('server_url');
  const token = await getSetting('token');
  if (!serverUrl || !token) {
    return { ok: false, reason: 'not_configured' };
  }

  syncInFlight = true;
  showSyncIndicator('Syncing...');

  try {
    // Health check first
    const healthy = await healthCheck(serverUrl);
    if (!healthy) {
      throw new Error('home_offline');
    }

    const deviceId = await ensureDeviceId();
    const pending = await pendingMessages();
    const acks = await pendingAcks();
    const closingSessions = await sessionsWithPendingCloseIntent();

    const payload = {
      device_id: deviceId,
      client_clock: new Date().toISOString(),
      outbound: await Promise.all(pending.map(async m => {
        const session = await getSession(m.session_uuid);
        return {
          message_uuid: m.message_uuid,
          session_uuid: m.session_uuid,
          session_started_at: session.started_at,
          timestamp: m.timestamp,
          role: m.role,
          body: m.body,  // already decrypted
          session_status_intent: 'open',
        };
      })),
      session_state_intents: closingSessions.map(s => ({
        session_uuid: s.session_uuid,
        intent: 'close',
        at: s.closed_at || new Date().toISOString(),
      })),
      ack_message_uuids: acks.map(a => a.message_uuid),
    };

    const response = await fetch(`${serverUrl}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      throw new Error('unauthorized');
    }
    if (!response.ok) {
      throw new Error(`server_${response.status}`);
    }

    const data = await response.json();

    // Mark all sent messages as synced
    for (const m of pending) {
      await markMessageSynced(m.message_uuid);
    }
    // Clear close intents we just communicated
    for (const s of closingSessions) {
      await clearCloseIntent(s.session_uuid);
    }
    // Clear acks we just sent
    await clearAcks(acks.map(a => a.message_uuid));

    // Process inbound messages from server
    for (const inbound of (data.inbound || [])) {
      await appendInboundMessage(inbound);
    }

    lastSyncAt = new Date();
    await setSetting('last_sync_at', lastSyncAt.toISOString());

    hideSyncIndicator();
    return { ok: true, inbound_count: (data.inbound || []).length };

  } catch (err) {
    console.warn('Sync failed:', err);
    hideSyncIndicator();
    if (err.message === 'unauthorized') {
      showBanner('Access token rejected. Update in Settings.', 'error');
    } else if (err.message === 'home_offline') {
      showBanner('Home machine unreachable. Will retry.', null);
    } else {
      // Generic transient — banner shown briefly, will auto-retry next interval
      showBanner('Sync paused. Will retry shortly.', null);
    }
    return { ok: false, reason: err.message };
  } finally {
    syncInFlight = false;
  }
}

async function healthCheck(serverUrl) {
  try {
    const res = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      // Health check has a short timeout via AbortController
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

function debouncedSync() {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    performSync().then(updateUiAfterSync);
  }, SYNC_DEBOUNCE_MS);
}

function startPeriodicSync() {
  setInterval(() => {
    performSync().then(updateUiAfterSync);
  }, SYNC_INTERVAL_MS);
}

async function updateUiAfterSync(result) {
  // Refresh current conversation view if a new inbound message arrived
  if (result && result.ok && result.inbound_count > 0) {
    if (currentSessionUuid) {
      await refreshConversation();
    }
  }
  await refreshSyncInfo();
}

// ============================================================================
// UI state and rendering
// ============================================================================

let currentSessionUuid = null;

function $(selector) {
  return document.querySelector(selector);
}

function showScreen(screenId) {
  const screens = ['onboarding', 'app'];
  for (const s of screens) {
    const el = document.getElementById(s);
    if (el) el.hidden = (s !== screenId);
  }
}

function showDrawer(drawerId) {
  document.getElementById(drawerId).hidden = false;
}

function hideDrawer(drawerId) {
  document.getElementById(drawerId).hidden = true;
}

function showSyncIndicator(text) {
  const el = $('#sync-indicator');
  el.textContent = text;
  el.hidden = false;
}

function hideSyncIndicator() {
  $('#sync-indicator').hidden = true;
}

let bannerTimeout = null;
function showBanner(text, level = null) {
  const banner = $('#banner');
  const msg = $('#banner-message');
  msg.textContent = text;
  banner.className = 'banner' + (level === 'error' ? ' error' : '');
  banner.hidden = false;
  if (bannerTimeout) clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => { banner.hidden = true; }, 4000);
}

async function refreshConversation() {
  const view = $('#conversation-view');
  const emptyState = $('#empty-state');

  if (!currentSessionUuid) {
    view.innerHTML = '';
    view.appendChild(emptyState);
    emptyState.hidden = false;
    return;
  }

  const messages = await messagesForSession(currentSessionUuid);
  view.innerHTML = '';

  if (messages.length === 0) {
    view.appendChild(emptyState);
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  for (const m of messages) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${m.role}`;

    const role = document.createElement('div');
    role.className = 'message-role';
    role.textContent = m.role === 'student' ? 'You' : 'Sage';

    const body = document.createElement('div');
    body.className = 'message-body';
    body.textContent = m.body;

    wrapper.appendChild(role);
    wrapper.appendChild(body);

    if (m.state === 'pending') {
      const status = document.createElement('div');
      status.className = 'message-status';
      status.textContent = 'Pending sync';
      wrapper.appendChild(status);
    }

    view.appendChild(wrapper);
  }

  // Scroll to bottom
  view.scrollTop = view.scrollHeight;
}

async function refreshThreadList() {
  const list = $('#thread-list');
  list.innerHTML = '';
  const sessions = await allSessions();
  sessions.sort((a, b) => b.started_at.localeCompare(a.started_at));

  for (const s of sessions) {
    const li = document.createElement('li');
    const btn = document.createElement('button');

    const date = new Date(s.started_at);
    const dateLabel = document.createElement('span');
    dateLabel.className = 'thread-date';
    dateLabel.textContent = date.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    // Preview from first message
    const messages = await messagesForSession(s.session_uuid);
    const firstStudent = messages.find(m => m.role === 'student');
    const preview = document.createElement('span');
    preview.className = 'thread-preview';
    preview.textContent = firstStudent ? firstStudent.body.slice(0, 100) : '(empty)';

    const status = document.createElement('span');
    status.className = `thread-status ${s.status}`;
    status.textContent = s.status;

    btn.appendChild(dateLabel);
    btn.appendChild(preview);
    btn.appendChild(status);

    btn.onclick = () => {
      currentSessionUuid = s.session_uuid;
      hideDrawer('thread-drawer');
      refreshConversation();
      updateComposerState();
    };

    li.appendChild(btn);
    list.appendChild(li);
  }
}

async function refreshSyncInfo() {
  const deviceId = await ensureDeviceId();
  $('#info-device-id').textContent = deviceId.slice(0, 8) + '…';

  const lastSync = await getSetting('last_sync_at');
  if (lastSync) {
    $('#info-last-sync').textContent = new Date(lastSync).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } else {
    $('#info-last-sync').textContent = 'never';
  }

  const pending = await pendingMessages();
  $('#info-pending-count').textContent = String(pending.length);
}

async function updateComposerState() {
  if (!currentSessionUuid) {
    $('#message-input').disabled = false;
    return;
  }
  const session = await getSession(currentSessionUuid);
  const closed = session && session.status !== 'open';
  $('#message-input').disabled = closed;
  $('#message-input').placeholder = closed
    ? 'This conversation has ended.'
    : "What's going on?";
  $('#end-conversation').disabled = closed;
}

// ============================================================================
// UI event wiring
// ============================================================================

async function handleSendMessage(text) {
  if (!text.trim()) return;

  // Make sure we have an open session
  if (!currentSessionUuid) {
    const session = await createSession();
    currentSessionUuid = session.session_uuid;
  } else {
    const session = await getSession(currentSessionUuid);
    if (!session || session.status !== 'open') {
      const newSession = await createSession();
      currentSessionUuid = newSession.session_uuid;
    }
  }

  await appendMessage(currentSessionUuid, 'student', text);
  await refreshConversation();
  debouncedSync();
}

async function handleEndConversation() {
  if (!currentSessionUuid) return;
  await closeSession(currentSessionUuid);
  await refreshConversation();
  await updateComposerState();
  debouncedSync();
}

async function handleSettingsSave(serverUrl, token) {
  // Normalize server URL: trim, drop trailing slash
  serverUrl = serverUrl.trim().replace(/\/$/, '');
  token = token.trim();
  await setSetting('server_url', serverUrl);
  await setSetting('token', token);
}

async function handleOnboardingSubmit(serverUrl, token) {
  await handleSettingsSave(serverUrl, token);
  const result = await performSync();
  if (result.ok || result.reason === 'home_offline') {
    // home_offline is acceptable - they may not be on home WiFi right now
    showScreen('app');
    await initializeApp();
    return true;
  }
  if (result.reason === 'unauthorized') {
    $('#onb-status').textContent = 'Token rejected. Check and try again.';
    $('#onb-status').className = 'status-line error';
  } else {
    $('#onb-status').textContent = 'Could not connect. Check server URL.';
    $('#onb-status').className = 'status-line error';
  }
  return false;
}

function autoResizeTextarea() {
  const el = $('#message-input');
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

function wireEvents() {
  // Message form
  const form = $('#message-form');
  const input = $('#message-input');
  const sendBtn = $('#send-button');

  input.addEventListener('input', () => {
    autoResizeTextarea();
    sendBtn.disabled = !input.value.trim();
  });

  input.addEventListener('keydown', (e) => {
    // Enter sends, Shift+Enter adds newline. On mobile we keep Enter as newline.
    const onDesktop = window.matchMedia('(hover: hover)').matches;
    if (e.key === 'Enter' && !e.shiftKey && onDesktop) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value;
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    await handleSendMessage(text);
  });

  // Drawer triggers
  $('#open-thread-list').addEventListener('click', async () => {
    await refreshThreadList();
    showDrawer('thread-drawer');
  });
  $('#close-thread-drawer').addEventListener('click', () => hideDrawer('thread-drawer'));
  $('#thread-backdrop').addEventListener('click', () => hideDrawer('thread-drawer'));

  $('#open-settings').addEventListener('click', async () => {
    $('#settings-server-url').value = (await getSetting('server_url')) || '';
    $('#settings-token').value = (await getSetting('token')) || '';
    await refreshSyncInfo();
    showDrawer('settings-drawer');
  });
  $('#close-settings-drawer').addEventListener('click', () => hideDrawer('settings-drawer'));
  $('#settings-backdrop').addEventListener('click', () => hideDrawer('settings-drawer'));

  // New conversation
  $('#new-conversation').addEventListener('click', async () => {
    const session = await createSession();
    currentSessionUuid = session.session_uuid;
    hideDrawer('thread-drawer');
    await refreshConversation();
    await updateComposerState();
    $('#message-input').focus();
  });

  // End conversation
  $('#end-conversation').addEventListener('click', handleEndConversation);

  // Manual sync
  $('#manual-sync').addEventListener('click', async () => {
    const result = await performSync();
    await updateUiAfterSync(result);
    if (result.ok) showBanner('Sync complete.');
  });

  // Settings form
  $('#settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = $('#settings-server-url').value;
    const tok = $('#settings-token').value;
    await handleSettingsSave(url, tok);
    showBanner('Settings saved.');
    hideDrawer('settings-drawer');
    debouncedSync();
  });

  // Onboarding
  $('#onboarding-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#onb-status').textContent = 'Connecting...';
    $('#onb-status').className = 'status-line';
    const url = $('#onb-server-url').value;
    const tok = $('#onb-token').value;
    await handleOnboardingSubmit(url, tok);
  });

  // Pause sync when offline, resume when back online
  window.addEventListener('online', () => {
    debouncedSync();
  });

  // Sync on app focus (returning to PWA from background)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      debouncedSync();
    }
  });
}

// ============================================================================
// Boot
// ============================================================================

async function initializeApp() {
  // Find the most recently started OPEN session, or null if none exists
  const sessions = await allSessions();
  const open = sessions.filter(s => s.status === 'open');
  open.sort((a, b) => b.started_at.localeCompare(a.started_at));
  if (open.length > 0) {
    currentSessionUuid = open[0].session_uuid;
  } else {
    currentSessionUuid = null;
  }

  await refreshConversation();
  await updateComposerState();
  await refreshSyncInfo();

  // Kick off background sync
  debouncedSync();
  startPeriodicSync();
}

async function boot() {
  wireEvents();

  const serverUrl = await getSetting('server_url');
  const token = await getSetting('token');

  if (!serverUrl || !token) {
    showScreen('onboarding');
  } else {
    showScreen('app');
    await initializeApp();
  }

  // Register service worker (best-effort, doesn't block boot)
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
    } catch (err) {
      console.warn('Service worker registration failed', err);
    }
  }
}

boot();
