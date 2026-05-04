/* global React */
const { useMemo } = React;

// Build a smooth path with thresholds. domain auto from values + thresholds.
function LineChart({ values, times, thresholds, color = 'var(--accent)', height = 110, padX = 4, yPad = 6, labelFmt }) {
  const w = 100; // viewBox units (we scale via width:100%)
  const h = 100;
  const ys = values;
  const flatBands = [thresholds.danger?.[0], thresholds.danger?.[1], thresholds.warn?.[0], thresholds.warn?.[1]].filter(v => Number.isFinite(v));
  const dataMin = Math.min(...ys, ...flatBands);
  const dataMax = Math.max(...ys, ...flatBands);
  const min = dataMin - (dataMax - dataMin) * 0.12;
  const max = dataMax + (dataMax - dataMin) * 0.12;
  const span = max - min || 1;
  const x = i => padX + (i / (ys.length - 1)) * (w - padX * 2);
  const y = v => yPad + (1 - (v - min) / span) * (h - yPad * 2);

  const path = ys.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  const area = `${path} L${x(ys.length - 1).toFixed(2)},${(h - yPad).toFixed(2)} L${x(0).toFixed(2)},${(h - yPad).toFixed(2)} Z`;

  const last = ys[ys.length - 1];

  // x-axis ticks: every 4 hours = every 16 points
  const ticks = [];
  for (let i = 0; i < ys.length; i += 16) {
    const d = new Date(times[i]);
    ticks.push({ i, label: `${String(d.getHours()).padStart(2, '0')}:00` });
  }

  return (
    <div className="chart-svg-wrap" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* horizontal grid */}
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1={padX} x2={w - padX} y1={yPad + p * (h - yPad * 2)} y2={yPad + p * (h - yPad * 2)}
                stroke="var(--line-soft)" strokeWidth="0.3" strokeDasharray="0.6 0.8" vectorEffect="non-scaling-stroke" />
        ))}
        {/* threshold bands */}
        {thresholds.warn && (
          <>
            <line x1={padX} x2={w - padX} y1={y(thresholds.warn[1])} y2={y(thresholds.warn[1])}
                  stroke="var(--warn)" strokeWidth="0.4" strokeDasharray="1.5 1.2" vectorEffect="non-scaling-stroke" opacity="0.7" />
            <line x1={padX} x2={w - padX} y1={y(thresholds.warn[0])} y2={y(thresholds.warn[0])}
                  stroke="var(--warn)" strokeWidth="0.4" strokeDasharray="1.5 1.2" vectorEffect="non-scaling-stroke" opacity="0.7" />
          </>
        )}
        {thresholds.danger && (
          <>
            <line x1={padX} x2={w - padX} y1={y(thresholds.danger[1])} y2={y(thresholds.danger[1])}
                  stroke="var(--danger)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" opacity="0.85" />
            <line x1={padX} x2={w - padX} y1={y(thresholds.danger[0])} y2={y(thresholds.danger[0])}
                  stroke="var(--danger)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" opacity="0.85" />
          </>
        )}
        {/* area fill */}
        <path d={area} fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, '')})`} />
        {/* line */}
        <path d={path} fill="none" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {/* current dot */}
        <circle cx={x(ys.length - 1)} cy={y(last)} r="1.4" fill={color} />
        <circle cx={x(ys.length - 1)} cy={y(last)} r="2.6" fill={color} opacity="0.25" />
      </svg>
      {/* x labels */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--fg-3)',
        marginTop: 2, paddingLeft: 4, paddingRight: 4, letterSpacing: 0.04,
      }}>
        {ticks.map(t => <span key={t.i}>{t.label}</span>)}
        <span>now</span>
      </div>
    </div>
  );
}

function Spark({ values, color = 'var(--accent)', height = 32 }) {
  const w = 100, h = 30, pad = 2;
  const min = Math.min(...values), max = Math.max(...values), span = (max - min) || 1;
  const x = i => pad + (i / (values.length - 1)) * (w - pad * 2);
  const y = v => pad + (1 - (v - min) / span) * (h - pad * 2);
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="1.2" fill={color} />
    </svg>
  );
}

window.LineChart = LineChart;
window.Spark = Spark;
