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
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

function ToggleCard({ toggle, menuItems = [], mealBlocked, saving, onToggle, onGuestStep, guestMealsLabel }) {
  const { t } = useTranslation();
  const disabled = toggle.isCutoffPassed || mealBlocked;

  return (
    <Card elevation={1} sx={{ mb: 1.5, opacity: toggle.isCutoffPassed ? 0.8 : 1 }}>
      <CardContent sx={{ pb: '12px !important', pt: 1.5, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
              {toggle.mealType}
            </Typography>
            {toggle.cutoffTime && (
              <Typography
                variant="caption"
                color={toggle.isCutoffPassed ? 'error.main' : 'text.secondary'}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}
              >
                {toggle.isCutoffPassed && <LockOutlinedIcon sx={{ fontSize: 11 }} />}
                {t('meal.cutoffAt', { time: toggle.cutoffTime })}
              </Typography>
            )}
          </Box>
          {toggle.isCutoffPassed ? (
            <LockOutlinedIcon fontSize="small" color="disabled" />
          ) : saving ? (
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

        {toggle.isOn && !toggle.isCutoffPassed && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {guestMealsLabel}
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
  const { t } = useTranslation();
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
        setToggles(res.data.todayToggles ?? []);
      })
      .catch(() => setError(t('dashboard.failedToLoad')))
      .finally(() => setLoading(false));
  }, [t]);

  const save = useCallback(async (mealType, isOn, guestCount) => {
    setSaving((s) => ({ ...s, [mealType]: true }));
    try {
      const { data: saved } = await api.post('/meals/toggle', { mealType, isOn, guestCount });
      setToggles((prev) =>
        prev.map((t) => t.mealType === mealType ? { ...t, isOn: saved.isOn, guestCount: saved.guestCount } : t),
      );
    } catch {
      // silently revert
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
    lowStockWarnings = [],
    recentNotifications = [],
  } = data;

  const menuMap = Object.fromEntries(tomorrowMenu.map((m) => [m.mealType, m.items]));
  const balanceColor = balance >= 0 ? 'success.main' : 'error.main';
  const balanceBg = balance >= 0 ? 'success.50' : 'error.50';

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('dashboard.userTitle')}
      </Typography>

      {lowStockWarnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('dashboard.lowStockWarning')} {lowStockWarnings.join(', ')}
        </Alert>
      )}

      {user?.mealBlocked && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('dashboard.mealBlocked')}
        </Alert>
      )}

      <Grid container spacing={2}>

        {/* Balance */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2} sx={{ bgcolor: balanceBg, height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('dashboard.balance')}
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
                {t('dashboard.predictedRate')}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                ৳{predictedMealRate.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">{t('dashboard.perMeal')}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Meals this month */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('dashboard.mealsThisMonth')}
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary">
                {myMealCountThisMonth}
              </Typography>
              <Typography variant="caption" color="text.secondary">{t('dashboard.mealsToggledOn')}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tomorrow's menu */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t('dashboard.tomorrowMenu')}
              </Typography>
              {tomorrowMenu.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.menuNotSet')}
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
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                {t('meal.todayMeals')}
              </Typography>

              {toggles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.noMealToggles')}
                </Typography>
              ) : toggles.map((toggle) => (
                <ToggleCard
                  key={toggle.mealType}
                  toggle={toggle}
                  menuItems={menuMap[toggle.mealType] ?? []}
                  mealBlocked={!!user?.mealBlocked}
                  saving={!!saving[toggle.mealType]}
                  onToggle={handleToggle}
                  onGuestStep={handleGuestStep}
                  guestMealsLabel={t('dashboard.guestMeals')}
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
                  {t('dashboard.recentNotifications')}
                </Typography>
              </Box>
              {recentNotifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.noNotifications')}
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
                        <Chip label={t('common.new')} color="primary" size="small" sx={{ ml: 1, flexShrink: 0 }} />
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
