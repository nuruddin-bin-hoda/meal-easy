import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Alert, Box, Button, CircularProgress, Container, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Snackbar, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTopbar } from '../context/TopbarContext';
import { getBadge } from '../utils/badgeStyles';

const EMPTY_FORM = { name: '', phone: '', password: '', roomNumber: '' };

export default function AdminsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const tok = theme.tokens;
  const mode = theme.palette.mode;
  const { setTopbar } = useTopbar();

  useEffect(() => {
    if (user && user.role !== 'superadmin') navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    setTopbar({ title: t('nav.admins') });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  const [admins, setAdmins] = useState([]);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [confirmDowngrade, setConfirmDowngrade] = useState(null); // user object
  const [confirmPromote, setConfirmPromote]     = useState(null); // user object
  const [actioning, setActioning] = useState(null); // userId

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    Promise.all([
      api.get('/admins'),
      api.get('/users?status=active&limit=200'),
    ]).then(([adminRes, userRes]) => {
      setAdmins(adminRes.data.admins ?? []);
      setUsers((userRes.data.users ?? []).filter((u) => u.role === 'user'));
    }).catch(() => notify('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', form.name.trim());
      data.append('phone', form.phone.trim());
      data.append('password', form.password);
      if (form.roomNumber) data.append('roomNumber', form.roomNumber.trim());
      await api.post('/admins', data);
      const res = await api.get('/admins');
      setAdmins(res.data.admins ?? []);
      setAddOpen(false);
      setForm(EMPTY_FORM);
      notify('Admin created successfully');
    } catch (err) {
      notify(err.response?.data?.message ?? 'Failed to create admin', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDowngrade = async () => {
    if (!confirmDowngrade) return;
    const target = confirmDowngrade;
    setConfirmDowngrade(null);
    setActioning(target._id);
    try {
      const res = await api.patch(`/admins/${target._id}/downgrade`);
      if (res.data.roleChanged && target._id === user?._id) {
        await logout();
        navigate('/login', { replace: true, state: { message: 'Your role has changed. Please log in again.' } });
        return;
      }
      setAdmins((prev) => prev.filter((a) => a._id !== target._id));
      setUsers((prev) => [...prev, res.data.user]);
      notify('Admin downgraded to user');
    } catch (err) {
      notify(err.response?.data?.message ?? 'Failed to downgrade admin', 'error');
    } finally {
      setActioning(null);
    }
  };

  const handlePromote = async () => {
    if (!confirmPromote) return;
    const target = confirmPromote;
    setConfirmPromote(null);
    setActioning(target._id);
    try {
      const res = await api.patch(`/admins/${target._id}/promote`);
      if (res.data.roleChanged && target._id === user?._id) {
        await logout();
        navigate('/login', { replace: true, state: { message: 'Your role has changed. Please log in again.' } });
        return;
      }
      setUsers((prev) => prev.filter((u) => u._id !== target._id));
      setAdmins((prev) => [res.data.user, ...prev]);
      notify('User promoted to admin');
    } catch (err) {
      notify(err.response?.data?.message ?? 'Failed to promote user', 'error');
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const scrollBox = { overflowX: 'auto', width: '100%' };
  const tableSx   = { minWidth: 600 };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>

      {/* ── Current Admins ─────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={500} color={tok.ink}>
          {t('nav.admins')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add Admin
        </Button>
      </Box>

      <Box sx={{ ...scrollBox, mb: 4 }}>
        <Table size="small" sx={tableSx}>
          <TableHead>
            <TableRow sx={{ bgcolor: tok.soft }}>
              {['Name', 'Phone', 'Room', 'Joined', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 600, color: tok.muted, fontSize: 12 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: tok.muted }}>No admins found</TableCell>
              </TableRow>
            ) : admins.map((a) => (
              <TableRow key={a._id} hover>
                <TableCell sx={{ fontWeight: 500, color: tok.ink }}>{a.name}</TableCell>
                <TableCell sx={{ color: tok.muted }}>{a.phone}</TableCell>
                <TableCell sx={{ color: tok.muted }}>{a.roomNumber || '—'}</TableCell>
                <TableCell sx={{ color: tok.muted }}>{format(new Date(a.createdAt), 'dd MMM yyyy')}</TableCell>
                <TableCell>
                  <Button
                    size="small" variant="outlined" color="warning"
                    disabled={actioning === a._id}
                    onClick={() => setConfirmDowngrade(a)}
                  >
                    Downgrade to User
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* ── Promote a User ─────────────────────────────────────────────────── */}
      <Typography variant="h6" fontWeight={500} color={tok.ink} sx={{ mb: 2 }}>
        Promote User to Admin
      </Typography>

      <Box sx={scrollBox}>
        <Table size="small" sx={tableSx}>
          <TableHead>
            <TableRow sx={{ bgcolor: tok.soft }}>
              {['Name', 'Phone', 'Room', 'Status', 'Action'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 600, color: tok.muted, fontSize: 12 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: tok.muted }}>No eligible users</TableCell>
              </TableRow>
            ) : users.map((u) => (
              <TableRow key={u._id} hover>
                <TableCell sx={{ fontWeight: 500, color: tok.ink }}>{u.name}</TableCell>
                <TableCell sx={{ color: tok.muted }}>{u.phone}</TableCell>
                <TableCell sx={{ color: tok.muted }}>{u.roomNumber || '—'}</TableCell>
                <TableCell>
                  <Box component="span" sx={{ ...getBadge('success', mode), px: '8px', py: '2px', borderRadius: '999px', fontSize: 11, textTransform: 'capitalize' }}>
                    {u.status}
                  </Box>
                </TableCell>
                <TableCell>
                  <Button
                    size="small" variant="outlined" color="primary"
                    disabled={actioning === u._id}
                    onClick={() => setConfirmPromote(u)}
                  >
                    Promote to Admin
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* ── Add Admin Dialog ───────────────────────────────────────────────── */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setForm(EMPTY_FORM); }} maxWidth="xs" fullWidth>
        <DialogTitle>Add Admin</DialogTitle>
        <Box component="form" onSubmit={handleAddAdmin}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField label="Name" value={form.name} required autoFocus
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
              <TextField label="Phone" value={form.phone} required
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} fullWidth />
              <TextField label="Password" type="password" value={form.password} required
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                fullWidth inputProps={{ minLength: 6 }} helperText="Min. 6 characters" />
              <TextField label="Room Number (optional)" value={form.roomNumber}
                onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={20} color="inherit" /> : 'Create Admin'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ── Downgrade Confirm Dialog ───────────────────────────────────────── */}
      <Dialog open={!!confirmDowngrade} onClose={() => setConfirmDowngrade(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Downgrade Admin</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Downgrade <strong>{confirmDowngrade?.name}</strong> from Admin to regular User? They will lose all admin access.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDowngrade(null)}>{t('common.cancel')}</Button>
          <Button color="warning" variant="contained" onClick={handleDowngrade}>Downgrade</Button>
        </DialogActions>
      </Dialog>

      {/* ── Promote Confirm Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!confirmPromote} onClose={() => setConfirmPromote(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Promote to Admin</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Promote <strong>{confirmPromote?.name}</strong> to Admin? They will gain full admin access to the mess.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPromote(null)}>{t('common.cancel')}</Button>
          <Button color="primary" variant="contained" onClick={handlePromote}>Promote</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
