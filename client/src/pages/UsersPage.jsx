import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Chip, CircularProgress, Container,
  Paper, Snackbar, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography, MenuItem, useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useTopbar } from '../context/TopbarContext';

// Exact semantic colors per spec
const STATUS_CHIP = {
  active:   { bg: '#EAF3DE', color: '#27500A' },
  pending:  { bg: '#FAEEDA', color: '#633806' },
  blocked:  { bg: '#FCEBEB', color: '#791F1F' },
  rejected: { bg: '#f3f4f6', color: '#6b7280' },
};

const MEAL_BLOCKED_CHIP = { bg: '#FCEBEB', color: '#791F1F' };

function StatusChip({ status }) {
  const style = STATUS_CHIP[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        bgcolor: style.bg, color: style.color,
        fontWeight: 600, fontSize: 11, textTransform: 'capitalize',
        border: 'none',
      }}
    />
  );
}

const FILTER_OPTIONS = [
  { value: '',         label: 'All' },
  { value: 'active',   label: 'Active' },
  { value: 'pending',  label: 'Pending' },
  { value: 'mealBlocked', label: 'Meal Blocked' },
  { value: 'rejected', label: 'Rejected' },
];

export default function UsersPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const tok = theme.tokens;
  const { setTopbar } = useTopbar();

  useEffect(() => {
    setTopbar({ title: t('nav.users') });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');
  const [snackbar, setSnackbar]   = useState({ open: false, message: '', severity: 'success' });
  const [actionLoading, setActionLoading] = useState(null); // userId being acted on

  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (statusFilter === 'mealBlocked') {
        // No server-side filter for mealBlocked — fetch active users and filter client-side
        params.set('status', 'active');
        const res = await api.get(`/users?${params}`);
        setUsers((res.data.users ?? []).filter((u) => u.mealBlocked));
      } else {
        // Empty statusFilter = "All" — omit status param so server returns all non-deleted
        if (statusFilter) params.set('status', statusFilter);
        const res = await api.get(`/users?${params}`);
        setUsers(res.data.users ?? []);
      }
    } catch {
      notify('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleAction = async (userId, action) => {
    setActionLoading(userId);
    try {
      if (action === 'approve') {
        await api.patch(`/users/${userId}/approve`);
        notify('User approved');
      } else if (action === 'reject') {
        await api.patch(`/users/${userId}/reject`);
        notify('User rejected');
      } else if (action === 'mealBlock') {
        await api.patch(`/users/${userId}/meal-block`, { blocked: true });
        notify('Meals blocked');
      } else if (action === 'mealUnblock') {
        await api.patch(`/users/${userId}/meal-block`, { blocked: false });
        notify('Meals unblocked');
      }
      loadUsers();
    } catch (err) {
      notify(err.response?.data?.message ?? 'Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header row */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={700} color={tok.ink}>
          {t('nav.users')}
        </Typography>
        <TextField
          select size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          label="Filter by status"
          sx={{ minWidth: 160 }}
        >
          {FILTER_OPTIONS.map(({ value, label }) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${tok.hairline}`, borderRadius: '10px' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: tok.soft }}>
                <TableCell sx={{ fontWeight: 600, color: tok.muted, fontSize: 12 }}>{t('common.name')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: tok.muted, fontSize: 12 }}>{t('common.phone')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: tok.muted, fontSize: 12, display: { xs: 'none', md: 'table-cell' } }}>Room</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: tok.muted, fontSize: 12 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: tok.muted, fontSize: 12, display: { xs: 'none', sm: 'table-cell' } }}>Joined</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: tok.muted, fontSize: 12 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: tok.muted }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : users.map((u) => {
                const busy = actionLoading === u._id;
                return (
                  <TableRow key={u._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 500, color: tok.ink }}>{u.name}</TableCell>
                    <TableCell sx={{ color: tok.muted, fontSize: 13 }}>{u.phone}</TableCell>
                    <TableCell sx={{ color: tok.muted, fontSize: 13, display: { xs: 'none', md: 'table-cell' } }}>{u.roomNumber || '—'}</TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <StatusChip status={u.status} />
                        {u.mealBlocked && (
                          <Chip
                            label="Meals blocked"
                            size="small"
                            sx={{ bgcolor: MEAL_BLOCKED_CHIP.bg, color: MEAL_BLOCKED_CHIP.color, fontWeight: 600, fontSize: 10, border: 'none' }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ color: tok.muted, fontSize: 13, display: { xs: 'none', sm: 'table-cell' } }}>
                      {format(new Date(u.createdAt), 'dd MMM yyyy')}
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.75} justifyContent="flex-end" flexWrap="wrap">
                        {/* Approve / Reject — pending only */}
                        {u.status === 'pending' && (
                          <>
                            <Button
                              size="small" variant="contained" color="success"
                              disabled={busy}
                              onClick={() => handleAction(u._id, 'approve')}
                              sx={{ fontSize: 12, py: '3px' }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small" variant="outlined" color="error"
                              disabled={busy}
                              onClick={() => handleAction(u._id, 'reject')}
                              sx={{ fontSize: 12, py: '3px' }}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {/* Block / Unblock meals — active users only, not superadmin */}
                        {u.status === 'active' && u.role !== 'superadmin' && !u.mealBlocked && (
                          <Button
                            size="small" variant="outlined" color="warning"
                            disabled={busy}
                            onClick={() => handleAction(u._id, 'mealBlock')}
                            sx={{ fontSize: 12, py: '3px' }}
                          >
                            Block meals
                          </Button>
                        )}
                        {u.status === 'active' && u.role !== 'superadmin' && u.mealBlocked && (
                          <Button
                            size="small" variant="outlined" color="success"
                            disabled={busy}
                            onClick={() => handleAction(u._id, 'mealUnblock')}
                            sx={{ fontSize: 12, py: '3px' }}
                          >
                            Unblock meals
                          </Button>
                        )}

                        {busy && <CircularProgress size={18} sx={{ alignSelf: 'center' }} />}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
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
