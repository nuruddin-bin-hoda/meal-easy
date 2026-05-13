import { useState, useEffect } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, FormControl, IconButton, InputLabel,
  MenuItem, Select, Snackbar, Stack, TextField, Typography,
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
  const [newMealType, setNewMealType] = useState('');

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
        timezone: settings.timezone,
        cutoffReminderMinutes: settings.cutoffReminderMinutes,
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

  const toggleMealTypeActive = (name) => {
    setSettings((s) => ({
      ...s,
      mealTypes: s.mealTypes.map((mt) =>
        mt.name === name ? { ...mt, isActive: !mt.isActive } : mt,
      ),
    }));
  };

  const updateMealTypeCutoff = (name, cutoffTime) => {
    setSettings((s) => ({
      ...s,
      mealTypes: s.mealTypes.map((mt) =>
        mt.name === name ? { ...mt, cutoffTime } : mt,
      ),
    }));
  };

  const addMealType = (name) => {
    if (!name.trim() || settings.mealTypes.some((mt) => mt.name === name.trim())) return;
    setSettings((s) => ({
      ...s,
      mealTypes: [...s.mealTypes, { name: name.trim(), isActive: true, isAutoEnabled: false, cutoffTime: '22:00' }],
    }));
  };

  const removeMealType = (name) => {
    setSettings((s) => ({
      ...s,
      mealTypes: s.mealTypes.filter((mt) => mt.name !== name),
    }));
  };

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
              <FormControl size="small" sx={{ maxWidth: 260 }}>
                <InputLabel>{t('settings.timezone')}</InputLabel>
                <Select
                  label={t('settings.timezone')}
                  value={settings.timezone ?? 'Asia/Dhaka'}
                  onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
                >
                  <MenuItem value="Asia/Dhaka">Asia/Dhaka (Bangladesh)</MenuItem>
                  <MenuItem value="Asia/Kolkata">Asia/Kolkata (India)</MenuItem>
                  <MenuItem value="Asia/Tokyo">Asia/Tokyo (Japan)</MenuItem>
                  <MenuItem value="Asia/Dubai">Asia/Dubai (UAE)</MenuItem>
                  <MenuItem value="Europe/London">Europe/London (UK)</MenuItem>
                  <MenuItem value="America/New_York">America/New_York (US East)</MenuItem>
                  <MenuItem value="America/Los_Angeles">America/Los_Angeles (US West)</MenuItem>
                  <MenuItem value="Asia/Singapore">Asia/Singapore (Singapore)</MenuItem>
                  <MenuItem value="Australia/Sydney">Australia/Sydney (Australia)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Cutoff reminder (minutes before)"
                type="number"
                value={settings.cutoffReminderMinutes ?? 30}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, cutoffReminderMinutes: Number(e.target.value) }))
                }
                size="small"
                sx={{ maxWidth: 260 }}
                slotProps={{ htmlInput: { min: 0 } }}
                helperText="Send push notification this many minutes before each meal cutoff"
              />
              <TextField
                label="Guest meal monthly limit"
                type="number"
                value={settings.guestMealMonthlyLimit ?? 5}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, guestMealMonthlyLimit: Number(e.target.value) }))
                }
                size="small"
                sx={{ maxWidth: 260 }}
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

            <Stack spacing={1.5} sx={{ mb: 2 }}>
              {(settings.mealTypes ?? []).map((mt) => (
                <Box
                  key={mt.name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    p: 1.25,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: mt.isActive ? 'success.light' : 'divider',
                    bgcolor: mt.isActive ? 'success.50' : 'transparent',
                  }}
                >
                  <Button
                    size="small"
                    variant={mt.isActive ? 'contained' : 'outlined'}
                    color={mt.isActive ? 'success' : 'inherit'}
                    onClick={() => toggleMealTypeActive(mt.name)}
                    sx={{ minWidth: 90, textTransform: 'capitalize' }}
                  >
                    {mt.name}
                  </Button>

                  <TextField
                    label="Cutoff time"
                    type="time"
                    size="small"
                    value={mt.cutoffTime ?? '22:00'}
                    onChange={(e) => updateMealTypeCutoff(mt.name, e.target.value)}
                    sx={{ width: 150 }}
                    inputProps={{ step: 60 }}
                  />

                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 80 }}>
                    {mt.isActive ? 'Active' : 'Inactive'}
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={() => removeMealType(mt.name)}
                    color="error"
                    aria-label={`Remove ${mt.name}`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>

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
