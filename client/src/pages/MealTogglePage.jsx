import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert, Box, CircularProgress, Typography, useTheme,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTopbar } from '../context/TopbarContext';

const fmt = (n) => `৳${Number(n ?? 0).toFixed(2)}`;
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function MealToggle({ on, disabled, onChange }) {
  const theme = useTheme();
  const tok = theme.tokens;
  return (
    <Box
      component="button"
      onClick={() => !disabled && onChange(!on)}
      sx={{
        width: 40, height: 22, borderRadius: '999px',
        bgcolor: on ? tok.ink : tok.soft,
        border: 'none', cursor: disabled ? 'default' : 'pointer',
        position: 'relative', p: 0, flexShrink: 0,
        opacity: disabled ? 0.4 : 1, transition: 'background 0.15s',
        '&:focus-visible': { outline: `2px solid ${tok.brandSage}` },
      }}
    >
      <Box sx={{
        position: 'absolute', top: '50%', left: '2px',
        width: 18, height: 18, borderRadius: '999px',
        bgcolor: on ? tok.bg : tok.surface,
        transform: `translate(${on ? 18 : 0}px, -50%)`,
        transition: 'transform 0.15s',
      }} />
    </Box>
  );
}

function GuestStepper({ value, disabled, onStep, tok }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {[-1, +1].map((delta) => (
        <Box
          key={delta}
          component="button"
          onClick={() => onStep(delta)}
          disabled={disabled || (delta < 0 && value === 0)}
          sx={{
            width: 24, height: 24, borderRadius: '6px',
            bgcolor: tok.soft, color: tok.muted,
            border: `1px solid ${tok.hairline}`,
            fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', p: 0, lineHeight: 1,
            '&:disabled': { opacity: 0.4, cursor: 'default' },
            display: 'grid', placeItems: 'center',
          }}
        >
          {delta < 0 ? '−' : '+'}
        </Box>
      )).reduce((acc, el, i) => {
        if (i === 0) return [el,
          <Box key="val" sx={{
            minWidth: 30, textAlign: 'center', fontSize: 12, fontWeight: 500,
            fontVariantNumeric: 'tabular-nums', color: tok.ink,
          }}>
            <Box component="span" sx={{ fontSize: 10, color: tok.muted, mr: '3px' }}>+</Box>
            {value}
          </Box>,
          el,
        ];
        return acc;
      })}
    </Box>
  );
}

export default function MealTogglePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const tok = theme.tokens;
  const { setTopbar } = useTopbar();

  const [toggles, setToggles] = useState([]);
  const [menus, setMenus] = useState({});
  const [tomorrowDate, setTomorrowDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [lastSaved, setLastSaved] = useState(false);
  const debounceRef = useRef({});

  useEffect(() => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const label = tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    setTopbar({ title: t('meal.tomorrowMeals'), subtitle: label });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  useEffect(() => {
    Promise.all([api.get('/meals/today'), api.get('/menus/tomorrow')])
      .then(([toggleRes, menuRes]) => {
        setToggles(toggleRes.data.toggles);
        setTomorrowDate(toggleRes.data.date);
        setMenus(menuRes.data.menus ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [t]);

  const save = useCallback(async (mealType, isOn, guestCount) => {
    setSaving((s) => ({ ...s, [mealType]: true }));
    try {
      const { data } = await api.post('/meals/toggle', { mealType, isOn, guestCount });
      setToggles((prev) => prev.map((tg) => tg.mealType === mealType ? { ...tg, isOn: data.isOn, guestCount: data.guestCount } : tg));
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

  const mealOnCount = toggles.filter((tg) => tg.isOn).length;
  const guestTotal  = toggles.reduce((s, tg) => s + (tg.isOn ? (tg.guestCount ?? 0) : 0), 0);
  const pad = { xs: '16px', md: '28px' };

  const summaryCard = (
    <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px', p: '16px 18px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Box sx={{ width: 4, height: 36, borderRadius: '2px', bgcolor: tok.accent, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 11, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
            {t('dashboard.yourTomorrow')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px', mt: '4px' }}>
            <Typography sx={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: tok.ink }}>
              Planned
            </Typography>
            <Typography sx={{ fontSize: 12, color: tok.muted }}>{mealOnCount} meals · {guestTotal} guests</Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ mt: '10px', pt: '10px', borderTop: `1px solid ${tok.hairlineSoft}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tok.muted }}>
        <span>{t('dashboard.rateRunning')}</span>
        {lastSaved && (
          <Typography sx={{ fontSize: 11, color: tok.posInk, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <CheckIcon sx={{ fontSize: 11 }} /> {t('dashboard.autoSaved')}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: pad, fontFeatureSettings: '"tnum","cv11"' }}>
      <Box sx={{
        display: { xs: 'flex', md: 'grid' },
        flexDirection: 'column',
        gridTemplateColumns: '1fr 280px',
        gap: '14px',
      }}>
        <Box>
          {/* Cutoff hint */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '12px' }}>
            <Typography sx={{ fontSize: 12, color: tok.muted }}>
              <Box component="span" sx={{ color: tok.warnInk, fontWeight: 500 }}>—</Box>
              {' '}{t('meal.cutoffsDiffer')}
            </Typography>
          </Box>

          {user?.mealBlocked && (
            <Alert severity="error" sx={{ mb: 2 }}>{t('dashboard.mealBlocked')}</Alert>
          )}

          {toggles.length === 0 ? (
            <Alert severity="info">{t('meal.noMealTypes')}</Alert>
          ) : (
            /* Single composed sheet */
            <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '14px' }}>
              {toggles.map((toggle, i) => {
                const items = menus[toggle.mealType] ?? [];
                const isLocked = toggle.isCutoffPassed;
                const disabled = isLocked || !!user?.mealBlocked;
                return (
                  <Box key={toggle.mealType} sx={{
                    p: '16px 18px',
                    borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
                    opacity: isLocked ? 0.6 : 1,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      {/* Roman numeral badge */}
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                        bgcolor: toggle.isOn ? tok.onBg : tok.soft,
                        color: toggle.isOn ? tok.onInk : tok.muted,
                        display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 500,
                      }}>
                        {ROMAN[i] ?? String(i + 1)}
                      </Box>

                      {/* Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: 15, fontWeight: 500, textTransform: 'capitalize', color: tok.ink }}>
                            {toggle.mealType}
                          </Typography>
                          {toggle.cutoffTime && (
                            <Typography sx={{ fontSize: 11, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>
                              {toggle.cutoffTime}
                            </Typography>
                          )}
                        </Box>
                        {toggle.cutoffTime && !isLocked && (
                          <Typography sx={{ fontSize: 11, color: tok.dim, mt: '3px' }}>
                            {t('meal.closesTomorrow', { time: toggle.cutoffTime })}
                          </Typography>
                        )}
                        {items.length > 0 && (
                          <Typography sx={{ fontSize: 12, color: tok.muted, mt: '7px', lineHeight: 1.5 }}>
                            {items.join(' · ')}
                          </Typography>
                        )}
                      </Box>

                      {/* Controls */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        {isLocked ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', color: tok.dim }}>
                            <LockOutlinedIcon sx={{ fontSize: 14 }} />
                            <Typography sx={{ fontSize: 11, color: tok.dim }}>{t('meal.locked')}</Typography>
                          </Box>
                        ) : saving[toggle.mealType] ? (
                          <CircularProgress size={20} />
                        ) : (
                          <MealToggle on={toggle.isOn} disabled={disabled} onChange={(v) => handleToggle(toggle.mealType, v)} />
                        )}
                        {toggle.isOn && !isLocked && (
                          <GuestStepper
                            value={toggle.guestCount ?? 0}
                            disabled={disabled}
                            onStep={(d) => handleGuestStep(toggle.mealType, d)}
                            tok={tok}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Mobile summary */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mt: '12px' }}>
            {summaryCard}
          </Box>
        </Box>

        {/* Desktop side rail */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: '12px', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
          {summaryCard}
          <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px', p: '14px 16px' }}>
            <Typography sx={{ fontSize: 11, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
              {t('dashboard.headsUp')}
            </Typography>
            <Typography sx={{ fontSize: 13, mt: '6px', lineHeight: 1.5, color: tok.ink }}>
              {t('meal.cutoffsDiffer')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
