import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Card, CardContent, CardHeader, CircularProgress,
  Container, MenuItem, Snackbar, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const today = () => format(new Date(), 'yyyy-MM-dd');
const EMPTY_FORM = { buyerUserId: '', item: '', quantity: '', unit: '', price: '', date: today() };

export default function PurchasesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
      notify('Failed to load purchases', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
      notify('Purchase recorded');
      loadPurchases();
    } catch (err) {
      notify(err.response?.data?.message ?? 'Failed to record purchase', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTotal = purchases.reduce((sum, p) => sum + p.price, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Purchases</Typography>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardHeader title="Record Purchase" titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 0 }} />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select label="Buyer" value={form.buyerUserId} required
                  onChange={handleField('buyerUserId')} sx={{ minWidth: 200 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                </TextField>
                <TextField
                  label="Item" value={form.item} required
                  onChange={handleField('item')} sx={{ flex: 1 }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Quantity" value={form.quantity} type="number"
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onChange={handleField('quantity')} sx={{ flex: 1 }}
                />
                <TextField
                  label="Unit" value={form.unit}
                  onChange={handleField('unit')} sx={{ flex: 1 }}
                />
                <TextField
                  label="Price" value={form.price} type="number" required
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onChange={handleField('price')} sx={{ flex: 1 }}
                />
                <TextField
                  label="Date" type="date" value={form.date} required
                  onChange={handleField('date')}
                  slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }}
                />
              </Stack>
              <Box>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? <CircularProgress size={20} color="inherit" /> : 'Record Purchase'}
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
              label="From" type="date" value={filters.startDate} size="small"
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="To" type="date" value={filters.endDate} size="small"
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select label="Buyer" value={filters.buyerUserId} size="small" sx={{ minWidth: 160 }}
              onChange={e => setFilters(f => ({ ...f, buyerUserId: e.target.value }))}
            >
              <MenuItem value="">All buyers</MenuItem>
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
                <TableCell>Date</TableCell>
                <TableCell>Buyer</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="right">Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No purchases found
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
                    Total
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
