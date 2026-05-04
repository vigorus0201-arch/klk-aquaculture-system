/* global React */
// Tiny inline icon set (1.5px stroke, 14px viewBox). Industrial, not decorative.
function Ic({ name, size = 14, color = 'currentColor' }) {
  const props = {
    width: size, height: size, viewBox: '0 0 16 16',
    fill: 'none', stroke: color, strokeWidth: 1.4,
    strokeLinecap: 'round', strokeLinejoin: 'round'
  };
  switch (name) {
    case 'tank': return (<svg {...props}><rect x="2" y="3" width="12" height="11" rx="1" /><path d="M2 9h12" /><path d="M5 9c.7-1 2.3-1 3 0s2.3 1 3 0" /></svg>);
    case 'wave': return (<svg {...props}><path d="M2 8c1.2-1.5 2.8-1.5 4 0s2.8 1.5 4 0 2.8-1.5 4 0" /><path d="M2 12c1.2-1.5 2.8-1.5 4 0s2.8 1.5 4 0 2.8-1.5 4 0" /></svg>);
    case 'alert': return (<svg {...props}><path d="M8 2L1.5 14h13L8 2z" /><path d="M8 7v3" /><circle cx="8" cy="12" r="0.4" fill={color} /></svg>);
    case 'chart': return (<svg {...props}><path d="M2 13V3" /><path d="M2 13h12" /><path d="M5 10l2-3 2 2 3-5" /></svg>);
    case 'log':   return (<svg {...props}><rect x="3" y="2" width="10" height="12" /><path d="M5 5h6M5 8h6M5 11h4" /></svg>);
    case 'pie':   return (<svg {...props}><circle cx="8" cy="8" r="6" /><path d="M8 8L8 2A6 6 0 0114 8z" fill={color} stroke="none" opacity="0.4" /><path d="M8 2v6h6" /></svg>);
    case 'gear':  return (<svg {...props}><circle cx="8" cy="8" r="2.2" /><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" /></svg>);
    case 'users': return (<svg {...props}><circle cx="6" cy="6" r="2.2" /><circle cx="11.5" cy="7" r="1.7" /><path d="M2 13c.5-2 2-3 4-3s3.5 1 4 3" /><path d="M10 13c.4-1.4 1.4-2 2.5-2s1.7.5 2 1.5" /></svg>);
    case 'feed':  return (<svg {...props}><path d="M3 3l5 4 5-4" /><path d="M3 3v8a2 2 0 002 2h6a2 2 0 002-2V3" /><path d="M6 13v-3M10 13v-3" /></svg>);
    case 'bell':  return (<svg {...props}><path d="M4 11V7a4 4 0 018 0v4l1 1.5H3z" /><path d="M6.5 13.5a1.5 1.5 0 003 0" /></svg>);
    case 'pulse': return (<svg {...props}><path d="M2 8h3l1.5-3 2 6 1.5-3h4" /></svg>);
    case 'lock':  return (<svg {...props}><rect x="3.5" y="7" width="9" height="6.5" /><path d="M5.5 7V5a2.5 2.5 0 015 0v2" /></svg>);
    case 'menu':  return (<svg {...props}><path d="M2 4h12M2 8h12M2 12h12" /></svg>);
    case 'search':return (<svg {...props}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>);
    case 'down':  return (<svg {...props}><path d="M3.5 6L8 10.5 12.5 6" /></svg>);
    case 'check': return (<svg {...props}><path d="M3 8.5L6.5 12l7-8" /></svg>);
    case 'plus':  return (<svg {...props}><path d="M8 3v10M3 8h10" /></svg>);
    case 'export':return (<svg {...props}><path d="M8 2v8M5 6l3-3 3 3M3 12v1.5h10V12" /></svg>);
    case 'fish':  return (<svg {...props}><path d="M2 8c2-3 6-4 8.5-4l2.5 4-2.5 4C8 12 4 11 2 8z" /><circle cx="10" cy="7.5" r="0.4" fill={color} /><path d="M14 5l1 3-1 3" /></svg>);
    case 'temp':  return (<svg {...props}><rect x="6.5" y="2" width="3" height="9" rx="1.5" /><circle cx="8" cy="12" r="2" /></svg>);
    case 'drop':  return (<svg {...props}><path d="M8 2c-2 3-4 5-4 7.5a4 4 0 008 0C12 7 10 5 8 2z" /></svg>);
    case 'flask': return (<svg {...props}><path d="M6 2v4L3 13a1 1 0 001 1.5h8A1 1 0 0013 13L10 6V2" /><path d="M6 2h4" /></svg>);
    default: return <svg {...props}><rect x="3" y="3" width="10" height="10" /></svg>;
  }
}
window.Ic = Ic;
