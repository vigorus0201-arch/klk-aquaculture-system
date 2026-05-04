/* global React, AQUA_DATA, Ic, Bi, L,
   AlertBanner, AlertPanel, TankGrid, MonitorPanel, LogsPanel, AnalyticsPanel,
   BatchPanel, DeviceMgmtPanel, SciencePanel, ExperimentPanel */

const { useState: useStateP, useEffect: useEffectP } = React;

/* ====================================================================
   SamplingDashboard ─ 全場採樣狀態總覽 (KLK v0.1)
   ─ Reads: window.getLastLogTime / getNextDueTime / isOverdue
            window.SettingsStore.getSamplingFrequency
   ─ Subscribes: LogStore + SettingsStore + 60s tick
   ==================================================================== */
function SamplingDashboard() {
  // Subscribe to data sources
  const [, _bumpD] = useStateP(0);
  useEffectP(() => {
    const unsubs = [];
    if (window.LogStore && window.LogStore.subscribe)
      unsubs.push(window.LogStore.subscribe(() => _bumpD(x => x + 1)));
    if (window.SettingsStore && window.SettingsStore.subscribe)
      unsubs.push(window.SettingsStore.subscribe(() => _bumpD(x => x + 1)));
    return () => unsubs.forEach(u => u && u());
  }, []);
  // 60-second clock tick
  const [tickMs, _setTick] = useStateP(Date.now());
  useEffectP(() => {
    const id = setInterval(() => _setTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const SS    = window.SettingsStore;

  // Per-tank computation
  const rows = tanks.map(t => {
    const freq   = SS && t.stage ? SS.getSamplingFrequency(t.stage) : null;
    const last   = window.getLastLogTime ? window.getLastLogTime(t.id) : null;
    const next   = window.getNextDueTime ? window.getNextDueTime(last, freq) : null;
    const status = window.isOverdue ? window.isOverdue(tickMs, next) : 'never';
    const lateMin = (status === 'overdue' || status === 'due') && next
      ? Math.max(0, (tickMs - new Date(next).getTime()) / 60000) : 0;
    return { tank: t, status, last, next, lateMin, freq };
  });

  // Aggregate counts
  const counts = { ok: 0, due: 0, overdue: 0, never: 0 };
  rows.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
  const pending = counts.due + counts.overdue;
  const total   = tanks.length;

  // Top-3 overdue (descending late time)
  const top3 = rows.filter(r => r.status === 'overdue')
                   .sort((a, b) => b.lateMin - a.lateMin)
                   .slice(0, 3);

  // ─── Responsibility grouping (NEW) ─────────────────────────
  // Resolve responsible staff for a tank: byTank override > byStage > unassigned
  const respFor = (tank) => {
    if (!SS) return { staffId:null, name:'—', shift:'', isUnassigned:true };
    const sr = SS.getSettings().samplingResponsibility || {};
    const r = (sr.byTank && sr.byTank[tank.id]) || (sr.byStage && sr.byStage[tank.stage]);
    if (!r || !r.primary) return { staffId:null, name:'未指派', shift:'', isUnassigned:true };
    const staff = SS.getStaffById(r.primary);
    return {
      staffId: r.primary,
      name:    staff ? staff.name : r.primary,
      shift:   r.shift || (staff && staff.shift) || '',
      role:    staff ? staff.role : '',
      enabled: staff ? staff.enabled : true,
      isUnassigned: false,
    };
  };

  // Group only DUE / OVERDUE tanks by responsible staff
  const respGroups = {};
  rows.forEach(r => {
    if (r.status !== 'due' && r.status !== 'overdue') return;
    const resp = respFor(r.tank);
    const key = resp.staffId || '__unassigned__';
    if (!respGroups[key]) {
      respGroups[key] = {
        staffId: resp.staffId, name: resp.name, shift: resp.shift,
        role: resp.role, enabled: resp.enabled, isUnassigned: resp.isUnassigned,
        due: 0, overdue: 0,
        tanks: [], maxLateMin: 0,
      };
    }
    respGroups[key][r.status] += 1;
    respGroups[key].tanks.push({ id: r.tank.id, status: r.status, lateMin: r.lateMin });
    if (r.lateMin > respGroups[key].maxLateMin) respGroups[key].maxLateMin = r.lateMin;
  });
  const respList = Object.values(respGroups).sort((a, b) => {
    if (b.overdue !== a.overdue) return b.overdue - a.overdue;
    if (b.due     !== a.due)     return b.due - a.due;
    return b.maxLateMin - a.maxLateMin;
  });

  // ─── helpers ───
  const fmtMins = (m) => {
    const x = Math.abs(Math.round(m));
    if (x < 1) return '<1m';
    if (x < 60) return x + 'm';
    const h = Math.floor(x / 60), rem = x % 60;
    return rem > 0 ? h + 'h ' + rem + 'm' : h + 'h';
  };
  const fmtClock = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  };

  const COLORS = {
    ok:      'var(--ok)',
    due:     'var(--warn)',
    overdue: 'var(--danger)',
    never:   'var(--accent)',
  };
  const LABELS = {
    ok:      { zh:'正常',     en:'OK',      sub:'未到時間' },
    due:     { zh:'該量',     en:'DUE',     sub:'已到應量' },
    overdue: { zh:'嚴重逾時', en:'OVERDUE', sub:'> 30 min' },
    never:   { zh:'新池',     en:'NEVER',   sub:'尚無紀錄' },
  };

  // ─── Pending color logic ───
  const pendColor = counts.overdue > 0 ? 'var(--danger)'
                  : counts.due > 0     ? 'var(--warn)'
                  : 'var(--ok)';

  return (
    <section className="panel" style={{ padding: 0, marginBottom: 14 }}>
      {/* ─── Header ─── */}
      <div style={{
        padding: '12px 18px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'baseline', gap: 12,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--accent)', letterSpacing: 0.12, textTransform: 'uppercase',
        }}>採樣狀態總覽 · Sampling Coverage</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-0)' }}>
          全場 {total} 池 · 計算於 {fmtClock(new Date(tickMs).toISOString())}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ok)' }}>● LIVE</span>
      </div>

      {/* ─── Top row: pending hero + total ─── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.4fr 2fr',
        borderBottom: '1px solid var(--line-soft)',
      }}>
        {/* Pending hero */}
        <div style={{
          padding: '20px 24px',
          borderRight: '1px solid var(--line-soft)',
          background: pending > 0 ? 'oklch(0.32 0.06 78 / 0.10)' : 'transparent',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--fg-0)', letterSpacing: 0.12, textTransform: 'uppercase',
          }}>待處理 PENDING ({pending > 0 ? 'DUE + OVERDUE' : '✓ 全場已量測'})</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 56, fontWeight: 600, lineHeight: 1.1,
            color: pendColor, marginTop: 6,
          }}>
            {pending}
            <span style={{ fontSize: 16, color: 'var(--fg-0)', marginLeft: 8 }}>池 / {total}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-0)', marginTop: 6 }}>
            {pending > 0
              ? `🟡 ${counts.due} DUE · 🔴 ${counts.overdue} OVERDUE`
              : '本場所有採樣均在窗口內，無待處理項目'}
          </div>
        </div>

        {/* Per-status KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {['ok','due','overdue','never'].map((k, i) => {
            const c = COLORS[k];
            const lbl = LABELS[k];
            const v = counts[k] || 0;
            return (
              <div key={k} style={{
                padding: '20px 18px',
                borderRight: i < 3 ? '1px solid var(--line-soft)' : 'none',
                position: 'relative',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-mono)', fontSize: 9.5,
                  color: 'var(--fg-0)', letterSpacing: 0.10, textTransform: 'uppercase',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }}></span>
                  <span>{lbl.zh}</span>
                  <span style={{ color: c, fontWeight: 700 }}>{lbl.en}</span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 600,
                  color: v > 0 ? c : 'var(--fg-0)', marginTop: 8, lineHeight: 1.1,
                }}>
                  {v}<span style={{ fontSize: 12, color: 'var(--fg-0)', marginLeft: 4 }}>池</span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-0)', marginTop: 4,
                }}>{lbl.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Top-3 overdue list (only show if any) ─── */}
      {top3.length > 0 ? (
        <div style={{ padding: '12px 18px' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--danger)', letterSpacing: 0.12, textTransform: 'uppercase',
            marginBottom: 8,
          }}>⚠ 最嚴重前 {top3.length} 池 · TOP OVERDUE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {top3.map((r, i) => (
              <div key={r.tank.id} style={{
                display: 'grid',
                gridTemplateColumns: '24px 80px 80px 1fr 120px',
                gap: 10, alignItems: 'center',
                padding: '6px 10px', background: 'var(--bg-1)',
                border: '1px solid var(--line-soft)',
                borderLeft: '3px solid var(--danger)',
                fontSize: 11.5,
              }}>
                <span style={{ fontFamily:'var(--font-mono)', color:'var(--danger)', fontWeight:700 }}>
                  #{i + 1}
                </span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600 }}>
                  {r.tank.id}
                </span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--fg-0)' }}>
                  {r.tank.stage}
                </span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--fg-0)' }}>
                  上次 {fmtClock(r.last)} · 應於 {fmtClock(r.next)} 量測
                </span>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize:11.5, fontWeight:700,
                  color:'var(--danger)', textAlign:'right',
                }}>
                  ✗ 已逾 {fmtMins(r.lateMin)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ─── Responsibility groups (NEW) ─── */}
      {respList.length > 0 ? (
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line-soft)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--accent)', letterSpacing: 0.12, textTransform: 'uppercase',
            marginBottom: 8, display: 'flex', alignItems: 'baseline', gap: 8,
          }}>
            <span>👤 採樣責任歸屬 · Responsibility</span>
            <span style={{ flex: 1 }} />
            <span style={{ color:'var(--fg-0)', fontFamily:'var(--font-mono)', fontSize:10 }}>
              {respList.length} 位人員 / 班別有待處理
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {respList.map(g => {
              const initials = (g.name || '?').slice(-2);
              const accent = g.overdue > 0 ? 'var(--danger)' :
                             g.due > 0     ? 'var(--warn)'   : 'var(--ok)';
              const roleColor = g.role === 'admin' ? 'var(--accent)'
                              : g.role === 'operator' ? 'var(--ok)' : 'var(--fg-0)';
              return (
                <div key={g.staffId || '__un__'} style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 130px 1fr 1fr',
                  gap: 10, alignItems: 'center',
                  padding: '8px 10px', background: 'var(--bg-1)',
                  border: '1px solid var(--line-soft)',
                  borderLeft: '3px solid ' + accent,
                  fontSize: 11.5,
                }}>
                  {/* avatar circle */}
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: g.isUnassigned ? 'var(--warn)' : accent,
                    color: 'var(--bg-0)', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                  }}>{g.isUnassigned ? '!' : initials}</span>

                  {/* name + shift + role */}
                  <span>
                    <div style={{ fontWeight: 600, color: 'var(--fg-0)' }}>
                      {g.name}
                      {g.enabled === false ? <span style={{ marginLeft:6, color:'var(--warn)', fontSize:10 }}>[停用]</span> : null}
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize: 10, color: 'var(--fg-0)' }}>
                      {g.role ? <span style={{ color: roleColor }}>{g.role}</span> : null}
                      {g.role && g.shift ? <span> · </span> : null}
                      {g.shift ? <span>{g.shift}</span> : (!g.role ? '未指派負責人' : null)}
                    </div>
                  </span>

                  {/* counts */}
                  <span style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    {g.overdue > 0 ? (
                      <span style={{ color: 'var(--danger)', fontFamily:'var(--font-mono)', fontWeight: 700 }}>
                        🔴 {g.overdue} 池逾時
                      </span>
                    ) : null}
                    {g.due > 0 ? (
                      <span style={{ color: 'var(--warn)', fontFamily:'var(--font-mono)', fontWeight: 700 }}>
                        🟡 {g.due} 池待量測
                      </span>
                    ) : null}
                  </span>

                  {/* tank chips */}
                  <span style={{ display:'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {g.tanks
                      .sort((a,b) => (a.status === b.status ? b.lateMin - a.lateMin
                                      : a.status === 'overdue' ? -1 : 1))
                      .slice(0, 6)
                      .map(t => (
                        <span key={t.id} title={`${t.id} · ${t.status}` + (t.lateMin ? ` · 已逾 ${fmtMins(t.lateMin)}` : '')}
                              style={{
                                padding: '2px 6px',
                                fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                                border: '1px solid ' + (t.status === 'overdue' ? 'var(--danger)' : 'var(--warn)'),
                                color: t.status === 'overdue' ? 'var(--danger)' : 'var(--warn)',
                              }}>{t.id}</span>
                      ))}
                    {g.tanks.length > 6 ? (
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-0)' }}>
                        +{g.tanks.length - 6}
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Empty / all-good footer note */}
      {pending === 0 && counts.never === 0 ? (
        <div style={{
          padding: '10px 18px', borderTop: '1px solid var(--line-soft)',
          fontSize: 11.5, color: 'var(--ok)', textAlign: 'center',
        }}>
          ✓ 全場 {total} 池採樣狀態正常 · ALL SAMPLING ON TIME · 全員無待處理
        </div>
      ) : null}
    </section>
  );
}

/* ====================================================================
   SiteProfileCard — KLK / Diamond Creeks 場域基本資料
   ==================================================================== */
function SiteProfileCard() {
  // Subscribe to LogStore for live mortality/count totals
  const [, _bumpSP] = useStateP(0);
  useEffectP(() => {
    if (!window.LogStore) return;
    return window.LogStore.subscribe(() => _bumpSP(x => x + 1));
  }, []);

  const sp     = (window.AQUA_DATA && window.AQUA_DATA.SITE_PROFILE) || {};
  const layout = (window.AQUA_DATA && window.AQUA_DATA.FARM_LAYOUT) || {};
  const tanks  = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const totalTanks = Object.values(layout).reduce((s, v) => s + (v.count || 0), 0);
  const mapHref = sp.mapQuery
    ? 'https://www.google.com/maps/search/' + encodeURIComponent(sp.mapQuery)
    : null;

  // Real-time aggregations (latest fish_count log overrides seed)
  const totalFish = tanks.reduce((s, t) => {
    const lc = window.LogStore ? window.LogStore.latest('fish_count', t.id) : null;
    const cur = (lc && lc.data && lc.data.currentFishCount != null) ? lc.data.currentFishCount
              : (t.currentFishCount != null ? t.currentFishCount : (t.count || 0));
    return s + cur;
  }, 0);
  const todayMort = tanks.reduce((s, t) => s + (t.mortalityToday || 0), 0);
  const cumMort   = tanks.reduce((s, t) => s + (t.cumulativeMortality || 0), 0);
  // Determine main stage by fish count
  const stagesAgg = { INC:0, NUR:0, JUV:0, GRO:0 };
  tanks.forEach(t => { if (stagesAgg[t.stage] != null) stagesAgg[t.stage] += (t.currentFishCount || 0); });
  let mainStageName = '—';
  let mainCount = 0;
  Object.keys(stagesAgg).forEach(k => {
    if (stagesAgg[k] > mainCount) {
      mainCount = stagesAgg[k];
      mainStageName = ({ INC:'孵化槽 Hatch', NUR:'小魚池 Nursery', JUV:'中魚池 Juvenile', GRO:'大魚池 Grow-out' })[k];
    }
  });

  return (
    <section className="panel" style={{ padding: 0, marginBottom: 14 }}>
      {/* ─── Hero header (full width, large title) ─── */}
      <div style={{ padding:'22px 24px 18px', borderBottom:'1px solid var(--line-soft)' }}>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:11,
          color:'var(--accent)', letterSpacing:0.16, textTransform:'uppercase',
          marginBottom: 8,
        }}>{sp.companyName || 'KLK Aquaculture'} · 內部養殖管理平台</div>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color:'var(--fg-0)',
          lineHeight: 1.2, letterSpacing:'0.01em',
        }}>
          KLK 櫻花鉤吻鮭馬來西亞養殖計畫
        </h1>
        <div style={{
          fontSize: 16, fontWeight: 600, color:'var(--accent)', marginTop: 4,
        }}>
          Diamond Creeks 冷水魚智慧養殖與數據監測系統
        </div>
        <p style={{
          fontSize: 13.5, color:'var(--fg-0)', marginTop: 12,
          lineHeight: 1.65, maxWidth:'90ch',
        }}>
          本系統用於記錄天然泉水降溫、各階段池槽管理、魚數、死亡率、水質與移池決策，
          作為 KLK 在馬來西亞進行櫻花鉤吻鮭馴化養殖的內部管理平台。
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr' }}>
        {/* Left: site / address / phone / map */}
        <div style={{ padding: '16px 20px', borderRight:'1px solid var(--line-soft)' }}>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10.5,
            color:'var(--accent)', letterSpacing:0.12, textTransform:'uppercase',
            marginBottom: 6,
          }}>場域基本資料 · Site Profile</div>

          <div style={{
            padding: '10px 12px', background:'var(--bg-1)',
            border:'1px solid var(--line-soft)',
          }}>
            <div style={{ display:'flex', gap:10, alignItems:'baseline' }}>
              <span style={{
                fontFamily:'var(--font-mono)', fontSize:10,
                color:'var(--accent)', letterSpacing:0.10, textTransform:'uppercase',
              }}>場域 SITE</span>
              <span style={{ fontWeight:700, color:'var(--fg-0)', fontSize:14 }}>
                {sp.siteName} · {sp.siteNameLong}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color:'var(--fg-0)', marginTop: 6, lineHeight:1.5 }}>
              {sp.address}
            </div>
            <div style={{
              display:'flex', gap:10, marginTop:8, alignItems:'center', flexWrap:'wrap',
              fontFamily:'var(--font-mono)', fontSize:11.5,
            }}>
              <span style={{ color:'var(--fg-0)', fontWeight:600 }}>📞 電話:</span>
              <span style={{ color: sp.contactPhone ? 'var(--fg-0)' : 'var(--warn)', fontWeight:700 }}>
                {sp.contactPhone || '待補 Pending'}
              </span>
              {mapHref ? (
                <a href={mapHref} target="_blank" rel="noopener noreferrer" style={{
                  marginLeft:'auto', color:'var(--accent)', fontWeight:700, textDecoration:'none',
                }}>🗺 在 Google 地圖開啟 →</a>
              ) : null}
            </div>
          </div>

          <div style={{
            marginTop: 10, padding:'10px 12px',
            border:'1px solid var(--line-soft)',
          }}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:10,
              color:'var(--accent)', letterSpacing:0.10, textTransform:'uppercase',
              marginBottom:4,
            }}>水源 WATER SOURCE</div>
            <div style={{ fontSize:13, color:'var(--fg-0)', fontWeight:600 }}>
              天然泉水 · 原水溫度 {sp.intakeTempRange ? sp.intakeTempRange.join('–') : '24–25'}°C
            </div>
            <div style={{ fontSize:11.5, color:'var(--fg-0)', marginTop:4 }}>
              經降溫設備後依階段供水
            </div>
          </div>
        </div>

        {/* Right: 9 KPI tiles per spec (2 cols × 5 rows, last row spans) */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
          {[
            { lbl:'總池槽 TOTAL TANKS',  val: String(totalTanks), unit:'池',     color:'var(--accent)' },
            { lbl:'目前總魚數 TOTAL FISH', val: totalFish.toLocaleString(), unit:'尾', color:'var(--accent)', big:true },
            { lbl:'孵化槽 HATCH',         val: String(layout.hatch?.count    || 0), unit:'槽', color:'var(--accent)' },
            { lbl:'小魚池 NURSERY',       val: String(layout.nursery?.count  || 0), unit:'池', color:'var(--ok)' },
            { lbl:'中魚池 JUVENILE',      val: String(layout.juvenile?.count || 0), unit:'池 待啟用', color:'var(--warn)' },
            { lbl:'大魚池 GROW-OUT',      val: String(layout.growout?.count  || 0), unit: layout.growout?.confirmed === false ? '池 待確認' : '池', color: layout.growout?.confirmed === false ? 'var(--danger)' : 'var(--warn)' },
            { lbl:'主要階段 MAIN STAGE',  val: mainStageName,            unit:'',  color:'var(--ok)', wide:true },
            { lbl:'今日死亡 TODAY',        val: String(todayMort), unit:'尾', color: todayMort >= 10 ? 'var(--danger)' : todayMort >= 1 ? 'var(--warn)' : 'var(--fg-0)' },
            { lbl:'累計死亡 CUMULATIVE',   val: cumMort.toLocaleString(), unit:'尾', color:'var(--fg-0)' },
          ].map((it, i, arr) => (
            <div key={i} style={{
              padding:'12px 16px',
              borderRight: it.wide ? 'none' : (i % 2 === 0 ? '1px solid var(--line-soft)' : 'none'),
              borderBottom: i < arr.length - (it.wide ? 1 : 2) ? '1px solid var(--line-soft)' : 'none',
              gridColumn: it.wide ? 'span 2' : 'auto',
            }}>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:10.5,
                color:'var(--fg-0)', letterSpacing:0.10, textTransform:'uppercase',
              }}>{it.lbl}</div>
              <div style={{
                fontFamily:'var(--font-mono)',
                fontSize: it.big ? 26 : it.wide ? 16 : 20,
                fontWeight:700, color: it.color, marginTop: 4, lineHeight:1.1,
              }}>{it.val}{it.unit ? <span style={{
                fontSize: it.big ? 11 : 10.5, color:'var(--fg-0)', marginLeft:5, fontWeight:600,
              }}>{it.unit}</span> : null}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ====================================================================
   FishCountDashboard — 全場魚數即時匯總 (per stage + grand total)
   ==================================================================== */
function FishCountDashboard() {
  // Subscribe to LogStore so new fish_count entries refresh totals
  const [, _bumpF] = useStateP(0);
  useEffectP(() => {
    if (!window.LogStore) return;
    return window.LogStore.subscribe(() => _bumpF(x => x + 1));
  }, []);

  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];

  // Per-tank effective count (latest fish_count log overrides seed)
  const rows = tanks.map(t => {
    const lc = window.LogStore ? window.LogStore.latest('fish_count', t.id) : null;
    const lcd = lc ? lc.data : null;
    const current = lcd && lcd.currentFishCount != null ? lcd.currentFishCount
                  : t.currentFishCount != null ? t.currentFishCount
                  : t.count;
    return {
      tank: t,
      current: current || 0,
      countStatus: lc ? 'actual' : (t.countStatus || 'estimated'),
      capacity: t.capacity || 0,
      mortToday: t.mortalityToday || 0,
      cumMort: t.cumulativeMortality || 0,
      isPending: (t.countStatus === 'pending'),
    };
  });

  // Aggregate per-stage
  const byStage = { INC: 0, NUR: 0, JUV: 0, GRO: 0 };
  const capByStage = { INC: 0, NUR: 0, JUV: 0, GRO: 0 };
  const tanksByStage = { INC: 0, NUR: 0, JUV: 0, GRO: 0 };
  const activeByStage = { INC: 0, NUR: 0, JUV: 0, GRO: 0 };
  let totalFish = 0, totalCapacity = 0, totalMortToday = 0, totalCumMort = 0;
  rows.forEach(r => {
    const st = r.tank.stage;
    if (byStage[st] != null) {
      byStage[st]      += r.current;
      capByStage[st]   += r.capacity;
      tanksByStage[st] += 1;
      if (!r.isPending) activeByStage[st] += 1;
    }
    totalFish      += r.current;
    totalCapacity  += r.capacity;
    totalMortToday += r.mortToday;
    totalCumMort   += r.cumMort;
  });
  const totalInitial = rows.reduce((s, r) => s + (r.tank.initialFishCount || 0), 0);
  const survivalAll  = totalInitial > 0 ? (totalFish / totalInitial * 100) : null;

  const stageMeta = [
    { id:'INC', zh:'孵化槽', en:'Hatch',     color:'var(--accent)' },
    { id:'NUR', zh:'小魚槽', en:'Nursery',   color:'var(--ok)' },
    { id:'JUV', zh:'中型池', en:'Juvenile',  color:'var(--warn)' },
    { id:'GRO', zh:'大型池', en:'Grow-out',  color:'var(--warn)' },
  ];

  // Determine main stage = stage with most fish; fallback to first active stage
  let mainStage = null, mainCount = 0;
  stageMeta.forEach(s => {
    if (byStage[s.id] > mainCount) { mainCount = byStage[s.id]; mainStage = s; }
  });
  if (!mainStage) {
    mainStage = stageMeta.find(s => activeByStage[s.id] > 0) || null;
  }

  return (
    <section className="panel" style={{ padding: 0, marginBottom: 14 }}>
      {/* Header */}
      <div style={{
        padding:'12px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'baseline', gap:12,
      }}>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:10,
          color:'var(--accent)', letterSpacing:0.12, textTransform:'uppercase',
        }}>魚數總覽 · Fish Count</span>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--fg-0)' }}>
          資料來源 = 最新 fish_count log，未盤點則用 seed 估算
        </span>
      </div>

      {/* Top row: grand total + survival */}
      <div style={{
        display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr',
        borderBottom:'1px solid var(--line-soft)',
      }}>
        <div style={{ padding:'18px 22px', borderRight:'1px solid var(--line-soft)' }}>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10,
            color:'var(--fg-0)', letterSpacing:0.10, textTransform:'uppercase',
          }}>全場魚數 TOTAL FISH COUNT</div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:48, fontWeight:700,
            color:'var(--accent)', lineHeight:1.1, marginTop:4,
          }}>
            {totalFish.toLocaleString()}
            <span style={{ fontSize:14, color:'var(--fg-0)', marginLeft:8 }}>尾</span>
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--fg-0)', marginTop:4 }}>
            佔總容量 {totalCapacity > 0 ? ((totalFish / totalCapacity) * 100).toFixed(1) : '—'}% · 容量 {totalCapacity.toLocaleString()}
          </div>
        </div>
        <div style={{ padding:'18px 18px', borderRight:'1px solid var(--line-soft)' }}>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10,
            color:'var(--fg-0)', letterSpacing:0.10, textTransform:'uppercase',
          }}>整體存活率 SURVIVAL</div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:32, fontWeight:700, lineHeight:1.1, marginTop:4,
            color: survivalAll == null ? 'var(--fg-0)'
                 : survivalAll >= 90 ? 'var(--ok)'
                 : survivalAll >= 80 ? 'var(--warn)' : 'var(--danger)',
          }}>{survivalAll != null ? survivalAll.toFixed(1) + '%' : '—'}</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--fg-0)', marginTop:4 }}>
            初始 {totalInitial.toLocaleString()} → 現在 {totalFish.toLocaleString()}
          </div>
        </div>
        <div style={{ padding:'18px 18px' }}>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10,
            color:'var(--fg-0)', letterSpacing:0.10, textTransform:'uppercase',
          }}>死亡 MORTALITY</div>
          <div style={{
            display:'flex', gap:18, alignItems:'baseline', marginTop:4,
          }}>
            <div>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:24, fontWeight:700,
                color: totalMortToday >= 30 ? 'var(--danger)' : totalMortToday >= 10 ? 'var(--warn)' : 'var(--fg-0)',
              }}>{totalMortToday}</div>
              <div style={{ fontSize:10, color:'var(--fg-1)' }}>今日 TODAY</div>
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600, color:'var(--fg-0)' }}>
                {totalCumMort.toLocaleString()}
              </div>
              <div style={{ fontSize:10, color:'var(--fg-1)' }}>累計 CUMULATIVE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main stage banner */}
      {mainStage ? (
        <div style={{
          padding:'10px 18px', borderBottom:'1px solid var(--line-soft)',
          background:'oklch(0.225 0.04 220 / 0.40)',
          display:'flex', alignItems:'center', gap:10,
          fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--fg-0)',
        }}>
          <span style={{ color:'var(--accent)', letterSpacing:0.10, textTransform:'uppercase' }}>
            目前主要階段 · MAIN STAGE
          </span>
          <span style={{ width:8, height:8, borderRadius:'50%', background:mainStage.color }}></span>
          <span style={{ fontWeight:700, color:'var(--fg-0)', fontSize:13 }}>
            {mainStage.zh} {mainStage.en}
          </span>
          <span style={{ color:'var(--fg-1)' }}>·</span>
          <span style={{ color:mainStage.color, fontWeight:700 }}>
            {mainCount.toLocaleString()} 尾
          </span>
          <span style={{ color:'var(--fg-1)' }}>分布於 {activeByStage[mainStage.id]} / {tanksByStage[mainStage.id]} 池</span>
          <span style={{ flex:1 }} />
          <span style={{ color:'var(--fg-0)', fontSize:10.5 }}>
            {mainStage.id === 'NUR' ? '小魚培育 · 體長 10–20 cm 馴化期'
             : mainStage.id === 'INC' ? '孵化卵期 · 需穩定低溫管理'
             : mainStage.id === 'JUV' ? '中型馴化 · 升溫適應'
             : '大型育成 · 環境適應'}
          </span>
        </div>
      ) : null}

      {/* Per-stage breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)' }}>
        {stageMeta.map((s, i) => (
          <div key={s.id} style={{
            padding:'14px 16px',
            borderRight: i < 3 ? '1px solid var(--line-soft)' : 'none',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background: s.color }}></span>
              <span style={{
                fontFamily:'var(--font-mono)', fontSize:10,
                color:'var(--fg-0)', letterSpacing:0.10, textTransform:'uppercase',
              }}>{s.zh} {s.en}</span>
            </div>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:24, fontWeight:700,
              color: byStage[s.id] > 0 ? s.color : 'var(--fg-0)',
              marginTop:6, lineHeight:1.1,
            }}>
              {byStage[s.id].toLocaleString()}
              <span style={{ fontSize:11, color:'var(--fg-1)', marginLeft:4 }}>尾</span>
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-0)', marginTop:4 }}>
              {activeByStage[s.id]} / {tanksByStage[s.id]} 池啟用 · 容量 {capByStage[s.id].toLocaleString()}
            </div>
            {activeByStage[s.id] === 0 ? (
              <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--warn)', marginTop:2 }}>
                ⚠ 尚未啟用
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ====================================================================
   CurrentVsIdealPanel — 各階段現況 vs 標準比對
   ==================================================================== */
function CurrentVsIdealPanel() {
  const SS = window.SettingsStore;
  const sp = (window.AQUA_DATA && window.AQUA_DATA.SITE_PROFILE) || {};
  const ref = (window.AQUA_DATA && window.AQUA_DATA.STAGE_STANDARDS_REF) || {};
  const layout = (window.AQUA_DATA && window.AQUA_DATA.FARM_LAYOUT) || {};
  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];

  const cooledLo = sp.cooledTempRange ? sp.cooledTempRange[0] : null;
  const cooledHi = sp.cooledTempRange ? sp.cooledTempRange[1] : null;

  const stageDef = [
    { id:'INC', zh:'孵化槽', en:'Hatch',    layoutKey:'hatch'    },
    { id:'NUR', zh:'小魚槽', en:'Nursery',  layoutKey:'nursery'  },
    { id:'JUV', zh:'中型池', en:'Juvenile', layoutKey:'juvenile' },
    { id:'GRO', zh:'大型池', en:'Grow-out', layoutKey:'growout'  },
  ];

  function statusFor(stageId, lo, hi) {
    if (cooledLo == null || cooledHi == null) return 'na';
    if (cooledLo >= lo && cooledHi <= hi) return 'ok';
    // overlapping range partially?
    if (cooledHi < lo) return 'warn';     // cooled too cold (unlikely)
    if (cooledLo > hi) {
      const gap = cooledLo - hi;
      return gap >= 4 ? 'danger' : 'warn';
    }
    return 'warn';
  }

  return (
    <section className="panel" style={{ padding: 0, marginBottom: 14 }}>
      <div style={{
        padding:'12px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'baseline', gap:12,
      }}>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:10,
          color:'var(--accent)', letterSpacing:0.12, textTransform:'uppercase',
        }}>現況 vs 標準 · Current vs Ideal</span>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--fg-0)' }}>
          場域冷卻後水溫 = <strong style={{ color:'var(--warn)' }}>
            {cooledLo}–{cooledHi}°C
          </strong> · 標準源於 STAGE_STANDARDS_REF
        </span>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11.5 }}>
          <thead>
            <tr style={{ background:'var(--bg-1)' }}>
              <th style={_thStyle}>階段 STAGE</th>
              <th style={_thStyle}>標準水溫</th>
              <th style={_thStyle}>現況水溫</th>
              <th style={_thStyle}>標準 DO</th>
              <th style={_thStyle}>標準魚體</th>
              <th style={_thStyle}>狀態</th>
              <th style={Object.assign({}, _thStyle, { textAlign:'left' })}>建議 Action</th>
            </tr>
          </thead>
          <tbody>
            {stageDef.map(sd => {
              const r = ref[sd.id];
              const layoutInfo = layout[sd.layoutKey] || {};
              const tanksOfStage = tanks.filter(t => t.stage === sd.id);
              const activeTanks = tanksOfStage.filter(t => (t.countStatus || '') !== 'pending');
              const stat = activeTanks.length > 0 ? statusFor(sd.id, r.tempLo, r.tempHi) : 'pending';
              const statColor = stat === 'ok' ? 'var(--ok)'
                              : stat === 'warn' ? 'var(--warn)'
                              : stat === 'danger' ? 'var(--danger)'
                              : 'var(--fg-1)';
              const statLabel = stat === 'ok' ? '✔ 正常'
                              : stat === 'warn' ? '⚠ 警告'
                              : stat === 'danger' ? '✗ 嚴重落差'
                              : stat === 'pending' ? '─ 未啟用'
                              : '—';
              const action =
                stat === 'pending' && sd.id === 'INC' ? '7 槽已建置；待批次受精卵入孵；需穩定 7–10°C 水溫'
                : stat === 'pending' && sd.id === 'JUV' ? '待小魚成長至 20 cm+ 移入；管理者可在 Settings 調整移池條件'
                : stat === 'pending' && sd.id === 'GRO' ? '4 槽待確認；先建立空池水質監測；依當地環境適應'
                : sd.id === 'INC' ? '加強降溫，目標 7–10°C；每 30 分鐘人工紀錄；預計從 15–18°C 降至目標'
                : sd.id === 'NUR' ? '6 池 × 700 尾 = 4,200（estimated）；目前 15–17°C 與冷卻水接近；持續監測 DO / 死亡 / 餵食'
                : sd.id === 'JUV' ? '預設 20–23°C；移入條件預設 ≥20 cm，可在 Settings 調整'
                : sd.id === 'GRO' ? '依當地環境（18–24°C）適應；最終槽數待確認；準備分批移入'
                : '監控並補測';

              return (
                <tr key={sd.id} style={{ borderBottom:'1px solid var(--line-soft)' }}>
                  <td style={_tdStyle}>
                    <div style={{ fontWeight:700, color:'var(--fg-0)' }}>{sd.zh}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-1)' }}>
                      {sd.en} · {sd.id} · {layoutInfo.count} 槽
                      {layoutInfo.confirmed === false ? <span style={{ color:'var(--warn)' }}> (待確認)</span> : null}
                    </div>
                  </td>
                  <td style={_tdStyle}>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--ok)' }}>
                      {r.tempLo}–{r.tempHi}
                    </span>
                    <span style={{ color:'var(--fg-1)', marginLeft:2, fontSize:10 }}>°C</span>
                  </td>
                  <td style={_tdStyle}>
                    <span style={{
                      fontFamily:'var(--font-mono)', fontWeight:700,
                      color: statColor,
                    }}>{cooledLo}–{cooledHi}</span>
                    <span style={{ color:'var(--fg-1)', marginLeft:2, fontSize:10 }}>°C</span>
                  </td>
                  <td style={_tdStyle}>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--ok)' }}>
                      ≥ {r.doMin}
                    </span>
                  </td>
                  <td style={Object.assign({}, _tdStyle, { fontSize:10.5, color:'var(--fg-0)' })}>
                    {r.sizeRangeCm}
                  </td>
                  <td style={_tdStyle}>
                    <span style={{
                      padding:'2px 8px', fontFamily:'var(--font-mono)', fontSize:10.5,
                      fontWeight:700, color: statColor, border:'1px solid '+statColor,
                    }}>{statLabel}</span>
                  </td>
                  <td style={Object.assign({}, _tdStyle, { textAlign:'left', fontSize:10.5, color:'var(--fg-0)' })}>
                    {action}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const _thStyle = {
  fontFamily:'var(--font-mono)', fontSize:9.5, fontWeight:600,
  color:'var(--fg-0)', letterSpacing:0.10, textTransform:'uppercase',
  padding:'8px 10px', textAlign:'center',
  borderBottom:'1px solid var(--line)',
};
const _tdStyle = {
  padding:'10px 10px', textAlign:'center',
  color:'var(--fg-0)',
};

/* ====================================================================
   TransferRecommendationsPanel — 今日移池建議
   只在「至少有一池達到移池條件」時渲染；底部選擇性顯示 approaching 池
   ==================================================================== */
function TransferRecommendationsPanel() {
  // Subscribe to LogStore (length updates) + SettingsStore (threshold changes)
  const [, _bumpT] = useStateP(0);
  useEffectP(() => {
    const unsubs = [];
    if (window.LogStore && window.LogStore.subscribe)
      unsubs.push(window.LogStore.subscribe(() => _bumpT(x => x + 1)));
    if (window.SettingsStore && window.SettingsStore.subscribe)
      unsubs.push(window.SettingsStore.subscribe(() => _bumpT(x => x + 1)));
    return () => unsubs.forEach(u => u && u());
  }, []);

  if (!window.getTransferSuggestion || !window.SettingsStore) return null;

  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const recommended = [];
  const approaching = [];
  tanks.forEach(t => {
    const ss  = window.SettingsStore.getStageStandards(t.stage);
    const sug = window.getTransferSuggestion(t, ss);
    if (sug.status === 'recommend')   recommended.push({ tank: t, sug });
    if (sug.status === 'approaching') approaching.push({ tank: t, sug });
  });

  // Hide entirely if neither bucket has anything (avoid noise)
  if (recommended.length === 0 && approaching.length === 0) return null;

  const heroColor = recommended.length > 0 ? 'var(--ok)' : 'var(--warn)';
  const heroLabel = recommended.length > 0
    ? '✓ 共 ' + recommended.length + ' 池達到移池條件'
    : '⚠ ' + approaching.length + ' 池接近移池條件';

  return (
    <section className="panel" style={{ padding: 0, marginBottom: 14 }}>
      {/* Header */}
      <div style={{
        padding:'10px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'baseline', gap:12,
      }}>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:10,
          color: heroColor, letterSpacing:0.12, textTransform:'uppercase',
        }}>📊 今日移池建議 · Transfer Recommendations</span>
        <span style={{ flex: 1 }} />
        <span style={{
          color: heroColor, fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700,
        }}>{heroLabel}</span>
      </div>

      {/* Recommended (primary, only if any) */}
      {recommended.length > 0 ? (
        <div style={{ padding:'10px 18px', display:'flex', flexDirection:'column', gap:6 }}>
          {recommended.map(r => (
            <div key={r.tank.id} style={{
              padding:'10px 14px',
              background:'oklch(0.32 0.06 165 / 0.18)',
              border:'1px solid var(--ok)',
              borderLeft:'3px solid var(--ok)',
              display:'grid',
              gridTemplateColumns:'28px 70px 1fr 130px',
              gap:10, alignItems:'center', fontSize:12,
            }}>
              <span style={{ color:'var(--ok)', fontFamily:'var(--font-mono)', fontWeight:800, fontSize:18 }}>↑</span>
              <span style={{ fontWeight:700, color:'var(--fg-0)', fontFamily:'var(--font-mono)', fontSize:14 }}>
                {r.tank.id}
              </span>
              <span style={{ color:'var(--fg-0)' }}>
                <span style={{ color:'var(--fg-1)', fontFamily:'var(--font-mono)', fontSize:10.5 }}>
                  {r.tank.stageZh} →
                </span>
                <span style={{ color:'var(--ok)', fontWeight:700, marginLeft:6, fontSize:13 }}>
                  {r.sug.nextStageZh}
                </span>
                <span style={{ color:'var(--fg-1)', fontFamily:'var(--font-mono)', fontSize:10.5, marginLeft:6 }}>
                  {r.sug.nextStageEn}
                </span>
              </span>
              <span style={{
                color:'var(--ok)', fontWeight:700,
                fontFamily:'var(--font-mono)', fontSize:11.5, textAlign:'right',
              }}>
                已達 {r.sug.currentCm} cm <span style={{ color:'var(--fg-1)' }}>/ 標 {r.sug.requiredCm}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Approaching (secondary, smaller) */}
      {approaching.length > 0 ? (
        <div style={{
          padding:'8px 18px', borderTop: recommended.length > 0 ? '1px solid var(--line-soft)' : 'none',
        }}>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:9.5,
            color:'var(--warn)', letterSpacing:0.10, textTransform:'uppercase',
            marginBottom: 6,
          }}>… 接近移池條件 ({approaching.length} 池) · APPROACHING</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {approaching.map(r => (
              <div key={r.tank.id} title={r.sug.message} style={{
                padding:'4px 8px',
                border:'1px solid var(--warn)',
                fontFamily:'var(--font-mono)', fontSize:10.5,
              }}>
                <span style={{ color:'var(--fg-0)', fontWeight:700 }}>{r.tank.id}</span>
                <span style={{ color:'var(--fg-1)', marginLeft:4 }}>→</span>
                <span style={{ color:'var(--warn)', fontWeight:700, marginLeft:4 }}>
                  {r.sug.nextStageZh}
                </span>
                <span style={{ color:'var(--fg-1)', marginLeft:6 }}>
                  {r.sug.currentCm}/{r.sug.requiredCm} cm · {r.sug.progressPct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ====================================================================
   AlertSummaryPanel — 今日警報（Dashboard）
   ==================================================================== */
function AlertSummaryPanel() {
  const [, _bumpA] = useStateP(0);
  useEffectP(() => {
    if (!window.AlertEngine) return;
    return window.AlertEngine.subscribe(() => _bumpA(x => x + 1));
  }, []);

  if (!window.AlertEngine) return null;
  const all = window.AlertEngine.getActiveAlerts();
  const dangerCount  = all.filter(a => a.level === 'critical').length;
  const warnCount    = all.filter(a => a.level === 'warning').length;

  // Last 5 most recent
  const recent = all.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5);

  if (all.length === 0) return null;  // hide when no alerts

  return (
    <section className="panel" style={{ padding: 0, marginBottom: 14 }}>
      <div style={{
        padding:'12px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'baseline', gap:12,
      }}>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700,
          color: dangerCount > 0 ? 'var(--danger)' : 'var(--warn)',
          letterSpacing:0.14, textTransform:'uppercase',
        }}>🚨 今日警報 · Today's Alerts</span>
        <span style={{ flex:1 }} />
        <span style={{ fontSize:13, color:'var(--danger)', fontWeight:700 }}>Danger {dangerCount}</span>
        <span style={{ fontSize:13, color:'var(--warn)',   fontWeight:700 }}>Warning {warnCount}</span>
        <button onClick={() => window.AlertEngine.clearAll()} style={{
          padding:'4px 10px', fontSize:11, fontWeight:600,
          background:'transparent', color:'var(--fg-0)',
          border:'1px solid var(--line)', cursor:'pointer',
        }}>清空</button>
      </div>
      <div style={{ padding:'10px 18px', display:'flex', flexDirection:'column', gap:6 }}>
        {recent.map(a => {
          const c = a.level === 'critical' ? 'var(--danger)' : 'var(--warn)';
          const icon = a.level === 'critical' ? '🔴' : '🟡';
          const ts = new Date(a.timestamp);
          const tsStr = String(ts.getHours()).padStart(2,'0') + ':' + String(ts.getMinutes()).padStart(2,'0');
          return (
            <div key={a.id} style={{
              padding:'10px 14px',
              background: a.level === 'critical' ? 'oklch(0.40 0.12 25 / 0.10)' : 'oklch(0.32 0.06 78 / 0.10)',
              border:'1px solid '+c, borderLeft:'3px solid '+c,
              display:'grid', gridTemplateColumns:'30px 70px 1fr 100px 30px',
              gap:10, alignItems:'center', fontSize:13.5,
            }}>
              <span style={{ fontSize:14 }}>{icon}</span>
              <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--fg-0)' }}>{tsStr}</span>
              <span style={{ color:'var(--fg-0)' }}>
                <span style={{ fontWeight:700 }}>{a.tankLabel}</span>
                <span style={{ color: c, fontWeight:700, marginLeft:6 }}>{a.title.replace(a.tankId + ' ', '')}</span>
                <span style={{ color:'var(--fg-1)', marginLeft:6, fontSize:12 }}>· {a.message}</span>
              </span>
              <span style={{ fontSize:12, color:'var(--fg-0)', textAlign:'right' }}>{a.action}</span>
              <button onClick={() => window.AlertEngine.clearAlert(a.id)} style={{
                padding:'2px 6px', fontSize:11, background:'transparent', color: c,
                border:'1px solid '+c, cursor:'pointer',
              }}>✕</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ====================================================================
   EquipmentGapPanel — 設備缺口列表（Dashboard）
   ==================================================================== */
function EquipmentGapPanel() {
  const [, _bumpEG] = useStateP(0);
  useEffectP(() => {
    if (!window.SettingsStore) return;
    return window.SettingsStore.subscribe(() => _bumpEG(x => x + 1));
  }, []);

  if (!window.compareRequiredDevices) return null;
  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];

  // Compute gaps for all tanks; group by stage
  const gaps = tanks.map(t => ({
    tank: t,
    gap: window.compareRequiredDevices(t.stage, t.id),
  })).filter(g => g.gap.missingDevices.length > 0);

  if (gaps.length === 0) {
    return (
      <section className="panel" style={{ padding:0, marginBottom: 14 }}>
        <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--line)' }}>
          <span style={{
            fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700,
            color:'var(--ok)', letterSpacing:0.14, textTransform:'uppercase',
          }}>⚙ 設備缺口 · Equipment Gaps</span>
        </div>
        <div style={{ padding:'18px', textAlign:'center', color:'var(--ok)', fontSize:14 }}>
          ✓ 所有池槽設備需求皆已滿足
        </div>
      </section>
    );
  }

  // Aggregate per-stage missing summary
  const byStage = {};
  gaps.forEach(g => {
    if (!byStage[g.tank.stage]) byStage[g.tank.stage] = { tanks: [], missingTypes: new Set() };
    byStage[g.tank.stage].tanks.push(g);
    g.gap.missingDevices.forEach(m => byStage[g.tank.stage].missingTypes.add(m.label.split(' ')[0]));
  });

  const STAGE_ZH = { INC:'孵化槽', NUR:'小魚池', JUV:'中魚池', GRO:'大魚池' };

  function _tankShortLabel(t) {
    const sameStage = tanks.filter(x => x.stage === t.stage);
    const idx = sameStage.findIndex(x => x.id === t.id) + 1;
    return (STAGE_ZH[t.stage] || t.stage) + idx + '（' + t.id + '）';
  }

  return (
    <section className="panel" style={{ padding:0, marginBottom: 14 }}>
      <div style={{
        padding:'12px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'baseline', gap:12,
      }}>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700,
          color:'var(--warn)', letterSpacing:0.14, textTransform:'uppercase',
        }}>⚙ 設備缺口 · Equipment Gaps</span>
        <span style={{ flex:1 }} />
        <span style={{
          padding:'2px 10px', fontSize:13, fontWeight:700,
          color:'var(--warn)', border:'1px solid var(--warn)', fontFamily:'var(--font-mono)',
        }}>{gaps.length} 池待補 / {tanks.length} 池</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:10, padding:14 }}>
        {Object.keys(byStage).map(sid => {
          const s = byStage[sid];
          const missingTypesText = Array.from(s.missingTypes).join('、');
          return (
            <div key={sid} style={{
              padding:'12px 14px', background:'var(--bg-1)',
              border:'1px solid var(--warn)', borderLeft:'3px solid var(--warn)',
            }}>
              <div style={{
                fontSize:14, fontWeight:700, color:'var(--fg-0)', marginBottom:6,
              }}>
                {STAGE_ZH[sid] || sid}
                <span style={{
                  marginLeft:8, fontSize:12, color:'var(--warn)', fontFamily:'var(--font-mono)',
                  fontWeight:600,
                }}>{s.tanks.length} 池缺</span>
              </div>
              <div style={{ fontSize:13, color:'var(--fg-0)', marginBottom:6 }}>
                缺：<strong style={{ color:'var(--warn)' }}>{missingTypesText}</strong>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {s.tanks.map(g => (
                  <span key={g.tank.id} style={{
                    padding:'2px 6px', fontSize:11, fontFamily:'var(--font-mono)',
                    border:'1px solid var(--warn)', color:'var(--warn)', fontWeight:600,
                  }}>{_tankShortLabel(g.tank)} {g.gap.coverageText}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        padding:'10px 18px', borderTop:'1px solid var(--line-soft)',
        background:'oklch(0.225 0.04 220 / 0.20)',
        fontSize:13, color:'var(--fg-0)',
      }}>
        💡 至 <strong style={{ color:'var(--accent)' }}>11 系統設定 → 06 設備管理</strong> 新增設備並綁定池槽，即可消除缺口。
      </div>
    </section>
  );
}

/* ====================================================================
   PAGE 01 · OVERVIEW — system intro + key features + key facts
   ==================================================================== */
function OverviewPage() {
  return (
    <div className="page-fade">
      <SiteProfileCard />
      <AlertSummaryPanel />
      <EquipmentGapPanel />
      <TransferRecommendationsPanel />
      <SamplingDashboard />
      <FishCountDashboard />
      <CurrentVsIdealPanel />
      {/* ─── 養殖參數標準 (4 stage cards) ─── */}
      <StageStandardsCards />

      {/* ─── 資料監測項目 (9 metrics, larger fonts) ─── */}
      <MonitoredParameters />
    </div>
  );
}

/* ====================================================================
   StageStandardsCards — Hatch / Nursery / Juvenile / Grow-out
   Replaces the old "核心特色" / 56,060 / 12 池 / 7–13°C legacy.
   ==================================================================== */
function StageStandardsCards() {
  const layout = (window.AQUA_DATA && window.AQUA_DATA.FARM_LAYOUT) || {};
  const cards = [
    { id:'INC', zh:'孵化槽', en:'Hatch / Incubation',
      tankCount: layout.hatch?.count || 7, accent:'var(--accent)',
      tempZh:'7–10°C', tempEn:'Standard',
      currentZh:'已孵化完成 / 目前 0 尾',
      currentNote:'I1–I7 待批次入孵' },
    { id:'NUR', zh:'小魚池', en:'Nursery',
      tankCount: layout.nursery?.count || 6, accent:'var(--ok)',
      tempZh:'15–17°C', tempEn:'Standard',
      currentZh:'4,200 尾 / 每池約 700 尾',
      currentNote:'A1–A6 · 體長約 10–15 cm · 目前主要階段' },
    { id:'JUV', zh:'中魚池', en:'Juvenile',
      tankCount: layout.juvenile?.count || 2, accent:'var(--warn)',
      tempZh:'20–23°C', tempEn:'預設',
      currentZh:'待啟用',
      currentNote:'J1–J2 · 移入條件約 20 cm 以上（可在 Settings 調整）' },
    { id:'GRO', zh:'大魚池', en:'Grow-out',
      tankCount: layout.growout?.count || 4, accent:'var(--danger)',
      tempZh:'依現場設定', tempEn:'Local',
      currentZh: layout.growout?.confirmed === false ? '待啟用 · 4 池待確認' : '待啟用',
      currentNote:'B1–B4 · 適應馬來西亞自然環境與日夜溫差' },
  ];

  return (
    <section className="panel" style={{ padding:0, marginBottom:14 }}>
      <div style={{
        padding:'12px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'baseline', gap:12,
      }}>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:11,
          color:'var(--accent)', letterSpacing:0.14, textTransform:'uppercase',
        }}>養殖參數標準 · Stage Standards</span>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-0)' }}>
          各階段標準水溫 + 現況一覽 · 編輯請至 11 系統設定
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)' }}>
        {cards.map((c, i) => (
          <div key={c.id} style={{
            padding:'18px 18px',
            borderRight: i < 3 ? '1px solid var(--line-soft)' : 'none',
            borderTop: '4px solid ' + c.accent,
          }}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:10.5,
              color: c.accent, letterSpacing:0.12, textTransform:'uppercase',
              fontWeight:700,
            }}>{c.en} · {c.id}</div>
            <div style={{
              fontSize:18, fontWeight:700, color:'var(--fg-0)',
              marginTop:4,
            }}>{c.zh}</div>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:13, color: c.accent,
              fontWeight:700, marginTop:10,
            }}>{c.tankCount} 池</div>

            <div style={{ marginTop:12 }}>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:10,
                color:'var(--fg-0)', letterSpacing:0.10, textTransform:'uppercase',
              }}>標準水溫 · {c.tempEn}</div>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:18, fontWeight:700,
                color:'var(--fg-0)', marginTop:2,
              }}>{c.tempZh}</div>
            </div>

            <div style={{ marginTop:10 }}>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:10,
                color:'var(--fg-0)', letterSpacing:0.10, textTransform:'uppercase',
              }}>現況 CURRENT</div>
              <div style={{
                fontSize:13, fontWeight:600, color: c.accent, marginTop:2,
              }}>{c.currentZh}</div>
              <div style={{ fontSize:11, color:'var(--fg-0)', marginTop:4, lineHeight:1.5 }}>
                {c.currentNote}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ====================================================================
   MonitoredParameters — 9 metrics, larger fonts
   Replaces old 5-card monitored params legacy.
   ==================================================================== */
function MonitoredParameters() {
  const items = [
    { sym:'TEMP',   zh:'水溫',     en:'Temperature',  color:'var(--accent)' },
    { sym:'DO',     zh:'溶氧',     en:'Dissolved O₂', color:'var(--accent)' },
    { sym:'pH',     zh:'酸鹼值',   en:'pH',           color:'var(--accent)' },
    { sym:'NH₃',    zh:'氨氮',     en:'Ammonia',      color:'var(--accent)' },
    { sym:'NO₂',    zh:'亞硝酸',   en:'Nitrite',      color:'var(--accent)' },
    { sym:'COUNT',  zh:'魚數',     en:'Fish Count',   color:'var(--ok)' },
    { sym:'MORT',   zh:'死亡數',   en:'Mortality',    color:'var(--danger)' },
    { sym:'GROWTH', zh:'平均體長', en:'Growth',       color:'var(--ok)' },
    { sym:'FEED',   zh:'餵食',     en:'Feeding',      color:'var(--warn)' },
  ];
  return (
    <section className="panel" style={{ padding:0, marginBottom:14 }}>
      <div style={{
        padding:'12px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'baseline', gap:12,
      }}>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:11,
          color:'var(--accent)', letterSpacing:0.14, textTransform:'uppercase',
        }}>資料監測項目 · Monitored Parameters</span>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-0)' }}>
          9 項主要紀錄 · 由 08 人工紀錄 / 未來 IoT 上傳
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)' }}>
        {items.map((it, i) => (
          <div key={it.sym} style={{
            padding:'14px 18px',
            borderRight: ((i + 1) % 3 !== 0) ? '1px solid var(--line-soft)' : 'none',
            borderBottom: i < 6 ? '1px solid var(--line-soft)' : 'none',
            display:'flex', alignItems:'center', gap:14,
          }}>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700,
              color: it.color, padding:'4px 10px',
              border:'1px solid ' + it.color,
              minWidth: 60, textAlign:'center',
            }}>{it.sym}</span>
            <span>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-0)' }}>{it.zh}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-0)' }}>
                {it.en}
              </div>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ====================================================================
   PAGE 02 · ENVIRONMENT — requirements explainer, flow, comparison, matrix
   ==================================================================== */

/* ====================================================================
   PAGE 02 · ENVIRONMENT & EQUIPMENT — KLK Diamond Creeks
   現場決策頁: 水源 / 階段水溫 / 控制邏輯 / 實際設備 / 落差
   ==================================================================== */

// Environment page shared style tokens (≥16px body, KLK 4 colors)
const _envBody     = { fontSize: 16, color: 'var(--fg-0)', lineHeight: 1.65 };
const _envH1       = { fontSize: 28, fontWeight: 800, color: 'var(--fg-0)', lineHeight: 1.2, letterSpacing: '0.01em' };
const _envH2sub    = { fontSize: 20, fontWeight: 600, color: 'var(--accent)', marginTop: 6 };
const _envH2Section = { fontSize: 20, fontWeight: 700, color: 'var(--fg-0)', marginBottom: 4 };
const _envSecMeta  = { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 };
const _envCardLabel = { fontSize: 14, color: 'var(--fg-0)', fontWeight: 600, letterSpacing: 0.04, textTransform: 'uppercase' };
const _envCardValue = { fontSize: 22, fontWeight: 700, color: 'var(--fg-0)', marginTop: 4, lineHeight: 1.1 };

function EnvironmentPage() {
  const sp = (window.AQUA_DATA && window.AQUA_DATA.SITE_PROFILE) || {};

  // Stage temperature targets (read from SettingsStore if available, with KLK defaults)
  const SS = window.SettingsStore;
  const std = (id) => (SS ? SS.getStageStandards(id) : null) || {};
  const incTemp  = std('INC').temp || [7, 10];
  const nurTemp  = std('NUR').temp || [15, 18];
  const juvTemp  = std('JUV').temp || [20, 23];

  // Intake range (real Diamond Creeks: 20–26°C per user spec)
  const intakeLo = 20, intakeHi = 26;

  return (
    <div className="page-fade" style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* ─── HERO HEADER ─────────────────────────────────────── */}
      <section className="panel" style={{ padding:0 }}>
        <div style={{ padding:'24px 28px', borderBottom:'1px solid var(--line-soft)' }}>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700,
            color:'var(--accent)', letterSpacing:0.16, textTransform:'uppercase',
            marginBottom:8,
          }}>
            KLK Diamond Creeks · 現場決策頁
          </div>
          <h1 style={_envH1}>環境與設備</h1>
          <div style={_envH2sub}>
            Diamond Creeks 場域水源、冷卻系統與實際設備總覽
          </div>
          <div style={{ fontSize:12, color:'var(--fg-1)', marginTop:4, fontFamily:'var(--font-mono)' }}>
            Environment &amp; Equipment · Decision Page
          </div>
          <p style={Object.assign({}, _envBody, { marginTop:14, maxWidth:'80ch' })}>
            本頁呈現 KLK Diamond Creeks 場域實際水源、各養殖階段水溫目標、單一冷卻系統的依池別控制邏輯，以及目前已建置與待補的設備清單。
            所有資料以「範圍」與「目標值」呈現，避免引用無來源的固定數字。
          </p>
        </div>
      </section>

      {/* ─── 今日環境判斷 (Summary, NEW) ─────────────────────── */}
      <_EnvSummaryCard />

      {/* ─── A · 場域與水源 ─────────────────────────────────── */}
      <section className="panel" style={{ padding:0 }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
          <div style={_envSecMeta}>A · 場域與水源 · Site &amp; Water Source</div>
          <div style={_envH2Section}>場域實際水源條件</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)' }}>
          {[
            { lbl:'場域 SITE', val: sp.siteName || 'Diamond Creeks', sub:'Behrang Ulu, Perak, Malaysia', color:'var(--accent)' },
            { lbl:'水源類型 SOURCE', val:'地下水 + 山泉', sub:'Groundwater + Mountain Spring', color:'var(--ok)' },
            { lbl:'原水溫範圍 INTAKE', val: intakeLo + '–' + intakeHi + ' °C', sub:'依季節 / 日夜變化', color:'var(--danger)' },
            { lbl:'與冷水魚標準落差', val:'高於需求', sub:'冷水魚理想 7–13°C', color:'var(--warn)' },
          ].map((it, i) => (
            <div key={i} style={{
              padding:'18px 18px',
              borderRight: i < 3 ? '1px solid var(--line-soft)' : 'none',
              borderTop:'3px solid ' + it.color,
            }}>
              <div style={_envCardLabel}>{it.lbl}</div>
              <div style={Object.assign({}, _envCardValue, { color: it.color })}>{it.val}</div>
              <div style={{ fontSize:13, color:'var(--fg-0)', marginTop:6 }}>{it.sub}</div>
            </div>
          ))}
        </div>
        <div style={{
          padding:'14px 20px', background:'oklch(0.32 0.06 78 / 0.18)',
          borderTop:'1px solid var(--warn)', borderLeft:'4px solid var(--warn)',
        }}>
          <div style={Object.assign({}, _envBody, { fontWeight: 600 })}>
            ⚠ 原水進場溫度 {intakeLo}–{intakeHi}°C 高於櫻花鉤吻鮭可接受範圍。
            所有進場水必須先經冷卻系統，依各養殖階段目標溫度供水。
          </div>
        </div>
      </section>

      {/* ─── B · 各階段水溫對照 ──────────────────────────────── */}
      <section className="panel" style={{ padding:0 }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
          <div style={_envSecMeta}>B · 各階段水溫對照 · Stage Temperature Map</div>
          <div style={_envH2Section}>進水 → 各階段目標水溫</div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-1)' }}>
              <th style={_envTh}>養殖階段</th>
              <th style={_envTh}>目標溫度</th>
              <th style={_envTh}>目前溫度</th>
              <th style={_envTh}>判斷狀態</th>
              <th style={Object.assign({}, _envTh, { textAlign:'left' })}>建議動作</th>
            </tr>
          </thead>
          <tbody>
            <_StageRow stageZh="孵化槽 Hatch" stageId="INC" tankRange="I1–I7（7 槽 · 待啟用）"
              targetLo={incTemp[0]} targetHi={incTemp[1]}
              intakeLo={intakeLo} intakeHi={intakeHi}
              level="danger"
              suggestion="孵化期使用時需每日確認低溫是否穩定"
              note="目前因冷卻能力上限，孵化槽尚未啟用魚卵入場。" />
            <_StageRow stageZh="小魚池 Nursery" stageId="NUR" tankRange="A1–A6（6 池 · 目前主要階段）"
              targetLo={nurTemp[0]} targetHi={nurTemp[1]}
              intakeLo={intakeLo} intakeHi={intakeHi}
              level="warn"
              suggestion="目前主力階段，需優先監測"
              note="4,200 尾在此；目標 15–18°C 與冷卻系統穩定區接近。" />
            <_StageRow stageZh="中魚池 Juvenile" stageId="JUV" tankRange="J1–J2（2 池 · 待啟用）"
              targetLo={juvTemp[0]} targetHi={juvTemp[1]}
              intakeLo={intakeLo} intakeHi={intakeHi}
              level="ok"
              suggestion="移入前確認水溫與魚體適應"
              note="待小魚池魚體達 20 cm+ 後啟用。" />
            <_StageRow stageZh="大魚池 Grow-out" stageId="GRO" tankRange="B1–B4（4 池待確認 · 待啟用）"
              targetLo={null} targetHi={null}
              intakeLo={intakeLo} intakeHi={intakeHi}
              level="info"
              suggestion="此階段以環境適應為主，不主動降溫"
              note="採自然溫度馴化，測試魚隻是否能逐步適應馬來西亞當地日夜溫差與自然環境。" />
          </tbody>
        </table>
      </section>

      {/* ─── C · 控制邏輯（NEW）──────────────────────────────── */}
      <section className="panel" style={{ padding:0 }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
          <div style={_envSecMeta}>C · 控制邏輯 · Control Strategy</div>
          <div style={_envH2Section}>同一系統，依池別設定不同溫度</div>
        </div>
        <div style={{ padding:'20px 24px' }}>
          <p style={Object.assign({}, _envBody, { marginBottom:18, maxWidth:'85ch' })}>
            目前 Diamond Creeks 場域為<strong style={{ color:'var(--accent)' }}>單一冷卻系統</strong>，
            非分區獨立冷卻機。系統將原水降溫後，依各池目標水溫獨立調節供水溫度與流量；
            每池可設定不同目標，<strong style={{ color:'var(--ok)' }}>不需要為每池建獨立冷卻機</strong>。
          </p>

          {/* Visual flow */}
          <div style={{
            display:'grid', gridTemplateColumns:'200px 60px 1fr',
            gap:14, alignItems:'center', marginTop:10,
          }}>
            {/* Left: source */}
            <div style={{
              padding:'18px', textAlign:'center',
              background:'var(--bg-1)', border:'2px solid var(--danger)',
            }}>
              <div style={_envCardLabel}>原水 INTAKE</div>
              <div style={Object.assign({}, _envCardValue, { color:'var(--danger)' })}>
                {intakeLo}–{intakeHi} °C
              </div>
              <div style={{ fontSize:13, color:'var(--fg-0)', marginTop:6 }}>地下水 + 山泉</div>
            </div>

            {/* Middle: arrow + chiller */}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, color:'var(--accent)', fontWeight:800 }}>→</div>
              <div style={{
                marginTop:8, padding:'10px 6px',
                background:'var(--accent)', color:'var(--bg-0)',
                fontSize:13, fontWeight:700, lineHeight:1.3,
              }}>
                冷卻系統<br/>1 套
              </div>
              <div style={{ fontSize:32, color:'var(--accent)', fontWeight:800, marginTop:8 }}>→</div>
            </div>

            {/* Right: per-stage targets */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
              <_TargetCell stage="孵化槽" id="I1–I7" targetLo={incTemp[0]} targetHi={incTemp[1]} color="var(--accent)" />
              <_TargetCell stage="小魚池" id="A1–A6" targetLo={nurTemp[0]} targetHi={nurTemp[1]} color="var(--ok)" main />
              <_TargetCell stage="中魚池" id="J1–J2" targetLo={juvTemp[0]} targetHi={juvTemp[1]} color="var(--warn)" />
            </div>
          </div>

          <div style={{
            marginTop:18, padding:'14px 16px',
            background:'oklch(0.225 0.04 220 / 0.30)',
            border:'1px solid var(--accent)', borderLeft:'4px solid var(--accent)',
          }}>
            <div style={Object.assign({}, _envBody, { fontWeight:600 })}>
              💡 控制邏輯說明
            </div>
            <ul style={Object.assign({}, _envBody, {
              margin:'8px 0 0', paddingLeft:24, fontSize:15,
            })}>
              <li>每池透過獨立溫控閥 / 流量配比，達到該階段目標水溫。</li>
              <li>大魚池 Grow-out 不額外降溫，採進水自然溫度馴化。</li>
              <li>移池條件、各階段標準水溫由 Settings 管理（可即時調整 → TankCard / Dashboard 立即同步）。</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 冷卻負載判斷 (NEW, between C & D) ──────────────── */}
      <_CoolingLoadSection />

      {/* ─── D · 實際設備清單 ────────────────────────────────── */}
      <section className="panel" style={{ padding:0 }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
          <div style={_envSecMeta}>D · 實際設備清單 · Equipment Inventory</div>
          <div style={_envH2Section}>目前已建置與待補設備（含能力 vs 需求）</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)' }}>
          {[
            { lbl:'冷卻系統',     en:'Chiller / Cooling',  val:'1 套',       status:'已建置',  color:'var(--ok)',
              note:'單一冷卻系統，依池別獨立配水控溫；非分區獨立冷卻機。',
              capLabel:'部分足夠 Partial', capColor:'var(--warn)',
              capText:'目前可應付 Nursery；若 Hatch + Nursery 同時啟用需再確認容量' },
            { lbl:'循環水系統',   en:'RAS · Recirculating', val:'已建置',     status:'已建置',  color:'var(--ok)',
              note:'水體回收降低用水成本與排放。',
              capLabel:'足夠 OK', capColor:'var(--ok)',
              capText:'可支援目前小魚池循環需求' },
            { lbl:'IoT 自動監測',  en:'IoT Sensors',        val:'尚未導入',   status:'待導入',  color:'var(--warn)',
              note:'目前以人工紀錄為主；08 人工紀錄頁支援水質、餵食、死亡、操作、魚數盤點。',
              capLabel:'不足 Missing', capColor:'var(--danger)',
              capText:'目前不足，需人工紀錄補足；建議優先導入水溫與 DO 感測' },
            { lbl:'備用電源',     en:'Backup Power',       val:'柴油 2 台',  status:'已建置',  color:'var(--ok)',
              note:'雙台柴油發電機，停電時依序切換。',
              capLabel:'足夠 OK', capColor:'var(--ok)',
              capText:'可支援停電時基本維持冷卻系統與曝氣運作' },
            { lbl:'光照 / 孵化輔助', en:'Lighting & Hatch', val:'部分建置',   status:'部分',    color:'var(--warn)',
              note:'孵化區光週期管理待補；其他池採自然光 + 遮蔽。',
              capLabel:'部分足夠 Partial', capColor:'var(--warn)',
              capText:'孵化使用時需確認光照與水流穩定' },
          ].map((it, i, arr) => (
            <div key={i} style={{
              padding:'18px 20px',
              borderRight: i % 2 === 0 ? '1px solid var(--line-soft)' : 'none',
              borderBottom: i < arr.length - 2 ? '1px solid var(--line-soft)' : (i === arr.length - 1 && arr.length % 2 === 1 ? 'none' : '1px solid var(--line-soft)'),
            }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                <span style={{ fontSize:18, fontWeight:700, color:'var(--fg-0)' }}>{it.lbl}</span>
                <span style={{ fontSize:13, color:'var(--fg-0)' }}>{it.en}</span>
                <span style={{ flex:1 }} />
                <span style={{
                  fontSize:13, fontWeight:700,
                  padding:'3px 10px', border:'1px solid '+it.color, color: it.color,
                }}>{it.status}</span>
              </div>
              <div style={Object.assign({}, _envCardValue, { color:it.color, marginTop:8 })}>
                {it.val}
              </div>
              <div style={Object.assign({}, _envBody, { fontSize:14, marginTop:8, lineHeight:1.55 })}>
                {it.note}
              </div>
              {/* Capability vs Need (NEW) */}
              <div style={{
                marginTop:12, padding:'10px 12px',
                background:'var(--bg-1)', borderLeft:'3px solid '+it.capColor,
              }}>
                <div style={{
                  fontSize:12, fontWeight:700, color:'var(--accent)',
                  letterSpacing:0.10, textTransform:'uppercase',
                }}>能力 vs 需求 · Capability vs Need</div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6 }}>
                  <span style={{
                    fontSize:13, fontWeight:700, color: it.capColor,
                    padding:'3px 10px', border:'1px solid '+it.capColor,
                  }}>{it.capLabel}</span>
                  <span style={Object.assign({}, _envBody, { fontSize:14, flex:1 })}>{it.capText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 人力與操作需求 (NEW, between D & E) ─────────────── */}
      <_ManpowerSection />

      {/* ─── E · 廠區條件 (簡化) ─────────────────────────────── */}
      <section className="panel" style={{ padding:0 }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
          <div style={_envSecMeta}>E · 廠區條件 · Facility Conditions</div>
          <div style={_envH2Section}>場域基本環境</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)' }}>
          {[
            { lbl:'外氣溫範圍', val:'18 – 30 °C', note:'熱帶氣候，日夜溫差約 5–10°C' },
            { lbl:'光照條件',   val:'自然光照',    note:'孵化區光週期管理待補；其他池採自然光 + 遮蔽' },
            { lbl:'監測方式',   val:'人工為主',    note:'IoT 待導入，現由現場人員依採樣頻率紀錄' },
          ].map((it, i) => (
            <div key={i} style={{
              padding:'18px 20px',
              borderRight: i < 2 ? '1px solid var(--line-soft)' : 'none',
            }}>
              <div style={_envCardLabel}>{it.lbl}</div>
              <div style={_envCardValue}>{it.val}</div>
              <div style={Object.assign({}, _envBody, { fontSize:14, marginTop:6 })}>
                {it.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 主要風險提醒 (NEW, page bottom) ─────────────────── */}
      <_RiskAlertsSection />
    </div>
  );
}

// ─── EnvironmentPage helpers ─────────────────────────────────
const _envTh = {
  fontSize:14, fontWeight:700, color:'var(--fg-0)',
  textAlign:'center', padding:'12px 14px',
  borderBottom:'1px solid var(--line)',
};
const _envTd = {
  fontSize:15, color:'var(--fg-0)', padding:'14px',
  borderBottom:'1px solid var(--line-soft)', verticalAlign:'top',
};

function _StageRow({ stageZh, stageId, tankRange, targetLo, targetHi, intakeLo, intakeHi, level, note, suggestion }) {
  const levelCfg = ({
    danger: { color:'var(--danger)', text:'需大幅降溫' },
    warn:   { color:'var(--warn)',   text:'適量降溫' },
    ok:     { color:'var(--accent)', text:'微調或自然降溫' },
    info:   { color:'var(--fg-0)',   text:'依現場設定' },
  })[level] || { color:'var(--fg-0)', text:'—' };

  const targetText = (targetLo == null || targetHi == null)
    ? '自然馴化'
    : targetLo + '–' + targetHi + ' °C';

  // ─── Compute current temp from latest water logs in this stage ───
  const liveAvg = stageId ? _avgLatestTemp(stageId) : null;
  // ─── Judgement & current cell ───
  let currentText, judgeText, judgeColor;
  if (targetLo == null) {
    // Grow-out — no target, no auto judgement
    currentText = '待確認';
    judgeText = '待啟用';
    judgeColor = 'var(--fg-0)';
  } else if (!liveAvg) {
    currentText = '待輸入';
    judgeText = '待監測';
    judgeColor = 'var(--accent)';
  } else {
    currentText = liveAvg.avg.toFixed(1) + ' °C';
    if (liveAvg.avg < targetLo) {
      judgeText = '過冷'; judgeColor = 'var(--accent)';
    } else if (liveAvg.avg > targetHi) {
      judgeText = '需降溫'; judgeColor = 'var(--danger)';
    } else {
      judgeText = '正常'; judgeColor = 'var(--ok)';
    }
  }

  return (
    <tr style={{ borderTop:'1px solid var(--line-soft)' }}>
      <td style={_envTd}>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--fg-0)' }}>{stageZh}</div>
        <div style={{ fontSize:13, color:'var(--fg-0)', marginTop:3, fontFamily:'var(--font-mono)' }}>
          {tankRange}
        </div>
      </td>
      <td style={Object.assign({}, _envTd, { textAlign:'center' })}>
        <div style={{ fontSize:18, fontWeight:700, color: levelCfg.color, fontFamily:'var(--font-mono)' }}>
          {targetText}
        </div>
      </td>
      <td style={Object.assign({}, _envTd, { textAlign:'center' })}>
        <div style={{
          fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)',
          color: judgeColor,
        }}>{currentText}</div>
        {liveAvg ? (
          <div style={{ fontSize:11, color:'var(--fg-0)', marginTop:2, fontFamily:'var(--font-mono)' }}>
            {liveAvg.n} / {liveAvg.totalTanks} 池有紀錄
          </div>
        ) : null}
      </td>
      <td style={Object.assign({}, _envTd, { textAlign:'center' })}>
        <div style={{
          display:'inline-block', padding:'4px 12px',
          fontSize:14, fontWeight:700, color: judgeColor,
          border:'1px solid ' + judgeColor,
        }}>{judgeText}</div>
        <div style={{ fontSize:11, color:'var(--fg-0)', marginTop:4, fontFamily:'var(--font-mono)' }}>
          進水 {intakeLo}–{intakeHi}°C · {levelCfg.text}
        </div>
      </td>
      <td style={Object.assign({}, _envTd, { fontSize:14, lineHeight:1.55 })}>
        {suggestion ? (
          <div style={{ fontWeight:600, color:'var(--fg-0)' }}>{suggestion}</div>
        ) : null}
        {note ? (
          <div style={{ fontSize:12, color:'var(--fg-0)', marginTop:4, fontStyle:'italic' }}>
            {note}
          </div>
        ) : null}
      </td>
    </tr>
  );
}

// ─── Helper: average latest water temp across a stage ───────
function _avgLatestTemp(stageId) {
  if (!window.LogStore || !window.AQUA_DATA) return null;
  const tanks = (window.AQUA_DATA.TANKS || []).filter(t => t.stage === stageId);
  const temps = [];
  tanks.forEach(t => {
    const lc = window.LogStore.latest('water', t.id);
    if (lc && lc.data && lc.data.temp != null) temps.push(lc.data.temp);
  });
  if (temps.length === 0) return null;
  return {
    avg: temps.reduce((a, b) => a + b, 0) / temps.length,
    n: temps.length,
    totalTanks: tanks.length,
  };
}

// ─── Today's Decision Summary (4 cards under Hero) ──────────
function _EnvSummaryCard() {
  const sp = (window.AQUA_DATA && window.AQUA_DATA.SITE_PROFILE) || {};
  const intakeLo = (sp.intakeTempRange && sp.intakeTempRange[0]) || 20;
  const intakeHi = (sp.intakeTempRange && sp.intakeTempRange[1]) || 26;
  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const nursTanks   = tanks.filter(t => t.stage === 'NUR');
  const nursActive  = nursTanks.filter(t => (t.countStatus || '') !== 'pending').length;
  const nursFishCnt = nursTanks.reduce((s, t) => s + (t.currentFishCount || 0), 0);

  const cards = [
    { lbl:'原水狀態 INTAKE',    val: intakeLo + '–' + intakeHi + ' °C', sub:'高於冷水魚需求', color:'var(--danger)' },
    { lbl:'冷卻依賴 RELIANCE',  val:'高 HIGH',                         sub:'孵化槽與小魚池需依賴降溫設備', color:'var(--warn)' },
    { lbl:'目前主要負載 LOAD',  val:'小魚池 Nursery',                   sub: nursActive + ' 池 / ' + nursFishCnt.toLocaleString() + ' 尾 / 15–18°C', color:'var(--ok)' },
    { lbl:'系統結論 STATUS',    val:'可運作',                           sub:'高度依賴冷卻系統與人工紀錄', color:'var(--warn)' },
  ];

  return (
    <section className="panel" style={{ padding:0 }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
        <div style={_envSecMeta}>今日環境判斷 · Today's Decision Summary</div>
        <div style={_envH2Section}>場域整體狀況一覽</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)' }}>
        {cards.map((it, i) => (
          <div key={i} style={{
            padding:'18px 18px',
            borderRight: i < 3 ? '1px solid var(--line-soft)' : 'none',
            borderTop:'4px solid ' + it.color,
          }}>
            <div style={_envCardLabel}>{it.lbl}</div>
            <div style={Object.assign({}, _envCardValue, { color: it.color })}>{it.val}</div>
            <div style={{ fontSize:13, color:'var(--fg-0)', marginTop:6, lineHeight:1.5 }}>{it.sub}</div>
          </div>
        ))}
      </div>
      <div style={{
        padding:'14px 20px', borderTop:'1px solid var(--line-soft)', background:'var(--bg-1)',
      }}>
        <p style={Object.assign({}, _envBody, { margin:0, maxWidth:'90ch' })}>
          目前 Diamond Creeks 原水溫度高於櫻花鉤吻鮭需求，系統必須透過<strong style={{ color:'var(--accent)' }}>單一冷卻系統</strong>，
          依不同池別設定供水溫度。目前主要養殖負載集中於<strong style={{ color:'var(--ok)' }}>小魚池</strong>，
          IoT 尚未導入前需依靠<strong style={{ color:'var(--warn)' }}>人工巡檢與紀錄</strong>。
        </p>
      </div>
    </section>
  );
}

// ─── Cooling Load Section (between C & D) ───────────────────
function _CoolingLoadSection() {
  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
  const cool = (stage) => tanks.filter(t => t.stage === stage && (t.countStatus || '') !== 'pending').length;
  const incActive = cool('INC');
  const nurActive = cool('NUR');
  const juvActive = cool('JUV');
  // GRO is excluded (natural acclimatization)
  const totalCooling = incActive + nurActive + juvActive;

  let level, color, label;
  if (totalCooling === 0) { level='Low'; color='var(--ok)'; label='低 Low'; }
  else if (totalCooling <= 6) { level='Medium'; color='var(--warn)'; label='中 Medium'; }
  else { level='High'; color='var(--danger)'; label='高 High'; }

  return (
    <section className="panel" style={{ padding:0 }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
        <div style={_envSecMeta}>冷卻負載判斷 · Cooling Load</div>
        <div style={_envH2Section}>目前冷卻系統承載評估</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr' }}>
        {/* Big indicator */}
        <div style={{
          padding:'24px 24px',
          borderRight:'1px solid var(--line-soft)',
          background:'oklch(0.225 0.04 220 / 0.20)',
        }}>
          <div style={_envCardLabel}>目前冷卻負載 LEVEL</div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:48, fontWeight:800,
            color: color, marginTop:6, lineHeight:1.05,
          }}>{label}</div>
          <div style={{ fontSize:14, color:'var(--fg-0)', marginTop:6, lineHeight:1.5 }}>
            <strong>{totalCooling}</strong> 個池槽需要冷卻
          </div>
          <div style={{ fontSize:13, color:'var(--fg-0)', marginTop:8, fontStyle:'italic' }}>
            主要負載：{nurActive > 0 ? '小魚池 Nursery' : (incActive > 0 ? '孵化槽 Hatch' : '無')}
          </div>
        </div>

        {/* Per-stage breakdown */}
        <div style={{ padding:'18px 22px' }}>
          <div style={Object.assign({}, _envCardLabel, { marginBottom:10 })}>各階段冷卻負載</div>
          {[
            { id:'INC', zh:'孵化槽 Hatch',     active: incActive, total: tanks.filter(t=>t.stage==='INC').length, target:'7–10°C',   color:'var(--accent)' },
            { id:'NUR', zh:'小魚池 Nursery',   active: nurActive, total: tanks.filter(t=>t.stage==='NUR').length, target:'15–18°C',  color:'var(--ok)' },
            { id:'JUV', zh:'中魚池 Juvenile',  active: juvActive, total: tanks.filter(t=>t.stage==='JUV').length, target:'20–23°C',  color:'var(--warn)' },
            { id:'GRO', zh:'大魚池 Grow-out',  active: 0,         total: tanks.filter(t=>t.stage==='GRO').length, target:'自然馴化', color:'var(--fg-0)', exempt:true },
          ].map(s => (
            <div key={s.id} style={{
              display:'grid', gridTemplateColumns:'180px 90px 100px 1fr', gap:12,
              alignItems:'center', padding:'8px 0',
              borderBottom:'1px solid var(--line-soft)',
            }}>
              <span style={{ fontSize:14, fontWeight:700, color: s.color }}>{s.zh}</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:600 }}>
                {s.active} / {s.total} 池
              </span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--fg-0)' }}>{s.target}</span>
              {s.exempt ? (
                <span style={{ fontSize:13, color:'var(--accent)', fontWeight:600 }}>
                  ⓘ 不納入冷卻負載（自然馴化）
                </span>
              ) : s.active > 0 ? (
                <span style={{ fontSize:13, color: s.color, fontWeight:700 }}>● 需要冷卻</span>
              ) : (
                <span style={{ fontSize:13, color:'var(--fg-0)' }}>○ 待啟用，暫不需冷卻</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding:'14px 20px', borderTop:'1px solid var(--line-soft)',
        background:'oklch(0.32 0.06 78 / 0.12)',
      }}>
        <p style={Object.assign({}, _envBody, { margin:0, maxWidth:'90ch' })}>
          ⚠ 目前冷卻負載主要來自 <strong style={{ color:'var(--ok)' }}>{nurActive} 個小魚池</strong>。
          若未來孵化槽（7 槽）與小魚池同時運作，冷卻負載將升高至 <strong style={{ color:'var(--danger)' }}>High</strong>，
          需確認冷卻系統容量與備援能力。
        </p>
      </div>
    </section>
  );
}

// ─── Manpower & Operation Section (between D & E) ───────────
function _ManpowerSection() {
  const rows = [
    { task:'水質人工紀錄', freq:'每日 / 每池',         status:'需要', note:'IoT 尚未導入前，水溫、DO、pH、NH₃、NO₂ 需人工輸入' },
    { task:'餵食紀錄',     freq:'每日',                status:'需要', note:'需記錄飼料種類與餵食量（08 人工紀錄 → 餵食 tab）' },
    { task:'死亡紀錄',     freq:'每日巡檢',            status:'需要', note:'需記錄死亡數量與原因（08 人工紀錄 → 死亡 tab）' },
    { task:'設備巡檢',     freq:'每日',                status:'需要', note:'冷卻系統、循環水、發電機需定期確認' },
    { task:'移池判斷',     freq:'每週 / 魚體成長檢查', status:'需要', note:'依平均體長與 Settings 設定判斷是否移池' },
  ];

  return (
    <section className="panel" style={{ padding:0 }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
        <div style={_envSecMeta}>人力與操作需求 · Manpower &amp; Operations</div>
        <div style={_envH2Section}>IoT 導入前的人工流程</div>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ background:'var(--bg-1)' }}>
            <th style={Object.assign({}, _envTh, { textAlign:'left', width:200 })}>項目</th>
            <th style={Object.assign({}, _envTh, { width:200 })}>頻率</th>
            <th style={Object.assign({}, _envTh, { width:120 })}>目前狀態</th>
            <th style={Object.assign({}, _envTh, { textAlign:'left' })}>備註</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.task} style={{ borderTop:'1px solid var(--line-soft)' }}>
              <td style={Object.assign({}, _envTd, { fontWeight:700, fontSize:16 })}>{r.task}</td>
              <td style={Object.assign({}, _envTd, { textAlign:'center', fontFamily:'var(--font-mono)' })}>{r.freq}</td>
              <td style={Object.assign({}, _envTd, { textAlign:'center' })}>
                <span style={{
                  display:'inline-block', padding:'4px 12px',
                  fontSize:13, fontWeight:700, color:'var(--warn)',
                  border:'1px solid var(--warn)',
                }}>{r.status}</span>
              </td>
              <td style={Object.assign({}, _envTd, { fontSize:14 })}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{
        padding:'14px 20px', borderTop:'1px solid var(--line-soft)',
        background:'oklch(0.32 0.06 78 / 0.12)',
      }}>
        <p style={Object.assign({}, _envBody, { margin:0, fontWeight:600 })}>
          ⚠ 在 IoT 設備導入前，本系統的可靠性取決於現場人員是否穩定完成人工紀錄。
        </p>
      </div>
    </section>
  );
}

// ─── Risk Alerts Section (page bottom) ──────────────────────
function _RiskAlertsSection() {
  const risks = [
    { id:1, title:'原水溫度高',     risk:'若冷卻失效，Hatch / Nursery 將快速受影響', plan:'冷卻設備每日巡檢，備用電需保持可用',  color:'var(--danger)' },
    { id:2, title:'IoT 尚未導入',    risk:'水質異常可能延遲發現',                     plan:'人工紀錄需固定頻率執行（採樣頻率設定）', color:'var(--warn)' },
    { id:3, title:'Grow-out 尚未驗證', risk:'魚隻能否適應自然溫度仍待確認',          plan:'移入前需分批測試，不可一次大量移入',   color:'var(--warn)' },
    { id:4, title:'魚數仍為估算',    risk:'死亡率與存活率可能不精準',                 plan:'定期魚數盤點（08 人工紀錄 → 魚數盤點）',  color:'var(--warn)' },
  ];

  return (
    <section className="panel" style={{ padding:0 }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
        <div style={Object.assign({}, _envSecMeta, { color:'var(--danger)' })}>目前主要風險 · Active Risks</div>
        <div style={_envH2Section}>系統風險提醒與對策</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)' }}>
        {risks.map((r, i) => (
          <div key={r.id} style={{
            padding:'18px 20px',
            borderRight: i % 2 === 0 ? '1px solid var(--line-soft)' : 'none',
            borderBottom: i < 2 ? '1px solid var(--line-soft)' : 'none',
            borderLeft:'4px solid ' + r.color,
          }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
              <span style={{
                fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700,
                color: r.color, padding:'2px 10px', border:'1px solid '+r.color,
              }}>RISK · {r.id}</span>
              <span style={{ fontSize:18, fontWeight:700, color:'var(--fg-0)' }}>{r.title}</span>
            </div>
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--fg-0)', textTransform:'uppercase', letterSpacing:0.06 }}>風險 RISK</div>
              <div style={Object.assign({}, _envBody, { marginTop:3 })}>{r.risk}</div>
            </div>
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:0.06 }}>對策 PLAN</div>
              <div style={Object.assign({}, _envBody, { marginTop:3 })}>{r.plan}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function _TargetCell({ stage, id, targetLo, targetHi, color, main }) {
  return (
    <div style={{
      padding:'12px 14px', textAlign:'center',
      background: main ? 'oklch(0.32 0.06 165 / 0.12)' : 'var(--bg-1)',
      border:'2px solid ' + color,
    }}>
      <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-0)' }}>
        {stage}{main ? <span style={{ marginLeft:6, fontSize:11, color, fontWeight:700 }}>主要</span> : null}
      </div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-0)', marginTop:2 }}>
        {id}
      </div>
      <div style={{
        fontFamily:'var(--font-mono)', fontSize:18, fontWeight:700,
        color: color, marginTop:8,
      }}>
        {targetLo}–{targetHi} °C
      </div>
    </div>
  );
}

/* ====================================================================
   PAGE 03 · WORKFLOW — cultivation pipe + batches
   ==================================================================== */
function WorkflowPage() {
  return (
    <div className="page-fade">
      {/* TIMELINE OVERVIEW */}
      <section className="psection" style={{ marginTop: 0 }}>
        <div className="psec-head">
          <div><span className="psec-num">A</span><span className="psec-zh">養殖階段時程</span><span className="psec-en">Cultivation Timeline</span></div>
          <span className="psec-meta">~14 MONTHS · INCUBATION → MARKET</span>
        </div>
        <div className="stage-timeline">
          <div className="stl-bar">
            <div className="stl-seg stl-inc" style={{ width: '15%' }}><span>孵化槽 Hatch</span></div>
            <div className="stl-seg stl-nur" style={{ width: '30%' }}><span>小魚池 Nursery</span></div>
            <div className="stl-seg stl-juv" style={{ width: '25%' }}><span>中魚池 Juvenile</span></div>
            <div className="stl-seg stl-gro" style={{ width: '30%' }}><span>大魚池 Grow-out</span></div>
          </div>
          <div className="stl-axis">
            <span>0 月</span><span>1.5 月</span><span>4 月</span><span>8 月</span><span>14 月</span>
          </div>
          <div className="stl-meta">
            <span>受精卵 · Egg</span>
            <span>體長 ~3 cm · 1 g</span>
            <span>體長 ~12 cm · 30 g</span>
            <span>體長 ~25 cm · 250 g</span>
            <span>上市 ~600 g</span>
          </div>
        </div>
      </section>

      {/* RICH STAGE CARDS */}
      <section className="psection">
        <div className="psec-head">
          <div><span className="psec-num">B</span><span className="psec-zh">各階段需求詳情</span><span className="psec-en">Per-Stage Requirements</span></div>
          <span className="psec-meta">PURPOSE · WATER · EQUIPMENT · MONITORING · TRANSFER</span>
        </div>
        <div className="stage-cards">
          {[
            {
              code: 'STAGE 01 · HATCH', zh: '孵化槽', en: 'Hatch / Incubation',
              tempLo: '7', tempHi: '10', do: '≥ 9.0', dur: '30 – 45 天 / days',
              tankCount: '7 槽 · I1–I7', density: '依批次', biomass: '已孵化完成 · 目前 0 尾',
              cls: 'inc',
              purposeZh: '受精卵孵化、卵黃囊吸收，需穩定低溫管理。整個養殖計畫第一關鍵階段。',
              purposeEn: 'Egg incubation and yolk-sac absorption — most critical low-temp stage.',
              equipment: ['7 個孵化槽（已建置）', '降溫至 7–10°C 供水', '低水量持續流動', '光週期管理（建議 12L:12D）'],
              monitoring: ['水溫 ±1°C', '溶氧 / DO', '死卵檢查 · 每日', '人工紀錄為主'],
              transfer: '達 3 cm 開口攝食 → 移入小魚池',
              transferEn: 'Reach 3 cm + first feeding → move to Nursery',
              risks: '原水降溫不足 / 溫度震盪',
            },
            {
              code: 'STAGE 02 · NURSERY', zh: '小魚池', en: 'Nursery (目前主要階段)',
              tempLo: '15', tempHi: '17', do: '≥ 8.0', dur: '60 – 120 天 / days',
              tankCount: '6 池 · A1–A6', density: '估算', biomass: '4,200 尾 · 每池約 700 尾',
              cls: 'nur',
              purposeZh: '小魚培育，馬來西亞氣候馴化過渡階段。每日紀錄死亡、餵食、水溫、水質。',
              purposeEn: 'Nursery phase aligned with cooled water 15–18°C — main active stage.',
              equipment: ['6 池 A1–A6（使用中）', '降溫供水 15–17°C', '高溶氧供應', '人工餵食 · 每日'],
              monitoring: ['溫度 / DO / pH · 每 60 分鐘', 'NH₃ · NO₂ 每日人工', '死亡 · 餵食 · 每餐', '魚數盤點 · 每週'],
              transfer: '達 20 cm+ → 移入中魚池 (Settings 可調)',
              transferEn: 'Reach 20 cm+ → move to Juvenile (configurable)',
              risks: '熱緊迫 / 馴化失敗 / 細菌感染',
            },
            {
              code: 'STAGE 03 · JUVENILE', zh: '中魚池', en: 'Juvenile',
              tempLo: '20', tempHi: '23', do: '≥ 7.0', dur: '90 – 180 天 / days',
              tankCount: '2 池 · J1–J2', density: '待啟用', biomass: '0 尾 · 待啟用',
              cls: 'juv',
              purposeZh: '溫度漸進升溫適應，為移入大池做準備。',
              purposeEn: 'Gradual temperature ramp-up acclimatization, prep for grow-out.',
              equipment: ['2 池 J1–J2（待啟用）', '溫度控制 20–23°C', '完整水質監測', '光週期 12L:12D'],
              monitoring: ['溫度 / DO / pH', '人工紀錄', '體長 · 每 2 週', '行為觀察'],
              transfer: '管理者依現場狀況設定移入大池條件',
              transferEn: 'Manager-defined conditions for transfer to Grow-out',
              risks: '升溫過快 / 溫度震盪',
            },
            {
              code: 'STAGE 04 · GROW-OUT', zh: '大魚池', en: 'Grow-out',
              tempLo: '依現場', tempHi: '設定', do: '≥ 6.5', dur: '長期 / Long-term',
              tankCount: '4 池 · B1–B4 (待確認)', density: '待啟用', biomass: '0 尾 · 待啟用',
              cls: 'gro',
              purposeZh: '長期育成，適應馬來西亞當地自然環境與日夜溫差。能穩定轉入大池並適應，即代表場域馴化進入關鍵成果階段。',
              purposeEn: 'Long-term grow-out, adapt to local Malaysia climate and diurnal temp range.',
              equipment: ['4 池 B1–B4（待確認 / 待啟用）', '依當地環境設定', '空池水質監測準備中', '低密度起始'],
              monitoring: ['全水質 · 死亡 · 體重', '人工紀錄為主', '長期適應觀察', '日夜溫差紀錄'],
              transfer: '不再轉池；達上市規格進入收成程序',
              transferEn: 'No further transfer; harvest when ready',
              risks: '日夜溫差 / 雨季氣溫震盪 / 環境適應失敗',
            },
          ].map(s => (
            <div key={s.code} className={`stage-card stage-card-${s.cls}`}>
              <div className="sc-rib">
                <span className="sc-rib-code">{s.code}</span>
                <span className="sc-rib-cls"></span>
              </div>
              <div className="sc-title">
                <div>
                  <div className="sc-zh">{s.zh}</div>
                  <div className="sc-en">{s.en}</div>
                </div>
                <div className="sc-temp-block">
                  <span className="sc-temp-val">{s.tempLo}–{s.tempHi}</span>
                  <span className="sc-temp-u">°C</span>
                </div>
              </div>
              <div className="sc-purpose">
                <div className="sc-lbl">目的 PURPOSE</div>
                <div className="sc-purpose-zh">{s.purposeZh}</div>
                <div className="sc-purpose-en">{s.purposeEn}</div>
              </div>
              <div className="sc-quick">
                <div><span className="qk">時程</span><span className="qv">{s.dur}</span></div>
                <div><span className="qk">DO</span><span className="qv">{s.do} mg/L</span></div>
                <div><span className="qk">池數</span><span className="qv">{s.tankCount}</span></div>
                <div><span className="qk">密度</span><span className="qv">{s.density}</span></div>
                <div><span className="qk">族群</span><span className="qv">{s.biomass}</span></div>
                <div><span className="qk risk">風險</span><span className="qv risk">{s.risks}</span></div>
              </div>
              <div className="sc-grid">
                <div className="sc-col">
                  <div className="sc-lbl">設備 EQUIPMENT</div>
                  <ul>{s.equipment.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
                <div className="sc-col">
                  <div className="sc-lbl">監測 MONITORING</div>
                  <ul>{s.monitoring.map((m, i) => <li key={i}>{m}</li>)}</ul>
                </div>
              </div>
              <div className="sc-transfer">
                <span className="sc-lbl">轉池條件 TRANSFER →</span>
                <span className="sc-transfer-zh">{s.transfer}</span>
                <span className="sc-transfer-en">{s.transferEn}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BATCH PANEL */}
      <section className="psection">
        <div className="psec-head">
          <div><span className="psec-num">C</span><span className="psec-zh">在養批次與適應計畫</span><span className="psec-en">Active Batches & Adaptation Plans</span></div>
          <span className="psec-meta">REAL-TIME · BATCH TRACKING</span>
        </div>
        <BatchPanel />
      </section>
    </div>
  );
}

/* ====================================================================
   PAGE 04 · DEVICES — IoT device management
   ==================================================================== */
function DevicesPage() {
  return (
    <div className="page-fade">
      <section className="psection" style={{ marginTop: 0 }}>
        <div className="psec-head">
          <div><span className="psec-num">A</span><span className="psec-zh">IoT 設備管理</span><span className="psec-en">IoT Device Management</span></div>
          <span className="psec-meta">23/26 ONLINE · 5 GATEWAYS</span>
        </div>
        <DeviceMgmtPanel />
      </section>
    </div>
  );
}

/* ====================================================================
   PAGE 05 · MONITORING — real-time dashboard (was the original)
   filtered by stage sub-nav
   ==================================================================== */
const STAGE_FILTER = {
  all: null,
  incubation: ['INC'],
  nursery: ['NUR'],
  juvenile: ['JUV'],
  growout: ['GRO'],
};
const STAGE_TANK_PREFIX = {
  // most projects don't have stage tag; map by id prefix as fallback
  incubation: ['I'],
  nursery: ['A'],
  juvenile: ['J'],
  growout: ['B'],
};

function filterTanksByStage(tanks, sub) {
  if (!sub || sub === 'all') return tanks;
  const stages = STAGE_FILTER[sub];
  const prefixes = STAGE_TANK_PREFIX[sub];
  return tanks.filter(t => {
    if (stages && t.stage && stages.some(s => String(t.stage).toUpperCase().includes(s))) return true;
    if (prefixes && prefixes.some(p => t.id && t.id.startsWith(p))) return true;
    return false;
  });
}

function MonitoringPage({ sub, selectedTank, setSelectedTank, setDrawerTank }) {
  const allTanks = AQUA_DATA.TANKS;
  const tanks = filterTanksByStage(allTanks, sub);
  const alerts = AQUA_DATA.ALERTS;
  // Make sure selected tank is in this view
  const selected = tanks.find(t => t.id === selectedTank) ? selectedTank : (tanks[0] && tanks[0].id);

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AlertBanner alerts={alerts} onTank={setDrawerTank} />

      <div className="row-2">
        <TankGrid
          tanks={tanks}
          selectedId={selected}
          onSelect={(t) => { setSelectedTank(t.id); setDrawerTank(t.id); }}
        />
        <AlertPanel alerts={alerts} onTank={setDrawerTank} />
      </div>

      <MonitorPanel tanks={tanks} selectedId={selected} onSelect={setSelectedTank} />

      {sub === 'all' ? (
        <>
          <SciencePanel />
          {typeof ExperimentPanel !== 'undefined' ? <ExperimentPanel /> : null}
          <div className="row-2">
            <LogsPanel />
            <AnalyticsPanel />
          </div>
        </>
      ) : (
        <div className="row-2">
          <LogsPanel />
          <AnalyticsPanel />
        </div>
      )}
    </div>
  );
}

/* ====================================================================
   PAGE 06 · ANALYTICS
   ==================================================================== */
function AnalyticsPage() {
  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SciencePanel />
      {typeof ExperimentPanel !== 'undefined' ? <ExperimentPanel /> : null}
      <AnalyticsPanel />
    </div>
  );
}

/* ====================================================================
   PAGE 07 · REPORTS — placeholder
   ==================================================================== */
function ReportsPage() {
  return (
    <div className="page-fade">
      <div className="placeholder">
        <div className="ph-icon">[ 07 ]</div>
        <div className="ph-zh">報表中心</div>
        <div className="ph-en-text">REPORTS · GENERATE & EXPORT</div>
        <div className="ph-note">
          產出每日/每週/每月運轉報表、實驗結果摘要、稽核紀錄。<br/>
          Generate daily / weekly / monthly operational reports,
          experiment summaries, and audit logs. Module pending integration.
        </div>
      </div>
    </div>
  );
}

/* ====================================================================
   PAGE 08 · SETTINGS — placeholder
   ==================================================================== */
function SettingsPage() {
  return (
    <div className="page-fade">
      <div className="placeholder">
        <div className="ph-icon">[ 08 ]</div>
        <div className="ph-zh">系統設定</div>
        <div className="ph-en-text">SYSTEM SETTINGS</div>
        <div className="ph-note">
          使用者權限、警報閾值、感測器校正、資料留存週期、整合金鑰管理。<br/>
          User permissions, alarm thresholds, sensor calibration, data
          retention, and integration keys.
        </div>
      </div>
    </div>
  );
}

window.OverviewPage = OverviewPage;
window.EnvironmentPage = EnvironmentPage;
window.WorkflowPage = WorkflowPage;
window.DevicesPage = DevicesPage;
window.MonitoringPage = MonitoringPage;
window.AnalyticsPage = AnalyticsPage;
window.ReportsPage = ReportsPage;
window.SettingsPage = SettingsPage;
