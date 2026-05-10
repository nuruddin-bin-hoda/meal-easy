import { useState, useEffect } from 'react';
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress,
  Container, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/admin')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

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
    totalOtherCostsThisMonth = 0,
    totalDepositsThisMonth = 0,
    lowBalanceUsers = [],
    lowStockItems = [],
    pendingApprovals = { count: 0, users: [] },
    chefSalaryStatus = [],
  } = data;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={2}>

        {/* Row 1 — stat cards */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Active Users" value={totalActiveUsers} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Purchases This Month" value={fmt(totalPurchasesThisMonth)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Deposits This Month" value={fmt(totalDepositsThisMonth)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Predicted Rate" value={`${fmt(predictedMealRate)}/meal`} />
        </Grid>

        {/* Row 2 — today's meal counts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title="Today's Meal Counts">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                  <TableCell>Meal Type</TableCell>
                  <TableCell align="right">Users</TableCell>
                  <TableCell align="right">Guests</TableCell>
                  <TableCell align="right">Total Portions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todayMealCounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No meals toggled for today
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
                Total Guests Today
              </Typography>
              <Typography variant="h2" fontWeight={700} color="primary">
                {todayTotalGuests}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                guest portions across all meal types
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Row 3 — low balance users */}
        <Grid size={12}>
          <SectionCard
            title="Low Balance Users"
            badge={lowBalanceUsers.length}
            badgeColor="error"
          >
            {lowBalanceUsers.length === 0 ? (
              <Alert severity="success">All users have sufficient balance.</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell align="right">Balance</TableCell>
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

        {/* Row 4 — low stock + pending approvals */}
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard
            title="Low Stock Items"
            badge={lowStockItems.length}
            badgeColor="warning"
          >
            {lowStockItems.length === 0 ? (
              <Alert severity="success">All stock levels are adequate.</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Threshold</TableCell>
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
            title="Pending Approvals"
            badge={pendingApprovals.count}
            badgeColor="info"
          >
            {pendingApprovals.count === 0 ? (
              <Alert severity="success">No pending approvals.</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Registered</TableCell>
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

        {/* Row 5 — chef salary status */}
        <Grid size={12}>
          <SectionCard title="Chef Salary Status — This Month">
            {chefSalaryStatus.length === 0 ? (
              <Alert severity="info">No active chefs.</Alert>
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
                      label={chef.paidStatus === 'paid' ? 'Paid' : 'Unpaid'}
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
