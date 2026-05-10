import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress, Container,
  Divider, Grid, IconButton, List, ListItem, ListItemText,
  Stack, Switch, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

function ToggleCard({ toggle, menuItems = [], disabled, saving, onToggle, onGuestStep }) {
  return (
    <Card elevation={1} sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: '12px !important', pt: 1.5, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
            {toggle.mealType}
          </Typography>
          {saving ? (
            <CircularProgress size={22} sx={{ mr: 0.5 }} />
          ) : (
            <Switch
              checked={toggle.isOn}
              onChange={(e) => onToggle(toggle.mealType, e.target.checked)}
              disabled={disabled}
              size="small"
              color="primary"
              inputProps={{ 'aria-label': `Toggle ${toggle.mealType}` }}
            />
          )}
        </Box>

        {menuItems.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {menuItems.map((item) => (
              <Chip key={item} label={item} size="small" variant="outlined" />
            ))}
          </Box>
        )}

        {toggle.isOn && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Guest meals
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto' }}>
                <IconButton
                  size="small"
                  onClick={() => onGuestStep(toggle.mealType, -1)}
                  disabled={disabled || toggle.guestCount === 0}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: '4px' }}
                  aria-label="Decrease guest count"
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>
                  {toggle.guestCount}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => onGuestStep(toggle.mealType, 1)}
                  disabled={disabled}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: '4px' }}
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

export default function UserDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggles, setToggles] = useState([]);
  const [saving, setSaving] = useState({});
  const debounceRef = useRef({});

  useEffect(() => {
    api.get('/dashboard/user')
      .then((res) => {
        setData(res.data);
        setToggles(res.data.tomorrowToggles ?? []);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (mealType, isOn, guestCount) => {
    setSaving((s) => ({ ...s, [mealType]: true }));
    try {
      const { data: saved } = await api.post('/meals/toggle', { mealType, isOn, guestCount });
      setToggles((prev) =>
        prev.map((t) => t.mealType === mealType ? { ...t, isOn: saved.isOn, guestCount: saved.guestCount } : t),
      );
    } catch {
      // silently revert — the switch snaps back on next re-render because state didn't update
    } finally {
      setSaving((s) => ({ ...s, [mealType]: false }));
    }
  }, []);

  const handleToggle = useCallback((mealType, isOn) => {
    const current = toggles.find((t) => t.mealType === mealType);
    const guestCount = isOn ? (current?.guestCount ?? 0) : 0;
    setToggles((prev) => prev.map((t) => t.mealType === mealType ? { ...t, isOn, guestCount } : t));
    save(mealType, isOn, guestCount);
  }, [toggles, save]);

  const handleGuestStep = useCallback((mealType, delta) => {
    const current = toggles.find((t) => t.mealType === mealType);
    const newCount = Math.max(0, (current?.guestCount ?? 0) + delta);
    setToggles((prev) => prev.map((t) => t.mealType === mealType ? { ...t, guestCount: newCount } : t));
    if (debounceRef.current[mealType]) clearTimeout(debounceRef.current[mealType]);
    debounceRef.current[mealType] = setTimeout(() => {
      save(mealType, current?.isOn ?? true, newCount);
    }, 600);
  }, [toggles, save]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const {
    balance = 0,
    predictedMealRate = 0,
    myMealCountThisMonth = 0,
    tomorrowMenu = [],
    cutoffTime = '22:00',
    isCutoffPassed = false,
    lowStockWarnings = [],
    recentNotifications = [],
  } = data;

  const menuMap = Object.fromEntries(tomorrowMenu.map((m) => [m.mealType, m.items]));
  const isDisabled = isCutoffPassed || !!user?.mealBlocked;
  const balanceColor = balance >= 0 ? 'success.main' : 'error.main';
  const balanceBg = balance >= 0 ? 'success.50' : 'error.50';

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        My Dashboard
      </Typography>

      {lowStockWarnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Low stock: {lowStockWarnings.join(', ')}
        </Alert>
      )}

      {user?.mealBlocked && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Your meal access is blocked. Contact admin.
        </Alert>
      )}

      <Grid container spacing={2}>

        {/* Balance */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2} sx={{ bgcolor: balanceBg, height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                My Balance
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: balanceColor }}>
                ৳{balance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Predicted rate */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Predicted Rate
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                ৳{predictedMealRate.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">per meal</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Meals this month */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                My Meals This Month
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary">
                {myMealCountThisMonth}
              </Typography>
              <Typography variant="caption" color="text.secondary">meals toggled on</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tomorrow's menu */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Tomorrow's Menu
              </Typography>
              {tomorrowMenu.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Menu not set yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {tomorrowMenu.map((m) => (
                    <Box key={m.mealType}>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                      >
                        {m.mealType}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {m.items.length === 0 ? (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        ) : m.items.map((item) => (
                          <Chip key={item} label={item} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick-access meal toggles */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Tomorrow's Meals
                </Typography>
                {isCutoffPassed && (
                  <Chip
                    icon={<LockOutlinedIcon />}
                    label="Cutoff passed"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>

              {toggles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No meal toggles available.
                </Typography>
              ) : toggles.map((toggle) => (
                <ToggleCard
                  key={toggle.mealType}
                  toggle={toggle}
                  menuItems={menuMap[toggle.mealType] ?? []}
                  disabled={isDisabled}
                  saving={!!saving[toggle.mealType]}
                  onToggle={handleToggle}
                  onGuestStep={handleGuestStep}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent notifications */}
        <Grid size={12}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <NotificationsIcon fontSize="small" color="action" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Recent Notifications
                </Typography>
              </Box>
              {recentNotifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No notifications yet.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {recentNotifications.map((n, i) => (
                    <ListItem
                      key={n._id}
                      disableGutters
                      sx={{
                        opacity: n.isRead ? 0.6 : 1,
                        borderBottom: i < recentNotifications.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      <ListItemText
                        primary={n.message}
                        secondary={new Date(n.createdAt).toLocaleString()}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: n.isRead ? 400 : 600 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      {!n.isRead && (
                        <Chip label="New" color="primary" size="small" sx={{ ml: 1, flexShrink: 0 }} />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Container>
  );
}
