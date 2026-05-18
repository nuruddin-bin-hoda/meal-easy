import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Alert, Box, Button, CircularProgress, Typography, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AlarmIcon from '@mui/icons-material/Alarm';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import InventoryIcon from '@mui/icons-material/Inventory';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useTopbar } from '../context/TopbarContext';

const KIND_ICON = {
  rate:    { Icon: TrendingUpIcon,            tone: 'warn'    },
  cutoff:  { Icon: AlarmIcon,                 tone: 'info'    },
  deposit: { Icon: AccountBalanceWalletIcon,  tone: 'success' },
  stock:   { Icon: InventoryIcon,             tone: 'warn'    },
  menu:    { Icon: MenuBookIcon,              tone: 'neutral' },
  default: { Icon: NotificationsIcon,         tone: 'neutral' },
};

const TONE_COLORS = (tok) => ({
  warn:    { bg: tok.warnBg,   ink: tok.warnInk   },
  info:    { bg: tok.infoBg,   ink: tok.infoInk   },
  success: { bg: tok.posBg,    ink: tok.posInk    },
  neutral: { bg: tok.soft,     ink: tok.muted     },
});

function kindOf(n) {
  const msg = (n.message ?? '').toLowerCase();
  if (msg.includes('rate') || msg.includes('meal rate')) return 'rate';
  if (msg.includes('cutoff')) return 'cutoff';
  if (msg.includes('deposit')) return 'deposit';
  if (msg.includes('stock')) return 'stock';
  if (msg.includes('menu')) return 'menu';
  return 'default';
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const tok = theme.tokens;
  const { setTopbar } = useTopbar();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.allSettled(unread.map((n) => api.patch(`/notifications/${n._id}/read`)));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [notifications]);

  useEffect(() => {
    setTopbar({
      title: t('notifications.title'),
      subtitle: unreadCount > 0 ? `${unreadCount} unread` : '',
      actions: unreadCount > 0 ? (
        <Button onClick={markAllRead} variant="outlined" size="small" sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          Mark all read
        </Button>
      ) : null,
    });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar, unreadCount, markAllRead]);

  useEffect(() => {
    api.get('/notifications?limit=100')
      .then((res) => setNotifications(res.data.data ?? []))
      .catch(() => setError(t('notifications.failedToLoad')))
      .finally(() => setLoading(false));
  }, [t]);

  const markRead = async (id) => {
    setMarkingId(id);
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? res.data : n)));
    } catch {} finally { setMarkingId(null); }
  };

  const tones = TONE_COLORS(tok);
  const pad = { xs: '16px', md: '28px' };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error)   return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    <Box sx={{ p: pad, maxWidth: 640 }}>
      {notifications.length === 0 ? (
        <Alert severity="info">{t('notifications.noNotifications')}</Alert>
      ) : (
        <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px' }}>
          {notifications.map((n, i) => {
            const k = kindOf(n);
            const { Icon, tone } = KIND_ICON[k] ?? KIND_ICON.default;
            const c = tones[tone] ?? tones.neutral;
            return (
              <Box key={n._id} sx={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                p: '14px 18px',
                borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
                bgcolor: n.isRead ? 'transparent' : undefined,
              }}>
                {/* Icon tile */}
                <Box sx={{
                  width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
                  bgcolor: c.bg, color: c.ink, display: 'grid', placeItems: 'center',
                }}>
                  <Icon sx={{ fontSize: 18 }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: n.isRead ? 400 : 500, color: tok.ink, lineHeight: 1.4 }}>
                    {n.message}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: tok.muted, mt: '2px' }}>
                    {format(new Date(n.createdAt), 'dd MMM yyyy, HH:mm')}
                  </Typography>
                </Box>

                {/* Unread dot + mark button */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                  {!n.isRead && (
                    <>
                      <Box sx={{ width: 8, height: 8, borderRadius: '999px', bgcolor: tok.accent }} />
                      <Box
                        component="button"
                        onClick={() => markRead(n._id)}
                        disabled={markingId === n._id}
                        sx={{
                          fontSize: 11, border: `1px solid ${tok.hairline}`, borderRadius: '6px',
                          bgcolor: 'transparent', color: tok.muted, cursor: 'pointer',
                          px: '8px', py: '3px', fontFamily: 'inherit',
                          '&:hover': { bgcolor: tok.soft, color: tok.ink },
                        }}
                      >
                        {markingId === n._id ? '…' : t('notifications.markRead')}
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
