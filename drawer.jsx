/* global React, AQUA_DATA, Ic, Bi, L, LineChart, StatusPill */
const { useMemo: useMemoD } = React;

function TankDrawer({ tankId, onClose }) {
  if (!tankId) return null;
  const tank = AQUA_DATA.TANKS.find(t => t.id === tankId);
  if (!tank) return null;
  const series = AQUA_DATA.TANK_SERIES[tankId];
  const th = AQUA_DATA.TANK_THRESHOLDS;
  const tankAlerts = AQUA_DATA.ALERTS.filter(a => a.tank === tankId);
  const tankFeed = AQUA_DATA.FEEDING_LOG.filter(r => r.tank === tankId);
  const tankMort = AQUA_DATA.MORTALITY_LOG.filter(r => r.tank === tankId);
  const tankOps  = AQUA_DATA.OPS_LOG.filter(r => r.tank === tankId);

  const tempFlag = tank.temp >= 14 ? 'danger' : tank.temp >= 13 ? 'warn' : '';
  const doFlag   = tank.doO  <= 6  ? 'danger' : tank.doO  <= 7  ? 'warn' : '';
  const phFlag   = tank.ph   < 6.4 || tank.ph > 8.0 ? 'danger' : (tank.ph < 6.6 || tank.ph > 7.8) ? 'warn' : '';
  const mortFlag = tank.mortality >= 20 ? 'danger' : tank.mortality >= 6 ? 'warn' : '';

  // 24h status history (synthetic)
  const history = [
    { t: '14:42', stat: 'danger', ev: '溶氧降至 5.8 mg/L · DO dropped below critical (5.8)' },
    { t: '14:38', stat: 'danger', ev: '斃死率上升 31尾/24h · Mortality spike (31 fish)' },
    { t: '12:08', stat: 'warn',   ev: '溶氧降至 6.9 mg/L · DO entered warning band' },
    { t: '11:00', stat: 'ok',     ev: '正常運轉 · Stable operation' },
    { t: '08:30', stat: 'ok',     ev: '投餌完成 38.4 kg · Feeding complete' },
    { t: '06:00', stat: 'ok',     ev: '日班巡查通過 · Day-shift walkthrough OK' },
  ];

  return (
    <>
      <div className="drawer-scrim" onClick={onClose}></div>
      <aside className="drawer">
        <div className="drawer-head">
          <div className="drawer-id">{tank.id}</div>
          <div className="drawer-stage">{tank.stage}</div>
          <StatusPill status={tank.status} big />
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">

          <div>
            <div className="drawer-section-title">感測資料 <span className="en">SENSOR READINGS · LIVE</span></div>
            <div className="drawer-metrics-grid">
              <div className={`dm-cell ${tempFlag}`}>
                <div className="lbl">水溫 <span className="en">TEMP</span></div>
                <div className="val">{tank.temp.toFixed(1)}<span className="unit">°C</span></div>
              </div>
              <div className={`dm-cell ${doFlag}`}>
                <div className="lbl">溶氧 <span className="en">DO</span></div>
                <div className="val">{tank.doO.toFixed(1)}<span className="unit">mg/L</span></div>
              </div>
              <div className={`dm-cell ${phFlag}`}>
                <div className="lbl">pH <span className="en">PH</span></div>
                <div className="val">{tank.ph.toFixed(2)}</div>
              </div>
              <div className="dm-cell">
                <div className="lbl">鹽度 <span className="en">SALINITY</span></div>
                <div className="val">{tank.salinity.toFixed(1)}<span className="unit">ppt</span></div>
              </div>
              <div className="dm-cell">
                <div className="lbl">魚數 <span className="en">FISH COUNT</span></div>
                <div className="val">{tank.count.toLocaleString()}</div>
              </div>
              <div className={`dm-cell ${mortFlag}`}>
                <div className="lbl">今日斃死 <span className="en">DAILY MORT.</span></div>
                <div className="val">{tank.mortality}<span className="unit">尾</span></div>
              </div>
              <div className="dm-cell">
                <div className="lbl">生物量 <span className="en">BIOMASS</span></div>
                <div className="val">{tank.biomass}<span className="unit">kg</span></div>
              </div>
              <div className="dm-cell">
                <div className="lbl">水位 <span className="en">FILL</span></div>
                <div className="val">{tank.fillPct}<span className="unit">%</span></div>
              </div>
            </div>
          </div>

          <div>
            <div className="drawer-section-title">24小時趨勢 <span className="en">24h TREND</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, border: '1px solid var(--line-soft)' }}>
              <div className="chart-cell" style={{ borderRight: '1px solid var(--line-soft)' }}>
                <div className="chart-head">
                  <div className="chart-title">水溫 · TEMP</div>
                  <div className="chart-now" style={{ fontSize: 14 }}>{tank.temp.toFixed(1)}<span className="unit">°C</span></div>
                </div>
                <LineChart values={series.temp} times={series.t} thresholds={th.temp} color="oklch(0.78 0.13 78)" height={80} />
              </div>
              <div className="chart-cell" style={{ borderRight: '1px solid var(--line-soft)' }}>
                <div className="chart-head">
                  <div className="chart-title">溶氧 · DO</div>
                  <div className="chart-now" style={{ fontSize: 14 }}>{tank.doO.toFixed(1)}<span className="unit">mg/L</span></div>
                </div>
                <LineChart values={series.doO} times={series.t} thresholds={th.do} color="oklch(0.72 0.13 225)" height={80} />
              </div>
              <div className="chart-cell">
                <div className="chart-head">
                  <div className="chart-title">pH</div>
                  <div className="chart-now" style={{ fontSize: 14 }}>{tank.ph.toFixed(2)}</div>
                </div>
                <LineChart values={series.ph} times={series.t} thresholds={th.ph} color="oklch(0.74 0.14 165)" height={80} />
              </div>
            </div>
          </div>

          <div>
            <div className="drawer-section-title">近期警報 <span className="en">RECENT ALERTS</span> · {tankAlerts.length}</div>
            {tankAlerts.length === 0 ? (
              <div style={{ padding: 14, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11, border: '1px solid var(--line-soft)' }}>無警報 NO ALERTS</div>
            ) : (
              <div style={{ border: '1px solid var(--line-soft)' }}>
                {tankAlerts.map(a => (
                  <div key={a.id} className={`alert-row ${a.sev}`} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <div className="bar"></div>
                    <div className="alert-body">
                      <div className="alert-top">
                        <span className="alert-sev">{a.sev === 'danger' ? '危急' : a.sev === 'warn' ? '警告' : '通知'}</span>
                        <span style={{ color: 'var(--fg-3)' }}>{a.id}</span>
                      </div>
                      <div className="alert-msg">{a.title}</div>
                      <div className="alert-detail">
                        <span>{a.metric}: <span className="v">{a.value} {a.unit}</span></span>
                        <span>閾 / THRES: <span className="v">{a.threshold}</span></span>
                      </div>
                    </div>
                    <div className="alert-time">{a.ts}<br /><span style={{ opacity: 0.7 }}>{a.age}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="drawer-section-title">狀態歷程 <span className="en">STATUS HISTORY · 24h</span></div>
            <div style={{ border: '1px solid var(--line-soft)', padding: '0 14px' }}>
              {history.map((h, i) => (
                <div key={i} className="history-row">
                  <span className="t">{h.t}</span>
                  <span className={`stat ${h.stat}`}>{h.stat === 'ok' ? '正常 OK' : h.stat === 'warn' ? '警告 WARN' : '危急 DGR'}</span>
                  <span className="ev">{h.ev}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="drawer-section-title">人工紀錄 <span className="en">MANUAL LOGS</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ border: '1px solid var(--line-soft)' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--line-soft)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.10, textTransform: 'uppercase', color: 'var(--fg-2)' }}>投餌 FEEDING · {tankFeed.length}</div>
                <table className="log-table" style={{ fontSize: 10.5 }}>
                  <tbody>
                    {tankFeed.length === 0 ? <tr><td style={{ color: 'var(--fg-3)' }}>—</td></tr> :
                      tankFeed.map((r, i) => <tr key={i}><td>{r.time}</td><td>{r.kg}kg</td><td style={{ color: 'var(--fg-2)' }}>{r.feed}</td></tr>)}
                  </tbody>
                </table>
              </div>
              <div style={{ border: '1px solid var(--line-soft)' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--line-soft)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.10, textTransform: 'uppercase', color: 'var(--fg-2)' }}>斃死 / 作業 MORT / OPS</div>
                <table className="log-table" style={{ fontSize: 10.5 }}>
                  <tbody>
                    {tankMort.map((r, i) => <tr key={'m'+i}><td>{r.time}</td><td style={{ color: 'var(--danger)' }}>{r.count}尾</td><td style={{ color: 'var(--fg-2)' }}>{r.cause}</td></tr>)}
                    {tankOps.map((r, i) => <tr key={'o'+i}><td>{r.time}</td><td style={{ color: 'var(--info)' }}>OP</td><td style={{ color: 'var(--fg-2)' }}>{r.action}</td></tr>)}
                    {tankMort.length + tankOps.length === 0 ? <tr><td style={{ color: 'var(--fg-3)' }}>—</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}

window.TankDrawer = TankDrawer;
