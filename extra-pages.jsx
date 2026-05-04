/* global React, AQUA_DATA, Ic, SciencePanel, ExperimentPanel, AnalyticsPanel */
const { useState: useStateXP, useEffect: useEffectXP } = React;

/* ========================================================================
   ANALYTICS PAGE
   8 analysis categories. Tabs across the top, each tab renders a panel
   with a few charts/tables. Long-term experimental data — this is the
   scientific heart of the project.
   ======================================================================== */

const ANALYTICS_TABS = [
  { id: 'growth',    num: 'A.01', zh: '成長分析',     en: 'Growth Analysis',
    desc: '體重、體長、SGR (特定成長率) 隨時間變化；按批次、池別、飼料配方分組比較。',
    descEn: 'Weight, length, SGR over time; grouped by batch, tank, feed formulation.' },
  { id: 'survival',  num: 'A.02', zh: '存活率分析',   en: 'Survival Analysis',
    desc: '各階段累積存活率、死亡原因分布、Kaplan-Meier 曲線。',
    descEn: 'Cumulative survival per stage, mortality cause distribution, K-M curves.' },
  { id: 'feed',      num: 'A.03', zh: '飼料效率',     en: 'Feed Efficiency',
    desc: 'FCR (飼料轉換比)、攝食率、餵食成本/公斤增重。',
    descEn: 'FCR, feeding rate, feed cost per kg of gain.' },
  { id: 'water',     num: 'A.04', zh: '水質趨勢',     en: 'Water Quality Trends',
    desc: '長期溫度、DO、pH、NH₃/NO₂ 趨勢，與成長/存活率交叉分析。',
    descEn: 'Long-term temp/DO/pH/NH₃ trends crossed with growth & survival.' },
  { id: 'energy',    num: 'A.05', zh: '能耗與成本',   en: 'Energy & Cost',
    desc: '冷卻機 kWh、純氧瓶用量、UV 燈時數、每公斤魚生產成本拆解。',
    descEn: 'Chiller kWh, O₂ usage, UV runtime, cost per kg of fish broken down.' },
  { id: 'experiments', num: 'A.06', zh: '在運試驗',   en: 'Active Experiments',
    desc: '溫度、飼料、密度、光照之 A/B 試驗，含對照組與顯著性檢定。',
    descEn: 'Temp / feed / density / photoperiod A/B trials with controls and stats.' },
  { id: 'incidents', num: 'A.07', zh: '事件分析',     en: 'Incident Analysis',
    desc: '警報頻率與根因分布、停機時間、解決時長 (MTTR)。',
    descEn: 'Alert frequency, root-cause distribution, downtime, MTTR.' },
  { id: 'forecast',  num: 'A.08', zh: '預測模型',     en: 'Forecasting',
    desc: '收成日預測、產量預估、未來 14 天水溫 / 水質模擬。',
    descEn: 'Harvest-date forecast, yield projection, 14-day water-quality simulation.' },
];

/* ---------- shared chart primitives ---------- */
function MiniLine({ values, height = 60, color = 'var(--accent)', fill = true, dashed = false, label = null }) {
  const w = 100, h = height, pad = 4;
  const min = Math.min(...values), max = Math.max(...values);
  const span = (max - min) || 1;
  const x = i => pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
  const y = v => pad + (1 - (v - min) / span) * (h - pad * 2);
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  const area = `${path} L${x(values.length - 1)},${h - pad} L${x(0)},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      {fill ? <path d={area} fill={color} fillOpacity="0.10" /> : null}
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={pad} x2={w - pad} y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)}
              stroke="var(--line-soft)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth="1.4"
            strokeDasharray={dashed ? '2 1.5' : null} vectorEffect="non-scaling-stroke" />
      {label ? <text x={w - pad - 1} y={pad + 6} textAnchor="end"
            fontFamily="var(--font-mono)" fontSize="6" fill="var(--fg-3)">{label}</text> : null}
    </svg>
  );
}

function HBars({ rows, valueKey = 'v', max = null, color = 'var(--accent)' }) {
  const m = max != null ? max : Math.max(...rows.map(r => r[valueKey]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 70px', alignItems: 'center', gap: 10, fontSize: 11.5 }}>
          <div style={{ color: 'var(--fg-1)' }}>{r.label}</div>
          <div style={{ height: 12, background: 'var(--bg-3)', position: 'relative', border: '1px solid var(--line-soft)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(r[valueKey] / m) * 100}%`, background: r.color || color, opacity: 0.85 }}></div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)', textAlign: 'right' }}>{r.display || r[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, labelEn, value, unit, delta, deltaSign = '+', accent = false, sub = null }) {
  return (
    <div style={{ padding: 14, border: '1px solid var(--line-soft)', background: accent ? 'var(--bg-2)' : 'var(--bg-1)' }}>
      <div className="kpi-label">{label} <span style={{ color: 'var(--fg-3)' }}>{labelEn}</span></div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 5 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: accent ? 'var(--accent)' : 'var(--fg-0)' }}>{value}</span>
        {unit ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{unit}</span> : null}
      </div>
      {delta ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: deltaSign === '+' ? 'var(--ok)' : 'var(--danger)', marginTop: 3 }}>
          {deltaSign === '+' ? '▲' : '▼'} {delta}
        </div>
      ) : null}
      {sub ? <div style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
}

/* ---------- A.01 GROWTH ---------- */
function GrowthAnalysis() {
  const weightCurve = [12, 18, 28, 42, 65, 95, 138, 195, 260, 330, 410, 490, 560, 615];
  const sgrSeries = [2.8, 2.6, 2.5, 2.4, 2.3, 2.2, 2.0, 1.9, 1.7, 1.6, 1.5, 1.4, 1.4, 1.3];
  const batches = [
    { label: 'CS-25-08', display: '1.62 g/d', v: 1.62, color: 'var(--ok)' },
    { label: 'CS-25-09', display: '1.51 g/d', v: 1.51, color: 'var(--ok)' },
    { label: 'CS-25-10', display: '1.42 g/d', v: 1.42, color: 'var(--accent)' },
    { label: 'CS-25-11', display: '1.18 g/d', v: 1.18, color: 'var(--warn)' },
    { label: 'CS-26-01', display: '0.42 g/d', v: 0.42, color: 'var(--fg-2)' },
  ];
  return (
    <div className="ana-grid">
      <div className="ana-card span-2">
        <div className="ana-card-head">體重成長曲線 <span className="en">WEIGHT GROWTH CURVE · 14 MONTHS</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={weightCurve} height={140} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>
            <span>M0 · 12g</span><span>M3</span><span>M6 · 95g</span><span>M9</span><span>M12 · 490g</span><span>M14 · 615g</span>
          </div>
        </div>
      </div>

      <div className="ana-card">
        <div className="ana-card-head">SGR · 特定成長率 <span className="en">SPECIFIC GROWTH RATE %/d</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={sgrSeries} height={140} color="var(--accent)" fill={false} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>
            預期 (Cherry salmon, 10°C): 2.4 → 1.2 %/d · 實測接近模型 ✓
          </div>
        </div>
      </div>

      <div className="ana-card">
        <div className="ana-card-head">批次成長率比較 <span className="en">PER-BATCH GROWTH RATE</span></div>
        <div style={{ padding: 14 }}>
          <HBars rows={batches} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 10 }}>
            CS-25-11 偏低 — 與目前進行中之溫度適應計畫有關。
          </div>
        </div>
      </div>

      <div className="ana-card">
        <div className="ana-card-head">每週採樣 <span className="en">WEEKLY SAMPLING (n=30 per tank)</span></div>
        <div style={{ padding: 0 }}>
          <table className="log-table">
            <thead>
              <tr><th>WEEK</th><th>BATCH</th><th>n</th><th>體重 g</th><th>體長 cm</th><th>K 因子</th></tr>
            </thead>
            <tbody>
              {[
                ['W42', 'CS-25-10', 30, '328 ± 24', '28.6 ± 1.2', '1.40'],
                ['W42', 'CS-25-11', 30, '142 ± 18', '21.4 ± 1.1', '1.45'],
                ['W41', 'CS-25-10', 30, '309 ± 22', '28.0 ± 1.1', '1.41'],
                ['W41', 'CS-25-11', 30, '128 ± 16', '20.6 ± 1.0', '1.46'],
                ['W40', 'CS-25-10', 30, '288 ± 20', '27.4 ± 1.0', '1.40'],
              ].map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- A.02 SURVIVAL ---------- */
function SurvivalAnalysis() {
  const survivalByStage = [
    { label: '孵化 INC', display: '88.5%', v: 88.5, color: 'var(--warn)' },
    { label: '小池 NUR', display: '94.2%', v: 94.2, color: 'var(--ok)' },
    { label: '中池 JUV', display: '97.1%', v: 97.1, color: 'var(--ok)' },
    { label: '大池 GRO', display: '99.0%', v: 99.0, color: 'var(--ok)' },
  ];
  const causes = [
    { label: '低溶氧 Hypoxia', display: '38%', v: 38, color: 'var(--danger)' },
    { label: '熱緊迫 Heat stress', display: '24%', v: 24, color: 'var(--warn)' },
    { label: '細菌感染 Bacterial', display: '14%', v: 14, color: 'var(--accent)' },
    { label: '原蟲 Protozoan', display: '9%',  v: 9,  color: 'var(--accent)' },
    { label: '物理損傷 Trauma', display: '8%',  v: 8,  color: 'var(--fg-2)' },
    { label: '不明 Unknown',   display: '7%',  v: 7,  color: 'var(--fg-3)' },
  ];
  const km = [100, 99.6, 99.2, 98.5, 98.0, 97.6, 97.4, 97.2, 97.0, 96.8, 96.6, 96.5, 96.4, 96.4];
  return (
    <div className="ana-grid">
      <div className="ana-card">
        <div className="ana-card-head">階段累積存活率 <span className="en">CUMULATIVE SURVIVAL BY STAGE</span></div>
        <div style={{ padding: 14 }}>
          <HBars rows={survivalByStage} max={100} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 10 }}>
            孵化階段為瓶頸 — 卵黃吸收期最敏感，目標 ≥ 92%。
          </div>
        </div>
      </div>

      <div className="ana-card">
        <div className="ana-card-head">死亡原因分布 <span className="en">MORTALITY CAUSE BREAKDOWN · 90d</span></div>
        <div style={{ padding: 14 }}>
          <HBars rows={causes} />
        </div>
      </div>

      <div className="ana-card span-2">
        <div className="ana-card-head">Kaplan-Meier 存活曲線 <span className="en">K-M CURVE · CS-25-10 BATCH</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={km} height={140} color="var(--ok)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>
            <span>D0 · 100%</span><span>D30 · 99.2%</span><span>D90 · 97.4%</span><span>D180 · 96.6%</span><span>D420 · 96.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- A.03 FEED ---------- */
function FeedAnalysis() {
  const fcrSeries = [1.18, 1.16, 1.14, 1.13, 1.12, 1.10, 1.09, 1.08];
  const feeds = [
    { label: 'Skretting Nutra-2.0', display: 'FCR 1.05', v: 1.05, color: 'var(--ok)' },
    { label: 'BioMar EFICO Sigma',  display: 'FCR 1.10', v: 1.10, color: 'var(--ok)' },
    { label: 'Cargill Salmofeed-3', display: 'FCR 1.18', v: 1.18, color: 'var(--accent)' },
    { label: 'Local · CSF-Mix',     display: 'FCR 1.32', v: 1.32, color: 'var(--warn)' },
  ];
  return (
    <div className="ana-grid">
      <div className="ana-card">
        <div className="ana-card-head">FCR 趨勢 <span className="en">FCR TREND · 8 WEEKS</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={fcrSeries} height={140} color="var(--accent)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ok)', marginTop: 6 }}>
            ▼ 1.18 → 1.08 · 飼料效率持續改善
          </div>
        </div>
      </div>

      <div className="ana-card">
        <div className="ana-card-head">飼料配方比較 <span className="en">FEED FORMULATION · FCR</span></div>
        <div style={{ padding: 14 }}>
          <HBars rows={feeds} max={1.5} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 10 }}>
            目前主用 Skretting Nutra-2.0，本地配方仍在試驗階段。
          </div>
        </div>
      </div>

      <div className="ana-card span-2">
        <div className="ana-card-head">餵食成本拆解 <span className="en">FEED COST BREAKDOWN · MYR/kg gain</span></div>
        <div style={{ padding: 0 }}>
          <table className="log-table">
            <thead>
              <tr><th>項目 ITEM</th><th>EN</th><th>單位 UNIT</th><th>用量 USE</th><th>單價 RATE</th><th>成本 COST (MYR/kg)</th></tr>
            </thead>
            <tbody>
              {[
                ['進口飼料', 'Imported feed', 'kg', '1.05', '11.20 MYR/kg', '11.76'],
                ['本地飼料', 'Local feed', 'kg', '0.18', '6.40 MYR/kg', '1.15'],
                ['維他命/添加', 'Vitamins / additives', 'g', '8.0', '0.04 MYR/g', '0.32'],
                ['冷藏保存', 'Cold storage', 'kWh', '0.4', '0.43 MYR/kWh', '0.17'],
                ['人工', 'Labor', 'min', '6', '0.85 MYR/min', '5.10'],
              ].map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} style={{ textAlign: j > 1 ? 'right' : 'left', fontFamily: j > 1 ? 'var(--font-mono)' : 'inherit' }}>{c}</td>)}</tr>
              ))}
              <tr style={{ background: 'var(--bg-2)', fontWeight: 600 }}>
                <td colSpan={5}>合計 TOTAL · 飼料端成本</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>18.50 MYR/kg</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- A.04 WATER ---------- */
function WaterAnalysis() {
  const tempSeries = [10.2, 10.4, 10.5, 10.3, 10.6, 11.2, 11.8, 11.4, 10.9, 10.7, 10.5, 10.4, 10.3, 10.5];
  const doSeries   = [9.2, 9.0, 8.8, 8.6, 8.5, 8.0, 7.6, 7.8, 8.4, 8.6, 8.7, 8.8, 8.9, 8.9];
  const phSeries   = [7.2, 7.2, 7.3, 7.3, 7.2, 7.1, 7.0, 7.0, 7.1, 7.2, 7.3, 7.3, 7.2, 7.2];
  const nh3Series  = [0.04, 0.05, 0.06, 0.05, 0.07, 0.10, 0.14, 0.12, 0.08, 0.06, 0.05, 0.04, 0.04, 0.05];
  return (
    <div className="ana-grid">
      <div className="ana-card">
        <div className="ana-card-head">水溫 14 日 <span className="en">TEMP · 14 DAYS</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={tempSeries} color="var(--accent)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>
            10.3 – 11.8°C · D6 高峰，與外氣 31°C 同步
          </div>
        </div>
      </div>
      <div className="ana-card">
        <div className="ana-card-head">溶氧 14 日 <span className="en">DO · 14 DAYS</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={doSeries} color="var(--ok)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warn)', marginTop: 6 }}>
            ▼ 7.6 mg/L · 已觸發 1 次警報
          </div>
        </div>
      </div>
      <div className="ana-card">
        <div className="ana-card-head">pH 14 日 <span className="en">pH · 14 DAYS</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={phSeries} color="var(--accent)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>
            7.0 – 7.3 · 穩定區間
          </div>
        </div>
      </div>
      <div className="ana-card">
        <div className="ana-card-head">氨氮 14 日 <span className="en">NH₃ · 14 DAYS</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={nh3Series} color="var(--warn)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warn)', marginTop: 6 }}>
            D7 觸頂 0.14 ppm · 已加大換水
          </div>
        </div>
      </div>

      <div className="ana-card span-2">
        <div className="ana-card-head">交叉分析 · 水溫 × 死亡率 <span className="en">CORRELATION · TEMP × MORTALITY</span></div>
        <div style={{ padding: 14, fontSize: 12, color: 'var(--fg-1)', lineHeight: 1.7 }}>
          過去 90 天，當日均溫 &gt; 11.5°C 時，次日死亡率上升 <strong style={{ color: 'var(--danger)' }}>2.4×</strong>。
          當 DO &lt; 7.5 mg/L 同時，死亡率上升 <strong style={{ color: 'var(--danger)' }}>4.8×</strong>。
          建議：當預報外氣 &gt; 28°C 時，提前 12h 啟動第三冷卻機。
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginTop: 8 }}>
            n=812 mortality events · Pearson r = 0.62 (temp), 0.74 (DO low) · p &lt; 0.001
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- A.05 ENERGY ---------- */
function EnergyAnalysis() {
  const energy = [
    { label: '冷卻機 Chillers', display: '1240 kWh', v: 1240, color: 'var(--accent)' },
    { label: '純氧供應 O₂',     display: '380 kWh',  v: 380,  color: 'var(--ok)' },
    { label: '循環泵 Pumps',     display: '320 kWh',  v: 320,  color: 'var(--accent)' },
    { label: 'UV 殺菌 UV',       display: '85 kWh',   v: 85,   color: 'var(--accent)' },
    { label: '照明 Lighting',    display: '42 kWh',   v: 42,   color: 'var(--fg-2)' },
    { label: '其他 Other',       display: '60 kWh',   v: 60,   color: 'var(--fg-3)' },
  ];
  return (
    <div className="ana-grid">
      <div className="ana-card span-2">
        <div className="ana-card-head">本月能耗結構 <span className="en">MONTHLY ENERGY MIX · 2127 kWh TOTAL</span></div>
        <div style={{ padding: 14 }}>
          <HBars rows={energy} />
        </div>
      </div>

      <div className="ana-card">
        <div className="ana-card-head">每公斤魚成本 <span className="en">COST / kg of fish</span></div>
        <div style={{ padding: 14, display: 'grid', gap: 8 }}>
          {[
            ['飼料 Feed',      '18.50 MYR'],
            ['電費 Power',      '6.20 MYR'],
            ['人工 Labor',      '4.80 MYR'],
            ['苗種 Fingerling', '3.50 MYR'],
            ['折舊 Depreciation','2.10 MYR'],
            ['其他 Other',      '1.40 MYR'],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: 6, borderBottom: '1px solid var(--line-soft)' }}>
              <span style={{ color: 'var(--fg-1)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-0)' }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
            <span>合計 TOTAL</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>36.50 MYR/kg</span>
          </div>
        </div>
      </div>

      <div className="ana-card">
        <div className="ana-card-head">純氧瓶用量 <span className="en">O₂ CYLINDER USAGE · 30d</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={[12, 11, 13, 14, 12, 11, 13, 12, 14, 15, 14, 13, 12, 12]} color="var(--ok)" height={120} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)', marginTop: 8 }}>
            <span>當月用量</span><span>184 瓶 · 50L</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>
            <span>每瓶成本</span><span>120 MYR</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- A.06 EXPERIMENTS ---------- */
function ExperimentsAnalysis() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {typeof ExperimentPanel !== 'undefined' ? <ExperimentPanel /> : null}
      {typeof SciencePanel !== 'undefined' ? <SciencePanel /> : null}
    </div>
  );
}

/* ---------- A.07 INCIDENTS ---------- */
function IncidentsAnalysis() {
  const causes = [
    { label: '溶氧低 DO low',        display: '24', v: 24, color: 'var(--danger)' },
    { label: '溫度偏高 Temp high',   display: '18', v: 18, color: 'var(--warn)' },
    { label: '感測器離線 Sensor off', display: '11', v: 11, color: 'var(--accent)' },
    { label: 'pH 偏移 pH drift',     display: '7',  v: 7,  color: 'var(--accent)' },
    { label: '冷卻機跳機 Chiller',    display: '4',  v: 4,  color: 'var(--danger)' },
    { label: '其他 Other',           display: '6',  v: 6,  color: 'var(--fg-3)' },
  ];
  return (
    <div className="ana-grid">
      <div className="ana-card">
        <div className="ana-card-head">事件根因 90 日 <span className="en">ROOT CAUSE · 90 DAYS</span></div>
        <div style={{ padding: 14 }}>
          <HBars rows={causes} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 10 }}>
            70 起事件 · DO low 仍為頭號議題
          </div>
        </div>
      </div>

      <div className="ana-card">
        <div className="ana-card-head">MTTR · 平均解決時間 <span className="en">MEAN TIME TO RESOLVE</span></div>
        <div style={{ padding: 14, display: 'grid', gap: 10 }}>
          <StatCard label="嚴重 CRITICAL" labelEn="" value="4.2" unit="min" delta="−1.1 vs Q3" deltaSign="+" accent />
          <StatCard label="警告 WARN" labelEn="" value="11.6" unit="min" delta="−0.4 vs Q3" deltaSign="+" />
          <StatCard label="資訊 INFO" labelEn="" value="38.2" unit="min" delta="+5.1 vs Q3" deltaSign="-" />
        </div>
      </div>

      <div className="ana-card span-2">
        <div className="ana-card-head">月度警報數 <span className="en">ALERT COUNT BY MONTH</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={[42, 38, 51, 28, 33, 22]} height={120} color="var(--warn)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>
            <span>2025-08</span><span>09</span><span>10</span><span>11</span><span>12</span><span>2026-01</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- A.08 FORECAST ---------- */
function ForecastAnalysis() {
  const tempForecast = [10.5, 10.6, 10.8, 11.2, 11.6, 11.9, 11.7, 11.3, 10.9, 10.7, 10.5, 10.6, 10.8, 11.0];
  return (
    <div className="ana-grid">
      <div className="ana-card span-2">
        <div className="ana-card-head">14 日水溫預測 <span className="en">14-DAY TEMP FORECAST · CAMERON-01</span></div>
        <div style={{ padding: 14 }}>
          <MiniLine values={tempForecast} height={140} color="var(--accent)" dashed />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>
            {Array.from({ length: 7 }, (_, i) => <span key={i}>D+{i * 2 + 1}</span>)}
          </div>
          <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--bg-2)', borderLeft: '3px solid var(--warn)', fontSize: 11.5, color: 'var(--fg-1)' }}>
            ⚠ D+5–D+6 預估 ≥ 11.8°C ，建議提前準備備用冷卻機 (CHL-03 standby)。
          </div>
        </div>
      </div>

      <div className="ana-card">
        <div className="ana-card-head">收成日預測 <span className="en">HARVEST-DATE FORECAST</span></div>
        <div style={{ padding: 14, display: 'grid', gap: 10 }}>
          {[
            ['CS-25-08', '2026-04-12', '590g', 'on-track'],
            ['CS-25-09', '2026-06-22', '585g', 'on-track'],
            ['CS-25-10', '2026-09-08', '600g', 'on-track'],
            ['CS-25-11', '2027-01-15', '595g', 'delay-2w'],
          ].map(([id, date, weight, st]) => (
            <div key={id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.7fr 0.8fr', gap: 8, fontSize: 11, paddingBottom: 8, borderBottom: '1px solid var(--line-soft)' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{id}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-1)' }}>{date}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>{weight}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: st.includes('delay') ? 'var(--warn)' : 'var(--ok)' }}>{st.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ana-card">
        <div className="ana-card-head">產量預估 <span className="en">YIELD PROJECTION · 2026</span></div>
        <div style={{ padding: 14, display: 'grid', gap: 10 }}>
          <StatCard label="預計總產量" labelEn="EST. ANNUAL YIELD" value="14.8" unit="t" delta="+2.4t vs 2025" accent />
          <StatCard label="預計收成尾數" labelEn="HARVEST COUNT" value="24,800" unit="尾" />
          <StatCard label="預估營收" labelEn="EST. REVENUE" value="1.18M" unit="MYR" delta="+0.21M vs 2025" />
        </div>
      </div>
    </div>
  );
}

const ANA_RENDER = {
  growth: GrowthAnalysis, survival: SurvivalAnalysis, feed: FeedAnalysis,
  water: WaterAnalysis, energy: EnergyAnalysis, experiments: ExperimentsAnalysis,
  incidents: IncidentsAnalysis, forecast: ForecastAnalysis,
};

function AnalyticsPageFull() {
  const [active, setActive] = useStateXP('growth');
  const tab = ANALYTICS_TABS.find(t => t.id === active) || ANALYTICS_TABS[0];
  const Render = ANA_RENDER[active] || (() => null);
  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="ana-tabs">
        {ANALYTICS_TABS.map(t => (
          <div key={t.id}
            className={`ana-tab ${active === t.id ? 'active' : ''}`}
            onClick={() => setActive(t.id)}>
            <div className="ana-tab-num">{t.num}</div>
            <div className="ana-tab-zh">{t.zh}</div>
            <div className="ana-tab-en">{t.en}</div>
          </div>
        ))}
      </div>

      <div className="ana-tab-desc">
        <div className="atd-zh">{tab.desc}</div>
        <div className="atd-en">{tab.descEn}</div>
      </div>

      <Render />
    </div>
  );
}


/* ========================================================================
   REPORTS PAGE — 6 report types
   ======================================================================== */

const REPORTS = [
  {
    id: 'daily', num: 'R.01', zh: '每日運轉日誌', en: 'Daily Operations Log',
    desc: '當班水質摘要、餵食量、死亡數、警報事件與交班備註。',
    descEn: 'Per-shift water quality summary, feed totals, mortality, alerts and handover notes.',
    pages: 4, format: 'PDF + CSV', cadence: '每日 06:00 / 14:00 / 22:00',
    cadenceEn: 'Daily 06:00 / 14:00 / 22:00',
    last: '2026-01-31 · 14:00',
    recipients: ['場長 Manager', '當班 On-shift', '營運 Ops'],
  },
  {
    id: 'weekly', num: 'R.02', zh: '每週生長摘要', en: 'Weekly Growth Summary',
    desc: '各批次體重/體長採樣結果、SGR、FCR、預估收成日更新。',
    descEn: 'Per-batch weight & length sampling, SGR, FCR, harvest-date forecast updates.',
    pages: 8, format: 'PDF + Excel', cadence: '週一 09:00',
    cadenceEn: 'Mondays 09:00',
    last: '2026-01-27 · 09:00',
    recipients: ['場長 Manager', '研究 R&D'],
  },
  {
    id: 'monthly', num: 'R.03', zh: '每月實驗摘要', en: 'Monthly Experiment Summary',
    desc: '所有在運試驗之中期數據、顯著性檢定、決策建議。',
    descEn: 'Active trials interim data, statistical tests, decision recommendations.',
    pages: 14, format: 'PDF', cadence: '月初 03 日',
    cadenceEn: 'Monthly · day 3',
    last: '2026-01-03',
    recipients: ['研究 R&D', '計畫主持人 PI', '場長 Manager'],
  },
  {
    id: 'audit', num: 'R.04', zh: '稽核紀錄', en: 'Audit Trail',
    desc: '使用者操作紀錄、感測器校正、閾值變更、權限變更。',
    descEn: 'User actions, sensor calibration, threshold changes, permission changes.',
    pages: 32, format: 'PDF + JSONL', cadence: '隨時可匯出',
    cadenceEn: 'On-demand export',
    last: '2026-01-31 · 14:32',
    recipients: ['品保 QA', '計畫主持人 PI'],
  },
  {
    id: 'reg', num: 'R.05', zh: '主管機關申報', en: 'Regulatory Filing',
    desc: '農業部養殖統計與用藥紀錄、廢水排放摘要。',
    descEn: 'Aquaculture statistics, drug usage, effluent discharge for Dept. of Agriculture.',
    pages: 6, format: 'PDF (官方表格)', cadence: '每季',
    cadenceEn: 'Quarterly',
    last: '2025-12-31',
    recipients: ['農業部 DOA', '計畫主持人 PI'],
  },
  {
    id: 'harvest', num: 'R.06', zh: '收成報告', en: 'Harvest Report',
    desc: '單批次收成數量、平均體重、總生物量、品質檢測、產線交付。',
    descEn: 'Per-batch harvest count, avg weight, total biomass, QC results, downstream delivery.',
    pages: 6, format: 'PDF + Excel', cadence: '每收成事件',
    cadenceEn: 'Per harvest event',
    last: '2025-11-22 (CS-25-07)',
    recipients: ['場長', '營運 Ops', '客戶 Buyer'],
  },
];

function ReportCard({ r, idx }) {
  return (
    <div className="report-card">
      <div className="report-card-l">
        <div className="report-num">{r.num}</div>
        <div className="report-pages">
          <div className="rp-num">{r.pages}</div>
          <div className="rp-lbl">PAGES</div>
        </div>
      </div>
      <div className="report-card-m">
        <div className="report-zh">{r.zh}</div>
        <div className="report-en">{r.en}</div>
        <div className="report-desc">{r.desc}</div>
        <div className="report-desc-en">{r.descEn}</div>
        <div className="report-meta">
          <div><span className="rm-lbl">節奏 CADENCE</span><span>{r.cadence}</span><span className="rm-en">{r.cadenceEn}</span></div>
          <div><span className="rm-lbl">格式 FORMAT</span><span>{r.format}</span></div>
          <div><span className="rm-lbl">最近 LAST</span><span style={{ fontFamily: 'var(--font-mono)' }}>{r.last}</span></div>
          <div>
            <span className="rm-lbl">收件人 RECIPIENTS</span>
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {r.recipients.map((p, i) => <span key={i} style={{ fontSize: 10.5, padding: '1px 6px', border: '1px solid var(--line-soft)', background: 'var(--bg-2)' }}>{p}</span>)}
            </span>
          </div>
        </div>
      </div>
      <div className="report-card-r">
        <button className="btn-mini btn-primary"><Ic name="export" size={11} /> 立即產生 GENERATE</button>
        <button className="btn-mini">預覽 PREVIEW</button>
        <button className="btn-mini">設定 CONFIG</button>
        <div className="report-history">
          <div className="rh-lbl">歷史紀錄 HISTORY</div>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="rh-row">
              <span style={{ fontFamily: 'var(--font-mono)' }}>2026-01-{31 - i * 2}</span>
              <span style={{ color: 'var(--ok)', fontSize: 9.5 }}>● SENT</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsPageFull() {
  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <section className="panel">
        <div className="panel-head">
          <span className="panel-title">報表類型 <span style={{ color: 'var(--fg-3)' }}>· REPORT TYPES</span> <span className="count">{REPORTS.length} 種</span></span>
          <div className="panel-actions">
            <button className="btn-mini"><Ic name="plus" size={11} /> 自訂報表 CUSTOM</button>
            <button className="btn-mini">範本管理 TEMPLATES</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {REPORTS.map((r, i) => <ReportCard key={r.id} r={r} idx={i} />)}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <span className="panel-title">最近匯出紀錄 <span style={{ color: 'var(--fg-3)' }}>· RECENT EXPORTS</span></span>
        </div>
        <table className="log-table">
          <thead>
            <tr><th>時間 TIME</th><th>類型 TYPE</th><th>產生者 BY</th><th>檔案 FILE</th><th>大小 SIZE</th><th>狀態 STATUS</th></tr>
          </thead>
          <tbody>
            {[
              ['2026-01-31 14:00', 'R.01 Daily Ops Log', 'YN',     'daily-2026-01-31-mid.pdf',  '1.2 MB', '✓ DELIVERED'],
              ['2026-01-31 06:00', 'R.01 Daily Ops Log', 'KT',     'daily-2026-01-31-day.pdf',  '1.1 MB', '✓ DELIVERED'],
              ['2026-01-31 02:14', 'R.04 Audit Trail',   'system', 'audit-2026-01.jsonl',       '4.8 MB', '✓ DELIVERED'],
              ['2026-01-30 22:00', 'R.01 Daily Ops Log', 'TP',     'daily-2026-01-30-night.pdf', '1.0 MB', '✓ DELIVERED'],
              ['2026-01-27 09:00', 'R.02 Weekly Growth', 'system', 'growth-W04-2026.pdf',        '3.6 MB', '✓ DELIVERED'],
              ['2026-01-03 09:00', 'R.03 Monthly Exp',   'system', 'exp-monthly-2026-01.pdf',   '6.9 MB', '✓ DELIVERED'],
            ].map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} style={j === 0 || j === 3 || j === 4 ? { fontFamily: 'var(--font-mono)' } : {}}>
                    {j === 5 ? <span style={{ color: 'var(--ok)', fontSize: 11 }}>{c}</span> : c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}


/* ========================================================================
   SETTINGS PAGE
   ======================================================================== */

const SETTINGS_SECTIONS = [
  { id: 'thresholds', num: 'S.01', zh: '警報閾值',     en: 'Alarm Thresholds' },
  { id: 'users',      num: 'S.02', zh: '使用者與權限', en: 'Users & Permissions' },
  { id: 'calib',      num: 'S.03', zh: '感測器校正',   en: 'Sensor Calibration' },
  { id: 'retention',  num: 'S.04', zh: '資料留存',     en: 'Data Retention' },
  { id: 'integ',      num: 'S.05', zh: '整合與金鑰',   en: 'Integrations & Keys' },
  { id: 'system',     num: 'S.06', zh: '系統與備份',   en: 'System & Backup' },
];

function ThresholdRow({ param, paramEn, unit, ok, warn, danger }) {
  return (
    <tr>
      <td><div style={{ fontWeight: 600 }}>{param}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>{paramEn}</div></td>
      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{unit}</td>
      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', color: 'var(--ok)' }}>{ok}</td>
      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', color: 'var(--warn)' }}>{warn}</td>
      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', color: 'var(--danger)' }}>{danger}</td>
      <td style={{ textAlign: 'right' }}><button className="btn-mini">編輯 EDIT</button></td>
    </tr>
  );
}

function ThresholdsSettings() {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">警報閾值 <span style={{ color: 'var(--fg-3)' }}>· ALARM THRESHOLDS</span></span>
        <div className="panel-actions">
          <button className="btn-mini">匯入 IMPORT</button>
          <button className="btn-mini">套用至所有池 APPLY ALL</button>
        </div>
      </div>
      <div style={{ padding: '8px 14px', fontSize: 11.5, color: 'var(--fg-2)', borderBottom: '1px solid var(--line-soft)' }}>
        每階段獨立設定。OK 為理想區間，WARN 為警告區間（推送通知），DANGER 為嚴重區間（升級至 SCADA 警報）。
      </div>
      <table className="log-table">
        <thead>
          <tr><th>項目 PARAM</th><th style={{ textAlign: 'right' }}>單位</th><th style={{ textAlign: 'right' }}>OK 區間</th><th style={{ textAlign: 'right' }}>WARN</th><th style={{ textAlign: 'right' }}>DANGER</th><th></th></tr>
        </thead>
        <tbody>
          <tr style={{ background: 'var(--bg-2)' }}><td colSpan={6} style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: 0.10, textTransform: 'uppercase', color: 'var(--accent)' }}>STAGE · 孵化 INC</td></tr>
          <ThresholdRow param="水溫"   paramEn="TEMP"  unit="°C"   ok="6.0–8.0"  warn="5.5–8.5"  danger="<5 / >9" />
          <ThresholdRow param="溶氧"   paramEn="DO"    unit="mg/L" ok="≥9.0"      warn="≥8.0"      danger="<7.0" />
          <ThresholdRow param="pH"     paramEn="pH"    unit=""     ok="7.0–7.4"  warn="6.8–7.6"  danger="<6.5 / >7.8" />
          <tr style={{ background: 'var(--bg-2)' }}><td colSpan={6} style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: 0.10, textTransform: 'uppercase', color: 'var(--accent)' }}>STAGE · 中池 JUV</td></tr>
          <ThresholdRow param="水溫"   paramEn="TEMP"  unit="°C"   ok="10.0–12.0" warn="9.5–13.0" danger="<8 / >14" />
          <ThresholdRow param="溶氧"   paramEn="DO"    unit="mg/L" ok="≥8.0"      warn="≥7.0"      danger="<6.0" />
          <ThresholdRow param="pH"     paramEn="pH"    unit=""     ok="6.8–7.6"  warn="6.5–7.8"  danger="<6.0 / >8.0" />
          <ThresholdRow param="氨氮"   paramEn="NH₃"   unit="ppm"  ok="<0.10"    warn="<0.20"    danger=">0.30" />
          <tr style={{ background: 'var(--bg-2)' }}><td colSpan={6} style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: 0.10, textTransform: 'uppercase', color: 'var(--accent)' }}>STAGE · 大池 GRO</td></tr>
          <ThresholdRow param="水溫"   paramEn="TEMP"  unit="°C"   ok="11.0–13.0" warn="10.0–14.0" danger="<9 / >15" />
          <ThresholdRow param="溶氧"   paramEn="DO"    unit="mg/L" ok="≥7.5"      warn="≥6.5"      danger="<5.5" />
        </tbody>
      </table>
    </section>
  );
}

function UsersSettings() {
  const users = [
    { code: 'YN', name: '楊乃文 · Y. Nai-Wen',  role: '場長 Manager',     shift: 'Mid', last: '2026-01-31 14:32', perms: ['ALL'] },
    { code: 'KT', name: '高俊德 · K. T. Kao',   role: '操作員 Operator',  shift: 'Day', last: '2026-01-31 11:05', perms: ['OPS', 'FEED', 'LOG'] },
    { code: 'TP', name: '譚偉光 · T. P. Tan',   role: '操作員 Operator',  shift: 'Night', last: '2026-01-31 06:08', perms: ['OPS', 'FEED', 'LOG'] },
    { code: 'MS', name: '馬世豪 · M. S. Lim',   role: '研究 R&D',         shift: '—',   last: '2026-01-31 09:14', perms: ['READ', 'EXPERIMENT'] },
    { code: 'PI', name: '林博士 · Dr. Lim',     role: '計畫主持人 PI',    shift: '—',   last: '2026-01-30 17:22', perms: ['ALL'] },
    { code: 'QA', name: '黃靜雯 · H. Ching-Wen', role: '品保 QA',         shift: '—',   last: '2026-01-30 14:50', perms: ['READ', 'AUDIT'] },
  ];
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">使用者 <span style={{ color: 'var(--fg-3)' }}>· USERS</span> <span className="count">{users.length} 人</span></span>
        <div className="panel-actions">
          <button className="btn-mini"><Ic name="plus" size={11} /> 新增使用者</button>
          <button className="btn-mini">角色管理 ROLES</button>
        </div>
      </div>
      <table className="log-table">
        <thead>
          <tr><th>代號</th><th>姓名</th><th>角色 ROLE</th><th>班別 SHIFT</th><th>權限 PERMS</th><th>最後登入 LAST LOGIN</th><th></th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.code}>
              <td>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'var(--accent)', color: 'var(--bg-0)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>{u.code}</div>
              </td>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{u.shift}</td>
              <td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {u.perms.map((p, i) => <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, padding: '1px 5px', border: '1px solid var(--line-soft)', color: p === 'ALL' ? 'var(--accent)' : 'var(--fg-2)' }}>{p}</span>)}
                </div>
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-2)' }}>{u.last}</td>
              <td><button className="btn-mini">編輯</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CalibrationSettings() {
  const sensors = [
    { id: 'TS-A1-01', kind: 'TEMP',  tank: 'A1', last: '2026-01-15', next: '2026-02-15', drift: '+0.02°C', status: 'ok' },
    { id: 'TS-B2-03', kind: 'TEMP',  tank: 'B2', last: '2026-01-12', next: '2026-02-12', drift: '+0.04°C', status: 'ok' },
    { id: 'DO-A3-02', kind: 'DO',    tank: 'A3', last: '2025-12-30', next: '2026-01-30', drift: '−0.18',   status: 'overdue' },
    { id: 'PH-B2-04', kind: 'pH',    tank: 'B2', last: '2026-01-08', next: '2026-02-08', drift: '+0.05',   status: 'soon' },
    { id: 'PH-Q1-01', kind: 'pH',    tank: 'Q1', last: '2025-12-15', next: '2026-01-15', drift: 'OFFLINE', status: 'overdue' },
    { id: 'TS-A3-01', kind: 'TEMP',  tank: 'A3', last: '2026-01-20', next: '2026-02-20', drift: '+0.08°C', status: 'ok' },
  ];
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">感測器校正排程 <span style={{ color: 'var(--fg-3)' }}>· SENSOR CALIBRATION SCHEDULE</span></span>
        <div className="panel-actions">
          <button className="btn-mini">匯出 CSV</button>
          <button className="btn-mini btn-primary">排定校正 SCHEDULE</button>
        </div>
      </div>
      <table className="log-table">
        <thead>
          <tr><th>感測器 ID</th><th>類型</th><th>魚池</th><th>上次校正 LAST</th><th>下次 NEXT</th><th>飄移 DRIFT</th><th>狀態</th><th></th></tr>
        </thead>
        <tbody>
          {sensors.map(s => {
            const stColor = s.status === 'overdue' ? 'var(--danger)' : s.status === 'soon' ? 'var(--warn)' : 'var(--ok)';
            const stLabel = s.status === 'overdue' ? '逾期 OVERDUE' : s.status === 'soon' ? '即將 DUE SOON' : '正常 OK';
            return (
              <tr key={s.id}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{s.id}</td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>{s.kind}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{s.tank}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{s.last}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{s.next}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: s.drift === 'OFFLINE' ? 'var(--danger)' : 'var(--fg-2)' }}>{s.drift}</td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: stColor, padding: '2px 6px', border: `1px solid ${stColor}` }}>{stLabel}</span></td>
                <td><button className="btn-mini">校正 CALIBRATE</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function RetentionSettings() {
  const rows = [
    ['即時水質遙測', 'Real-time water-quality telemetry', '15s', '90 天', '0.8 GB / 月', 'hot'],
    ['每分平均',     '1-min downsampled telemetry',       '1m',  '2 年',  '120 MB / 月', 'warm'],
    ['每小時平均',   '1-hr downsampled telemetry',        '1h',  '永久',  '8 MB / 月',   'cold'],
    ['警報事件',     'Alert events',                      '事件', '永久',  '< 1 MB / 月', 'cold'],
    ['操作日誌',     'Manual ops log',                    '事件', '永久',  '< 1 MB / 月', 'cold'],
    ['影像快照',     'Tank camera snapshots',             '5m',  '30 天', '4 GB / 月',   'hot'],
    ['影片片段',     'Tank camera clips (event-triggered)', '事件','180 天','12 GB / 月', 'warm'],
    ['每週採樣',     'Weekly sampling (length / weight)',  '週',  '永久',  '< 1 MB / 月', 'cold'],
  ];
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">資料留存政策 <span style={{ color: 'var(--fg-3)' }}>· DATA RETENTION POLICY</span></span>
        <div className="panel-actions">
          <button className="btn-mini">變更歷史 HISTORY</button>
        </div>
      </div>
      <table className="log-table">
        <thead>
          <tr><th>類型 KIND</th><th>EN</th><th>取樣頻率</th><th>保留 RETENTION</th><th>規模 SIZE</th><th>儲存層 TIER</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const tier = r[5];
            const color = tier === 'hot' ? 'var(--danger)' : tier === 'warm' ? 'var(--warn)' : 'var(--accent)';
            return (
              <tr key={i}>
                <td>{r[0]}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)' }}>{r[1]}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{r[2]}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{r[3]}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{r[4]}</td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, padding: '2px 6px', border: `1px solid ${color}`, textTransform: 'uppercase' }}>{tier}</span></td>
                <td><button className="btn-mini">編輯</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function IntegrationsSettings() {
  const items = [
    { name: 'Skretting Feed Order API', kind: 'PROCUREMENT', status: 'connected', endpoint: 'api.skretting.my/v2', last: '2026-01-31 09:14' },
    { name: 'Cameron Weather API',      kind: 'WEATHER',     status: 'connected', endpoint: 'api.weather.gov.my/v3', last: '2026-01-31 14:31' },
    { name: 'DOA Filing Portal',        kind: 'REGULATORY',  status: 'connected', endpoint: 'efiling.doa.gov.my',    last: '2025-12-31' },
    { name: 'Slack #cs-ops',            kind: 'NOTIFICATION', status: 'connected', endpoint: 'hooks.slack.com/...', last: '2026-01-31 14:32' },
    { name: 'SCADA PLC Bridge',         kind: 'CONTROL',     status: 'connected', endpoint: '10.0.4.21:502 (Modbus)', last: '2026-01-31 14:32' },
    { name: 'Power BI Connector',       kind: 'EXPORT',      status: 'idle',      endpoint: 'powerbi.microsoft.com', last: '2026-01-28 23:00' },
  ];
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">整合與金鑰 <span style={{ color: 'var(--fg-3)' }}>· INTEGRATIONS & KEYS</span></span>
        <div className="panel-actions">
          <button className="btn-mini"><Ic name="plus" size={11} /> 新整合</button>
        </div>
      </div>
      <table className="log-table">
        <thead>
          <tr><th>名稱 NAME</th><th>類型 KIND</th><th>端點 ENDPOINT</th><th>狀態 STATUS</th><th>最近 LAST</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const color = it.status === 'connected' ? 'var(--ok)' : 'var(--fg-3)';
            return (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{it.name}</td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>{it.kind}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>{it.endpoint}</td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color }}>● {it.status.toUpperCase()}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-2)' }}>{it.last}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn-mini">測試</button>
                    <button className="btn-mini">金鑰</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function SystemSettings() {
  return (
    <div className="row-2">
      <section className="panel">
        <div className="panel-head">
          <span className="panel-title">系統 <span style={{ color: 'var(--fg-3)' }}>· SYSTEM</span></span>
        </div>
        <div style={{ padding: 14, display: 'grid', gap: 10 }}>
          {[
            ['版本',   'VERSION',     'v4.2.1 · build 2026.01.28'],
            ['運轉時間','UPTIME',      '142d 06h 18m'],
            ['資料庫', 'DATABASE',    'TimescaleDB 2.13 · 38.4 GB'],
            ['訊息匯流排','MESSAGE BUS','MQTT · 15.2k msg/min'],
            ['前端',   'FRONTEND',    'React 18 + Vite'],
            ['授權',   'LICENSE',     'Internal · Cherry Salmon Project · 2026'],
          ].map(([k, ke, v]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, fontSize: 12, paddingBottom: 8, borderBottom: '1px solid var(--line-soft)' }}>
              <div>
                <div>{k}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--fg-3)' }}>{ke}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-1)' }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <span className="panel-title">備份 <span style={{ color: 'var(--fg-3)' }}>· BACKUP</span></span>
          <div className="panel-actions">
            <button className="btn-mini btn-primary">立即備份 BACKUP NOW</button>
          </div>
        </div>
        <div style={{ padding: 14, display: 'grid', gap: 10 }}>
          {[
            { label: '最近完整備份', en: 'LAST FULL', val: '2026-01-31 02:00 · 32.4 GB', color: 'var(--ok)' },
            { label: '最近增量備份', en: 'LAST INCR', val: '2026-01-31 14:00 · 0.8 GB',  color: 'var(--ok)' },
            { label: '異地備份',     en: 'OFFSITE',   val: 'AWS S3 · ap-southeast-1 · 2026-01-31 03:14', color: 'var(--ok)' },
            { label: '保留期',       en: 'RETENTION', val: '完整 30d · 增量 7d · 異地 90d', color: 'var(--fg-1)' },
            { label: '下次測試還原', en: 'NEXT DRILL', val: '2026-02-15 (季度測試)',     color: 'var(--warn)' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, fontSize: 12, paddingBottom: 8, borderBottom: '1px solid var(--line-soft)' }}>
              <div>
                <div>{row.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--fg-3)' }}>{row.en}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: row.color }}>{row.val}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const SETTINGS_RENDER = {
  thresholds: ThresholdsSettings, users: UsersSettings, calib: CalibrationSettings,
  retention: RetentionSettings, integ: IntegrationsSettings, system: SystemSettings,
};

/* ============================================================
   KLK Settings UI (v0.1)
   ─ Stage Standards / Sampling Frequency / Staff editors
   ─ Reads & writes via SettingsStore (subscribed for live UI)
   ─ Edits trigger TankCard / Dashboard re-render via subscription
   ============================================================ */

function _useSettingsRev() {
  const [v, setV] = useStateXP(0);
  useEffectXP(() => {
    if (!window.SettingsStore) return;
    return window.SettingsStore.subscribe(() => setV(x => x + 1));
  }, []);
  return v;
}

const _KLK_STAGES = [
  { id:'INC', zh:'孵化台',     en:'Incubation' },
  { id:'NUR', zh:'小魚池',     en:'Nursery'    },
  { id:'JUV', zh:'中型適應池', en:'Juvenile'   },
  { id:'GRO', zh:'大型育成池', en:'Grow-out'   },
  { id:'BRO', zh:'親魚池',     en:'Broodstock' },
];

const _KLK_TABS = [
  { id:'standards',      num:'01', zh:'各階段標準',   en:'Stage Standards' },
  { id:'sampling',       num:'02', zh:'採樣頻率',     en:'Sampling Frequency' },
  { id:'staff',          num:'03', zh:'人員管理',     en:'Staff Management' },
  { id:'responsibility', num:'04', zh:'採樣責任設定', en:'Sampling Responsibility' },
  { id:'options',        num:'05', zh:'選項管理',     en:'Options (Feed / Cause)' },
  { id:'equipment',      num:'06', zh:'設備管理',     en:'Equipment' },
  { id:'notifications',  num:'07', zh:'警報通知',     en:'Notifications' },
];

const _KLK_SHIFTS_DROPDOWN = [
  { id:'',      label:'— 未設定' },
  { id:'day',   label:'日班 day' },
  { id:'mid',   label:'中班 mid' },
  { id:'night', label:'夜班 night' },
  { id:'all',   label:'全班 all' },
  { id:'flex',  label:'彈性 flex' },
];

const _kInput = {
  width:'100%', background:'var(--bg-1)', color:'var(--fg-0)',
  border:'1px solid var(--line)', padding:'4px 6px',
  fontFamily:'var(--font-mono)', fontSize:12, textAlign:'center',
};
const _kInputText = Object.assign({}, _kInput, { textAlign:'left' });
const _kTh = {
  fontFamily:'var(--font-mono)', fontSize:9.5,
  color:'var(--fg-0)', letterSpacing:0.10, textTransform:'uppercase',
  textAlign:'center', padding:'8px 6px',
  borderBottom:'1px solid var(--line)',
};
const _kTd = {
  padding:'6px', borderBottom:'1px solid var(--line-soft)',
  fontSize:12, color:'var(--fg-0)',
};
const _kBtn = (variant) => ({
  padding:'6px 14px', fontFamily:'var(--font-sans)', fontSize:12,
  fontWeight:600, cursor:'pointer', border:'1px solid',
  background: variant === 'primary' ? 'var(--accent)'
            : variant === 'danger'  ? 'var(--danger)' : 'var(--bg-2)',
  color: variant === 'primary' || variant === 'danger' ? 'var(--bg-0)' : 'var(--fg-0)',
  borderColor: variant === 'primary' ? 'var(--accent)'
             : variant === 'danger'  ? 'var(--danger)' : 'var(--line)',
});
const _sectionTitle = {
  fontFamily:'var(--font-mono)', fontSize:11,
  color:'var(--accent)', letterSpacing:0.12, textTransform:'uppercase',
  marginBottom:6,
};

// ─── 01. Stage Standards Editor ──────────────────────────────
function StageStandardsEditor() {
  _useSettingsRev();
  const SS = window.SettingsStore;
  const current = SS.getSettings().stageStandards || {};

  // Keep local draft so user can edit before saving
  const [draft, setDraft] = useStateXP(() => JSON.parse(JSON.stringify(current)));
  const [savedAt, setSavedAt] = useStateXP(null);
  const [error, setError]     = useStateXP(null);

  // Re-sync draft if store changes externally (e.g. another user)
  useEffectXP(() => {
    setDraft(JSON.parse(JSON.stringify(current)));
    // eslint-disable-next-line
  }, [JSON.stringify(current)]);

  function setVal(stage, key, idx, raw) {
    setError(null);
    setDraft(d => {
      const next = JSON.parse(JSON.stringify(d));
      if (!next[stage]) next[stage] = {};
      const num = raw === '' ? '' : parseFloat(raw);
      if (idx == null) next[stage][key] = num;
      else {
        next[stage][key] = next[stage][key] ? next[stage][key].slice() : [null, null];
        next[stage][key][idx] = num;
      }
      return next;
    });
  }

  function isDirty() {
    return JSON.stringify(draft) !== JSON.stringify(current);
  }

  function save() {
    setError(null);
    try {
      // basic validation
      for (const sId of _KLK_STAGES.map(s => s.id)) {
        const s = draft[sId];
        if (!s) continue;
        if (Array.isArray(s.temp) && s.temp[0] != null && s.temp[1] != null && s.temp[0] >= s.temp[1])
          throw new Error(_KLK_STAGES.find(x=>x.id===sId).zh + ' 的溫度最小 ≥ 最大');
        if (Array.isArray(s.ph)   && s.ph[0]   != null && s.ph[1]   != null && s.ph[0]   >= s.ph[1])
          throw new Error(_KLK_STAGES.find(x=>x.id===sId).zh + ' 的 pH 最小 ≥ 最大');
      }
      const user = SS.getCurrentUser();
      SS.updateSettings({ stageStandards: draft }, user && user.id, 'ui');
      setSavedAt(new Date().toLocaleTimeString());
      setTimeout(() => setSavedAt(null), 3000);
    } catch (e) {
      setError(e.message);
    }
  }

  function resetThis() {
    setDraft(JSON.parse(JSON.stringify(current)));
    setError(null);
  }
  function resetDefaults() {
    if (!confirm('還原全部標準為預設值？')) return;
    const def = (window.AQUA_DATA.DEFAULT_SETTINGS || {}).stageStandards || {};
    setDraft(JSON.parse(JSON.stringify(def)));
  }

  return (
    <div style={{ background:'#fff0', padding:14, border:'1px solid var(--line)' }}>
      <div style={_sectionTitle}>01 · Stage Standards · 各階段標準水質</div>
      <div style={{ fontSize:11.5, color:'var(--fg-0)', marginBottom:10 }}>
        修改任何欄位 → 點「儲存」→ <strong style={{ color:'var(--accent)' }}>所有 TankCard 立即重算 Target / Gap / Action</strong>。
      </div>

      <div style={{ overflowX:'auto', border:'1px solid var(--line-soft)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-1)' }}>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:140 })}>階段 STAGE</th>
              <th style={Object.assign({}, _kTh, { width:140 })} colSpan={2}>溫度範圍 °C</th>
              <th style={Object.assign({}, _kTh, { width:80 })}>DO ≥</th>
              <th style={Object.assign({}, _kTh, { width:140 })} colSpan={2}>pH 範圍</th>
              <th style={Object.assign({}, _kTh, { width:80 })}>NH₃ ≤</th>
              <th style={Object.assign({}, _kTh, { width:80 })}>NO₂ ≤</th>
              <th style={Object.assign({}, _kTh, { width:120 })}>移出體長 cm</th>
            </tr>
          </thead>
          <tbody>
            {_KLK_STAGES.map(stage => {
              const s = draft[stage.id] || {};
              const t = s.temp || [null, null];
              const p = s.ph   || [null, null];
              return (
                <tr key={stage.id}>
                  <td style={Object.assign({}, _kTd, { paddingLeft:12 })}>
                    <div style={{ fontWeight:600 }}>{stage.zh}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-1)' }}>
                      {stage.en} · {stage.id}
                    </div>
                  </td>
                  <td style={_kTd}>
                    <input type="number" step="0.1" value={t[0] == null ? '' : t[0]}
                           onChange={e=>setVal(stage.id,'temp',0,e.target.value)} style={_kInput}/>
                  </td>
                  <td style={_kTd}>
                    <input type="number" step="0.1" value={t[1] == null ? '' : t[1]}
                           onChange={e=>setVal(stage.id,'temp',1,e.target.value)} style={_kInput}/>
                  </td>
                  <td style={_kTd}>
                    <input type="number" step="0.1" value={s.doMin == null ? '' : s.doMin}
                           onChange={e=>setVal(stage.id,'doMin',null,e.target.value)} style={_kInput}/>
                  </td>
                  <td style={_kTd}>
                    <input type="number" step="0.1" value={p[0] == null ? '' : p[0]}
                           onChange={e=>setVal(stage.id,'ph',0,e.target.value)} style={_kInput}/>
                  </td>
                  <td style={_kTd}>
                    <input type="number" step="0.1" value={p[1] == null ? '' : p[1]}
                           onChange={e=>setVal(stage.id,'ph',1,e.target.value)} style={_kInput}/>
                  </td>
                  <td style={_kTd}>
                    <input type="number" step="0.01" value={s.nh3Max == null ? '' : s.nh3Max}
                           onChange={e=>setVal(stage.id,'nh3Max',null,e.target.value)} style={_kInput}/>
                  </td>
                  <td style={_kTd}>
                    <input type="number" step="0.01" value={s.no2Max == null ? '' : s.no2Max}
                           onChange={e=>setVal(stage.id,'no2Max',null,e.target.value)} style={_kInput}/>
                  </td>
                  <td style={_kTd}>
                    <input type="number" step="0.5" min="0" value={s.transferOutCm == null ? '' : s.transferOutCm}
                           onChange={e=>setVal(stage.id,'transferOutCm',null,e.target.value)}
                           placeholder="(管理者設定)" style={_kInput}/>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize:11, color:'var(--fg-0)', marginTop:6, fontStyle:'italic' }}>
        移出體長：魚體達到此長度時應轉入下一階段。留空表示由管理者依現場狀況決定（例如 Juvenile → Grow-out）。
      </div>

      <div style={{ display:'flex', alignItems:'center', marginTop:10, gap:8 }}>
        <div style={{ flex:1, fontSize:11.5 }}>
          {error   ? <span style={{ color:'var(--danger)' }}>⚠ {error}</span>
           : savedAt ? <span style={{ color:'var(--ok)' }}>✓ 已儲存 {savedAt}（TankCard 已即時更新）</span>
           : isDirty() ? <span style={{ color:'var(--warn)' }}>⚠ 有未儲存變更</span>
           : <span style={{ color:'var(--fg-0)' }}>所有設定皆已同步</span>}
        </div>
        <button style={_kBtn('default')} onClick={resetDefaults}>還原預設</button>
        <button style={_kBtn('default')} onClick={resetThis} disabled={!isDirty()}>取消變更</button>
        <button style={_kBtn('primary')} onClick={save} disabled={!isDirty()}>儲存全部</button>
      </div>
    </div>
  );
}

// ─── 02. Sampling Frequency Editor ───────────────────────────
function SamplingFrequencyEditor() {
  _useSettingsRev();
  const SS = window.SettingsStore;
  const current = SS.getSettings().samplingFrequencyByStage || {};

  const [draft, setDraft] = useStateXP(() => Object.assign({}, current));
  const [savedAt, setSavedAt] = useStateXP(null);
  const [error, setError] = useStateXP(null);

  useEffectXP(() => {
    setDraft(Object.assign({}, current));
    // eslint-disable-next-line
  }, [JSON.stringify(current)]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(current);

  function save() {
    setError(null);
    for (const id of Object.keys(draft)) {
      const v = draft[id];
      if (v == null || v === '' || isNaN(v) || v < 1) {
        setError('採樣間隔必須為正數（分鐘）');
        return;
      }
    }
    const user = SS.getCurrentUser();
    SS.updateSettings({ samplingFrequencyByStage: draft }, user && user.id, 'ui');
    setSavedAt(new Date().toLocaleTimeString());
    setTimeout(() => setSavedAt(null), 3000);
  }
  function resetDefaults() {
    if (!confirm('還原採樣頻率為預設值？')) return;
    const def = (window.AQUA_DATA.DEFAULT_SETTINGS || {}).samplingFrequencyByStage || {};
    setDraft(Object.assign({}, def));
  }

  return (
    <div style={{ padding:14, border:'1px solid var(--line)' }}>
      <div style={_sectionTitle}>02 · Sampling Frequency · 採樣頻率</div>
      <div style={{ fontSize:11.5, color:'var(--fg-0)', marginBottom:10 }}>
        每階段魚池應「**多久量測一次水質**」。逾時的池將在 Dashboard 與 TankCard 顯示警告。
      </div>

      <div style={{ overflowX:'auto', border:'1px solid var(--line-soft)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-1)' }}>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:200 })}>階段 STAGE</th>
              <th style={Object.assign({}, _kTh, { width:160 })}>採樣頻率（分鐘）</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left' })}>說明</th>
            </tr>
          </thead>
          <tbody>
            {_KLK_STAGES.map(stage => {
              const presets = stage.id === 'INC' ? '建議 30 min' :
                              stage.id === 'NUR' ? '建議 60 min' :
                              stage.id === 'JUV' ? '建議 120 min' :
                              stage.id === 'GRO' ? '建議 180 min' : '建議 240 min';
              return (
                <tr key={stage.id}>
                  <td style={Object.assign({}, _kTd, { paddingLeft:12 })}>
                    <div style={{ fontWeight:600 }}>{stage.zh}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-1)' }}>
                      {stage.en} · {stage.id}
                    </div>
                  </td>
                  <td style={_kTd}>
                    <input type="number" min="1" step="1"
                           value={draft[stage.id] == null ? '' : draft[stage.id]}
                           onChange={e => setDraft(d => Object.assign({}, d, { [stage.id]: e.target.value === '' ? '' : parseInt(e.target.value, 10) }))}
                           style={_kInput}/>
                  </td>
                  <td style={Object.assign({}, _kTd, { fontSize:11, color:'var(--fg-1)' })}>{presets}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display:'flex', alignItems:'center', marginTop:10, gap:8 }}>
        <div style={{ flex:1, fontSize:11.5 }}>
          {error   ? <span style={{ color:'var(--danger)' }}>⚠ {error}</span>
           : savedAt ? <span style={{ color:'var(--ok)' }}>✓ 已儲存 {savedAt}</span>
           : isDirty ? <span style={{ color:'var(--warn)' }}>⚠ 有未儲存變更</span>
           : <span style={{ color:'var(--fg-0)' }}>所有設定皆已同步</span>}
        </div>
        <button style={_kBtn('default')} onClick={resetDefaults}>還原預設</button>
        <button style={_kBtn('primary')} onClick={save} disabled={!isDirty}>儲存</button>
      </div>
    </div>
  );
}

// ─── 03. Staff Editor ────────────────────────────────────────
const _ALL_LOG_TYPES = [
  { id:'water',     zh:'水質' },
  { id:'feeding',   zh:'餵食' },
  { id:'mortality', zh:'死亡' },
  { id:'operation', zh:'操作' },
];
const _SHIFTS = ['day','mid','night','flex'];
const _ROLES  = ['admin','operator','viewer'];

function StaffEditor() {
  _useSettingsRev();
  const SS = window.SettingsStore;
  const staff = (SS.getSettings().staff || []);

  const emptyNew = {
    id:'', name:'', code:'', shift:'day', role:'operator',
    allowedLogTypes:['water'], enabled:true,
  };
  const [adding, setAdding] = useStateXP(false);
  const [draft, setDraft]   = useStateXP(emptyNew);
  const [error, setError]   = useStateXP(null);
  const [savedAt, setSavedAt] = useStateXP(null);

  function commitStaff(nextList, msg) {
    const user = SS.getCurrentUser();
    SS.updateSettings({ staff: nextList }, user && user.id, 'ui');
    setSavedAt((msg || '已儲存') + ' ' + new Date().toLocaleTimeString());
    setTimeout(() => setSavedAt(null), 3000);
  }

  function addStaff() {
    setError(null);
    if (!draft.id || !draft.name) { setError('代號與姓名為必填'); return; }
    if (staff.find(s => s.id === draft.id)) { setError('代號 ' + draft.id + ' 已存在'); return; }
    const next = staff.concat([draft]);
    commitStaff(next, '已新增 ' + draft.name);
    setDraft(emptyNew); setAdding(false);
  }
  function toggleEnabled(id) {
    const next = staff.map(s => s.id === id ? Object.assign({}, s, { enabled: !s.enabled }) : s);
    commitStaff(next, '已更新狀態');
  }
  function toggleLogType(id, lt) {
    const next = staff.map(s => {
      if (s.id !== id) return s;
      const cur = s.allowedLogTypes || [];
      const has = cur.indexOf(lt) >= 0;
      return Object.assign({}, s, {
        allowedLogTypes: has ? cur.filter(x => x !== lt) : cur.concat([lt]),
      });
    });
    commitStaff(next, '已更新權限');
  }
  function changeRole(id, role) {
    const next = staff.map(s => s.id === id ? Object.assign({}, s, { role }) : s);
    commitStaff(next, '已更新角色');
  }
  function changeShift(id, shift) {
    const next = staff.map(s => s.id === id ? Object.assign({}, s, { shift }) : s);
    commitStaff(next, '已更新班別');
  }

  const roleColor = (r) => r === 'admin' ? 'var(--accent)'
                         : r === 'operator' ? 'var(--ok)' : 'var(--fg-1)';

  return (
    <div style={{ padding:14, border:'1px solid var(--line)' }}>
      <div style={{ display:'flex', alignItems:'baseline' }}>
        <div style={Object.assign({}, _sectionTitle, { flex:1 })}>03 · Staff · 人員管理</div>
        <button style={_kBtn(adding ? 'default' : 'primary')}
                onClick={() => { setAdding(a => !a); setDraft(emptyNew); setError(null); }}>
          {adding ? '取消' : '＋ 新增人員'}
        </button>
      </div>
      <div style={{ fontSize:11.5, color:'var(--fg-0)', marginBottom:10 }}>
        Manual Logs 的「輸入人員」dropdown 從這裡讀取；停用的人員仍會在歷史紀錄中保留 snapshot。
      </div>

      {/* New staff form */}
      {adding ? (
        <div style={{
          padding:10, marginBottom:10, background:'var(--bg-1)',
          border:'1px solid var(--accent)',
          display:'grid', gridTemplateColumns:'80px 1fr 110px 90px 90px 1fr 80px', gap:8, alignItems:'center',
        }}>
          <input placeholder="代號 ID" value={draft.id}
                 onChange={e=>setDraft(d=>Object.assign({},d,{id:e.target.value.toUpperCase()}))} style={_kInputText}/>
          <input placeholder="姓名" value={draft.name}
                 onChange={e=>setDraft(d=>Object.assign({},d,{name:e.target.value}))} style={_kInputText}/>
          <input placeholder="代號 CODE" value={draft.code}
                 onChange={e=>setDraft(d=>Object.assign({},d,{code:e.target.value}))} style={_kInputText}/>
          <select value={draft.shift} onChange={e=>setDraft(d=>Object.assign({},d,{shift:e.target.value}))} style={_kInputText}>
            {_SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={draft.role} onChange={e=>setDraft(d=>Object.assign({},d,{role:e.target.value}))} style={_kInputText}>
            {_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {_ALL_LOG_TYPES.map(lt => {
              const on = draft.allowedLogTypes.indexOf(lt.id) >= 0;
              return (
                <span key={lt.id}
                      onClick={() => setDraft(d => Object.assign({}, d, {
                        allowedLogTypes: on ? d.allowedLogTypes.filter(x=>x!==lt.id) : d.allowedLogTypes.concat([lt.id])
                      }))}
                      style={{
                        padding:'2px 6px', fontSize:10, cursor:'pointer',
                        border:'1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                        background: on ? 'var(--accent)' : 'transparent',
                        color: on ? 'var(--bg-0)' : 'var(--fg-0)',
                      }}>{lt.zh}</span>
              );
            })}
          </div>
          <button style={_kBtn('primary')} onClick={addStaff}>新增</button>
        </div>
      ) : null}
      {error ? <div style={{ marginBottom:8, color:'var(--danger)', fontSize:12 }}>⚠ {error}</div> : null}

      <div style={{ overflowX:'auto', border:'1px solid var(--line-soft)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-1)' }}>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:60 })}>ID</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:100 })}>姓名</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:120 })}>代號</th>
              <th style={Object.assign({}, _kTh, { width:90 })}>班別</th>
              <th style={Object.assign({}, _kTh, { width:100 })}>角色</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left' })}>可記錄類型（點擊切換）</th>
              <th style={Object.assign({}, _kTh, { width:80 })}>啟用</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id} style={{ opacity: s.enabled ? 1 : 0.55 }}>
                <td style={Object.assign({}, _kTd, { fontFamily:'var(--font-mono)', paddingLeft:12 })}>{s.id}</td>
                <td style={_kTd}>
                  <span style={{ fontWeight:600 }}>{s.name}</span>
                  {!s.enabled ? <span style={{ marginLeft:6, color:'var(--warn)', fontSize:10 }}>[停用]</span> : null}
                </td>
                <td style={Object.assign({}, _kTd, { fontFamily:'var(--font-mono)', fontSize:11 })}>{s.code}</td>
                <td style={_kTd}>
                  <select value={s.shift} onChange={e=>changeShift(s.id, e.target.value)} style={_kInput}>
                    {_SHIFTS.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </td>
                <td style={_kTd}>
                  <select value={s.role} onChange={e=>changeRole(s.id, e.target.value)}
                          style={Object.assign({}, _kInput, { color: roleColor(s.role), fontWeight:600 })}>
                    {_ROLES.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </td>
                <td style={_kTd}>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {_ALL_LOG_TYPES.map(lt => {
                      const on = (s.allowedLogTypes || []).indexOf(lt.id) >= 0;
                      return (
                        <span key={lt.id} onClick={() => toggleLogType(s.id, lt.id)}
                              style={{
                                padding:'2px 8px', fontSize:10.5, cursor:'pointer',
                                border:'1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                                background: on ? 'var(--accent)' : 'transparent',
                                color: on ? 'var(--bg-0)' : 'var(--fg-0)',
                                fontWeight: on ? 600 : 400,
                              }}>{lt.zh}</span>
                      );
                    })}
                  </div>
                </td>
                <td style={_kTd}>
                  <span onClick={() => toggleEnabled(s.id)}
                        style={{
                          display:'inline-block', cursor:'pointer',
                          width:36, height:18, borderRadius:9, position:'relative',
                          background: s.enabled ? 'var(--ok)' : 'var(--line)',
                          transition:'background 0.15s',
                        }}
                        title={s.enabled ? '點擊停用' : '點擊啟用'}>
                    <span style={{
                      position:'absolute', top:2,
                      left: s.enabled ? 20 : 2,
                      width:14, height:14, borderRadius:'50%',
                      background:'#fff', transition:'left 0.15s',
                    }}></span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {savedAt ? (
        <div style={{ marginTop:8, color:'var(--ok)', fontSize:11.5 }}>✓ {savedAt}</div>
      ) : null}
    </div>
  );
}

// ─── 04. Sampling Responsibility Editor ──────────────────────
function ResponsibilityEditor() {
  _useSettingsRev();
  const SS = window.SettingsStore;
  const settings = SS.getSettings();
  const current = settings.samplingResponsibility || { byStage:{}, byTank:{} };

  const [draft, setDraft] = useStateXP(() => JSON.parse(JSON.stringify(current)));
  const [savedAt, setSavedAt] = useStateXP(null);
  const [error, setError] = useStateXP(null);

  useEffectXP(() => {
    setDraft(JSON.parse(JSON.stringify(current)));
    // eslint-disable-next-line
  }, [JSON.stringify(current)]);

  const allStaff     = SS.getStaff();
  const enabledStaff = allStaff.filter(s => s.enabled);
  const tanks        = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];

  const isDirty = JSON.stringify(draft) !== JSON.stringify(current);

  // ─── stage handlers ───
  function setStageField(sId, field, val) {
    setDraft(d => {
      const next = JSON.parse(JSON.stringify(d));
      next.byStage = next.byStage || {};
      next.byStage[sId] = next.byStage[sId] || { primary:null, backup:null, shift:'' };
      next.byStage[sId][field] = (val === '' || val == null) ? null : val;
      return next;
    });
  }

  // ─── tank override handlers ───
  function isOverridden(tId) {
    return !!(draft.byTank && draft.byTank[tId]);
  }
  function toggleTankOverride(tId, on) {
    setDraft(d => {
      const next = JSON.parse(JSON.stringify(d));
      next.byTank = next.byTank || {};
      if (on) next.byTank[tId] = { primary:null, backup:null };
      else delete next.byTank[tId];
      return next;
    });
  }
  function setTankField(tId, field, val) {
    setDraft(d => {
      const next = JSON.parse(JSON.stringify(d));
      next.byTank = next.byTank || {};
      next.byTank[tId] = next.byTank[tId] || { primary:null, backup:null };
      next.byTank[tId][field] = (val === '' || val == null) ? null : val;
      return next;
    });
  }

  function save() {
    setError(null);
    const user = SS.getCurrentUser();
    SS.updateSettings({ samplingResponsibility: draft }, user && user.id, 'ui');
    setSavedAt(new Date().toLocaleTimeString());
    setTimeout(() => setSavedAt(null), 3000);
  }
  function resetThis() { setDraft(JSON.parse(JSON.stringify(current))); }
  function resetDefaults() {
    if (!confirm('還原採樣責任為預設值？')) return;
    const def = (window.AQUA_DATA.DEFAULT_SETTINGS || {}).samplingResponsibility || { byStage:{}, byTank:{} };
    setDraft(JSON.parse(JSON.stringify(def)));
  }

  // ─── Staff dropdown — filters out disabled, but keeps current pick visible ───
  function StaffSelect({ value, onChange, allowEmpty, dimWhenInherited }) {
    const isDisabledChoice = !!(value && allStaff.find(s => s.id === value && !s.enabled));
    const opts = enabledStaff.slice();
    if (isDisabledChoice) {
      const dis = allStaff.find(s => s.id === value);
      if (dis) opts.push(dis);
    }
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)}
              style={Object.assign({}, _kInputText,
                isDisabledChoice ? { borderColor:'var(--warn)', color:'var(--warn)' } : {},
                dimWhenInherited ? { background:'var(--bg-0)' } : {})}>
        {allowEmpty ? <option value="">— 無</option> : null}
        {opts.map(s => (
          <option key={s.id} value={s.id}>
            {s.name} · {s.role}{!s.enabled ? ' [停用]' : ''}
          </option>
        ))}
      </select>
    );
  }

  // ─── Helper: resolve effective responsibility for a tank ───
  function effectiveFor(tank) {
    const ov = draft.byTank && draft.byTank[tank.id];
    const sd = (draft.byStage && draft.byStage[tank.stage]) || {};
    if (ov && (ov.primary || ov.backup)) {
      return {
        source:'override',
        primary: ov.primary || sd.primary || null,
        backup:  ov.backup  || sd.backup  || null,
      };
    }
    return { source:'inherited', primary: sd.primary || null, backup: sd.backup || null };
  }

  function staffName(id) {
    if (!id) return '—';
    const s = allStaff.find(x => x.id === id);
    return s ? s.name : id;
  }
  function staffDisabled(id) {
    if (!id) return false;
    const s = allStaff.find(x => x.id === id);
    return s ? !s.enabled : false;
  }

  // count tanks with override
  const overrideCount = Object.keys(draft.byTank || {}).filter(k => isOverridden(k)).length;
  // count disabled-staff usage (warning)
  const disabledRefs = [];
  _KLK_STAGES.forEach(s => {
    const sd = (draft.byStage && draft.byStage[s.id]) || {};
    if (staffDisabled(sd.primary)) disabledRefs.push(s.zh + ' / 主責 ' + staffName(sd.primary));
    if (staffDisabled(sd.backup))  disabledRefs.push(s.zh + ' / 備援 ' + staffName(sd.backup));
  });
  Object.keys(draft.byTank || {}).forEach(tId => {
    const ov = draft.byTank[tId];
    if (staffDisabled(ov.primary)) disabledRefs.push(tId + ' (覆寫) / 主責 ' + staffName(ov.primary));
    if (staffDisabled(ov.backup))  disabledRefs.push(tId + ' (覆寫) / 備援 ' + staffName(ov.backup));
  });

  return (
    <div style={{ padding:14, border:'1px solid var(--line)' }}>
      <div style={_sectionTitle}>04 · Sampling Responsibility · 採樣責任設定</div>
      <div style={{ fontSize:11.5, color:'var(--fg-0)', marginBottom:10 }}>
        修改後 → <strong style={{ color:'var(--accent)' }}>Dashboard 的「採樣責任歸屬」KPI 立即重算</strong>。
        順序：池有「覆寫」用覆寫；否則用該階段預設。
      </div>

      {/* Disabled-staff warnings */}
      {disabledRefs.length > 0 ? (
        <div style={{
          padding:'8px 12px', marginBottom:10,
          border:'1px solid var(--warn)', borderLeft:'3px solid var(--warn)',
          background:'oklch(0.32 0.06 78 / 0.18)', fontSize:11.5, color:'var(--fg-0)',
        }}>
          ⚠ 以下指派使用了已停用的人員，請更換：
          <ul style={{ marginTop:4, paddingLeft:20 }}>
            {disabledRefs.map((d, i) => <li key={i} style={{ color:'var(--warn)' }}>{d}</li>)}
          </ul>
        </div>
      ) : null}

      {/* ─── Section A: byStage ─── */}
      <div style={{
        fontFamily:'var(--font-mono)', fontSize:10,
        color:'var(--accent)', letterSpacing:0.10, textTransform:'uppercase',
        marginBottom:6,
      }}>A · 階段預設 BY STAGE（每個階段一組主責/備援/班別）</div>
      <div style={{ overflowX:'auto', border:'1px solid var(--line-soft)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-1)' }}>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:160 })}>階段 STAGE</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left' })}>主責人 PRIMARY</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left' })}>備援 BACKUP</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:160 })}>班別 SHIFT</th>
            </tr>
          </thead>
          <tbody>
            {_KLK_STAGES.map(stage => {
              const sd = (draft.byStage && draft.byStage[stage.id]) || { primary:null, backup:null, shift:'' };
              return (
                <tr key={stage.id}>
                  <td style={Object.assign({}, _kTd, { paddingLeft:12 })}>
                    <div style={{ fontWeight:600 }}>{stage.zh}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-1)' }}>
                      {stage.en} · {stage.id}
                    </div>
                  </td>
                  <td style={_kTd}>
                    <StaffSelect value={sd.primary} allowEmpty
                      onChange={v => setStageField(stage.id, 'primary', v)} />
                  </td>
                  <td style={_kTd}>
                    <StaffSelect value={sd.backup} allowEmpty
                      onChange={v => setStageField(stage.id, 'backup', v)} />
                  </td>
                  <td style={_kTd}>
                    <select value={sd.shift || ''}
                            onChange={e => setStageField(stage.id, 'shift', e.target.value)}
                            style={_kInputText}>
                      {_KLK_SHIFTS_DROPDOWN.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Section B: byTank overrides ─── */}
      <div style={{
        fontFamily:'var(--font-mono)', fontSize:10,
        color:'var(--accent)', letterSpacing:0.10, textTransform:'uppercase',
        marginTop:18, marginBottom:6,
        display:'flex', alignItems:'baseline', gap:8,
      }}>
        <span>B · 單池覆寫 BY TANK</span>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-0)' }}>
          已覆寫 {overrideCount} / {tanks.length} 池
        </span>
      </div>
      <div style={{ fontSize:11.5, color:'var(--fg-0)', marginBottom:6 }}>
        關閉「覆寫」→ 該池採用上方階段預設；開啟「覆寫」→ 可單獨指定該池的主責 / 備援。
      </div>
      <div style={{ overflowX:'auto', border:'1px solid var(--line-soft)', maxHeight:380 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-1)', position:'sticky', top:0 }}>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:80 })}>魚池</th>
              <th style={Object.assign({}, _kTh, { width:60 })}>階段</th>
              <th style={Object.assign({}, _kTh, { width:70 })}>覆寫</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left' })}>主責人</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left' })}>備援</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:130 })}>實際生效</th>
            </tr>
          </thead>
          <tbody>
            {tanks.map(t => {
              const overridden = isOverridden(t.id);
              const eff = effectiveFor(t);
              const ov = (draft.byTank && draft.byTank[t.id]) || { primary:null, backup:null };
              return (
                <tr key={t.id} style={overridden ? { background:'oklch(0.225 0.03 220 / 0.30)' } : null}>
                  <td style={Object.assign({}, _kTd, { fontWeight:600, paddingLeft:12 })}>{t.id}</td>
                  <td style={Object.assign({}, _kTd, { textAlign:'center', fontFamily:'var(--font-mono)', fontSize:10.5 })}>
                    {t.stage}
                  </td>
                  <td style={Object.assign({}, _kTd, { textAlign:'center' })}>
                    <span onClick={() => toggleTankOverride(t.id, !overridden)}
                          style={{
                            display:'inline-block', cursor:'pointer',
                            width:36, height:18, borderRadius:9, position:'relative',
                            background: overridden ? 'var(--accent)' : 'var(--line)',
                            transition:'background 0.15s',
                          }}
                          title={overridden ? '點擊改回繼承' : '點擊改為覆寫'}>
                      <span style={{
                        position:'absolute', top:2,
                        left: overridden ? 20 : 2,
                        width:14, height:14, borderRadius:'50%',
                        background:'#fff', transition:'left 0.15s',
                      }}></span>
                    </span>
                  </td>
                  <td style={_kTd}>
                    {overridden ? (
                      <StaffSelect value={ov.primary} allowEmpty
                        onChange={v => setTankField(t.id, 'primary', v)} />
                    ) : (
                      <span style={{ color:'var(--fg-0)', fontFamily:'var(--font-mono)', fontSize:11 }}>
                        繼承 → <span style={{ fontWeight:600 }}>{staffName(eff.primary)}</span>
                      </span>
                    )}
                  </td>
                  <td style={_kTd}>
                    {overridden ? (
                      <StaffSelect value={ov.backup} allowEmpty
                        onChange={v => setTankField(t.id, 'backup', v)} />
                    ) : (
                      <span style={{ color:'var(--fg-0)', fontFamily:'var(--font-mono)', fontSize:11 }}>
                        繼承 → <span style={{ fontWeight:600 }}>{staffName(eff.backup)}</span>
                      </span>
                    )}
                  </td>
                  <td style={Object.assign({}, _kTd, { fontFamily:'var(--font-mono)', fontSize:10.5 })}>
                    <span style={{
                      padding:'1px 6px', fontSize:9,
                      border:'1px solid ' + (eff.source === 'override' ? 'var(--accent)' : 'var(--line)'),
                      color: eff.source === 'override' ? 'var(--accent)' : 'var(--fg-0)',
                    }}>{eff.source === 'override' ? '覆寫' : '預設'}</span>
                    <span style={{ marginLeft:6, color:'var(--fg-0)' }}>
                      {staffName(eff.primary)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Save bar ─── */}
      <div style={{ display:'flex', alignItems:'center', marginTop:10, gap:8 }}>
        <div style={{ flex:1, fontSize:11.5 }}>
          {error    ? <span style={{ color:'var(--danger)' }}>⚠ {error}</span>
           : savedAt ? <span style={{ color:'var(--ok)' }}>✓ 已儲存 {savedAt}（Dashboard 已即時重算）</span>
           : isDirty ? <span style={{ color:'var(--warn)' }}>⚠ 有未儲存變更</span>
           : <span style={{ color:'var(--fg-0)' }}>所有設定皆已同步</span>}
        </div>
        <button style={_kBtn('default')} onClick={resetDefaults}>還原預設</button>
        <button style={_kBtn('default')} onClick={resetThis} disabled={!isDirty}>取消變更</button>
        <button style={_kBtn('primary')} onClick={save} disabled={!isDirty}>儲存全部</button>
      </div>
    </div>
  );
}

// ─── 05. Options Editor (Feed Types + Mortality Causes) ─────
function OptionsEditor() {
  _useSettingsRev();
  const SS = window.SettingsStore;
  const settings = SS.getSettings();

  return (
    <div style={{ padding:14, border:'1px solid var(--line)' }}>
      <div style={_sectionTitle}>05 · Options · 選項管理</div>
      <div style={{ fontSize:11.5, color:'var(--fg-0)', marginBottom:10 }}>
        管理 Manual Logs 表單的 dropdown 選項。新增後 → <strong style={{ color:'var(--accent)' }}>08 人工紀錄的飼料/死因下拉立即出現</strong>。
      </div>

      <_ListEditor
        title="飼料種類 Feed Types"
        accent="var(--ok)"
        settingKey="feedTypes"
        placeholder="例：Skretting Nutra-2.0"
      />

      <div style={{ height:14 }}/>

      <_ListEditor
        title="死亡原因 Mortality Causes"
        accent="var(--danger)"
        settingKey="mortalityCauses"
        placeholder="例：缺氧 Hypoxia"
      />
    </div>
  );
}

// Reusable: edit a list of strings stored at SettingsStore.settings[settingKey]
function _ListEditor({ title, accent, settingKey, placeholder }) {
  const SS = window.SettingsStore;
  const list = (SS.getSettings()[settingKey] || []);
  const [draft, setDraft]   = useStateXP('');
  const [savedAt, setSavedAt] = useStateXP(null);

  function commit(next, msg) {
    const user = SS.getCurrentUser();
    SS.updateSettings({ [settingKey]: next }, user && user.id, 'ui');
    setSavedAt((msg || '已更新') + ' ' + new Date().toLocaleTimeString());
    setTimeout(() => setSavedAt(null), 2500);
  }
  function add() {
    const v = draft.trim();
    if (!v) return;
    if (list.indexOf(v) >= 0) return;
    commit(list.concat([v]), '已新增 ' + v);
    setDraft('');
  }
  function remove(item) {
    if (!confirm('刪除「' + item + '」？')) return;
    commit(list.filter(x => x !== item), '已刪除');
  }
  function move(idx, dir) {
    const next = list.slice();
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    commit(next, '已調整順序');
  }

  return (
    <div style={{ background:'var(--bg-1)', border:'1px solid var(--line-soft)' }}>
      <div style={{
        padding:'8px 12px', borderBottom:'1px solid var(--line-soft)',
        display:'flex', alignItems:'baseline', gap:10,
      }}>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700,
          color: accent, letterSpacing:0.10, textTransform:'uppercase',
        }}>{title}</span>
        <span style={{ flex:1 }} />
        <span style={{ color:'var(--fg-0)', fontSize:11 }}>共 {list.length} 項</span>
      </div>

      <div style={{ padding:12 }}>
        {/* Add row */}
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <input value={draft} placeholder={placeholder}
                 onChange={e => setDraft(e.target.value)}
                 onKeyDown={e => { if (e.key === 'Enter') add(); }}
                 style={Object.assign({}, _kInputText, { fontSize:14, padding:'8px 10px' })} />
          <button onClick={add} style={_kBtn('primary')}>＋ 新增</button>
        </div>

        {/* Existing items */}
        {list.length === 0 ? (
          <div style={{ padding:'12px', color:'var(--fg-0)', fontSize:12, textAlign:'center' }}>
            （尚無項目）
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {list.map((item, i) => (
              <div key={item} style={{
                display:'grid', gridTemplateColumns:'40px 1fr 60px 60px 60px',
                gap:8, alignItems:'center',
                padding:'6px 10px', background:'var(--bg-2)',
                border:'1px solid var(--line-soft)', borderLeft:'3px solid '+accent,
                fontSize:13,
              }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-0)' }}>
                  #{i + 1}
                </span>
                <span style={{ color:'var(--fg-0)', fontWeight:600 }}>{item}</span>
                <button onClick={() => move(i, -1)} disabled={i === 0}
                        style={Object.assign({}, _kBtn('default'), { padding:'4px 6px', fontSize:11 })}>
                  ▲
                </button>
                <button onClick={() => move(i, +1)} disabled={i === list.length - 1}
                        style={Object.assign({}, _kBtn('default'), { padding:'4px 6px', fontSize:11 })}>
                  ▼
                </button>
                <button onClick={() => remove(item)}
                        style={Object.assign({}, _kBtn('danger'), { padding:'4px 6px', fontSize:11 })}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {savedAt ? <div style={{ marginTop:8, color:'var(--ok)', fontSize:11.5 }}>✓ {savedAt}</div> : null}
      </div>
    </div>
  );
}

/* ============================================================
   06 · Equipment Editor (Phase 2)
   3 sub-sections: Stage Requirements / Inventory / Bindings
   ============================================================ */

const _DEV_KIND_LIST = [
  'multiparam','temp_sensor','do_sensor','ph_sensor','nh3_sensor','no2_sensor',
  'flow_control','lighting','chiller_link','chiller','aerator','ras','pump',
  'gateway','generator','ups','natural_monitor','controller'
];
const _DEV_BRAND_LIST = ['In-Situ','YSI','Hach','Generic','Manual','Other'];
const _DEV_INV_STATUS = ['installed','pending','purchasing','maintenance','retired'];
const _DEV_DATA_SOURCE = ['manual','device','imported'];
const _ALL_METRICS = ['temp','doO','ph','nh3','no2'];

function EquipmentEditor() {
  _useSettingsRev();
  const [sub, setSub] = useStateXP('inventory');

  return (
    <div style={{ padding:14, border:'1px solid var(--line)' }}>
      <div style={_sectionTitle}>06 · Equipment · 設備管理</div>
      <div style={{ fontSize:11.5, color:'var(--fg-0)', marginBottom:10 }}>
        管理設備庫存、各階段需求與設備綁定。<strong style={{ color:'var(--accent)' }}>Devices Page 與設備缺口會即時更新。</strong>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:14, borderBottom:'1px solid var(--line)' }}>
        {[
          { id:'requirements', zh:'A · 階段需求' },
          { id:'inventory',    zh:'B · 設備庫存' },
          { id:'bindings',     zh:'C · 設備綁定' },
        ].map(t => {
          const isAct = sub === t.id;
          return (
            <div key={t.id} onClick={() => setSub(t.id)} style={{
              padding:'10px 16px', cursor:'pointer',
              borderBottom: isAct ? '2px solid var(--accent)' : '2px solid transparent',
              color: isAct ? 'var(--accent)' : 'var(--fg-0)',
              fontWeight: isAct ? 700 : 500, fontSize:14,
            }}>{t.zh}</div>
          );
        })}
      </div>

      {sub === 'requirements' ? <_StageReqEditor /> : null}
      {sub === 'inventory'    ? <_InventoryEditor /> : null}
      {sub === 'bindings'     ? <_BindingEditor /> : null}
    </div>
  );
}

// ─── A. Stage Requirements Editor ────────────────────────────
function _StageReqEditor() {
  const SS = window.SettingsStore;
  const reqs = (SS.getSettings().stageEquipmentRequirements || {});
  const stages = ['INC','NUR','JUV','GRO'];
  const stageZh = { INC:'孵化槽 Hatch', NUR:'小魚池 Nursery', JUV:'中魚池 Juvenile', GRO:'大魚池 Grow-out' };

  function toggleRequired(stageId, idx) {
    const next = JSON.parse(JSON.stringify(reqs));
    next[stageId] = next[stageId] || [];
    if (next[stageId][idx]) next[stageId][idx].required = !next[stageId][idx].required;
    const user = SS.getCurrentUser();
    SS.updateSettings({ stageEquipmentRequirements: next }, user && user.id, 'ui');
  }

  return (
    <div>
      <div style={{ fontSize:13, color:'var(--fg-0)', marginBottom:8 }}>
        每階段勾選必要設備類型。標 ✔ = 必要；未勾選 = 建議。
      </div>
      {stages.map(sid => (
        <div key={sid} style={{
          marginBottom:12, padding:12, background:'var(--bg-1)',
          border:'1px solid var(--line-soft)',
        }}>
          <div style={{
            fontSize:14, fontWeight:700, color:'var(--accent)', marginBottom:8,
          }}>{stageZh[sid]}</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-2)' }}>
                <th style={Object.assign({}, _kTh, { textAlign:'left', width:80 })}>必要</th>
                <th style={Object.assign({}, _kTh, { textAlign:'left' })}>設備類型</th>
                <th style={Object.assign({}, _kTh, { textAlign:'left', width:140 })}>對應 metric</th>
                <th style={Object.assign({}, _kTh, { textAlign:'left' })}>建議廠牌</th>
              </tr>
            </thead>
            <tbody>
              {(reqs[sid] || []).map((r, i) => (
                <tr key={r.type} style={{ borderTop:'1px solid var(--line-soft)' }}>
                  <td style={Object.assign({}, _kTd, { textAlign:'center' })}>
                    <span onClick={() => toggleRequired(sid, i)} style={{
                      display:'inline-block', cursor:'pointer',
                      width:36, height:18, borderRadius:9, position:'relative',
                      background: r.required ? 'var(--ok)' : 'var(--line)',
                    }}>
                      <span style={{
                        position:'absolute', top:2, left: r.required ? 20 : 2,
                        width:14, height:14, borderRadius:'50%', background:'#fff',
                      }}></span>
                    </span>
                  </td>
                  <td style={Object.assign({}, _kTd, { fontSize:13, fontWeight:600 })}>{r.label}</td>
                  <td style={Object.assign({}, _kTd, { fontFamily:'var(--font-mono)', fontSize:11 })}>
                    {(r.metrics || []).join(', ') || '—'}
                  </td>
                  <td style={Object.assign({}, _kTd, { fontSize:12, color:'var(--accent)' })}>
                    {r.suggested || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── B. Inventory Editor (CRUD) ──────────────────────────────
function _InventoryEditor() {
  const SS = window.SettingsStore;
  const inv = SS.getSettings().deviceInventory || [];
  const [adding, setAdding] = useStateXP(false);
  const blank = {
    id:'', nameZh:'', nameEn:'', brand:'In-Situ', model:'', serialNumber:'',
    kind:'multiparam', supportedMetrics:['temp','doO','ph','nh3','no2'],
    inventoryStatus:'pending', dataSource:'device', protocol:'', note:'',
  };
  const [draft, setDraft] = useStateXP(blank);
  const [error, setError] = useStateXP(null);

  function commit(next) {
    const user = SS.getCurrentUser();
    SS.updateSettings({ deviceInventory: next }, user && user.id, 'ui');
  }
  function add() {
    setError(null);
    if (!draft.id || !draft.nameZh) { setError('設備 ID 與中文名稱為必填'); return; }
    if (inv.find(d => d.id === draft.id)) { setError('ID ' + draft.id + ' 已存在'); return; }
    commit(inv.concat([draft]));
    setDraft(blank); setAdding(false);
  }
  function update(id, patch) {
    const next = inv.map(d => d.id === id ? Object.assign({}, d, patch) : d);
    commit(next);
  }
  function remove(id) {
    if (!confirm('刪除設備「' + id + '」？')) return;
    commit(inv.filter(d => d.id !== id));
  }
  function toggleMetric(id, m) {
    const next = inv.map(d => {
      if (d.id !== id) return d;
      const cur = d.supportedMetrics || [];
      const has = cur.indexOf(m) >= 0;
      return Object.assign({}, d, { supportedMetrics: has ? cur.filter(x=>x!==m) : cur.concat([m]) });
    });
    commit(next);
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'baseline', marginBottom:10 }}>
        <span style={{ fontSize:14, fontWeight:600, color:'var(--fg-0)', flex:1 }}>
          設備庫存 · 共 {inv.length} 台
        </span>
        <button style={_kBtn(adding ? 'default' : 'primary')}
                onClick={() => { setAdding(a => !a); setDraft(blank); setError(null); }}>
          {adding ? '取消' : '＋ 新增設備'}
        </button>
      </div>

      {/* Add form */}
      {adding ? (
        <div style={{
          padding:12, marginBottom:10, background:'var(--bg-1)',
          border:'1px solid var(--accent)',
        }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
            <input placeholder="設備 ID（如 DEV-MP-A1）" value={draft.id}
                   onChange={e=>setDraft(d=>Object.assign({},d,{id:e.target.value}))} style={_kInputText}/>
            <input placeholder="中文名稱" value={draft.nameZh}
                   onChange={e=>setDraft(d=>Object.assign({},d,{nameZh:e.target.value}))} style={_kInputText}/>
            <input placeholder="英文名稱" value={draft.nameEn}
                   onChange={e=>setDraft(d=>Object.assign({},d,{nameEn:e.target.value}))} style={_kInputText}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:8 }}>
            <select value={draft.brand} onChange={e=>setDraft(d=>Object.assign({},d,{brand:e.target.value}))} style={_kInputText}>
              {_DEV_BRAND_LIST.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input placeholder="型號" value={draft.model}
                   onChange={e=>setDraft(d=>Object.assign({},d,{model:e.target.value}))} style={_kInputText}/>
            <input placeholder="序號" value={draft.serialNumber}
                   onChange={e=>setDraft(d=>Object.assign({},d,{serialNumber:e.target.value}))} style={_kInputText}/>
            <select value={draft.kind} onChange={e=>setDraft(d=>Object.assign({},d,{kind:e.target.value}))} style={_kInputText}>
              {_DEV_KIND_LIST.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <select value={draft.inventoryStatus} onChange={e=>setDraft(d=>Object.assign({},d,{inventoryStatus:e.target.value}))} style={_kInputText}>
              {_DEV_INV_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={draft.dataSource} onChange={e=>setDraft(d=>Object.assign({},d,{dataSource:e.target.value}))} style={_kInputText}>
              {_DEV_DATA_SOURCE.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'var(--fg-0)' }}>支援 metric：</span>
            {_ALL_METRICS.map(m => {
              const on = draft.supportedMetrics.indexOf(m) >= 0;
              return (
                <span key={m} onClick={() => setDraft(d => Object.assign({}, d, {
                  supportedMetrics: on ? d.supportedMetrics.filter(x=>x!==m) : d.supportedMetrics.concat([m])
                }))} style={{
                  padding:'2px 8px', fontSize:11, cursor:'pointer',
                  border:'1px solid '+(on ? 'var(--accent)' : 'var(--line)'),
                  background: on ? 'var(--accent)' : 'transparent',
                  color: on ? 'var(--bg-0)' : 'var(--fg-0)', fontWeight:600,
                }}>{m}</span>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input placeholder="備註" value={draft.note}
                   onChange={e=>setDraft(d=>Object.assign({},d,{note:e.target.value}))}
                   style={Object.assign({}, _kInputText, { flex:1 })}/>
            <button onClick={add} style={_kBtn('primary')}>新增</button>
          </div>
          {error ? <div style={{ marginTop:6, color:'var(--danger)', fontSize:12 }}>⚠ {error}</div> : null}
        </div>
      ) : null}

      {/* List */}
      <div style={{ overflowX:'auto', border:'1px solid var(--line-soft)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-1)' }}>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:140 })}>ID</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left' })}>設備</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:140 })}>品牌 / 型號</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:200 })}>支援 metric（點擊切換）</th>
              <th style={Object.assign({}, _kTh, { width:110 })}>狀態</th>
              <th style={Object.assign({}, _kTh, { width:100 })}>來源</th>
              <th style={Object.assign({}, _kTh, { width:60 })}></th>
            </tr>
          </thead>
          <tbody>
            {inv.map(d => (
              <tr key={d.id} style={{ borderTop:'1px solid var(--line-soft)' }}>
                <td style={Object.assign({}, _kTd, { fontFamily:'var(--font-mono)', fontSize:11 })}>{d.id}</td>
                <td style={_kTd}>
                  <div style={{ fontWeight:600 }}>{d.nameZh}</div>
                  <div style={{ fontSize:10, color:'var(--fg-0)' }}>{d.nameEn}</div>
                </td>
                <td style={Object.assign({}, _kTd, { fontSize:12 })}>
                  <div>{d.brand}</div>
                  <div style={{ fontSize:10, color:'var(--fg-0)' }}>{d.model}{d.serialNumber ? ' · ' + d.serialNumber : ''}</div>
                </td>
                <td style={_kTd}>
                  <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                    {_ALL_METRICS.map(m => {
                      const on = (d.supportedMetrics || []).indexOf(m) >= 0;
                      return (
                        <span key={m} onClick={() => toggleMetric(d.id, m)}
                              style={{
                                padding:'1px 6px', fontSize:10, cursor:'pointer',
                                border:'1px solid '+(on ? 'var(--accent)' : 'var(--line)'),
                                background: on ? 'var(--accent)' : 'transparent',
                                color: on ? 'var(--bg-0)' : 'var(--fg-0)',
                                fontWeight: on ? 700 : 400,
                              }}>{m}</span>
                      );
                    })}
                  </div>
                </td>
                <td style={_kTd}>
                  <select value={d.inventoryStatus} onChange={e=>update(d.id, { inventoryStatus: e.target.value })}
                          style={Object.assign({}, _kInput, { fontSize:11 })}>
                    {_DEV_INV_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={_kTd}>
                  <select value={d.dataSource} onChange={e=>update(d.id, { dataSource: e.target.value })}
                          style={Object.assign({}, _kInput, { fontSize:11 })}>
                    {_DEV_DATA_SOURCE.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={Object.assign({}, _kTd, { textAlign:'center' })}>
                  <button onClick={() => remove(d.id)} style={Object.assign({}, _kBtn('danger'), { padding:'3px 8px', fontSize:11 })}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── C. Bindings Editor ──────────────────────────────────────
function _BindingEditor() {
  const SS = window.SettingsStore;
  const inv = SS.getSettings().deviceInventory || [];
  const bindings = SS.getSettings().deviceBindingRules || {};
  const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];

  const stageOrder = [
    { id:'INC', label:'孵化槽 Hatch (I1–I7)' },
    { id:'NUR', label:'小魚池 Nursery (A1–A6)' },
    { id:'JUV', label:'中魚池 Juvenile (J1–J2)' },
    { id:'GRO', label:'大魚池 Grow-out (B1–B4)' },
  ];

  function setBinding(devId, patch) {
    const next = JSON.parse(JSON.stringify(bindings));
    next[devId] = Object.assign({ tankId:null, metrics:[], autoFill:false, includeInAlerts:true }, next[devId] || {}, patch);
    const user = SS.getCurrentUser();
    SS.updateSettings({ deviceBindingRules: next }, user && user.id, 'ui');
  }

  function toggleMetric(devId, m) {
    const cur = (bindings[devId] && bindings[devId].metrics) || [];
    const next = cur.indexOf(m) >= 0 ? cur.filter(x=>x!==m) : cur.concat([m]);
    setBinding(devId, { metrics: next });
  }

  return (
    <div>
      <div style={{ fontSize:13, color:'var(--fg-0)', marginBottom:10 }}>
        每台設備可綁定 1 個池 + 多個 metric。<strong style={{ color:'var(--accent)' }}>多參數儀建議綁全部 metric。</strong>
      </div>
      <div style={{ overflowX:'auto', border:'1px solid var(--line-soft)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-1)' }}>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:140 })}>設備 ID</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left' })}>設備</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:240 })}>綁定池</th>
              <th style={Object.assign({}, _kTh, { textAlign:'left', width:200 })}>提供 metric</th>
              <th style={Object.assign({}, _kTh, { width:80 })}>autoFill</th>
            </tr>
          </thead>
          <tbody>
            {inv.map(d => {
              const b = bindings[d.id] || { tankId:null, metrics:[], autoFill:false };
              return (
                <tr key={d.id} style={{ borderTop:'1px solid var(--line-soft)' }}>
                  <td style={Object.assign({}, _kTd, { fontFamily:'var(--font-mono)', fontSize:11 })}>{d.id}</td>
                  <td style={Object.assign({}, _kTd, { fontSize:13 })}>
                    <div style={{ fontWeight:600 }}>{d.nameZh}</div>
                    <div style={{ fontSize:10, color:'var(--fg-0)' }}>{d.brand} · {d.kind}</div>
                  </td>
                  <td style={_kTd}>
                    <select value={b.tankId || ''} onChange={e=>setBinding(d.id, { tankId: e.target.value || null })}
                            style={_kInputText}>
                      <option value="">— 未綁定</option>
                      {stageOrder.map(s => {
                        const stageTanks = tanks.filter(t => t.stage === s.id);
                        if (stageTanks.length === 0) return null;
                        return (
                          <optgroup key={s.id} label={s.label}>
                            {stageTanks.map(t => {
                              const sameStage = tanks.filter(x => x.stage === t.stage);
                              const idx = sameStage.findIndex(x => x.id === t.id) + 1;
                              const stageZh = ({INC:'孵化槽',NUR:'小魚池',JUV:'中魚池',GRO:'大魚池'})[t.stage];
                              return <option key={t.id} value={t.id}>{stageZh + idx}（{t.id}）</option>;
                            })}
                          </optgroup>
                        );
                      })}
                    </select>
                  </td>
                  <td style={_kTd}>
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                      {_ALL_METRICS.map(m => {
                        const on = b.metrics.indexOf(m) >= 0;
                        const supported = (d.supportedMetrics || []).indexOf(m) >= 0;
                        return (
                          <span key={m} onClick={() => supported && toggleMetric(d.id, m)}
                                title={supported ? '' : '此設備不支援此 metric'}
                                style={{
                                  padding:'1px 6px', fontSize:10,
                                  cursor: supported ? 'pointer' : 'not-allowed',
                                  border:'1px solid '+(on ? 'var(--accent)' : 'var(--line)'),
                                  background: on ? 'var(--accent)' : 'transparent',
                                  color: on ? 'var(--bg-0)' : (supported ? 'var(--fg-0)' : 'var(--fg-1)'),
                                  fontWeight: on ? 700 : 400,
                                  opacity: supported ? 1 : 0.4,
                                }}>{m}</span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={Object.assign({}, _kTd, { textAlign:'center' })}>
                    <span onClick={() => setBinding(d.id, { autoFill: !b.autoFill })} style={{
                      display:'inline-block', cursor:'pointer',
                      width:36, height:18, borderRadius:9, position:'relative',
                      background: b.autoFill ? 'var(--ok)' : 'var(--line)',
                    }}>
                      <span style={{
                        position:'absolute', top:2, left: b.autoFill ? 20 : 2,
                        width:14, height:14, borderRadius:'50%', background:'#fff',
                      }}></span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   07 · Notifications Editor (Phase 4)
   ============================================================ */
function NotificationsEditor() {
  _useSettingsRev();
  const SS = window.SettingsStore;
  const cfg = (SS.getSettings().notifications) || {};

  const [draft, setDraft] = useStateXP(() => JSON.parse(JSON.stringify(cfg)));
  const [savedAt, setSavedAt] = useStateXP(null);
  const [testing, setTesting] = useStateXP(false);
  const [testResult, setTestResult] = useStateXP(null);

  useEffectXP(() => {
    setDraft(JSON.parse(JSON.stringify(cfg)));
    // eslint-disable-next-line
  }, [JSON.stringify(cfg)]);

  function save() {
    const user = SS.getCurrentUser();
    SS.updateSettings({ notifications: draft }, user && user.id, 'ui');
    setSavedAt(new Date().toLocaleTimeString());
    setTimeout(() => setSavedAt(null), 3000);
  }

  async function handleTest() {
    if (!window.AlertEngine) { setTestResult({ error: 'AlertEngine 未載入' }); return; }
    if (!confirm('將發送一筆測試訊息到 Telegram。確認？')) return;
    setTesting(true);
    setTestResult(null);
    // Save first to make sure config is current
    save();
    setTimeout(async () => {
      const r = await window.AlertEngine.testNotify();
      setTestResult(r);
      setTesting(false);
    }, 200);
  }

  return (
    <div style={{ padding:14, border:'1px solid var(--line)' }}>
      <div style={_sectionTitle}>07 · Notifications · 警報通知</div>

      {/* SECURITY warning */}
      <div style={{
        padding:'10px 14px', marginBottom:14,
        border:'2px solid var(--danger)', borderLeft:'4px solid var(--danger)',
        background:'oklch(0.40 0.12 25 / 0.18)',
      }}>
        <div style={{ fontSize:14, fontWeight:700, color:'var(--danger)', marginBottom:4 }}>
          ⚠ 安全提醒 · Security Notice
        </div>
        <div style={{ fontSize:12, color:'var(--fg-0)', lineHeight:1.6 }}>
          目前 token 存於瀏覽器 localStorage（client-side），任何能打開此頁的人都能查看。
          <strong style={{ color:'var(--danger)' }}>正式部署需改由後端 API 發送 token，不可暴露於前端。</strong>
          現階段僅供 KLK 內部測試使用。
        </div>
      </div>

      {/* Telegram */}
      <div style={{ marginBottom:18, padding:12, background:'var(--bg-1)', border:'1px solid var(--line-soft)' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:10 }}>
          <span style={{ fontSize:16, fontWeight:700, color:'var(--fg-0)' }}>Telegram</span>
          <span style={{ flex:1 }} />
          <label style={{ display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer' }}>
            <input type="checkbox" checked={!!(draft.telegram && draft.telegram.enabled)}
                   onChange={e => setDraft(d => Object.assign({}, d, {
                     telegram: Object.assign({}, d.telegram || {}, { enabled: e.target.checked })
                   }))} style={{ width:18, height:18 }} />
            <span style={{ fontSize:13, fontWeight:600, color:'var(--fg-0)' }}>啟用</span>
          </label>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:13, color:'var(--fg-0)' }}>Bot Token</span>
          <input type="text" value={(draft.telegram && draft.telegram.botToken) || ''}
                 placeholder="123456789:ABCdef..."
                 onChange={e => setDraft(d => Object.assign({}, d, {
                   telegram: Object.assign({}, d.telegram || {}, { botToken: e.target.value })
                 }))}
                 style={Object.assign({}, _kInputText, { fontSize:13, padding:'6px 8px' })}/>
          <span style={{ fontSize:13, color:'var(--fg-0)' }}>Chat ID</span>
          <input type="text" value={(draft.telegram && draft.telegram.chatId) || ''}
                 placeholder="-1001234567890"
                 onChange={e => setDraft(d => Object.assign({}, d, {
                   telegram: Object.assign({}, d.telegram || {}, { chatId: e.target.value })
                 }))}
                 style={Object.assign({}, _kInputText, { fontSize:13, padding:'6px 8px' })}/>
        </div>
        <div style={{ marginTop:8, fontSize:11, color:'var(--fg-0)', fontStyle:'italic' }}>
          取得方式：在 Telegram 找 @BotFather → /newbot → 取得 token；加 Bot 入 chat 後呼叫 /getUpdates 取得 chatId。
        </div>
      </div>

      {/* LINE (stub) */}
      <div style={{ marginBottom:18, padding:12, background:'var(--bg-1)', border:'1px dashed var(--warn)' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
          <span style={{ fontSize:16, fontWeight:700, color:'var(--fg-0)' }}>LINE</span>
          <span style={{
            padding:'2px 8px', fontSize:11, fontWeight:700,
            color:'var(--warn)', border:'1px solid var(--warn)',
          }}>v2 規劃</span>
        </div>
        <div style={{ marginTop:8, fontSize:13, color:'var(--fg-0)', lineHeight:1.6 }}>
          LINE Notify 已於 <strong>2025-03-31</strong> 終止。LINE Messaging API 需後端代理 webhook，無法在 client 直接呼叫。
          v2 將以後端服務支援。
        </div>
      </div>

      {/* Rules */}
      <div style={{ marginBottom:18, padding:12, background:'var(--bg-1)', border:'1px solid var(--line-soft)' }}>
        <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-0)', marginBottom:10 }}>
          通用規則
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:13, color:'var(--fg-0)' }}>冷卻時間（分鐘）</span>
          <input type="number" min="1" value={(draft.rules && draft.rules.cooldownMinutes) || 10}
                 onChange={e => setDraft(d => Object.assign({}, d, {
                   rules: Object.assign({}, d.rules || {}, { cooldownMinutes: parseInt(e.target.value, 10) })
                 }))}
                 style={Object.assign({}, _kInputText, { width:120 })}/>
          <span style={{ fontSize:13, color:'var(--fg-0)' }}>嚴重度門檻</span>
          <select value={(draft.rules && draft.rules.severityThreshold) || 'warning'}
                  onChange={e => setDraft(d => Object.assign({}, d, {
                    rules: Object.assign({}, d.rules || {}, { severityThreshold: e.target.value })
                  }))}
                  style={Object.assign({}, _kInputText, { width:200 })}>
            <option value="warning">warning（warning + danger 都發送）</option>
            <option value="danger">danger（只發 danger）</option>
          </select>
        </div>
      </div>

      {/* Save + Test */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1, fontSize:13 }}>
          {savedAt ? <span style={{ color:'var(--ok)', fontWeight:700 }}>✓ 已儲存 {savedAt}</span> : null}
          {testResult ? (
            <div style={{ marginTop:4, fontSize:12 }}>
              {testResult.telegram?.ok ? <span style={{ color:'var(--ok)' }}>✓ Telegram 測試成功</span>
               : testResult.telegram?.skipped ? <span style={{ color:'var(--warn)' }}>⚠ Telegram skipped: {testResult.telegram.skipped}</span>
               : <span style={{ color:'var(--danger)' }}>✗ Telegram 失敗：{testResult.telegram?.error || '未知錯誤'}</span>}
            </div>
          ) : null}
        </div>
        <button onClick={handleTest} disabled={testing} style={_kBtn('default')}>
          {testing ? '測試中…' : '🚀 測試發送'}
        </button>
        <button onClick={save} style={_kBtn('primary')}>儲存</button>
      </div>
    </div>
  );
}

// ─── KLK Settings Page (top-level tab container) ─────────────
function SettingsPageFull() {
  const [active, setActive] = useStateXP('standards');
  _useSettingsRev();

  const currentUser = window.SettingsStore && window.SettingsStore.getCurrentUser();
  const isAdmin = currentUser && currentUser.role === 'admin';

  return (
    <div className="page-fade" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Permission notice */}
      {!isAdmin ? (
        <div style={{
          padding:'10px 14px', border:'1px solid var(--warn)',
          borderLeft:'3px solid var(--warn)',
          background:'oklch(0.32 0.06 78 / 0.18)',
          color:'var(--fg-0)', fontSize:12,
        }}>
          ⚠ 您（<strong>{currentUser ? currentUser.name : '未登入'}</strong>，
          {currentUser ? currentUser.role : 'unknown'}）非管理員，可瀏覽但<strong>儲存將被拒絕</strong>。
          請從 sidebar 底部切換到 admin 帳號（王經理）。
        </div>
      ) : null}

      {/* KLK header bar */}
      <div style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'10px 14px', background:'var(--bg-1)',
        border:'1px solid var(--line)',
      }}>
        <div style={{ flex:1 }}>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10,
            color:'var(--accent)', letterSpacing:0.12, textTransform:'uppercase',
          }}>養殖參數管理中心</div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--fg-0)' }}>
            KLK Settings · v0.1
          </div>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--fg-0)' }}>
          目前使用者 ·
          <span style={{ color: isAdmin ? 'var(--accent)' : 'var(--warn)', marginLeft:4, fontWeight:600 }}>
            {currentUser ? currentUser.name : '—'}
          </span>
          <span style={{ color:'var(--fg-1)', marginLeft:4 }}>· {currentUser ? currentUser.role : ''}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--line)' }}>
        {_KLK_TABS.map(t => {
          const isAct = active === t.id;
          return (
            <div key={t.id} onClick={() => setActive(t.id)}
                 style={{
                   padding:'10px 18px', cursor:'pointer',
                   borderBottom: isAct ? '2px solid var(--accent)' : '2px solid transparent',
                   color: isAct ? 'var(--accent)' : 'var(--fg-0)',
                   fontWeight: isAct ? 600 : 400,
                 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, marginRight:6 }}>{t.num}</span>
              {t.zh} <span style={{ fontFamily:'var(--font-mono)', fontSize:10.5, marginLeft:4 }}>· {t.en}</span>
            </div>
          );
        })}
      </div>

      {/* Editor content */}
      {active === 'standards'      ? <StageStandardsEditor /> : null}
      {active === 'sampling'       ? <SamplingFrequencyEditor /> : null}
      {active === 'staff'          ? <StaffEditor /> : null}
      {active === 'responsibility' ? <ResponsibilityEditor /> : null}
      {active === 'options'        ? <OptionsEditor /> : null}
      {active === 'equipment'      ? <EquipmentEditor /> : null}
      {active === 'notifications'  ? <NotificationsEditor /> : null}
    </div>
  );
}

window.StageStandardsEditor    = StageStandardsEditor;
window.SamplingFrequencyEditor = SamplingFrequencyEditor;
window.StaffEditor             = StaffEditor;
window.ResponsibilityEditor    = ResponsibilityEditor;
window.OptionsEditor           = OptionsEditor;
window.EquipmentEditor         = EquipmentEditor;
window.NotificationsEditor     = NotificationsEditor;

window.AnalyticsPageFull = AnalyticsPageFull;
window.ReportsPageFull = ReportsPageFull;
window.SettingsPageFull = SettingsPageFull;
