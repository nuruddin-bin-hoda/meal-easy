import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Chip, CircularProgress,
  Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  MenuItem, Snackbar, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const currentMonth = () => format(new Date(), 'yyyy-MM');
const today = () => format(new Date(), 'yyyy-MM-dd');

export default function ChefProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [chef, setChef] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [salaryOpen, setSalaryOpen] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ billingMonth: currentMonth(), salaryAmount: '', paidStatus: 'unpaid' });
  const [salarySubmitting, setSalarySubmitting] = useState(false);

  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusForm, setBonusForm] = useState({ amount: '', date: today(), reason: '' });
  const [bonusSubmitting, setBonusSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [chefRes, historyRes] = await Promise.all([
          api.get(`/chefs/${id}`),
          api.get(`/chefs/${id}/salary`),
        ]);
        setChef(chefRes.data);
        setSalaries(historyRes.data.salaries ?? []);
        setBonuses(historyRes.data.bonuses ?? []);
      } catch {
        notify('Failed to load chef data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const openEdit = () => {
    setEditForm({
      name: chef.name ?? '',
      phone: chef.phone ?? '',
      joinDate: chef.joinDate ? format(new Date(chef.joinDate), 'yyyy-MM-dd') : '',
      salaryAmount: chef.salaryAmount ?? '',
      isActive: chef.isActive,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const res = await api.patch(`/chefs/${id}`, {
        name: editForm.name,
        phone: editForm.phone,
        joinDate: editForm.joinDate,
        salaryAmount: Number(editForm.salaryAmount),
        isActive: editForm.isActive,
      });
      setChef(res.data);
      setEditOpen(false);
      notify('Profile updated');
    } catch (err) {
      notify(err.response?.data?.message ?? 'Failed to update profile', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    setSalarySubmitting(true);
    try {
      const res = await api.post(`/chefs/${id}/salary`, {
        billingMonth: salaryForm.billingMonth,
        salaryAmount: Number(salaryForm.salaryAmount),
        paidStatus: salaryForm.paidStatus,
      });
      setSalaries(prev => {
        const idx = prev.findIndex(s => s.billingMonth === res.data.billingMonth);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = res.data;
          return next;
        }
        return [res.data, ...prev];
      });
      setSalaryOpen(false);
      notify('Salary recorded');
    } catch (err) {
      notify(err.response?.data?.message ?? 'Failed to record salary', 'error');
    } finally {
      setSalarySubmitting(false);
    }
  };

  const handleBonusSubmit = async (e) => {
    e.preventDefault();
    setBonusSubmitting(true);
    try {
      const res = await api.post(`/chefs/${id}/bonus`, {
        amount: Number(bonusForm.amount),
        date: bonusForm.date,
        reason: bonusForm.reason,
      });
      setBonuses(prev => [res.data, ...prev]);
      setBonusForm({ amount: '', date: today(), reason: '' });
      setBonusOpen(false);
      notify('Bonus recorded');
    } catch (err) {
      notify(err.response?.data?.message ?? 'Failed to record bonus', 'error');
    } finally {
      setBonusSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chef) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error">Chef not found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/chefs')} sx={{ mb: 2 }}>
        Back to Chefs
      </Button>

      {/* Chef details */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardHeader
          title={chef.name}
          subheader={`@${chef.loginUsername}`}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={chef.isActive ? 'Active' : 'Inactive'}
                color={chef.isActive ? 'success' : 'default'}
                size="small"
              />
              <Button variant="outlined" size="small" onClick={openEdit}>
                Edit Profile
              </Button>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">Phone</Typography>
              <Typography>{chef.phone ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Join Date</Typography>
              <Typography>
                {chef.joinDate ? format(new Date(chef.joinDate), 'dd MMM yyyy') : '—'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Monthly Salary</Typography>
              <Typography fontWeight={600}>
                {chef.salaryAmount != null ? `৳${chef.salaryAmount.toLocaleString()}` : '—'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Salary history */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardHeader
          title="Salary History"
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Button variant="contained" size="small" onClick={() => {
              setSalaryForm({ billingMonth: currentMonth(), salaryAmount: chef.salaryAmount ?? '', paidStatus: 'unpaid' });
              setSalaryOpen(true);
            }}>
              Record Salary
            </Button>
          }
        />
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
              <TableCell>Month</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Paid At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No salary records
                </TableCell>
              </TableRow>
            ) : salaries.map(s => (
              <TableRow key={s._id} hover>
                <TableCell>{s.billingMonth}</TableCell>
                <TableCell align="right">৳{s.salaryAmount?.toLocaleString()}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={s.paidStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    color={s.paidStatus === 'paid' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {s.paidAt ? format(new Date(s.paidAt), 'dd MMM yyyy') : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Bonus history */}
      <Card elevation={2}>
        <CardHeader
          title="Bonus History"
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Button variant="contained" size="small" color="secondary" onClick={() => {
              setBonusForm({ amount: '', date: today(), reason: '' });
              setBonusOpen(true);
            }}>
              Add Bonus
            </Button>
          }
        />
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
              <TableCell>Date</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bonuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No bonus records
                </TableCell>
              </TableRow>
            ) : bonuses.map(b => (
              <TableRow key={b._id} hover>
                <TableCell>{format(new Date(b.date), 'dd MMM yyyy')}</TableCell>
                <TableCell align="right">৳{b.amount?.toLocaleString()}</TableCell>
                <TableCell>{b.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Name" value={editForm.name ?? ''} required
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Phone" value={editForm.phone ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Join Date" type="date" value={editForm.joinDate ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, joinDate: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }}
                />
                <TextField
                  label="Salary Amount" value={editForm.salaryAmount ?? ''} type="number"
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onChange={e => setEditForm(f => ({ ...f, salaryAmount: e.target.value }))}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <TextField
                select label="Status" value={editForm.isActive ?? true}
                onChange={e => setEditForm(f => ({ ...f, isActive: e.target.value === 'true' }))}
                fullWidth
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={editSubmitting}>
              {editSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Record salary dialog */}
      <Dialog open={salaryOpen} onClose={() => setSalaryOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Salary</DialogTitle>
        <Box component="form" onSubmit={handleSalarySubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField
                label="Billing Month" value={salaryForm.billingMonth} required
                onChange={e => setSalaryForm(f => ({ ...f, billingMonth: e.target.value }))}
                placeholder="YYYY-MM" slotProps={{ inputLabel: { shrink: true } }} fullWidth
              />
              <TextField
                label="Amount" value={salaryForm.salaryAmount} type="number" required
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                onChange={e => setSalaryForm(f => ({ ...f, salaryAmount: e.target.value }))}
                fullWidth
              />
              <TextField
                select label="Status" value={salaryForm.paidStatus}
                onChange={e => setSalaryForm(f => ({ ...f, paidStatus: e.target.value }))}
                fullWidth
              >
                <MenuItem value="unpaid">Unpaid</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSalaryOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={salarySubmitting}>
              {salarySubmitting ? <CircularProgress size={20} color="inherit" /> : 'Record'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Add bonus dialog */}
      <Dialog open={bonusOpen} onClose={() => setBonusOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Bonus</DialogTitle>
        <Box component="form" onSubmit={handleBonusSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField
                label="Amount" value={bonusForm.amount} type="number" required autoFocus
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                onChange={e => setBonusForm(f => ({ ...f, amount: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Date" type="date" value={bonusForm.date} required
                onChange={e => setBonusForm(f => ({ ...f, date: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }} fullWidth
              />
              <TextField
                label="Reason" value={bonusForm.reason} required multiline rows={2}
                onChange={e => setBonusForm(f => ({ ...f, reason: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBonusOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={bonusSubmitting}>
              {bonusSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Add Bonus'}
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
