/* global React, AQUA_DATA, Ic, Bi, L, LineChart, Spark */
const { useState: useStateM, useMemo: useMemoM } = React;

function ChartCell({ title, titleZh, unit, values, times, thresholds, color, current }) {
  return (
    <div className="chart-cell">
      <div className="chart-head">
        <div>
          <div className="chart-title">{titleZh} · {title}</div>
          <div className="chart-meta">
            <span><span className="lbl">最低 MIN</span>{Math.min(...values).toFixed(2)}</span>
            <span><span className="lbl">最高 MAX</span>{Math.max(...values).toFixed(2)}</span>
          </div>
        </div>
        <div className="chart-now">{current}<span className="unit">{unit}</span></div>
      </div>
      <LineChart values={values} times={times} thresholds={thresholds} color={color} />
      <div className="threshold-legend">
        <span><span className="swatch line"></span>實時 LIVE</span>
        <span><span className="swatch warn"></span>警告 WARN</span>
        <span><span className="swatch danger"></span>危險 DANGER</span>
      </div>
    </div>
  );
}

function MonitorPanel({ tanks, selectedId, onSelect }) {
  const series = AQUA_DATA.TANK_SERIES[selectedId];
  const tank = tanks.find(t => t.id === selectedId);
  const th = AQUA_DATA.TANK_THRESHOLDS;
  return (
    <section className="panel charts-area">
      <div className="panel-head">
        <span className="panel-title">即時監測 <span style={{ color: 'var(--fg-3)' }}>· REAL-TIME · 24h</span></span>
        <div className="panel-actions">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 0.08, marginRight: 4 }}>魚池 TANK</span>
          <div className="seg" style={{ flexWrap: 'wrap' }}>
            {tanks.map(t => (
              <button key={t.id} className={selectedId === t.id ? 'active' : ''} onClick={() => onSelect(t.id)}
                      style={t.status === 'danger' ? { color: 'var(--danger)' } : t.status === 'warn' ? { color: 'var(--warn)' } : null}>
                {t.id}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="charts-row">
        <ChartCell titleZh="水溫" title="WATER TEMP" unit="°C"
                   values={series.temp} times={series.t} thresholds={th.temp}
                   color="oklch(0.78 0.13 78)" current={tank.temp.toFixed(1)} />
        <ChartCell titleZh="溶氧" title="DISSOLVED O₂" unit="mg/L"
                   values={series.doO} times={series.t} thresholds={th.do}
                   color="oklch(0.72 0.13 225)" current={tank.doO.toFixed(1)} />
        <ChartCell titleZh="酸鹼值" title="pH" unit=""
                   values={series.ph} times={series.t} thresholds={th.ph}
                   color="oklch(0.74 0.14 165)" current={tank.ph.toFixed(2)} />
      </div>
    </section>
  );
}

window.MonitorPanel = MonitorPanel;
