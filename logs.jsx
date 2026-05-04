/* global React, AQUA_DATA, Ic, Bi, L, Spark */
const { useState: useStateL } = React;

function LogsPanel() {
  const [tab, setTab] = useStateL('feeding');
  const data = {
    feeding:   AQUA_DATA.FEEDING_LOG,
    mortality: AQUA_DATA.MORTALITY_LOG,
    ops:       AQUA_DATA.OPS_LOG,
  }[tab];

  const tabs = [
    { id: 'feeding',   zh: '投餌紀錄',   en: 'Feeding',    ct: AQUA_DATA.FEEDING_LOG.length },
    { id: 'mortality', zh: '斃死紀錄',   en: 'Mortality',  ct: AQUA_DATA.MORTALITY_LOG.length },
    { id: 'ops',       zh: '作業紀錄',   en: 'Operations', ct: AQUA_DATA.OPS_LOG.length },
  ];

  return (
    <section className="panel logs-area">
      <div className="panel-head" style={{ paddingBottom: 0, borderBottom: 'none', minHeight: 40 }}>
        <span className="panel-title">人工紀錄 <span style={{ color: 'var(--fg-3)' }}>· MANUAL LOGS</span></span>
        <div className="panel-actions">
          <button className="btn-mini"><Ic name="export" size={11} /> 匯出 EXPORT</button>
        </div>
      </div>
      <div className="tabs">
        {tabs.map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.zh} <span style={{ opacity: 0.6, marginLeft: 4 }}>{t.en}</span> <span className="ct">{t.ct}</span>
          </div>
        ))}
      </div>

      {tab === 'feeding' && (
        <>
          <div className="log-form">
            <div className="field">
              <label>時間 TIME</label><input type="time" defaultValue="14:45" />
            </div>
            <div className="field">
              <label>魚池 TANK</label>
              <select defaultValue="A1">
                {AQUA_DATA.TANKS.map(t => <option key={t.id}>{t.id}</option>)}
              </select>
            </div>
            <div className="field">
              <label>飼料 FEED TYPE</label>
              <select><option>Skretting Nutra-2.0</option><option>BioMar Inicio 4.5</option><option>BioMar Vitalis Repro</option></select>
            </div>
            <div className="field">
              <label>用量 AMOUNT (kg)</label><input type="number" step="0.1" placeholder="0.0" />
            </div>
            <div className="field">
              <label>備註 NOTE</label><input type="text" placeholder="—" />
            </div>
            <button className="btn-mini btn-primary" style={{ alignSelf: 'end', height: 30 }}><Ic name="check" size={11} /> 儲存 SAVE</button>
          </div>
          <div className="log-scroll">
            <table className="log-table">
              <thead>
                <tr><th>時間 TIME</th><th>池 TANK</th><th>飼料 FEED</th><th>kg</th><th>操作員 OP</th></tr>
              </thead>
              <tbody>
                {AQUA_DATA.FEEDING_LOG.map((r, i) => (
                  <tr key={i}><td>{r.time}</td><td>{r.tank}</td><td>{r.feed}</td><td>{r.kg.toFixed(1)}</td><td>{r.op}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'mortality' && (
        <>
          <div className="log-form">
            <div className="field"><label>時間 TIME</label><input type="time" defaultValue="14:45" /></div>
            <div className="field"><label>魚池 TANK</label>
              <select defaultValue="B2">{AQUA_DATA.TANKS.map(t => <option key={t.id}>{t.id}</option>)}</select>
            </div>
            <div className="field"><label>數量 COUNT</label><input type="number" placeholder="0" /></div>
            <div className="field"><label>原因 CAUSE</label>
              <select><option>未知 Unknown</option><option>缺氧 Hypoxia</option><option>熱緊迫 Heat stress</option><option>病理 Pathology</option><option>機械傷 Trauma</option></select>
            </div>
            <div className="field"><label>備註 NOTE</label><input type="text" placeholder="—" /></div>
            <button className="btn-mini btn-primary" style={{ alignSelf: 'end', height: 30 }}><Ic name="check" size={11} /> 儲存 SAVE</button>
          </div>
          <div className="log-scroll">
            <table className="log-table">
              <thead>
                <tr><th>時間 TIME</th><th>池 TANK</th><th>數 COUNT</th><th>原因 CAUSE</th><th>操作員 OP</th></tr>
              </thead>
              <tbody>
                {AQUA_DATA.MORTALITY_LOG.map((r, i) => (
                  <tr key={i}>
                    <td>{r.time}</td>
                    <td>{r.tank}</td>
                    <td style={{ color: r.count >= 10 ? 'var(--danger)' : r.count >= 5 ? 'var(--warn)' : 'var(--fg-1)' }}>{r.count}</td>
                    <td>{r.cause}</td>
                    <td>{r.op}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'ops' && (
        <>
          <div className="log-form" style={{ gridTemplateColumns: '1fr 1fr 1.6fr 2fr auto' }}>
            <div className="field"><label>時間 TIME</label><input type="time" defaultValue="14:45" /></div>
            <div className="field"><label>魚池 TANK</label>
              <select><option>—</option>{AQUA_DATA.TANKS.map(t => <option key={t.id}>{t.id}</option>)}</select>
            </div>
            <div className="field"><label>動作 ACTION</label>
              <select><option>水質調整 Water adj.</option><option>清池 Tank clean</option><option>移池 Transfer</option><option>器材維護 Maintenance</option><option>巡查 Walk-through</option></select>
            </div>
            <div className="field"><label>備註 NOTE</label><input type="text" placeholder="Description…" /></div>
            <button className="btn-mini btn-primary" style={{ alignSelf: 'end', height: 30 }}><Ic name="check" size={11} /> 儲存 SAVE</button>
          </div>
          <div className="log-scroll">
            <table className="log-table">
              <thead>
                <tr><th>時間 TIME</th><th>池 TANK</th><th>動作 ACTION</th><th>備註 NOTE</th><th>操作員 OP</th></tr>
              </thead>
              <tbody>
                {AQUA_DATA.OPS_LOG.map((r, i) => (
                  <tr key={i}><td>{r.time}</td><td>{r.tank}</td><td>{r.action}</td><td style={{ color: 'var(--fg-2)' }}>{r.note}</td><td>{r.op}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function AnalyticsPanel() {
  const a = AQUA_DATA.ANALYTICS;
  const items = [
    { key: 'survival', label: L.survival, value: a.survival.value, unit: a.survival.unit, delta: a.survival.delta, trend: a.survival.trend, color: 'oklch(0.74 0.14 165)' },
    { key: 'growth',   label: L.growth,   value: a.growth.value,   unit: a.growth.unit,   delta: a.growth.delta,   trend: a.growth.trend,   color: 'oklch(0.72 0.13 225)' },
    { key: 'fcr',      label: L.fcr,      value: a.fcr.value,      unit: a.fcr.unit,      delta: a.fcr.delta,      trend: a.fcr.trend,      color: 'oklch(0.78 0.13 78)' },
    { key: 'biomass',  label: L.totalBio, value: a.biomass.value,  unit: a.biomass.unit,  delta: a.biomass.delta,  trend: a.biomass.trend,  color: 'oklch(0.72 0.13 225)' },
  ];
  return (
    <section className="panel analytics-area">
      <div className="panel-head">
        <span className="panel-title">分析 <span style={{ color: 'var(--fg-3)' }}>· ANALYTICS · 7d</span></span>
        <div className="panel-actions">
          <div className="seg">
            <button>24h</button>
            <button className="active">7d</button>
            <button>30d</button>
          </div>
        </div>
      </div>
      <div className="kpi-grid">
        {items.map(it => (
          <div key={it.key} className="kpi">
            <div className="kpi-head">
              <span className="kpi-label">{it.label.zh} · {it.label.en}</span>
              <span className="kpi-delta">{it.delta}</span>
            </div>
            <div className="kpi-value">{it.value}<span className="unit">{it.unit}</span></div>
            <Spark values={it.trend} color={it.color} />
            <div className="kpi-meta"><span>7天前</span><span>今日</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

window.LogsPanel = LogsPanel;
window.AnalyticsPanel = AnalyticsPanel;

/* ============================================================
   ManualLogsPage ─ KLK v0.1 first slice
   ─ 4 log types (water / feeding / mortality / operation)
   ─ Per-tab entry form + live list
   ─ Reads staff from SettingsStore, permission-aware
   ─ Subscribes to LogStore + SettingsStore for live updates
   ============================================================ */

const { useEffect: _useEffectML, useMemo: _useMemoML } = React;
const _useStateML = React.useState;

function _useStoreVersion(stores) {
  const [v, setV] = _useStateML(0);
  _useEffectML(() => {
    const unsubs = (stores || []).map(s =>
      s && typeof s.subscribe === 'function' ? s.subscribe(() => setV(x => x + 1)) : null
    );
    return () => unsubs.forEach(u => u && u());
  }, []);
  return v;
}

function _toLocalInput(d) {
  d = d || new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
function _fromLocalInput(s) {
  return s ? new Date(s).toISOString() : null;
}
function _relTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return '剛剛';
  const m = Math.floor(diff / 60000);
  if (m < 1) return '剛剛';
  if (m < 60) return m + ' 分鐘前';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' 小時前';
  return Math.floor(h / 24) + ' 天前';
}
function _fmtLocal(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate())
    + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function SourceBadge({ source }) {
  const map = {
    manual:   { label:'人工',   color:'var(--accent)' },
    imported: { label:'匯入',   color:'var(--fg-1)' },
    device:   { label:'設備',   color:'var(--ok)' },
  };
  const m = map[source] || { label: source, color:'var(--fg-0)' };
  return (
    <span style={{
      display:'inline-block', padding:'2px 8px', fontSize:11,
      border:'1px solid ' + m.color, color: m.color,
      fontFamily:'var(--font-sans)', fontWeight:700,
    }}>{m.label}</span>
  );
}

const _MLTabs = [
  { id:'water',      zh:'水質',    en:'Water Quality' },
  { id:'feeding',    zh:'餵食',    en:'Feeding' },
  { id:'mortality',  zh:'死亡',    en:'Mortality' },
  { id:'operation',  zh:'操作',    en:'Operation' },
  { id:'fish_count', zh:'魚數盤點', en:'Fish Count' },
];

// Fallback constants used only if SettingsStore is unavailable
const _ACTIONS_FALLBACK = ['換水 Water change','清池 Tank clean','移池 Transfer','加氧 Aeration','降溫 Cooling','器材維護 Maintenance','巡查 Walk-through','其他 Other'];

// Stage-name map for tank label formatting
const _STAGE_ZH = { INC:'孵化槽', NUR:'小魚池', JUV:'中魚池', GRO:'大魚池', BRO:'親魚池' };
const _SHIFT_ZH = { day:'日班', mid:'中班', night:'夜班', flex:'彈性' };

// Format tank as 「小魚池1（A1）· 700 尾 · 估算」
function _fmtTankLabel(tank, allTanks) {
  const stageZh = _STAGE_ZH[tank.stage] || tank.stageZh || tank.stage;
  const sameStage = allTanks.filter(t => t.stage === tank.stage);
  const idx = sameStage.findIndex(t => t.id === tank.id) + 1;
  const cnt = tank.currentFishCount != null ? tank.currentFishCount : (tank.count || 0);
  const stat = tank.countStatus === 'actual' ? '實際'
            : tank.countStatus === 'estimated' ? '估算'
            : tank.countStatus === 'pending' ? '待啟用' : '';
  return stageZh + idx + '（' + tank.id + '）· ' + cnt.toLocaleString() + ' 尾'
       + (stat ? ' · ' + stat : '');
}

// Format staff as 「管理員 王經理」 / 「現場人員 1 · 金角（日班）」
function _fmtStaffLabel(staff, allStaff) {
  if (!staff) return '—';
  if (staff.role === 'admin') return '管理員 ' + staff.name;
  if (staff.role === 'operator') {
    const shiftRank = { day:1, mid:2, night:3, flex:4 };
    const ops = allStaff
      .filter(s => s.role === 'operator' && s.enabled)
      .sort((a, b) => (shiftRank[a.shift] || 99) - (shiftRank[b.shift] || 99));
    const idx = ops.findIndex(s => s.id === staff.id) + 1;
    const sh  = _SHIFT_ZH[staff.shift] || staff.shift;
    return '現場人員 ' + idx + ' · ' + staff.name + (sh ? '（' + sh + '）' : '');
  }
  if (staff.role === 'viewer') return '檢視者 ' + staff.name;
  return staff.name;
}

// ─── Larger, white-text styles for on-site readability ───────
const _inputStyle = {
  width:'100%', background:'var(--bg-1)', color:'var(--fg-0)',
  border:'1px solid var(--line)', padding:'8px 10px', fontSize:16,
  fontFamily:'var(--font-sans)', fontWeight:500,
};
const _labelStyle = {
  display:'block', fontSize:14, color:'var(--fg-0)',
  fontWeight:600, marginBottom:5,
};
const _hintStyle = {
  fontSize:11, color:'var(--fg-1)', marginTop:3, fontStyle:'italic',
};

function _Field({ label, hint, children, span }) {
  return (
    <div style={{ gridColumn: span ? 'span ' + span : 'span 1' }}>
      <label style={_labelStyle}>{label}</label>
      {children}
      {hint ? <div style={_hintStyle}>{hint}</div> : null}
    </div>
  );
}

// ─── Water status calculator (uses Settings.stageStandards) ──
function _evalWaterStatus(metric, valueStr, standards) {
  if (valueStr === '' || valueStr == null || !standards) return null;
  const v = parseFloat(valueStr);
  if (isNaN(v)) return null;
  const slack = ({ temp:0.5, doO:0.5, ph:0.2, nh3:0.05, no2:0.10 })[metric] || 0;
  const range = (lo, hi) => {
    if (v >= lo && v <= hi) return 'ok';
    if (v >= lo - slack && v <= hi + slack) return 'warn';
    return 'danger';
  };
  const min = (m) => {
    if (v >= m) return 'ok';
    if (v >= m - slack) return 'warn';
    return 'danger';
  };
  const max = (m) => {
    if (v <= m) return 'ok';
    if (v <= m + slack) return 'warn';
    return 'danger';
  };
  if (metric === 'temp' && standards.temp)        return range(standards.temp[0], standards.temp[1]);
  if (metric === 'doO'  && standards.doMin != null) return min(standards.doMin);
  if (metric === 'ph'   && standards.ph)          return range(standards.ph[0], standards.ph[1]);
  if (metric === 'nh3'  && standards.nh3Max != null) return max(standards.nh3Max);
  if (metric === 'no2'  && standards.no2Max != null) return max(standards.no2Max);
  return null;
}

function _StatusChip({ status }) {
  if (!status) return null;
  const cfg = ({
    ok:     { color:'var(--ok)',     label:'✔ 正常' },
    warn:   { color:'var(--warn)',   label:'⚠ 警告' },
    danger: { color:'var(--danger)', label:'✗ 危險' },
  })[status];
  return (
    <span style={{
      display:'inline-block', marginTop:6, padding:'3px 10px',
      fontSize:12, fontWeight:700, color: cfg.color,
      border:'1px solid '+cfg.color,
    }}>{cfg.label}</span>
  );
}

// Device-source hint: shown if a device is bound that supports this metric
function _DeviceHint({ tankId, metric }) {
  if (!window._hasDeviceForMetric || !tankId || tankId === '—') return null;
  if (!window._hasDeviceForMetric(tankId, metric)) return null;
  return (
    <div style={{
      marginTop:6, fontSize:11, color:'var(--accent)',
      display:'flex', alignItems:'center', gap:4, fontStyle:'italic',
    }}>
      💡 此數據可由設備自動取得（IoT 待導入）
    </div>
  );
}

// ─── Selected tank info strip (under tank dropdown) ──────────
function _TankInfoStrip({ tank }) {
  if (!tank || tank.id === '—') return null;
  const stageZh = _STAGE_ZH[tank.stage] || tank.stage;
  const cnt = tank.currentFishCount != null ? tank.currentFishCount : (tank.count || 0);
  const latestW = window.LogStore ? window.LogStore.latest('water', tank.id) : null;
  const latestT = latestW && latestW.data ? latestW.data.temp : null;
  const latestDO = latestW && latestW.data ? latestW.data.doO : null;
  const stage = window.SettingsStore ? window.SettingsStore.getStageStandards(tank.stage) : null;
  const tempStatus = _evalWaterStatus('temp', latestT, stage);
  const doStatus   = _evalWaterStatus('doO',  latestDO, stage);

  const overallStatus = (tempStatus === 'danger' || doStatus === 'danger') ? 'danger'
                      : (tempStatus === 'warn'   || doStatus === 'warn')   ? 'warn'
                      : (tempStatus === 'ok'     || doStatus === 'ok')     ? 'ok' : null;
  const overallColor = overallStatus === 'danger' ? 'var(--danger)'
                    : overallStatus === 'warn' ? 'var(--warn)'
                    : overallStatus === 'ok'   ? 'var(--ok)' : 'var(--accent)';
  const overallLabel = tank.countStatus === 'pending' ? '待啟用'
                    : overallStatus === 'danger' ? '異常'
                    : overallStatus === 'warn' ? '警告'
                    : overallStatus === 'ok' ? '正常'
                    : '尚無水質紀錄';

  return (
    <div style={{
      gridColumn:'span 6',
      padding:'12px 16px', background:'var(--bg-2)',
      border:'1px solid var(--accent)', borderLeft:'4px solid '+overallColor,
      display:'grid', gridTemplateColumns:'180px 1fr 1fr 1fr 1fr', gap:14, alignItems:'center',
    }}>
      <div>
        <div style={{ fontSize:12, color:'var(--fg-0)', fontWeight:600 }}>已選池</div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--accent)', marginTop:2 }}>
          {stageZh}（{tank.id}）
        </div>
      </div>
      <div>
        <div style={{ fontSize:12, color:'var(--fg-0)' }}>目前魚數</div>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--accent)', fontFamily:'var(--font-mono)' }}>
          {cnt.toLocaleString()} <span style={{ fontSize:12, color:'var(--fg-0)' }}>尾</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize:12, color:'var(--fg-0)' }}>最新水溫</div>
        <div style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)',
                      color: tempStatus === 'danger' ? 'var(--danger)' : tempStatus === 'warn' ? 'var(--warn)' : 'var(--accent)' }}>
          {latestT != null ? latestT + ' °C' : '—'}
        </div>
      </div>
      <div>
        <div style={{ fontSize:12, color:'var(--fg-0)' }}>最新 DO</div>
        <div style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)',
                      color: doStatus === 'danger' ? 'var(--danger)' : doStatus === 'warn' ? 'var(--warn)' : 'var(--accent)' }}>
          {latestDO != null ? latestDO + ' mg/L' : '—'}
        </div>
      </div>
      <div>
        <div style={{ fontSize:12, color:'var(--fg-0)' }}>狀態</div>
        <div style={{
          fontSize:14, fontWeight:700, marginTop:2,
          padding:'4px 12px', display:'inline-block',
          color: overallColor, border:'1px solid '+overallColor,
        }}>{overallLabel}</div>
      </div>
    </div>
  );
}

// ─── Related events timeline (per-tank cross-type) ───────────
function _RelatedEventsTimeline({ tankId, tanks }) {
  if (!tankId || tankId === '—' || !window.LogStore) return null;
  const events = window.LogStore.list(null, { tankId }).slice(0, 15);
  if (events.length === 0) return null;

  const tank = tanks.find(t => t.id === tankId);
  const stageZh = tank ? (_STAGE_ZH[tank.stage] || tank.stage) : '';

  const typeMeta = {
    water:      { color:'var(--accent)', icon:'💧', label:'水質' },
    feeding:    { color:'var(--ok)',     icon:'🍽', label:'餵食' },
    mortality:  { color:'var(--danger)', icon:'⚠',  label:'死亡' },
    operation:  { color:'var(--warn)',   icon:'🔧', label:'操作' },
    fish_count: { color:'var(--accent)', icon:'#',  label:'盤點' },
  };

  function renderData(e) {
    const d = e.data || {};
    if (e.type === 'water') {
      const parts = [];
      if (d.temp != null) parts.push('T ' + d.temp + '°C');
      if (d.doO  != null) parts.push('DO ' + d.doO);
      if (d.ph   != null) parts.push('pH ' + d.ph);
      if (d.nh3  != null) parts.push('NH₃ ' + d.nh3);
      if (d.no2  != null) parts.push('NO₂ ' + d.no2);
      return parts.join(' · ');
    }
    if (e.type === 'feeding')   return d.feedType + ' · ' + d.kg + ' kg';
    if (e.type === 'mortality') return '死亡 ' + d.count + ' 尾 · ' + d.cause;
    if (e.type === 'operation') return d.action + (d.target ? ' · ' + d.target : '') + (d.result ? ' → ' + d.result : '');
    if (e.type === 'fish_count') return '盤點 ' + (d.currentFishCount || 0) + ' 尾'
                                       + (d.averageLengthCm != null ? ' · 體長 ' + d.averageLengthCm + ' cm' : '');
    return JSON.stringify(d);
  }

  return (
    <div style={{
      borderTop:'1px solid var(--line-soft)',
      padding:'18px 20px',
    }}>
      <div style={{
        fontSize:14, fontWeight:700, color:'var(--fg-0)',
        marginBottom:10, display:'flex', alignItems:'baseline', gap:8,
      }}>
        <span style={{ color:'var(--accent)' }}>📜 關聯事件</span>
        <span style={{ fontSize:12, color:'var(--fg-0)' }}>
          {stageZh}（{tankId}）· 最近 {events.length} 筆
        </span>
      </div>
      <div style={{ position:'relative', paddingLeft:22 }}>
        {/* vertical timeline line */}
        <div style={{
          position:'absolute', left:8, top:6, bottom:6,
          width:2, background:'var(--line)',
        }}></div>
        {events.map(e => {
          const m = typeMeta[e.type] || { color:'var(--fg-0)', icon:'•', label:e.type };
          const isAnomaly = e.data && e.data.isAnomaly;
          return (
            <div key={e.id} style={{ position:'relative', marginBottom:10 }}>
              {/* dot */}
              <span style={{
                position:'absolute', left:-22, top:4,
                width:18, height:18, borderRadius:'50%',
                background: isAnomaly ? 'var(--danger)' : m.color,
                color:'var(--bg-0)', display:'inline-flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:700, lineHeight:1,
              }}>{isAnomaly ? '!' : m.icon}</span>
              <div style={{
                padding:'8px 12px',
                background: isAnomaly ? 'oklch(0.40 0.12 25 / 0.18)' : 'var(--bg-1)',
                border:'1px solid '+(isAnomaly ? 'var(--danger)' : 'var(--line-soft)'),
                borderLeft:'3px solid '+(isAnomaly ? 'var(--danger)' : m.color),
              }}>
                <div style={{ display:'flex', gap:10, alignItems:'baseline' }}>
                  <span style={{
                    fontSize:11, fontWeight:700, color: m.color,
                    padding:'1px 6px', border:'1px solid '+m.color,
                  }}>{m.label}</span>
                  <span style={{ fontSize:13, color:'var(--fg-0)', fontWeight:600 }}>
                    {renderData(e)}
                  </span>
                  {isAnomaly ? <span style={{ fontSize:11, fontWeight:700, color:'var(--danger)' }}>🚩 異常</span> : null}
                  <span style={{ flex:1 }}/>
                  <span style={{ fontSize:11, color:'var(--fg-0)', fontFamily:'var(--font-mono)' }}>
                    {_relTime(e.recordedAt)}
                  </span>
                  <span style={{ fontSize:11, color:'var(--fg-0)' }}>
                    {e.enteredBy ? e.enteredBy.name : '—'}
                  </span>
                  <SourceBadge source={e.source} />
                </div>
                {e.note ? (
                  <div style={{ fontSize:12, color:'var(--fg-0)', marginTop:4, fontStyle:'italic' }}>
                    💬 {e.note}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ManualLogsPage() {
  const [tab, setTab] = _useStateML('water');
  _useStoreVersion([window.SettingsStore, window.LogStore]);

  const tanks       = window.AQUA_DATA.TANKS;
  const currentUser = window.SettingsStore.getCurrentUser();
  const allStaff    = window.SettingsStore.getStaff({ enabled: true });
  const sources     = window.SettingsStore.getDataSources({ enabled: true });

  const canWrite = currentUser
    && window.SettingsStore.canStaffLog(currentUser.id, tab)
    && window.SettingsStore.hasPermission('log:write');

  const list = window.LogStore.list(tab);
  const counts = {
    water:      window.LogStore.count('water'),
    feeding:    window.LogStore.count('feeding'),
    mortality:  window.LogStore.count('mortality'),
    operation:  window.LogStore.count('operation'),
    fish_count: window.LogStore.count('fish_count'),
  };

  function handleExport() {
    const csv = window.LogStore.export(tab);
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g,'-').slice(0,16);
    a.href = url;
    a.download = 'klk_' + tab + '_' + ts + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel" style={{ display:'flex', flexDirection:'column' }}>
      {/* ─── Header (large, white) ─── */}
      <div style={{
        padding:'14px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'center', gap:14,
      }}>
        <span style={{ fontSize:18, fontWeight:700, color:'var(--fg-0)' }}>
          人工紀錄
        </span>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:13,
          color:'var(--fg-0)', fontWeight:600,
          padding:'2px 8px', border:'1px solid var(--accent)', color:'var(--accent)',
        }}>
          {counts.water + counts.feeding + counts.mortality + counts.operation + counts.fish_count} 筆
        </span>
        <span style={{ flex:1 }} />
        <span style={{ fontSize:13, color:'var(--fg-0)' }}>
          目前使用者：
          <span style={{ color:'var(--accent)', fontWeight:700, marginLeft:4 }}>
            {currentUser ? _fmtStaffLabel(currentUser, allStaff) : '未登入'}
          </span>
        </span>
        <button onClick={handleExport} style={{
          padding:'6px 14px', fontSize:14, fontWeight:600,
          background:'var(--bg-1)', color:'var(--fg-0)',
          border:'1px solid var(--accent)', cursor:'pointer',
        }}>📥 匯出 CSV</button>
      </div>

      {/* ─── Tabs (large) ─── */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--line)' }}>
        {_MLTabs.map(t => {
          const isAct = tab === t.id;
          return (
            <div key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'12px 20px', cursor:'pointer',
              borderBottom: isAct ? '3px solid var(--accent)' : '3px solid transparent',
              fontSize:15, fontWeight: isAct ? 700 : 500,
              color: isAct ? 'var(--accent)' : 'var(--fg-0)',
              display:'flex', alignItems:'center', gap:6,
            }}>
              <span>{t.zh}</span>
              <span style={{
                fontFamily:'var(--font-mono)', fontSize:11,
                padding:'1px 6px', border:'1px solid currentColor',
                fontWeight:600,
              }}>{counts[t.id]}</span>
            </div>
          );
        })}
      </div>

      {/* ─── Permission notice ─── */}
      {!canWrite ? (
        <div style={{
          margin:'10px 14px 0', padding:'8px 12px',
          border:'1px solid var(--warn)', borderLeft:'3px solid var(--warn)',
          background:'oklch(0.32 0.06 78 / 0.18)', fontSize:12, color:'var(--fg-1)',
        }}>
          ⚠ <span style={{ fontWeight:600 }}>{currentUser && currentUser.name}</span>
          （{currentUser && currentUser.role}）
          目前沒有「{_MLTabs.find(t => t.id === tab).zh}」的紀錄權限。
          請從 Topbar 切換到具備權限的人員。
        </div>
      ) : null}

      {/* ─── Entry Form ─── */}
      {canWrite ? <ManualEntryForm key={tab + '-' + currentUser.id} type={tab} tanks={tanks} staff={allStaff} sources={sources} defaultStaffId={currentUser.id} /> : null}

      {/* ─── List ─── */}
      <ManualLogList type={tab} list={list} tanks={tanks} />
    </section>
  );
}

function ManualEntryForm({ type, tanks, staff, sources, defaultStaffId }) {
  const [recordedAt, setRecordedAt] = _useStateML(_toLocalInput());
  const [tankId, setTankId]         = _useStateML(tanks[0] ? tanks[0].id : '—');
  const [staffId, setStaffId]       = _useStateML(defaultStaffId);
  const [source, setSource]         = _useStateML('manual');
  const [note, setNote]             = _useStateML('');
  const [error, setError]           = _useStateML(null);
  const [success, setSuccess]       = _useStateML(null);

  // type-specific fields
  const [temp, setTemp] = _useStateML('');
  const [doO, setDoO]   = _useStateML('');
  const [ph, setPh]     = _useStateML('');
  const [nh3, setNh3]   = _useStateML('');
  const [no2, setNo2]   = _useStateML('');

  // Read editable lists from Settings (with fallbacks)
  const SS_local  = window.SettingsStore;
  const feedList  = (SS_local && SS_local.getSettings().feedTypes) || ['Skretting Nutra-2.0','其他'];
  const causeList = (SS_local && SS_local.getSettings().mortalityCauses) || ['未知 Unknown','其他'];

  const [feedType, setFeedType] = _useStateML(feedList[0] || '');
  const [kg, setKg]             = _useStateML('');

  const [count, setCount] = _useStateML('');
  const [cause, setCause] = _useStateML(causeList[0] || '');

  const [action, setAction] = _useStateML(_ACTIONS_FALLBACK[0]);
  const [target, setTarget] = _useStateML('');
  const [result, setResult] = _useStateML('');

  // Mark-as-anomaly toggle (stored inside data.isAnomaly)
  const [isAnomaly, setIsAnomaly] = _useStateML(false);

  // fish_count specific
  const [currentFishCount, setCurrentFishCount] = _useStateML('');
  const [averageLengthCm, setAverageLengthCm]   = _useStateML('');
  const [averageWeightG,  setAverageWeightG]    = _useStateML('');
  const [countMethod,     setCountMethod]       = _useStateML('manual');

  function reset() {
    setRecordedAt(_toLocalInput());
    setTemp(''); setDoO(''); setPh(''); setNh3(''); setNo2('');
    setKg(''); setCount(''); setTarget(''); setResult(''); setNote('');
    setCurrentFishCount(''); setAverageLengthCm(''); setAverageWeightG('');
    setIsAnomaly(false);
  }

  function submit() {
    setError(null); setSuccess(null);
    let data = {};
    try {
      if (type === 'water') {
        if (temp !== '') data.temp = parseFloat(temp);
        if (doO !== '')  data.doO  = parseFloat(doO);
        if (ph !== '')   data.ph   = parseFloat(ph);
        if (nh3 !== '')  data.nh3  = parseFloat(nh3);
        if (no2 !== '')  data.no2  = parseFloat(no2);
        if (Object.keys(data).length === 0) throw new Error('請至少填寫一項水質指標');
      } else if (type === 'feeding') {
        if (kg === '') throw new Error('請輸入飼料重量');
        data = { feedType, kg: parseFloat(kg) };
      } else if (type === 'mortality') {
        if (count === '') throw new Error('請輸入死亡數量');
        data = { count: parseInt(count, 10), cause };
      } else if (type === 'operation') {
        data = { action, target };
        if (result.trim()) data.result = result.trim();
      } else if (type === 'fish_count') {
        if (currentFishCount === '') throw new Error('請輸入目前魚數');
        data = {
          currentFishCount: parseInt(currentFishCount, 10),
          countMethod,
        };
        if (averageLengthCm !== '') data.averageLengthCm = parseFloat(averageLengthCm);
        if (averageWeightG  !== '') data.averageWeightG  = parseFloat(averageWeightG);
      }
      // Mix anomaly flag into freeform data (no schema change)
      if (isAnomaly) data.isAnomaly = true;
      const saved = window.LogStore.add({
        type, tankId,
        recordedAt: _fromLocalInput(recordedAt),
        enteredBy: staffId, source,
        data, note,
      });
      setSuccess('已儲存：' + saved.id);
      reset();
      setTimeout(() => setSuccess(null), 2500);
    } catch (e) {
      setError(e.message);
    }
  }

  const formGrid = {
    display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:14,
    padding:'18px 18px', borderTop:'1px solid var(--line-soft)',
    background:'var(--bg-1)',
  };

  // Type-specific titles for bigger header
  const typeTitle = type === 'water'      ? '新增水質紀錄'
                  : type === 'feeding'    ? '新增餵食紀錄'
                  : type === 'mortality'  ? '新增死亡紀錄'
                  : type === 'operation'  ? '新增操作紀錄'
                  : type === 'fish_count' ? '新增魚數盤點'
                  : '新增紀錄';

  // Grouped tank options (formatted)
  const stageOrder = [
    { id:'INC', label:'孵化槽 Hatch（I1–I7）' },
    { id:'NUR', label:'小魚池 Nursery（A1–A6）' },
    { id:'JUV', label:'中魚池 Juvenile（J1–J2）' },
    { id:'GRO', label:'大魚池 Grow-out（B1–B4）' },
  ];

  // Lookups for live calculations
  const selectedTank = tanks.find(t => t.id === tankId) || null;
  const stageStd     = selectedTank && SS_local
    ? SS_local.getStageStandards(selectedTank.stage) : null;
  const tankCnt      = selectedTank
    ? (selectedTank.currentFishCount != null ? selectedTank.currentFishCount : (selectedTank.count || 0))
    : 0;

  // Formatted current value as g/fish or %
  const gPerFish  = (kg !== '' && tankCnt > 0)
    ? (parseFloat(kg) * 1000 / tankCnt).toFixed(2) : null;
  const mortRate  = (count !== '' && tankCnt > 0)
    ? (parseInt(count, 10) / tankCnt * 100).toFixed(2) : null;

  return (
    <div style={{ borderTop:'1px solid var(--line-soft)' }}>
      <div style={{
        padding:'14px 18px 6px',
        fontSize:18, fontWeight:700, color:'var(--fg-0)',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <span style={{
          width:8, height:18, background:'var(--accent)', display:'inline-block',
        }}></span>
        {typeTitle}
      </div>

      <div style={formGrid}>
        <_Field label="時間" span={2}>
          <input type="datetime-local" value={recordedAt}
                 onChange={e => setRecordedAt(e.target.value)} style={_inputStyle} />
        </_Field>
        <_Field label="魚池" span={2}>
          <select value={tankId} onChange={e => setTankId(e.target.value)} style={_inputStyle}>
            {type === 'operation' ? <option value="—">— 廠級 / 不指定</option> : null}
            {stageOrder.map(stage => {
              const stageTanks = tanks.filter(t => t.stage === stage.id);
              if (stageTanks.length === 0) return null;
              return (
                <optgroup key={stage.id} label={stage.label}>
                  {stageTanks.map(t => (
                    <option key={t.id} value={t.id}>{_fmtTankLabel(t, tanks)}</option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </_Field>
        <_Field label="輸入人員">
          <select value={staffId} onChange={e => setStaffId(e.target.value)} style={_inputStyle}>
            {staff.filter(s => (s.allowedLogTypes || []).indexOf(type) >= 0).map(s => (
              <option key={s.id} value={s.id}>{_fmtStaffLabel(s, staff)}</option>
            ))}
          </select>
        </_Field>
        <_Field label="資料來源">
          <select value={source} onChange={e => setSource(e.target.value)} style={_inputStyle}>
            {sources.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </_Field>

        {/* ─── Selected tank live info strip ─── */}
        <_TankInfoStrip tank={selectedTank} />

        {type === 'water' ? (
          <>
            <_Field label="水溫（°C）" hint="例：16.5">
              <input type="number" step="0.1" value={temp} onChange={e=>setTemp(e.target.value)}
                     placeholder="16.5" style={_inputStyle}/>
              <_StatusChip status={_evalWaterStatus('temp', temp, stageStd)} />
              <_DeviceHint tankId={tankId} metric="temp" />
            </_Field>
            <_Field label="溶氧 DO（mg/L）" hint="例：8.5">
              <input type="number" step="0.1" value={doO} onChange={e=>setDoO(e.target.value)}
                     placeholder="8.5" style={_inputStyle}/>
              <_StatusChip status={_evalWaterStatus('doO', doO, stageStd)} />
              <_DeviceHint tankId={tankId} metric="doO" />
            </_Field>
            <_Field label="pH" hint="例：7.2">
              <input type="number" step="0.01" value={ph} onChange={e=>setPh(e.target.value)}
                     placeholder="7.2" style={_inputStyle}/>
              <_StatusChip status={_evalWaterStatus('ph', ph, stageStd)} />
              <_DeviceHint tankId={tankId} metric="ph" />
            </_Field>
            <_Field label="氨氮 NH₃" hint="例：0.05">
              <input type="number" step="0.01" value={nh3} onChange={e=>setNh3(e.target.value)}
                     placeholder="0.05" style={_inputStyle}/>
              <_StatusChip status={_evalWaterStatus('nh3', nh3, stageStd)} />
              <_DeviceHint tankId={tankId} metric="nh3" />
            </_Field>
            <_Field label="亞硝酸 NO₂" hint="例：0.10">
              <input type="number" step="0.01" value={no2} onChange={e=>setNo2(e.target.value)}
                     placeholder="0.10" style={_inputStyle}/>
              <_StatusChip status={_evalWaterStatus('no2', no2, stageStd)} />
              <_DeviceHint tankId={tankId} metric="no2" />
            </_Field>
          </>
        ) : null}

        {type === 'feeding' ? (
          <>
            <_Field label="飼料種類" hint="新增新項目請至 11 系統設定 → 05 選項管理" span={3}>
              <select value={feedType} onChange={e=>setFeedType(e.target.value)} style={_inputStyle}>
                {feedList.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </_Field>
            <_Field label="餵食量（kg）" hint="例：12.5" span={3}>
              <input type="number" step="0.1" value={kg} onChange={e=>setKg(e.target.value)}
                     placeholder="12.5" style={_inputStyle}/>
              {gPerFish ? (
                <div style={{
                  marginTop:6, padding:'4px 10px', display:'inline-block',
                  fontSize:13, fontWeight:700, color:'var(--accent)',
                  border:'1px solid var(--accent)',
                }}>
                  ≈ {gPerFish} g／尾（依 {tankCnt.toLocaleString()} 尾計算）
                </div>
              ) : null}
            </_Field>
          </>
        ) : null}

        {type === 'mortality' ? (
          <>
            <_Field label="死亡數量（尾）" hint="例：3" span={2}>
              <input type="number" value={count} onChange={e=>setCount(e.target.value)}
                     placeholder="3" style={_inputStyle}/>
              {mortRate ? (() => {
                const r = parseFloat(mortRate);
                const c = r >= 5 ? 'var(--danger)' : r >= 1 ? 'var(--warn)' : 'var(--ok)';
                return (
                  <div style={{
                    marginTop:6, padding:'4px 10px', display:'inline-block',
                    fontSize:13, fontWeight:700, color: c, border:'1px solid '+c,
                  }}>
                    死亡率 {mortRate}%（依 {tankCnt.toLocaleString()} 尾計算）
                  </div>
                );
              })() : null}
            </_Field>
            <_Field label="可能原因" hint="新增新項目請至 11 系統設定 → 05 選項管理" span={3}>
              <select value={cause} onChange={e=>setCause(e.target.value)} style={_inputStyle}>
                {causeList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </_Field>
          </>
        ) : null}

        {type === 'operation' ? (
          <>
            <_Field label="操作動作" span={3}>
              <select value={action} onChange={e=>setAction(e.target.value)} style={_inputStyle}>
                {_ACTIONS_FALLBACK.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </_Field>
            <_Field label="對象（設備 / 區域）" span={2}>
              <input type="text" value={target} onChange={e=>setTarget(e.target.value)}
                     placeholder="例：CHL-01" style={_inputStyle}/>
            </_Field>
            <_Field label="結果 / 前後變化" hint="可寫：DO 從 5.8 → 7.2 / 換水 30%" span={5}>
              <textarea value={result} onChange={e=>setResult(e.target.value)}
                        placeholder="例：啟動曝氣後 DO 由 5.8 mg/L 上升至 7.2 mg/L"
                        style={Object.assign({}, _inputStyle, { minHeight:60, resize:'vertical', fontFamily:'var(--font-sans)' })} />
            </_Field>
          </>
        ) : null}

        {type === 'fish_count' ? (
          <>
            <_Field label="目前魚數（尾）" hint="例：700" span={2}>
              <input type="number" min="0" step="1" value={currentFishCount}
                     onChange={e=>setCurrentFishCount(e.target.value)}
                     placeholder="700" style={_inputStyle}/>
            </_Field>
            <_Field label="平均體長（cm）" hint="可選 · 例：12">
              <input type="number" step="0.1" value={averageLengthCm}
                     onChange={e=>setAverageLengthCm(e.target.value)}
                     placeholder="12" style={_inputStyle}/>
            </_Field>
            <_Field label="平均體重（g）" hint="可選 · 例：80">
              <input type="number" step="0.1" value={averageWeightG}
                     onChange={e=>setAverageWeightG(e.target.value)}
                     placeholder="80" style={_inputStyle}/>
            </_Field>
            <_Field label="盤點方式">
              <select value={countMethod} onChange={e=>setCountMethod(e.target.value)} style={_inputStyle}>
                <option value="manual">人工計數</option>
                <option value="weight">重量推估</option>
                <option value="sample">抽樣外推</option>
                <option value="estimate">目視估算</option>
              </select>
            </_Field>
          </>
        ) : null}

        <_Field label="備註" hint="可選" span={6}>
          <input type="text" value={note} onChange={e=>setNote(e.target.value)}
                 placeholder="（補充說明）" style={_inputStyle}/>
        </_Field>
      </div>

      {/* anomaly + device-source hint row */}
      <div style={{
        padding:'10px 18px', display:'flex', alignItems:'center', gap:14,
        borderTop:'1px solid var(--line-soft)', background:'var(--bg-1)',
        flexWrap:'wrap',
      }}>
        <label style={{
          display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer',
          padding:'6px 14px',
          border:'2px solid '+(isAnomaly ? 'var(--danger)' : 'var(--line)'),
          background: isAnomaly ? 'oklch(0.40 0.12 25 / 0.20)' : 'transparent',
        }}>
          <input type="checkbox" checked={isAnomaly}
                 onChange={e => setIsAnomaly(e.target.checked)}
                 style={{ width:18, height:18, cursor:'pointer' }} />
          <span style={{
            fontSize:14, fontWeight:700,
            color: isAnomaly ? 'var(--danger)' : 'var(--fg-0)',
          }}>🚩 標記為異常事件</span>
        </label>

        {source === 'device' ? (
          <span style={{
            padding:'5px 12px', fontSize:13, color:'var(--ok)',
            border:'1px solid var(--ok)', fontWeight:600,
          }}>📡 此筆將標記為「設備自動」來源</span>
        ) : (
          <span style={{ fontSize:12, color:'var(--fg-0)', fontStyle:'italic' }}>
            ℹ 未來 IoT 上線後，水質可由設備自動填入；列表會顯示來源 badge
          </span>
        )}
      </div>

      {/* status row (large buttons for on-site use) */}
      <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:10,
                    borderTop:'1px solid var(--line-soft)', background:'var(--bg-1)' }}>
        <div style={{ flex:1, fontSize:14, color:'var(--fg-0)' }}>
          {error   ? <span style={{ color:'var(--danger)', fontWeight:700 }}>⚠ {error}</span> : null}
          {success ? <span style={{ color:'var(--ok)', fontWeight:700 }}>✓ {success}</span> : null}
        </div>
        <button onClick={reset} style={{
          padding:'8px 18px', fontSize:14, fontWeight:600,
          background:'var(--bg-2)', color:'var(--fg-0)',
          border:'1px solid var(--line)', cursor:'pointer',
        }}>清空</button>
        <button onClick={submit} style={{
          padding:'8px 24px', fontSize:15, fontWeight:700,
          background: isAnomaly ? 'var(--danger)' : 'var(--accent)',
          color:'var(--bg-0)',
          border:'1px solid '+(isAnomaly ? 'var(--danger)' : 'var(--accent)'),
          cursor:'pointer',
        }}>{isAnomaly ? '🚩 儲存異常事件' : '✓ 儲存紀錄'}</button>
      </div>

      {/* Related events timeline (per selected tank) */}
      <_RelatedEventsTimeline tankId={tankId} tanks={tanks} />
    </div>
  );
}

function ManualLogList({ type, list, tanks }) {
  const allStaff = window.SettingsStore ? window.SettingsStore.getStaff() : [];
  if (!list.length) {
    return (
      <div style={{ padding:'40px 18px', textAlign:'center', color:'var(--fg-0)',
                    fontSize:14 }}>
        尚無紀錄 · NO ENTRIES YET
      </div>
    );
  }

  function valCell(e) {
    const d = e.data || {};
    if (type === 'water') {
      const parts = [];
      if (d.temp != null) parts.push('T ' + d.temp + '°C');
      if (d.doO  != null) parts.push('DO ' + d.doO);
      if (d.ph   != null) parts.push('pH ' + d.ph);
      if (d.nh3  != null) parts.push('NH₃ ' + d.nh3);
      if (d.no2  != null) parts.push('NO₂ ' + d.no2);
      return parts.join(' · ');
    }
    if (type === 'feeding')   return d.feedType + ' · ' + d.kg + ' kg';
    if (type === 'mortality') return d.count + ' 尾 · ' + d.cause;
    if (type === 'operation') return d.action + (d.target ? ' · ' + d.target : '')
                                           + (d.result ? ' → ' + d.result : '');
    if (type === 'fish_count') {
      const parts = ['魚數 ' + (d.currentFishCount != null ? d.currentFishCount.toLocaleString() : '—') + ' 尾'];
      if (d.averageLengthCm != null) parts.push('平均體長 ' + d.averageLengthCm + ' cm');
      if (d.averageWeightG  != null) parts.push('平均體重 ' + d.averageWeightG + ' g');
      if (d.countMethod) parts.push('方式 ' + d.countMethod);
      return parts.join(' · ');
    }
    return JSON.stringify(d);
  }

  function handleDelete(id) {
    if (!window.SettingsStore.hasPermission('*')) {
      alert('只有管理員可以刪除紀錄');
      return;
    }
    if (confirm('確定刪除這筆紀錄？')) window.LogStore.remove(id);
  }

  // Resolve tank label using new format
  const tankLabel = (id) => {
    const t = tanks.find(x => x.id === id);
    if (!t) return id;
    const stageZh = _STAGE_ZH[t.stage] || t.stageZh || t.stage;
    const sameStage = tanks.filter(x => x.stage === t.stage);
    const idx = sameStage.findIndex(x => x.id === id) + 1;
    return stageZh + idx + '（' + id + '）';
  };

  return (
    <div style={{ maxHeight: 480, overflow:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead style={{ position:'sticky', top:0, background:'var(--bg-1)', zIndex:1 }}>
          <tr>
            <th style={_thStyleML}>時間</th>
            <th style={Object.assign({}, _thStyleML, { width:160 })}>魚池</th>
            <th style={_thStyleML}>內容</th>
            <th style={Object.assign({}, _thStyleML, { width:200 })}>輸入人員</th>
            <th style={Object.assign({}, _thStyleML, { width:90, textAlign:'center' })}>來源</th>
            <th style={Object.assign({}, _thStyleML, { width:50, textAlign:'center' })}></th>
          </tr>
        </thead>
        <tbody>
          {list.map(e => {
            const isAnomaly = e.data && e.data.isAnomaly;
            return (
            <tr key={e.id} style={{
              borderBottom:'1px solid var(--line-soft)',
              borderLeft: isAnomaly ? '4px solid var(--danger)' : '4px solid transparent',
              background: isAnomaly ? 'oklch(0.40 0.12 25 / 0.10)' : 'transparent',
            }}>
              <td style={_tdStyleML}>
                <div style={{ fontWeight:600 }}>{_relTime(e.recordedAt)}</div>
                <div style={{ fontSize:11, color:'var(--fg-1)', fontFamily:'var(--font-mono)' }}>
                  {_fmtLocal(e.recordedAt)}
                </div>
              </td>
              <td style={Object.assign({}, _tdStyleML, { color:'var(--fg-0)', fontWeight:600 })}>
                {e.tankId === '—' ? '— 廠級' : tankLabel(e.tankId)}
              </td>
              <td style={Object.assign({}, _tdStyleML, { fontFamily:'var(--font-mono)' })}>
                <div>
                  {isAnomaly ? (
                    <span style={{
                      display:'inline-block', marginRight:6, padding:'1px 8px',
                      fontSize:11, fontWeight:700, color:'var(--danger)',
                      border:'1px solid var(--danger)',
                    }}>🚩 異常</span>
                  ) : null}
                  {valCell(e)}
                </div>
                {e.note ? (
                  <div style={{ color:'var(--fg-0)', fontSize:11, marginTop:3, fontStyle:'italic' }}>
                    💬 {e.note}
                  </div>
                ) : null}
              </td>
              <td style={_tdStyleML}>
                {e.enteredBy ? (() => {
                  const byStaff = allStaff.find(s => s.id === e.enteredBy.staffId);
                  if (byStaff) return _fmtStaffLabel(byStaff, allStaff);
                  // fallback for snapshot of disabled / removed staff
                  return e.enteredBy.role === 'admin' ? '管理員 ' + e.enteredBy.name
                       : e.enteredBy.role === 'operator' ? '現場人員 · ' + e.enteredBy.name
                       : e.enteredBy.name;
                })() : '—'}
              </td>
              <td style={Object.assign({}, _tdStyleML, { textAlign:'center' })}>
                <SourceBadge source={e.source} />
              </td>
              <td style={Object.assign({}, _tdStyleML, { textAlign:'center' })}>
                <button onClick={() => handleDelete(e.id)} style={{
                  padding:'4px 10px', fontSize:13, fontWeight:700,
                  background:'transparent', color:'var(--danger)',
                  border:'1px solid var(--danger)', cursor:'pointer',
                }} title="刪除">✕</button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const _thStyleML = {
  textAlign:'left', padding:'12px 14px', fontSize:13, fontWeight:700,
  color:'var(--fg-0)', borderBottom:'1px solid var(--line)',
};
const _tdStyleML = {
  padding:'12px 14px', fontSize:14, color:'var(--fg-0)',
  verticalAlign:'top',
};

window.ManualLogsPage = ManualLogsPage;
window.SourceBadge = SourceBadge;
