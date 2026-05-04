/* ============================================================
   KLK Mobile Monitoring (v0.1)
   ─ Single-file mobile UI for on-site personnel
   ─ Reads existing stores: AQUA_DATA / SettingsStore / LogStore / AlertEngine
   ─ Writes only via LogStore.add (no schema changes)
   ─ Exposes: window.MonitoringMobile, window.useIsMobile
   ============================================================ */

/* global React */

const _MM_COLORS = {
  ok:        '#22c55e',
  warn:      '#facc15',
  danger:    '#ef4444',
  noData:    '#64748b',
  textMain:  '#ffffff',
  textSub:   '#cbd5e1',
  textHint:  '#94a3b8',
  cardBg:    '#0f172a',
  pageBg:    '#020617',
  divider:   'rgba(255,255,255,0.08)',
  accent:    '#3b82f6',
  dangerBg:  '#7f1d1d',
};

const _MM_STAGE_NAME = { INC:'孵化池', NUR:'小魚池', JUV:'中魚池', GRO:'大魚池', BRO:'親魚池' };

// ─── Mobile detection hook ─────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );
  React.useEffect(() => {
    let raf = 0;
    function onResize() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIsMobile(window.innerWidth < 768));
    }
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, []);
  return isMobile;
}

// ─── Helpers ───────────────────────────────────────────────
function _mmRelTime(iso) {
  if (!iso) return '—';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '剛剛';
  if (m < 60) return m + ' 分鐘前';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' 小時前';
  return Math.floor(h / 24) + ' 天前';
}
function _mmTankLabel(tank, allTanks) {
  if (!tank) return '—';
  const sameStage = allTanks.filter(x => x.stage === tank.stage);
  const idx = sameStage.findIndex(x => x.id === tank.id) + 1;
  const stageZh = _MM_STAGE_NAME[tank.stage] || tank.stage;
  return tank.id + '｜' + stageZh + ' ' + idx;
}
function _mmStatusOf(tank) {
  if (!window.LogStore || !window.SettingsStore) return { status:'noData', color:_MM_COLORS.noData };
  const lc = window.LogStore.latest('water', tank.id);
  if (!lc || !lc.data) return { status:'noData', color:_MM_COLORS.noData };
  const std = window.SettingsStore.getStageStandards(tank.stage);
  if (!std) return { status:'noData', color:_MM_COLORS.noData };
  const d = lc.data;
  let s = 'ok';
  if (d.temp != null && std.temp) {
    if (d.temp < std.temp[0] - 0.5 || d.temp > std.temp[1] + 0.5) s = 'danger';
    else if (d.temp < std.temp[0] || d.temp > std.temp[1])         s = (s === 'danger' ? 'danger' : 'warn');
  }
  if (d.doO != null && std.doMin != null) {
    if (d.doO < std.doMin - 0.5)      s = 'danger';
    else if (d.doO < std.doMin)       s = (s === 'danger' ? 'danger' : 'warn');
  }
  if (d.ph != null && std.ph) {
    if (d.ph < std.ph[0] - 0.2 || d.ph > std.ph[1] + 0.2) s = 'danger';
    else if (d.ph < std.ph[0] || d.ph > std.ph[1])        s = (s === 'danger' ? 'danger' : 'warn');
  }
  return { status: s, color: _MM_COLORS[s], log: lc };
}

// Subscribe helper: triggers re-render on Logs / Settings / Alerts changes
function _useMobileBump() {
  const [, set] = React.useState(0);
  React.useEffect(() => {
    const subs = [];
    if (window.LogStore && window.LogStore.subscribe)
      subs.push(window.LogStore.subscribe(() => set(x => x + 1)));
    if (window.SettingsStore && window.SettingsStore.subscribe)
      subs.push(window.SettingsStore.subscribe(() => set(x => x + 1)));
    if (window.AlertEngine && window.AlertEngine.subscribe)
      subs.push(window.AlertEngine.subscribe(() => set(x => x + 1)));
    // 60s tick for relative times
    const tickId = setInterval(() => set(x => x + 1), 60000);
    return () => { subs.forEach(u => u && u()); clearInterval(tickId); };
  }, []);
}

// ─── Header ────────────────────────────────────────────────
function _MobileHeader() {
  const SS = window.SettingsStore;
  const user = SS ? SS.getCurrentUser() : null;
  const [open, setOpen] = React.useState(false);
  const allStaff = SS ? SS.getStaff({ enabled:true }) : [];

  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    setTimeout(() => document.addEventListener('click', close), 0);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div style={{
      position:'sticky', top:0, zIndex:50,
      background: _MM_COLORS.pageBg, borderBottom: '1px solid ' + _MM_COLORS.divider,
      padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
    }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:11, color: _MM_COLORS.accent, fontWeight:700, letterSpacing:0.10, textTransform:'uppercase' }}>
          KLK · Diamond Creeks
        </div>
        <div style={{ fontSize:20, fontWeight:700, color: _MM_COLORS.textMain, marginTop:2 }}>
          現場監控
        </div>
      </div>
      <div style={{ position:'relative' }}>
        <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }} style={{
          padding:'10px 14px', minHeight:44, fontSize:14, fontWeight:700,
          background:'transparent', color: _MM_COLORS.textMain,
          border:'1px solid ' + _MM_COLORS.divider, borderRadius:8, cursor:'pointer',
          display:'flex', alignItems:'center', gap:6,
        }}>
          <span style={{
            width:24, height:24, borderRadius:'50%', background: _MM_COLORS.accent,
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            fontSize:11, color: _MM_COLORS.cardBg, fontWeight:700,
          }}>{user ? (user.name || '?').slice(-1) : '?'}</span>
          <span>{user ? user.name : '—'}</span>
          <span style={{ fontSize:10 }}>▾</span>
        </button>
        {open ? (
          <div onClick={e => e.stopPropagation()} style={{
            position:'absolute', top:'calc(100% + 6px)', right:0,
            background: _MM_COLORS.cardBg, border: '1px solid ' + _MM_COLORS.divider,
            borderRadius:8, minWidth:200, overflow:'hidden', zIndex:60,
            boxShadow:'0 8px 24px rgba(0,0,0,0.40)',
          }}>
            {allStaff.map(s => (
              <div key={s.id} onClick={() => { SS.setCurrentUser(s.id); setOpen(false); }}
                   style={{
                     padding:'12px 14px', minHeight:44, cursor:'pointer',
                     borderBottom:'1px solid ' + _MM_COLORS.divider,
                     background: user && s.id === user.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                   }}>
                <div style={{ fontSize:14, fontWeight:600, color: _MM_COLORS.textMain }}>{s.name}</div>
                <div style={{ fontSize:11, color: _MM_COLORS.textHint, marginTop:2 }}>
                  {s.role} · {s.shift}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Top Summary (Temp / DO / pH 全場平均) ────────────────
function _MobileSummary() {
  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const accT = [], accD = [], accP = [];
  tanks.forEach(t => {
    const lc = window.LogStore && window.LogStore.latest('water', t.id);
    if (!lc || !lc.data) return;
    if (lc.data.temp != null) accT.push(lc.data.temp);
    if (lc.data.doO  != null) accD.push(lc.data.doO);
    if (lc.data.ph   != null) accP.push(lc.data.ph);
  });
  const avg = (arr, n) => arr.length === 0 ? null : (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(n);

  const items = [
    { label:'全場 Temp', value: avg(accT,1), unit:'°C',   n: accT.length },
    { label:'全場 DO',   value: avg(accD,1), unit:'mg/L', n: accD.length },
    { label:'全場 pH',   value: avg(accP,2), unit:'',     n: accP.length },
  ];

  return (
    <div style={{
      padding:'16px', background: _MM_COLORS.cardBg, borderRadius:12,
      border:'1px solid ' + _MM_COLORS.divider,
      display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12,
    }}>
      {items.map(it => (
        <div key={it.label}>
          <div style={{ fontSize:11, color: _MM_COLORS.textSub, fontWeight:600, textTransform:'uppercase', letterSpacing:0.06 }}>
            {it.label}
          </div>
          <div style={{
            fontSize:22, fontWeight:700, color: it.value == null ? _MM_COLORS.noData : _MM_COLORS.textMain,
            marginTop:4, fontFamily:'var(--font-mono)',
          }}>
            {it.value == null ? '—' : it.value}
            {it.value != null && it.unit ? <span style={{ fontSize:11, color: _MM_COLORS.textSub, marginLeft:3, fontWeight:600 }}>{it.unit}</span> : null}
          </div>
          <div style={{ fontSize:10, color: _MM_COLORS.textHint, marginTop:2 }}>
            {it.n}/{tanks.length} 池
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Critical Alert Section ────────────────────────────────
function _CriticalAlertList({ onAddWaterFor }) {
  if (!window.AlertEngine) return null;
  const all = window.AlertEngine.getActiveAlerts();
  const critical = all.filter(a => a.level === 'critical');
  const warning  = all.filter(a => a.level === 'warning');
  const [showWarn, setShowWarn] = React.useState(false);

  if (all.length === 0) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {critical.length > 0 ? (
        <div>
          <div style={{
            fontSize:14, fontWeight:700, color: _MM_COLORS.danger,
            marginBottom:8, display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{ fontSize:16 }}>🚨</span>
            <span>緊急警報（{critical.length}）</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {critical.map(a => <_CriticalAlertCard key={a.id} alert={a} onAddWaterFor={onAddWaterFor} />)}
          </div>
        </div>
      ) : null}

      {warning.length > 0 ? (
        <div>
          <button onClick={() => setShowWarn(s => !s)} style={{
            width:'100%', minHeight:44, padding:'10px 14px',
            fontSize:13, fontWeight:600, color: _MM_COLORS.warn,
            background:'rgba(250,204,21,0.10)', border:'1px solid ' + _MM_COLORS.warn,
            borderRadius:8, cursor:'pointer', textAlign:'left',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <span>⚠</span>
            <span>警告（{warning.length}）</span>
            <span style={{ marginLeft:'auto', fontSize:11 }}>{showWarn ? '收起 ▴' : '展開 ▾'}</span>
          </button>
          {showWarn ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
              {warning.map(a => <_CriticalAlertCard key={a.id} alert={a} onAddWaterFor={onAddWaterFor} subtle />)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function _CriticalAlertCard({ alert, onAddWaterFor, subtle }) {
  const isWarn = subtle === true;
  const c = isWarn ? _MM_COLORS.warn : _MM_COLORS.danger;
  const bg = isWarn ? 'rgba(250,204,21,0.10)' : _MM_COLORS.dangerBg;
  return (
    <div style={{
      padding:14, background: bg, borderRadius:10,
      border:'1px solid ' + c, borderLeft: '4px solid ' + c,
      display:'flex', flexDirection:'column', gap:10,
    }}>
      <div>
        <div style={{ fontSize:16, fontWeight:700, color: isWarn ? _MM_COLORS.textMain : '#fee2e2' }}>
          {alert.tankLabel}
        </div>
        <div style={{ fontSize:14, fontWeight:600, color: isWarn ? c : '#fff', marginTop:4 }}>
          {alert.title.replace(alert.tankId + ' ', '')}
        </div>
        <div style={{ fontSize:13, color: isWarn ? _MM_COLORS.textSub : '#fecaca', marginTop:4 }}>
          {alert.message}
        </div>
        {alert.action ? (
          <div style={{ fontSize:13, color: isWarn ? _MM_COLORS.textMain : '#fff', marginTop:6, fontWeight:600 }}>
            建議：{alert.action}
          </div>
        ) : null}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => onAddWaterFor && onAddWaterFor(alert.tankId)} style={{
          flex:1, minHeight:44, padding:'10px 14px',
          fontSize:14, fontWeight:700,
          background: isWarn ? _MM_COLORS.warn : '#fff',
          color: isWarn ? '#1f2937' : _MM_COLORS.dangerBg,
          border:'1px solid ' + (isWarn ? _MM_COLORS.warn : '#fff'),
          borderRadius:8, cursor:'pointer',
        }}>立即處理</button>
        <button onClick={() => window.AlertEngine && window.AlertEngine.clearAlert(alert.id)} style={{
          minHeight:44, padding:'10px 18px',
          fontSize:14, fontWeight:700,
          background:'transparent',
          color: isWarn ? c : '#fff',
          border: '2px solid ' + (isWarn ? c : '#fff'),
          borderRadius:8, cursor:'pointer',
        }}>ACK</button>
      </div>
    </div>
  );
}

// ─── Stage Filter Chips ────────────────────────────────────
function _StageFilterChips({ active, onChange }) {
  const chips = [
    { id:'all', label:'全部' },
    { id:'INC', label:'孵化池' },
    { id:'NUR', label:'小魚池' },
    { id:'JUV', label:'中魚池' },
    { id:'GRO', label:'大魚池' },
  ];
  return (
    <div style={{
      display:'flex', gap:8, overflowX:'auto', paddingBottom:4,
      WebkitOverflowScrolling:'touch',
    }}>
      {chips.map(c => {
        const on = c.id === active;
        return (
          <button key={c.id} onClick={() => onChange(c.id)} style={{
            padding:'8px 16px', minHeight:40, fontSize:14, fontWeight:on ? 700 : 500,
            background: on ? _MM_COLORS.accent : 'transparent',
            color: on ? '#fff' : _MM_COLORS.textMain,
            border: '1px solid ' + (on ? _MM_COLORS.accent : _MM_COLORS.divider),
            borderRadius:20, cursor:'pointer', whiteSpace:'nowrap', flex:'0 0 auto',
          }}>{c.label}</button>
        );
      })}
    </div>
  );
}

// ─── Mobile Tank Card (single column, expandable) ──────────
function _MobileTankCard({ tank, allTanks, onAddWaterFor }) {
  const [expanded, setExpanded] = React.useState(false);
  const stat = _mmStatusOf(tank);
  const log = stat.log;
  const wd = log ? log.data : null;
  const std = window.SettingsStore ? window.SettingsStore.getStageStandards(tank.stage) : null;

  const STATUS_LABEL = { ok:'正常', warn:'警告', danger:'異常', noData:'無資料' };
  const tankLabel = _mmTankLabel(tank, allTanks);

  const cTemp = wd && wd.temp != null ? wd.temp : null;
  const cDoO  = wd && wd.doO  != null ? wd.doO  : null;
  const cPh   = wd && wd.ph   != null ? wd.ph   : null;

  // Per-metric color (DO < threshold → red per spec)
  const doColor = (cDoO == null || !std || std.doMin == null) ? _MM_COLORS.textMain
                : cDoO < std.doMin - 0.5 ? _MM_COLORS.danger
                : cDoO < std.doMin       ? _MM_COLORS.warn : _MM_COLORS.textMain;
  const tempColor = (cTemp == null || !std || !std.temp) ? _MM_COLORS.textMain
                : (cTemp < std.temp[0] - 0.5 || cTemp > std.temp[1] + 0.5) ? _MM_COLORS.danger
                : (cTemp < std.temp[0] || cTemp > std.temp[1]) ? _MM_COLORS.warn : _MM_COLORS.textMain;
  const phColor = (cPh == null || !std || !std.ph) ? _MM_COLORS.textMain
                : (cPh < std.ph[0] - 0.2 || cPh > std.ph[1] + 0.2) ? _MM_COLORS.danger
                : (cPh < std.ph[0] || cPh > std.ph[1]) ? _MM_COLORS.warn : _MM_COLORS.textMain;

  return (
    <div style={{
      background: _MM_COLORS.cardBg, borderRadius:12,
      border:'1px solid ' + _MM_COLORS.divider,
      borderLeft: stat.status === 'danger' || stat.status === 'warn'
        ? '4px solid ' + stat.color : '1px solid ' + _MM_COLORS.divider,
      overflow:'hidden',
    }}>
      <div onClick={() => setExpanded(e => !e)} style={{
        padding:14, cursor:'pointer', minHeight:44,
        display:'flex', flexDirection:'column', gap:10,
      }}>
        {/* Title row */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:700, color: _MM_COLORS.textMain }}>
              {tankLabel}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background: stat.color }}></span>
              <span style={{ fontSize:13, fontWeight:600, color: stat.color }}>
                {STATUS_LABEL[stat.status]}
              </span>
              {log ? (
                <span style={{ fontSize:11, color: _MM_COLORS.textHint, marginLeft:'auto' }}>
                  {_mmRelTime(log.recordedAt)}
                </span>
              ) : null}
            </div>
          </div>
          <span style={{ fontSize:14, color: _MM_COLORS.textHint }}>{expanded ? '▴' : '▾'}</span>
        </div>

        {/* Metrics */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10,
          paddingTop:10, borderTop: '1px solid ' + _MM_COLORS.divider,
        }}>
          <_MMMetric label="Temp" value={cTemp} unit="°C"   color={tempColor} fixed={1} />
          <_MMMetric label="DO"   value={cDoO}  unit="mg/L" color={doColor}   fixed={1} />
          <_MMMetric label="pH"   value={cPh}   unit=""     color={phColor}   fixed={2} />
        </div>
      </div>

      {/* Expanded detail + 「補登水質」 */}
      {expanded ? (
        <div style={{
          padding:14, background:'rgba(255,255,255,0.03)',
          borderTop:'1px solid ' + _MM_COLORS.divider,
        }}>
          <div style={{ fontSize:13, color: _MM_COLORS.textSub, marginBottom:10 }}>
            標準範圍（{_MM_STAGE_NAME[tank.stage] || tank.stage}）
          </div>
          {std ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, fontSize:13, color: _MM_COLORS.textMain }}>
              <div>
                <div style={{ fontSize:11, color: _MM_COLORS.textHint }}>Temp</div>
                <div style={{ fontWeight:700 }}>{std.temp ? std.temp[0]+'–'+std.temp[1]+'°C' : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color: _MM_COLORS.textHint }}>DO</div>
                <div style={{ fontWeight:700 }}>{std.doMin != null ? '≥ ' + std.doMin : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color: _MM_COLORS.textHint }}>pH</div>
                <div style={{ fontWeight:700 }}>{std.ph ? std.ph[0]+'–'+std.ph[1] : '—'}</div>
              </div>
            </div>
          ) : null}
          <button onClick={(e) => { e.stopPropagation(); onAddWaterFor && onAddWaterFor(tank.id); }} style={{
            marginTop:14, width:'100%', minHeight:48, padding:'12px 16px',
            fontSize:15, fontWeight:700,
            background: _MM_COLORS.accent, color:'#fff',
            border:'none', borderRadius:8, cursor:'pointer',
          }}>＋ 補登水質紀錄</button>
        </div>
      ) : null}
    </div>
  );
}

function _MMMetric({ label, value, unit, color, fixed }) {
  const noData = value == null;
  return (
    <div>
      <div style={{
        fontSize:11, fontWeight:600, color: _MM_COLORS.textSub,
        textTransform:'uppercase', letterSpacing:0.06,
      }}>{label}</div>
      <div style={{
        fontSize:18, fontWeight:700, marginTop:3,
        color: noData ? _MM_COLORS.noData : color,
        fontFamily:'var(--font-mono)',
      }}>
        {noData ? '—' : value.toFixed(fixed != null ? fixed : 1)}
        {!noData && unit ? <span style={{ fontSize:11, color: _MM_COLORS.textSub, marginLeft:2, fontWeight:600 }}>{unit}</span> : null}
      </div>
    </div>
  );
}

// ─── FAB (bottom-right floating button) ────────────────────
function _MobileFAB({ onClick }) {
  return (
    <button onClick={onClick} style={{
      position:'fixed', bottom:20, right:16, zIndex:80,
      width:60, height:60, borderRadius:'50%',
      background: _MM_COLORS.accent, color:'#fff',
      border:'none', cursor:'pointer',
      fontSize:28, fontWeight:700,
      boxShadow:'0 6px 16px rgba(59,130,246,0.50)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }} title="新增水質紀錄">＋</button>
  );
}

// ─── Add Water Sheet (bottom modal) ────────────────────────
function _AddWaterSheet({ open, onClose, tanks, presetTankId }) {
  const SS = window.SettingsStore;
  const allStaff = SS ? SS.getStaff({ enabled:true, canLog:'water' }) : [];
  const currentUser = SS ? SS.getCurrentUser() : null;

  const [tankId, setTankId] = React.useState(presetTankId || (tanks[0] && tanks[0].id) || '');
  const [temp, setTemp] = React.useState('');
  const [doO, setDoO] = React.useState('');
  const [ph, setPh] = React.useState('');
  const [staffId, setStaffId] = React.useState((currentUser && currentUser.id) || (allStaff[0] && allStaff[0].id) || '');
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);

  // Reset state when sheet opens with a new presetTankId
  React.useEffect(() => {
    if (open) {
      setTankId(presetTankId || (tanks[0] && tanks[0].id) || '');
      setTemp(''); setDoO(''); setPh('');
      setStaffId((currentUser && currentUser.id) || (allStaff[0] && allStaff[0].id) || '');
      setError(null); setSuccess(null);
    }
    // eslint-disable-next-line
  }, [open, presetTankId]);

  if (!open) return null;

  function submit() {
    setError(null);
    const data = {};
    if (temp !== '') data.temp = parseFloat(temp);
    if (doO  !== '') data.doO  = parseFloat(doO);
    if (ph   !== '') data.ph   = parseFloat(ph);
    if (Object.keys(data).length === 0) { setError('請至少填一項水質指標'); return; }
    if (!tankId) { setError('請選擇魚池'); return; }
    if (!staffId) { setError('請選擇輸入人員'); return; }
    try {
      window.LogStore.add({
        type:'water', tankId,
        recordedAt: new Date().toISOString(),
        enteredBy: staffId, source:'manual',
        data, note:'手機 mobile 補登',
      });
      setSuccess('✓ 已儲存');
      setTimeout(() => { onClose(); }, 700);
    } catch (e) { setError(e.message); }
  }

  // Group tanks by stage for select
  const stageOrder = [
    { id:'INC', label:'孵化池 Hatch (I1–I7)' },
    { id:'NUR', label:'小魚池 Nursery (A1–A6)' },
    { id:'JUV', label:'中魚池 Juvenile (J1–J2)' },
    { id:'GRO', label:'大魚池 Grow-out (B1–B4)' },
  ];

  const inputStyle = {
    width:'100%', minHeight:48, padding:'12px 14px', fontSize:16,
    background: _MM_COLORS.cardBg, color: _MM_COLORS.textMain,
    border:'1px solid ' + _MM_COLORS.divider, borderRadius:8,
    fontFamily:'var(--font-sans)',
    boxSizing:'border-box',
  };
  const labelStyle = { display:'block', fontSize:14, fontWeight:600, color: _MM_COLORS.textMain, marginBottom:6 };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
        zIndex:90,
      }}></div>

      {/* Sheet */}
      <div style={{
        position:'fixed', left:0, right:0, bottom:0, zIndex:100,
        background: _MM_COLORS.pageBg,
        borderTop:'1px solid ' + _MM_COLORS.divider,
        borderRadius:'16px 16px 0 0',
        maxHeight:'92vh', overflowY:'auto',
        padding:'18px 16px 24px',
        display:'flex', flexDirection:'column', gap:14,
      }}>
        {/* Drag handle */}
        <div style={{
          width:40, height:4, background: _MM_COLORS.textHint, borderRadius:2,
          margin:'0 auto 6px',
        }}></div>

        <div style={{ display:'flex', alignItems:'center' }}>
          <span style={{ fontSize:20, fontWeight:700, color: _MM_COLORS.textMain, flex:1 }}>
            新增水質紀錄
          </span>
          <button onClick={onClose} style={{
            minHeight:44, padding:'8px 16px', fontSize:14,
            background:'transparent', color: _MM_COLORS.textMain,
            border:'1px solid ' + _MM_COLORS.divider, borderRadius:8, cursor:'pointer',
          }}>取消</button>
        </div>

        <div>
          <label style={labelStyle}>魚池</label>
          <select value={tankId} onChange={e => setTankId(e.target.value)} style={inputStyle}>
            {stageOrder.map(s => {
              const stageTanks = tanks.filter(t => t.stage === s.id);
              if (stageTanks.length === 0) return null;
              return (
                <optgroup key={s.id} label={s.label}>
                  {stageTanks.map(t => {
                    const sameStage = tanks.filter(x => x.stage === t.stage);
                    const idx = sameStage.findIndex(x => x.id === t.id) + 1;
                    return <option key={t.id} value={t.id}>
                      {(_MM_STAGE_NAME[t.stage] || t.stage) + idx}（{t.id}）
                    </option>;
                  })}
                </optgroup>
              );
            })}
          </select>
        </div>

        <div>
          <label style={labelStyle}>輸入人員</label>
          <select value={staffId} onChange={e => setStaffId(e.target.value)} style={inputStyle}>
            {allStaff.map(s => (
              <option key={s.id} value={s.id}>
                {s.role === 'admin' ? '管理員' : s.role === 'operator' ? '現場人員' : s.role} · {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>水溫（°C）</label>
          <input type="number" inputMode="decimal" step="0.1" value={temp}
                 onChange={e => setTemp(e.target.value)} placeholder="例：16.5" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>溶氧 DO（mg/L）</label>
          <input type="number" inputMode="decimal" step="0.1" value={doO}
                 onChange={e => setDoO(e.target.value)} placeholder="例：8.5" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>pH</label>
          <input type="number" inputMode="decimal" step="0.01" value={ph}
                 onChange={e => setPh(e.target.value)} placeholder="例：7.2" style={inputStyle} />
        </div>

        {error ? (
          <div style={{ padding:12, background:'rgba(239,68,68,0.10)', border:'1px solid '+_MM_COLORS.danger, borderRadius:8, color: _MM_COLORS.danger, fontSize:14, fontWeight:600 }}>
            ⚠ {error}
          </div>
        ) : null}
        {success ? (
          <div style={{ padding:12, background:'rgba(34,197,94,0.10)', border:'1px solid '+_MM_COLORS.ok, borderRadius:8, color: _MM_COLORS.ok, fontSize:15, fontWeight:700 }}>
            {success}
          </div>
        ) : null}

        <button onClick={submit} style={{
          minHeight:52, padding:'14px 16px', fontSize:16, fontWeight:700,
          background: _MM_COLORS.accent, color:'#fff',
          border:'none', borderRadius:10, cursor:'pointer',
          marginTop:6,
        }}>儲存紀錄</button>
      </div>
    </>
  );
}

/* ============================================================
   MonitoringMobile — main component
   ============================================================ */
function MonitoringMobile() {
  _useMobileBump();
  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const [stageFilter, setStageFilter] = React.useState('all');
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [presetTank, setPresetTank] = React.useState(null);

  const filtered = stageFilter === 'all'
    ? tanks
    : tanks.filter(t => t.stage === stageFilter);

  // Sort: danger first, then warn, then noData, then ok
  const sortKey = (t) => {
    const s = _mmStatusOf(t).status;
    return s === 'danger' ? 0 : s === 'warn' ? 1 : s === 'noData' ? 2 : 3;
  };
  const sorted = filtered.slice().sort((a, b) => sortKey(a) - sortKey(b));

  function openAddWater(tankId) {
    setPresetTank(tankId || null);
    setSheetOpen(true);
  }

  return (
    <div style={{
      minHeight:'100vh', background: _MM_COLORS.pageBg,
      color: _MM_COLORS.textMain,
      fontFamily:'var(--font-sans, system-ui, -apple-system, sans-serif)',
      paddingBottom:100,  // leave room for FAB
    }}>
      <_MobileHeader />

      <div style={{
        padding:16,
        display:'flex', flexDirection:'column', gap:12,
      }}>
        {/* ① 全場 Summary */}
        <_MobileSummary />

        {/* ② Critical Alerts */}
        <_CriticalAlertList onAddWaterFor={openAddWater} />

        {/* Stage filter */}
        <div style={{ marginTop:4 }}>
          <_StageFilterChips active={stageFilter} onChange={setStageFilter} />
        </div>

        {/* ③ Tank list (single column) */}
        <div style={{ display:'flex', alignItems:'center', marginTop:4 }}>
          <span style={{ fontSize:18, fontWeight:700, color: _MM_COLORS.textMain }}>
            魚池
          </span>
          <span style={{ fontSize:13, color: _MM_COLORS.textHint, marginLeft:8 }}>
            {sorted.length} 池 · 點擊展開詳情
          </span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {sorted.length === 0 ? (
            <div style={{ padding:30, textAlign:'center', color: _MM_COLORS.textHint, fontSize:14 }}>
              此分類無池槽
            </div>
          ) : sorted.map(t => (
            <_MobileTankCard key={t.id} tank={t} allTanks={tanks} onAddWaterFor={openAddWater} />
          ))}
        </div>
      </div>

      {/* ④ FAB */}
      <_MobileFAB onClick={() => openAddWater(null)} />

      {/* Add water sheet */}
      <_AddWaterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tanks={tanks}
        presetTankId={presetTank}
      />
    </div>
  );
}

window.MonitoringMobile = MonitoringMobile;
window.useIsMobile = useIsMobile;
