import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Chip, CircularProgress,
  Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Divider, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const currentMonth = () => format(new Date(), 'yyyy-MM');

function StatCard({ label, value }) {
  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 140 }}>
      <CardContent sx={{ py: '12px !important' }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h6" fontWeight={700}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [month, setMonth] = useState(currentMonth());
  const [preview, setPreview] = useState(null);
  const [billingCycle, setBillingCycle] = useState(null);
  const [lockedBills, setLockedBills] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    api.get('/users?limit=200').then(res => {
      const map = {};
      for (const u of res.data.users ?? []) map[u._id] = u.name;
      setUsers(map);
    }).catch(() => {});
  }, []);

  const loadBilling = useCallback(async () => {
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    setLoading(true);
    setPreview(null);
    setBillingCycle(null);
    setLockedBills([]);

    try {
      const cycleRes = await api.get(`/billing/${month}`).catch(err => {
        if (err.response?.status === 404) return null;
        throw err;
      });

      if (cycleRes?.data.billingCycle?.isLocked) {
        setBillingCycle(cycleRes.data.billingCycle);
        setLockedBills(cycleRes.data.userBills ?? []);
      } else {
        if (cycleRes) setBillingCycle(cycleRes.data.billingCycle);
        const previewRes = await api.get(`/billing/${month}/preview`);
        setPreview(previewRes.data);
      }
    } catch {
      notify(t('billing.failedToLoad'), 'error');
    } finally {
      setLoading(false);
    }
  }, [month, t]);

  useEffect(() => { loadBilling(); }, [loadBilling]);

  const handleSubmit = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      await api.post(`/billing/${month}/submit`);
      notify(t('billing.submittedSuccess'));
      loadBilling();
    } catch (err) {
      notify(err.response?.data?.message ?? t('billing.failedToSubmit'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isLocked = !!billingCycle?.isLocked;
  const data = isLocked ? null : preview;

  const previewRows = data?.userBills ?? [];
  const lockedRows = lockedBills;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('billing.title')}</Typography>
        {isLocked && (
          <Chip icon={<LockIcon />} label={t('billing.locked')} color="warning" size="small" />
        )}
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <TextField
          label={t('common.month')} value={month} size="small"
          onChange={e => setMonth(e.target.value)}
          placeholder="YYYY-MM" slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 160 }}
        />
        {!isLocked && data && (
          <Button
            variant="contained" color="success"
            disabled={submitting}
            onClick={() => setConfirmOpen(true)}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : t('billing.submitBilling')}
          </Button>
        )}
        {isLocked && billingCycle?.submittedAt && (
          <Typography variant="body2" color="text.secondary">
            {t('billing.submitted', { date: format(new Date(billingCycle.submittedAt), 'dd MMM yyyy, HH:mm') })}
          </Typography>
        )}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          {(data || isLocked) && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
              <StatCard
                label={t('billing.mealRate')}
                value={`৳${(isLocked ? billingCycle.mealRate : data.mealRate).toFixed(2)}`}
              />
              <StatCard
                label={t('billing.otherCostPerUser')}
                value={`৳${(isLocked ? billingCycle.otherCostPerUser : data.otherCostPerUser).toFixed(2)}`}
              />
              <StatCard
                label={t('billing.totalPurchases')}
                value={`৳${(isLocked ? billingCycle.totalItemCost : data.totalItemCost).toFixed(2)}`}
              />
              <StatCard
                label={t('billing.totalOtherCosts')}
                value={`৳${(isLocked ? billingCycle.totalOtherCost : data.totalOtherCost).toFixed(2)}`}
              />
              <StatCard
                label={t('billing.totalMeals')}
                value={(isLocked ? billingCycle.totalMealCount : data.totalMealCount)}
              />
              <StatCard
                label={t('billing.activeUsers')}
                value={(isLocked ? billingCycle.activeUserCount : data.activeUserCount)}
              />
            </Stack>
          )}

          {(previewRows.length > 0 || lockedRows.length > 0) && (
            <Card elevation={2}>
              {!isLocked && (
                <CardHeader
                  title={t('billing.previewNote')}
                  titleTypographyProps={{ variant: 'subtitle1', color: 'text.secondary' }}
                  sx={{ pb: 0 }}
                />
              )}
              <Divider />
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                    <TableCell>{t('billing.userCol')}</TableCell>
                    <TableCell align="right">{t('billing.meals')}</TableCell>
                    <TableCell align="right">{t('billing.guestMeals')}</TableCell>
                    <TableCell align="right">{t('billing.mealCost')}</TableCell>
                    <TableCell align="right">{t('billing.otherShare')}</TableCell>
                    <TableCell align="right">{t('billing.totalBill')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(isLocked ? lockedRows : previewRows).map((row, idx) => {
                    const name = isLocked
                      ? (row.userId?.name ?? users[row.userId] ?? '—')
                      : (users[row.userId?.toString()] ?? row.userId?.toString?.() ?? '—');
                    return (
                      <TableRow key={isLocked ? row._id : idx} hover>
                        <TableCell>{name}</TableCell>
                        <TableCell align="right">{row.mealCount}</TableCell>
                        <TableCell align="right">{row.guestMealCount}</TableCell>
                        <TableCell align="right">৳{row.mealCost.toFixed(2)}</TableCell>
                        <TableCell align="right">৳{row.otherCostShare.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ৳{row.totalBill.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {!data && !isLocked && !loading && (
            <Alert severity="info">{t('billing.noData', { month })}</Alert>
          )}
        </>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('billing.confirmTitle', { month })}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('billing.confirmText')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" color="error">
            {t('billing.submitAndLock')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
