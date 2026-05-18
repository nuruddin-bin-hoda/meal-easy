const TOKENS = {
  light: {
    success: { background: '#EBF2DC', color: '#3B5E1F' },
    warning: { background: '#F6E9CC', color: '#7A4F0B' },
    error:   { background: '#F4DBD6', color: '#7B2520' },
    info:    { background: '#E2EDF3', color: '#1F4C68' },
  },
  dark: {
    success: { background: '#1F2E15', color: '#B6DA98' },
    warning: { background: '#3A2A10', color: '#F0C277' },
    error:   { background: '#3C1F1A', color: '#F0A299' },
    info:    { background: '#13283A', color: '#9CC9E5' },
  },
};

export function getBadge(type, mode = 'light') {
  const palette = TOKENS[mode] ?? TOKENS.light;
  const t = palette[type] ?? palette.info;
  return {
    bgcolor: t.background,
    color: t.color,
    border: 'none',
    fontWeight: 500,
    fontSize: '0.7rem',
  };
}
