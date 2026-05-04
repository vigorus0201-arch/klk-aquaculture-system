// KLK Diamond Creeks Cherry Salmon Aquaculture — site & operational data.
// Diamond Creeks, Behrang Ulu, Perak, Malaysia.
// Natural spring intake 24–25°C → cooled to 15–18°C.
// Cherry salmon (Oncorhynchus masou) ideal 7–13°C; current cooled water still
// above target so most active tanks show warn/danger status, reflecting the
// real challenge of cold-water aquaculture in tropical climate.

// ─── Site Profile (KLK / Diamond Creeks) ─────────────────────
const SITE_PROFILE = {
  companyName:    'KLK Aquaculture',
  projectName:    'KLK 櫻花鉤吻鮭馬來西亞養殖計畫',
  projectNameEn:  'KLK Cherry Salmon Malaysia Aquaculture Project',
  siteName:       'Diamond Creeks',
  siteNameLong:   'Diamond Creeks Eco Farm Sdn Bhd',
  region:         'Behrang Ulu, Perak, Malaysia',
  address:        'No. 7 (Lot 80), Jalan Bunga Melur 2, Diamond Creeks, 35900 Behrang Ulu, Perak, Malaysia',
  mapQuery:       'Diamond Creeks Eco Farm Sdn Bhd, Behrang Ulu, Perak',
  contactPhone:   null,                    // 待補 Pending — do not fabricate
  contactEmail:   null,
  waterSource:    '天然泉水 Natural Spring Water',
  intakeTempRange:[25, 26],                // °C — 進水溫度（天然泉水）
  cooledTempRange:[15, 18],                // °C — 經降溫系統後現況
  climateNotes:   '馬來西亞 Perak 山林地區，全年濕熱、降雨頻繁，晚間溫度相對較低。周邊自然環境佳、污染源較少。',
  intro:          'KLK 於馬來西亞 Perak 州 Diamond Creeks 場域建置冷水魚智慧養殖系統。該場域位於山林與天然水源環境，具備天然泉水供應，周邊污染源較少，適合作為冷水魚人工馴化與數據化養殖試驗基地。',
  introEn:        'KLK has established a cold-water aquaculture system at Diamond Creeks, Perak, Malaysia. Located in mountainous terrain with natural spring water and minimal environmental pollution, the site serves as an experimental base for cold-water fish acclimatization and data-driven cultivation.',
};

// ─── Farm Layout (Tank counts per stage) ─────────────────────
const FARM_LAYOUT = {
  hatch:    { count: 7, status: 'active',  confirmed: true,  zh: '孵化槽',     en: 'Hatch / Incubation', note: '已建置 / 部分使用中' },
  nursery:  { count: 6, status: 'active',  confirmed: true,  zh: '小魚槽',     en: 'Nursery',           note: '使用中 / 體長 10–15 cm' },
  juvenile: { count: 2, status: 'pending', confirmed: true,  zh: '中型池',     en: 'Juvenile',          note: '待啟用 / 等待小魚成長至 20 cm+' },
  growout:  { count: 4, status: 'pending', confirmed: false, zh: '大型池',     en: 'Grow-out',          note: '待啟用 / 槽數待確認' },
};

// ─── Stage Standards reference (for Current vs Ideal panel) ──
// Note: editable per-stage standards live in SettingsStore.stageStandards.
// This is the read-only "scientific reference" view aligned with KLK
// Diamond Creeks acclimatization plan (Malaysia tropical climate adaptation).
const STAGE_STANDARDS_REF = {
  INC: { tempLo: 7,  tempHi: 10, doMin: 9.0, sizeRangeCm: '受精卵 → 3 cm 仔魚', durationDays: '30–45',
         transferOutCm: 3,    transferNote: '達 3 cm + 開口攝食 → 移入小魚槽' },
  NUR: { tempLo: 15, tempHi: 17, doMin: 8.0, sizeRangeCm: '10 – 20 cm',         durationDays: '60–120',
         transferOutCm: 20,   transferNote: '達 20 cm 以上 → 移入中型池' },
  JUV: { tempLo: 20, tempHi: 23, doMin: 7.0, sizeRangeCm: '20 cm+ 馴化中',      durationDays: '90–180',
         transferOutCm: null, transferNote: '由管理者依現場狀況設定' },
  GRO: { tempLo: 18, tempHi: 24, doMin: 6.5, sizeRangeCm: '上市規格',           durationDays: '180+',
         transferOutCm: null, transferNote: '依當地環境適應；不再轉池' },
};

const TANK_THRESHOLDS = {
  temp: { ok: [9, 13], warn: [8, 14], danger: [7, 15] },     // °C
  do:   { ok: [8, 12], warn: [7, 13], danger: [6, 14] },     // mg/L (low side critical)
  ph:   { ok: [6.8, 7.6], warn: [6.5, 7.9], danger: [6.2, 8.2] },
};

// ─── Tanks: 19 total per Diamond Creeks layout ───────────────
//   Hatch (INC) × 7 : I1–I7
//   Nursery (NUR) × 6: A1–A6
//   Juvenile (JUV) × 2: J1–J2 (pending)
//   Grow-out (GRO) × 4: B1–B4 (pending, count to be confirmed)
//
// Note: countStatus values:
//   'actual'    — gathered from real on-site count
//   'estimated' — extrapolated from initial count + mortality logs
//   'pending'   — tank not yet active, no fish present
//
// Backward-compat: existing fields (count, mortality, temp, doO, ph,
// biomass, fillPct, status) preserved alongside new explicit fields.
const TANKS = [
  // ─── Hatch / Incubation × 7 ─── all pending: 待確認 / 待批次入孵
  // INC standard 7–10°C; current cooled 15–18°C still requires further chilling for hatch.
  { id: 'I1', stage: 'INC', stageZh: '孵化槽', capacity: 800,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待確認 / 待批次入孵',
    count: 0, mortality: 0, temp: 9.5, doO: 9.4, ph: 7.1, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
  { id: 'I2', stage: 'INC', stageZh: '孵化槽', capacity: 800,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待確認 / 待批次入孵',
    count: 0, mortality: 0, temp: 9.3, doO: 9.3, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
  { id: 'I3', stage: 'INC', stageZh: '孵化槽', capacity: 800,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待確認 / 待批次入孵',
    count: 0, mortality: 0, temp: 9.4, doO: 9.5, ph: 7.1, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
  { id: 'I4', stage: 'INC', stageZh: '孵化槽', capacity: 800,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待確認 / 待批次入孵',
    count: 0, mortality: 0, temp: 9.5, doO: 9.5, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
  { id: 'I5', stage: 'INC', stageZh: '孵化槽', capacity: 800,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待確認 / 待批次入孵',
    count: 0, mortality: 0, temp: 9.6, doO: 9.4, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
  { id: 'I6', stage: 'INC', stageZh: '孵化槽', capacity: 800,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待確認 / 待批次入孵',
    count: 0, mortality: 0, temp: 9.7, doO: 9.5, ph: 7.1, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
  { id: 'I7', stage: 'INC', stageZh: '孵化槽', capacity: 800,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待確認 / 待批次入孵',
    count: 0, mortality: 0, temp: 9.5, doO: 9.5, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },

  // ─── Nursery × 6 ─── 6 池 × 700 隻 = 4,200 (estimated baseline)
  // NUR standard 15–17°C aligned with current cooled water 15–18°C.
  { id: 'A1', stage: 'NUR', stageZh: '小魚槽', capacity: 3000,
    currentFishCount: 700, initialFishCount: 700, countStatus: 'estimated',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: 12, averageWeightG: null,
    lastCountedAt: null, note: '預估 / 體長約 10–15 cm',
    count: 700, mortality: 0, temp: 16.2, doO: 8.8, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 50, status: 'ok' },
  { id: 'A2', stage: 'NUR', stageZh: '小魚槽', capacity: 3000,
    currentFishCount: 700, initialFishCount: 700, countStatus: 'estimated',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: 12, averageWeightG: null,
    lastCountedAt: null, note: '預估 / 體長約 10–15 cm',
    count: 700, mortality: 0, temp: 16.5, doO: 8.6, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 50, status: 'ok' },
  { id: 'A3', stage: 'NUR', stageZh: '小魚槽', capacity: 3000,
    currentFishCount: 700, initialFishCount: 700, countStatus: 'estimated',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: 12, averageWeightG: null,
    lastCountedAt: null, note: '預估 / 體長約 10–15 cm',
    count: 700, mortality: 0, temp: 16.0, doO: 8.9, ph: 7.1, salinity: 0.0, biomass: 0, fillPct: 50, status: 'ok' },
  { id: 'A4', stage: 'NUR', stageZh: '小魚槽', capacity: 3000,
    currentFishCount: 700, initialFishCount: 700, countStatus: 'estimated',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: 12, averageWeightG: null,
    lastCountedAt: null, note: '預估 / 體長約 10–15 cm',
    count: 700, mortality: 0, temp: 17.1, doO: 8.4, ph: 6.9, salinity: 0.0, biomass: 0, fillPct: 50, status: 'ok' },
  { id: 'A5', stage: 'NUR', stageZh: '小魚槽', capacity: 3000,
    currentFishCount: 700, initialFishCount: 700, countStatus: 'estimated',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: 12, averageWeightG: null,
    lastCountedAt: null, note: '預估 / 體長約 10–15 cm',
    count: 700, mortality: 0, temp: 16.2, doO: 8.8, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 50, status: 'ok' },
  { id: 'A6', stage: 'NUR', stageZh: '小魚槽', capacity: 3000,
    currentFishCount: 700, initialFishCount: 700, countStatus: 'estimated',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: 12, averageWeightG: null,
    lastCountedAt: null, note: '預估 / 體長約 10–15 cm',
    count: 700, mortality: 0, temp: 16.4, doO: 8.7, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 50, status: 'ok' },

  // ─── Juvenile × 2 ─── pending — awaiting fish reaching 20 cm+
  { id: 'J1', stage: 'JUV', stageZh: '中型池', capacity: 5000,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待啟用 / 等待小魚成長至 20 cm+',
    count: 0, mortality: 0, temp: 16.0, doO: 8.5, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
  { id: 'J2', stage: 'JUV', stageZh: '中型池', capacity: 5000,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待啟用',
    count: 0, mortality: 0, temp: 16.1, doO: 8.5, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },

  // ─── Grow-out × 4 (count to be confirmed) ─── pending
  { id: 'B1', stage: 'GRO', stageZh: '大型池', capacity: 8000,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待啟用 / 槽數待確認',
    count: 0, mortality: 0, temp: 16.0, doO: 8.0, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
  { id: 'B2', stage: 'GRO', stageZh: '大型池', capacity: 8000,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待啟用 / 槽數待確認',
    count: 0, mortality: 0, temp: 16.1, doO: 8.0, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
  { id: 'B3', stage: 'GRO', stageZh: '大型池', capacity: 8000,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待啟用 / 槽數待確認',
    count: 0, mortality: 0, temp: 16.0, doO: 7.9, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
  { id: 'B4', stage: 'GRO', stageZh: '大型池', capacity: 8000,
    currentFishCount: 0, initialFishCount: 0, countStatus: 'pending',
    mortalityToday: 0, cumulativeMortality: 0, survivalRate: null,
    averageLengthCm: null, averageWeightG: null,
    lastCountedAt: null, note: '待啟用 / 槽數待確認',
    count: 0, mortality: 0, temp: 16.2, doO: 8.0, ph: 7.0, salinity: 0.0, biomass: 0, fillPct: 0, status: '' },
];

// Generate 24h time series (one point per 15 min = 96 points) per tank.
function genSeries(tank) {
  const now = Date.now();
  const points = 96;
  const series = { temp: [], doO: [], ph: [], t: [] };
  let { temp, doO, ph } = tank;
  // walk back; create realistic drift with diurnal cycle
  const baseT = temp - 0.4;
  for (let i = 0; i < points; i++) {
    const k = (points - 1 - i);
    const tMs = now - k * 15 * 60 * 1000;
    const hours = (new Date(tMs).getHours() + new Date(tMs).getMinutes()/60);
    const diurnal = Math.sin((hours - 6) / 24 * Math.PI * 2) * 0.5;
    const noiseT = (Math.sin(i * 0.31) + Math.sin(i * 0.7)) * 0.18;
    const noiseDO = (Math.cos(i * 0.27) + Math.sin(i * 0.55)) * 0.22;
    const noisePh = (Math.sin(i * 0.19) + Math.cos(i * 0.43)) * 0.04;

    let tv = baseT + diurnal + noiseT;
    let dv = doO - diurnal * 0.4 + noiseDO;
    let pv = ph + noisePh;

    // For tanks already in danger/warn, drift the variable into trouble at the end
    if (tank.status === 'danger' && i > points - 24) {
      dv -= (i - (points - 24)) * 0.10;
    }
    if (tank.id === 'A3' && i > points - 16) tv += (i - (points - 16)) * 0.08;
    if (tank.id === 'B4' && i > points - 20) pv -= (i - (points - 20)) * 0.012;

    series.t.push(tMs);
    series.temp.push(+tv.toFixed(2));
    series.doO.push(+dv.toFixed(2));
    series.ph.push(+pv.toFixed(2));
  }
  // anchor last value to current readings
  series.temp[series.temp.length - 1] = tank.temp;
  series.doO[series.doO.length - 1] = tank.doO;
  series.ph[series.ph.length - 1] = tank.ph;
  return series;
}

const TANK_SERIES = Object.fromEntries(TANKS.map(t => [t.id, genSeries(t)]));

const ALERTS = [
  {
    id: 'AL-2041', sev: 'danger', tank: 'B2',
    title: 'Dissolved Oxygen critical',
    metric: 'DO', value: 5.8, unit: 'mg/L', threshold: '< 6.0',
    ts: '14:42:11', age: '3m ago', ack: false,
  },
  {
    id: 'AL-2040', sev: 'danger', tank: 'B2',
    title: 'Mortality spike (24h)',
    metric: 'Mortality', value: 31, unit: 'fish', threshold: '> 20',
    ts: '14:38:02', age: '7m ago', ack: false,
  },
  {
    id: 'AL-2039', sev: 'warn', tank: 'A3',
    title: 'Temperature trending high',
    metric: 'Temp', value: 14.3, unit: '°C', threshold: '> 14.0',
    ts: '14:21:48', age: '24m ago', ack: false,
  },
  {
    id: 'AL-2038', sev: 'warn', tank: 'B4',
    title: 'pH below safe range',
    metric: 'pH', value: 6.4, unit: '', threshold: '< 6.5',
    ts: '13:55:03', age: '50m ago', ack: false,
  },
  {
    id: 'AL-2037', sev: 'warn', tank: 'J2',
    title: 'Mortality elevated',
    metric: 'Mortality', value: 8, unit: 'fish', threshold: '> 5',
    ts: '13:14:22', age: '1h 31m', ack: false,
  },
  {
    id: 'AL-2036', sev: 'info', tank: 'A3',
    title: 'Chiller-2 throughput reduced',
    metric: 'Flow', value: 78, unit: '%', threshold: '< 85',
    ts: '12:02:56', age: '2h 43m', ack: true,
  },
];

const FEEDING_LOG = [
  { time: '14:30', tank: 'A1', feed: 'Skretting Nutra-2.0', kg: 12.5, op: 'KT' },
  { time: '14:15', tank: 'A2', feed: 'Skretting Nutra-2.0', kg: 12.0, op: 'KT' },
  { time: '13:45', tank: 'B1', feed: 'BioMar Inicio 4.5',   kg: 38.4, op: 'YN' },
  { time: '13:30', tank: 'B3', feed: 'BioMar Inicio 4.5',   kg: 37.2, op: 'YN' },
  { time: '11:00', tank: 'I1', feed: 'BioMar Vitalis Repro',kg:  0.8, op: 'KT' },
  { time: '09:45', tank: 'A1', feed: 'Skretting Nutra-2.0', kg: 11.8, op: 'MS' },
  { time: '09:30', tank: 'A3', feed: 'Skretting Nutra-2.0', kg: 10.4, op: 'MS' },
];

const MORTALITY_LOG = [
  { time: '14:18', tank: 'B2', count: 14, cause: 'Suspected hypoxia', op: 'YN' },
  { time: '13:22', tank: 'A3', count:  6, cause: 'Heat stress',       op: 'YN' },
  { time: '12:08', tank: 'B2', count: 11, cause: 'Suspected hypoxia', op: 'YN' },
  { time: '11:40', tank: 'B4', count:  4, cause: 'Unknown',           op: 'KT' },
  { time: '10:15', tank: 'J2', count:  3, cause: 'Pathology — gill',  op: 'MS' },
  { time: '08:55', tank: 'A3', count:  2, cause: 'Unknown',           op: 'MS' },
];

const OPS_LOG = [
  { time: '14:40', tank: 'B2', action: 'Emergency aeration ON',     note: 'O2 boost +200% engaged', op: 'YN' },
  { time: '14:05', tank: 'A3', action: 'Chiller setpoint -0.5°C',    note: 'Reduced from 11.5 to 11.0', op: 'KT' },
  { time: '12:30', tank: 'B4', action: 'pH buffer dosed',           note: '120g sodium bicarbonate',  op: 'KT' },
  { time: '11:00', tank: '—',  action: 'Shift handover',            note: 'Day → Mid shift',          op: 'KT→YN' },
  { time: '08:30', tank: 'I1', action: 'Egg sample collected',      note: 'Lot #CS-26-04',            op: 'MS' },
  { time: '07:05', tank: '—',  action: 'Daily walk-through',         note: 'All tanks visually clear', op: 'MS' },
];

const ANALYTICS = {
  survival: { value: 96.4, unit: '%', delta: '+0.2 vs week', trend: [95.6, 95.8, 96.0, 96.1, 96.2, 96.3, 96.2, 96.4] },
  growth:   { value: 1.42, unit: 'g/day', delta: '+0.05', trend: [1.21, 1.25, 1.28, 1.31, 1.34, 1.37, 1.40, 1.42] },
  fcr:      { value: 1.08, unit: 'FCR', delta: '−0.03', down: false, trend: [1.18, 1.16, 1.14, 1.13, 1.12, 1.10, 1.09, 1.08] },
  biomass:  { value: 6.42, unit: 't',   delta: '+0.18 t', trend: [5.8, 5.9, 6.0, 6.1, 6.2, 6.3, 6.35, 6.42] },
};

window.AQUA_DATA = {
  SITE_PROFILE, FARM_LAYOUT, STAGE_STANDARDS_REF,
  TANK_THRESHOLDS, TANKS, TANK_SERIES, ALERTS,
  FEEDING_LOG, MORTALITY_LOG, OPS_LOG, ANALYTICS,
};
