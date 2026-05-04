/* global React, AQUA_DATA, Ic, LineChart */
const { useState: useStateE, useMemo: useMemoE } = React;

// Experiments — scientific research feel
const EXPERIMENTS = [
  {
    id: 'EXP-26-007', zh: '低溫適應上限試驗', en: 'Cold-water Adaptation Ceiling',
    pi: 'Dr. 林宏明 / Dr. H.M. Lin', start: '2026-04-01', day: 33, totalDays: 60,
    status: 'running',
    hypothesis: '櫻鱒於 11.0–12.5°C 區間之 FCR 與 SGR 較 13.0°C 為佳。\nCherry salmon FCR & SGR are superior in 11.0–12.5°C vs 13.0°C.',
    arms: [
      { id: 'A', tank: 'A1', temp: 11.0, n: 8420, surv: 99.5, sgr: 1.42, fcr: 1.04, color: 'oklch(0.74 0.14 165)' },
      { id: 'B', tank: 'A2', temp: 11.5, n: 8180, surv: 99.2, sgr: 1.45, fcr: 1.06, color: 'oklch(0.72 0.13 225)' },
      { id: 'C', tank: 'A4', temp: 12.0, n: 8050, surv: 98.8, sgr: 1.51, fcr: 1.05, color: 'oklch(0.78 0.13 78)'  },
      { id: 'D', tank: 'A3', temp: 13.0, n: 7910, surv: 96.2, sgr: 1.38, fcr: 1.18, color: 'oklch(0.66 0.21 25)'  },
    ],
    primary: 'SGR · 特殊生長率',
    notes: 'Arm D 顯示溫度 ≥13°C 後 SGR 衰退、FCR 上升。建議 D7 後降溫至 12.0°C。',
  },
  {
    id: 'EXP-26-004', zh: '飼料粒徑對成長影響', en: 'Pellet Size vs Growth',
    pi: '楊乃文 / Y. Nai-Wen', start: '2026-03-12', day: 53, totalDays: 90,
    status: 'running',
    hypothesis: '4.5mm 粒徑於 GRO 階段 FCR 較 3.5mm 為佳。',
    arms: [
      { id: 'A', tank: 'B1', temp: 10.4, n: 5240, surv: 97.4, sgr: 1.18, fcr: 1.08, color: 'oklch(0.74 0.14 165)' },
      { id: 'B', tank: 'B3', temp: 10.7, n: 5180, surv: 97.5, sgr: 1.21, fcr: 1.05, color: 'oklch(0.72 0.13 225)' },
    ],
    primary: 'FCR · 飼料效率',
    notes: '初期數據傾向 4.5mm 略佳，待 D60 完成終量測。',
  },
  {
    id: 'EXP-26-001', zh: '孵化光週期試驗', en: 'Hatchery Photoperiod',
    pi: '陳秀美 / S.M. Chen', start: '2026-01-08', day: 116, totalDays: 60,
    status: 'completed',
    hypothesis: '12L:12D 較 24L 連續光照之孵化率為佳。',
    arms: [
      { id: 'A', tank: 'I1', temp: 7.5, n: 12000, surv: 98.1, sgr: null, fcr: null, color: 'oklch(0.74 0.14 165)' },
      { id: 'B', tank: 'I2', temp: 7.5, n: 9000,  surv: 96.8, sgr: null, fcr: null, color: 'oklch(0.66 0.21 25)' },
    ],
    primary: '孵化率 Hatch %',
    notes: '結論：12L:12D 顯著優於 24L (p < 0.05)。',
  },
];

function ExperimentCard({ e }) {
  const progressPct = Math.min(100, (e.day / e.totalDays) * 100);
  const statusCol = e.status === 'running' ? 'var(--accent)' : e.status === 'completed' ? 'var(--ok)' : 'var(--fg-3)';
  return (
    <div style={{ border: '1px solid var(--line-soft)', background: 'var(--bg-2)' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-soft)', display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', gap: 14, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600 }}>{e.id}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: 0.10, textTransform: 'uppercase',
              padding: '1px 6px', border: `1px solid ${statusCol}`, color: statusCol,
            }}>{e.status === 'running' ? '進行中 RUNNING' : e.status === 'completed' ? '完成 DONE' : e.status.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 12.5, marginTop: 3 }}>{e.zh} <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>· {e.en}</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 3 }}>PI · {e.pi}</div>
        </div>
        <div>
          <div className="kpi-label">起始 START</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, marginTop: 2 }}>{e.start}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>D{e.day} / D{e.totalDays}</div>
        </div>
        <div>
          <div className="kpi-label">主要指標 PRIMARY</div>
          <div style={{ fontSize: 12.5, marginTop: 2 }}>{e.primary}</div>
        </div>
        <div>
          <div className="kpi-label">進度 PROGRESS</div>
          <div style={{ height: 6, background: 'var(--bg-3)', marginTop: 6, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: `${progressPct}%`, background: statusCol }}></div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 3 }}>{progressPct.toFixed(0)}%</div>
        </div>
      </div>
      <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-2)', letterSpacing: 0.04 }}>
          <span style={{ color: 'var(--fg-3)' }}>假設 H₁ ·</span> {e.hypothesis}
        </div>
        <table className="log-table" style={{ fontSize: 10.5 }}>
          <thead>
            <tr>
              <th>組 ARM</th>
              <th>魚池 TANK</th>
              <th>條件 TEMP</th>
              <th>n</th>
              <th>存活 SURV</th>
              <th>SGR %/d</th>
              <th>FCR</th>
            </tr>
          </thead>
          <tbody>
            {e.arms.map(a => (
              <tr key={a.id}>
                <td><span style={{
                  display: 'inline-block', width: 14, height: 14, lineHeight: '14px',
                  textAlign: 'center', background: a.color, color: 'oklch(0.15 0.01 240)',
                  fontWeight: 700, marginRight: 6,
                }}>{a.id}</span>{a.id}</td>
                <td style={{ fontWeight: 600 }}>{a.tank}</td>
                <td>{a.temp}°C</td>
                <td>{a.n.toLocaleString()}</td>
                <td style={{ color: a.surv >= 98 ? 'var(--ok)' : a.surv >= 96 ? 'var(--warn)' : 'var(--danger)' }}>{a.surv.toFixed(1)}%</td>
                <td>{a.sgr != null ? a.sgr.toFixed(2) : '—'}</td>
                <td style={{ color: a.fcr != null && a.fcr >= 1.15 ? 'var(--warn)' : 'var(--fg-1)' }}>{a.fcr != null ? a.fcr.toFixed(2) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {e.notes ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-2)', borderTop: '1px dashed var(--line-soft)', paddingTop: 8 }}>
            <span style={{ color: 'var(--fg-3)' }}>觀察 NOTES ·</span> {e.notes}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ExperimentPanel() {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">研究試驗 <span style={{ color: 'var(--fg-3)' }}>· EXPERIMENTS</span> <span className="count">{EXPERIMENTS.length}</span></span>
        <div className="panel-actions">
          <div className="seg">
            <button className="active">全 ALL</button>
            <button>進行中 RUN</button>
            <button>完成 DONE</button>
          </div>
          <button className="btn-mini"><Ic name="plus" size={11} /> 新試驗 NEW EXP</button>
        </div>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EXPERIMENTS.map(e => <ExperimentCard key={e.id} e={e} />)}
      </div>
    </section>
  );
}

// Multi-tank temperature comparison
function MultiTankCompare() {
  const tanks = ['A1', 'A2', 'A3', 'A4'];
  const colors = ['oklch(0.74 0.14 165)', 'oklch(0.72 0.13 225)', 'oklch(0.66 0.21 25)', 'oklch(0.78 0.13 78)'];
  const seriesAll = tanks.map(id => AQUA_DATA.TANK_SERIES[id].temp);
  const t = AQUA_DATA.TANK_SERIES.A1.t;

  const w = 100, h = 50, padX = 4, padY = 4;
  const flat = seriesAll.flat();
  const min = Math.min(...flat) - 0.4, max = Math.max(...flat) + 0.4;
  const span = max - min;
  const x = i => padX + (i / (t.length - 1)) * (w - padX * 2);
  const y = v => padY + (1 - (v - min) / span) * (h - padY * 2);

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span className="chart-title">多池水溫比較 · MULTI-TANK TEMP · 24h</span>
        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
          {tanks.map((id, i) => (
            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>
              <span style={{ width: 12, height: 2, background: colors[i] }}></span>
              <span>{id}</span>
              <span style={{ color: 'var(--fg-3)' }}>{AQUA_DATA.TANKS.find(x => x.id === id).temp.toFixed(1)}°C</span>
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 140 }}>
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1={padX} x2={w - padX} y1={padY + p * (h - padY * 2)} y2={padY + p * (h - padY * 2)}
                stroke="var(--line-soft)" strokeWidth="0.3" strokeDasharray="0.6 0.8" vectorEffect="non-scaling-stroke" />
        ))}
        <line x1={padX} x2={w - padX} y1={y(14)} y2={y(14)}
              stroke="var(--warn)" strokeWidth="0.4" strokeDasharray="1.5 1.2" vectorEffect="non-scaling-stroke" opacity="0.7" />
        <line x1={padX} x2={w - padX} y1={y(15)} y2={y(15)}
              stroke="var(--danger)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" opacity="0.85" />
        {seriesAll.map((s, i) => (
          <path key={i} d={s.map((v, j) => `${j === 0 ? 'M' : 'L'}${x(j).toFixed(2)},${y(v).toFixed(2)}`).join(' ')}
                fill="none" stroke={colors[i]} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--fg-3)', marginTop: 2 }}>
        <span>−24h</span><span>−18h</span><span>−12h</span><span>−6h</span><span>now</span>
      </div>
    </div>
  );
}

// DO vs Mortality correlation scatter
function CorrelationScatter() {
  const points = [
    // {tank, doO (mg/L), mortality (24h)}
    { id: 'A1', x: 9.4, y: 2,  s: 'ok' },
    { id: 'A2', x: 9.1, y: 4,  s: 'ok' },
    { id: 'A3', x: 7.8, y: 12, s: 'warn' },
    { id: 'A4', x: 9.2, y: 3,  s: 'ok' },
    { id: 'B1', x: 8.9, y: 5,  s: 'ok' },
    { id: 'B2', x: 5.8, y: 31, s: 'danger' },
    { id: 'B3', x: 8.6, y: 6,  s: 'ok' },
    { id: 'B4', x: 7.4, y: 14, s: 'warn' },
    { id: 'C1', x: 9.7, y: 0,  s: 'ok' },
    { id: 'C2', x: 9.5, y: 1,  s: 'ok' },
    { id: 'Q1', x: 8.4, y: 8,  s: 'warn' },
  ];
  const w = 100, h = 60, padL = 8, padR = 4, padT = 4, padB = 8;
  const xMin = 5, xMax = 10, yMin = 0, yMax = 35;
  const sx = v => padL + ((v - xMin) / (xMax - xMin)) * (w - padL - padR);
  const sy = v => padT + (1 - (v - yMin) / (yMax - yMin)) * (h - padT - padB);
  const col = s => s === 'danger' ? 'var(--danger)' : s === 'warn' ? 'var(--warn)' : 'var(--ok)';

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <span className="chart-title">水質與斃死關聯 · DO vs MORTALITY</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginLeft: 'auto' }}>
          r = −0.86 · n=11
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 160 }}>
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line key={'h'+p} x1={padL} x2={w - padR} y1={padT + p * (h - padT - padB)} y2={padT + p * (h - padT - padB)}
                stroke="var(--line-soft)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line key={'v'+p} y1={padT} y2={h - padB} x1={padL + p * (w - padL - padR)} x2={padL + p * (w - padL - padR)}
                stroke="var(--line-soft)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        {/* danger zones */}
        <rect x={sx(xMin)} y={padT} width={sx(7) - sx(xMin)} height={h - padT - padB}
              fill="oklch(0.66 0.21 25)" opacity="0.06" />
        <rect x={padL} y={sy(20)} width={w - padL - padR} height={sy(yMin) - sy(20)}
              fill="oklch(0.66 0.21 25)" opacity="0.06" />
        {/* trendline */}
        <line x1={sx(5)} y1={sy(34)} x2={sx(10)} y2={sy(0)} stroke="var(--accent)" strokeWidth="0.4" strokeDasharray="1.5 1.2" vectorEffect="non-scaling-stroke" opacity="0.6" />
        {points.map(p => (
          <g key={p.id}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r="1.6" fill={col(p.s)} />
            <text x={sx(p.x) + 2.2} y={sy(p.y) + 0.8} fontSize="2.4" fill="var(--fg-2)" fontFamily="ui-monospace, monospace">{p.id}</text>
          </g>
        ))}
        {/* axis labels */}
        <text x={padL} y={h - 1} fontSize="2.6" fill="var(--fg-3)" fontFamily="ui-monospace, monospace">5</text>
        <text x={w - padR - 2} y={h - 1} fontSize="2.6" fill="var(--fg-3)" fontFamily="ui-monospace, monospace">10</text>
        <text x={1} y={padT + 2} fontSize="2.6" fill="var(--fg-3)" fontFamily="ui-monospace, monospace">35</text>
        <text x={1} y={h - padB} fontSize="2.6" fill="var(--fg-3)" fontFamily="ui-monospace, monospace">0</text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 3 }}>
        <span>溶氧 DO (mg/L) →</span>
        <span>↑ 斃死 MORTALITY (24h)</span>
      </div>
    </div>
  );
}

function SciencePanel() {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">科學分析 <span style={{ color: 'var(--fg-3)' }}>· SCIENTIFIC ANALYSIS</span></span>
        <div className="panel-actions">
          <div className="seg">
            <button>24h</button>
            <button className="active">7d</button>
            <button>30d</button>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 0 }}>
        <div style={{ borderRight: '1px solid var(--line-soft)' }}>
          <MultiTankCompare />
        </div>
        <div>
          <CorrelationScatter />
        </div>
      </div>
    </section>
  );
}

window.ExperimentPanel = ExperimentPanel;
window.SciencePanel = SciencePanel;
