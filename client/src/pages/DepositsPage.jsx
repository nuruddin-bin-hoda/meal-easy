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
const EMPTY_FORM = { userId: '', amount: '', date: today(), note: '' };

export default function DepositsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setTopbar } = useTopbar();

  useEffect(() => {
    setTopbar({ title: t('deposits.title'), subtitle: 'Admin' });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ userId: '', startDate: '', endDate: '' });
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

  const loadDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      const res = await api.get(`/deposits?${params}`);
      setDeposits(res.data.deposits ?? []);
    } catch {
      notify(t('deposits.failedToLoad'), 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => { loadDeposits(); }, [loadDeposits]);

  const handleField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/deposits', {
        userId: form.userId,
        amount: Number(form.amount),
        date: form.date,
        note: form.note || undefined,
      });
      setForm(EMPTY_FORM);
      notify(t('deposits.recorded'));
      loadDeposits();
    } catch (err) {
      notify(err.response?.data?.message ?? t('deposits.failedToRecord'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>{t('deposits.title')}</Typography>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardHeader title={t('deposits.recordDeposit')} titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 0 }} />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select label={t('common.user')} value={form.userId} required
                  onChange={handleField('userId')} sx={{ minWidth: 200 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                </TextField>
                <TextField
                  label={t('common.amount')} value={form.amount} type="number" required
                  slotProps={{ htmlInput: { min: 0.01, step: 'any' } }}
                  onChange={handleField('amount')} sx={{ flex: 1 }}
                />
                <DatePicker
                  label={t('common.date')}
                  value={form.date ? dayjs(form.date) : null}
                  onChange={(newVal) => setForm(f => ({ ...f, date: newVal ? newVal.format('YYYY-MM-DD') : '' }))}
                  slotProps={{ textField: { size: 'small', required: true, sx: { flex: 1 } } }}
                />
                <TextField
                  label={t('deposits.noteOptional')} value={form.note}
                  onChange={handleField('note')} sx={{ flex: 2 }}
                />
              </Stack>
              <Box>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? <CircularProgress size={20} color="inherit" /> : t('deposits.recordDeposit')}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ mb: 2 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              select label={t('common.user')} value={filters.userId} size="small" sx={{ minWidth: 180 }}
              onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
            >
              <MenuItem value="">{t('deposits.allUsers')}</MenuItem>
              {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
            </TextField>
            <DatePicker
              label={t('common.from')}
              value={filters.startDate ? dayjs(filters.startDate) : null}
              onChange={(newVal) => setFilters(f => ({ ...f, startDate: newVal ? newVal.format('YYYY-MM-DD') : '' }))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label={t('common.to')}
              value={filters.endDate ? dayjs(filters.endDate) : null}
              onChange={(newVal) => setFilters(f => ({ ...f, endDate: newVal ? newVal.format('YYYY-MM-DD') : '' }))}
              slotProps={{ textField: { size: 'small' } }}
            />
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
                <TableCell>{t('common.date')}</TableCell>
                <TableCell>{t('common.user')}</TableCell>
                <TableCell align="right">{t('common.amount')}</TableCell>
                <TableCell>{t('common.note')}</TableCell>
                <TableCell>{t('deposits.recordedBy')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {t('deposits.noDeposits')}
                  </TableCell>
                </TableRow>
              ) : deposits.map(d => (
                <TableRow key={d._id} hover>
                  <TableCell>{format(new Date(d.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>{d.userId?.name ?? '—'}</TableCell>
                  <TableCell align="right">৳{d.amount.toFixed(2)}</TableCell>
                  <TableCell>{d.note ?? '—'}</TableCell>
                  <TableCell>{d.recordedBy?.name ?? '—'}</TableCell>
                </TableRow>
              ))}
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
