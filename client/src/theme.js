import { createTheme } from '@mui/material/styles';

// ─── Warm-neutral light ───────────────────────────────────────────────────────
const lightTokens = {
  bg:           '#FAF8F3',
  surface:      '#FFFFFF',
  soft:         '#F4F0E8',
  softer:       '#EFEAE0',
  ink:          '#1F1B17',
  muted:        '#6B665E',
  dim:          '#9A9388',
  hairline:     '#E5DFD2',
  hairlineSoft: '#EFEAE0',
  accent:       '#9D5C3B',
  accentInk:    '#FAF8F3',
  brandSage:    '#7F9E6E',
  brandSageDeep:'#5A7140',
  onBg:         '#EBF2DC',
  onInk:        '#3B5E1F',
  posBg:        '#EBF2DC', posInk:    '#3B5E1F',
  warnBg:       '#F6E9CC', warnInk:   '#7A4F0B',
  dangerBg:     '#F4DBD6', dangerInk: '#7B2520',
  infoBg:       '#E2EDF3', infoInk:   '#1F4C68',
  btnBg:        '#1F1B17', btnInk:    '#FAF8F3',
  btnGhostBg:   '#F4F0E8', btnGhostInk: '#1F1B17',
};

// ─── Claude warm-neutral dark ─────────────────────────────────────────────────
const darkTokens = {
  bg:           '#1F1E1D',
  surface:      '#2A2927',
  soft:         '#34332F',
  softer:       '#3F3E3A',
  ink:          '#F0EEE6',
  muted:        '#A8A69D',
  dim:          '#7A786F',
  hairline:     '#34332F',
  hairlineSoft: '#2A2927',
  accent:       '#D97757',
  accentInk:    '#1F1E1D',
  brandSage:    '#7F9E6E',
  brandSageDeep:'#5A7140',
  onBg:         '#1F2E1B',
  onInk:        '#C2E0A2',
  posBg:        '#1F2E15', posInk:    '#B6DA98',
  warnBg:       '#3A2A10', warnInk:   '#F0C277',
  dangerBg:     '#3C1F1A', dangerInk: '#F0A299',
  infoBg:       '#13283A', infoInk:   '#9CC9E5',
  btnBg:        '#F0EEE6', btnInk:    '#1F1E1D',
  btnGhostBg:   '#34332F', btnGhostInk: '#F0EEE6',
};

export const buildTheme = (mode) => {
  const t = mode === 'dark' ? darkTokens : lightTokens;
  return createTheme({
    palette: {
      mode,
      background: { default: t.bg, paper: t.surface },
      text:       { primary: t.ink, secondary: t.muted, disabled: t.dim },
      divider:    t.hairline,
      primary: {
        main:         t.brandSage,
        light:        t.soft,
        dark:         t.brandSageDeep,
        contrastText: '#FAF8F3',
      },
      success: { main: t.posInk,    light: t.posBg },
      warning: { main: t.warnInk,   light: t.warnBg },
      error:   { main: t.dangerInk, light: t.dangerBg },
      info:    { main: t.infoInk,   light: t.infoBg },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      fontWeightRegular: 400,
      fontWeightMedium:  500,
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 7,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          containedPrimary: {
            backgroundColor: t.btnBg,
            color: t.btnInk,
            '&:hover': { backgroundColor: mode === 'dark' ? '#D4CCBC' : '#2D2820', boxShadow: 'none' },
          },
          outlinedPrimary: {
            borderColor: t.hairline,
            color: t.ink,
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: t.soft, borderColor: t.hairline },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            border: `1px solid ${t.hairline}`,
            borderRadius: 12,
            backgroundColor: t.surface,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { boxShadow: 'none', backgroundImage: 'none', backgroundColor: t.surface },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${t.hairline}`,
            backgroundColor: t.surface,
            color: t.ink,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            boxShadow: 'none',
            borderRight: `1px solid ${t.hairline}`,
            backgroundColor: t.surface,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 500,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: t.muted,
            backgroundColor: t.bg,
            borderBottom: `1px solid ${t.hairline}`,
          },
          body: { borderBottom: `1px solid ${t.hairlineSoft}` },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: t.hairline } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            boxShadow: 'none',
            border: `1px solid ${t.hairline}`,
            borderRadius: 12,
            backgroundColor: t.surface,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, fontSize: '0.7rem' },
        },
      },
    },
    tokens: t,
  });
};

export const lightTheme = buildTheme('light');
export const darkTheme  = buildTheme('dark');
