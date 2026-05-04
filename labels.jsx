/* global React, AQUA_DATA, LineChart, Spark, Ic */
const { useState, useMemo } = React;

const L = {
  // sections
  tanks:    { zh: '魚池總覽', en: 'Tank Overview' },
  monitor:  { zh: '即時監測', en: 'Real-time Monitoring' },
  alerts:   { zh: '警報',     en: 'Alerts' },
  logs:     { zh: '人工紀錄', en: 'Manual Logs' },
  analytics:{ zh: '分析',     en: 'Analytics' },
  // sidebar
  dashboard:{ zh: '儀表板',   en: 'Dashboard' },
  hatchery: { zh: '孵化場',   en: 'Hatchery' },
  feeding:  { zh: '投餌',     en: 'Feeding' },
  mortality:{ zh: '斃死',     en: 'Mortality' },
  ops:      { zh: '作業',     en: 'Operations' },
  reports:  { zh: '報表',     en: 'Reports' },
  staff:    { zh: '人員',     en: 'Staff' },
  settings: { zh: '設定',     en: 'Settings' },
  // metrics
  temp:     { zh: '水溫',     en: 'Water Temp' },
  doO:      { zh: '溶氧',     en: 'DO' },
  ph:       { zh: 'pH',       en: 'pH' },
  count:    { zh: '魚數',     en: 'Fish Count' },
  daily:    { zh: '今日斃死', en: 'Daily Mortality' },
  biomass:  { zh: '生物量',   en: 'Biomass' },
  salinity: { zh: '鹽度',     en: 'Salinity' },
  fill:     { zh: '水位',     en: 'Water Level' },
  status:   { zh: '狀態',     en: 'Status' },
  stage:    { zh: '階段',     en: 'Stage' },
  // status
  normal:   { zh: '正常', en: 'Normal' },
  warn:     { zh: '警告', en: 'Warning' },
  danger:   { zh: '危險', en: 'Danger' },
  // analytics
  survival: { zh: '存活率',   en: 'Survival Rate' },
  growth:   { zh: '成長',     en: 'Growth Rate' },
  fcr:      { zh: '飼料效率', en: 'Feed Conversion' },
  totalBio: { zh: '總生物量', en: 'Total Biomass' },
};

function Bi({ pair, sep = ' ', stack = false }) {
  if (stack) {
    return (<span className="bi"><span className="zh">{pair.zh}</span><span className="en">{pair.en}</span></span>);
  }
  return (<span className="bi-inline"><span className="zh">{pair.zh}</span><span className="en">{pair.en}</span></span>);
}
window.Bi = Bi; window.L = L;
