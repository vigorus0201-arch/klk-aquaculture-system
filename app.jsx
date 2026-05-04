/* global React, ReactDOM, AQUA_DATA, Sidebar, Topbar, PageHeader, TankDrawer,
   OverviewPage, EnvironmentPage, WorkflowPage, DevicesPage, MonitoringPage,
   AnalyticsPage, ReportsPage, SettingsPage, ManualLogsPage,
   AnalyticsPageFull, ReportsPageFull, SettingsPageFull */
const { useState: useStateApp, useEffect: useEffectApp } = React;

function App() {
  const [active, setActive] = useStateApp('overview');
  const [sub, setSub] = useStateApp('all'); // monitoring sub-nav
  const [selectedTank, setSelectedTank] = useStateApp('B2');
  const [drawerTank, setDrawerTank] = useStateApp(null);
  const [, setSettingsVer] = useStateApp(0);

  // Re-render whole app whenever Settings (incl. current user) changes
  useEffectApp(() => {
    if (!window.SettingsStore) return;
    return window.SettingsStore.subscribe(() => setSettingsVer(x => x + 1));
  }, []);

  const alerts = AQUA_DATA.ALERTS;
  const dangerCount = alerts.filter(a => a.sev === 'danger').length;

  function handleNav(id) {
    setActive(id);
    if (id === 'monitoring') setSub('all');
  }

  let body;
  switch (active) {
    case 'overview':    body = <OverviewPage />; break;
    case 'environment': body = <EnvironmentPage />; break;
    case 'workflow':    body = <WorkflowPage />; break;
    case 'devices':     body = <DevicesPage />; break;
    case 'monitoring':  body = <MonitoringPage sub={sub} selectedTank={selectedTank} setSelectedTank={setSelectedTank} setDrawerTank={setDrawerTank} />; break;
    case 'analytics':   body = <AnalyticsPageFull />; break;
    case 'reports':     body = <ReportsPageFull />; break;
    case 'manual-logs': body = <ManualLogsPage />; break;
    case 'settings':    body = <SettingsPageFull />; break;
    default:            body = <OverviewPage />;
  }

  return (
    <div className="app">
      <Sidebar active={active} sub={sub} onSelect={handleNav} onSubSelect={setSub} />
      <Topbar active={active} sub={sub} alertCount={alerts.length} dangerCount={dangerCount} />
      <main className="main">
        <PageHeader active={active} sub={sub} />
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }} key={active + '/' + sub}>
          {body}
        </div>
      </main>

      <TankDrawer tankId={drawerTank} onClose={() => setDrawerTank(null)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
