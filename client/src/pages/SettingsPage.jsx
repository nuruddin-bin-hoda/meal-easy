import { useState, useEffect } from 'react';
import {
  Alert, Box, Button, CircularProgress,
  Container, Divider, IconButton, InputAdornment,
  Snackbar, Stack, Switch, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useTopbar } from '../context/TopbarContext';
import { useSettings } from '../context/SettingsContext';

const TIMEZONES = [
  { region: 'ASIA', zones: [
    { id: 'Asia/Dhaka',     label: 'Asia/Dhaka (UTC+6)' },
    { id: 'Asia/Kolkata',   label: 'Asia/Kolkata (UTC+5:30)' },
    { id: 'Asia/Karachi',   label: 'Asia/Karachi (UTC+5)' },
    { id: 'Asia/Tokyo',     label: 'Asia/Tokyo (UTC+9)' },
    { id: 'Asia/Dubai',     label: 'Asia/Dubai (UTC+4)' },
    { id: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8)' },
    { id: 'Asia/Bangkok',   label: 'Asia/Bangkok (UTC+7)' },
    { id: 'Asia/Seoul',     label: 'Asia/Seoul (UTC+9)' },
  ] },
  { region: 'EUROPE', zones: [
    { id: 'Europe/London',  label: 'Europe/London (UTC+0)' },
    { id: 'Europe/Paris',   label: 'Europe/Paris (UTC+1)' },
    { id: 'Europe/Berlin',  label: 'Europe/Berlin (UTC+1)' },
    { id: 'Europe/Moscow',  label: 'Europe/Moscow (UTC+3)' },
  ] },
  { region: 'AMERICA', zones: [
    { id: 'America/New_York',    label: 'America/New_York (UTC-5)' },
    { id: 'America/Chicago',     label: 'America/Chicago (UTC-6)' },
    { id: 'America/Denver',      label: 'America/Denver (UTC-7)' },
    { id: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-8)' },
  ] },
  { region: 'PACIFIC', zones: [
    { id: 'Australia/Sydney',  label: 'Australia/Sydney (UTC+11)' },
    { id: 'Pacific/Auckland',  label: 'Pacific/Auckland (UTC+13)' },
  ] },
];

const CUTOFF_OPTIONS = [15, 30, 45, 60];

function SectionHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" fontWeight={500} sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography color="text.secondary" fontSize={14}>{subtitle}</Typography>
    </Box>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { setTopbar } = useTopbar();
  const { refreshSettingsStatus } = useSettings();

  useEffect(() => {
    setTopbar({ title: t('nav.settings') });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newMealType, setNewMealType]           = useState('');
  const [showTimezoneSearch, setShowTimezoneSearch] = useState(false);
  const [tzSearch, setTzSearch]                 = useState('');
  const [showCutoffPicker, setShowCutoffPicker] = useState(false);

  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        const data = res.data;
        if (!data.timezone) {
          data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        setSettings(data);
      })
      .catch(() => notify('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/settings', {
        timezone:                  settings.timezone,
        cutoffReminderMinutes:     settings.cutoffReminderMinutes,
        guestMealMonthlyLimit:     settings.guestMealMonthlyLimit,
        mealTypes:                 settings.mealTypes,
        lowBalanceAlertsEnabled:   settings.lowBalanceAlertsEnabled,
        menuUpdateAlertsEnabled:   settings.menuUpdateAlertsEnabled,
        monthlyReportAlertsEnabled: settings.monthlyReportAlertsEnabled,
      });
      setSettings(res.data);
      refreshSettingsStatus();
      notify('Settings saved');
    } catch (err) {
      notify(err.response?.data?.message ?? 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleMealTypeActive = (name) =>
    setSettings((s) => ({
      ...s,
      mealTypes: s.mealTypes.map((mt) =>
        mt.name === name ? { ...mt, isActive: !mt.isActive } : mt,
      ),
    }));

  const updateMealTypeCutoff = (name, cutoffTime) =>
    setSettings((s) => ({
      ...s,
      mealTypes: s.mealTypes.map((mt) =>
        mt.name === name ? { ...mt, cutoffTime } : mt,
      ),
    }));

  const addMealType = () => {
    const name = newMealType.trim();
    if (!name || settings.mealTypes.some((mt) => mt.name === name)) return;
    setSettings((s) => ({
      ...s,
      mealTypes: [...s.mealTypes, { name, isActive: true, isAutoEnabled: false, cutoffTime: '22:00' }],
    }));
    setNewMealType('');
  };

  const removeMealType = (name) =>
    setSettings((s) => ({
      ...s,
      mealTypes: s.mealTypes.filter((mt) => mt.name !== name),
    }));

  const filteredTimezones = TIMEZONES.map((group) => ({
    ...group,
    zones: group.zones.filter((z) =>
      !tzSearch ||
      z.id.toLowerCase().includes(tzSearch.toLowerCase()) ||
      group.region.toLowerCase().includes(tzSearch.toLowerCase()),
    ),
  })).filter((g) => g.zones.length > 0);

  const currentTzLabel =
    TIMEZONES.flatMap((g) => g.zones).find((z) => z.id === settings?.timezone)?.label
    ?? settings?.timezone
    ?? 'Select a timezone…';

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }
  if (!settings) return null;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>

        {/* Page header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" color="text.secondary">PREFERENCES</Typography>
          <Typography variant="h5" fontWeight={500}>Settings</Typography>
        </Box>

        {/* ── Section 1: Meal Types ─────────────────────────────────────── */}
        <SectionHeader
          title="Meal types"
          subtitle="Categories of meals served. Each has its own daily cutoff for member toggles."
        />

        <Stack spacing={0} sx={{ mb: 2 }}>
          {(settings.mealTypes ?? []).length === 0 && (
            <Typography color="text.secondary" fontSize={14} sx={{ py: 2 }}>
              No meal types added yet
            </Typography>
          )}
          {(settings.mealTypes ?? []).map((mt) => (
            <Box
              key={mt.name}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                py: 1.25, borderBottom: '1px solid', borderColor: 'divider',
              }}
            >
              <Box sx={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                backgroundColor: mt.isActive ? '#4CAF50' : '#9ca3af',
              }} />

              <Typography sx={{ fontSize: 15, fontWeight: 500, flex: 1, minWidth: 80 }}>
                {mt.name}
              </Typography>

              <Typography color="text.secondary" sx={{ fontSize: 12 }}>cutoff</Typography>

              <TextField
                type="time"
                size="small"
                value={mt.cutoffTime ?? ''}
                onChange={(e) => updateMealTypeCutoff(mt.name, e.target.value)}
                sx={{ width: 130 }}
                inputProps={{ step: 60 }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Switch
                  checked={mt.isActive}
                  onChange={() => toggleMealTypeActive(mt.name)}
                  size="small"
                  color="success"
                />
                <Typography fontSize={10} color="text.secondary">
                  {mt.isActive ? 'Active' : 'Inactive'}
                </Typography>
              </Box>

              <IconButton size="small" onClick={() => removeMealType(mt.name)} aria-label={`Remove ${mt.name}`}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
          <TextField
            size="small"
            placeholder="New meal type — e.g. Iftar"
            value={newMealType}
            onChange={(e) => setNewMealType(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addMealType(); }}
            sx={{ flex: 1 }}
          />
          <Button variant="contained" onClick={addMealType}>+ Add</Button>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {/* ── Section 2: Timezone ──────────────────────────────────────── */}
        <SectionHeader
          title="Timezone"
          subtitle="All cutoff times and reports follow this timezone."
        />

        {!showTimezoneSearch ? (
          <Box
            onClick={() => setShowTimezoneSearch(true)}
            sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: 2,
              px: 2, py: 1.5, cursor: 'pointer', mb: 4,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              '&:hover': { borderColor: 'text.primary' },
            }}
          >
            <Typography>{currentTzLabel}</Typography>
            <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </Box>
        ) : (
          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth size="small" autoFocus
              placeholder="Search timezone or region..."
              value={tzSearch}
              onChange={(e) => setTzSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                ),
              }}
              sx={{ mb: 1.5 }}
            />
            <Box sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: 2,
              maxHeight: 300, overflowY: 'auto',
            }}>
              {filteredTimezones.map((group) => (
                <Box key={group.region}>
                  <Typography sx={{
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                    color: 'text.secondary', px: 2, pt: 1.5, pb: 0.5,
                  }}>
                    {group.region}
                  </Typography>
                  {group.zones.map((z) => {
                    const selected = settings.timezone === z.id;
                    return (
                      <Box
                        key={z.id}
                        onClick={() => {
                          setSettings((s) => ({ ...s, timezone: z.id }));
                          setShowTimezoneSearch(false);
                          setTzSearch('');
                        }}
                        sx={{
                          px: 2, py: 1, cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Typography
                          fontSize={14}
                          fontWeight={selected ? 600 : 400}
                          color={selected ? 'primary.main' : 'text.primary'}
                        >
                          {z.label}
                        </Typography>
                        {selected && <CheckIcon fontSize="small" color="primary" />}
                      </Box>
                    );
                  })}
                </Box>
              ))}
              {filteredTimezones.length === 0 && (
                <Typography sx={{ px: 2, py: 3, color: 'text.secondary', textAlign: 'center', fontSize: 14 }}>
                  No timezones match your search.
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 4 }} />

        {/* ── Section 3: Guest Meal Limit ──────────────────────────────── */}
        <SectionHeader
          title="Guest meal limit"
          subtitle="Max guest meals allowed per user each month."
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton
            onClick={() => setSettings((s) => ({
              ...s, guestMealMonthlyLimit: Math.max(0, (s.guestMealMonthlyLimit ?? 5) - 1),
            }))}
          >
            <RemoveIcon />
          </IconButton>
          <Typography sx={{ minWidth: 32, textAlign: 'center', fontSize: 18, fontWeight: 500 }}>
            {settings.guestMealMonthlyLimit ?? 5}
          </Typography>
          <IconButton
            onClick={() => setSettings((s) => ({
              ...s, guestMealMonthlyLimit: (s.guestMealMonthlyLimit ?? 5) + 1,
            }))}
          >
            <AddIcon />
          </IconButton>
          <Typography color="text.secondary" fontSize={14}>meals / member / month</Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* ── Section 4: Notifications ─────────────────────────────────── */}
        <SectionHeader
          title="Notifications"
          subtitle="When you want to be reminded."
        />

        {/* Row 1: Cutoff reminder */}
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box>
            <Typography fontWeight={500} fontSize={14}>Cutoff reminder</Typography>
            <Typography color="text.secondary" fontSize={12}>Push notification before each meal cutoff.</Typography>
          </Box>
          <Box sx={{ position: 'relative' }}>
            <Box
              onClick={() => setShowCutoffPicker((v) => !v)}
              sx={{
                border: '1px solid', borderColor: 'divider', borderRadius: '999px',
                px: 1.5, py: 0.5, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                userSelect: 'none',
                '&:hover': { borderColor: 'text.primary' },
              }}
            >
              {settings.cutoffReminderMinutes ?? 30} min before
            </Box>
            {showCutoffPicker && (
              <Box sx={{
                position: 'absolute', right: 0, top: '110%', zIndex: 10,
                border: '1px solid', borderColor: 'divider', borderRadius: 2,
                bgcolor: 'background.paper', boxShadow: 3, minWidth: 150,
              }}>
                {CUTOFF_OPTIONS.map((opt) => {
                  const selected = (settings.cutoffReminderMinutes ?? 30) === opt;
                  return (
                    <Box
                      key={opt}
                      onClick={() => {
                        setSettings((s) => ({ ...s, cutoffReminderMinutes: opt }));
                        setShowCutoffPicker(false);
                      }}
                      sx={{
                        px: 2, py: 1, cursor: 'pointer', fontSize: 13,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontWeight: selected ? 600 : 400,
                        color: selected ? 'primary.main' : 'text.primary',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      {opt} min before
                      {selected && <CheckIcon fontSize="small" color="primary" />}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>

        {/* Row 2: Low balance alerts */}
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box>
            <Typography fontWeight={500} fontSize={14}>Low balance alerts</Typography>
            <Typography color="text.secondary" fontSize={12}>
              Notify when balance drops below ৳{settings.lowBalanceThreshold ?? 100}.
            </Typography>
          </Box>
          <Switch
            checked={settings.lowBalanceAlertsEnabled ?? true}
            onChange={(e) => setSettings((s) => ({ ...s, lowBalanceAlertsEnabled: e.target.checked }))}
          />
        </Box>

        {/* Row 3: Menu updates */}
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box>
            <Typography fontWeight={500} fontSize={14}>Menu updates</Typography>
            <Typography color="text.secondary" fontSize={12}>When admin sets or changes tomorrow's menu.</Typography>
          </Box>
          <Switch
            checked={settings.menuUpdateAlertsEnabled ?? false}
            onChange={(e) => setSettings((s) => ({ ...s, menuUpdateAlertsEnabled: e.target.checked }))}
          />
        </Box>

        {/* Row 4: Monthly report */}
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box>
            <Typography fontWeight={500} fontSize={14}>Monthly report</Typography>
            <Typography color="text.secondary" fontSize={12}>When your monthly bill is published.</Typography>
          </Box>
          <Switch
            checked={settings.monthlyReportAlertsEnabled ?? true}
            onChange={(e) => setSettings((s) => ({ ...s, monthlyReportAlertsEnabled: e.target.checked }))}
          />
        </Box>

        {/* Save */}
        <Box sx={{ mt: 4 }}>
          <Button variant="contained" size="large" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Settings'}
          </Button>
        </Box>

      </Box>

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
