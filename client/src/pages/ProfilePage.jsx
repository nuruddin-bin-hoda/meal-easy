import { Box, Typography, useTheme } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import { useTopbar } from '../context/TopbarContext';
import { useEffect } from 'react';
import { getBadge } from '../utils/badgeStyles';

const ROLE_TYPE = { superadmin: 'error', admin: 'warning', user: 'info', chef: 'success' };

const getInitials = (name = '') => {
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '');
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const tok = theme.tokens;
  const mode = theme.palette.mode;
  const { toggleMode } = useColorMode();
  const { setTopbar } = useTopbar();

  useEffect(() => {
    setTopbar({ title: t('nav.profile'), subtitle: user?.roomNumber ?? '' });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar, user]);

  const roleBadge = getBadge(ROLE_TYPE[user?.role] ?? 'info', mode);

  const fields = [
    { label: t('common.name'),     value: user?.name },
    { label: t('auth.phone'),      value: user?.phone },
    { label: t('auth.roomNumber'), value: user?.roomNumber },
    { label: 'Member since',       value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : null },
  ].filter((f) => f.value);

  const pad = { xs: '16px', md: '28px' };

  return (
    <Box sx={{ p: pad, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 560 }}>

      {/* Hero card */}
      <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px', p: '20px 22px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '999px', flexShrink: 0,
            bgcolor: tok.accent, color: tok.accentInk,
            display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 500,
          }}>
            {getInitials(user?.name ?? '').toUpperCase()}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 500, color: tok.ink }} noWrap>{user?.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mt: '4px', flexWrap: 'wrap' }}>
              <Box component="span" sx={{ ...roleBadge, px: '8px', py: '2px', borderRadius: '999px', textTransform: 'capitalize' }}>
                {user?.role}
              </Box>
              {user?.roomNumber && (
                <Typography sx={{ fontSize: 12, color: tok.muted }}>{user.roomNumber}</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Settings list */}
      <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px' }}>
        {fields.map(({ label, value }, i) => (
          <Box key={label} sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            p: '14px 18px', gap: '12px',
            borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
          }}>
            <Typography sx={{ fontSize: 13, color: tok.muted }}>{label}</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.ink }}>{value}</Typography>
          </Box>
        ))}

        {/* Theme toggle */}
        <Box
          component="button"
          onClick={toggleMode}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', p: '14px 18px', gap: '12px',
            borderTop: `1px solid ${tok.hairlineSoft}`,
            bgcolor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            '&:hover': { bgcolor: tok.soft },
          }}
        >
          <Typography sx={{ fontSize: 13, color: tok.muted }}>Theme</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.ink }}>
              {mode === 'dark' ? 'Dark' : 'Light'}
            </Typography>
            <ChevronRightIcon sx={{ fontSize: 16, color: tok.dim }} />
          </Box>
        </Box>
      </Box>

      {/* Danger row */}
      <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px' }}>
        <Box
          component="button"
          onClick={async () => { await logout(); navigate('/login', { replace: true }); }}
          sx={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', p: '14px 18px',
            bgcolor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: tok.dangerInk, borderRadius: '12px',
            '&:hover': { bgcolor: tok.dangerBg },
          }}
        >
          <LogoutIcon sx={{ fontSize: 18, color: tok.dangerInk }} />
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.dangerInk }}>{t('nav.logout')}</Typography>
        </Box>
      </Box>

    </Box>
  );
}
