/* global React, AQUA_DATA, Ic, Bi, L, LineChart, Spark */
const { useState: useStateT, useMemo: useMemoT, useEffect: useEffectT } = React;

// Subscribe to LogStore so TankCard re-renders when new logs arrive
function _useLogStoreVersion() {
  const [v, setV] = useStateT(0);
  useEffectT(() => {
    if (!window.LogStore) return;
    return window.LogStore.subscribe(() => setV(x => x + 1));
  }, []);
  return v;
}

// Compact relative time (small enough for tank-card)
function _relShort(iso) {
  if (!iso) return '—';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '剛剛';
  if (m < 60) return m + 'm 前';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h 前';
  return Math.floor(h / 24) + 'd 前';
}

// Latest-water indicator strip shown above the metric grid
function WaterLogStrip({ log }) {
  if (!log) {
    return (
      <div style={{
        padding:'4px 0', borderTop:'1px dashed var(--line-soft)',
        fontFamily:'var(--font-mono)', fontSize:10, color:'var(--warn)',
        letterSpacing:0.06, textTransform:'uppercase',
        display:'flex', alignItems:'center', gap:6,
      }}>
        <span>⚠</span>
        <span>尚無水質紀錄 · NO WATER LOG</span>
      </div>
    );
  }
  const m = Math.floor((Date.now() - new Date(log.recordedAt).getTime()) / 60000);
  const stale = m > 180; // > 3h: dim warning color
  const Badge = window.SourceBadge;
  return (
    <div style={{
      padding:'4px 0', borderTop:'1px dashed var(--line-soft)',
      fontFamily:'var(--font-mono)', fontSize:9.5,
      letterSpacing:0.06, textTransform:'uppercase',
      display:'flex', alignItems:'center', gap:6, flexWrap:'wrap',
    }}>
      <span style={{ color:'var(--fg-1)' }}>水質</span>
      <span style={{ color: stale ? 'var(--warn)' : 'var(--fg-0)', fontWeight:600 }}>
        {_relShort(log.recordedAt)}
      </span>
      <span style={{ color:'var(--fg-1)' }}>· by</span>
      <span style={{ color:'var(--fg-0)', fontWeight:600 }}>{log.enteredBy ? log.enteredBy.name : '—'}</span>
      <span style={{ marginLeft:'auto' }}>
        {Badge ? <Badge source={log.source} /> : null}
      </span>
    </div>
  );
}

function BatchTagFor({ tankId }) {
  const b = (window.AQUA_DATA.BATCHES || []).find(x => x.tank === tankId);
  if (!b) return null;
  const stage = (window.AQUA_DATA.STAGES || []).find(s => s.id === b.stage);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', background: 'var(--bg-1)',
      border: '1px solid var(--line-soft)',
      fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)',
      letterSpacing: 0.04,
    }}>
      <span style={{ color: 'var(--fg-3)', textTransform: 'uppercase' }}>批次 BATCH</span>
      <span style={{ color: 'var(--fg-0)', fontWeight: 600 }}>{b.id}</span>
      <span style={{ color: 'var(--fg-3)', marginLeft: 'auto' }}>{stage?.zh} {stage?.id}</span>
    </div>
  );
}

function SensorStrip({ tankId }) {
  const devs = (window.AQUA_DATA.DEVICES || []).filter(d => d.tank === tankId);
  if (devs.length === 0) return null;
  const offline = devs.filter(d => d.status === 'offline').length;
  const stale = devs.filter(d => d.status === 'stale' || d.status === 'abnormal').length;
  const lastTime = devs.map(d => d.last).sort().reverse()[0];
  const dotCol = (d) => d.status === 'online' ? 'var(--ok)'
    : d.status === 'offline' ? 'var(--danger)'
    : d.status === 'manual' ? 'var(--accent)'
    : 'var(--warn)';
  return (
    <div style={{ paddingTop: 6, borderTop: '1px dashed var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--fg-1)',
        letterSpacing: 0.06, textTransform: 'uppercase',
      }}>
        <span>感測器 SENSORS · {devs.length}{offline > 0 ? <span style={{color:'var(--danger)'}}> · {offline} OFFLINE</span> : null}{stale > 0 ? <span style={{color:'var(--warn)'}}> · {stale} STALE</span> : null}</span>
        <span>更新 {lastTime}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {devs.map(d => (
          <span key={d.id} title={`${d.id} · ${d.proto} · ${d.status} · last ${d.last}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '1px 5px', border: '1px solid var(--line-soft)',
            color: 'var(--fg-0)', fontFamily: 'var(--font-mono)', fontSize: 9.5,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotCol(d) }}></span>
            <span style={{ color: 'var(--fg-0)' }}>{d.en}</span>
            <span style={{ color: 'var(--fg-1)' }}>·{d.proto === 'Manual' ? 'M' : d.proto === 'BLE-GW' ? 'B' : d.proto === 'MQTT' ? 'Q' : 'W'}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status, big = false }) {
  const map = {
    ok:     { cls: '',       label: L.normal },
    warn:   { cls: 'warn',   label: L.warn },
    danger: { cls: 'danger', label: L.danger },
  };
  const m = map[status] || map.ok;
  return (
    <span className={`tank-status ${m.cls}`} style={big ? { fontSize: 11, padding: '3px 8px' } : null}>
      <span className="dot"></span>
      <span>{m.label.zh}</span>
      <span style={{ color: 'currentColor', opacity: 0.6, marginLeft: 4 }}>{m.label.en}</span>
    </span>
  );
}

function trendOf(series) {
  if (!series || series.length < 8) return { dir: 'flat', delta: 0 };
  const recent = series.slice(-4).reduce((a, b) => a + b, 0) / 4;
  const earlier = series.slice(-12, -8).reduce((a, b) => a + b, 0) / 4;
  const delta = recent - earlier;
  const dir = Math.abs(delta) < 0.05 ? 'flat' : delta > 0 ? 'up' : 'down';
  return { dir, delta };
}

function TrendArrow({ trend, danger }) {
  if (!trend) return null;
  const arrow = trend.dir === 'up' ? '▲' : trend.dir === 'down' ? '▼' : '–';
  const color = danger
    ? (trend.dir === 'up' ? 'var(--danger)' : 'var(--ok)')
    : 'var(--fg-3)';
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, marginLeft: 4 }}>
      {arrow} {trend.dir !== 'flat' ? Math.abs(trend.delta).toFixed(2) : ''}
    </span>
  );
}

// ─── Standards & Responsibility helpers ──────────────────────
function _stdFor(stageId) {
  if (!window.SettingsStore || !stageId) return null;
  return window.SettingsStore.getStageStandards(stageId);
}
function _respFor(tankId, stageId) {
  if (!window.SettingsStore) return null;
  const s = window.SettingsStore.getSettings();
  const sr = s && s.samplingResponsibility;
  if (!sr) return null;
  const r = (sr.byTank && sr.byTank[tankId]) || (sr.byStage && sr.byStage[stageId]);
  if (!r) return null;
  return {
    primary: r.primary ? window.SettingsStore.getStaffById(r.primary) : null,
    backup:  r.backup  ? window.SettingsStore.getStaffById(r.backup)  : null,
    shift:   r.shift,
  };
}

// ─── Metric status & gap calculators ─────────────────────────
function _statusRange(v, range, slack) {
  if (v == null || !range) return null;
  const [lo, hi] = range;
  if (v >= lo && v <= hi) return 'ok';
  if (v >= lo - slack && v <= hi + slack) return 'warn';
  return 'danger';
}
function _statusMin(v, min, slack) {
  if (v == null || min == null) return null;
  if (v >= min) return 'ok';
  if (v >= min - slack) return 'warn';
  return 'danger';
}
function _statusMax(v, max, slack) {
  if (v == null || max == null) return null;
  if (v <= max) return 'ok';
  if (v <= max + slack) return 'warn';
  return 'danger';
}
function _gapRange(v, range) {
  if (v == null || !range) return null;
  const [lo, hi] = range;
  if (v < lo) return { sign: '−', mag: lo - v };
  if (v > hi) return { sign: '+', mag: v - hi };
  return { sign: '✓', mag: 0 };
}
function _gapMin(v, min) {
  if (v == null || min == null) return null;
  return v >= min ? { sign:'✓', mag:0 } : { sign:'−', mag: min - v };
}
function _gapMax(v, max) {
  if (v == null || max == null) return null;
  return v <= max ? { sign:'✓', mag:0 } : { sign:'+', mag: v - max };
}

// ─── Action recommender ──────────────────────────────────────
function _actionFor(metricKey, value, status, target) {
  if (status === 'ok' || status == null) return '';
  if (metricKey === 'temp' && Array.isArray(target)) {
    if (value > target[1]) return status === 'danger' ? '啟動冷卻機 ❄' : '監控降溫';
    if (value < target[0]) return status === 'danger' ? '提升水溫'      : '監控升溫';
  }
  if (metricKey === 'doO')  return status === 'danger' ? '啟動曝氣 / O₂ 加注' : '監控曝氣';
  if (metricKey === 'ph' && Array.isArray(target)) {
    if (value > target[1]) return status === 'danger' ? '降 pH（CO₂ / 酸）' : '監控 pH';
    if (value < target[0]) return status === 'danger' ? '升 pH（緩衝）'     : '監控 pH';
  }
  if (metricKey === 'nh3' || metricKey === 'no2') {
    return status === 'danger' ? '換水 / 檢查生化過濾' : '監控 / 補測';
  }
  return '監控';
}

// ─── Sampling pure functions (v0.1: water log only) ──────────
function getLastLogTime(tankId) {
  if (!window.LogStore) return null;
  const latest = window.LogStore.latest('water', tankId);
  return latest ? latest.recordedAt : null;
}
function getNextDueTime(lastTime, frequencyMin) {
  if (!lastTime || !frequencyMin) return null;
  return new Date(new Date(lastTime).getTime() + frequencyMin * 60 * 1000).toISOString();
}
function isOverdue(now, nextDue) {
  if (!nextDue) return 'never';
  const nowMs = typeof now === 'number' ? now : new Date(now).getTime();
  const dueMs = new Date(nextDue).getTime();
  if (nowMs < dueMs) return 'ok';
  const lateMin = (nowMs - dueMs) / 60000;
  if (lateMin <= 30) return 'due';
  return 'overdue';
}
function _fmtClock(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}
function _fmtMins(min) {
  const m = Math.abs(Math.round(min));
  if (m < 1) return '<1m';
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? h + 'h ' + rem + 'm' : h + 'h';
}

// ─── Sampling status strip (one row inside TankCard) ─────────
function SamplingStrip({ tankId, stage, tickMs }) {
  if (!window.SettingsStore || !window.LogStore) return null;
  const frequency = window.SettingsStore.getSamplingFrequency(stage);
  const lastTime  = getLastLogTime(tankId);
  const nextDue   = getNextDueTime(lastTime, frequency);
  const now       = tickMs || Date.now();
  const status    = isOverdue(now, nextDue);

  const cfg = ({
    ok:      { color:'var(--ok)',     label:'✔ 正常' },
    due:     { color:'var(--warn)',   label:'⚠ 該量測' },
    overdue: { color:'var(--danger)', label:'✗ 嚴重逾時' },
    never:   { color:'var(--accent)', label:'─ 新池' },
  })[status];

  let leftText, rightText;
  if (status === 'never') {
    leftText  = '尚未建立首筆紀錄';
    rightText = cfg.label;
  } else if (!frequency) {
    leftText  = '上次 ' + _fmtClock(lastTime);
    rightText = '採樣頻率未設定';
  } else if (status === 'ok') {
    const elapsed = (now - new Date(lastTime).getTime()) / 60000;
    const remain  = (new Date(nextDue).getTime() - now) / 60000;
    leftText  = '上次 ' + _fmtClock(lastTime) + ' (' + _fmtMins(elapsed) + ' 前) · 下次 ' + _fmtClock(nextDue);
    rightText = cfg.label + ' (還有 ' + _fmtMins(remain) + ')';
  } else {
    const elapsed = (now - new Date(lastTime).getTime()) / 60000;
    const late    = (now - new Date(nextDue).getTime()) / 60000;
    leftText  = '上次 ' + _fmtClock(lastTime) + ' (' + _fmtMins(elapsed) + ' 前) · 應於 ' + _fmtClock(nextDue) + ' 量測';
    rightText = cfg.label + ' (已逾 ' + _fmtMins(late) + ')';
  }

  const leftColor =
    status === 'overdue' ? 'var(--danger)' :
    status === 'due'     ? 'var(--warn)'   :
    'var(--fg-0)';

  return (
    <div style={{
      padding:'4px 0', borderTop:'1px dashed var(--line-soft)',
      fontFamily:'var(--font-mono)', fontSize:9.5,
      letterSpacing:0.06, textTransform:'uppercase',
      display:'flex', alignItems:'center', gap:6, flexWrap:'wrap',
    }}>
      <span style={{ color:'var(--fg-1)' }}>採樣</span>
      <span style={{ color: leftColor, fontWeight:600 }}>{leftText}</span>
      <span style={{ marginLeft:'auto', color: cfg.color, fontWeight:700 }}>{rightText}</span>
    </div>
  );
}

// ─── Transfer suggestion (KLK v0.1) ──────────────────────────
// Stage progression map (terminal stages map to null)
const _STAGE_NEXT = {
  INC: { id:'NUR', zh:'小魚槽', en:'Nursery' },
  NUR: { id:'JUV', zh:'中型池', en:'Juvenile' },
  JUV: { id:'GRO', zh:'大型池', en:'Grow-out' },
  GRO: null,
  BRO: null,
};

// Effective body length: latest fish_count log overrides seed
function getEffectiveLength(tank) {
  if (!tank) return null;
  if (window.LogStore) {
    const lc = window.LogStore.latest('fish_count', tank.id);
    if (lc && lc.data && lc.data.averageLengthCm != null) return lc.data.averageLengthCm;
  }
  return tank.averageLengthCm != null ? tank.averageLengthCm : null;
}

// Pure: tank + stageStandard → suggestion object
function getTransferSuggestion(tank, stageStandard) {
  if (!tank) return { status:'no-suggestion' };
  if (tank.countStatus === 'pending')
    return { status:'no-suggestion', reason:'pending' };

  const next = _STAGE_NEXT[tank.stage];
  if (!next) return { status:'no-suggestion', reason:'final-stage' };

  const currentCm = getEffectiveLength(tank);
  if (currentCm == null) return { status:'no-suggestion', reason:'no-length-data' };

  const requiredCm = stageStandard ? stageStandard.transferOutCm : null;
  if (requiredCm == null) return {
    status:'no-suggestion', reason:'no-threshold',
    message:'移池條件未設定',
  };

  const progressPct = Math.min(100, (currentCm / requiredCm) * 100);

  if (currentCm >= requiredCm) {
    return {
      status:'recommend',
      nextStage: next.id, nextStageZh: next.zh, nextStageEn: next.en,
      currentCm, requiredCm, progressPct,
      message: '建議移入 ' + next.zh + '（' + next.en + '）',
    };
  }
  if (currentCm >= requiredCm * 0.85) {
    return {
      status:'approaching',
      nextStage: next.id, nextStageZh: next.zh, nextStageEn: next.en,
      currentCm, requiredCm, progressPct,
      message: '接近移池條件（' + currentCm + ' / ' + requiredCm + ' cm）',
    };
  }
  return {
    status:'not-yet',
    nextStage: next.id, nextStageZh: next.zh, nextStageEn: next.en,
    currentCm, requiredCm, progressPct,
    message: '尚未達移池條件（' + currentCm + ' / ' + requiredCm + ' cm）',
  };
}

// ─── TransferStrip (one row inside TankCard) ─────────────────
function TransferStrip({ tank }) {
  if (!window.SettingsStore) return null;
  const stageStandard = window.SettingsStore.getStageStandards(tank.stage);
  const sug = getTransferSuggestion(tank, stageStandard);

  if (sug.status === 'no-suggestion') return null;

  const cfg = ({
    recommend:   { color:'var(--ok)',     icon:'↑', bg:'oklch(0.32 0.06 165 / 0.18)', label:'建議移池' },
    approaching: { color:'var(--warn)',   icon:'…', bg:'transparent',                  label:'接近條件' },
    'not-yet':   { color:'var(--accent)', icon:'○', bg:'transparent',                  label:'移池進度' },
  })[sug.status];

  return (
    <div style={{
      padding:'6px 8px', marginTop:6,
      border:'1px solid ' + cfg.color,
      borderLeft:'3px solid ' + cfg.color,
      background: cfg.bg,
      display:'flex', alignItems:'center', gap:6, flexWrap:'wrap',
      fontFamily:'var(--font-mono)', fontSize:10.5,
      letterSpacing:0.06, textTransform:'uppercase',
    }}>
      <span style={{ color: cfg.color, fontWeight:800, fontSize:13 }}>{cfg.icon}</span>
      <span style={{ color:'var(--fg-0)', fontWeight:700 }}>{cfg.label}</span>
      <span style={{ color: cfg.color, fontWeight:700 }}>{sug.message}</span>
      <span style={{ marginLeft:'auto', color:'var(--fg-1)', fontSize:10 }}>
        進度 {sug.progressPct.toFixed(0)}%
      </span>
    </div>
  );
}

// ─── Fish count strip ────────────────────────────────────────
// Shows count / mortality / survival / length, sourced from latest
// fish_count log if available, otherwise from TANKS seed (with explicit
// "estimated" / "pending" badges so users never mistake it for real data).
function FishCountStrip({ tank }) {
  const latestCount = window.LogStore ? window.LogStore.latest('fish_count', tank.id) : null;
  const lcd = latestCount ? latestCount.data : null;

  // Effective values: latest log overrides seed
  const current  = lcd && lcd.currentFishCount != null ? lcd.currentFishCount
                 : tank.currentFishCount != null ? tank.currentFishCount
                 : tank.count;
  const lengthCm = lcd && lcd.averageLengthCm != null ? lcd.averageLengthCm
                 : tank.averageLengthCm;
  const weightG  = lcd && lcd.averageWeightG  != null ? lcd.averageWeightG
                 : tank.averageWeightG;

  const status   = latestCount ? 'actual' : (tank.countStatus || 'estimated');
  const lastAt   = latestCount ? latestCount.recordedAt : tank.lastCountedAt;
  const initial  = tank.initialFishCount;
  const mortToday  = tank.mortalityToday != null ? tank.mortalityToday : tank.mortality;
  const cumMort    = tank.cumulativeMortality;
  const survival   = tank.survivalRate;

  // Status badge
  const badge = status === 'actual' ? { color:'var(--ok)',     text:'實際 ACTUAL' }
              : status === 'estimated' ? { color:'var(--accent)', text:'估算 EST' }
              : status === 'pending' ? { color:'var(--warn)',   text:'待盤點 PENDING' }
              :                        { color:'var(--fg-1)',   text:status };

  const isPending = status === 'pending' || (current === 0 && initial === 0);

  return (
    <div style={{
      padding:'6px 0', borderTop:'1px dashed var(--line-soft)',
      fontSize:11, color:'var(--fg-0)',
    }}>
      <div style={{
        display:'flex', alignItems:'center', gap:6, flexWrap:'wrap',
        fontFamily:'var(--font-mono)', fontSize:9.5,
        letterSpacing:0.06, textTransform:'uppercase', marginBottom:4,
      }}>
        <span style={{ color:'var(--fg-1)' }}>魚數 FISH</span>
        <span style={{
          padding:'1px 5px', border:'1px solid '+badge.color, color:badge.color,
          fontSize:9, fontWeight:700,
        }}>{badge.text}</span>
        {lastAt ? (
          <span style={{ marginLeft:'auto', color:'var(--fg-1)' }}>
            盤點 {typeof lastAt === 'string' && lastAt.indexOf('T') > 0
                  ? lastAt.slice(0,10)
                  : (lastAt || '—')}
          </span>
        ) : (
          <span style={{ marginLeft:'auto', color:'var(--warn)' }}>未盤點</span>
        )}
      </div>

      {isPending ? (
        <div style={{
          padding:'6px 8px', border:'1px dashed var(--warn)',
          fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--warn)',
          textAlign:'center',
        }}>
          ⚠ 待啟用 / 待盤點 — {tank.note || '無資料'}
        </div>
      ) : (
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6,
          fontFamily:'var(--font-mono)', fontSize:11,
        }}>
          <div>
            <div style={{ fontSize:9, color:'var(--fg-1)' }}>目前 / 容量</div>
            <div style={{ color:'var(--accent)', fontWeight:700, fontSize:13 }}>
              {current != null ? current.toLocaleString() : '—'}
              {tank.capacity ? <span style={{ fontSize:9, color:'var(--fg-1)' }}> / {tank.capacity.toLocaleString()}</span> : null}
            </div>
          </div>
          <div>
            <div style={{ fontSize:9, color:'var(--fg-1)' }}>今日斃 · 累計</div>
            <div style={{ fontSize:11, fontWeight:600 }}>
              <span style={{ color: mortToday >= 10 ? 'var(--danger)' : mortToday >= 3 ? 'var(--warn)' : 'var(--fg-0)' }}>
                {mortToday != null ? mortToday : '—'}
              </span>
              <span style={{ color:'var(--fg-1)' }}> · </span>
              <span style={{ color:'var(--fg-0)' }}>{cumMort != null ? cumMort.toLocaleString() : '—'}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize:9, color:'var(--fg-1)' }}>存活率</div>
            <div style={{
              fontWeight:700, fontSize:13,
              color: survival == null ? 'var(--fg-1)'
                   : survival >= 90 ? 'var(--ok)'
                   : survival >= 80 ? 'var(--warn)' : 'var(--danger)',
            }}>{survival != null ? survival.toFixed(1) + '%' : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize:9, color:'var(--fg-1)' }}>平均體長</div>
            <div style={{ color:'var(--fg-0)', fontWeight:600, fontSize:12 }}>
              {lengthCm != null ? lengthCm + ' cm' : '—'}
              {weightG != null ? <span style={{ fontSize:10, color:'var(--fg-1)' }}> · {weightG} g</span> : null}
            </div>
          </div>
        </div>
      )}

      {tank.note && !isPending ? (
        <div style={{
          marginTop:4, fontSize:10, color:'var(--fg-1)',
          fontFamily:'var(--font-mono)', fontStyle:'italic',
        }}>{tank.note}</div>
      ) : null}
    </div>
  );
}

// ─── Inline pill for "no data" state ─────────────────────────
function NoDataPill() {
  return (
    <span className="tank-status warn">
      <span className="dot"></span>
      <span>未量測</span>
      <span style={{ color:'currentColor', opacity:0.6, marginLeft:4 }}>NO DATA</span>
    </span>
  );
}

// ─── Current / Target / Gap / Action grid ────────────────────
function CGTAGrid({ metrics }) {
  const colorFor = (s) =>
    s === 'ok'     ? 'var(--ok)'     :
    s === 'warn'   ? 'var(--warn)'   :
    s === 'danger' ? 'var(--danger)' : 'var(--fg-0)';

  const cols = '46px 1fr 90px 70px 1.4fr';

  return (
    <div style={{ marginTop: 6 }}>
      {/* Header */}
      <div style={{
        display:'grid', gridTemplateColumns: cols, gap:6,
        padding:'4px 0', borderBottom:'1px solid var(--line)',
        fontFamily:'var(--font-mono)', fontSize:9,
        color:'var(--fg-1)', letterSpacing:0.10, textTransform:'uppercase',
      }}>
        <span>指標</span>
        <span>Current</span>
        <span>Target</span>
        <span>Gap</span>
        <span>Action</span>
      </div>
      {metrics.map(m => {
        const c = colorFor(m.status);
        const noVal = m.value == null;
        const noStd = m.target == null;
        return (
          <div key={m.key} style={{
            display:'grid', gridTemplateColumns: cols, gap:6,
            padding:'5px 0', alignItems:'center',
            borderBottom:'1px solid var(--line-soft)',
            fontSize:11,
          }}>
            {/* 指標 */}
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:10.5,
              color:'var(--fg-0)', fontWeight:600,
            }}>{m.label}</span>

            {/* Current — 藍色（數據色） */}
            <span style={{
              fontFamily:'var(--font-mono)', fontWeight:600, fontSize:13,
              color: noVal ? 'var(--fg-1)' : 'var(--accent)',
            }}>
              {noVal ? '—' : m.value.toFixed(m.fixed)}
              {!noVal && m.unit ? (
                <span style={{ fontSize:9.5, color:'var(--fg-1)', marginLeft:2 }}>{m.unit}</span>
              ) : null}
            </span>

            {/* Target */}
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--fg-1)',
            }}>
              {noStd ? '未設定' : m.targetText}
            </span>

            {/* Gap — 綠色✔ / 金色⚠ / 紅色✗ */}
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:11.5, fontWeight:600, color: c,
            }}>
              {noVal || noStd ? '—' :
               m.status === 'ok' ? '✔ 正常' :
               (m.status === 'danger' ? '✗ ' : '⚠ ') + m.gap.sign + m.gap.mag.toFixed(m.fixed)}
            </span>

            {/* Action */}
            <span style={{
              fontSize:10.5, color: m.status === 'danger' ? c : 'var(--fg-0)',
            }}>
              {noVal ? '尚無資料' :
               (m.status === 'ok' || noStd) ? '—' :
               _actionFor(m.key, m.value, m.status, m.target)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Empty-state placeholder when no water log exists ────────
function NoWaterPlaceholder() {
  return (
    <div style={{
      marginTop: 8, padding: '14px 12px',
      border:'1px dashed var(--warn)', textAlign:'center',
      background:'oklch(0.32 0.06 78 / 0.10)',
    }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>📋</div>
      <div style={{ fontSize: 12.5, color: 'var(--fg-0)', fontWeight: 600 }}>
        尚無水質資料
      </div>
      <div style={{
        fontSize: 10.5, color: 'var(--fg-1)', marginTop: 4,
        fontFamily:'var(--font-mono)', letterSpacing: 0.06,
      }}>
        請於 08 人工紀錄補登 · NO WATER LOG YET
      </div>
    </div>
  );
}

// ─── TankCard ────────────────────────────────────────────────
/* ============================================================
   TankCard (KLK v0.2 — Monitoring page redesign)
   ─ Simplified layout: name + status + Temp/DO/pH + reminder + time
   ─ Bigger title, dark navy bg, clean grid
   ─ Click → onClick(tank) for parent to scroll to detail panel
   ============================================================ */

const _NEW_STAGE_NAME = { INC:'孵化池', NUR:'小魚池', JUV:'中魚池', GRO:'大魚池', BRO:'親魚池' };
const _NEW_COLORS = {
  ok:        '#22c55e',
  warn:      '#facc15',
  danger:    '#ef4444',
  noData:    '#64748b',
  textMain:  '#ffffff',
  textSub:   '#cbd5e1',
  cardBg:    '#0f172a',
  cardBorder:'rgba(255,255,255,0.06)',
};

function _statusLabel(s) {
  return ({ ok:'正常', warn:'警告', danger:'異常', noData:'無資料' })[s] || '—';
}

function _MetricCell({ label, value, unit, status, fixed }) {
  const noData = value == null;
  const c = noData ? _NEW_COLORS.noData
          : status === 'danger' ? _NEW_COLORS.danger
          : status === 'warn'   ? _NEW_COLORS.warn
          : status === 'ok'     ? _NEW_COLORS.ok
          : _NEW_COLORS.textMain;
  return (
    <div>
      <div style={{
        fontSize:11, fontWeight:600, color: _NEW_COLORS.textSub,
        textTransform:'uppercase', letterSpacing:0.06,
      }}>{label}</div>
      <div style={{
        fontSize:16, fontWeight:700, color: c, marginTop:3,
        fontFamily:'var(--font-mono)',
      }}>
        {noData ? '—' : value.toFixed(fixed != null ? fixed : 1)}
        {!noData && unit ? <span style={{ fontSize:11, color: _NEW_COLORS.textSub, marginLeft:3, fontWeight:600 }}>{unit}</span> : null}
      </div>
    </div>
  );
}

function TankCard({ tank, selected, onClick }) {
  const t = tank;

  // Subscribe to LogStore + Settings + 60s tick
  _useLogStoreVersion();
  const [, _setSV] = useStateT(0);
  useEffectT(() => {
    if (!window.SettingsStore) return;
    return window.SettingsStore.subscribe(() => _setSV(x => x + 1));
  }, []);
  const [, _setTick] = useStateT(Date.now());
  useEffectT(() => {
    const id = setInterval(() => _setTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // ─── Tank label: "I1｜孵化池 1" ───
  const stageZh   = _NEW_STAGE_NAME[t.stage] || t.stage;
  const tanksAll  = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const sameStage = tanksAll.filter(x => x.stage === t.stage);
  const tankIdx   = sameStage.findIndex(x => x.id === t.id) + 1;
  const tankLabel = t.id + '｜' + stageZh + ' ' + tankIdx;

  // ─── Latest water log → Temp / DO / pH only ───
  const latestWater = window.LogStore ? window.LogStore.latest('water', t.id) : null;
  const wd  = latestWater ? latestWater.data : null;
  const cTemp = wd && wd.temp != null ? wd.temp : null;
  const cDoO  = wd && wd.doO  != null ? wd.doO  : null;
  const cPh   = wd && wd.ph   != null ? wd.ph   : null;

  // ─── Status from Settings stageStandards ───
  const std = window.SettingsStore ? window.SettingsStore.getStageStandards(t.stage) : null;
  const tempS = std ? _statusRange(cTemp, std.temp, 0.5) : null;
  const doS   = std ? _statusMin(cDoO, std.doMin, 0.5)   : null;
  const phS   = std ? _statusRange(cPh, std.ph, 0.2)     : null;

  // ─── Overall status ───
  const overall = !latestWater ? 'noData'
                : (tempS === 'danger' || doS === 'danger' || phS === 'danger') ? 'danger'
                : (tempS === 'warn'   || doS === 'warn'   || phS === 'warn')   ? 'warn'
                : 'ok';
  const overallColor = _NEW_COLORS[overall];

  // ─── Reminder text ───
  const reminderText =
      overall === 'noData' ? '尚無水質資料 — 請補登一筆紀錄'
    : overall === 'danger' ? '水質異常 — 需立即處理'
    : overall === 'warn'   ? '接近警戒值 — 請密切觀察'
    : null;

  const updateText = latestWater ? _relShort(latestWater.recordedAt) : '尚無紀錄';

  // ─── Card style ───
  const cardStyle = {
    background:    _NEW_COLORS.cardBg,
    border:        '1px solid ' + _NEW_COLORS.cardBorder,
    borderLeft:    (overall === 'danger' || overall === 'warn')
                   ? '4px solid ' + overallColor
                   : '1px solid ' + _NEW_COLORS.cardBorder,
    borderRadius:  12,
    padding:       16,
    cursor:        'pointer',
    transition:    'transform 0.15s ease, box-shadow 0.15s ease',
    display:       'flex',
    flexDirection: 'column',
    gap:           12,
    boxShadow:     selected ? '0 0 0 2px ' + _NEW_COLORS.textMain : 'none',
  };

  return (
    <div onClick={() => onClick && onClick(t)}
         style={cardStyle}
         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.40)' + (selected ? ', 0 0 0 2px ' + _NEW_COLORS.textMain : ''); }}
         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = selected ? '0 0 0 2px ' + _NEW_COLORS.textMain : 'none'; }}>

      {/* ─── Title + status ─── */}
      <div>
        <div style={{ fontSize:16, fontWeight:700, color: _NEW_COLORS.textMain, lineHeight:1.3 }}>
          {tankLabel}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
          <span style={{
            display:'inline-block', width:8, height:8, borderRadius:'50%',
            background: overallColor,
          }}></span>
          <span style={{ fontSize:13, fontWeight:600, color: overallColor }}>
            {_statusLabel(overall)}
          </span>
        </div>
      </div>

      {/* ─── Water quality (Temp / DO / pH only) ─── */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10,
        paddingTop:12, borderTop:'1px solid ' + _NEW_COLORS.cardBorder,
      }}>
        <_MetricCell label="Temp" value={cTemp} unit="°C"   status={tempS} fixed={1} />
        <_MetricCell label="DO"   value={cDoO}  unit="mg/L" status={doS}   fixed={1} />
        <_MetricCell label="pH"   value={cPh}   unit=""     status={phS}   fixed={2} />
      </div>

      {/* ─── Reminder area (single, no duplicates) ─── */}
      {reminderText ? (
        <div style={{
          padding:'10px 12px',
          background:
              overall === 'danger' ? 'rgba(239,68,68,0.10)'
            : overall === 'warn'   ? 'rgba(250,204,21,0.10)'
            : 'rgba(100,116,139,0.10)',
          border:'1px solid ' + overallColor,
          borderLeft:'3px solid ' + overallColor,
          borderRadius:6,
          fontSize:13, fontWeight:600, color: overallColor,
        }}>
          {reminderText}
        </div>
      ) : null}

      {/* ─── Update time (smallest) ─── */}
      <div style={{
        fontSize:11, color: _NEW_COLORS.textSub, textAlign:'right', marginTop:'auto',
      }}>
        更新：{updateText}
      </div>
    </div>
  );
}

/* ============================================================
   TankGrid (KLK v0.2 — left-aligned, full-width, big title)
   ─ H2 標題 22px > 卡片 16px
   ─ Grid: minmax(280px, 1fr), gap 20, justify-content flex-start
   ============================================================ */
function TankGrid({ tanks, selectedId, onSelect }) {
  return (
    <section style={{
      background:'transparent', border:'none', padding:0, margin:0,
    }}>
      {/* H2 區塊標題 */}
      <div style={{
        display:'flex', alignItems:'baseline', gap:14,
        padding:'0 0 16px 0', borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:20,
      }}>
        <h2 style={{
          fontSize:22, fontWeight:600, color:'#ffffff', margin:0, lineHeight:1.2,
        }}>魚池總覽</h2>
        <span style={{
          fontSize:14, fontWeight:600, color:'#cbd5e1', fontFamily:'var(--font-mono)',
        }}>{tanks.length} 池</span>
        <span style={{ flex:1 }} />
        <span style={{ fontSize:13, color:'#cbd5e1' }}>
          點擊卡片可檢視詳細圖表
        </span>
      </div>

      {/* Cards grid: left-aligned, no centering */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',
        gap:20,
        justifyContent:'flex-start',
        alignContent:'flex-start',
      }}>
        {tanks.map(t => (
          <TankCard key={t.id} tank={t} selected={selectedId === t.id} onClick={onSelect} />
        ))}
      </div>
    </section>
  );
}

window.TankCard = TankCard;
window.TankGrid = TankGrid;
window.StatusPill = StatusPill;
// Sampling pure functions (for Dashboard / Reports reuse)
window.getLastLogTime = getLastLogTime;
window.getNextDueTime = getNextDueTime;
window.isOverdue      = isOverdue;
// Transfer suggestion pure functions (for Dashboard reuse)
window.getEffectiveLength    = getEffectiveLength;
window.getTransferSuggestion = getTransferSuggestion;
