import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert, Box, CircularProgress, Typography, useTheme,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useTopbar } from '../../context/TopbarContext';
import { to12Hour, formatDateTime } from '../../utils/timeUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => `৳${Number(n ?? 0).toFixed(2)}`;
const getInitials = (name = '') => {
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '');
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'goodMorning';
  if (h < 18) return 'goodAfternoon';
  return 'goodEvening';
}

// ─── Toggle (custom design-spec implementation) ──────────────────────────────

function MealToggle({ on, disabled, onChange }) {
  const theme = useTheme();
  const tok = theme.tokens;
  return (
    <Box
      component="button"
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      sx={{
        width: 40, height: 22, borderRadius: '999px',
        bgcolor: on ? tok.ink : tok.soft,
        border: 'none', cursor: disabled ? 'default' : 'pointer',
        position: 'relative', flexShrink: 0, p: 0,
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.15s',
        '&:focus-visible': { outline: `2px solid ${tok.brandSage}` },
      }}
    >
      <Box sx={{
        position: 'absolute', top: '50%', left: '2px',
        width: 18, height: 18, borderRadius: '999px',
        bgcolor: on ? tok.bg : tok.surface,
        transform: `translate(${on ? 18 : 0}px, -50%)`,
        transition: 'transform 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </Box>
  );
}

// ─── UserDashboard ────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const tok = theme.tokens;
  const { setTopbar } = useTopbar();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggles, setToggles] = useState([]);
  const [saving, setSaving] = useState({});
  const [lastSaved, setLastSaved] = useState(false);
  const debounceRef = useRef({});

  const firstName = user?.name?.split(' ')[0] ?? '';

  useEffect(() => {
    setTopbar({ title: t('dashboard.userTitle'), subtitle: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  useEffect(() => {
    api.get('/dashboard/user')
      .then((res) => {
        setData(res.data);
        setToggles(res.data.todayToggles ?? []);
      })
      .catch(() => setError(t('dashboard.failedToLoad')))
      .finally(() => setLoading(false));
  }, [t]);

  const save = useCallback(async (mealType, isOn, guestCount) => {
    setSaving((s) => ({ ...s, [mealType]: true }));
    try {
      const { data: saved } = await api.post('/meals/toggle', { mealType, isOn, guestCount });
      setToggles((prev) => prev.map((tg) => tg.mealType === mealType ? { ...tg, isOn: saved.isOn, guestCount: saved.guestCount } : tg));
      setLastSaved(true);
    } catch { /* silently revert */ }
    finally { setSaving((s) => ({ ...s, [mealType]: false })); }
  }, []);

  const handleToggle = useCallback((mealType, isOn) => {
    const cur = toggles.find((tg) => tg.mealType === mealType);
    setToggles((prev) => prev.map((tg) => tg.mealType === mealType ? { ...tg, isOn, guestCount: isOn ? (cur?.guestCount ?? 0) : 0 } : tg));
    save(mealType, isOn, isOn ? (cur?.guestCount ?? 0) : 0);
  }, [toggles, save]);

  const handleGuestStep = useCallback((mealType, delta) => {
    const cur = toggles.find((tg) => tg.mealType === mealType);
    const next = Math.max(0, (cur?.guestCount ?? 0) + delta);
    setToggles((prev) => prev.map((tg) => tg.mealType === mealType ? { ...tg, guestCount: next } : tg));
    if (debounceRef.current[mealType]) clearTimeout(debounceRef.current[mealType]);
    debounceRef.current[mealType] = setTimeout(() => save(mealType, cur?.isOn ?? true, next), 600);
  }, [toggles, save]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error)   return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const {
    balance = 0,
    predictedMealRate = 0,
    myMealCountThisMonth = 0,
    tomorrowMenu = [],
    recentNotifications = [],
  } = data;

  const menuMap = Object.fromEntries(tomorrowMenu.map((m) => [m.mealType, m.items]));
  const mealOnCount = toggles.filter((tg) => tg.isOn).length;
  const guestTotal  = toggles.reduce((s, tg) => s + (tg.isOn ? (tg.guestCount ?? 0) : 0), 0);
  const estimatedCost = mealOnCount * predictedMealRate;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowLabel = tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const monthName = new Date().toLocaleDateString('en-US', { month: 'short' });

  const pad = { xs: '16px', md: '28px' };

  return (
    <Box sx={{ p: pad, display: 'flex', flexDirection: 'column', gap: '12px', fontFeatureSettings: '"tnum","cv11"' }}>

      {/* Greeting banner */}
      <Box sx={{
        bgcolor: tok.surface, border: `1px solid ${tok.hairline}`,
        borderRadius: '12px', p: '16px 18px',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <Box sx={{ width: 4, height: 44, borderRadius: '2px', bgcolor: tok.accent, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 11, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
            {t(`dashboard.${greeting()}`)}
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 500, mt: '2px', color: tok.ink }}>
            {firstName}
          </Typography>
          <Typography sx={{ fontSize: 11, color: tok.muted, mt: '4px', fontVariantNumeric: 'tabular-nums' }}>
            {t('dashboard.cutoffClosesIn')}
          </Typography>
        </Box>
        <Box
          component="button"
          onClick={() => navigate('/meals')}
          sx={{
            fontSize: 12, px: '12px', py: '6px', borderRadius: '8px',
            bgcolor: tok.btnBg, color: tok.btnInk, border: 'none',
            fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
            flexShrink: 0, whiteSpace: 'nowrap',
            '&:hover': { opacity: 0.88 },
          }}
        >
          {t('dashboard.planTomorrow')} →
        </Box>
      </Box>

      {user?.mealBlocked && (
        <Alert severity="error">{t('dashboard.mealBlocked')}</Alert>
      )}

      {/* KPI tiles — 3-up */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[
          { label: t('dashboard.balance'),        value: fmt(balance),           sub: balance >= 0 ? '' : '⚠ Low', color: balance >= 0 ? tok.posInk : tok.dangerInk },
          { label: `${t('dashboard.mealsThisMonth')} · ${monthName}`, value: String(myMealCountThisMonth), sub: t('dashboard.mealsToggledOn'), color: tok.ink },
          { label: t('dashboard.predictedRate'),  value: fmt(predictedMealRate), sub: t('dashboard.perMeal'), color: tok.ink },
        ].map((k, i) => (
          <Box key={i} sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px', p: '12px 14px' }}>
            <Typography sx={{ fontSize: 10, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
              {k.label}
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em', mt: '3px', fontVariantNumeric: 'tabular-nums', color: k.color ?? tok.ink }}>
              {k.value}
            </Typography>
            {k.sub && <Typography sx={{ fontSize: 11, color: tok.dim, mt: '1px' }}>{k.sub}</Typography>}
          </Box>
        ))}
      </Box>

      {/* Tomorrow's meals — single sheet */}
      <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px' }}>
        {/* Header */}
        <Box sx={{ p: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: 11, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
              {t('dashboard.tomorrowMeals')}
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 500, mt: '2px', color: tok.ink }}>{tomorrowLabel}</Typography>
          </Box>
        </Box>

        {toggles.length === 0 ? (
          <Box sx={{ p: '12px 16px', borderTop: `1px solid ${tok.hairlineSoft}` }}>
            <Typography sx={{ fontSize: 14, color: tok.muted }}>{t('dashboard.noMealToggles')}</Typography>
          </Box>
        ) : toggles.map((toggle, i) => {
          const items = menuMap[toggle.mealType] ?? [];
          return (
            <Box key={toggle.mealType} sx={{
              p: '12px 16px', borderTop: `1px solid ${tok.hairlineSoft}`,
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize', color: tok.ink }}>
                    {toggle.mealType}
                  </Typography>
                  {toggle.cutoffTime && (
                    <Typography sx={{ fontSize: 11, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>
                      {to12Hour(toggle.cutoffTime)}
                    </Typography>
                  )}
                </Box>
                {items.length > 0 && (
                  <Typography sx={{ fontSize: 12, color: tok.muted, mt: '4px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {items.join(' · ')}
                  </Typography>
                )}
              </Box>
              {toggle.isOn && (toggle.guestCount ?? 0) > 0 && (
                <Box component="span" sx={{ fontSize: 10, fontWeight: 500, px: '8px', py: '2px', borderRadius: '999px', bgcolor: tok.soft, color: tok.muted }}>
                  +{toggle.guestCount} guest
                </Box>
              )}
              {toggle.isCutoffPassed ? (
                <Typography sx={{ fontSize: 11, color: tok.dim }}>Locked</Typography>
              ) : (
                <MealToggle on={toggle.isOn} disabled={!!user?.mealBlocked || toggle.isCutoffPassed} onChange={(v) => handleToggle(toggle.mealType, v)} />
              )}
            </Box>
          );
        })}

        {/* Footer summary */}
        <Box sx={{
          p: '10px 16px', borderTop: `1px solid ${tok.hairlineSoft}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12, color: tok.muted,
        }}>
          <Typography sx={{ fontSize: 12, color: tok.muted }}>
            {mealOnCount} of {toggles.length} meals · {guestTotal} guests · {fmt(estimatedCost)}
          </Typography>
          {lastSaved && (
            <Typography sx={{ fontSize: 12, color: tok.posInk, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckIcon sx={{ fontSize: 12 }} /> {t('dashboard.autoSaved')}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Recent notifications */}
      <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px', p: '14px 16px 8px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '10px' }}>
          <Typography sx={{ fontSize: 11, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
            {t('dashboard.recentNotifications')}
          </Typography>
          <Box component="span" onClick={() => navigate('/notifications')} sx={{ fontSize: 12, color: tok.muted, cursor: 'pointer', '&:hover': { color: tok.ink } }}>
            {t('dashboard.seeAll')} →
          </Box>
        </Box>
        {recentNotifications.length === 0 ? (
          <Typography sx={{ fontSize: 14, color: tok.muted, pb: '6px' }}>{t('dashboard.noNotifications')}</Typography>
        ) : recentNotifications.map((n, i) => (
          <Box key={n._id} sx={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            p: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
          }}>
            <Box sx={{ width: 4, height: 4, borderRadius: '999px', bgcolor: n.isRead ? tok.dim : tok.accent, mt: '8px', flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: n.isRead ? 400 : 500, color: tok.ink, lineHeight: 1.4 }}>
                {n.message}
              </Typography>
              <Typography sx={{ fontSize: 11, color: tok.muted, mt: '1px' }}>
                {formatDateTime(n.createdAt)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

    </Box>
  );
}
