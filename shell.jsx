/* global React, AQUA_DATA, Ic, Bi, L */
const { useState: useStateS, useEffect: useEffectS } = React;

// Subscribe to SettingsStore so Sidebar/Topbar re-render on user switch
function _useSettingsVersion() {
  const [v, setV] = useStateS(0);
  useEffectS(() => {
    if (!window.SettingsStore) return;
    return window.SettingsStore.subscribe(() => setV(x => x + 1));
  }, []);
  return v;
}

const NAV_SECTIONS = [
  {
    label: '養殖系統 PLATFORM',
    items: [
      { id: 'overview',    num: '01', icon: 'home',  zh: '系統總覽',  en: 'Overview' },
      { id: 'environment', num: '02', icon: 'gear',  zh: '環境與設備', en: 'Environment' },
      { id: 'workflow',    num: '03', icon: 'fish',  zh: '養殖流程',  en: 'Workflow' },
      { id: 'devices',     num: '04', icon: 'pulse', zh: '設備管理',  en: 'Devices', badge: 3 },
    ],
  },
  {
    label: '營運 OPERATIONS',
    items: [
      { id: 'monitoring',  num: '05', icon: 'chart', zh: '監控系統',  en: 'Monitoring', badge: 5, expandable: true },
      { id: 'analytics',   num: '06', icon: 'pie',   zh: '數據分析',  en: 'Analytics' },
      { id: 'reports',     num: '07', icon: 'export',zh: '報表',     en: 'Reports' },
      { id: 'manual-logs', num: '08', icon: 'log',   zh: '人工紀錄',  en: 'Manual Logs', badge: 'NEW' },
      { id: 'settings',    num: '09', icon: 'lock',  zh: '系統設定',  en: 'Settings' },
    ],
  },
];

const MONITORING_SUBS = [
  { id: 'all',        zh: '魚池總覽', en: 'Tank Overview' },
  { id: 'incubation', zh: '孵化池',   en: 'Incubation' },
  { id: 'nursery',    zh: '小魚池',   en: 'Nursery' },
  { id: 'juvenile',   zh: '中型池',   en: 'Juvenile' },
  { id: 'growout',    zh: '大型池',   en: 'Grow-out' },
];

function UserSwitcherFoot() {
  _useSettingsVersion();
  const [open, setOpen] = useStateS(false);
  const SS = window.SettingsStore;
  const current = SS ? SS.getCurrentUser() : null;
  const all     = SS ? SS.getStaff({ enabled: true }) : [];

  // close on outside click
  useEffectS(() => {
    if (!open) return;
    const onDoc = () => setOpen(false);
    setTimeout(() => document.addEventListener('click', onDoc), 0);
    return () => document.removeEventListener('click', onDoc);
  }, [open]);

  const initials = current ? (current.name || '?').slice(-2) : '?';
  const roleColor = current && current.role === 'admin' ? 'var(--accent)'
                  : current && current.role === 'operator' ? 'var(--ok)'
                  : 'var(--fg-2)';

  return (
    <div className="nav-foot" style={{ position:'relative', cursor:'pointer' }}
         onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
         title="點擊切換使用者">
      <div className="avatar" style={{ background: roleColor, color: 'var(--bg-0)' }}>{initials}</div>
      <div className="user-meta">
        <span className="name">{current ? current.name : '未登入'} · {current ? current.code : ''}</span>
        <span className="role">
          {current ? current.role : ''} · {current ? current.shift : ''} shift
          <span style={{ color:'var(--accent)', marginLeft:6 }}>切換 ▾</span>
        </span>
      </div>
      {open ? (
        <div onClick={e => e.stopPropagation()} style={{
          position:'absolute', bottom:'100%', left:0, right:0, marginBottom:4,
          background:'var(--bg-2)', border:'1px solid var(--line)',
          maxHeight:280, overflow:'auto', zIndex:200,
        }}>
          <div style={{ padding:'6px 10px', fontFamily:'var(--font-mono)', fontSize:9.5,
                        color:'var(--fg-3)', letterSpacing:0.10, textTransform:'uppercase',
                        borderBottom:'1px solid var(--line-soft)' }}>
            切換使用者 SWITCH USER
          </div>
          {all.map(s => {
            const isCur = current && s.id === current.id;
            const dotCol = s.role === 'admin' ? 'var(--accent)'
                        : s.role === 'operator' ? 'var(--ok)' : 'var(--fg-2)';
            return (
              <div key={s.id} onClick={() => { SS.setCurrentUser(s.id); setOpen(false); }}
                   style={{
                     padding:'8px 10px', cursor:'pointer',
                     background: isCur ? 'var(--bg-3)' : 'transparent',
                     borderLeft: isCur ? '2px solid var(--accent)' : '2px solid transparent',
                   }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background: dotCol }}></span>
                  <span style={{ fontSize:12.5, fontWeight: isCur ? 600 : 400 }}>{s.name}</span>
                  <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-3)' }}>{s.code}</span>
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-2)', marginTop:2, paddingLeft:15 }}>
                  {s.role} · {s.shift} · 可記錄 {(s.allowedLogTypes || []).length} 類
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Sidebar({ active, sub, onSelect, onSubSelect }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"></div>
        <div>
          <div className="brand-name">櫻花鉤吻鮭</div>
          <div className="brand-sub">CS · MALAYSIA · v4.2</div>
        </div>
      </div>
      <div className="brand-tagline">
        <div className="bt-zh">馬來西亞養殖系統</div>
        <div className="bt-en">Cherry Salmon Aquaculture Platform</div>
      </div>
      <div className="nav">
        {NAV_SECTIONS.map(sec => (
          <React.Fragment key={sec.label}>
            <div className="nav-section">{sec.label}</div>
            {sec.items.map(it => {
              const isActive = active === it.id;
              return (
                <React.Fragment key={it.id}>
                  <div
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelect(it.id)}
                  >
                    <span className="nav-num">{it.num}</span>
                    <span className="bi" style={{ lineHeight: 1.0 }}>
                      <span className="zh" style={{ fontSize: 12.5, fontWeight: 500 }}>{it.zh}</span>
                      <span className="en" style={{ fontSize: 9.5, marginTop: 1 }}>{it.en}</span>
                    </span>
                    {it.badge ? <span className="badge">{it.badge}</span> : null}
                  </div>
                  {it.expandable && isActive ? (
                    <div className="nav-sub">
                      {MONITORING_SUBS.map(s => (
                        <div
                          key={s.id}
                          className={`nav-sub-item ${sub === s.id ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); onSubSelect(s.id); }}
                        >
                          <span className="dot-sm"></span>
                          <span className="zh">{s.zh}</span>
                          <span className="en">{s.en}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <UserSwitcherFoot />
    </aside>
  );
}

const PAGE_TITLES = {
  overview:    { zh: '系統總覽',   en: 'System Overview',       crumb: 'OVERVIEW',
                 purposeZh: '養殖場簡介、核心特色與長期監測項目',
                 purposeEn: 'Project intro, key features, and the long-term dataset we capture' },
  environment: { zh: '環境與設備', en: 'Environment & Systems', crumb: 'ENVIRONMENT',
                 purposeZh: '水流系統、理想參數、關鍵設備與現況差距',
                 purposeEn: 'Water flow, ideal params, critical systems, current vs ideal gap analysis' },
  workflow:    { zh: '養殖流程',   en: 'Cultivation Workflow',  crumb: 'WORKFLOW',
                 purposeZh: '14 個月養殖管線、批次與溫度適應計畫',
                 purposeEn: '14-month cultivation pipeline, active batches & temperature adaptation plans' },
  devices:     { zh: '設備管理',   en: 'Device Management',     crumb: 'DEVICES',
                 purposeZh: '感測器、閘道、冷卻機、過濾與備電的設備清單與健康',
                 purposeEn: 'Sensors, gateways, chillers, filtration and power — inventory & health' },
  monitoring:  { zh: '監控系統',   en: 'Real-time Monitoring',  crumb: 'MONITORING',
                 purposeZh: '魚池即時水質、警報與圖表，依成長階段過濾',
                 purposeEn: 'Live tank water quality, alerts & charts, filtered by growth stage' },
  analytics:   { zh: '數據分析',   en: 'Analytics',             crumb: 'ANALYTICS',
                 purposeZh: '長期成長、生存、飼料效率與水質趨勢分析',
                 purposeEn: 'Long-term growth, survival, FCR and water-quality trend analysis' },
  reports:     { zh: '報表',      en: 'Reports',                crumb: 'REPORTS',
                 purposeZh: '產出運轉日誌、實驗摘要與稽核紀錄報表',
                 purposeEn: 'Generate ops logs, experiment summaries and audit-record exports' },
  'manual-logs':{ zh: '人工紀錄', en: 'Manual Logs',           crumb: 'MANUAL LOGS',
                 purposeZh: '現場人員人工輸入水質、餵食、死亡與操作紀錄',
                 purposeEn: 'On-site manual entry of water quality, feeding, mortality and operations' },
  settings:    { zh: '系統設定',   en: 'Settings',              crumb: 'SETTINGS',
                 purposeZh: '警報閾值、使用者權限、感測器校正與資料留存設定',
                 purposeEn: 'Alarm thresholds, user permissions, sensor calibration, data retention' },
};

function Topbar({ active, sub, alertCount, dangerCount }) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const t = PAGE_TITLES[active] || { zh: '', en: '', crumb: '' };
  const subLabel = active === 'monitoring' ? (MONITORING_SUBS.find(s => s.id === sub) || MONITORING_SUBS[0]) : null;
  return (
    <header className="topbar">
      <div className="crumbs">
        <span>櫻鱒場 · CS Project</span><span className="sep">/</span>
        <span>馬來西亞 · 金馬崙 #1</span><span className="sep">/</span>
        <span className="here">{t.crumb}</span>
        {subLabel ? (<><span className="sep">/</span><span className="here" style={{ color: 'var(--accent)' }}>{subLabel.en.toUpperCase()}</span></>) : null}
      </div>
      <div className="status-pills">
        <span className="pill"><span className="dot"></span>感測器 41/42</span>
        <span className="pill"><span className="dot"></span>冷卻機 3/3</span>
        <span className="pill warn"><span className="dot"></span>UV 1/2</span>
        <span className="pill"><span className="dot"></span>閘道 4/5</span>
        <span className="pill warn"><span className="dot"></span>IoT 23/26</span>
      </div>
      <div className="topbar-spacer"></div>
      <div className="topbar-meta">
        <span><span className="label">水源 INTAKE</span>9.4°C</span>
        <span><span className="label">外氣 AMB</span>22.1°C</span>
        <span><span className="label">時間 LOCAL</span>{hh}:{mm} MYT</span>
      </div>
      <button className="icon-btn" title="Search"><Ic name="search" size={14} /></button>
      <button className="icon-btn" title="Alerts"><Ic name="bell" size={14} />{dangerCount > 0 ? <span className="ind"></span> : null}</button>
    </header>
  );
}

function PageHeader({ active, sub }) {
  const t = PAGE_TITLES[active] || { zh: '', en: '' };
  const subLabel = active === 'monitoring' ? (MONITORING_SUBS.find(s => s.id === sub) || MONITORING_SUBS[0]) : null;
  const sectionMeta = NAV_SECTIONS.flatMap(s => s.items).find(it => it.id === active);
  return (
    <div className="page-header">
      <div className="ph-left">
        <div className="ph-num">{sectionMeta ? sectionMeta.num : ''}</div>
        <div>
          <div className="ph-zh">{t.zh}{subLabel ? <span className="ph-sub-zh"> · {subLabel.zh}</span> : null}</div>
          <div className="ph-en">{t.en}{subLabel ? ` · ${subLabel.en}` : ''}</div>
          {t.purposeZh ? (
            <div className="ph-purpose">
              <span className="pp-zh">{t.purposeZh}</span>
              <span className="pp-en">{t.purposeEn}</span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="ph-right">
        <span className="ph-meta-lbl">最後更新 LAST UPDATE</span>
        <span className="ph-meta-val">14:32:08 MYT</span>
        <span className="ph-divider"></span>
        <span className="ph-meta-lbl">同步 SYNC</span>
        <span className="ph-meta-val" style={{ color: 'var(--ok)' }}>● LIVE</span>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.PageHeader = PageHeader;
window.MONITORING_SUBS = MONITORING_SUBS;
