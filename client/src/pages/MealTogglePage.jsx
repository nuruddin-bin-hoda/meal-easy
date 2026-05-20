import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Alert, Box, CircularProgress, Typography, useTheme,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTopbar } from '../context/TopbarContext';
import { to12Hour } from '../utils/timeUtils';

const fmt = (n) => `৳${Number(n ?? 0).toFixed(2)}`;
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];


const MealToggle = memo(function MealToggle({ on, disabled, mealType, onToggle }) {
  const theme = useTheme();
  const tok = theme.tokens;
  return (
    <Box
      component="button"
      onClick={() => !disabled && onToggle(mealType, !on)}
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
});

const stepBtnSx = (tok) => ({
  width: 24, height: 24, borderRadius: '6px',
  bgcolor: tok.soft, color: tok.muted,
  border: `1px solid ${tok.hairline}`,
  fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', p: 0, lineHeight: 1,
  '&:disabled': { opacity: 0.4, cursor: 'default' },
  display: 'grid', placeItems: 'center',
});

const GuestStepper = memo(function GuestStepper({ value, disabled, mealType, onStep, tok }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Box component="button" onClick={() => onStep(mealType, -1)} disabled={disabled || value === 0} sx={stepBtnSx(tok)}>
        −
      </Box>
      <Box sx={{ minWidth: 30, textAlign: 'center', fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: tok.ink }}>
        <Box component="span" sx={{ fontSize: 10, color: tok.muted, mr: '3px' }}>+</Box>
        {value}
      </Box>
      <Box component="button" onClick={() => onStep(mealType, +1)} disabled={disabled} sx={stepBtnSx(tok)}>
        +
      </Box>
    </Box>
  );
});

export default function MealTogglePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const tok = theme.tokens;
  const { setTopbar } = useTopbar();

  const [meals, setMeals] = useState([]);
  const [menus, setMenus] = useState({});
  const [loading, setLoading] = useState(true);
  const [predictedRate, setPredictedRate] = useState(null);

  const [toggleStates, setToggleStates] = useState({});
  const [guestCounts, setGuestCounts]   = useState({});

  const toggleStatesRef = useRef({});
  const guestCountsRef  = useRef({});
  useEffect(() => { toggleStatesRef.current = toggleStates; }, [toggleStates]);
  useEffect(() => { guestCountsRef.current  = guestCounts;  }, [guestCounts]);

  // Two separate saving buckets:
  // savingToggle — replaces MealToggle with a spinner (only for toggle-click saves)
  // savingGuest  — purely background; never unmounts MealToggle
  const [savingToggle, setSavingToggle] = useState({});
  const [lastSaved, setLastSaved] = useState(false);
  const debounceRef = useRef({});

  useEffect(() => {
    const today = new Date();
    const label = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    setTopbar({ title: t('meal.todayMeals'), subtitle: label });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    Promise.all([api.get('/meals/today'), api.get(`/menus/${todayStr}`)])
      .then(([toggleRes, menuRes]) => {
        const apiToggles = toggleRes.data.toggles ?? [];
        setMeals(apiToggles);
        setMenus(menuRes.data.menus ?? {});
        const ts = {}, gc = {};
        apiToggles.forEach((tg) => {
          ts[tg.mealType] = tg.isOn;
          gc[tg.mealType] = tg.guestCount ?? 0;
        });
        setToggleStates(ts);
        setGuestCounts(gc);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get('/dashboard/user')
      .then((res) => setPredictedRate(res.data.predictedMealRate ?? null))
      .catch(() => {});
  }, []);

  // isToggleSave=true  → show spinner in place of MealToggle
  // isToggleSave=false → silent background save; MealToggle stays mounted
  const save = useCallback(async (mealType, isOn, guestCount, isToggleSave) => {
    if (isToggleSave) setSavingToggle((s) => ({ ...s, [mealType]: true }));
    try {
      const { data } = await api.post('/meals/toggle', { mealType, isOn, guestCount });
      setToggleStates((prev) => ({ ...prev, [mealType]: data.isOn }));
      setGuestCounts((prev)  => ({ ...prev, [mealType]: data.guestCount }));
      setLastSaved(true);
    } catch { }
    finally {
      if (isToggleSave) setSavingToggle((s) => ({ ...s, [mealType]: false }));
    }
  }, []);

  const handleToggle = useCallback((mealType, isOn) => {
    setToggleStates((prev) => ({ ...prev, [mealType]: isOn }));
    if (!isOn) setGuestCounts((prev) => ({ ...prev, [mealType]: 0 }));
    const curGuest = guestCountsRef.current[mealType] ?? 0;
    save(mealType, isOn, isOn ? curGuest : 0, true); // toggle save → shows spinner
  }, [save]);

  const handleGuestStep = useCallback((mealType, delta) => {
    setGuestCounts((prev) => {
      const next = Math.max(0, (prev[mealType] ?? 0) + delta);
      if (debounceRef.current[mealType]) clearTimeout(debounceRef.current[mealType]);
      debounceRef.current[mealType] = setTimeout(() => {
        save(mealType, toggleStatesRef.current[mealType] ?? true, next, false); // guest save → silent
      }, 600);
      return { ...prev, [mealType]: next };
    });
  }, [save]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const mealOnCount = Object.values(toggleStates).filter(Boolean).length;
  const guestTotal  = meals.reduce((s, m) => s + (toggleStates[m.mealType] ? (guestCounts[m.mealType] ?? 0) : 0), 0);
  const pad = { xs: '16px', md: '28px' };

  const summaryCard = (
    <Box sx={{ bgcolor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', p: '16px 18px' }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: tok.ink, mb: '12px' }}>
        Today's Summary
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: 13, color: tok.muted }}>Meals scheduled</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: tok.ink, fontVariantNumeric: 'tabular-nums' }}>{mealOnCount}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: 13, color: tok.muted }}>Guest meals</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: tok.ink, fontVariantNumeric: 'tabular-nums' }}>{guestTotal}</Typography>
        </Box>
        {predictedRate != null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 13, color: tok.muted }}>Predicted rate</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: tok.ink, fontVariantNumeric: 'tabular-nums' }}>{fmt(predictedRate)}</Typography>
          </Box>
        )}
      </Box>
      {lastSaved && (
        <Box sx={{ mt: '10px', pt: '10px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckIcon sx={{ fontSize: 11, color: tok.posInk }} />
          <Typography sx={{ fontSize: 11, color: tok.posInk, fontWeight: 500 }}>{t('dashboard.autoSaved')}</Typography>
        </Box>
      )}
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
          {user?.mealBlocked && (
            <Alert severity="error" sx={{ mb: 2 }}>{t('dashboard.mealBlocked')}</Alert>
          )}

          {meals.length === 0 ? (
            <Alert severity="info">{t('meal.noMealTypes')}</Alert>
          ) : (
            <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '14px' }}>
              {meals.map((meal, i) => {
                const isOn       = toggleStates[meal.mealType] ?? false;
                const guestCount = guestCounts[meal.mealType] ?? 0;
                const items      = menus[meal.mealType] ?? [];
                const isLocked   = meal.isCutoffPassed;
                const disabled   = isLocked || !!user?.mealBlocked;
                return (
                  <Box key={meal.mealType} sx={{
                    p: '16px 18px',
                    borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
                    opacity: isLocked ? 0.6 : 1,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                        bgcolor: isOn ? tok.onBg : tok.soft,
                        color: isOn ? tok.onInk : tok.muted,
                        display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 500,
                      }}>
                        {ROMAN[i] ?? String(i + 1)}
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: 15, fontWeight: 500, textTransform: 'capitalize', color: tok.ink }}>
                            {meal.mealType}
                          </Typography>
                          {meal.cutoffTime && (
                            <Typography sx={{ fontSize: 11, color: tok.muted, fontVariantNumeric: 'tabular-nums' }}>
                              {to12Hour(meal.cutoffTime)}
                            </Typography>
                          )}
                        </Box>
                        {meal.cutoffTime && !isLocked && (
                          <Typography sx={{ fontSize: 11, color: tok.dim, mt: '3px' }}>
                            {t('meal.closesTomorrow', { time: to12Hour(meal.cutoffTime) })}
                          </Typography>
                        )}
                        {items.length > 0 && (
                          <Typography sx={{ fontSize: 12, color: tok.muted, mt: '7px', lineHeight: 1.5 }}>
                            {items.join(' · ')}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        {isLocked ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', color: tok.dim }}>
                            <LockOutlinedIcon sx={{ fontSize: 14 }} />
                            <Typography sx={{ fontSize: 11, color: tok.dim }}>{t('meal.locked')}</Typography>
                          </Box>
                        ) : savingToggle[meal.mealType] ? (
                          // Spinner only for toggle-click saves — MealToggle stays mounted during guest saves
                          <CircularProgress size={20} />
                        ) : (
                          <MealToggle
                            on={isOn}
                            disabled={disabled}
                            mealType={meal.mealType}
                            onToggle={handleToggle}
                          />
                        )}
                        {isOn && !isLocked && (
                          <GuestStepper
                            value={guestCount}
                            disabled={disabled}
                            mealType={meal.mealType}
                            onStep={handleGuestStep}
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

          <Box sx={{ display: { xs: 'block', md: 'none' }, mt: '12px' }}>
            {summaryCard}
          </Box>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: '12px', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
          {summaryCard}
        </Box>
      </Box>
    </Box>
  );
}
