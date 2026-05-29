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

/**
 * 指定されたVMIDのVMの現在の情報（タイプ、ステータス、名前）を取得します。
 * @param {number} vmid - VMID
 * @returns {Promise<{vmid: number, type: string, status: string, name: string}>} VM情報
 */
async function getVMInfo(vmid) {
  try {
    const qemuStatus = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu/${vmid}/status/current`);
    const qemuConfig = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu/${vmid}/config`);
    return { vmid, type: 'qemu', status: qemuStatus.status, name: qemuConfig.name || `VM ${vmid}` };
  } catch (e) {
    // qemuでなければlxcを試す
    try {
      const lxcStatus = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc/${vmid}/status/current`);
      const lxcConfig = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc/${vmid}/config`);
      return { vmid, type: 'lxc', status: lxcStatus.status, name: lxcConfig.hostname || `CT ${vmid}` };
    } catch (e) {
      // どちらでもない場合、VMは存在しないかアクセス不能
      return null;
    }
  }
}

/**
 * 指定されたVMIDとタイプのVMの名前を取得します。
 * @param {number} vmid - VMID
 * @param {string} type - 'qemu' or 'lxc'
 * @returns {Promise<string>} VMの名前
 */
async function getVMName(vmid, type) {
  try {
    if (type === 'qemu') {
      const config = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu/${vmid}/config`);
      return config.name || `VM ${vmid}`;
    } else if (type === 'lxc') {
      const config = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc/${vmid}/config`);
      return config.hostname || `CT ${vmid}`;
    }
  } catch {
    return `VM ${vmid}`; // エラー時はデフォルト名
  }
}

/**
 * 指定されたVMIDのアクティブなタスクをすべて強制終了します。
 * @param {number} vmid - VMID
 */
async function killVMTasks(vmid) {
  try {
    const tasks = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/tasks?vmid=${vmid}&source=active`);
    const killed = [];
    
    //console.log(`[killVMTasks] Found ${tasks.length || 0} active tasks for VM ${vmid}.`); // デバッグ出力

    for (const task of (tasks || [])) {
      // ProxmoxのAPIから取得されるアクティブなタスクは、多くの場合 status が 'RUNNING' です。
      // 'source=active' で取得されるタスクは、基本的に処理を妨げているものとして強制終了の対象とします。
      // 以前の条件 (task.status === undefined || task.status === '') は、
      // 実行中のタスクを適切に捕捉できていなかったため削除します。
      console.warn(`[killVMTasks] Attempting to kill task UPID: ${task.upid}, STATUS: ${task.status} for VM ${vmid}`);
      
      try {
        await proxmoxAPI('DELETE', `/api2/json/nodes/${nodeName}/tasks/${encodeURIComponent(task.upid)}`);
        killed.push(task.upid);
        addLog('kill-tasks', `Successfully killed task ${task.upid} for VM ${vmid}.`);
      } catch (err) {
        console.warn(`[killVMTasks] Failed to kill task ${task.upid} for VM ${vmid}: ${err.message}`);
        addLog('kill-tasks', `Failed to kill task ${task.upid} for VM ${vmid}: ${err.message}`, 'error');
      }
    }
    
    if (killed.length > 0) {
      addLog('kill-tasks', `VM ${vmid}: ${killed.length} tasks killed: ${killed.join(', ')}`);
    } else {
      addLog('kill-tasks', `VM ${vmid}: No active tasks found or none needed killing.`);
    }
  } catch (e) {
    console.error(`[killVMTasks] Error in killVMTasks for VM ${vmid}: ${e.message}`);
    addLog('kill-tasks', `VM ${vmid} task killing failed: ${e.message}`, 'error');
  }
}

/**
 * VMが停止するまでポーリングで待機し、指定時間内に停止しない場合は強制停止します。
 * @param {number} vmid - VMID
 * @param {string} type - 'qemu' or 'lxc'
 * @param {number} timeoutMs - 停止を待つ最大時間 (ミリ秒)
 * @returns {Promise<boolean>} 正常に停止したかどうか
 */
async function waitForVMToStop(vmid, type, timeoutMs = 30000) {
  const checkInterval = 2000; // 2秒ごとにチェック
  let elapsed = 0;
  while (elapsed < timeoutMs) {
    try {
      const status = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/${type}/${vmid}/status/current`);
      if (status.status === 'stopped') {
        return true; // 停止した
      }
    } catch (e) {
      // VMが見つからない場合（削除されたなど）は停止したとみなす
      if (e.message.includes('404')) {
        return true;
      }
      // それ以外のAPIエラーはログに記録するが、続行
      console.warn(`Error checking status for VM ${vmid}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, checkInterval));
    elapsed += checkInterval;
  }
  // タイムアウトした場合は強制停止を試みる
  try {
    addLog('force-stop', `VM ${vmid} did not shut down gracefully within ${timeoutMs / 1000}s, forcing stop.`);
    // 強制停止前に、現在実行中のシャットダウンタスク（既存のすべてのタスク）を強制終了
    await killVMTasks(vmid); 
    await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${type}/${vmid}/status/stop`);
    // 強制停止後、少し待機
    await new Promise(r => setTimeout(r, 3000));
    const status = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/${type}/${vmid}/status/current`);
    return status.status === 'stopped';
  } catch (e) {
    console.error(`Failed to force stop VM ${vmid}: ${e.message}`);
    addLog('force-stop', `VM ${vmid} failed to force stop: ${e.message}`, 'error');
    return false;
  }
}

/**
 * 起動しようとしているVMとPCIデバイスが競合するVMを検出し、それらをシャットダウン/強制停止します。
 * @param {number} targetVmid - 起動しようとしているVMのID
 * @param {string} targetVMType - 起動しようとしているVMのタイプ ('qemu' or 'lxc')
 * @returns {Promise<Array<{vmid: number, name: string, type: string}>>} 停止した競合VMのリスト
 */
async function resolvePCIConflictsAndStopVMs(targetVmid, targetVMType) {
  addLog('pci-resolve', `Checking PCI conflicts for VM ${targetVmid} (${targetVMType}).`);
  let targetConfig;
  try {
    targetConfig = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/${targetVMType}/${targetVmid}/config`);
  } catch (e) {
    throw new Error(`Failed to get config for target VM ${targetVmid}: ${e.message}`);
  }

  const targetDevices = extractPCIDevices(targetConfig);
  if (targetDevices.length === 0) {
    addLog('pci-resolve', `VM ${targetVmid} has no PCI devices, no conflicts to resolve.`);
    return [];
  }

  const qemu = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu`);
  const lxc = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc`);
  const runningVMs = [
    ...(qemu || []).filter(v => v.status === 'running').map(v => ({ ...v, type: 'qemu' })),
    ...(lxc || []).filter(v => v.status === 'running').map(v => ({ ...v, type: 'lxc' }))
  ].filter(v => v.vmid !== targetVmid); // 自身は競合対象から除外

  const conflictingVMs = new Map(); // vmid -> { name, type, devices: [] }

  for (const vm of runningVMs) {
    try {
      const config = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/${vm.type}/${vm.vmid}/config`);
      const runningDevices = extractPCIDevices(config);
      for (const td of targetDevices) {
        for (const rd of runningDevices) {
          // PCIアドレスのデバイス部分 (例: 0000:01:00.0 の 01:00) が一致するか、
          // 完全なアドレスが一致するか
          const tdAddr = td.address.split('.')[0];
          const rdAddr = rd.address.split('.')[0];
          if (tdAddr === rdAddr || td.address === rd.address) {
            if (!conflictingVMs.has(vm.vmid)) {
              conflictingVMs.set(vm.vmid, { vmid: vm.vmid, name: vm.name || `VM ${vm.vmid}`, type: vm.type });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Could not get config for running VM ${vm.vmid} to check PCI conflicts: ${e.message}`);
    }
  }

  const stoppedConflictingVMs = [];
  if (conflictingVMs.size > 0) {
    addLog('pci-resolve', `Found conflicts for VM ${targetVmid}. Conflicting VMs: ${Array.from(conflictingVMs.values()).map(v => `${v.name} (${v.vmid})`).join(', ')}`);
    // 競合するVMをシャットダウン/強制停止
    for (const [vmid, info] of conflictingVMs.entries()) {
      addLog('pci-resolve', `Shutting down conflicting VM: ${info.name} (${vmid})`);
      try {
        await killVMTasks(vmid); // まずタスクを強制終了
        await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${info.type}/${vmid}/status/shutdown`); // グレースフルシャットダウンを試みる
        const stopped = await waitForVMToStop(vmid, info.type, 30000); // 30秒待機
        if (stopped) {
          addLog('pci-resolve', `Conflicting VM ${info.name} (${vmid}) stopped.`);
          stoppedConflictingVMs.push(info);
        } else {
          addLog('pci-resolve', `Conflicting VM ${info.name} (${vmid}) could not be stopped.`, 'error');
        }
      } catch (e) {
        console.error(`Error stopping conflicting VM ${vmid}: ${e.message}`);
        addLog('pci-resolve', `Failed to stop conflicting VM ${vmid}: ${e.message}`, 'error');
      }
    }
  }
  return stoppedConflictingVMs;
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
  const vmid = parseInt(req.params.vmid);
  // console.log(`[PCI Conflicts] Checking conflicts for VMID: ${vmid}`); // デバッグログ

  try {
    let targetVMInfo;
    try {
      targetVMInfo = await getVMInfo(vmid); // getVMInfo を使ってVMのタイプも取得
      if (!targetVMInfo) {
        console.warn(`[PCI Conflicts] Target VM ${vmid} not found.`);
        return res.json({ conflicts: [] });
      }
    } catch (e) {
      console.error(`[PCI Conflicts] Failed to get info for target VM ${vmid}: ${e.message}`);
      return res.status(500).json({ error: `Failed to get info for target VM ${vmid}: ${e.message}` });
    }

    let targetConfig;
    try {
      // getVMInfo から取得したタイプを使用して設定を取得
      targetConfig = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/${targetVMInfo.type}/${vmid}/config`);
    } catch (e) {
      console.error(`[PCI Conflicts] Failed to get config for target VM ${vmid} (type: ${targetVMInfo.type}): ${e.message}`);
      return res.status(500).json({ error: `Failed to get config for target VM ${vmid}: ${e.message}` });
    }
    
    const targetDevices = extractPCIDevices(targetConfig);
    // console.log(`[PCI Conflicts] Target VM ${vmid} (${targetVMInfo.type}) has ${targetDevices.length} PCI devices:`, targetDevices.map(d => d.address).join(', ')); // デバッグログ

    if (targetDevices.length === 0) {
      console.log(`[PCI Conflicts] No PCI devices found for VM ${vmid}. No conflicts.`);
      return res.json({ conflicts: [] });
    }

    const qemu = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/qemu`);
    const lxc = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/lxc`);
    const runningVMs = [
      ...(qemu || []).filter(v => v.status === 'running').map(v => ({ ...v, type: 'qemu' })),
      ...(lxc || []).filter(v => v.status === 'running').map(v => ({ ...v, type: 'lxc' }))
    ].filter(v => v.vmid !== vmid);
    
    // console.log(`[PCI Conflicts] Found ${runningVMs.length} running VMs (excluding target VM ${vmid}).`); // デバッグログ

    const conflicts = [];
    for (const vm of runningVMs) {
      try {
        // console.log(`[PCI Conflicts] Checking running VM ${vm.vmid} (${vm.type}) for conflicts.`); // デバッグログ
        const config = await proxmoxAPI('GET', `/api2/json/nodes/${nodeName}/${vm.type}/${vm.vmid}/config`);
        const rd = extractPCIDevices(config);
        // console.log(`[PCI Conflicts] Running VM ${vm.vmid} has ${rd.length} PCI devices:`, rd.map(d => d.address).join(', ')); // デバッグログ

        for (const td of targetDevices) {
          for (const r of rd) {
            // ここで競合ロジックを再確認
            // PCIアドレスのデバイス部分 (例: 0000:01:00.0 の 01:00) が一致するか、
            // 完全なアドレスが一致するか
            const tdAddrBase = td.address.split('.')[0]; // 例: 0000:01:00
            const rdAddrBase = r.address.split('.')[0]; // 例: 0000:01:00

            if (tdAddrBase === rdAddrBase || td.address === r.address) {
              // console.warn(`[PCI Conflicts] CONFLICT DETECTED: Target VM ${vmid} device ${td.address} conflicts with running VM ${vm.vmid} device ${r.address}`); // デバッグログ
              conflicts.push({ 
                device: td.address, 
                runningVM: vm.vmid, 
                runningVMName: vm.name || `VM ${vm.vmid}`, 
                runningVMType: vm.type 
              });
            }
          }
        }
      } catch (innerError) {
        // VMの設定取得でエラーが発生した場合、これをログに出力する
        console.error(`[PCI Conflicts] Error checking config for running VM ${vm.vmid} (${vm.type}): ${innerError.message}`);
        // ただし、このエラーが他のVMのチェックを妨げないように処理は続行
      }
    }
    // console.log(`[PCI Conflicts] Final conflicts detected: ${conflicts.length}`); // デバッグログ
    res.json({ conflicts });
  } catch (e) { 
    // console.error(`[PCI Conflicts] Outer API handler error for VM ${vmid}: ${e.message}`); // デバッグログ
    res.status(500).json({ error: e.message }); 
  }
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

// ===== NEW API ROUTES =====

// /api/vm/:vmid/force-start-pci-aware に対応
app.post('/api/vm/:vmid/force-start-pci-aware', async (req, res) => {
  const { vmid } = req.params;
  const { type } = req.body; // type もクライアントから受け取る

  let vmName = `VM ${vmid}`;
  try {
    const vmInfo = await getVMInfo(parseInt(vmid));
    if (!vmInfo) {
      throw new Error(`VM ${vmid} not found.`);
    }
    vmName = vmInfo.name;

    addLog('force-start-pci-aware', `Starting process for VM ${vmName} (${vmid})`);

    // 1. アクティブなタスクを強制終了
    await killVMTasks(parseInt(vmid));

    // 2. PCI競合を解決し、競合するVMを停止
    const stoppedConflictingVMs = await resolvePCIConflictsAndStopVMs(parseInt(vmid), type);
    if (stoppedConflictingVMs.length > 0) {
      addLog('force-start-pci-aware', `VM ${vmid}: Stopped conflicting VMs: ${stoppedConflictingVMs.map(v => `${v.name} (${v.vmid})`).join(', ')}`);
    }

    // 3. 対象VMを起動
    await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${type}/${vmid}/status/start`);
    addLog('start', `VM ${vmName} (${vmid}) started successfully.`);
    res.json({ ok: true, message: `VM ${vmName} started` });

  } catch (e) {
    const errorMessage = `Failed to force start VM ${vmName} (${vmid}): ${e.message}`;
    console.error(errorMessage);
    addLog('force-start-pci-aware', errorMessage, 'error');
    res.status(500).json({ error: errorMessage });
  }
});

// /api/switch-pci-aware に対応
app.post('/api/switch-pci-aware', async (req, res) => {
  const { switchIndex, direction } = req.body;
  const settings = getSettings();
  const sw = settings.switches[switchIndex];

  if (!sw) {
    const errorMessage = 'Invalid switch index.';
    addLog('switch-pci-aware', errorMessage, 'error');
    return res.status(400).json({ error: errorMessage });
  }

  const shutdownVmid = direction === 'vm1_to_vm2' ? sw.vm1 : sw.vm2;
  const startVmid = direction === 'vm1_to_vm2' ? sw.vm2 : sw.vm1;

  let shutdownInfo, startInfo;
  try {
    // VM情報を取得 (name, type, statusを含む)
    // getVMInfo はVMIDが見つからない場合にnullを返す可能性があります
    const [info1, info2] = await Promise.all([
      getVMInfo(shutdownVmid),
      getVMInfo(startVmid)
    ]);

    if (!info1) {
      throw new Error(`Shutdown VM ${shutdownVmid} not found in Proxmox.`);
    }
    if (!info2) {
      throw new Error(`Start VM ${startVmid} not found in Proxmox.`);
    }
    shutdownInfo = info1;
    startInfo = info2;

  } catch (e) {
    const errorMessage = `Failed to get VM info for switch (${shutdownVmid}, ${startVmid}): ${e.message}`;
    console.error(errorMessage);
    addLog('switch-pci-aware', errorMessage, 'error');
    return res.status(400).json({ error: errorMessage });
  }

  addLog('switch-pci-aware', `Attempting to switch: ${shutdownInfo.name} (${shutdownVmid}) -> ${startInfo.name} (${startVmid})`);

  try {
    // シャットダウンVMの処理
    if (shutdownInfo.status === 'running') {
      addLog('switch-pci-aware', `Shutting down ${shutdownInfo.name} (${shutdownVmid})`);
      await killVMTasks(shutdownVmid); // タスク強制終了
      await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${shutdownInfo.type}/${shutdownVmid}/status/shutdown`);
      const stopped = await waitForVMToStop(shutdownVmid, shutdownInfo.type, 30000); // 30秒待機
      if (!stopped) {
        addLog('switch-pci-aware', `VM ${shutdownInfo.name} (${shutdownVmid}) failed to stop gracefully, continuing with force stop attempt if necessary.`, 'warning');
      }
    } else {
      addLog('switch-pci-aware', `Shutdown VM ${shutdownInfo.name} (${shutdownVmid}) is already stopped.`);
    }

    // 起動VMの処理 - PCI競合解決と起動
    // まず、起動しようとしているVMの既存タスクを強制終了
    await killVMTasks(startVmid);

    // PCI競合を解決し、競合するVMを停止
    // ただし、既にシャットダウンしようとしているVMは除外してチェックする
    const stoppedConflictingVMs = await resolvePCIConflictsAndStopVMs(startVmid, startInfo.type);

    // もし shutdownVmid が stoppedConflictingVMs に含まれていたら除外 (重複ログを避けるため)
    const finalStoppedConflictingVMs = stoppedConflictingVMs.filter(v => v.vmid !== shutdownVmid);

    if (finalStoppedConflictingVMs.length > 0) {
      addLog('switch-pci-aware', `For VM ${startVmid}, also stopped conflicting VMs: ${finalStoppedConflictingVMs.map(v => `${v.name} (${v.vmid})`).join(', ')}`);
    }

    // 対象VMを起動
    await proxmoxAPI('POST', `/api2/json/nodes/${nodeName}/${startInfo.type}/${startVmid}/status/start`);
    addLog('start', `VM ${startInfo.name} (${startVmid}) started`);

    res.json({ ok: true, message: `Switch from ${shutdownInfo.name} to ${startInfo.name} completed.` });

  } catch (e) {
    const errorMessage = `Switch operation failed for (${shutdownVmid} -> ${startVmid}): ${e.message}`;
    console.error(errorMessage);
    addLog('switch-pci-aware', errorMessage, 'error');
    res.status(500).json({ error: errorMessage });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Proxmox Kontrol Panel: http://localhost:${PORT}`);
  addLog('server', 'Server started');
  await detectNode();
});
