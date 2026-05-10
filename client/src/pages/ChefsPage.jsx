import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Chip, CircularProgress, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, Snackbar, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const today = () => format(new Date(), 'yyyy-MM-dd');
const EMPTY_FORM = {
  name: '', phone: '', joinDate: today(), salaryAmount: '',
  loginUsername: '', loginPassword: '', photo: null,
};

export default function ChefsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    setLoading(true);
    api.get('/chefs')
      .then(res => setChefs(res.data.chefs ?? []))
      .catch(() => notify(t('chefs.failedToLoad'), 'error'))
      .finally(() => setLoading(false));
  }, [t]);

  const handleField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('phone', form.phone);
      fd.append('joinDate', form.joinDate);
      fd.append('salaryAmount', form.salaryAmount);
      fd.append('loginUsername', form.loginUsername);
      fd.append('loginPassword', form.loginPassword);
      if (form.photo) fd.append('photo', form.photo);

      const res = await api.post('/chefs', fd);
      setChefs(prev => [res.data.chef, ...prev]);
      setForm(EMPTY_FORM);
      setAddOpen(false);
      notify(t('chefs.chefAdded'));
    } catch (err) {
      notify(err.response?.data?.message ?? t('chefs.failedToAdd'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('chefs.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          {t('chefs.addChef')}
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>{t('common.phone')}</TableCell>
              <TableCell>{t('chefs.joinDate')}</TableCell>
              <TableCell align="right">{t('chefs.salary')}</TableCell>
              <TableCell align="center">{t('common.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chefs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {t('chefs.noChefs')}
                </TableCell>
              </TableRow>
            ) : chefs.map(chef => (
              <TableRow
                key={chef._id} hover
                onClick={() => navigate(`/admin/chefs/${chef._id}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{chef.name}</TableCell>
                <TableCell>{chef.phone ?? '—'}</TableCell>
                <TableCell>
                  {chef.joinDate ? format(new Date(chef.joinDate), 'dd MMM yyyy') : '—'}
                </TableCell>
                <TableCell align="right">
                  {chef.salaryAmount != null ? `৳${chef.salaryAmount.toLocaleString()}` : '—'}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={chef.isActive ? t('common.active') : t('common.inactive')}
                    color={chef.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('chefs.addChefTitle')}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <Stack direction="row" spacing={2}>
                <TextField label={t('common.name')} value={form.name} required autoFocus onChange={handleField('name')} sx={{ flex: 1 }} />
                <TextField label={t('common.phone')} value={form.phone} required onChange={handleField('phone')} sx={{ flex: 1 }} />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('chefs.joinDate')} type="date" value={form.joinDate} required
                  onChange={handleField('joinDate')}
                  slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }}
                />
                <TextField
                  label={t('chefs.salaryAmount')} value={form.salaryAmount} type="number" required
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onChange={handleField('salaryAmount')} sx={{ flex: 1 }}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('chefs.username')} value={form.loginUsername} required
                  onChange={handleField('loginUsername')} sx={{ flex: 1 }}
                />
                <TextField
                  label={t('auth.password')} value={form.loginPassword} type="password" required
                  onChange={handleField('loginPassword')} sx={{ flex: 1 }}
                  helperText={t('chefs.passwordHelper')}
                />
              </Stack>
              <Button variant="outlined" component="label" size="small" sx={{ alignSelf: 'flex-start' }}>
                {t('chefs.uploadPhoto')}
                <input
                  type="file" accept="image/*" hidden
                  onChange={e => setForm(f => ({ ...f, photo: e.target.files[0] ?? null }))}
                />
              </Button>
              {form.photo && (
                <Typography variant="caption" color="text.secondary">{form.photo.name}</Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={20} color="inherit" /> : t('chefs.addChef')}
            </Button>
          </DialogActions>
        </Box>
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
