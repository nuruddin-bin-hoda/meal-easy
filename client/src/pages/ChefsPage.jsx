import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Chip, CircularProgress, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, Snackbar, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
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
      .catch(() => notify('Failed to load chefs', 'error'))
      .finally(() => setLoading(false));
  }, []);

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
      notify('Chef added');
    } catch (err) {
      notify(err.response?.data?.message ?? 'Failed to add chef', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Chefs</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add Chef
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Join Date</TableCell>
              <TableCell align="right">Salary</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chefs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No chefs found
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
                    label={chef.isActive ? 'Active' : 'Inactive'}
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
        <DialogTitle>Add Chef</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <Stack direction="row" spacing={2}>
                <TextField label="Name" value={form.name} required autoFocus onChange={handleField('name')} sx={{ flex: 1 }} />
                <TextField label="Phone" value={form.phone} required onChange={handleField('phone')} sx={{ flex: 1 }} />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Join Date" type="date" value={form.joinDate} required
                  onChange={handleField('joinDate')}
                  slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }}
                />
                <TextField
                  label="Salary Amount" value={form.salaryAmount} type="number" required
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onChange={handleField('salaryAmount')} sx={{ flex: 1 }}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Username" value={form.loginUsername} required
                  onChange={handleField('loginUsername')} sx={{ flex: 1 }}
                />
                <TextField
                  label="Password" value={form.loginPassword} type="password" required
                  onChange={handleField('loginPassword')} sx={{ flex: 1 }}
                  helperText="Min 6 characters"
                />
              </Stack>
              <Button variant="outlined" component="label" size="small" sx={{ alignSelf: 'flex-start' }}>
                Upload Photo
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
            <Button onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={20} color="inherit" /> : 'Add Chef'}
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
