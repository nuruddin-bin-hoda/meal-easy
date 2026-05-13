import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress,
  Container, Divider, IconButton, Snackbar, Stack, Switch, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTranslation, Trans } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function MealCard({ toggle, menuItems, mealBlocked, saving, onToggle, onGuestStep, guestMealsLabel, cutoffLabel }) {
  const { t } = useTranslation();
  const disabled = toggle.isCutoffPassed || mealBlocked;

  return (
    <Card elevation={2} sx={{ opacity: toggle.isCutoffPassed ? 0.8 : 1 }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {toggle.mealType}
            </Typography>
            {toggle.cutoffTime && (
              <Typography
                variant="caption"
                color={toggle.isCutoffPassed ? 'error.main' : 'text.secondary'}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {toggle.isCutoffPassed && <LockOutlinedIcon sx={{ fontSize: 12 }} />}
                {t('meal.cutoffAt', { time: toggle.cutoffTime })}
              </Typography>
            )}
          </Box>
          {toggle.isCutoffPassed ? (
            <LockOutlinedIcon color="disabled" />
          ) : saving ? (
            <CircularProgress size={24} sx={{ mr: 1 }} />
          ) : (
            <Switch
              checked={toggle.isOn}
              onChange={e => onToggle(toggle.mealType, e.target.checked)}
              disabled={disabled}
              color="primary"
              inputProps={{ 'aria-label': `Toggle ${toggle.mealType}` }}
            />
          )}
        </Box>

        {menuItems.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
            {menuItems.map(item => (
              <Chip key={item} label={item} size="small" variant="outlined" />
            ))}
          </Box>
        )}

        {toggle.isOn && !toggle.isCutoffPassed && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {guestMealsLabel}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                <IconButton
                  size="small"
                  onClick={() => onGuestStep(toggle.mealType, -1)}
                  disabled={disabled || toggle.guestCount === 0}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: '6px' }}
                  aria-label="Decrease guest count"
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: 32, textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                  {toggle.guestCount}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => onGuestStep(toggle.mealType, 1)}
                  disabled={disabled}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: '6px' }}
                  aria-label="Increase guest count"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function MealTogglePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [toggles, setToggles] = useState([]);
  const [menus, setMenus] = useState({});
  const [todayDate, setTodayDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const debounceRef = useRef({});

  useEffect(() => {
    Promise.all([
      api.get('/meals/today'),
      api.get('/menus/tomorrow'),
    ]).then(([toggleRes, menuRes]) => {
      setToggles(toggleRes.data.toggles);
      setTodayDate(toggleRes.data.date);
      setMenus(menuRes.data.menus ?? {});
    }).catch(() => {
      setSnackbar({ open: true, message: t('meal.failedToLoad'), severity: 'error' });
    }).finally(() => setLoading(false));
  }, [t]);

  const save = useCallback(async (mealType, isOn, guestCount) => {
    setSaving(s => ({ ...s, [mealType]: true }));
    try {
      const { data } = await api.post('/meals/toggle', { mealType, isOn, guestCount });
      setToggles(prev => prev.map(t =>
        t.mealType === mealType ? { ...t, isOn: data.isOn, guestCount: data.guestCount } : t,
      ));
      setSnackbar({ open: true, message: t('meal.saved'), severity: 'success' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message ?? t('meal.failedToLoad'),
        severity: 'error',
      });
    } finally {
      setSaving(s => ({ ...s, [mealType]: false }));
    }
  }, [t]);

  const handleToggle = useCallback((mealType, isOn) => {
    const current = toggles.find(t => t.mealType === mealType);
    const guestCount = isOn ? (current?.guestCount ?? 0) : 0;
    setToggles(prev => prev.map(t => t.mealType === mealType ? { ...t, isOn, guestCount } : t));
    save(mealType, isOn, guestCount);
  }, [toggles, save]);

  const handleGuestStep = useCallback((mealType, delta) => {
    const current = toggles.find(t => t.mealType === mealType);
    const newCount = Math.max(0, (current?.guestCount ?? 0) + delta);
    setToggles(prev => prev.map(t => t.mealType === mealType ? { ...t, guestCount: newCount } : t));

    if (debounceRef.current[mealType]) clearTimeout(debounceRef.current[mealType]);
    debounceRef.current[mealType] = setTimeout(() => {
      save(mealType, current?.isOn ?? true, newCount);
    }, 600);
  }, [toggles, save]);

  const allLocked = toggles.length > 0 && toggles.every(t => t.isCutoffPassed);
  const mealOnCount = toggles.filter(t => t.isOn).length;
  const guestTotal = toggles.reduce((sum, t) => sum + (t.isOn ? (t.guestCount ?? 0) : 0), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: 2 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('meal.todayMeals')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatDate(todayDate)}
      </Typography>

      {user?.mealBlocked && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('dashboard.mealBlockedShort')}
        </Alert>
      )}

      {allLocked && !user?.mealBlocked && (
        <Alert severity="info" icon={<LockOutlinedIcon />} sx={{ mb: 2 }}>
          {t('meal.allMealsLocked')}
        </Alert>
      )}

      <Stack spacing={2}>
        {toggles.map(toggle => (
          <MealCard
            key={toggle.mealType}
            toggle={toggle}
            menuItems={menus[toggle.mealType] ?? []}
            mealBlocked={!!user?.mealBlocked}
            saving={!!saving[toggle.mealType]}
            onToggle={handleToggle}
            onGuestStep={handleGuestStep}
            guestMealsLabel={t('dashboard.guestMeals')}
          />
        ))}

        {toggles.length === 0 && (
          <Alert severity="info">{t('meal.noMealTypes')}</Alert>
        )}
      </Stack>

      <Card elevation={1} sx={{ mt: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {t('meal.summary')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Trans
              i18nKey="meal.summaryText"
              values={{ meals: mealOnCount, guests: guestTotal }}
              components={{ b: <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }} /> }}
            />
          </Typography>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
