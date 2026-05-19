import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Alert, Box, Button, Card, CardActions, CardContent, CardHeader,
  Chip, CircularProgress, Container, Snackbar, Stack, TextField, Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useTopbar } from '../context/TopbarContext';
import { to12Hour } from '../utils/timeUtils';

function getLocalDateString(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function ChipInput({ mealType, items, inputValue, onAdd, onDelete, onInputChange, placeholder, helperText, disabled }) {
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const val = inputValue.trim();
    if (val && !items.includes(val)) onAdd(mealType, val);
  };

  return (
    <Box>
      {items.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
          {items.map(item => (
            <Chip
              key={item}
              label={item}
              onDelete={disabled ? undefined : () => onDelete(mealType, item)}
              size="small"
            />
          ))}
        </Box>
      )}
      <TextField
        value={inputValue}
        onChange={e => onInputChange(mealType, e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        size="small"
        fullWidth
        helperText={helperText}
        disabled={disabled}
      />
    </Box>
  );
}

export default function SetMenuPage() {
  const { t } = useTranslation();
  const { setTopbar } = useTopbar();
  const [date, setDate] = useState(() => getLocalDateString(1));

  useEffect(() => {
    setTopbar({ title: t('nav.setMenu'), subtitle: 'Admin' });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);
  const [mealTypes, setMealTypes] = useState([]);
  const [mealTypeCutoffs, setMealTypeCutoffs] = useState({});
  const [items, setItems] = useState({});
  const [inputs, setInputs] = useState({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [saving, setSaving] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const isMealCutoffPassed = (cutoffTime) => {
    if (!cutoffTime) return false;
    const [h, m] = cutoffTime.split(':').map(Number);
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
  };

  const isToday = (dateStr) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return dateStr === `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    api.get('/settings').then(res => {
      const activeFull = (res.data.mealTypes ?? []).filter(mt => mt.isActive);
      const active = activeFull.map(mt => mt.name);
      setMealTypes(active);
      setMealTypeCutoffs(Object.fromEntries(activeFull.map(mt => [mt.name, mt.cutoffTime])));
      setItems(Object.fromEntries(active.map(n => [n, []])));
      setInputs(Object.fromEntries(active.map(n => [n, ''])));
    }).catch(() => {
      setSnackbar({ open: true, message: t('menu.failedToLoadSettings'), severity: 'error' });
    }).finally(() => setLoadingSettings(false));
  }, [t]);

  useEffect(() => {
    if (!mealTypes.length) return;
    setLoadingMenus(true);
    api.get(`/menus/${date}`).then(res => {
      const fetched = res.data.menus ?? {};
      setItems(Object.fromEntries(mealTypes.map(n => [n, fetched[n] ?? []])));
    }).catch(() => {
      setItems(Object.fromEntries(mealTypes.map(n => [n, []])));
    }).finally(() => setLoadingMenus(false));
  }, [date, mealTypes]);

  const handleAdd = useCallback((mealType, value) => {
    setItems(prev => ({ ...prev, [mealType]: [...(prev[mealType] ?? []), value] }));
    setInputs(prev => ({ ...prev, [mealType]: '' }));
  }, []);

  const handleDelete = useCallback((mealType, value) => {
    setItems(prev => ({ ...prev, [mealType]: prev[mealType].filter(i => i !== value) }));
  }, []);

  const handleInputChange = useCallback((mealType, value) => {
    setInputs(prev => ({ ...prev, [mealType]: value }));
  }, []);

  const handleSave = async (mealType) => {
    setSaving(s => ({ ...s, [mealType]: true }));
    try {
      await api.post('/menus', { date, mealType, items: items[mealType] ?? [] });
      setSnackbar({ open: true, message: t('menu.menuSaved', { mealType }), severity: 'success' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message ?? t('menu.failedToSave'),
        severity: 'error',
      });
    } finally {
      setSaving(s => ({ ...s, [mealType]: false }));
    }
  };

  if (loadingSettings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: 2 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('menu.setMenu')}
      </Typography>

      <DatePicker
        label={t('menu.date')}
        value={date ? dayjs(date) : null}
        onChange={(newVal) => setDate(newVal ? newVal.format('YYYY-MM-DD') : '')}
        slotProps={{ textField: { size: 'small', fullWidth: true, sx: { mb: 3 } } }}
      />

      {mealTypes.length === 0 && (
        <Alert severity="info">{t('menu.noActiveMealTypes')}</Alert>
      )}

      {loadingMenus ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Stack spacing={2}>
          {mealTypes.map(mealType => {
            const isPastDate = date < getLocalDateString();
            const cutoffPassed = isToday(date) && isMealCutoffPassed(mealTypeCutoffs[mealType]);
            const locked = isPastDate || cutoffPassed;
            const lockCaption = isPastDate
              ? 'Cannot edit past menus'
              : `Locked — cutoff passed at ${to12Hour(mealTypeCutoffs[mealType])}`;

            return (
              <Card key={mealType} elevation={2}>
                <CardHeader
                  title={mealType}
                  titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                  subheader={locked ? (
                    <Typography variant="caption" color="error">{lockCaption}</Typography>
                  ) : null}
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <ChipInput
                    mealType={mealType}
                    items={items[mealType] ?? []}
                    inputValue={inputs[mealType] ?? ''}
                    onAdd={handleAdd}
                    onDelete={handleDelete}
                    onInputChange={handleInputChange}
                    placeholder={t('menu.typeItemPrompt')}
                    helperText={t('menu.pressEnterToAdd')}
                    disabled={locked}
                  />
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    onClick={() => handleSave(mealType)}
                    disabled={!!saving[mealType] || locked}
                    fullWidth
                    size="large"
                  >
                    {saving[mealType]
                      ? <CircularProgress size={22} color="inherit" />
                      : t('menu.saveMenu')}
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Stack>
      )}

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
