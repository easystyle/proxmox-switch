const API = '';

// ===== i18n =====
const i18n = {
  tr: {
    title: 'Proxmox Kontrol',
    menu_shutdown_all: 'Tum VM\'leri Kapat', menu_force_stop_all: 'Tum VM\'leri Zorla Durdur',
    menu_logs: 'Loglar', menu_settings: 'Ayarlar', menu_logout: 'Cikis Yap',
    checking_status: 'Durum kontrol ediliyor...', power_off_title: 'SISTEM KAPAT',
    power_off_desc: 'Tum VM\'leri durdurur ve Proxmox sunucusunu kapatir.',
    vm_control: 'VM KONTROL', loading_vms: 'VM\'ler yukleniyor...',
    save: 'Kaydet', logs_title: 'Islem Loglari', loading_logs: 'Loglar yukleniyor...',
    cancel: 'Iptal', confirm: 'Onayla', pci_conflict_title: 'PCI Cakismasi',
    shutdown_and_start: 'Kapat & Baslat', no_vms: 'VM bulunamadi', no_logs: 'Henuz log yok',
    error: 'Hata', api_error: 'API hatasi', settings_saved: 'Ayarlar kaydedildi',
    invalid_vm_id: 'Gecerli VM ID girin',
    vm_running: '{name} calisiyor', both_off: 'Her iki VM de kapali', all_off: 'Tum VM\'ler kapali',
    switch_confirm_title: 'VM Switch',
    switch_confirm_msg: '{shutdown} kapatilip {start} baslatilacak. 30 saniye icinde kapanmazsa force stop uygulanacak. Devam edilsin mi?',
    switching_off: '{name} kapatiliyor...', switch_done: '{shutdown} kapatildi, {start} baslatildi', switch_error: 'Switch hatasi',
    poweroff_confirm1: 'DIKKAT: Tum VM\'ler durdurulacak ve Proxmox sunucusu tamamen kapatilacak. Bu islemi geri alamazsiniz!',
    poweroff_confirm2: 'Proxmox sunucusu fiziksel olarak kapatilacak. Tekrar acmak icin fiziksel erisim gerekebilir.',
    poweroff_confirm2_title: 'EMIN MISINIZ?', shutting_down: 'Kapatiliyor...',
    proxmox_shutting_down: 'Proxmox kapatiliyor...', poweroff_error: 'Kapatma hatasi',
    force_stop_confirm: '{name} ({vmid}) zorla durdurulacak. Devam edilsin mi?',
    stopping: '{name} durduruluyor...', stopped: '{name} durduruldu',
    starting: '{name} baslatiliyor...', started: '{name} baslatildi',
    restart_confirm: '{name} ({vmid}) zorla yeniden baslatilacak. Devam edilsin mi?',
    restarting: '{name} yeniden baslatiliyor...', restarted: '{name} yeniden baslatildi',
    shutdown_all_confirm: 'Tum calisan VM\'ler graceful olarak kapatilacak. Devam edilsin mi?',
    shutting_down_all: 'Tum VM\'ler kapatiliyor...', vms_shutting_down: '{count} VM kapatiliyor',
    force_stop_all_confirm: 'DIKKAT: Tum calisan VM\'ler zorla durdurulacak! Veri kaybina neden olabilir.',
    stopping_all: 'Tum VM\'ler durduruluyor...', vms_stopped: '{count} VM durduruldu',
    pci_conflict_msg: '<strong>{name}</strong> baslatmak istiyorsunuz ancak PCI cihaz cakismasi var:<br><br>',
    pci_uses_devices: '<strong>{name} ({vmid})</strong> su cihazlari kullaniyor:<br>',
    pci_shutdown_question: 'Cakisan VM\'leri kapatmak istiyor musunuz?',
    pci_shutting_down: '{name} kapatiliyor...', pci_waiting: 'VM\'ler kapaniyor, bekleniyor...',
    // Settings
    settings_switches: 'VM Switch\'ler', settings_add_switch: 'Switch Ekle', settings_remove: 'Kaldir',
    settings_vm1: 'VM 1', settings_vm2: 'VM 2', settings_visible: 'Gorunur',
    settings_show_poweroff: 'Power Off butonunu goster', settings_dashboard: 'Dashboard',
    // VM Edit
    vm_edit_title: '{name} - Ayarlar', onboot: 'Start on Boot', onboot_enabled: 'Acilista Baslar',
    onboot_updated: 'Start on boot guncellendi',
    start_canceled_by_user: 'Kullanici tarafindan baslatma iptal edildi.',
  },
  en: {
    title: 'Proxmox Control',
    menu_shutdown_all: 'Shutdown All VMs', menu_force_stop_all: 'Force Stop All VMs',
    menu_logs: 'Logs', menu_settings: 'Settings', menu_logout: 'Logout',
    checking_status: 'Checking status...', power_off_title: 'POWER OFF',
    power_off_desc: 'Stops all VMs and shuts down the Proxmox host.',
    vm_control: 'VM CONTROL', loading_vms: 'Loading VMs...',
    save: 'Save', logs_title: 'Operation Logs', loading_logs: 'Loading logs...',
    cancel: 'Cancel', confirm: 'Confirm', pci_conflict_title: 'PCI Conflict',
    shutdown_and_start: 'Shutdown & Start', no_vms: 'No VMs found', no_logs: 'No logs yet',
    error: 'Error', api_error: 'API error', settings_saved: 'Settings saved',
    invalid_vm_id: 'Enter valid VM IDs',
    vm_running: '{name} is running', both_off: 'Both VMs are off', all_off: 'All VMs are off',
    switch_confirm_title: 'VM Switch',
    switch_confirm_msg: '{shutdown} will be shut down and {start} will be started. Force stop after 30s. Continue?',
    switching_off: 'Shutting down {name}...', switch_done: '{shutdown} stopped, {start} started', switch_error: 'Switch error',
    poweroff_confirm1: 'WARNING: All VMs will be stopped and the Proxmox host will shut down. This cannot be undone!',
    poweroff_confirm2: 'The host will be physically powered off. Physical access may be required to turn it back on.',
    poweroff_confirm2_title: 'ARE YOU SURE?', shutting_down: 'Shutting down...',
    proxmox_shutting_down: 'Proxmox is shutting down...', poweroff_error: 'Power off error',
    force_stop_confirm: '{name} ({vmid}) will be force stopped. Continue?',
    stopping: 'Stopping {name}...', stopped: '{name} stopped',
    starting: 'Starting {name}...', started: '{name} started',
    restart_confirm: '{name} ({vmid}) will be force restarted. Continue?',
    restarting: 'Restarting {name}...', restarted: '{name} restarted',
    shutdown_all_confirm: 'All running VMs will be gracefully shut down. Continue?',
    shutting_down_all: 'Shutting down all VMs...', vms_shutting_down: '{count} VMs shutting down',
    force_stop_all_confirm: 'WARNING: All running VMs will be force stopped! May cause data loss.',
    stopping_all: 'Stopping all VMs...', vms_stopped: '{count} VMs stopped',
    pci_conflict_msg: 'You want to start <strong>{name}</strong> but there is a PCI device conflict:<br><br>',
    pci_uses_devices: '<strong>{name} ({vmid})</strong> is using these devices:<br>',
    pci_shutdown_question: 'Do you want to shut down the conflicting VMs?',
    pci_shutting_down: 'Shutting down {name}...', pci_waiting: 'Waiting for VMs to stop...',
    settings_switches: 'VM Switches', settings_add_switch: 'Add Switch', settings_remove: 'Remove',
    settings_vm1: 'VM 1', settings_vm2: 'VM 2', settings_visible: 'Visible',
    settings_show_poweroff: 'Show Power Off button', settings_dashboard: 'Dashboard',
    vm_edit_title: '{name} - Settings', onboot: 'Start on Boot', onboot_enabled: 'Start on Boot',
    onboot_updated: 'Start on boot updated',
    start_canceled_by_user: 'Start canceled by user.',
  }
};

let lang = 'en', t = i18n.en;
function T(key, p = {}) { let s = t[key] || i18n.en[key] || key; for (const [k, v] of Object.entries(p)) s = s.replaceAll(`{${k}}`, v); return s; }
function applyI18n() { document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if (t[k]) el.textContent = t[k]; }); document.title = T('title'); document.documentElement.lang = lang; }

// State
let settings = { switches: [], showPowerOff: true };
let vms = [];
let switchingStates = {}; // index -> boolean

const $ = id => document.getElementById(id);

function toast(msg, type = 'info') { const el = $('toast'); el.textContent = msg; el.className = 'toast show ' + type; clearTimeout(el._timer); el._timer = setTimeout(() => el.className = 'toast', 3000); }

function confirm(title, message) {
  return new Promise(resolve => {
    $('confirmTitle').textContent = title; $('confirmMessage').textContent = message; $('confirmModal').classList.add('active');
    const cleanup = v => { $('confirmModal').classList.remove('active'); $('confirmOk').onclick = null; $('confirmCancel').onclick = null; resolve(v); };
    $('confirmOk').onclick = () => cleanup(true); $('confirmCancel').onclick = () => cleanup(false);
  });
}

function showPCIConflict(message) {
  return new Promise(resolve => {
    $('pciConflictMessage').innerHTML = message; $('pciConflictModal').classList.add('active');
    const cleanup = v => { $('pciConflictModal').classList.remove('active'); $('pciConflictShutdown').onclick = null; $('pciConflictCancel').onclick = null; resolve(v); };
    $('pciConflictShutdown').onclick = () => cleanup('shutdown'); $('pciConflictCancel').onclick = () => cleanup('cancel');
  });
}

async function api(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (res.status === 401) { window.location.href = '/login'; return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || T('api_error'));
  return data;
}

// ===== Settings =====
async function loadSettings() {
  try { settings = await api('GET', '/api/settings'); } catch (e) { toast(T('error') + ': ' + e.message, 'error'); }
}

// ===== VMs =====
async function loadVMs() {
  try { vms = await api('GET', '/api/vms'); renderVMs(); renderSwitches(); renderPowerOff(); } catch (e) { $('vmList').innerHTML = `<p class="loading">${T('error')}: ${e.message}</p>`; }
}

function renderPowerOff() {
  $('powerCard').style.display = settings.showPowerOff ? '' : 'none';
}

// ===== Switches =====
function renderSwitches() {
  const container = $('switchContainer');
  const visibleSwitches = settings.switches.filter(s => s.visible !== false);
  if (visibleSwitches.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = visibleSwitches.map((sw, vi) => {
    const realIndex = settings.switches.indexOf(sw);
    const vm1 = vms.find(v => v.vmid === sw.vm1);
    const vm2 = vms.find(v => v.vmid === sw.vm2);
    const vm1Name = vm1 ? (vm1.name || `VM ${vm1.vmid}`) : `VM ${sw.vm1}`;
    const vm2Name = vm2 ? (vm2.name || `VM ${vm2.vmid}`) : `VM ${sw.vm2}`;

    let statusText = T('both_off'), statusColor = '#8b8d97', checked = false;
    const isSwitching = switchingStates[realIndex];
    if (vm1 && vm1.status === 'running') { statusText = T('vm_running', { name: vm1Name }); statusColor = '#3b82f6'; checked = false; }
    else if (vm2 && vm2.status === 'running') { statusText = T('vm_running', { name: vm2Name }); statusColor = '#f97316'; checked = true; }

    return `<section class="card switch-card">
      <h2>VM SWITCH</h2>
      <div class="switch-info">
        <span>${vm1Name}</span>
        <div class="switch-container">
          <input type="checkbox" id="vmSwitch${realIndex}" class="switch-input" ${checked ? 'checked' : ''} ${isSwitching ? 'disabled' : ''} onchange="handleSwitch(${realIndex}, this)">
          <label for="vmSwitch${realIndex}" class="switch-label ${isSwitching ? 'disabled' : ''}"><span class="switch-slider"></span></label>
        </div>
        <span>${vm2Name}</span>
      </div>
      <p class="switch-status" style="color:${statusColor}">${isSwitching ? T('switching_off', { name: '...' }) : statusText}</p>
    </section>`;
  }).join('');
}

// この関数はオプションから1対1のVM切り替えスイッチを定義してそれを使用したときに呼ばれる。ケバブメニューのstartから呼ばれるのはforceStart()なので注意。
async function handleSwitch(index, el) {
  if (switchingStates[index]) { el.checked = !el.checked; return; }
  const sw = settings.switches[index];
  const vm1 = vms.find(v => v.vmid === sw.vm1);
  const vm2 = vms.find(v => v.vmid === sw.vm2);
  const direction = el.checked ? 'vm1_to_vm2' : 'vm2_to_vm1';
  const shutdownName = el.checked ? (vm1?.name || `VM ${sw.vm1}`) : (vm2?.name || `VM ${sw.vm2}`);
  const startName = el.checked ? (vm2?.name || `VM ${sw.vm2}`) : (vm1?.name || `VM ${sw.vm1}`);
  // startVmid はサーバー側で計算されるため、クライアント側では直接使用しませんが、
  // 確認メッセージのために保持しておきます。
  // const startVmid = el.checked ? sw.vm2 : sw.vm1; // サーバー側のAPIに渡す必要がないため削除

  // VMスイッチの確認ダイアログは維持します。
  // PCI競合の警告はサーバー側で処理されるため、クライアント側からは削除します。
  const ok = await confirm(T('switch_confirm_title'), T('switch_confirm_msg', { shutdown: shutdownName, start: startName }));
  if (!ok) { el.checked = !el.checked; return; }

  switchingStates[index] = true;
  renderSwitches(); // スイッチの表示を更新し、無効にする

  // サーバー側の新しいAPIを呼び出す
  // このAPIがシャットダウンVMの処理、起動VMのタスク強制終了、PCI競合解決、VM起動をすべてサーバー側で実行します。
  toast(T('switching_off', { name: shutdownName }) + ' (server-side processing PCI conflicts and tasks)...', 'info');
  try {
    await api('POST', '/api/switch-pci-aware', { switchIndex: index, direction });
    toast(T('switch_done', { shutdown: shutdownName, start: startName }), 'success');
  } catch (e) {
    toast(T('switch_error') + ': ' + e.message, 'error');
  } finally {
    switchingStates[index] = false;
    await loadVMs(); // VMの状態をリフレッシュ
  }
}

// ===== VM List =====
function renderVMs() {
  const container = $('vmList');
  if (vms.length === 0) { container.innerHTML = `<p class="loading">${T('no_vms')}</p>`; return; }

  container.innerHTML = vms.map(vm => {
    const name = vm.name || `VM ${vm.vmid}`;
    const statusClass = vm.status === 'running' ? 'running' : vm.status === 'paused' ? 'paused' : 'stopped';
    const isRunning = vm.status === 'running';
    const onbootBadge = vm.onboot ? `<span class="vm-badge onboot">${T('onboot_enabled')}</span>` : '';
    const statusDot = `<span class="status-dot ${statusClass}"></span>`;

    const actions = isRunning
      ? `<button class="vm-dd-item" onclick="forceStop(${vm.vmid}, '${vm.type}')"><span class="vm-dd-icon stop-icon"></span>Stop</button>
         <button class="vm-dd-item" onclick="forceRestart(${vm.vmid}, '${vm.type}')"><span class="vm-dd-icon restart-icon"></span>Restart</button>`
      : `<button class="vm-dd-item" onclick="forceStart(${vm.vmid}, '${vm.type}')"><span class="vm-dd-icon start-icon"></span>Start</button>`;

    return `<div class="vm-item">
        <div class="vm-left">
          ${statusDot}
          <div class="vm-info">
            <span class="vm-name">${name}</span>
            <span class="vm-meta">${vm.type.toUpperCase()} ${vm.vmid} ${onbootBadge}</span>
          </div>
        </div>
        <div class="vm-right">
          <div class="vm-action-wrap">
            <button class="icon-btn icon-btn-sm vm-action-btn" onclick="toggleVmDropdown(event, ${vm.vmid})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
            <div class="vm-dropdown" id="vmDd${vm.vmid}">
              ${actions}
              <div class="dropdown-divider"></div>
              <button class="vm-dd-item" onclick="openVmEdit(${vm.vmid}, '${vm.type}')"><span class="vm-dd-icon edit-icon"></span>${T('menu_settings')}</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function toggleVmDropdown(e, vmid) {
  e.stopPropagation();
  // Close all other dropdowns
  document.querySelectorAll('.vm-dropdown.active').forEach(el => {
    if (el.id !== `vmDd${vmid}`) el.classList.remove('active');
  });
  const dd = $(`vmDd${vmid}`);
  dd.classList.toggle('active');
}

// Close VM dropdowns on outside click
document.addEventListener('click', () => {
  document.querySelectorAll('.vm-dropdown.active').forEach(el => el.classList.remove('active'));
});

// ===== VM Edit Modal =====
async function openVmEdit(vmid, type) {
  const vm = vms.find(v => v.vmid === vmid);
  const name = vm ? vm.name : `VM ${vmid}`;
  $('vmEditTitle').textContent = T('vm_edit_title', { name });
  const onboot = vm ? vm.onboot : 0;

  $('vmEditBody').innerHTML = `
    <div class="toggle-row">
      <span class="toggle-label">${T('onboot')}</span>
      <label class="toggle">
        <input type="checkbox" id="editOnboot" ${onboot ? 'checked' : ''}>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
    </div>
    <button class="btn btn-primary" id="saveVmEdit" style="margin-top:20px">${T('save')}</button>`;

  $('vmEditModal').classList.add('active');

  $('saveVmEdit').onclick = async () => {
    const newOnboot = $('editOnboot').checked;
    try {
      await api('POST', `/api/vm/${vmid}/onboot`, { type, onboot: newOnboot });
      toast(T('onboot_updated'), 'success');
      $('vmEditModal').classList.remove('active');
      await loadVMs();
    } catch (e) { toast(T('error') + ': ' + e.message, 'error'); }
  };
}

$('closeVmEdit').addEventListener('click', () => { $('vmEditModal').classList.remove('active'); });
$('vmEditModal').addEventListener('click', (e) => { if (e.target === $('vmEditModal')) $('vmEditModal').classList.remove('active'); });

// ===== Power off =====
$('powerOffBtn').addEventListener('click', async () => {
  if (!await confirm('POWER OFF', T('poweroff_confirm1'))) return;
  if (!await confirm(T('poweroff_confirm2_title'), T('poweroff_confirm2'))) return;
  $('powerOffBtn').disabled = true;
  $('powerOffBtn').innerHTML = `<span class="spinner"></span> ${T('shutting_down')}`;
  try { await api('POST', '/api/poweroff'); toast(T('proxmox_shutting_down'), 'success'); }
  catch (e) { toast(T('poweroff_error') + ': ' + e.message, 'error'); }
  finally {
    $('powerOffBtn').disabled = false;
    $('powerOffBtn').innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg> POWER OFF`;
  }
});

// ===== VM Operations =====
async function killTasksAndWait(vmid) { try { await api('POST', `/api/vm/${vmid}/kill-tasks`); await new Promise(r => setTimeout(r, 1000)); } catch {} }
async function checkPCIConflicts(vmid) { try { return (await api('GET', `/api/vm/${vmid}/pci-conflicts`)).conflicts || []; } catch { return []; } }

async function waitForVMsStop(vmids) {
  toast(T('pci_waiting'), 'info');
  let waited = 0;
  while (waited < 30000) {
    await new Promise(r => setTimeout(r, 2000)); waited += 2000;
    try {
      const cur = await api('GET', '/api/vms');
      if (vmids.every(id => { const v = cur.find(x => x.vmid === id); return !v || v.status !== 'running'; })) return;
    } catch { return; }
  }
  // Force stop remaining
  for (const id of vmids) {
    try {
      const cur = await api('GET', '/api/vms');
      const v = cur.find(x => x.vmid === id);
      if (v && v.status === 'running') { await api('POST', `/api/vm/${id}/stop`, { type: v.type }); await new Promise(r => setTimeout(r, 2000)); }
    } catch {}
  }
}

async function handlePCIConflicts(vmid, name) {
  const conflicts = await checkPCIConflicts(vmid);
  if (conflicts.length === 0) return true;
  const conflictMap = {};
  for (const c of conflicts) {
    if (!conflictMap[c.runningVM]) conflictMap[c.runningVM] = { name: c.runningVMName, type: c.runningVMType, devices: [] };
    conflictMap[c.runningVM].devices.push(c.device);
  }
  let msg = T('pci_conflict_msg', { name });
  for (const [vid, info] of Object.entries(conflictMap)) {
    msg += T('pci_uses_devices', { name: info.name, vmid: vid });
    msg += info.devices.map(d => `&nbsp;&nbsp;- ${d}`).join('<br>') + '<br><br>';
  }
  msg += T('pci_shutdown_question');
  if (await showPCIConflict(msg) === 'cancel') return false;
  for (const [cVmid, info] of Object.entries(conflictMap)) {
    toast(T('pci_shutting_down', { name: info.name }), 'info');
    try { await api('POST', `/api/vm/${cVmid}/shutdown`, { type: info.type }); } catch {}
  }
  await waitForVMsStop(Object.keys(conflictMap).map(Number));
  return true;
}

async function forceStop(vmid, type) {
  const vm = vms.find(v => v.vmid === vmid); const name = vm ? vm.name : `VM ${vmid}`;
  if (!await confirm('Force Stop', T('force_stop_confirm', { name, vmid }))) return;
  toast(T('stopping', { name }), 'info');
  try { await killTasksAndWait(vmid); await api('POST', `/api/vm/${vmid}/stop`, { type }); toast(T('stopped', { name }), 'success'); }
  catch (e) { toast(T('error') + ': ' + e.message, 'error'); }
  setTimeout(loadVMs, 2000);
}

// ケバブメニューからのStartはこっちの処理
async function forceStart(vmid, type) {
  const vm = vms.find(v => v.vmid === vmid);
  const name = vm ? vm.name : `VM ${vmid}`;

  // 1. クライアント側でPCI競合をチェック
  const conflicts = await checkPCIConflicts(vmid);
  if (conflicts.length > 0) {
    // 競合がある場合、確認ポップアップを表示
    const conflictMap = {};
    for (const c of conflicts) {
      if (!conflictMap[c.runningVM]) conflictMap[c.runningVM] = { name: c.runningVMName, type: c.runningVMType, devices: [] };
      conflictMap[c.runningVM].devices.push(c.device);
    }

    let msg = T('pci_conflict_msg', { name });
    for (const [vid, info] of Object.entries(conflictMap)) {
      msg += T('pci_uses_devices', { name: info.name, vmid: vid });
      msg += info.devices.map(d => `&nbsp;&nbsp;- ${d}`).join('<br>') + '<br><br>';
    }
    msg += T('pci_shutdown_question');

    const userAction = await showPCIConflict(msg); // 'shutdown' または 'cancel' が返る

    if (userAction === 'cancel') {
      toast(T('start_canceled_by_user'), 'info');
      setTimeout(loadVMs, 2000); // 状態を更新しておく
      return; // ユーザーがキャンセルしたら処理を中断
    }
    // userAction が 'shutdown' の場合、そのまま処理を続行し、
    // サーバーが競合するVMをシャットダウンすることを期待します。
  }

  // 2. 競合がない、またはユーザーが続行を決定した場合、サーバー側の新しいAPIを呼び出す
  // このAPIがPCI競合解決（確認後）、タスク強制終了、VM起動をすべてサーバー側で実行する
  toast(T('starting', { name }) + ' (server-side processing PCI conflicts and tasks)...', 'info');
  try {
    // サーバーAPIには、クライアント側での確認の結果を渡す必要はありません。
    // サーバーAPIは「force-start-pci-aware」なので、必要に応じて自身で競合VMを停止します。
    // クライアント側の確認は、あくまでユーザーへの情報提供と意思確認のためです。
    await api('POST', `/api/vm/${vmid}/force-start-pci-aware`, { type });
    toast(T('started', { name }), 'success');
  } catch (e) {
    toast(T('error') + ': ' + e.message, 'error');
  }
  setTimeout(loadVMs, 2000); // VMの状態をリフレッシュ
}

async function forceRestart(vmid, type) {
  const vm = vms.find(v => v.vmid === vmid); const name = vm ? vm.name : `VM ${vmid}`;
  if (!await confirm('Force Restart', T('restart_confirm', { name, vmid }))) return;
  toast(T('restarting', { name }), 'info');
  try { await killTasksAndWait(vmid); await api('POST', `/api/vm/${vmid}/stop`, { type }); await new Promise(r => setTimeout(r, 3000)); await api('POST', `/api/vm/${vmid}/start`, { type }); toast(T('restarted', { name }), 'success'); }
  catch (e) { toast(T('error') + ': ' + e.message, 'error'); }
  setTimeout(loadVMs, 2000);
}

// ===== Dropdown Menu =====
$('menuBtn').addEventListener('click', (e) => { e.stopPropagation(); $('dropdownMenu').classList.toggle('active'); });
document.addEventListener('click', () => { $('dropdownMenu').classList.remove('active'); });

$('menuShutdownAll').addEventListener('click', async () => {
  $('dropdownMenu').classList.remove('active');
  if (!await confirm(T('menu_shutdown_all'), T('shutdown_all_confirm'))) return;
  toast(T('shutting_down_all'), 'info');
  try { const r = await api('POST', '/api/shutdown-all'); toast(T('vms_shutting_down', { count: r.count }), 'success'); }
  catch (e) { toast(T('error') + ': ' + e.message, 'error'); }
  setTimeout(loadVMs, 3000);
});

$('menuForceStopAll').addEventListener('click', async () => {
  $('dropdownMenu').classList.remove('active');
  if (!await confirm(T('menu_force_stop_all'), T('force_stop_all_confirm'))) return;
  toast(T('stopping_all'), 'info');
  try { const r = await api('POST', '/api/force-stop-all'); toast(T('vms_stopped', { count: r.count }), 'success'); }
  catch (e) { toast(T('error') + ': ' + e.message, 'error'); }
  setTimeout(loadVMs, 2000);
});

// ===== Logs =====
$('menuLogs').addEventListener('click', async () => { $('dropdownMenu').classList.remove('active'); $('logsModal').classList.add('active'); await loadLogs(); });
async function loadLogs() {
  try {
    const logs = await api('GET', '/api/logs');
    const container = $('logsList');
    if (logs.length === 0) { container.innerHTML = `<p class="loading">${T('no_logs')}</p>`; return; }
    const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
    container.innerHTML = logs.map(log => {
      const timeStr = new Date(log.time).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `<div class="log-item ${log.status === 'error' ? 'log-error' : 'log-ok'}">
        <span class="log-time">${timeStr}</span><span class="log-action">${log.action}</span><span class="log-detail">${log.detail}</span></div>`;
    }).join('');
  } catch (e) { $('logsList').innerHTML = `<p class="loading">${T('error')}: ${e.message}</p>`; }
}
$('closeLogs').addEventListener('click', () => { $('logsModal').classList.remove('active'); });
$('logsModal').addEventListener('click', (e) => { if (e.target === $('logsModal')) $('logsModal').classList.remove('active'); });

// ===== Settings Modal =====
$('menuSettings').addEventListener('click', () => { $('dropdownMenu').classList.remove('active'); renderSettingsModal(); $('settingsModal').classList.add('active'); });
$('closeSettings').addEventListener('click', () => { $('settingsModal').classList.remove('active'); });
$('settingsModal').addEventListener('click', (e) => { if (e.target === $('settingsModal')) $('settingsModal').classList.remove('active'); });

function renderSettingsModal() {
  const switches = settings.switches || [];
  let html = `<h3 class="settings-section">${T('settings_dashboard')}</h3>
    <div class="toggle-row">
      <span class="toggle-label">${T('settings_show_poweroff')}</span>
      <label class="toggle"><input type="checkbox" id="settShowPowerOff" ${settings.showPowerOff ? 'checked' : ''}><span class="toggle-track"><span class="toggle-thumb"></span></span></label>
    </div>
    <h3 class="settings-section" style="margin-top:20px">${T('settings_switches')}</h3>
    <div id="switchesList">`;

  switches.forEach((sw, i) => {
    html += `<div class="settings-switch-row" data-index="${i}">
      <div class="settings-switch-inputs">
        <div class="form-group compact"><label>${T('settings_vm1')}</label><input type="number" class="sw-vm1" value="${sw.vm1 || ''}" placeholder="VMID"></div>
        <div class="form-group compact"><label>${T('settings_vm2')}</label><input type="number" class="sw-vm2" value="${sw.vm2 || ''}" placeholder="VMID"></div>
      </div>
      <div class="settings-switch-options">
        <label class="toggle compact-toggle"><input type="checkbox" class="sw-visible" ${sw.visible !== false ? 'checked' : ''}><span class="toggle-track sm"><span class="toggle-thumb sm"></span></span><span class="toggle-text">${T('settings_visible')}</span></label>
        <button class="btn btn-sm btn-danger" onclick="removeSwitch(${i})">${T('settings_remove')}</button>
      </div>
    </div>`;
  });

  html += `</div>
    <button class="btn btn-secondary" id="addSwitchBtn" style="margin-top:10px">${T('settings_add_switch')}</button>
    <button class="btn btn-primary" id="saveSettingsBtn" style="margin-top:16px">${T('save')}</button>`;

  $('settingsBody').innerHTML = html;

  $('addSwitchBtn').addEventListener('click', () => {
    settings.switches.push({ vm1: 0, vm2: 0, visible: true });
    renderSettingsModal();
  });

  $('saveSettingsBtn').addEventListener('click', async () => {
    const rows = document.querySelectorAll('.settings-switch-row');
    const newSwitches = [];
    rows.forEach(row => {
      const vm1 = parseInt(row.querySelector('.sw-vm1').value) || 0;
      const vm2 = parseInt(row.querySelector('.sw-vm2').value) || 0;
      const visible = row.querySelector('.sw-visible').checked;
      if (vm1 && vm2) newSwitches.push({ vm1, vm2, visible });
    });
    const newSettings = { switches: newSwitches, showPowerOff: $('settShowPowerOff').checked };
    try {
      await api('POST', '/api/settings', newSettings);
      settings = newSettings;
      toast(T('settings_saved'), 'success');
      $('settingsModal').classList.remove('active');
      renderSwitches();
      renderPowerOff();
    } catch (e) { toast(T('error') + ': ' + e.message, 'error'); }
  });
}

function removeSwitch(index) {
  settings.switches.splice(index, 1);
  renderSettingsModal();
}

// ===== Init =====
(async () => {
  try { const r = await fetch('/api/lang'); const d = await r.json(); lang = d.lang || 'en'; t = i18n[lang] || i18n.en; } catch {}
  applyI18n();
  await loadSettings();
  await loadVMs();
  setInterval(() => loadVMs(), 5000);
})();
