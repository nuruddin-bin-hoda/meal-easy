import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Chip, CircularProgress,
  Container, IconButton, Snackbar, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography, useTheme,
} from '@mui/material';
import { getBadge } from '../utils/badgeStyles';
import { DatePicker } from '@mui/x-date-pickers';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTopbar } from '../context/TopbarContext';

const currentMonth = () => format(new Date(), 'yyyy-MM');
const EMPTY_FORM = { billingMonth: currentMonth(), description: '', amount: '' };

export default function OtherCostsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const mode = theme.palette.mode;
  const { setTopbar } = useTopbar();

  useEffect(() => {
    setTopbar({ title: t('nav.costs'), subtitle: 'Admin' });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [viewMonth, setViewMonth] = useState(currentMonth());
  const [costs, setCosts] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const loadData = useCallback(async () => {
    if (!/^\d{4}-\d{2}$/.test(viewMonth)) return;
    setLoading(true);
    try {
      const [costsRes, cycleRes] = await Promise.allSettled([
        api.get(`/costs?billingMonth=${viewMonth}`),
        api.get(`/billing/${viewMonth}`),
      ]);
      setCosts(costsRes.status === 'fulfilled' ? (costsRes.value.data.costs ?? []) : []);
      setIsLocked(
        cycleRes.status === 'fulfilled' ? !!cycleRes.value.data.billingCycle?.isLocked : false,
      );
    } catch {
      notify(t('costs.failedToLoad'), 'error');
    } finally {
      setLoading(false);
    }
  }, [viewMonth, t]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/costs', {
        billingMonth: form.billingMonth,
        description: form.description,
        amount: Number(form.amount),
      });
      setForm(EMPTY_FORM);
      notify(t('costs.recorded'));
      if (form.billingMonth === viewMonth) loadData();
    } catch (err) {
      notify(err.response?.data?.message ?? t('costs.failedToRecord'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/costs/${id}`);
      notify(t('costs.deleted'));
      loadData();
    } catch (err) {
      notify(err.response?.data?.message ?? t('costs.failedToDelete'), 'error');
    } finally {
      setDeleting(null);
    }
  };

  const monthTotal = costs.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>{t('costs.title')}</Typography>

      {isAdmin && <Card elevation={2} sx={{ mb: 3 }}>
        <CardHeader title={t('costs.recordCost')} titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 0 }} />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <DatePicker
                  label={t('costs.billingMonth')}
                  views={['year', 'month']}
                  openTo="month"
                  value={form.billingMonth ? dayjs(form.billingMonth + '-01') : null}
                  onChange={(newVal) => setForm(f => ({ ...f, billingMonth: newVal ? newVal.format('YYYY-MM') : '' }))}
                  slotProps={{ textField: { size: 'small', required: true, sx: { width: 160 } } }}
                />
                <TextField
                  label={t('costs.description')} value={form.description} required
                  onChange={handleField('description')} sx={{ flex: 1 }}
                />
                <TextField
                  label={t('costs.amount')} value={form.amount} type="number" required
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onChange={handleField('amount')} sx={{ width: 140 }}
                />
              </Stack>
              <Box>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? <CircularProgress size={20} color="inherit" /> : t('costs.addCost')}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>}

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <DatePicker
          label={t('costs.viewMonth')}
          views={['year', 'month']}
          openTo="month"
          value={viewMonth ? dayjs(viewMonth + '-01') : null}
          onChange={(newVal) => setViewMonth(newVal ? newVal.format('YYYY-MM') : '')}
          slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
        />
        {isLocked && <Chip label={t('costs.billingLocked')} size="small" sx={getBadge('warning', mode)} />}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      ) : (
        <Card elevation={2}>
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
          <Table size="small" sx={{ minWidth: 400 }}>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                <TableCell>{t('costs.description')}</TableCell>
                <TableCell align="right">{t('costs.amount')}</TableCell>
                {isAdmin && <TableCell align="center" sx={{ width: 64 }}>{t('common.delete')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {costs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 3 : 2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {t('costs.noCosts', { month: viewMonth })}
                  </TableCell>
                </TableRow>
              ) : costs.map(c => (
                <TableRow key={c._id} hover>
                  <TableCell>{c.description}</TableCell>
                  <TableCell align="right">৳{c.amount.toFixed(2)}</TableCell>
                  {isAdmin && <TableCell align="center">
                    <IconButton
                      size="small" color="error"
                      disabled={isLocked || deleting === c._id}
                      onClick={() => handleDelete(c._id)}
                    >
                      {deleting === c._id
                        ? <CircularProgress size={16} />
                        : <DeleteIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>}
                </TableRow>
              ))}
              {costs.length > 0 && (
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>
                    {t('costs.monthTotal')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>
                    ৳{monthTotal.toFixed(2)}
                  </TableCell>
                  {isAdmin && <TableCell sx={{ borderTop: 2, borderColor: 'divider' }} />}
                </TableRow>
              )}
            </TableBody>
          </Table>
          </Box>
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
