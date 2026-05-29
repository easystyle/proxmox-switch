require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===== CONFIG =====
const PANEL_USER = process.env.PANEL_USER;
const PANEL_PASS = process.env.PANEL_PASS;
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret';
const PANEL_LANG = process.env.PANEL_LANG || 'en';

const AUTH_TOKEN = crypto.createHmac('sha256', SESSION_SECRET)
  .update(`${PANEL_USER}:${PANEL_PASS}`)
  .digest('hex');

// ===== LOGIN PAGE =====
const loginStrings = {
  tr: { title: 'Proxmox Kontrol', user: 'Kullanici', pass: 'Sifre', btn: 'Giris', err: 'Hatali kullanici adi veya sifre' },
  en: { title: 'Proxmox Control', user: 'Username', pass: 'Password', btn: 'Login', err: 'Invalid username or password' }
};

app.get('/login', (req, res) => {
  const s = loginStrings[PANEL_LANG] || loginStrings.en;
  res.send(`<!DOCTYPE html>
<html lang="${PANEL_LANG}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>${s.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1117; color: #e4e4e7; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .login-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 16px; padding: 32px; width: 100%; max-width: 360px; margin: 20px; }
    h1 { font-size: 20px; text-align: center; margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 13px; color: #8b8d97; margin-bottom: 6px; }
    input { width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.05); border: 1px solid #2a2d3a; border-radius: 10px; color: #e4e4e7; font-size: 15px; outline: none; }
    input:focus { border-color: #3b82f6; }
    button { width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    button:active { transform: scale(0.97); }
    .error { color: #ef4444; font-size: 13px; text-align: center; margin-top: 12px; display: none; }
  </style>
</head>
<body>
  <div class="login-card">
    <h1>${s.title}</h1>
    <form method="POST" action="/login">
      <div class="form-group"><label>${s.user}</label><input type="text" name="username" autocomplete="username" required autofocus></div>
      <div class="form-group"><label>${s.pass}</label><input type="password" name="password" autocomplete="current-password" required></div>
      <button type="submit">${s.btn}</button>
      <p class="error" id="err"></p>
    </form>
  </div>
  ${req.query.fail ? `<script>document.getElementById("err").style.display="block";document.getElementById("err").textContent="${s.err}";</script>` : ''}
</body>
</html>`);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === PANEL_USER && password === PANEL_PASS) {
    res.cookie('auth_token', AUTH_TOKEN, { maxAge: 365*24*60*60*1000, httpOnly: true, sameSite: 'lax' });
    addLog('login', `Login: ${username}`);
    return res.redirect('/');
  }
  addLog('login', `Failed login: ${username}`, 'error');
  res.redirect('/login?fail=1');
});

app.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  addLog('logout', 'Logout');
  res.redirect('/login');
});

app.get('/api/lang', (req, res) => { res.json({ lang: PANEL_LANG }); });

// ===== AUTH =====
function requireAuth(req, res, next) {
  if (req.cookies.auth_token === AUTH_TOKEN) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
  res.redirect('/login');
}
app.use(requireAuth);
app.use(express.static(path.join(__dirname, 'public')));

// Proxmox config
// Proxmox API Tokenによる認証
const PROXMOX_HOST = process.env.PROXMOX_HOST;
const PROXMOX_USER = process.env.PROXMOX_USER;
const PROXMOX_TOKEN_NAME = process.env.PROXMOX_TOKEN_NAME;
const PROXMOX_TOKEN_SECRET = process.env.PROXMOX_TOKEN_SECRET;
const PROXMOX_NODE = process.env.PROXMOX_NODE;

const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const LOG_FILE = path.join(__dirname, 'logs.json');
const MAX_LOGS = 100;
const agent = new https.Agent({ rejectUnauthorized: false });

// ===== LOGGING =====
function getLogs() { try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch { return []; } }
function addLog(action, detail, status = 'ok') {
  const logs = getLogs();
  logs.unshift({ time: new Date().toISOString(), action, detail, status });
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// ===== SETTINGS =====
function getSettings() {
  try {
    const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    // Migrate old format
    if (data.switchVM1 !== undefined && !data.switches) {
      const migrated = {
        switches: [{ vm1: data.switchVM1, vm2: data.switchVM2, visible: true }],
        showPowerOff: true
      };
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(migrated, null, 2));
      return migrated;
    }
    return data;
  } catch {
    const defaults = { switches: [], showPowerOff: true };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }
}
function saveSettings(s) { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2)); }

// ===== PROXMOX API =====
async function proxmoxAPI(method, endpoint, data = null) {
  // APIトークン認証に必要な環境変数が設定されているか確認
  if (!PROXMOX_USER || !PROXMOX_TOKEN_NAME || !PROXMOX_TOKEN_SECRET) {
    const errorMessage = 'Proxmox API Token credentials (PROXMOX_USER, PROXMOX_TOKEN_NAME, PROXMOX_TOKEN_SECRET) are not fully configured in the environment variables. Please check your .env file.';
    console.error(errorMessage);
    // addLog が利用可能なスコープであれば、ログに記録することもできます。
    // addLog('proxmox-api-auth', errorMessage, 'error');
    throw new Error(errorMessage);
  }

  // APIトークンのAuthorizationヘッダーを構築
  const authHeader = `PVEAPIToken=${PROXMOX_USER}!${PROXMOX_TOKEN_NAME}=${PROXMOX_TOKEN_SECRET}`;

  const config = {
    method,
    url: `${PROXMOX_HOST}${endpoint}`,
    httpsAgent: agent, // 自己署名証明書などに対応
    headers: {
      'Authorization': authHeader,
      // APIトークン認証ではCookieとCSRFPreventionTokenは不要なため削除
      // 'Cookie': `PVEAuthCookie=${auth.ticket}`,
      // 'CSRFPreventionToken': auth.csrf,
      // axiosは`data`プロパティに文字列が渡された場合、自動的に
      // 'Content-Type': 'application/x-www-form-urlencoded'を設定することが多いため、
      // ここで明示的に設定する必要は通常ありません。
    }
  };

  // POST/PUTリクエストでデータがある場合にdataプロパティを設定
  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    // Proxmox APIからのレスポンスは通常 { data: { data: actual_payload } } の形式なので、
    // `.data.data` を返すようにします。
    return response.data.data;
  } catch (error) {
    // エラーハンドリングの強化
    let errorMessage = `Proxmox API Error: ${method} ${endpoint}`;
    if (error.response) {
      // サーバーからのエラーレスポンスがある場合 (HTTPステータスコードが2xx以外)
      errorMessage += ` - Status: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - Message: ${error.response.data.message}`;
      } else if (error.response.data && error.response.data.errors) {
        // Proxmox APIのValidationエラーなどがerrorsフィールドに含まれる場合
        errorMessage += ` - Errors: ${JSON.stringify(error.response.data.errors)}`;
      } else if (error.response.data) {
        // その他のレスポンスデータ
        errorMessage += ` - Response Data: ${JSON.stringify(error.response.data)}`;
      }
    } else if (error.request) {
      // リクエストは行われたが、レスポンスがなかった場合 (例: ネットワークエラー、Proxmoxサーバーがダウンしているなど)
      errorMessage += ` - No response received from Proxmox. ${error.message}`;
    } else {
      // リクエストの設定中にエラーが発生した場合 (例: configオブジェクトの誤り)
      errorMessage += ` - Request setup error: ${error.message}`;
    }
    console.error(errorMessage);
    // addLog が利用可能なスコープであれば、ログに記録することもできます。
    // addLog('proxmox-api', errorMessage, 'error');
    throw new Error(errorMessage); // エラーを上位にスローして、呼び出し元で適切に処理させる
  }
}

let nodeName = PROXMOX_NODE;
async function detectNode() {
  try {
    const nodes = await proxmoxAPI('GET', '/api2/json/nodes');
    let foundMatch = false;

    if (nodes && nodes.length > 0) {
      // 返却されたノードリストをループし、PROXMOX_NODEと一致するか照合
      for (const node of nodes) {
        if (node.node === PROXMOX_NODE) {
          nodeName = PROXMOX_NODE; // 設定されたProxmoxノードが検出された場合
          console.log(`Detected configured Proxmox node: ${nodeName}`);
          foundMatch = true;
          break; // 一致するノードが見つかったらループを抜ける
        }
      }
    }

    if (!foundMatch) {
      // PROXMOX_NODE が見つからなかった、またはノードリストが空だった場合
      console.warn(`Configured Proxmox node '${PROXMOX_NODE}' not found among active nodes or no nodes returned.`);
    }
  } catch (e) {
    // Proxmox APIへの接続自体に失敗した場合 (例: サーバーダウン、認証情報エラーなど)
    console.error('Error connecting to Proxmox API or fetching nodes:', e.message);
    console.warn(`Configured Proxmox node '${PROXMOX_NODE}' not found among active nodes or no nodes returned.`);
  }
}

function extractPCIDevices(config) {
  const devices = [];
  for (const [key, value] of Object.entries(config)) {
    if (key.startsWith('hostpci')) devices.push({ key, address: value.split(',')[0].trim() });
  }
  return devices;
}

// ===== API ROUTES =====

app.get('/api/settings', (req, res) => { res.json(getSettings()); });
app.post('/api/settings', (req, res) => {
  const s = req.body;
  saveSettings(s);
  addLog('settings', 'Settings updated');
  res.json({ ok: true });
});

app.get('/api/logs', (req, res) => { res.json(getLogs()); });

// List VMs with onboot info
app.get('/api/vms', async (req, res) => {
  try {
    const qemu = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu`);
    const lxc = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc`);
    const vmList = [
      ...(qemu || []).map(v => ({ ...v, type: 'qemu' })),
      ...(lxc || []).map(v => ({ ...v, type: 'lxc' }))
    ].sort((a, b) => a.vmid - b.vmid);

    // Fetch onboot for each VM
    const enriched = await Promise.all(vmList.map(async (vm) => {
      try {
        const config = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/${vm.type}/${vm.vmid}/config`);
        return { ...vm, onboot: config.onboot ? 1 : 0 };
      } catch { return { ...vm, onboot: 0 }; }
    }));

    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get VM config
app.get('/api/vm/:vmid/config', async (req, res) => {
  try {
    const vmid = req.params.vmid;
    try { res.json(await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu/${vmid}/config`)); }
    catch { res.json(await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc/${vmid}/config`)); }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Set VM onboot
app.post('/api/vm/:vmid/onboot', async (req, res) => {
  try {
    const vmid = req.params.vmid;
    const type = req.body.type || 'qemu';
    const onboot = req.body.onboot ? 1 : 0;
    await proxmoxAPI('PUT', `/api2/json/nodes/${nodeName}/${type}/${vmid}/config`, `onboot=${onboot}`);
    addLog('config', `VM ${vmid} onboot=${onboot}`);
    res.json({ ok: true });
  } catch (e) {
    addLog('config', `VM ${req.params.vmid} onboot change failed: ${e.message}`, 'error');
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/vm/:vmid/status', async (req, res) => {
  try {
    const vmid = req.params.vmid;
    try { res.json({ ...(await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu/${vmid}/status/current`)), type: 'qemu' }); }
    catch { res.json({ ...(await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc/${vmid}/status/current`)), type: 'lxc' }); }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/vm/:vmid/pci-conflicts', async (req, res) => {
  try {
    const vmid = parseInt(req.params.vmid);
    let targetConfig;
    try { targetConfig = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu/${vmid}/config`); }
    catch { targetConfig = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc/${vmid}/config`); }

    const targetDevices = extractPCIDevices(targetConfig);
    if (targetDevices.length === 0) return res.json({ conflicts: [] });

    const qemu = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu`);
    const lxc = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc`);
    const runningVMs = [
      ...(qemu || []).filter(v => v.status === 'running').map(v => ({ ...v, type: 'qemu' })),
      ...(lxc || []).filter(v => v.status === 'running').map(v => ({ ...v, type: 'lxc' }))
    ].filter(v => v.vmid !== vmid);

    const conflicts = [];
    for (const vm of runningVMs) {
      try {
        const config = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/${vm.type}/${vm.vmid}/config`);
        const rd = extractPCIDevices(config);
        for (const td of targetDevices) {
          for (const r of rd) {
            if (td.address.split('.')[0] === r.address.split('.')[0] || td.address === r.address) {
              conflicts.push({ device: td.address, runningVM: vm.vmid, runningVMName: vm.name || `VM ${vm.vmid}`, runningVMType: vm.type });
            }
          }
        }
      } catch {}
    }
    res.json({ conflicts });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/vm/:vmid/start', async (req, res) => {
  try {
    const vmid = req.params.vmid, type = req.body.type || 'qemu';
    const r = await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${type}/${vmid}/status/start`);
    addLog('start', `VM ${vmid} started`);
    res.json({ ok: true, upid: r });
  } catch (e) { addLog('start', `VM ${req.params.vmid} failed: ${e.message}`, 'error'); res.status(500).json({ error: e.message }); }
});

app.post('/api/vm/:vmid/shutdown', async (req, res) => {
  try {
    const vmid = req.params.vmid, type = req.body.type || 'qemu';
    const r = await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${type}/${vmid}/status/shutdown`);
    addLog('shutdown', `VM ${vmid} shutting down`);
    res.json({ ok: true, upid: r });
  } catch (e) { addLog('shutdown', `VM ${req.params.vmid} failed: ${e.message}`, 'error'); res.status(500).json({ error: e.message }); }
});

app.post('/api/vm/:vmid/stop', async (req, res) => {
  try {
    const vmid = req.params.vmid, type = req.body.type || 'qemu';
    const r = await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${type}/${vmid}/status/stop`);
    addLog('force-stop', `VM ${vmid} force stopped`);
    res.json({ ok: true, upid: r });
  } catch (e) { addLog('force-stop', `VM ${req.params.vmid} failed: ${e.message}`, 'error'); res.status(500).json({ error: e.message }); }
});

app.post('/api/vm/:vmid/reset', async (req, res) => {
  try {
    const vmid = req.params.vmid, type = req.body.type || 'qemu';
    const r = await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${type}/${vmid}/status/reset`);
    addLog('reset', `VM ${vmid} reset`);
    res.json({ ok: true, upid: r });
  } catch (e) { addLog('reset', `VM ${req.params.vmid} failed: ${e.message}`, 'error'); res.status(500).json({ error: e.message }); }
});

app.post('/api/vm/:vmid/kill-tasks', async (req, res) => {
  try {
    const vmid = req.params.vmid;
    const tasks = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/tasks?vmid=${vmid}&source=active`);
    const killed = [];
    for (const task of (tasks || [])) {
      if (task.status === undefined || task.status === '') {
        try { await proxmoxAPI('DELETE', `/api2/json/nodes/${nodeName}/tasks/${encodeURIComponent(task.upid)}`); killed.push(task.upid); } catch {}
      }
    }
    if (killed.length > 0) addLog('kill-tasks', `VM ${vmid}: ${killed.length} tasks killed`);
    res.json({ ok: true, killed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/switch', async (req, res) => {
  try {
    const { switchIndex, direction } = req.body;
    const settings = getSettings();
    const sw = settings.switches[switchIndex];
    if (!sw) return res.status(400).json({ error: 'Invalid switch index' });

    let shutdownVM, startVM;
    if (direction === 'vm1_to_vm2') { shutdownVM = sw.vm1; startVM = sw.vm2; }
    else { shutdownVM = sw.vm2; startVM = sw.vm1; }

    const qvms = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu`);
    const lxcs = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc`);
    const allVMs = [
      ...(qvms || []).map(v => ({ vmid: v.vmid, type: 'qemu', status: v.status, name: v.name })),
      ...(lxcs || []).map(v => ({ vmid: v.vmid, type: 'lxc', status: v.status, name: v.name }))
    ];

    const shutdownInfo = allVMs.find(v => v.vmid === shutdownVM);
    const startInfo = allVMs.find(v => v.vmid === startVM);
    if (!shutdownInfo || !startInfo) return res.status(400).json({ error: 'VM not found' });

    addLog('switch', `${shutdownInfo.name || shutdownVM} -> ${startInfo.name || startVM}`);

    if (shutdownInfo.status === 'running') {
      await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${shutdownInfo.type}/${shutdownVM}/status/shutdown`);
      let stopped = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const st = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/${shutdownInfo.type}/${shutdownVM}/status/current`);
          if (st.status === 'stopped') { stopped = true; break; }
        } catch { break; }
      }
      if (!stopped) {
        await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${shutdownInfo.type}/${shutdownVM}/status/stop`);
        await new Promise(r => setTimeout(r, 3000));
        addLog('switch', `${shutdownInfo.name || shutdownVM} force stopped (timeout)`);
      }
    }

    await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${startInfo.type}/${startVM}/status/start`);
    addLog('switch', `${startInfo.name || startVM} started`);
    res.json({ ok: true, shutdown: shutdownVM, started: startVM });
  } catch (e) { addLog('switch', `Error: ${e.message}`, 'error'); res.status(500).json({ error: e.message }); }
});

app.post('/api/shutdown-all', async (req, res) => {
  try {
    const qvms = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu`);
    const lxcs = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc`);
    const running = [...(qvms||[]).filter(v=>v.status==='running').map(v=>({vmid:v.vmid,type:'qemu'})), ...(lxcs||[]).filter(v=>v.status==='running').map(v=>({vmid:v.vmid,type:'lxc'}))];
    for (const vm of running) { try { await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${vm.type}/${vm.vmid}/status/shutdown`); } catch {} }
    addLog('shutdown-all', `${running.length} VMs shutting down`);
    res.json({ ok: true, count: running.length });
  } catch (e) { addLog('shutdown-all', `Error: ${e.message}`, 'error'); res.status(500).json({ error: e.message }); }
});

app.post('/api/force-stop-all', async (req, res) => {
  try {
    const qvms = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu`);
    const lxcs = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc`);
    const running = [...(qvms||[]).filter(v=>v.status==='running').map(v=>({vmid:v.vmid,type:'qemu'})), ...(lxcs||[]).filter(v=>v.status==='running').map(v=>({vmid:v.vmid,type:'lxc'}))];
    for (const vm of running) { try { await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${vm.type}/${vm.vmid}/status/stop`); } catch {} }
    addLog('force-stop-all', `${running.length} VMs force stopped`);
    res.json({ ok: true, count: running.length });
  } catch (e) { addLog('force-stop-all', `Error: ${e.message}`, 'error'); res.status(500).json({ error: e.message }); }
});

app.post('/api/poweroff', async (req, res) => {
  try {
    const qvms = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu`);
    const lxcs = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc`);
    const running = [...(qvms||[]).filter(v=>v.status==='running').map(v=>({vmid:v.vmid,type:'qemu'})), ...(lxcs||[]).filter(v=>v.status==='running').map(v=>({vmid:v.vmid,type:'lxc'}))];
    for (const vm of running) { try { await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${vm.type}/${vm.vmid}/status/stop`); } catch {} }
    await new Promise(r => setTimeout(r, 3000));
    await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/status`, 'command=shutdown');
    addLog('poweroff', 'Host shutting down');
    res.json({ ok: true });
  } catch (e) { addLog('poweroff', `Error: ${e.message}`, 'error'); res.status(500).json({ error: e.message }); }
});

app.get('/api/tasks', async (req, res) => {
  try { res.json(await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/tasks?source=active&limit=50`) || []); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Proxmox Kontrol Panel: http://localhost:${PORT}`);
  addLog('server', 'Server started');
  await detectNode();
});
