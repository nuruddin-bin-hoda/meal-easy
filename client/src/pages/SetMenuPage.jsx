import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Button, Card, CardActions, CardContent, CardHeader,
  Chip, CircularProgress, Container, Snackbar, Stack, TextField, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

function getLocalDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function ChipInput({ mealType, items, inputValue, onAdd, onDelete, onInputChange, placeholder, helperText }) {
  const handleKeyDown = (e) => {
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
              onDelete={() => onDelete(mealType, item)}
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
      />
    </Box>
  );
}

export default function SetMenuPage() {
  const { t } = useTranslation();
  const [date, setDate] = useState(getLocalDateString);
  const [mealTypes, setMealTypes] = useState([]);
  const [items, setItems] = useState({});
  const [inputs, setInputs] = useState({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [saving, setSaving] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    api.get('/settings').then(res => {
      const active = (res.data.mealTypes ?? []).filter(mt => mt.isActive).map(mt => mt.name);
      setMealTypes(active);
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

      <TextField
        type="date"
        label={t('menu.date')}
        value={date}
        onChange={e => setDate(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        slotProps={{ inputLabel: { shrink: true } }}
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
          {mealTypes.map(mealType => (
            <Card key={mealType} elevation={2}>
              <CardHeader
                title={mealType}
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
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
                />
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  onClick={() => handleSave(mealType)}
                  disabled={!!saving[mealType]}
                  fullWidth
                  size="large"
                >
                  {saving[mealType]
                    ? <CircularProgress size={22} color="inherit" />
                    : t('menu.saveMenu')}
                </Button>
              </CardActions>
            </Card>
          ))}
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
