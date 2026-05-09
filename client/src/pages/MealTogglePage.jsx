import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress,
  Container, Divider, IconButton, Snackbar, Stack, Switch, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function isCutoffPassed(cutoffTime) {
  if (!cutoffTime) return false;
  const [hh, mm] = cutoffTime.split(':').map(Number);
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() >= hh * 60 + mm;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function MealCard({ toggle, menuItems, disabled, saving, onToggle, onGuestStep }) {
  return (
    <Card elevation={2}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
          <Typography variant="h6" fontWeight={600}>
            {toggle.mealType}
          </Typography>
          {saving ? (
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

        {toggle.isOn && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Guest meals
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
  const [toggles, setToggles] = useState([]);
  const [menus, setMenus] = useState({});
  const [tomorrowDate, setTomorrowDate] = useState('');
  const [cutoffPassed, setCutoffPassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const debounceRef = useRef({});

  useEffect(() => {
    Promise.all([
      api.get('/meals/tomorrow'),
      api.get('/menus/tomorrow'),
      api.get('/settings'),
    ]).then(([toggleRes, menuRes, settingsRes]) => {
      setToggles(toggleRes.data.toggles);
      setTomorrowDate(toggleRes.data.date);
      setMenus(menuRes.data.menus ?? {});
      setCutoffPassed(isCutoffPassed(settingsRes.data.cutoffTime));
    }).catch(() => {
      setSnackbar({ open: true, message: 'Failed to load meal data', severity: 'error' });
    }).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (mealType, isOn, guestCount) => {
    setSaving(s => ({ ...s, [mealType]: true }));
    try {
      const { data } = await api.post('/meals/toggle', { mealType, isOn, guestCount });
      setToggles(prev => prev.map(t =>
        t.mealType === mealType ? { ...t, isOn: data.isOn, guestCount: data.guestCount } : t,
      ));
      setSnackbar({ open: true, message: 'Saved', severity: 'success' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message ?? 'Failed to save',
        severity: 'error',
      });
    } finally {
      setSaving(s => ({ ...s, [mealType]: false }));
    }
  }, []);

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

  const mealOnCount = toggles.filter(t => t.isOn).length;
  const guestTotal = toggles.reduce((sum, t) => sum + (t.isOn ? (t.guestCount ?? 0) : 0), 0);
  const isDisabled = cutoffPassed || !!user?.mealBlocked;

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
        Tomorrow's Meals
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatDate(tomorrowDate)}
      </Typography>

      {user?.mealBlocked && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Your meal access is blocked
        </Alert>
      )}

      {cutoffPassed && !user?.mealBlocked && (
        <Alert severity="warning" icon={<LockOutlinedIcon />} sx={{ mb: 2 }}>
          Cutoff passed. Toggles are locked.
        </Alert>
      )}

      <Stack spacing={2}>
        {toggles.map(toggle => (
          <MealCard
            key={toggle.mealType}
            toggle={toggle}
            menuItems={menus[toggle.mealType] ?? []}
            disabled={isDisabled}
            saving={!!saving[toggle.mealType]}
            onToggle={handleToggle}
            onGuestStep={handleGuestStep}
          />
        ))}

        {toggles.length === 0 && (
          <Alert severity="info">No meal types have been configured yet.</Alert>
        )}
      </Stack>

      <Card elevation={1} sx={{ mt: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You have{' '}
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {mealOnCount} meal{mealOnCount !== 1 ? 's' : ''}
            </Box>{' '}
            and{' '}
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {guestTotal} guest meal{guestTotal !== 1 ? 's' : ''}
            </Box>{' '}
            scheduled for tomorrow.
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
