/* global React, AQUA_DATA, Ic */
const { useState: useStateB } = React;

function StageBar({ current }) {
  const stages = AQUA_DATA.STAGES.filter(s => s.id !== 'BRO');
  const idx = stages.findIndex(s => s.id === current);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 0, border: '1px solid var(--line-soft)' }}>
      {stages.map((s, i) => {
        const done = i < idx, here = i === idx;
        return (
          <div key={s.id} style={{
            padding: '8px 10px', borderRight: i < stages.length - 1 ? '1px solid var(--line-soft)' : 'none',
            background: here ? 'var(--bg-3)' : 'var(--bg-2)',
            borderTop: here ? '2px solid var(--accent)' : `2px solid ${done ? 'var(--ok)' : 'transparent'}`,
            opacity: !done && !here ? 0.55 : 1,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--fg-3)', letterSpacing: 0.10, textTransform: 'uppercase' }}>
              {String(i + 1).padStart(2, '0')} · {s.tempRange[0]}–{s.tempRange[1]}°C
            </div>
            <div style={{ fontSize: 12.5, marginTop: 3, color: here ? 'var(--fg-0)' : 'var(--fg-1)', fontWeight: here ? 600 : 400 }}>{s.zh}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>{s.en}</div>
          </div>
        );
      })}
    </div>
  );
}

function AdaptationChart({ plan, current }) {
  const w = 100, h = 60, pad = 4;
  const min = Math.min(current, ...plan.map(p => p.target)) - 0.5;
  const max = Math.max(current, ...plan.map(p => p.target)) + 0.3;
  const span = max - min || 1;
  const xs = plan.length;
  const x = i => pad + (i / Math.max(1, xs)) * (w - pad * 2);
  const y = v => pad + (1 - (v - min) / span) * (h - pad * 2);
  const path = plan.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i + 1)},${y(p.target)}`).join(' ');
  const fullPath = `M${x(0)},${y(current)} ${path}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 80 }}>
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={pad} x2={w - pad} y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)}
              stroke="var(--line-soft)" strokeWidth="0.3" strokeDasharray="0.6 0.8" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={fullPath} fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="2 1" vectorEffect="non-scaling-stroke" />
      {plan.map((p, i) => (
        <circle key={i} cx={x(i + 1)} cy={y(p.target)} r="1.2" fill="var(--accent)" />
      ))}
      <circle cx={x(0)} cy={y(current)} r="1.6" fill="var(--ok)" />
    </svg>
  );
}

function BatchCard({ b, expanded, onToggle }) {
  const stage = AQUA_DATA.STAGES.find(s => s.id === b.stage);
  const survival = ((b.current / b.initial) * 100).toFixed(1);
  const riskColor = b.adaptation.risk === 'high' ? 'var(--danger)' : b.adaptation.risk === 'med' ? 'var(--warn)' : 'var(--ok)';
  return (
    <div style={{ border: '1px solid var(--line-soft)', background: 'var(--bg-2)' }}>
      <div onClick={onToggle} style={{
        padding: '12px 14px', display: 'grid',
        gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr 24px',
        gap: 14, alignItems: 'center', cursor: 'pointer',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600 }}>{b.id}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-1)' }}>{b.zh} <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{b.en}</span></div>
        </div>
        <div>
          <div className="kpi-label">階段 STAGE</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{stage.zh} <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{stage.en}</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 1 }}>{b.daysInStage}d in stage</div>
        </div>
        <div>
          <div className="kpi-label">魚池 TANK</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, marginTop: 2 }}>{b.tank}</div>
        </div>
        <div>
          <div className="kpi-label">魚數 / 存活 COUNT / SURV</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, marginTop: 2 }}>{b.current.toLocaleString()} <span style={{ color: 'var(--fg-3)', fontSize: 11 }}>/ {b.initial.toLocaleString()}</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ok)' }}>{survival}%</div>
        </div>
        <div>
          <div className="kpi-label">適應風險 ADAPT RISK</div>
          <div style={{
            display: 'inline-block', marginTop: 3, padding: '2px 8px',
            border: `1px solid ${riskColor}`, color: riskColor,
            fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: 0.08, textTransform: 'uppercase',
          }}>{b.adaptation.risk === 'high' ? '高 HIGH' : b.adaptation.risk === 'med' ? '中 MED' : '低 LOW'}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>
            {b.adaptation.current.toFixed(1)}°C → {b.adaptation.target.toFixed(1)}°C · {b.adaptation.dailyStep}°C/d
          </div>
        </div>
        <div style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 16, textAlign: 'right' }}>{expanded ? '−' : '+'}</div>
      </div>

      {expanded ? (
        <div style={{ borderTop: '1px solid var(--line-soft)', padding: '14px', background: 'var(--bg-1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div className="drawer-section-title">階段進程 <span className="en">STAGE PIPELINE</span></div>
            <StageBar current={b.stage} />

            <div className="drawer-section-title" style={{ marginTop: 14 }}>移池紀錄 <span className="en">TRANSFER HISTORY</span></div>
            <div style={{ border: '1px solid var(--line-soft)' }}>
              <table className="log-table" style={{ fontSize: 10.5 }}>
                <thead>
                  <tr><th>日期 DATE</th><th>從→至 FROM→TO</th><th>階段 STAGE</th><th>數 COUNT</th><th>備註 NOTE</th></tr>
                </thead>
                <tbody>
                  {b.history.map((h, i) => (
                    <tr key={i}>
                      <td>{h.date}</td>
                      <td><span style={{ color: 'var(--fg-3)' }}>{h.from}</span> → <span style={{ color: 'var(--fg-0)', fontWeight: 600 }}>{h.to}</span></td>
                      <td>{h.stage}</td>
                      <td>{h.count.toLocaleString()}</td>
                      <td style={{ color: 'var(--fg-2)' }}>{h.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="drawer-section-title">溫度適應計畫 <span className="en">TEMPERATURE ADAPTATION PLAN</span></div>
            <div style={{ border: '1px solid var(--line-soft)', padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div className="kpi-label">目前 CURRENT</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500 }}>{b.adaptation.current.toFixed(1)}<span style={{ fontSize: 11, color: 'var(--fg-3)', marginLeft: 2 }}>°C</span></div>
                </div>
                <div>
                  <div className="kpi-label">目標 TARGET</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: 'var(--accent)' }}>{b.adaptation.target.toFixed(1)}<span style={{ fontSize: 11, color: 'var(--fg-3)', marginLeft: 2 }}>°C</span></div>
                </div>
                <div>
                  <div className="kpi-label">日升 RAMP</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: riskColor }}>+{b.adaptation.dailyStep}<span style={{ fontSize: 11, color: 'var(--fg-3)', marginLeft: 2 }}>°C/d</span></div>
                </div>
              </div>
              <AdaptationChart plan={b.adaptation.plan} current={b.adaptation.current} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 4 }}>
                <span>D0</span>
                {b.adaptation.plan.map((p, i) => <span key={i}>D{p.day}</span>)}
              </div>
              {b.adaptation.risk === 'high' ? (
                <div style={{
                  marginTop: 10, padding: '8px 10px',
                  border: '1px solid var(--danger)', borderLeft: '3px solid var(--danger)',
                  background: 'oklch(0.32 0.10 25 / 0.18)',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--danger)', letterSpacing: 0.10, textTransform: 'uppercase', fontWeight: 600 }}>⚠ 風險警告 RISK WARNING</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-1)', marginTop: 3 }}>{b.riskNote || b.adaptation.riskNote}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button className="btn-mini btn-danger">減慢計畫 SLOW PLAN</button>
                    <button className="btn-mini">編輯 EDIT</button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)' }}>建議日升 ≤ 0.30°C · Recommended ramp ≤ 0.30°C/day</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BatchPanel() {
  const [open, setOpen] = useStateB('CS-25-11');
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">批次與成長階段 <span style={{ color: 'var(--fg-3)' }}>· BATCHES & GROWTH STAGES</span> <span className="count">{AQUA_DATA.BATCHES.length} 批</span></span>
        <div className="panel-actions">
          <button className="btn-mini"><Ic name="plus" size={11} /> 新批次 NEW BATCH</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14 }}>
        {AQUA_DATA.BATCHES.map(b => (
          <BatchCard key={b.id} b={b} expanded={open === b.id} onToggle={() => setOpen(open === b.id ? null : b.id)} />
        ))}
      </div>
    </section>
  );
}

window.BatchPanel = BatchPanel;
window.StageBar = StageBar;
