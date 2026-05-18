import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import {
  Alert, Box, Button, Card, CardContent, CardHeader, CircularProgress,
  Container, MenuItem, Snackbar, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTopbar } from '../context/TopbarContext';

const today = () => format(new Date(), 'yyyy-MM-dd');
const EMPTY_FORM = { buyerUserId: '', item: '', quantity: '', unit: '', price: '', date: today() };

export default function PurchasesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setTopbar } = useTopbar();

  useEffect(() => {
    setTopbar({ title: t('purchases.title'), subtitle: 'Admin' });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', buyerUserId: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    api.get('/users?status=active&limit=200')
      .then(res => setUsers(res.data.users ?? []))
      .catch(() => {});
  }, []);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.buyerUserId) params.set('buyerUserId', filters.buyerUserId);
      const res = await api.get(`/purchases?${params}`);
      setPurchases(res.data.purchases ?? []);
    } catch {
      notify(t('purchases.failedToLoad'), 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => { loadPurchases(); }, [loadPurchases]);

  const handleField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/purchases', {
        buyerUserId: form.buyerUserId,
        item: form.item,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        unit: form.unit || undefined,
        price: Number(form.price),
        date: form.date,
      });
      setForm(EMPTY_FORM);
      notify(t('purchases.recorded'));
      loadPurchases();
    } catch (err) {
      notify(err.response?.data?.message ?? t('purchases.failedToRecord'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTotal = purchases.reduce((sum, p) => sum + p.price, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>{t('purchases.title')}</Typography>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardHeader title={t('purchases.recordPurchase')} titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 0 }} />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select label={t('purchases.buyer')} value={form.buyerUserId} required
                  onChange={handleField('buyerUserId')} sx={{ minWidth: 200 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                </TextField>
                <TextField
                  label={t('purchases.item')} value={form.item} required
                  onChange={handleField('item')} sx={{ flex: 1 }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('purchases.quantity')} value={form.quantity} type="number"
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onChange={handleField('quantity')} sx={{ flex: 1 }}
                />
                <TextField
                  label={t('purchases.unit')} value={form.unit}
                  onChange={handleField('unit')} sx={{ flex: 1 }}
                />
                <TextField
                  label={t('purchases.price')} value={form.price} type="number" required
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onChange={handleField('price')} sx={{ flex: 1 }}
                />
                <DatePicker
                  label={t('purchases.date')}
                  value={form.date ? dayjs(form.date) : null}
                  onChange={(newVal) => setForm(f => ({ ...f, date: newVal ? newVal.format('YYYY-MM-DD') : '' }))}
                  slotProps={{ textField: { size: 'small', required: true, sx: { flex: 1 } } }}
                />
              </Stack>
              <Box>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? <CircularProgress size={20} color="inherit" /> : t('purchases.recordPurchase')}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ mb: 2 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <DatePicker
              label={t('purchases.from')}
              value={filters.startDate ? dayjs(filters.startDate) : null}
              onChange={(newVal) => setFilters(f => ({ ...f, startDate: newVal ? newVal.format('YYYY-MM-DD') : '' }))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label={t('purchases.to')}
              value={filters.endDate ? dayjs(filters.endDate) : null}
              onChange={(newVal) => setFilters(f => ({ ...f, endDate: newVal ? newVal.format('YYYY-MM-DD') : '' }))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <TextField
              select label={t('purchases.buyer')} value={filters.buyerUserId} size="small" sx={{ minWidth: 160 }}
              onChange={e => setFilters(f => ({ ...f, buyerUserId: e.target.value }))}
            >
              <MenuItem value="">{t('purchases.allBuyers')}</MenuItem>
              {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      ) : (
        <Card elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell>{t('purchases.date')}</TableCell>
                <TableCell>{t('purchases.buyer')}</TableCell>
                <TableCell>{t('purchases.item')}</TableCell>
                <TableCell>{t('common.qty')}</TableCell>
                <TableCell>{t('purchases.unit')}</TableCell>
                <TableCell align="right">{t('purchases.price')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {t('purchases.noPurchases')}
                  </TableCell>
                </TableRow>
              ) : purchases.map(p => (
                <TableRow key={p._id} hover>
                  <TableCell>{format(new Date(p.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>{p.buyerUserId?.name ?? '—'}</TableCell>
                  <TableCell>{p.item}</TableCell>
                  <TableCell>{p.quantity ?? '—'}</TableCell>
                  <TableCell>{p.unit ?? '—'}</TableCell>
                  <TableCell align="right">৳{p.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {purchases.length > 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>
                    {t('purchases.total')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>
                    ৳{filteredTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

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
