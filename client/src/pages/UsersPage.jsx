import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Container,
  Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography, MenuItem, Snackbar, useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { getBadge } from '../utils/badgeStyles';
import { useTopbar } from '../context/TopbarContext';

const STATUS_TYPE = {
  active:   'success',
  pending:  'warning',
  blocked:  'error',
  deleted:  'warning',
  rejected: 'error',
};

export default function UsersPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const mode = theme.palette.mode;
  const { setTopbar } = useTopbar();

  useEffect(() => {
    setTopbar({ title: t('nav.users') });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users?status=${statusFilter}&limit=200`);
      setUsers(res.data.users ?? []);
    } catch {
      notify('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleAction = async (userId, action) => {
    try {
      if (action === 'rejected') {
        await api.patch(`/users/${userId}/reject`);
      } else if (action === 'active') {
        await api.patch(`/users/${userId}/approve`);
      } else if (action === 'blocked') {
        await api.patch(`/users/${userId}/meal-block`, { blocked: true });
      } else if (action === 'unblocked') {
        await api.patch(`/users/${userId}/meal-block`, { blocked: false });
      }
      notify(`User ${action}`);
      loadUsers();
    } catch (err) {
      notify(err.response?.data?.message ?? 'Action failed', 'error');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('nav.users')}</Typography>
        <TextField
          select size="small" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
          label={t('common.status')}
        >
          {['active', 'pending', 'blocked', 'rejected'].map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : (
        <Card elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('common.name')}</TableCell>
                <TableCell>{t('common.phone')}</TableCell>
                <TableCell>{t('common.room')}</TableCell>
                <TableCell align="center">{t('common.status')}</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : users.map((u) => (
                <TableRow key={u._id} hover>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>{u.roomNumber}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={u.status}
                      size="small"
                      sx={{ ...getBadge(STATUS_TYPE[u.status] ?? 'info', mode), textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>{format(new Date(u.createdAt), 'dd MMM yyyy')}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {u.status === 'pending' && (
                        <>
                          <Button size="small" variant="contained" color="success" onClick={() => handleAction(u._id, 'active')}>
                            Approve
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleAction(u._id, 'rejected')}>
                            Reject
                          </Button>
                        </>
                      )}
                      {u.status === 'active' && u.role !== 'superadmin' && (
                        <Button size="small" variant="outlined" color="warning" onClick={() => handleAction(u._id, 'blocked')}>
                          Block
                        </Button>
                      )}
                      {u.status === 'blocked' && u.role !== 'superadmin' && (
                        <Button size="small" variant="outlined" color="success" onClick={() => handleAction(u._id, 'active')}>
                          Unblock
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

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
