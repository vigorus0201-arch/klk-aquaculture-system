/* global React, AQUA_DATA, Ic, Bi, L, LineChart */
const { useState: useStateA, useMemo: useMemoA } = React;

const DANGER_BG_TEXT = {
  danger: { zh: '危險', en: 'CRITICAL' },
  warn:   { zh: '警告', en: 'WARNING' },
  info:   { zh: '通知', en: 'NOTICE' },
};

/* ============================================================
   AlertBanner (KLK v0.2 — Critical Banner redesign)
   ─ Height 64px · 3 sections · #7f1d1d deep red bg · 18px desc
   ============================================================ */
function AlertBanner({ alerts, onTank }) {
  const critical = alerts.filter(a => a.sev === 'danger' && !a.ack);
  if (critical.length === 0) return null;
  const top = critical[0];

  const STAGE_NAME = { INC:'孵化池', NUR:'小魚池', JUV:'中魚池', GRO:'大魚池', BRO:'親魚池' };
  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const tank = tanks.find(t => t.id === top.tank);
  let tankLabel = top.tank;
  if (tank) {
    const sameStage = tanks.filter(x => x.stage === tank.stage);
    const idx = sameStage.findIndex(x => x.id === tank.id) + 1;
    tankLabel = top.tank + '｜' + (STAGE_NAME[tank.stage] || tank.stage) + ' ' + idx;
  }

  const titleZh = ({
    'Dissolved Oxygen critical': '溶氧過低',
    'Mortality spike (24h)':     '斃死數異常',
    'Temperature trending high': '水溫過高',
    'pH below safe range':       'pH 偏低',
  })[top.title] || top.title;

  return (
    <div style={{
      height:64, minHeight:64,
      background:'#7f1d1d', color:'#ffffff',
      display:'grid', gridTemplateColumns:'auto 1fr auto',
      alignItems:'center', gap:20, padding:'0 24px',
      borderRadius:8, marginBottom:16,
      boxShadow:'0 2px 8px rgba(127,29,29,0.40)',
    }}>
      {/* LEFT: icon + tank label */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:28, lineHeight:1 }}>🚨</span>
        <span style={{ fontSize:18, fontWeight:700, color:'#ffffff' }}>
          {tankLabel}
        </span>
      </div>

      {/* MIDDLE: problem description (large, prominent) */}
      <div style={{ display:'flex', alignItems:'baseline', gap:14 }}>
        <span style={{ fontSize:18, fontWeight:700, color:'#ffffff' }}>
          {titleZh}
        </span>
        <span style={{ fontSize:14, color:'#fecaca', fontFamily:'var(--font-mono)' }}>
          目前 {top.value} {top.unit} · 閾值 {top.threshold} {top.unit} · {top.age}
        </span>
        {critical.length > 1 ? (
          <span style={{
            fontSize:13, fontWeight:700, color:'#fecaca',
            padding:'2px 10px', border:'1px solid #fecaca',
          }}>+{critical.length - 1} 其他危急</span>
        ) : null}
      </div>

      {/* RIGHT: action buttons */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={() => onTank && onTank(top.tank)} style={{
          padding:'8px 16px', fontSize:14, fontWeight:700,
          background:'#ffffff', color:'#7f1d1d',
          border:'1px solid #ffffff', cursor:'pointer', borderRadius:4,
        }}>檢視 VIEW</button>
        <button style={{
          padding:'8px 16px', fontSize:14, fontWeight:700,
          background:'transparent', color:'#ffffff',
          border:'2px solid #ffffff', cursor:'pointer', borderRadius:4,
        }}>確認 ACK</button>
        <button style={{
          padding:'8px 16px', fontSize:14, fontWeight:700,
          background:'#fecaca', color:'#7f1d1d',
          border:'1px solid #fecaca', cursor:'pointer', borderRadius:4,
        }}>啟動曝氣 ENGAGE</button>
      </div>
    </div>
  );
}

function AlertItem({ a, onTank }) {
  const sevLabel = DANGER_BG_TEXT[a.sev];
  const titleZh = {
    'Dissolved Oxygen critical': '溶氧過低',
    'Mortality spike (24h)': '斃死數異常',
    'Temperature trending high': '水溫上升',
    'pH below safe range': 'pH 偏低',
    'Mortality elevated': '斃死數偏高',
    'Chiller-2 throughput reduced': '冷卻機 #2 流量降低',
  }[a.title] || a.title;
  return (
    <div className={`alert-row ${a.sev}`} onClick={() => onTank(a.tank)}>
      <div className="bar"></div>
      <div className="alert-body">
        <div className="alert-top">
          <span className="alert-sev">{sevLabel.zh} {sevLabel.en}</span>
          <span className="alert-tank">{a.tank}</span>
          <span style={{ color: 'var(--fg-3)' }}>{a.id}</span>
        </div>
        <div className="alert-msg">{titleZh} <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>· {a.title}</span></div>
        <div className="alert-detail">
          <span>{a.metric}: <span className="v">{a.value} {a.unit}</span></span>
          <span>閾 / THRES: <span className="v">{a.threshold}</span></span>
        </div>
        <div className="alert-ack">→ 確認警報 Acknowledge</div>
      </div>
      <div className="alert-time">{a.ts}<br /><span style={{ opacity: 0.7 }}>{a.age}</span></div>
    </div>
  );
}

function AlertPanel({ alerts, onTank }) {
  const [filter, setFilter] = useStateA('all');
  const list = alerts.filter(a => filter === 'all' || a.sev === filter);
  const counts = { danger: alerts.filter(a => a.sev === 'danger').length, warn: alerts.filter(a => a.sev === 'warn').length, info: alerts.filter(a => a.sev === 'info').length };
  return (
    <section className="panel alerts-area">
      <div className="panel-head">
        <span className="panel-title">警報 <span style={{ color: 'var(--fg-3)' }}>· ALERTS</span> <span className="count">{alerts.length}</span></span>
        <div className="panel-actions">
          <div className="seg">
            <button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>全 ALL</button>
            <button className={filter==='danger'?'active':''} onClick={()=>setFilter('danger')} style={{ color: filter==='danger'?'var(--danger)':undefined }}>危急 {counts.danger}</button>
            <button className={filter==='warn'?'active':''} onClick={()=>setFilter('warn')} style={{ color: filter==='warn'?'var(--warn)':undefined }}>警告 {counts.warn}</button>
            <button className={filter==='info'?'active':''} onClick={()=>setFilter('info')}>通知 {counts.info}</button>
          </div>
        </div>
      </div>
      <div className="alert-list" style={{ maxHeight: 480, overflow: 'auto' }}>
        {list.map(a => <AlertItem key={a.id} a={a} onTank={onTank} />)}
        {list.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>無警報 NO ALERTS</div>
        ) : null}
      </div>
    </section>
  );
}

window.AlertBanner = AlertBanner;
window.AlertPanel = AlertPanel;
