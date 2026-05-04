// Devices, batches, temperature adaptation plans, IoT integration
// Stage codes: INC (孵化), NUR (小池), JUV (中池), GRO (大池), BRO (親魚)

const STAGES = [
  { id: 'INC', zh: '孵化台',     en: 'Incubation Tray', tempRange: [6, 8],   icon: 'flask' },
  { id: 'NUR', zh: '小魚苗池',   en: 'Nursery Tank',    tempRange: [8, 10],  icon: 'drop' },
  { id: 'JUV', zh: '中型適應池', en: 'Juvenile Tank',   tempRange: [10, 12], icon: 'tank' },
  { id: 'GRO', zh: '大型育成池', en: 'Grow-out Tank',   tempRange: [11, 13], icon: 'tank' },
  { id: 'BRO', zh: '親魚池',     en: 'Broodstock',      tempRange: [9, 11],  icon: 'fish' },
];

// Devices/sensors: assigned to tanks, with connection state
const DEVICES = [
  // A1
  { id: 'IOT-A1-T01', kind: 'temp',  zh: '水溫', en: 'Temp',     tank: 'A1', stage: 'NUR', proto: 'WiFi',     status: 'online',  battery: 88, signal: 92, last: '14:45:02', source: 'iot' },
  { id: 'IOT-A1-D01', kind: 'do',    zh: '溶氧', en: 'DO',       tank: 'A1', stage: 'NUR', proto: 'WiFi',     status: 'online',  battery: 76, signal: 88, last: '14:45:00', source: 'iot' },
  { id: 'IOT-A1-P01', kind: 'ph',    zh: 'pH',   en: 'pH',       tank: 'A1', stage: 'NUR', proto: 'BLE-GW',   status: 'online',  battery: 64, signal: 71, last: '14:44:55', source: 'iot' },
  { id: 'IOT-A1-N01', kind: 'nh3',   zh: '氨氮', en: 'NH₃',      tank: 'A1', stage: 'NUR', proto: 'Manual',   status: 'manual',  battery: null, signal: null, last: '08:30:00', source: 'manual' },
  // A2
  { id: 'IOT-A2-T01', kind: 'temp',  zh: '水溫', en: 'Temp',     tank: 'A2', stage: 'NUR', proto: 'WiFi',     status: 'online',  battery: 91, signal: 95, last: '14:45:01', source: 'iot' },
  { id: 'IOT-A2-D01', kind: 'do',    zh: '溶氧', en: 'DO',       tank: 'A2', stage: 'NUR', proto: 'WiFi',     status: 'online',  battery: 80, signal: 86, last: '14:44:59', source: 'iot' },
  // A3 — sensor abnormal
  { id: 'IOT-A3-T01', kind: 'temp',  zh: '水溫', en: 'Temp',     tank: 'A3', stage: 'NUR', proto: 'WiFi',     status: 'abnormal',battery: 22, signal: 41, last: '14:44:50', source: 'iot' },
  { id: 'IOT-A3-D01', kind: 'do',    zh: '溶氧', en: 'DO',       tank: 'A3', stage: 'NUR', proto: 'WiFi',     status: 'online',  battery: 70, signal: 82, last: '14:45:00', source: 'iot' },
  { id: 'IOT-A3-F01', kind: 'flow',  zh: '水流', en: 'Flow',     tank: 'A3', stage: 'NUR', proto: 'MQTT',     status: 'online',  battery: null, signal: 90, last: '14:44:58', source: 'iot' },
  // B1
  { id: 'IOT-B1-T01', kind: 'temp',  zh: '水溫', en: 'Temp',     tank: 'B1', stage: 'GRO', proto: 'WiFi',     status: 'online',  battery: 84, signal: 90, last: '14:45:02', source: 'iot' },
  { id: 'IOT-B1-D01', kind: 'do',    zh: '溶氧', en: 'DO',       tank: 'B1', stage: 'GRO', proto: 'WiFi',     status: 'online',  battery: 78, signal: 88, last: '14:44:58', source: 'iot' },
  { id: 'IOT-B1-O01', kind: 'no2',   zh: '亞硝酸',en: 'NO₂',     tank: 'B1', stage: 'GRO', proto: 'Manual',   status: 'manual',  battery: null, signal: null, last: '09:00:00', source: 'manual' },
  // B2 — critical, one device offline
  { id: 'IOT-B2-T01', kind: 'temp',  zh: '水溫', en: 'Temp',     tank: 'B2', stage: 'GRO', proto: 'WiFi',     status: 'online',  battery: 71, signal: 84, last: '14:45:00', source: 'iot' },
  { id: 'IOT-B2-D01', kind: 'do',    zh: '溶氧', en: 'DO',       tank: 'B2', stage: 'GRO', proto: 'WiFi',     status: 'online',  battery: 12, signal: 60, last: '14:44:55', source: 'iot' },
  { id: 'IOT-B2-P01', kind: 'ph',    zh: 'pH',   en: 'pH',       tank: 'B2', stage: 'GRO', proto: 'BLE-GW',   status: 'offline', battery: 8,  signal: 0,  last: '12:18:42', source: 'iot' },
  { id: 'IOT-B2-F01', kind: 'flow',  zh: '水流', en: 'Flow',     tank: 'B2', stage: 'GRO', proto: 'MQTT',     status: 'online',  battery: null, signal: 78, last: '14:44:50', source: 'iot' },
  // B3, B4
  { id: 'IOT-B3-T01', kind: 'temp',  zh: '水溫', en: 'Temp',     tank: 'B3', stage: 'GRO', proto: 'WiFi',     status: 'online',  battery: 82, signal: 90, last: '14:45:01', source: 'iot' },
  { id: 'IOT-B3-D01', kind: 'do',    zh: '溶氧', en: 'DO',       tank: 'B3', stage: 'GRO', proto: 'WiFi',     status: 'online',  battery: 79, signal: 85, last: '14:44:58', source: 'iot' },
  { id: 'IOT-B4-T01', kind: 'temp',  zh: '水溫', en: 'Temp',     tank: 'B4', stage: 'GRO', proto: 'WiFi',     status: 'online',  battery: 60, signal: 75, last: '14:45:00', source: 'iot' },
  { id: 'IOT-B4-P01', kind: 'ph',    zh: 'pH',   en: 'pH',       tank: 'B4', stage: 'GRO', proto: 'BLE-GW',   status: 'online',  battery: 55, signal: 68, last: '14:44:30', source: 'iot' },
  // C broodstock
  { id: 'IOT-J1-T01', kind: 'temp',  zh: '水溫', en: 'Temp',     tank: 'J1', stage: 'JUV', proto: 'WiFi',     status: 'online',  battery: 90, signal: 94, last: '14:45:02', source: 'iot' },
  { id: 'IOT-J1-D01', kind: 'do',    zh: '溶氧', en: 'DO',       tank: 'J1', stage: 'JUV', proto: 'WiFi',     status: 'online',  battery: 87, signal: 91, last: '14:45:00', source: 'iot' },
  { id: 'IOT-J2-T01', kind: 'temp',  zh: '水溫', en: 'Temp',     tank: 'J2', stage: 'JUV', proto: 'WiFi',     status: 'stale',   battery: 38, signal: 50, last: '11:42:18', source: 'iot' },
  // Incubation tray devices
  { id: 'IOT-I1-T01', kind: 'temp',  zh: '水溫', en: 'Temp',     tank: 'I1', stage: 'INC', proto: 'WiFi',     status: 'online',  battery: 95, signal: 92, last: '14:45:02', source: 'iot' },
  { id: 'IOT-I1-D01', kind: 'do',    zh: '溶氧', en: 'DO',       tank: 'I1', stage: 'INC', proto: 'WiFi',     status: 'online',  battery: 88, signal: 90, last: '14:45:01', source: 'iot' },
];

const GATEWAYS = [
  { id: 'GW-01', zh: 'A 區閘道', en: 'Zone A Gateway', proto: 'WiFi 6 + BLE', status: 'online',  ip: '10.20.1.21', devices: 9, uptime: '42d 11h' },
  { id: 'GW-02', zh: 'B 區閘道', en: 'Zone B Gateway', proto: 'WiFi 6 + BLE', status: 'online',  ip: '10.20.1.22', devices: 8, uptime: '42d 11h' },
  { id: 'GW-03', zh: 'C/Q 閘道', en: 'C/Q Gateway',    proto: 'BLE Mesh',     status: 'degraded', ip: '10.20.1.23', devices: 4, uptime: '3h 12m' },
  { id: 'GW-04', zh: '孵化室閘道', en: 'Hatchery Gateway', proto: 'WiFi 6',     status: 'online',  ip: '10.20.1.24', devices: 2, uptime: '17d 04h' },
  { id: 'MQTT-CLOUD', zh: 'MQTT 雲', en: 'MQTT Broker',  proto: 'mqtts://',     status: 'online',  ip: 'cwa.mqtt:8883', devices: 23, uptime: '90d+' },
];

// Fish batches with transfer history & adaptation plan
const BATCHES = [
  {
    id: 'CS-26-04', zh: '櫻鱒 春季 #04', en: 'Cherry Salmon Spring #04',
    species: 'Oncorhynchus masou', initial: 12000, current: 11540, hatchDate: '2026-03-15',
    stage: 'NUR', tank: 'A1', daysInStage: 14,
    history: [
      { date: '2026-03-15', from: '—',     to: 'I1', stage: 'INC', count: 12000, note: '受精卵入孵 / Eggs received' },
      { date: '2026-04-08', from: 'I1',    to: 'A1', stage: 'NUR', count: 11820, note: '孵化完成 / Hatch complete' },
      { date: '2026-04-22', from: 'A1',    to: 'A1', stage: 'NUR', count: 11540, note: '稚魚分篩 / Fry grading' },
    ],
    adaptation: {
      current: 11.2, target: 12.5, dailyStep: 0.2, days: 7,
      plan: [
        { day: 1, target: 11.4 }, { day: 2, target: 11.6 }, { day: 3, target: 11.8 },
        { day: 4, target: 12.0 }, { day: 5, target: 12.2 }, { day: 6, target: 12.4 }, { day: 7, target: 12.5 },
      ],
      risk: 'low',
    },
  },
  {
    id: 'CS-26-03', zh: '櫻鱒 春季 #03', en: 'Cherry Salmon Spring #03',
    species: 'Oncorhynchus masou', initial: 9000, current: 8050, hatchDate: '2026-02-02',
    stage: 'NUR', tank: 'A4', daysInStage: 28,
    history: [
      { date: '2026-02-02', from: '—',  to: 'I2', stage: 'INC', count: 9000, note: '受精卵入孵 / Eggs received' },
      { date: '2026-02-26', from: 'I2', to: 'A4', stage: 'NUR', count: 8780, note: '孵化完成 / Hatch complete' },
    ],
    adaptation: { current: 11.9, target: 12.5, dailyStep: 0.2, days: 3, plan: [
      { day: 1, target: 12.1 }, { day: 2, target: 12.3 }, { day: 3, target: 12.5 },
    ], risk: 'low' },
  },
  {
    id: 'CS-25-12', zh: '櫻鱒 秋季 #12', en: 'Cherry Salmon Autumn #12',
    species: 'Oncorhynchus masou', initial: 6000, current: 5240, hatchDate: '2025-09-10',
    stage: 'GRO', tank: 'B1', daysInStage: 95,
    history: [
      { date: '2025-09-10', from: '—',  to: 'I3', stage: 'INC', count: 6000, note: '受精卵入孵 / Eggs received' },
      { date: '2025-10-04', from: 'I3', to: 'A2', stage: 'NUR', count: 5820, note: '孵化完成 / Hatch complete' },
      { date: '2025-12-15', from: 'A2', to: 'JV', stage: 'JUV', count: 5520, note: '移入中池 / To juvenile' },
      { date: '2026-01-29', from: 'JV', to: 'B1', stage: 'GRO', count: 5310, note: '移入大池 / To grow-out' },
    ],
    adaptation: { current: 10.4, target: 11.0, dailyStep: 0.15, days: 4, plan: [
      { day: 1, target: 10.55 }, { day: 2, target: 10.70 }, { day: 3, target: 10.85 }, { day: 4, target: 11.00 },
    ], risk: 'low' },
  },
  {
    id: 'CS-25-11', zh: '櫻鱒 秋季 #11', en: 'Cherry Salmon Autumn #11',
    species: 'Oncorhynchus masou', initial: 6000, current: 5060, hatchDate: '2025-08-20',
    stage: 'GRO', tank: 'B2', daysInStage: 110,
    history: [
      { date: '2025-08-20', from: '—',  to: 'I4', stage: 'INC', count: 6000, note: '受精卵入孵' },
      { date: '2025-09-14', from: 'I4', to: 'A3', stage: 'NUR', count: 5810, note: '孵化完成' },
      { date: '2025-11-25', from: 'A3', to: 'JV', stage: 'JUV', count: 5510, note: '移入中池' },
      { date: '2026-01-15', from: 'JV', to: 'B2', stage: 'GRO', count: 5290, note: '移入大池' },
    ],
    // RISK: ramp too fast
    adaptation: { current: 12.1, target: 13.0, dailyStep: 0.45, days: 2, plan: [
      { day: 1, target: 12.55 }, { day: 2, target: 13.00 },
    ], risk: 'high', riskNote: '日升幅 0.45°C 超過建議 0.30°C / Daily ramp exceeds 0.30°C guideline' },
  },
];

// Device-related alerts (added to existing alerts)
const DEVICE_ALERTS = [
  { id: 'AL-2042', sev: 'warn',   tank: 'B2', title: 'pH sensor offline',          metric: 'IOT-B2-P01', value: '—',    unit: '',  threshold: '> 5min',  ts: '12:18:42', age: '2h 27m', ack: false, kind: 'device' },
  { id: 'AL-2043', sev: 'warn',   tank: 'A3', title: 'Temperature sensor abnormal',metric: 'IOT-A3-T01', value: 'drift',unit: '',  threshold: 'cal',     ts: '14:33:11', age: '12m ago', ack: false, kind: 'device' },
  { id: 'AL-2044', sev: 'info',   tank: 'J2', title: 'Telemetry stale',            metric: 'IOT-J2-T01', value: '11:42',unit: '',  threshold: '> 30min', ts: '12:15:00', age: '2h 30m', ack: false, kind: 'device' },
  { id: 'AL-2045', sev: 'warn',   tank: 'B2', title: 'Adaptation ramp risk',       metric: 'CS-25-11',   value: 0.45,   unit: '°C/day', threshold: '> 0.3', ts: '13:48:00', age: '57m ago', ack: false, kind: 'plan' },
];

window.AQUA_DATA.STAGES = STAGES;
window.AQUA_DATA.DEVICES = DEVICES;
window.AQUA_DATA.GATEWAYS = GATEWAYS;
window.AQUA_DATA.BATCHES = BATCHES;
// Merge device alerts into the main alert stream so the panel surfaces them too.
window.AQUA_DATA.ALERTS = [...window.AQUA_DATA.ALERTS, ...DEVICE_ALERTS];
window.AQUA_DATA.DEVICE_ALERTS = DEVICE_ALERTS;

/* ============================================================
   KLK v0.1 ─ SettingsStore / AuditStore / LogStore
   ─ localStorage persisted, IoT-compatible (source field on every record)
   ─ Pub/sub for live UI updates
   ============================================================ */

// ─── Utilities ───────────────────────────────────────────────
function _klkUuid() {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}
function _klkNow() { return new Date().toISOString(); }
function _klkClone(o) {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(_klkClone);
  const r = {}; for (const k in o) r[k] = _klkClone(o[k]); return r;
}
function _klkIsObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}
function _klkMerge(t, s) {
  if (!_klkIsObj(t) || !_klkIsObj(s)) return s === undefined ? t : _klkClone(s);
  const r = _klkClone(t);
  for (const k in s) r[k] = _klkIsObj(s[k]) && _klkIsObj(r[k]) ? _klkMerge(r[k], s[k]) : _klkClone(s[k]);
  return r;
}
function _klkDiff(a, b, base) {
  base = base || '';
  const out = [];
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    const p = base ? base + '.' + k : k;
    const va = a ? a[k] : undefined;
    const vb = b ? b[k] : undefined;
    if (_klkIsObj(va) && _klkIsObj(vb)) out.push(..._klkDiff(va, vb, p));
    else if (JSON.stringify(va) !== JSON.stringify(vb)) out.push({ path: p, before: va, after: vb });
  }
  return out;
}
function _klkRead(key, fb) {
  try { const r = localStorage.getItem(key); return r == null ? fb : JSON.parse(r); }
  catch (e) { console.warn('[KLK] read fail', key, e); return fb; }
}
function _klkWrite(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { console.error('[KLK] write fail', key, e); return false; }
}

// ─── Storage Keys ────────────────────────────────────────────
const KLK_KEYS = {
  SETTINGS:     'klk_settings_v1',
  AUDIT:        'klk_settings_audit_v1',
  LOGS:         'klk_logs_v1',
  CURRENT_USER: 'klk_current_user_v1',
  MIGRATION:    'klk_migration_v1',
};

// ─── Pub/sub channels ────────────────────────────────────────
const _klkSubs = { settings: [], logs: [], audit: [] };
function _klkEmit(ch) {
  (_klkSubs[ch] || []).forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
}

// ─── DEFAULT_SETTINGS ────────────────────────────────────────
const DEFAULT_SETTINGS = {
  schemaVersion: 1,
  updatedAt: null,
  updatedBy: null,

  samplingFrequencyByStage: { INC: 30, NUR: 60, JUV: 120, GRO: 180, BRO: 240 },

  // Diamond Creeks acclimatization plan: Hatch cold → Nursery 15-17 → Juvenile warmer → Grow-out ambient
  // transferOutCm = body length threshold to graduate the stage (null = manager decides)
  stageStandards: {
    INC: { temp:[7,10],  doMin:9.0, ph:[7.0,7.4], nh3Max:0.02, no2Max:0.05, transferOutCm: 3 },
    NUR: { temp:[15,17], doMin:8.0, ph:[6.8,7.6], nh3Max:0.05, no2Max:0.10, transferOutCm: 20 },
    JUV: { temp:[20,23], doMin:7.0, ph:[6.8,7.8], nh3Max:0.10, no2Max:0.15, transferOutCm: null },
    GRO: { temp:[18,24], doMin:6.5, ph:[6.8,7.8], nh3Max:0.15, no2Max:0.20, transferOutCm: null },
    BRO: { temp:[15,18], doMin:7.5, ph:[6.8,7.6], nh3Max:0.10, no2Max:0.15, transferOutCm: null },
  },

  alertRules: {
    tempOver:        { enabled:true, severity:'danger' },
    tempUnder:       { enabled:true, severity:'warn' },
    doLow:           { enabled:true, severity:'danger' },
    phOutOfRange:    { enabled:true, severity:'warn' },
    nh3Over:         { enabled:true, severity:'warn' },
    no2Over:         { enabled:true, severity:'warn' },
    deviceOffline:   { enabled:true, severity:'warn',  staleMinutes:30 },
    samplingMissing: { enabled:true, severity:'warn',  thresholdMultiplier:2 },
    pipelineFault:   { enabled:true, severity:'danger' },
  },

  tankStageMapping: (function () {
    const m = {};
    (window.AQUA_DATA.TANKS || []).forEach(t => {
      m[t.id] = { stage: t.stage, batchId: null, enabled: true };
    });
    (window.AQUA_DATA.BATCHES || []).forEach(b => {
      if (m[b.tank]) m[b.tank].batchId = b.id;
    });
    return m;
  })(),

  deviceBindingRules: (function () {
    const m = {};
    (window.AQUA_DATA.DEVICES || []).forEach(d => {
      // Map legacy `kind` to metric type; multi-metric devices get array
      const metricMap = { temp:['temp'], do:['doO'], ph:['ph'], nh3:['nh3'], no2:['no2'] };
      const metrics = metricMap[d.kind] || [];
      m[d.id] = {
        tankId: d.tank || null,
        kind: d.kind,
        metrics,                    // NEW: which metrics this device supplies
        autoFill: false,            // NEW: future IoT auto-write toggle
        includeInAlerts: true,
      };
    });
    return m;
  })(),

  // ─── Stage Equipment Requirements (Phase 1) ─────────────────
  // Per-stage list of required equipment categories.
  // multiparam can satisfy multiple metrics via supportedMetrics on devices.
  stageEquipmentRequirements: {
    INC: [
      { type:'temp_sensor',  label:'水溫感測器 Temp Sensor',     required:true,  metrics:['temp'] },
      { type:'do_sensor',    label:'溶氧感測器 DO Sensor',       required:true,  metrics:['doO'] },
      { type:'flow_control', label:'孵化水流控制 Flow Control',  required:true,  metrics:[] },
      { type:'lighting',     label:'光照 / 孵化輔助 Lighting',   required:true,  metrics:[] },
      { type:'chiller_link', label:'冷卻系統連接 Chiller Link',  required:true,  metrics:[] },
    ],
    NUR: [
      { type:'multiparam',   label:'多參數水質監測儀 Multiparameter Probe', required:false, metrics:[],
        suggested:'In-Situ Aqua TROLL · YSI EXO · Hach' },
      { type:'temp_sensor',  label:'水溫 Temp',          required:true,  metrics:['temp'] },
      { type:'do_sensor',    label:'溶氧 DO',            required:true,  metrics:['doO'] },
      { type:'ph_sensor',    label:'pH',                 required:true,  metrics:['ph'] },
      { type:'nh3_sensor',   label:'氨氮 NH₃',           required:true,  metrics:['nh3'] },
      { type:'no2_sensor',   label:'亞硝酸 NO₂',         required:true,  metrics:['no2'] },
      { type:'aerator',      label:'曝氣 / 高溶氧設備 Aerator', required:true,  metrics:[] },
    ],
    JUV: [
      { type:'multiparam',   label:'多參數水質監測儀 Multiparameter Probe', required:false, metrics:[],
        suggested:'In-Situ Aqua TROLL · YSI EXO · Hach' },
      { type:'temp_sensor',  label:'水溫 Temp', required:true, metrics:['temp'] },
      { type:'do_sensor',    label:'溶氧 DO',   required:true, metrics:['doO'] },
      { type:'ph_sensor',    label:'pH',        required:true, metrics:['ph'] },
      { type:'aerator',      label:'曝氣設備 Aerator',         required:true, metrics:[] },
      { type:'ras',          label:'循環水設備 RAS',           required:true, metrics:[] },
    ],
    GRO: [
      { type:'temp_sensor',  label:'水溫 Temp', required:true, metrics:['temp'] },
      { type:'do_sensor',    label:'溶氧 DO',   required:true, metrics:['doO'] },
      { type:'ph_sensor',    label:'pH',        required:true, metrics:['ph'] },
      { type:'aerator',      label:'曝氣設備 Aerator',           required:true, metrics:[] },
      { type:'ras',          label:'循環水設備 RAS',             required:true, metrics:[] },
      { type:'natural_monitor', label:'自然馴化監控 Natural Acclimatization Monitor', required:true, metrics:[] },
    ],
  },

  // ─── Device Inventory (Phase 1) ─────────────────────────────
  // Initial seed: import existing DEVICES + 1 example multiparam (待採購)
  // admin can add/edit/delete via Settings → 06 設備管理
  deviceInventory: (function () {
    const inv = (window.AQUA_DATA.DEVICES || []).map(d => {
      const metricMap = { temp:'temp_sensor', do:'do_sensor', ph:'ph_sensor',
                          nh3:'nh3_sensor', no2:'no2_sensor', flow:'flow_control' };
      const supportedMap = { temp:['temp'], do:['doO'], ph:['ph'], nh3:['nh3'], no2:['no2'], flow:[] };
      return {
        id:               d.id,
        nameZh:           ({ temp:'水溫感測器', do:'溶氧感測器', ph:'pH 感測器', nh3:'氨氮感測器', no2:'亞硝酸感測器', flow:'流量計' })[d.kind] || (d.zh || d.kind),
        nameEn:           d.en || '',
        brand:            d.proto === 'Manual' ? 'Manual' : 'Generic',
        model:            d.proto || '',
        serialNumber:     '',
        kind:             metricMap[d.kind] || d.kind,
        supportedMetrics: supportedMap[d.kind] || [],
        inventoryStatus:  d.status === 'online' ? 'installed'
                         : d.status === 'offline' ? 'maintenance'
                         : d.status === 'manual' ? 'installed'
                         : 'installed',
        dataSource:       d.source === 'iot' ? 'device' : (d.source || 'manual'),
        protocol:         d.proto || null,
        note:             '',
      };
    });
    // Add an example multiparam probe (待安裝) for demo
    inv.push({
      id:               'DEV-MP-DEMO-01',
      nameZh:           '小魚池多參數水質監測儀（示範）',
      nameEn:           'Nursery Multiparameter Probe (Demo)',
      brand:            'In-Situ',
      model:            'Aqua TROLL 600',
      serialNumber:     'SN-DEMO-MP01',
      kind:             'multiparam',
      supportedMetrics: ['temp','doO','ph','nh3','no2'],
      inventoryStatus:  'pending',
      dataSource:       'device',
      protocol:         'MQTT',
      note:             '示範多參數儀，待採購安裝後綁定 A1。',
    });
    return inv;
  })(),

  // ─── Notifications (Phase 4) ────────────────────────────────
  notifications: {
    telegram: { enabled:false, botToken:'', chatId:'' },
    line:     { enabled:false, channelAccessToken:'', userId:'', groupId:'',
                note:'v2 規劃：LINE Messaging API 需後端代理；LINE Notify 已停服' },
    rules: {
      cooldownMinutes:    10,
      severityThreshold:  'warning',   // warning | danger
      activeAlertTTLMin:  60,
    },
  },

  staff: [
    { id:'AD', name:'王經理', code:'AD-WM-001', shift:'day',   role:'admin',
      allowedLogTypes:['water','feeding','mortality','operation','fish_count'], enabled:true },
    { id:'YN', name:'楊乃文', code:'OP-YN-001', shift:'mid',   role:'operator',
      allowedLogTypes:['water','feeding','mortality','operation','fish_count'], enabled:true },
    { id:'KT', name:'金角',   code:'OP-KT-001', shift:'day',   role:'operator',
      allowedLogTypes:['water','feeding','mortality','operation','fish_count'], enabled:true },
    { id:'MS', name:'王美珊', code:'OP-MS-001', shift:'night', role:'operator',
      allowedLogTypes:['water','feeding','mortality','operation','fish_count'], enabled:true },
    { id:'GU', name:'訪客',   code:'VW-GU-001', shift:'flex',  role:'viewer',
      allowedLogTypes:[], enabled:true },
  ],

  dataSources: {
    manual:   { enabled:true,  label:'人工輸入' },
    imported: { enabled:true,  label:'匯入資料' },
    device:   { enabled:false, label:'設備自動' },
  },

  // Editable lists — managed in Settings → 05 選項管理
  feedTypes: [
    'Skretting Nutra-2.0',
    'BioMar Inicio 4.5',
    'BioMar Vitalis Repro',
    '本地飼料 Local feed',
  ],
  mortalityCauses: [
    '未知 Unknown',
    '缺氧 Hypoxia',
    '熱緊迫 Heat stress',
    '溫度震盪 Temp shock',
    '水質異常 Water quality',
    '病理 Pathology',
    '機械傷 Trauma',
    '其他 Other',
  ],

  roles: {
    admin:    { label:'管理員', permissions:['*'] },
    operator: { label:'操作員', permissions:[
      'log:write','log:edit:own','tank:view','dashboard:view','reports:view','reports:export'
    ]},
    viewer:   { label:'檢視者', permissions:[
      'dashboard:view','reports:view','tank:view'
    ]},
  },

  samplingResponsibility: {
    byStage: {
      INC: { primary:'KT', backup:'YN', shift:'day'   },
      NUR: { primary:'YN', backup:'KT', shift:'mid'   },
      JUV: { primary:'MS', backup:'YN', shift:'night' },
      GRO: { primary:'YN', backup:'MS', shift:'all'   },
    },
    byTank: {},
  },

  reportsConfig: {
    daily:     { enabled:true,  defaultRangeDays:1 },
    weekly:    { enabled:true,  defaultRangeDays:7 },
    growth:    { enabled:false },  // v0.2 (needs measurement type)
    mortality: { enabled:true },
    fcr:       { enabled:false },  // v0.2
    devices:   { enabled:true },
    staffLog:  { enabled:true },
    exportFormats: ['csv'],
  },
};

// ─── SettingsStore ───────────────────────────────────────────
const SettingsStore = {
  getSettings() {
    const stored = _klkRead(KLK_KEYS.SETTINGS, null);
    if (!stored) return _klkClone(DEFAULT_SETTINGS);
    return _klkMerge(DEFAULT_SETTINGS, stored);
  },

  updateSettings(patch, byUserId, source, note) {
    source = source || 'ui';
    const before = this.getSettings();
    const after  = _klkMerge(before, patch);
    after.updatedAt = _klkNow();
    after.updatedBy = byUserId || (this.getCurrentUser() && this.getCurrentUser().id) || null;

    const diffs = _klkDiff(before, after).filter(d => d.path !== 'updatedAt' && d.path !== 'updatedBy');
    diffs.forEach(d => {
      try {
        AuditStore.add({
          section:   d.path.split('.')[0],
          path:      d.path,
          before:    d.before,
          after:     d.after,
          changedBy: this._snapshot(byUserId),
          source,
          note,
        });
      } catch (e) { console.warn('[KLK] audit fail', e); }
    });

    _klkWrite(KLK_KEYS.SETTINGS, after);
    _klkEmit('settings');
    return after;
  },

  resetSettings(byUserId) {
    AuditStore.add({
      section:'*', path:'*', before:'(全部設定)', after:'(預設值)',
      changedBy: this._snapshot(byUserId), source:'reset', note:'還原全部設定為預設值',
    });
    _klkWrite(KLK_KEYS.SETTINGS, null);
    _klkEmit('settings');
    return this.getSettings();
  },

  getSamplingFrequency(stageId) {
    const f = this.getSettings().samplingFrequencyByStage;
    return (f && f[stageId]) != null ? f[stageId] : null;
  },
  getStageStandards(stageId) {
    const s = this.getSettings().stageStandards;
    return (s && s[stageId]) || null;
  },

  getStaff(filter) {
    let list = this.getSettings().staff || [];
    if (filter) {
      if (filter.enabled != null) list = list.filter(s => s.enabled === filter.enabled);
      if (filter.role)            list = list.filter(s => s.role === filter.role);
      if (filter.canLog)          list = list.filter(s => (s.allowedLogTypes || []).includes(filter.canLog));
    }
    return list;
  },
  getStaffById(id) {
    return (this.getSettings().staff || []).find(s => s.id === id) || null;
  },
  _snapshot(id) {
    const s = this.getStaffById(id);
    if (!s) return { staffId: id || 'unknown', name: '未知', code: '', role: 'unknown', shift: '' };
    return { staffId: s.id, name: s.name, code: s.code, role: s.role, shift: s.shift };
  },

  getDataSources(filter) {
    const ds = this.getSettings().dataSources || {};
    let arr = Object.keys(ds).map(id => Object.assign({ id }, ds[id]));
    if (filter && filter.enabled != null) arr = arr.filter(e => e.enabled === filter.enabled);
    return arr;
  },

  getCurrentUser() {
    const id = _klkRead(KLK_KEYS.CURRENT_USER, null) || 'AD';
    return this.getStaffById(id) || this.getStaffById('AD');
  },
  setCurrentUser(staffId) {
    _klkWrite(KLK_KEYS.CURRENT_USER, staffId);
    _klkEmit('settings');
    return this.getCurrentUser();
  },

  hasPermission(perm) {
    const u = this.getCurrentUser();
    if (!u) return false;
    const r = (this.getSettings().roles || {})[u.role];
    if (!r) return false;
    return r.permissions.indexOf('*') >= 0 || r.permissions.indexOf(perm) >= 0;
  },
  canStaffLog(staffId, logType) {
    const s = this.getStaffById(staffId);
    if (!s || !s.enabled) return false;
    return (s.allowedLogTypes || []).indexOf(logType) >= 0;
  },

  exportSettings() { return JSON.stringify(this.getSettings(), null, 2); },
  importSettings(json, byUserId) {
    const p = typeof json === 'string' ? JSON.parse(json) : json;
    if (!p || typeof p !== 'object') throw new Error('Invalid settings JSON');
    return this.updateSettings(p, byUserId, 'import', '從 JSON 匯入設定');
  },

  subscribe(cb) {
    _klkSubs.settings.push(cb);
    return () => { const i = _klkSubs.settings.indexOf(cb); if (i >= 0) _klkSubs.settings.splice(i, 1); };
  },
};

// ─── AuditStore ──────────────────────────────────────────────
const AUDIT_LIMIT = 1000;
const AuditStore = {
  add(entry) {
    const entries = this._read();
    const full = Object.assign({ id: _klkUuid(), changedAt: _klkNow() }, entry);
    entries.push(full);
    if (entries.length > AUDIT_LIMIT) entries.splice(0, entries.length - AUDIT_LIMIT);
    _klkWrite(KLK_KEYS.AUDIT, entries);
    _klkEmit('audit');
    return full;
  },
  list(filter) {
    let entries = this._read().slice().reverse();
    if (filter) {
      if (filter.section)   entries = entries.filter(e => e.section === filter.section);
      if (filter.path)      entries = entries.filter(e => e.path === filter.path || (e.path && e.path.indexOf(filter.path + '.') === 0));
      if (filter.byStaffId) entries = entries.filter(e => e.changedBy && e.changedBy.staffId === filter.byStaffId);
      if (filter.since)     entries = entries.filter(e => e.changedAt >= filter.since);
      if (filter.limit)     entries = entries.slice(0, filter.limit);
    }
    return entries;
  },
  recent(n) { return this.list({ limit: n || 5 }); },
  count() { return this._read().length; },
  clear() { _klkWrite(KLK_KEYS.AUDIT, []); _klkEmit('audit'); },
  export() { return JSON.stringify(this._read(), null, 2); },
  _read() { return _klkRead(KLK_KEYS.AUDIT, []); },
  subscribe(cb) {
    _klkSubs.audit.push(cb);
    return () => { const i = _klkSubs.audit.indexOf(cb); if (i >= 0) _klkSubs.audit.splice(i, 1); };
  },
};

// ─── LogStore ────────────────────────────────────────────────
const LOG_TYPES = ['water', 'feeding', 'mortality', 'operation', 'fish_count'];

const LogStore = {
  add(entry) {
    if (LOG_TYPES.indexOf(entry.type) < 0) throw new Error('Invalid log type: ' + entry.type);

    let enteredBy = entry.enteredBy;
    if (typeof enteredBy === 'string') enteredBy = SettingsStore._snapshot(enteredBy);
    if (!enteredBy || !enteredBy.staffId) throw new Error('enteredBy is required');

    const source = entry.source || 'manual';
    if (source === 'manual') {
      if (!SettingsStore.canStaffLog(enteredBy.staffId, entry.type)) {
        throw new Error('人員「' + enteredBy.name + '」沒有「' + entry.type + '」紀錄權限');
      }
    }

    const recordedAt = entry.recordedAt || _klkNow();
    const createdAt  = _klkNow();
    const isBackfill = (new Date(createdAt) - new Date(recordedAt)) > 60 * 60 * 1000;

    const full = {
      id: _klkUuid(),
      type: entry.type,
      schemaVersion: 1,
      tankId: entry.tankId || '—',
      batchId: entry.batchId || null,
      deviceId: entry.deviceId || null,
      recordedAt, createdAt, source,
      enteredBy,
      data: entry.data || {},
      note: entry.note || '',
      isBackfill,
      onTime: !isBackfill,
    };

    const all = this._read();
    all.push(full);
    _klkWrite(KLK_KEYS.LOGS, all);
    _klkEmit('logs');
    return full;
  },

  list(type, filter) {
    let entries = this._read();
    if (type) entries = entries.filter(e => e.type === type);
    if (filter) {
      if (filter.tankId)    entries = entries.filter(e => e.tankId === filter.tankId);
      if (filter.source)    entries = entries.filter(e => e.source === filter.source);
      if (filter.byStaffId) entries = entries.filter(e => e.enteredBy && e.enteredBy.staffId === filter.byStaffId);
      if (filter.since)     entries = entries.filter(e => e.recordedAt >= filter.since);
      if (filter.until)     entries = entries.filter(e => e.recordedAt <= filter.until);
    }
    entries.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    return entries;
  },

  latest(type, tankId) {
    const l = this.list(type, tankId ? { tankId } : null);
    return l.length ? l[0] : null;
  },

  remove(id) {
    const all = this._read();
    const i = all.findIndex(e => e.id === id);
    if (i < 0) return false;
    all.splice(i, 1);
    _klkWrite(KLK_KEYS.LOGS, all);
    _klkEmit('logs');
    return true;
  },

  count(type) { return this.list(type).length; },

  export(type) {
    const entries = this.list(type);
    const meta = [
      '# KLK Aquaculture Manual Logs Export',
      '# Type: ' + (type || 'all'),
      '# Generated: ' + _klkNow(),
      '# Source: KLK SaaS v0.1',
      '',
    ];
    const dataKeys = new Set();
    entries.forEach(e => Object.keys(e.data || {}).forEach(k => dataKeys.add(k)));
    const dataCols = Array.from(dataKeys);
    const headers = ['recordedAt', 'tankId', 'type', 'source', 'enteredBy', 'role']
      .concat(dataCols.map(k => 'data.' + k)).concat(['note']);
    const esc = v => {
      if (v == null) return '';
      const s = String(v);
      return s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0
        ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const rows = [headers.join(',')];
    entries.forEach(e => {
      const row = [
        e.recordedAt, e.tankId, e.type, e.source,
        e.enteredBy && e.enteredBy.name, e.enteredBy && e.enteredBy.role,
      ].concat(dataCols.map(k => e.data && e.data[k]))
       .concat([e.note]).map(esc);
      rows.push(row.join(','));
    });
    return '﻿' + meta.join('\r\n') + '\r\n' + rows.join('\r\n');
  },

  _read() { return _klkRead(KLK_KEYS.LOGS, []); },

  subscribe(cb) {
    _klkSubs.logs.push(cb);
    return () => { const i = _klkSubs.logs.indexOf(cb); if (i >= 0) _klkSubs.logs.splice(i, 1); };
  },
};

// ─── One-time migration: import seed logs into LogStore ──────
(function _klkMigrate() {
  const flag = _klkRead(KLK_KEYS.MIGRATION, null);
  if (flag && flag.seedLogsImported) return;

  const sysSnap = { staffId:'system', name:'系統匯入', code:'', role:'system', shift:'' };
  const todayAt = (hhmm) => {
    const [hh, mm] = hhmm.split(':').map(n => parseInt(n, 10));
    const d = new Date(); d.setHours(hh, mm, 0, 0); return d.toISOString();
  };
  const opSnap = (op) => {
    if (!op || op === '—') return sysSnap;
    if (op.indexOf('→') >= 0) op = op.split('→')[0];
    return SettingsStore._snapshot(op);
  };

  const all = _klkRead(KLK_KEYS.LOGS, []);
  const push = (type, tank, time, data, op, note) => {
    all.push({
      id: _klkUuid(), type, schemaVersion: 1,
      tankId: tank || '—', batchId: null, deviceId: null,
      recordedAt: todayAt(time), createdAt: _klkNow(),
      source: 'imported', enteredBy: opSnap(op),
      data, note: note || '', isBackfill: true, onTime: false,
    });
  };

  (window.AQUA_DATA.FEEDING_LOG || []).forEach(r =>
    push('feeding', r.tank, r.time, { feedType: r.feed, kg: r.kg }, r.op));
  (window.AQUA_DATA.MORTALITY_LOG || []).forEach(r =>
    push('mortality', r.tank, r.time, { count: r.count, cause: r.cause }, r.op));
  (window.AQUA_DATA.OPS_LOG || []).forEach(r =>
    push('operation', r.tank, r.time, { action: r.action, target: '' }, r.op, r.note));

  _klkWrite(KLK_KEYS.LOGS, all);
  _klkWrite(KLK_KEYS.MIGRATION, { seedLogsImported: true, migratedAt: _klkNow() });
  console.info('[KLK] Seed logs migrated to LogStore (' + all.length + ' entries)');
})();

// ─── Expose globally ────────────────────────────────────────
window.AQUA_DATA.SettingsStore = SettingsStore;
window.AQUA_DATA.AuditStore    = AuditStore;
window.AQUA_DATA.LogStore      = LogStore;
window.AQUA_DATA.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
window.AQUA_DATA.LOG_TYPES     = LOG_TYPES;
window.AQUA_DATA.KLK_KEYS      = KLK_KEYS;
window.SettingsStore = SettingsStore;
window.AuditStore    = AuditStore;
window.LogStore      = LogStore;
