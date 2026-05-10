import { useState, useEffect } from 'react';
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress,
  Container, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

function StatCard({ label, value }) {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700} noWrap>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, badge, badgeColor, children }) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          {badge != null && badge > 0 && (
            <Chip label={badge} color={badgeColor ?? 'default'} size="small" />
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

const fmt = (n) => `৳${Number(n ?? 0).toFixed(2)}`;

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/admin')
      .then((res) => setData(res.data))
      .catch(() => setError(t('dashboard.failedToLoad')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const {
    totalActiveUsers = 0,
    todayMealCounts = [],
    todayTotalGuests = 0,
    predictedMealRate = 0,
    totalPurchasesThisMonth = 0,
    totalDepositsThisMonth = 0,
    lowBalanceUsers = [],
    lowStockItems = [],
    pendingApprovals = { count: 0, users: [] },
    chefSalaryStatus = [],
  } = data;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('dashboard.adminTitle')}
      </Typography>

      <Grid container spacing={2}>

        {/* Stat cards */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label={t('dashboard.activeUsers')} value={totalActiveUsers} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label={t('dashboard.purchasesThisMonth')} value={fmt(totalPurchasesThisMonth)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label={t('dashboard.depositsThisMonth')} value={fmt(totalDepositsThisMonth)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label={t('dashboard.predictedRate')} value={`${fmt(predictedMealRate)}${t('common.perMealUnit')}`} />
        </Grid>

        {/* Today's meal counts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title={t('dashboard.todayMealCounts')}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                  <TableCell>{t('dashboard.mealType')}</TableCell>
                  <TableCell align="right">{t('dashboard.users')}</TableCell>
                  <TableCell align="right">{t('dashboard.guests')}</TableCell>
                  <TableCell align="right">{t('dashboard.totalPortions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todayMealCounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {t('dashboard.noMealsToday')}
                    </TableCell>
                  </TableRow>
                ) : todayMealCounts.map((row) => (
                  <TableRow key={row.mealType} hover>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{row.mealType}</TableCell>
                    <TableCell align="right">{row.userCount}</TableCell>
                    <TableCell align="right">{row.guestCount}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{row.totalPortions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('dashboard.totalGuestsToday')}
              </Typography>
              <Typography variant="h2" fontWeight={700} color="primary">
                {todayTotalGuests}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('dashboard.guestPortions')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Low balance users */}
        <Grid size={12}>
          <SectionCard
            title={t('dashboard.lowBalanceUsers')}
            badge={lowBalanceUsers.length}
            badgeColor="error"
          >
            {lowBalanceUsers.length === 0 ? (
              <Alert severity="success">{t('dashboard.sufficientBalance')}</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                    <TableCell>{t('common.name')}</TableCell>
                    <TableCell>{t('common.room')}</TableCell>
                    <TableCell align="right">{t('common.balance')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowBalanceUsers.map((u) => (
                    <TableRow
                      key={u.userId}
                      sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                    >
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.roomNumber}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                        {fmt(u.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </Grid>

        {/* Low stock + pending approvals */}
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title={t('dashboard.lowStockItems')}
            badge={lowStockItems.length}
            badgeColor="warning"
          >
            {lowStockItems.length === 0 ? (
              <Alert severity="success">{t('dashboard.adequateStock')}</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                    <TableCell>{t('common.item')}</TableCell>
                    <TableCell align="right">{t('common.qty')}</TableCell>
                    <TableCell>{t('common.unit')}</TableCell>
                    <TableCell align="right">{t('stock.threshold')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow
                      key={item._id ?? item.itemName}
                      sx={{ bgcolor: 'warning.50', '&:hover': { bgcolor: 'warning.100' } }}
                    >
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                        {item.quantity}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell align="right">{item.lowThreshold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title={t('dashboard.pendingApprovals')}
            badge={pendingApprovals.count}
            badgeColor="info"
          >
            {pendingApprovals.count === 0 ? (
              <Alert severity="success">{t('dashboard.noPendingApprovals')}</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                    <TableCell>{t('common.name')}</TableCell>
                    <TableCell>{t('common.room')}</TableCell>
                    <TableCell>{t('dashboard.registered')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingApprovals.users.map((u) => (
                    <TableRow key={u._id} hover>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.roomNumber}</TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </Grid>

        {/* Chef salary status */}
        <Grid size={12}>
          <SectionCard title={t('dashboard.chefSalaryStatus')}>
            {chefSalaryStatus.length === 0 ? (
              <Alert severity="info">{t('dashboard.noActiveChefs')}</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 0.5 }}>
                {chefSalaryStatus.map((chef) => (
                  <Box
                    key={chef.chefId}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      px: 1.5, py: 0.75, borderRadius: 2, bgcolor: 'action.hover',
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>{chef.name}</Typography>
                    <Chip
                      label={chef.paidStatus === 'paid' ? t('common.paid') : t('common.unpaid')}
                      color={chef.paidStatus === 'paid' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Grid>

      </Grid>
    </Container>
  );
}
