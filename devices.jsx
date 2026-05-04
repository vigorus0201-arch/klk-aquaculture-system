/* global React, AQUA_DATA, Ic */
const { useState: useStateDev, useMemo: useMemoDev } = React;

function ProtoBadge({ proto }) {
  const map = {
    'WiFi':   { c: 'oklch(0.72 0.13 225)', t: 'Wi-Fi' },
    'WiFi 6 + BLE': { c: 'oklch(0.72 0.13 225)', t: 'Wi-Fi 6 + BLE' },
    'WiFi 6': { c: 'oklch(0.72 0.13 225)', t: 'Wi-Fi 6' },
    'BLE-GW': { c: 'oklch(0.74 0.13 290)', t: 'BLE GW' },
    'BLE Mesh': { c: 'oklch(0.74 0.13 290)', t: 'BLE Mesh' },
    'MQTT':   { c: 'oklch(0.78 0.13 78)',  t: 'MQTT' },
    'mqtts://': { c: 'oklch(0.78 0.13 78)', t: 'MQTT/TLS' },
    'Manual': { c: 'oklch(0.62 0.01 240)', t: 'Manual' },
    'API':    { c: 'oklch(0.74 0.14 165)', t: 'REST' },
  };
  const m = map[proto] || { c: 'var(--fg-2)', t: proto };
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: 0.06,
      textTransform: 'uppercase', padding: '1px 6px',
      border: `1px solid ${m.c}`, color: m.c,
    }}>{m.t}</span>
  );
}

function StatusDot({ status }) {
  const m = {
    online:   { c: 'var(--ok)',     zh: '在線',   en: 'ONLINE' },
    offline:  { c: 'var(--danger)', zh: '離線',   en: 'OFFLINE' },
    abnormal: { c: 'var(--warn)',   zh: '異常',   en: 'ABNORMAL' },
    stale:    { c: 'var(--warn)',   zh: '無數據', en: 'STALE' },
    degraded: { c: 'var(--warn)',   zh: '降級',   en: 'DEGRADED' },
    manual:   { c: 'var(--fg-2)',   zh: '人工',   en: 'MANUAL' },
  }[status] || { c: 'var(--fg-2)', zh: status, en: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.c, boxShadow: `0 0 5px ${m.c}` }}></span>
      <span style={{ color: m.c }}>{m.zh}</span>
      <span style={{ color: 'var(--fg-3)', letterSpacing: 0.06 }}>{m.en}</span>
    </span>
  );
}

function SignalBars({ value }) {
  if (value == null) return <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>—</span>;
  const bars = [25, 50, 75, 95];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 1, height: 10 }}>
      {bars.map((b, i) => (
        <span key={i} style={{
          width: 3, height: 3 + i * 2,
          background: value >= b ? (value < 50 ? 'var(--warn)' : 'var(--ok)') : 'var(--bg-3)',
        }}></span>
      ))}
      <span style={{ marginLeft: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)' }}>{value}%</span>
    </span>
  );
}

function Battery({ value }) {
  if (value == null) return <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>AC</span>;
  const c = value < 20 ? 'var(--danger)' : value < 40 ? 'var(--warn)' : 'var(--ok)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-1)' }}>
      <span style={{
        position: 'relative', width: 18, height: 9,
        border: '1px solid var(--line)', display: 'inline-block',
      }}>
        <span style={{ position: 'absolute', top: 1, left: 1, bottom: 1, width: `${Math.max(2, (value/100)*14)}px`, background: c }}></span>
        <span style={{ position: 'absolute', right: -3, top: 2, bottom: 2, width: 2, background: 'var(--line)' }}></span>
      </span>
      <span style={{ color: c }}>{value}%</span>
    </span>
  );
}

/* ============================================================
   DeviceMgmtPanel (KLK v0.1) — 6-category view + gap analysis
   Reads SettingsStore.deviceInventory + deviceBindingRules
   ============================================================ */

const _DEV_STAGE_ZH = { INC:'孵化槽', NUR:'小魚池', JUV:'中魚池', GRO:'大魚池', BRO:'親魚池' };

function _devTankLabel(tankId) {
  if (!tankId || tankId === '—') return '— 未綁定';
  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const t = tanks.find(x => x.id === tankId);
  if (!t) return tankId;
  const sameStage = tanks.filter(x => x.stage === t.stage);
  const idx = sameStage.findIndex(x => x.id === tankId) + 1;
  return (_DEV_STAGE_ZH[t.stage] || t.stage) + idx + '（' + tankId + '）';
}

// Category mapping: each device kind → one of 6 categories
const _DEV_CATEGORIES = [
  { id:'multiparam',  zh:'多參數水質儀',     en:'Multiparameter Probes', kinds:['multiparam'] },
  { id:'sensor',      zh:'單項感測器',       en:'Single Sensors',         kinds:['temp_sensor','do_sensor','ph_sensor','nh3_sensor','no2_sensor','temp','do','ph','nh3','no2'] },
  { id:'control',     zh:'控制設備',         en:'Control Equipment',      kinds:['flow_control','lighting','natural_monitor','controller'] },
  { id:'gateway',     zh:'傳輸 / 閘道',      en:'Gateway / Transmission', kinds:['gateway','wifi','ble','mqtt'] },
  { id:'circulation', zh:'循環 / 曝氣 / 冷卻', en:'Circulation / Aeration / Cooling', kinds:['chiller','chiller_link','aerator','ras','pump'] },
  { id:'power',       zh:'電力設備',         en:'Power Equipment',        kinds:['generator','ups','battery','power'] },
];

function _kindToCategory(kind) {
  for (const c of _DEV_CATEGORIES) {
    if (c.kinds.indexOf(kind) >= 0) return c.id;
  }
  return 'sensor';
}

function _statusLabelZh(s) {
  return ({ installed:'已安裝', pending:'待安裝', purchasing:'採購中', maintenance:'維修中', retired:'停用' })[s] || s;
}
function _statusColor(s) {
  return ({ installed:'var(--ok)', pending:'var(--warn)', purchasing:'var(--accent)', maintenance:'var(--warn)', retired:'var(--fg-1)' })[s] || 'var(--fg-1)';
}
function _sourceLabelZh(s) {
  return ({ manual:'人工輸入', device:'設備自動', imported:'匯入資料' })[s] || s;
}

function _useDevicesRev() {
  const [v, setV] = useStateDev(0);
  React.useEffect(() => {
    if (!window.SettingsStore) return;
    return window.SettingsStore.subscribe(() => setV(x => x + 1));
  }, []);
  return v;
}

function DeviceMgmtPanel() {
  _useDevicesRev();
  const [activeCat, setActiveCat] = useStateDev('all');

  const ss = window.SettingsStore ? window.SettingsStore.getSettings() : { deviceInventory:[], deviceBindingRules:{} };
  const inventory = ss.deviceInventory || [];
  const bindings  = ss.deviceBindingRules || {};

  // Counts per category
  const catCounts = {};
  _DEV_CATEGORIES.forEach(c => { catCounts[c.id] = 0; });
  inventory.forEach(d => { const c = _kindToCategory(d.kind); catCounts[c] = (catCounts[c]||0) + 1; });

  // Counts per status
  const statusCounts = {
    installed:  inventory.filter(d => d.inventoryStatus === 'installed').length,
    pending:    inventory.filter(d => d.inventoryStatus === 'pending').length,
    purchasing: inventory.filter(d => d.inventoryStatus === 'purchasing').length,
    maintenance:inventory.filter(d => d.inventoryStatus === 'maintenance').length,
  };

  // Filtered list
  const list = activeCat === 'all'
    ? inventory
    : inventory.filter(d => _kindToCategory(d.kind) === activeCat);

  // Gap analysis: per-tank coverage
  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const gapByTank = tanks.map(t => {
    const cmp = window.compareRequiredDevices ? window.compareRequiredDevices(t.stage, t.id) : null;
    return { tank: t, gap: cmp };
  });
  const tanksWithGap = gapByTank.filter(g => g.gap && g.gap.missingDevices.length > 0);

  return (
    <section className="panel" style={{ padding:0 }}>
      {/* Header */}
      <div style={{
        padding:'14px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'center', gap:14,
      }}>
        <span style={{ fontSize:18, fontWeight:700, color:'var(--fg-0)' }}>設備管理</span>
        <span style={{
          padding:'2px 8px', fontSize:13, fontWeight:600,
          color:'var(--accent)', border:'1px solid var(--accent)', fontFamily:'var(--font-mono)',
        }}>{inventory.length} 台</span>
        <span style={{ flex:1 }} />
        <span style={{ fontSize:13, color:'var(--ok)',     fontWeight:600 }}>已安裝 {statusCounts.installed}</span>
        <span style={{ fontSize:13, color:'var(--warn)',   fontWeight:600 }}>待安裝 {statusCounts.pending}</span>
        <span style={{ fontSize:13, color:'var(--accent)', fontWeight:600 }}>採購中 {statusCounts.purchasing}</span>
        <span style={{ fontSize:13, color:'var(--warn)',   fontWeight:600 }}>維修中 {statusCounts.maintenance}</span>
      </div>

      {/* Category tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--line)' }}>
        <div onClick={() => setActiveCat('all')} style={{
          padding:'12px 18px', cursor:'pointer',
          borderBottom: activeCat === 'all' ? '3px solid var(--accent)' : '3px solid transparent',
          color: activeCat === 'all' ? 'var(--accent)' : 'var(--fg-0)',
          fontWeight: activeCat === 'all' ? 700 : 500, fontSize:14,
        }}>全部 <span style={{ fontFamily:'var(--font-mono)', fontSize:11, marginLeft:4 }}>{inventory.length}</span></div>
        {_DEV_CATEGORIES.map(c => {
          const isAct = activeCat === c.id;
          return (
            <div key={c.id} onClick={() => setActiveCat(c.id)} style={{
              padding:'12px 16px', cursor:'pointer',
              borderBottom: isAct ? '3px solid var(--accent)' : '3px solid transparent',
              color: isAct ? 'var(--accent)' : 'var(--fg-0)',
              fontWeight: isAct ? 700 : 500, fontSize:14,
            }}>
              {c.zh}
              <span style={{ fontFamily:'var(--font-mono)', fontSize:11, marginLeft:4 }}>{catCounts[c.id]}</span>
            </div>
          );
        })}
      </div>

      {/* Device list */}
      <div style={{ padding:'14px 18px' }}>
        {list.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', fontSize:14, color:'var(--fg-0)' }}>
            此類別目前無設備 — 可至 <strong style={{ color:'var(--accent)' }}>11 系統設定 → 06 設備管理</strong> 新增
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:12 }}>
            {list.map(d => <_DeviceCard key={d.id} dev={d} bindings={bindings} />)}
          </div>
        )}
      </div>

      {/* Equipment Gaps Section */}
      <div style={{ borderTop:'1px solid var(--line)', padding:'18px 20px' }}>
        <div style={{
          fontSize:18, fontWeight:700, color:'var(--fg-0)',
          marginBottom:12, display:'flex', alignItems:'center', gap:10,
        }}>
          <span>📊 設備缺口比對</span>
          <span style={{
            fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600,
            padding:'2px 8px',
            color: tanksWithGap.length > 0 ? 'var(--warn)' : 'var(--ok)',
            border:'1px solid '+ (tanksWithGap.length > 0 ? 'var(--warn)' : 'var(--ok)'),
          }}>{tanksWithGap.length} 池有缺口 / {tanks.length} 池</span>
        </div>

        {tanksWithGap.length === 0 ? (
          <div style={{ padding:'14px', color:'var(--ok)', fontSize:14 }}>
            ✓ 所有池槽設備需求皆已滿足
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:10 }}>
            {tanksWithGap.map(g => <_GapCard key={g.tank.id} tank={g.tank} gap={g.gap} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function _DeviceCard({ dev, bindings }) {
  const binding = bindings[dev.id];
  const tankLabel = binding ? _devTankLabel(binding.tankId) : '— 未綁定';
  const metricsText = (dev.supportedMetrics || []).map(m => {
    return ({ temp:'水溫', doO:'DO', ph:'pH', nh3:'NH₃', no2:'NO₂' })[m] || m;
  }).join(' · ') || '—';

  return (
    <div style={{
      padding:'14px 16px', background:'var(--bg-1)',
      border:'1px solid var(--line-soft)',
      borderLeft:'4px solid '+_statusColor(dev.inventoryStatus),
    }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <span style={{ fontSize:15, fontWeight:700, color:'var(--fg-0)' }}>{dev.nameZh}</span>
        <span style={{ flex:1 }} />
        <span style={{
          padding:'2px 8px', fontSize:12, fontWeight:700,
          color: _statusColor(dev.inventoryStatus),
          border:'1px solid '+_statusColor(dev.inventoryStatus),
        }}>{_statusLabelZh(dev.inventoryStatus)}</span>
      </div>
      <div style={{ fontSize:12, color:'var(--fg-0)', marginTop:2 }}>{dev.nameEn}</div>
      <div style={{
        fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent)',
        marginTop:6, fontWeight:600,
      }}>
        {dev.brand}{dev.model ? ' · ' + dev.model : ''}{dev.serialNumber ? ' · SN-' + dev.serialNumber : ''}
      </div>
      <div style={{ marginTop:8, display:'grid', gridTemplateColumns:'70px 1fr', gap:'4px 10px', fontSize:13, color:'var(--fg-0)' }}>
        <span style={{ color:'var(--fg-1)' }}>位置：</span>
        <span style={{ fontWeight:600 }}>{tankLabel}</span>
        <span style={{ color:'var(--fg-1)' }}>用途：</span>
        <span>{metricsText}</span>
        <span style={{ color:'var(--fg-1)' }}>來源：</span>
        <span style={{ fontWeight:600, color: dev.dataSource === 'device' ? 'var(--ok)' : 'var(--accent)' }}>
          {_sourceLabelZh(dev.dataSource)}
        </span>
      </div>
      {dev.note ? (
        <div style={{ fontSize:12, color:'var(--fg-0)', fontStyle:'italic', marginTop:6, paddingTop:6, borderTop:'1px solid var(--line-soft)' }}>
          {dev.note}
        </div>
      ) : null}
    </div>
  );
}

function _GapCard({ tank, gap }) {
  return (
    <div style={{
      padding:'12px 14px', background:'var(--bg-1)',
      border:'1px solid var(--warn)', borderLeft:'4px solid var(--warn)',
    }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <span style={{ fontSize:14, fontWeight:700, color:'var(--fg-0)' }}>
          {_devTankLabel(tank.id)}
        </span>
        <span style={{ flex:1 }} />
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700,
          color: gap.coverageRate >= 0.8 ? 'var(--ok)' : gap.coverageRate >= 0.5 ? 'var(--warn)' : 'var(--danger)',
          padding:'2px 8px', border:'1px solid currentColor',
        }}>覆蓋率 {gap.coverageText}</span>
      </div>
      <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:3 }}>
        {gap.requiredDevices.filter(r => r.required).map(r => (
          <div key={r.type} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700,
              color: r.satisfied ? 'var(--ok)' : 'var(--danger)',
              minWidth:20,
            }}>{r.satisfied ? '✔' : '❌'}</span>
            <span style={{ color:'var(--fg-0)', flex:1 }}>{r.label}</span>
            {r.satisfied && r.satisfiedByName ? (
              <span style={{ fontSize:11, color:'var(--fg-1)', fontStyle:'italic' }}>
                由 {r.satisfiedByName}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {gap.missingDevices.length > 0 ? (
        <div style={{
          marginTop:8, padding:'8px 10px',
          background:'oklch(0.32 0.06 78 / 0.18)',
          border:'1px dashed var(--warn)',
          fontSize:12, color:'var(--fg-0)',
        }}>
          💡 建議採購：{gap.missingDevices.find(m => m.suggested)?.suggested || '對應感測器或多參數監測儀'}
        </div>
      ) : null}
    </div>
  );
}

window.DeviceMgmtPanel = DeviceMgmtPanel;
window.ProtoBadge = ProtoBadge;
window.StatusDot = StatusDot;
window.SignalBars = SignalBars;
window.Battery = Battery;
