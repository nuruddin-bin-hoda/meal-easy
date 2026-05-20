import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Chip, CircularProgress,
  Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  MenuItem, Snackbar, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography, useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getBadge } from '../utils/badgeStyles';
import { useTopbar } from '../context/TopbarContext';

const currentMonth = () => format(new Date(), 'yyyy-MM');
const today = () => format(new Date(), 'yyyy-MM-dd');

export default function ChefProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const mode = theme.palette.mode;
  const { setTopbar } = useTopbar();

  useEffect(() => {
    setTopbar({ title: t('nav.chefs') });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  const [chef, setChef] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

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
        notify(t('chefs.failedToLoad'), 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, t]);

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    setPwSubmitting(true);
    try {
      await api.patch(`/chefs/${id}/password`, { password: pwForm.newPassword });
      setPwOpen(false);
      setPwForm({ newPassword: '', confirmPassword: '' });
      notify('Password updated');
    } catch (err) {
      setPwError(err.response?.data?.message ?? 'Failed to update password.');
    } finally {
      setPwSubmitting(false);
    }
  };

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
      notify(t('chefs.profileUpdated'));
    } catch (err) {
      notify(err.response?.data?.message ?? t('chefs.failedToUpdateProfile'), 'error');
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
      notify(t('chefs.salaryRecorded'));
    } catch (err) {
      notify(err.response?.data?.message ?? t('chefs.failedToRecordSalary'), 'error');
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
      notify(t('chefs.bonusRecorded'));
    } catch (err) {
      notify(err.response?.data?.message ?? t('chefs.failedToRecordBonus'), 'error');
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
        <Alert severity="error">{t('chefs.chefNotFound')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/chefs')} sx={{ mb: 2 }}>
        {t('chefs.backToChefs')}
      </Button>

      {/* Chef details */}
      <Card elevation={0} sx={{ mb: 3 }}>
        <CardHeader
          title={chef.name}
          subheader={`@${chef.loginUsername}`}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={chef.isActive ? t('common.active') : t('common.inactive')}
                size="small"
                sx={getBadge(chef.isActive ? 'success' : 'warning', mode)}
              />
              <Button variant="outlined" size="small" onClick={openEdit}>
                {t('chefs.editProfile')}
              </Button>
              <Button variant="outlined" size="small" onClick={() => { setPwForm({ newPassword: '', confirmPassword: '' }); setPwError(''); setPwOpen(true); }}>
                Change Password
              </Button>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('common.phone')}</Typography>
              <Typography>{chef.phone ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('chefs.joinDate')}</Typography>
              <Typography>
                {chef.joinDate ? format(new Date(chef.joinDate), 'dd MMM yyyy') : '—'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('chefs.monthlySalary')}</Typography>
              <Typography fontWeight={600}>
                {chef.salaryAmount != null ? `৳${chef.salaryAmount.toLocaleString()}` : '—'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Salary history */}
      <Card elevation={0} sx={{ mb: 3 }}>
        <CardHeader
          title={t('chefs.salaryHistory')}
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Button variant="contained" size="small" onClick={() => {
              setSalaryForm({ billingMonth: currentMonth(), salaryAmount: chef.salaryAmount ?? '', paidStatus: 'unpaid' });
              setSalaryOpen(true);
            }}>
              {t('chefs.recordSalary')}
            </Button>
          }
        />
        <Divider />
        <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <Table size="small" sx={{ minWidth: 500 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.month')}</TableCell>
              <TableCell align="right">{t('common.amount')}</TableCell>
              <TableCell align="center">{t('common.status')}</TableCell>
              <TableCell>{t('chefs.paidAt')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  {t('chefs.noSalaryRecords')}
                </TableCell>
              </TableRow>
            ) : salaries.map(s => (
              <TableRow key={s._id} hover>
                <TableCell>{s.billingMonth}</TableCell>
                <TableCell align="right">৳{s.salaryAmount?.toLocaleString()}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={s.paidStatus === 'paid' ? t('common.paid') : t('common.unpaid')}
                    size="small"
                    sx={getBadge(s.paidStatus === 'paid' ? 'success' : 'warning', mode)}
                  />
                </TableCell>
                <TableCell>
                  {s.paidAt ? format(new Date(s.paidAt), 'dd MMM yyyy') : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>
      </Card>

      {/* Bonus history */}
      <Card elevation={0}>
        <CardHeader
          title={t('chefs.bonusHistory')}
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Button variant="contained" size="small" color="secondary" onClick={() => {
              setBonusForm({ amount: '', date: today(), reason: '' });
              setBonusOpen(true);
            }}>
              {t('chefs.addBonus')}
            </Button>
          }
        />
        <Divider />
        <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <Table size="small" sx={{ minWidth: 400 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.date')}</TableCell>
              <TableCell align="right">{t('common.amount')}</TableCell>
              <TableCell>{t('common.reason')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bonuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  {t('chefs.noBonus')}
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
        </Box>
      </Card>

      {/* Change password dialog */}
      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <Box component="form" onSubmit={handlePwSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              {pwError && <Alert severity="error">{pwError}</Alert>}
              <TextField
                label="New Password" type="password" value={pwForm.newPassword} required autoFocus
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Confirm Password" type="password" value={pwForm.confirmPassword} required
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPwOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={pwSubmitting}>
              {pwSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('chefs.editProfileTitle')}</DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('common.name')} value={editForm.name ?? ''} required
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label={t('common.phone')} value={editForm.phone ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <DatePicker
                  label={t('chefs.joinDate')}
                  value={editForm.joinDate ? dayjs(editForm.joinDate) : null}
                  onChange={(newVal) => setEditForm(f => ({ ...f, joinDate: newVal ? newVal.format('YYYY-MM-DD') : '' }))}
                  slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
                />
                <TextField
                  label={t('chefs.salaryAmount')} value={editForm.salaryAmount ?? ''} type="number"
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  onChange={e => setEditForm(f => ({ ...f, salaryAmount: e.target.value }))}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <TextField
                select label={t('common.status')} value={editForm.isActive ?? true}
                onChange={e => setEditForm(f => ({ ...f, isActive: e.target.value === 'true' }))}
                fullWidth
              >
                <MenuItem value="true">{t('common.active')}</MenuItem>
                <MenuItem value="false">{t('common.inactive')}</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={editSubmitting}>
              {editSubmitting ? <CircularProgress size={20} color="inherit" /> : t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Record salary dialog */}
      <Dialog open={salaryOpen} onClose={() => setSalaryOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('chefs.recordSalaryTitle')}</DialogTitle>
        <Box component="form" onSubmit={handleSalarySubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <DatePicker
                label={t('chefs.billingMonth')}
                views={['year', 'month']}
                openTo="month"
                value={salaryForm.billingMonth ? dayjs(salaryForm.billingMonth + '-01') : null}
                onChange={(newVal) => setSalaryForm(f => ({ ...f, billingMonth: newVal ? newVal.format('YYYY-MM') : '' }))}
                slotProps={{ textField: { size: 'small', required: true, fullWidth: true } }}
              />
              <TextField
                label={t('common.amount')} value={salaryForm.salaryAmount} type="number" required
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                onChange={e => setSalaryForm(f => ({ ...f, salaryAmount: e.target.value }))}
                fullWidth
              />
              <TextField
                select label={t('common.status')} value={salaryForm.paidStatus}
                onChange={e => setSalaryForm(f => ({ ...f, paidStatus: e.target.value }))}
                fullWidth
              >
                <MenuItem value="unpaid">{t('common.unpaid')}</MenuItem>
                <MenuItem value="paid">{t('common.paid')}</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSalaryOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={salarySubmitting}>
              {salarySubmitting ? <CircularProgress size={20} color="inherit" /> : t('common.record')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Add bonus dialog */}
      <Dialog open={bonusOpen} onClose={() => setBonusOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('chefs.addBonusTitle')}</DialogTitle>
        <Box component="form" onSubmit={handleBonusSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField
                label={t('common.amount')} value={bonusForm.amount} type="number" required autoFocus
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                onChange={e => setBonusForm(f => ({ ...f, amount: e.target.value }))}
                fullWidth
              />
              <DatePicker
                label={t('common.date')}
                value={bonusForm.date ? dayjs(bonusForm.date) : null}
                onChange={(newVal) => setBonusForm(f => ({ ...f, date: newVal ? newVal.format('YYYY-MM-DD') : '' }))}
                slotProps={{ textField: { size: 'small', required: true, fullWidth: true } }}
              />
              <TextField
                label={t('common.reason')} value={bonusForm.reason} required multiline rows={2}
                onChange={e => setBonusForm(f => ({ ...f, reason: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBonusOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={bonusSubmitting}>
              {bonusSubmitting ? <CircularProgress size={20} color="inherit" /> : t('chefs.addBonus')}
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
