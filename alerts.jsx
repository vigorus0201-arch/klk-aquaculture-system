/* global React, AQUA_DATA, Ic, Bi, L, LineChart */
const { useState: useStateA, useMemo: useMemoA } = React;

const DANGER_BG_TEXT = {
  danger: { zh: '危險', en: 'CRITICAL' },
  warn:   { zh: '警告', en: 'WARNING' },
  info:   { zh: '通知', en: 'NOTICE' },
};

function AlertBanner({ alerts, onTank }) {
  const critical = alerts.filter(a => a.sev === 'danger' && !a.ack);
  if (critical.length === 0) return null;
  const top = critical[0];
  const tank = (window.AQUA_DATA.TANKS || []).find(t => t.id === top.tank);
  const titleZh = {
    'Dissolved Oxygen critical': '溶氧過低 / Low DO',
    'Mortality spike (24h)': '斃死數異常 / Mortality Spike',
    'Temperature trending high': '水溫過高 / High Temp',
    'pH below safe range': 'pH 偏低 / Low pH',
  }[top.title] || top.title;
  return (
    <div className="alert-banner">
      <div className="alert-banner-icon"><Ic name="alert" size={22} /></div>
      <div className="alert-banner-body">
        <div className="alert-banner-title">⚠ 緊急警報 · CRITICAL · {top.id}</div>
        <div className="alert-banner-msg">
          <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>[{top.tank}]</span>{' '}
          {titleZh}
        </div>
        <div className="alert-banner-meta">
          <span><span style={{ color: 'var(--fg-3)' }}>魚池 TANK</span> <span className="v">{top.tank}{tank ? ` · ${tank.stage}` : ''}</span></span>
          <span><span style={{ color: 'var(--fg-3)' }}>異常 ISSUE</span> <span className="v">{top.metric}</span></span>
          <span><span style={{ color: 'var(--fg-3)' }}>當前 NOW</span> <span className="v" style={{ color: 'var(--danger)', fontSize: 14 }}>{top.value} {top.unit}</span></span>
          <span><span style={{ color: 'var(--fg-3)' }}>閾值 THRES</span> <span className="v">{top.threshold} {top.unit}</span></span>
          <span><span style={{ color: 'var(--fg-3)' }}>時間 TIME</span> <span className="v">{top.ts}</span> · <span style={{ color: 'var(--warn)' }}>{top.age}</span></span>
          {critical.length > 1 ? <span style={{ color: 'var(--danger)' }}>+{critical.length - 1} 其他危急 OTHER CRITICAL</span> : null}
        </div>
      </div>
      <div className="alert-banner-actions">
        <button className="btn-mini" onClick={() => onTank(top.tank)}>檢視 {top.tank} VIEW</button>
        <button className="btn-mini btn-danger">啟動緊急曝氣 ENGAGE O₂</button>
        <button className="btn-mini">確認 ACK</button>
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
