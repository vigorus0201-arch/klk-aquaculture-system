/* ============================================================
   KLK AlertEngine + Notifier (v0.1)
   ─ Single-file module (no build / no TS / CDN-friendly)
   ─ Exposes:  window.AlertEngine
               window.compareRequiredDevices
   ─ Reads:    SettingsStore, LogStore, AQUA_DATA.TANKS
   ─ Writes:   in-memory active alerts + Telegram fetch (optional)
   ─ Auto-starts after a tick to allow other scripts to load.
   ============================================================ */
(function () {
  'use strict';

  // ─── Storage keys ──────────────────────────────────────────
  const ALERT_STATE_KEY = 'klk_alert_state_v1';   // active alerts persistence (best-effort)

  // ─── Internal state ────────────────────────────────────────
  const _state = {
    activeAlerts: [],        // { id, level, tankId, stage, category, type, title, message, action, value, threshold, source, timestamp }
    lastAlertMap: {},        // 'A1:TEMP_HIGH' -> ms timestamp (for cooldown)
    subscribers: [],
    started: false,
    unsubLogs: null,
  };

  // ─── Utilities ─────────────────────────────────────────────
  function _uid() { return 'al-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }
  function _now() { return new Date().toISOString(); }
  function _ms()  { return Date.now(); }
  function _read(k, fb) {
    try { const r = localStorage.getItem(k); return r == null ? fb : JSON.parse(r); }
    catch (e) { return fb; }
  }
  function _write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }
  function _emit() {
    _state.subscribers.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
  }

  // Stage Chinese map
  const STAGE_ZH = { INC:'孵化槽', NUR:'小魚池', JUV:'中魚池', GRO:'大魚池', BRO:'親魚池' };

  // Tank label: 「小魚池1（A1）」
  function _tankLabel(tank) {
    if (!tank) return '—';
    const tanks = (window.AQUA_DATA && window.AQUA_DATA.TANKS) || [];
    const sameStage = tanks.filter(t => t.stage === tank.stage);
    const idx = sameStage.findIndex(t => t.id === tank.id) + 1;
    const stageZh = STAGE_ZH[tank.stage] || tank.stage;
    return stageZh + idx + '（' + tank.id + '）';
  }

  /* ======================================================================
     1. Data unified entry: getLatestWaterData(tankId)
     ====================================================================== */
  function getLatestWaterData(tankId) {
    if (!window.LogStore || !window.AQUA_DATA) return null;
    const tank = (window.AQUA_DATA.TANKS || []).find(t => t.id === tankId);
    if (!tank) return null;
    const lc = window.LogStore.latest('water', tankId);
    if (!lc) return null;
    const d = lc.data || {};
    return {
      tankId,
      stage: tank.stage,
      temp: d.temp != null ? d.temp : null,
      doO:  d.doO  != null ? d.doO  : null,
      ph:   d.ph   != null ? d.ph   : null,
      nh3:  d.nh3  != null ? d.nh3  : null,
      no2:  d.no2  != null ? d.no2  : null,
      timestamp: lc.recordedAt,
      source: lc.source || 'manual',
      enteredBy: lc.enteredBy ? lc.enteredBy.name : '—',
    };
  }

  /* ======================================================================
     2. Water status evaluator: evaluateWaterLog(log, stageStandard)
     ====================================================================== */
  function evaluateWaterLog(log, std) {
    if (!log || !std) return { status:'normal', issues:[] };
    const issues = [];
    const slack = { temp:0.5, doO:0.5, ph:0.2, nh3:0.05, no2:0.10 };

    // TEMP
    if (log.temp != null && std.temp) {
      const [lo, hi] = std.temp;
      if (log.temp > hi + slack.temp) {
        issues.push({ type:'TEMP_HIGH', value:log.temp, threshold:hi, severity:'danger' });
      } else if (log.temp > hi) {
        issues.push({ type:'TEMP_HIGH', value:log.temp, threshold:hi, severity:'warning' });
      } else if (log.temp < lo - slack.temp) {
        issues.push({ type:'TEMP_LOW',  value:log.temp, threshold:lo, severity:'danger' });
      } else if (log.temp < lo) {
        issues.push({ type:'TEMP_LOW',  value:log.temp, threshold:lo, severity:'warning' });
      }
    }
    // DO
    if (log.doO != null && std.doMin != null) {
      if (log.doO < std.doMin - slack.doO) {
        issues.push({ type:'DO_LOW', value:log.doO, threshold:std.doMin, severity:'danger' });
      } else if (log.doO < std.doMin) {
        issues.push({ type:'DO_LOW', value:log.doO, threshold:std.doMin, severity:'warning' });
      }
    }
    // pH
    if (log.ph != null && std.ph) {
      const [lo, hi] = std.ph;
      if (log.ph > hi + slack.ph || log.ph < lo - slack.ph) {
        issues.push({ type: log.ph > hi ? 'PH_HIGH' : 'PH_LOW', value:log.ph, threshold: log.ph > hi ? hi : lo, severity:'danger' });
      } else if (log.ph > hi || log.ph < lo) {
        issues.push({ type: log.ph > hi ? 'PH_HIGH' : 'PH_LOW', value:log.ph, threshold: log.ph > hi ? hi : lo, severity:'warning' });
      }
    }
    // NH3
    if (log.nh3 != null && std.nh3Max != null) {
      if (log.nh3 > std.nh3Max + slack.nh3) {
        issues.push({ type:'NH3_HIGH', value:log.nh3, threshold:std.nh3Max, severity:'danger' });
      } else if (log.nh3 > std.nh3Max) {
        issues.push({ type:'NH3_HIGH', value:log.nh3, threshold:std.nh3Max, severity:'warning' });
      }
    }
    // NO2
    if (log.no2 != null && std.no2Max != null) {
      if (log.no2 > std.no2Max + slack.no2) {
        issues.push({ type:'NO2_HIGH', value:log.no2, threshold:std.no2Max, severity:'danger' });
      } else if (log.no2 > std.no2Max) {
        issues.push({ type:'NO2_HIGH', value:log.no2, threshold:std.no2Max, severity:'warning' });
      }
    }

    const overall = issues.some(i => i.severity === 'danger') ? 'danger'
                  : issues.some(i => i.severity === 'warning') ? 'warning'
                  : 'normal';
    return { status: overall, issues };
  }

  /* ======================================================================
     3. classifyIssue(issue) → { category, severity, messageZh, actionZh }
     ====================================================================== */
  function classifyIssue(issue) {
    const map = {
      TEMP_HIGH: { category:'TEMP',     messageZh:'水溫過高',   actionZh:'啟動降溫或檢查冷卻系統' },
      TEMP_LOW:  { category:'TEMP',     messageZh:'水溫過低',   actionZh:'確認冷卻系統設定，避免供水過冷' },
      DO_LOW:    { category:'OXYGEN',   messageZh:'溶氧不足',   actionZh:'立即啟動曝氣 / O₂ 加注' },
      PH_HIGH:   { category:'PH',       messageZh:'pH 偏高',    actionZh:'檢查水質，必要時換水' },
      PH_LOW:    { category:'PH',       messageZh:'pH 偏低',    actionZh:'檢查水質，必要時加緩衝劑' },
      NH3_HIGH:  { category:'TOXICITY', messageZh:'氨氮過高',   actionZh:'換水並檢查生化過濾' },
      NO2_HIGH:  { category:'TOXICITY', messageZh:'亞硝酸過高', actionZh:'換水並加強硝化' },
    };
    const m = map[issue.type] || { category:'OTHER', messageZh:'水質異常', actionZh:'檢查並補測' };
    return Object.assign({ severity: issue.severity }, m);
  }

  /* ======================================================================
     4. generateAlert(issue, tank) → alert object
     ====================================================================== */
  function generateAlert(issue, tank, dataLog) {
    const cls = classifyIssue(issue);
    const tankLabel = _tankLabel(tank);
    const stageZh = STAGE_ZH[tank.stage] || tank.stage;
    const std = window.SettingsStore ? window.SettingsStore.getStageStandards(tank.stage) : null;

    // Build threshold string for display
    let thresholdStr = '—';
    if (issue.type.startsWith('TEMP_') && std && std.temp) thresholdStr = std.temp[0] + '–' + std.temp[1] + '°C';
    else if (issue.type === 'DO_LOW' && std) thresholdStr = '≥ ' + std.doMin;
    else if (issue.type.startsWith('PH_') && std && std.ph) thresholdStr = std.ph[0] + '–' + std.ph[1];
    else if (issue.type === 'NH3_HIGH' && std) thresholdStr = '≤ ' + std.nh3Max;
    else if (issue.type === 'NO2_HIGH' && std) thresholdStr = '≤ ' + std.no2Max;

    const unit = (issue.type.startsWith('TEMP_')) ? '°C'
              : (issue.type === 'DO_LOW') ? 'mg/L'
              : '';

    return {
      id:        _uid(),
      level:     issue.severity === 'danger' ? 'critical' : 'warning',
      tankId:    tank.id,
      tankLabel,
      stage:     tank.stage,
      stageZh,
      category:  cls.category,
      type:      issue.type,
      title:     tank.id + ' ' + cls.messageZh,
      message:   '目前 ' + issue.value + (unit ? ' ' + unit : '') + '（標準 ' + thresholdStr + '）',
      action:    cls.actionZh,
      value:     issue.value,
      threshold: issue.threshold,
      source:    dataLog ? dataLog.source : 'manual',
      enteredBy: dataLog ? dataLog.enteredBy : null,
      timestamp: _now(),
    };
  }

  /* ======================================================================
     5. shouldEmit() — 10-min cooldown per tank+issueType
     ====================================================================== */
  function shouldEmit(tankId, issueType) {
    const cfg = (window.SettingsStore && window.SettingsStore.getSettings().notifications) || {};
    const cooldownMin = (cfg.rules && cfg.rules.cooldownMinutes) || 10;
    const key = tankId + ':' + issueType;
    const last = _state.lastAlertMap[key];
    const now = _ms();
    if (last && (now - last) < cooldownMin * 60 * 1000) return false;
    _state.lastAlertMap[key] = now;
    return true;
  }

  /* ======================================================================
     6. Active alert list management
     ====================================================================== */
  function _pushAlert(alert) {
    _state.activeAlerts.push(alert);
    // TTL pruning
    const cfg = (window.SettingsStore && window.SettingsStore.getSettings().notifications) || {};
    const ttlMin = (cfg.rules && cfg.rules.activeAlertTTLMin) || 60;
    const cutoff = _ms() - ttlMin * 60 * 1000;
    _state.activeAlerts = _state.activeAlerts.filter(a => new Date(a.timestamp).getTime() > cutoff);
    // persist (best-effort)
    _write(ALERT_STATE_KEY, { alerts: _state.activeAlerts.slice(-50), updatedAt: _now() });
    _emit();
  }

  function getActiveAlerts() { return _state.activeAlerts.slice(); }
  function clearAlert(id) {
    _state.activeAlerts = _state.activeAlerts.filter(a => a.id !== id);
    _write(ALERT_STATE_KEY, { alerts: _state.activeAlerts, updatedAt: _now() });
    _emit();
  }
  function clearAll() {
    _state.activeAlerts = [];
    _write(ALERT_STATE_KEY, { alerts: [], updatedAt: _now() });
    _emit();
  }

  /* ======================================================================
     7. Notifier — Telegram (real fetch) + LINE (stub)
     ====================================================================== */
  function _fmtTelegramMessage(alert) {
    const ts = new Date(alert.timestamp);
    const p = (n) => String(n).padStart(2, '0');
    const tsStr = ts.getFullYear() + '-' + p(ts.getMonth()+1) + '-' + p(ts.getDate())
                + ' ' + p(ts.getHours()) + ':' + p(ts.getMinutes());
    const sourceZh = alert.source === 'manual' ? '人工輸入'
                  : alert.source === 'device' ? '設備自動'
                  : alert.source === 'imported' ? '匯入資料' : alert.source;
    const icon = alert.level === 'critical' ? '🚨' : '⚠';
    return [
      icon + '【KLK 水質警報】',
      '',
      '池：' + alert.tankLabel,
      '問題：' + alert.title.replace(alert.tankId + ' ', ''),
      '目前：' + alert.message,
      '',
      '建議：',
      alert.action,
      '',
      '時間：' + tsStr,
      '來源：' + sourceZh + (alert.enteredBy ? ' by ' + alert.enteredBy : ''),
    ].join('\n');
  }

  async function _sendTelegram(alert, cfg) {
    if (!cfg.enabled) return { skipped:'disabled' };
    if (!cfg.botToken || !cfg.chatId) return { skipped:'not-configured' };
    try {
      const url = 'https://api.telegram.org/bot' + cfg.botToken + '/sendMessage';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          text: _fmtTelegramMessage(alert),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.warn('[AlertEngine] Telegram send failed:', data);
        return { ok:false, error: data.description };
      }
      return { ok:true };
    } catch (e) {
      console.error('[AlertEngine] Telegram send error:', e);
      return { ok:false, error: e.message };
    }
  }

  function _sendLine(alert, cfg) {
    // v2 stub — LINE Notify deprecated 2025-03-31; Messaging API needs backend proxy
    if (!cfg.enabled) return { skipped:'disabled' };
    console.warn('[AlertEngine] LINE not implemented (v2 backend proxy required)');
    return { skipped:'not-implemented' };
  }

  async function sendNotification(alert) {
    const cfg = (window.SettingsStore && window.SettingsStore.getSettings().notifications) || {};
    // severity threshold filter
    const thr = (cfg.rules && cfg.rules.severityThreshold) || 'warning';
    if (thr === 'danger' && alert.level !== 'critical') return { skipped:'below-threshold' };

    const results = {};
    if (cfg.telegram) results.telegram = await _sendTelegram(alert, cfg.telegram);
    if (cfg.line)     results.line     = _sendLine(alert, cfg.line);
    return results;
  }

  /* ======================================================================
     8. evaluateAll / evaluateTank — main triggering loop
     ====================================================================== */
  function evaluateTank(tankId) {
    if (!window.SettingsStore || !window.LogStore) return [];
    const tank = (window.AQUA_DATA.TANKS || []).find(t => t.id === tankId);
    if (!tank) return [];
    const log = getLatestWaterData(tankId);
    if (!log) return [];
    const std = window.SettingsStore.getStageStandards(tank.stage);
    const ev = evaluateWaterLog(log, std);
    const alerts = [];
    ev.issues.forEach(issue => {
      if (!shouldEmit(tankId, issue.type)) return;
      const alert = generateAlert(issue, tank, log);
      _pushAlert(alert);
      sendNotification(alert).then(r => {
        if (r && r.telegram) console.info('[AlertEngine] Telegram:', r.telegram);
      });
      alerts.push(alert);
    });
    return alerts;
  }

  function evaluateAll() {
    if (!window.AQUA_DATA) return [];
    const tanks = window.AQUA_DATA.TANKS || [];
    const all = [];
    tanks.forEach(t => {
      const a = evaluateTank(t.id);
      all.push.apply(all, a);
    });
    return all;
  }

  /* ======================================================================
     9. Subscribe API for UI
     ====================================================================== */
  function subscribe(cb) {
    _state.subscribers.push(cb);
    return function unsub() {
      const i = _state.subscribers.indexOf(cb);
      if (i >= 0) _state.subscribers.splice(i, 1);
    };
  }

  /* ======================================================================
     10. Lifecycle: start() / stop()
     ====================================================================== */
  function start() {
    if (_state.started) return;
    if (!window.LogStore || !window.SettingsStore) {
      console.warn('[AlertEngine] LogStore/SettingsStore not ready, deferring start');
      setTimeout(start, 200);
      return;
    }

    // Restore active alerts (best-effort)
    const restored = _read(ALERT_STATE_KEY, null);
    if (restored && Array.isArray(restored.alerts)) {
      const ttlMin = 60;
      const cutoff = _ms() - ttlMin * 60 * 1000;
      _state.activeAlerts = restored.alerts.filter(a => new Date(a.timestamp).getTime() > cutoff);
    }

    // Subscribe to LogStore — re-evaluate on any log change
    _state.unsubLogs = window.LogStore.subscribe(function () {
      // small delay to allow log to settle
      setTimeout(evaluateAll, 50);
    });
    _state.started = true;
    console.info('[AlertEngine] started');
  }

  function stop() {
    if (_state.unsubLogs) _state.unsubLogs();
    _state.started = false;
    console.info('[AlertEngine] stopped');
  }

  /* ======================================================================
     11. compareRequiredDevices(stage, tankId) — equipment gap calc
     ====================================================================== */
  function compareRequiredDevices(stage, tankId) {
    const ss = window.SettingsStore ? window.SettingsStore.getSettings() : {};
    const required  = (ss.stageEquipmentRequirements && ss.stageEquipmentRequirements[stage]) || [];
    const allDevs   = ss.deviceInventory || [];
    const bindings  = ss.deviceBindingRules || {};

    // installed = devices bound to this tank
    const installedIds = Object.keys(bindings).filter(devId => bindings[devId].tankId === tankId);
    const installed   = installedIds.map(id => allDevs.find(d => d.id === id)).filter(Boolean);

    // For each required type, find a satisfying device
    const results = required.map(req => {
      const matched = installed.find(dev => {
        // multiparam covers multiple metrics
        if (dev.kind === 'multiparam' && req.metrics && req.metrics.length > 0) {
          return req.metrics.some(m => (dev.supportedMetrics || []).indexOf(m) >= 0);
        }
        // direct kind match
        if (dev.kind === req.type) return true;
        // type-by-metric fallback: e.g. req.type='temp_sensor' matches any device with 'temp' supported
        if (req.metrics && req.metrics.length > 0) {
          return req.metrics.some(m => (dev.supportedMetrics || []).indexOf(m) >= 0);
        }
        return false;
      });
      return {
        type: req.type,
        label: req.label,
        required: req.required,
        suggested: req.suggested || null,
        satisfied: !!matched,
        satisfiedBy: matched ? matched.id : null,
        satisfiedByName: matched ? (matched.nameZh || matched.id) : null,
      };
    });

    const requiredCount  = results.filter(r => r.required).length;
    const satisfiedCount = results.filter(r => r.required && r.satisfied).length;

    return {
      stage, tankId,
      requiredDevices: results,
      installedDevices: installed,
      missingDevices: results.filter(r => r.required && !r.satisfied),
      coverageRate: requiredCount > 0 ? satisfiedCount / requiredCount : 1,
      coverageText: satisfiedCount + ' / ' + requiredCount,
    };
  }

  // Helper: device can supply this metric to this tank?
  function _hasDeviceForMetric(tankId, metric) {
    const ss = window.SettingsStore ? window.SettingsStore.getSettings() : {};
    const allDevs = ss.deviceInventory || [];
    const bindings = ss.deviceBindingRules || {};
    return Object.keys(bindings).some(devId => {
      const b = bindings[devId];
      if (b.tankId !== tankId) return false;
      const dev = allDevs.find(d => d.id === devId);
      if (!dev) return false;
      return (dev.supportedMetrics || []).indexOf(metric) >= 0;
    });
  }

  /* ======================================================================
     12. Test send (for Settings UI test button)
     ====================================================================== */
  async function testNotify() {
    const fakeAlert = {
      id: 'test-' + Date.now(),
      level: 'warning',
      tankId: 'TEST',
      tankLabel: '測試池（TEST）',
      stage: 'NUR',
      stageZh: '小魚池',
      category: 'TEMP',
      type: 'TEMP_HIGH',
      title: 'TEST 水溫過高',
      message: '目前 19.0 °C（標準 15–17°C）',
      action: '請立即降溫或檢查 chiller',
      value: 19,
      threshold: 17,
      source: 'manual',
      enteredBy: '系統測試',
      timestamp: _now(),
    };
    return await sendNotification(fakeAlert);
  }

  /* ======================================================================
     Expose globally
     ====================================================================== */
  window.AlertEngine = {
    // data
    getLatestWaterData,
    // core
    evaluateWaterLog,
    classifyIssue,
    generateAlert,
    shouldEmit,
    // engine
    evaluateAll,
    evaluateTank,
    start,
    stop,
    // alerts
    getActiveAlerts,
    clearAlert,
    clearAll,
    subscribe,
    // notifier
    sendNotification,
    testNotify,
  };
  window.compareRequiredDevices = compareRequiredDevices;
  window._hasDeviceForMetric = _hasDeviceForMetric;

  // Auto-start after a tick
  setTimeout(function () {
    try { start(); } catch (e) { console.error('[AlertEngine] start failed:', e); }
  }, 300);

})();
