import { useState, useEffect } from 'react';
import { Alert, Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useTopbar } from '../context/TopbarContext';
import { getBadge } from '../utils/badgeStyles';

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today); monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return localDateStr(d);
  });
}

// Normalise server keys (e.g. "Breakfast") to lowercase so lookups always match
function normaliseMenus(raw) {
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner'];

export default function MenuPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const tok = theme.tokens;
  const mode = theme.palette.mode;
  const { setTopbar } = useTopbar();

  const weekDates = getWeekDates();
  const todayStr = localDateStr(new Date());

  const [weekMenus, setWeekMenus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const weekLabel = `Week of ${new Date(weekDates[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    setTopbar({ title: t('menu.title'), subtitle: weekLabel });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  useEffect(() => {
    setLoading(true);
    Promise.all(weekDates.map((date) =>
      api.get(`/menus/${date}`)
        .then((r) => ({ date, menus: normaliseMenus(r.data.menus ?? {}) }))
        .catch(() => ({ date, menus: {} })),
    )).then((results) => {
      setWeekMenus(Object.fromEntries(results.map((r) => [r.date, r.menus])));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const pad = { xs: '16px', md: '28px' };

  return (
    <Box sx={{ p: pad, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {weekDates.map((date) => {
        const isToday = date === todayStr;
        const menus = weekMenus[date] ?? {};
        const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        const mealTypes = MEAL_ORDER.filter((mt) => menus[mt] !== undefined).length > 0
          ? MEAL_ORDER
          : Object.keys(menus).length > 0 ? Object.keys(menus) : MEAL_ORDER;

        return (
          <Box key={date} sx={{
            bgcolor: isToday ? tok.soft : tok.surface,
            border: `1px solid ${isToday ? tok.ink : tok.hairline}`,
            borderRadius: '12px',
          }}>
            {/* Day header */}
            <Box sx={{
              p: '12px 16px', borderBottom: `1px solid ${tok.hairlineSoft}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.ink }}>{dayLabel}</Typography>
                {isToday && (
                  <Box component="span" sx={{ ...getBadge('info', mode), px: '8px', py: '2px', borderRadius: '999px', fontSize: 10 }}>
                    Today
                  </Box>
                )}
              </Box>
            </Box>

            {/* Meal columns */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}>
              {['Breakfast', 'Lunch', 'Dinner'].map((mt, idx) => {
                const key = mt.toLowerCase();
                const items = menus[key] ?? [];
                return (
                  <Box key={mt} sx={{
                    p: '12px 16px',
                    borderLeft: { xs: 'none', md: idx > 0 ? `1px solid ${tok.hairlineSoft}` : 'none' },
                    borderTop: { xs: idx > 0 ? `1px solid ${tok.hairlineSoft}` : 'none', md: 'none' },
                  }}>
                    <Typography sx={{ fontSize: 10, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, mb: '4px' }}>
                      {mt}
                    </Typography>
                    <Typography sx={{
                      fontSize: 13, lineHeight: 1.5,
                      color: items.length === 0 ? tok.dim : tok.ink,
                      fontStyle: items.length === 0 ? 'italic' : 'normal',
                    }}>
                      {items.length === 0 ? t('menu.noItems') : items.join(' · ')}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
