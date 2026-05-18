// Tokens + reusable atomic UI for the full Meal Easy application design.
// All screens import these via window.* — single source of truth for color,
// spacing, and primitive components (Badge, Pill, Toggle, Stepper, Avatar).

window.tokens = function (dark) {
  return dark ? {
    // Claude-style warm-neutral dark theme.
    bg:'#1F1E1D', surface:'#2A2927', soft:'#34332F', softer:'#3F3E3A',
    ink:'#F0EEE6', muted:'#A8A69D', dim:'#7A786F',
    hairline:'#34332F', hairlineSoft:'#2A2927',
    posBg:'#1F2E15', posInk:'#B6DA98',
    warnBg:'#3A2A10', warnInk:'#F0C277',
    dangerBg:'#3C1F1A', dangerInk:'#F0A299',
    infoBg:'#13283A', infoInk:'#9CC9E5',
    btnBg:'#F0EEE6', btnInk:'#1F1E1D',
    btnGhostBg:'#34332F', btnGhostInk:'#F0EEE6',
    accent:'#D97757', accentInk:'#1F1E1D',
    onBg:'#1F2E1B', onInk:'#C2E0A2',
  } : {
    bg:'#FAF8F3', surface:'#FFFFFF', soft:'#F4F0E8', softer:'#EFEAE0',
    ink:'#1F1B17', muted:'#6B665E', dim:'#9A9388',
    hairline:'#E5DFD2', hairlineSoft:'#EFEAE0',
    posBg:'#EBF2DC', posInk:'#3B5E1F',
    warnBg:'#F6E9CC', warnInk:'#7A4F0B',
    dangerBg:'#F4DBD6', dangerInk:'#7B2520',
    infoBg:'#E2EDF3', infoInk:'#1F4C68',
    btnBg:'#1F1B17', btnInk:'#FAF8F3',
    btnGhostBg:'#F4F0E8', btnGhostInk:'#1F1B17',
    accent:'#9D5C3B', accentInk:'#FAF8F3',
    onBg:'#EBF2DC', onInk:'#3B5E1F',
  };
};

// ---- Atomic UI components ----

function Eyebrow({ children, color, style }) {
  return <div style={{
    fontSize: 11, color: color || 'inherit', textTransform: 'uppercase',
    letterSpacing: '0.06em', fontWeight: 500, ...style,
  }}>{children}</div>;
}

function Card({ tok, children, style, padding = '16px 18px', radius = 12 }) {
  return <div style={{
    background: tok.surface, border: `1px solid ${tok.hairline}`,
    borderRadius: radius, padding, ...style,
  }}>{children}</div>;
}

function Badge({ tok, tone = 'info', children, style }) {
  const map = {
    info:    { bg: tok.infoBg, ink: tok.infoInk },
    warn:    { bg: tok.warnBg, ink: tok.warnInk },
    danger:  { bg: tok.dangerBg, ink: tok.dangerInk },
    success: { bg: tok.posBg, ink: tok.posInk },
    neutral: { bg: tok.soft, ink: tok.muted },
  };
  const c = map[tone];
  return <span style={{
    fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999,
    background: c.bg, color: c.ink, ...style,
  }}>{children}</span>;
}

function PrimaryBtn({ tok, children, style, size = 'md', icon }) {
  const sizes = {
    sm: { pad: '6px 12px', fs: 12 },
    md: { pad: '8px 16px', fs: 13 },
    lg: { pad: '12px 20px', fs: 14 },
  };
  const sz = sizes[size];
  return <button style={{
    fontSize: sz.fs, padding: sz.pad, borderRadius: 8,
    background: tok.btnBg, color: tok.btnInk, border: 'none',
    fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, ...style,
  }}>{icon}{children}</button>;
}

function GhostBtn({ tok, children, style, size = 'md', icon }) {
  const sizes = {
    sm: { pad: '5px 10px', fs: 12 },
    md: { pad: '7px 14px', fs: 13 },
    lg: { pad: '11px 18px', fs: 14 },
  };
  const sz = sizes[size];
  return <button style={{
    fontSize: sz.fs, padding: sz.pad, borderRadius: 8,
    background: 'transparent', color: tok.ink, border: `1px solid ${tok.hairline}`,
    fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, ...style,
  }}>{icon}{children}</button>;
}

function Avatar({ tok, name, size = 32, accent = false }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');
  // Default avatar uses the brand sage so initials read as friendly + on-brand.
  // accent=true uses the warm orange accent (reserved for the Profile hero).
  return <div style={{
    width: size, height: size, borderRadius: 999,
    background: accent ? tok.accent : '#7F9E6E',
    color: accent ? tok.accentInk : '#FAF8F3',
    display: 'grid', placeItems: 'center',
    fontSize: Math.round(size * 0.36), fontWeight: 500,
    flexShrink: 0,
    letterSpacing: '0.02em',
  }}>{initials}</div>;
}

function Toggle({ tok, on, disabled, size = 'md' }) {
  // Geometry locked to keep the knob perfectly centered: container = knob + 4.
  const dims = size === 'sm'
    ? { w: 32, h: 18, knob: 14, slide: 14 }
    : { w: 40, h: 22, knob: 18, slide: 18 };
  return <div style={{
    width: dims.w, height: dims.h, borderRadius: 999,
    background: on ? tok.ink : tok.soft,
    opacity: disabled ? 0.4 : 1, flexShrink: 0,
    position: 'relative', transition: 'background 0.15s',
  }}>
    <div style={{
      position: 'absolute', top: '50%', left: 2,
      width: dims.knob, height: dims.knob, borderRadius: 999,
      background: on ? tok.bg : tok.surface,
      transform: `translate(${on ? dims.slide : 0}px, -50%)`,
      transition: 'transform 0.15s',
    }} />
  </div>;
}

function Stepper({ tok, value, size = 'md' }) {
  const h = size === 'sm' ? 26 : 32;
  return <div style={{
    display: 'inline-flex', alignItems: 'center',
    border: `1px solid ${tok.hairline}`, borderRadius: 8, overflow: 'hidden',
  }}>
    <button style={{
      width: h, height: h, background: 'transparent', border: 'none', color: tok.muted,
      fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1,
    }}>−</button>
    <div style={{
      minWidth: h, height: h, textAlign: 'center',
      fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
      borderLeft: `1px solid ${tok.hairline}`, borderRight: `1px solid ${tok.hairline}`,
      color: tok.ink, lineHeight: `${h}px`,
    }}>{value}</div>
    <button style={{
      width: h, height: h, background: 'transparent', border: 'none', color: tok.muted,
      fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1,
    }}>+</button>
  </div>;
}

function Input({ tok, label, value, placeholder, type = 'text', adornment, style }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    {label && <div style={{ fontSize: 12, color: tok.muted, fontWeight: 500 }}>{label}</div>}
    <div style={{
      display: 'flex', alignItems: 'center',
      background: tok.surface, border: `1px solid ${tok.hairline}`,
      borderRadius: 8, padding: '0 12px', height: 44,
    }}>
      {adornment && <span style={{ color: tok.muted, marginRight: 8, fontSize: 14 }}>{adornment}</span>}
      <input
        readOnly type={type} placeholder={placeholder} defaultValue={value}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          color: tok.ink, fontSize: 14, fontFamily: 'inherit', padding: 0, minWidth: 0,
        }}
      />
    </div>
  </div>;
}

// Tiny icons rendered as inline glyphs (so we don't ship an icon font).
// Stroke-only, geometric, monoline.
function I({ name, size = 16, color = 'currentColor', stroke = 1.6 }) {
  const p = {
    home:    'M3 11.5L12 3l9 8.5M5 10v10h14V10',
    meals:   'M12 3v18M6 5v6a3 3 0 0 0 3 3M18 5v3.5a2.5 2.5 0 0 1-2.5 2.5v9.5',
    menu:    'M4 6h16M4 12h16M4 18h11',
    money:   'M3 7h18v10H3zM7 7v10M17 7v10M12 10v4',
    stock:   'M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7',
    chef:    'M7 14h10v6H7zM7 14a5 5 0 1 1 10 0',
    users:   'M5 21a5 5 0 0 1 10 0M19 21a4 4 0 0 0-3-3.87M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6-1a3 3 0 1 0 0-6',
    report:  'M5 3h11l3 3v15H5zM9 13h8M9 17h6M9 9h5',
    bell:    'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
    settings:'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm8 3l1.5-1-1.5-2.6L18 9l-1.7-1L16 6h-3l-.3 2L11 9 9 8 7.5 8.4 6 11l1.5 1L6 13l1.5 2.6L9 15l1.7 1L11 18h3l.3-2L16 15l2 1 1.5-.4L21 13z',
    chevron: 'M9 6l6 6-6 6',
    plus:    'M12 5v14M5 12h14',
    search:  'M11 11m-7 0a7 7 0 1 0 14 0 7 7 0 1 0-14 0M21 21l-5-5',
    lock:    'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
    check:   'M4 12l5 5L20 6',
    x:       'M6 6l12 12M18 6l-12 12',
    arrow:   'M5 12h14M13 6l6 6-6 6',
    calendar:'M5 5h14v14H5zM5 9h14M9 3v4M15 3v4',
    download:'M12 4v12M6 12l6 6 6-6M4 20h16',
    filter:  'M4 5h16l-6 8v6l-4-2v-4z',
    logout:  'M16 17l5-5-5-5M21 12H9M9 21H4V3h5',
  }[name] || '';
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', flexShrink: 0 }}>
    <path d={p} />
  </svg>;
}

Object.assign(window, {
  Eyebrow, Card, Badge, PrimaryBtn, GhostBtn, Avatar, Toggle, Stepper, Input, I,
});
