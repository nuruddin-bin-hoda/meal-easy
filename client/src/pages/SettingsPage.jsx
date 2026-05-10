import { useState, useEffect } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Container, Divider, IconButton, Snackbar, Stack, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    api.get('/settings')
      .then((res) => setSettings(res.data))
      .catch(() => notify('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/settings', {
        cutoffTime: settings.cutoffTime,
        guestMealMonthlyLimit: settings.guestMealMonthlyLimit,
        mealTypes: settings.mealTypes,
      });
      setSettings(res.data);
      notify('Settings saved');
    } catch (err) {
      notify(err.response?.data?.message ?? 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleMealType = (name) => {
    setSettings((s) => ({
      ...s,
      mealTypes: s.mealTypes.map((mt) =>
        mt.name === name ? { ...mt, isActive: !mt.isActive } : mt,
      ),
    }));
  };

  const addMealType = (name) => {
    if (!name.trim() || settings.mealTypes.some((mt) => mt.name === name.trim())) return;
    setSettings((s) => ({
      ...s,
      mealTypes: [...s.mealTypes, { name: name.trim(), isActive: true }],
    }));
  };

  const removeMealType = (name) => {
    setSettings((s) => ({
      ...s,
      mealTypes: s.mealTypes.filter((mt) => mt.name !== name),
    }));
  };

  const [newMealType, setNewMealType] = useState('');

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  if (!settings) return null;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>{t('nav.settings')}</Typography>

      <Stack spacing={3}>
        {/* General settings */}
        <Card elevation={2}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>General</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <TextField
                label="Meal cutoff time (HH:MM)"
                value={settings.cutoffTime ?? '22:00'}
                onChange={(e) => setSettings((s) => ({ ...s, cutoffTime: e.target.value }))}
                size="small"
                sx={{ maxWidth: 220 }}
                placeholder="22:00"
              />
              <TextField
                label="Guest meal monthly limit"
                type="number"
                value={settings.guestMealMonthlyLimit ?? 5}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, guestMealMonthlyLimit: Number(e.target.value) }))
                }
                size="small"
                sx={{ maxWidth: 220 }}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Meal types */}
        <Card elevation={2}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Meal Types</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {(settings.mealTypes ?? []).map((mt) => (
                <Chip
                  key={mt.name}
                  label={mt.name}
                  color={mt.isActive ? 'success' : 'default'}
                  variant={mt.isActive ? 'filled' : 'outlined'}
                  onClick={() => toggleMealType(mt.name)}
                  onDelete={() => removeMealType(mt.name)}
                  deleteIcon={<DeleteIcon />}
                  sx={{ textTransform: 'capitalize' }}
                />
              ))}
            </Box>
            <Stack direction="row" spacing={1} sx={{ maxWidth: 320 }}>
              <TextField
                size="small"
                placeholder="New meal type name"
                value={newMealType}
                onChange={(e) => setNewMealType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { addMealType(newMealType); setNewMealType(''); }
                }}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => { addMealType(newMealType); setNewMealType(''); }}
                size="small"
              >
                Add
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Box>
          <Button variant="contained" onClick={handleSave} disabled={saving} size="large">
            {saving ? <CircularProgress size={20} color="inherit" /> : t('common.save')}
          </Button>
        </Box>
      </Stack>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
