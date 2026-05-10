import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Container, Dialog, DialogContent, DialogTitle, Divider, IconButton,
  MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['admin', 'superadmin'];

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'PURCHASE_CREATED', label: 'Purchase Created' },
  { value: 'PURCHASE_DELETED', label: 'Purchase Deleted' },
  { value: 'DEPOSIT_RECORDED', label: 'Deposit Recorded' },
  { value: 'MEAL_TOGGLED', label: 'Meal Toggled' },
  { value: 'BILLING_SUBMITTED', label: 'Billing Submitted' },
  { value: 'USER_APPROVED', label: 'User Approved' },
  { value: 'USER_REJECTED', label: 'User Rejected' },
  { value: 'USER_BLOCKED', label: 'User Blocked' },
  { value: 'USER_UNBLOCKED', label: 'User Unblocked' },
  { value: 'STOCK_UPDATE', label: 'Stock Update' },
  { value: 'MENU_UPDATED', label: 'Menu Updated' },
  { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
  { value: 'SALARY_RECORDED', label: 'Salary Recorded' },
  { value: 'BONUS_RECORDED', label: 'Bonus Recorded' },
];

const ROLE_COLORS = {
  superadmin: 'error',
  admin: 'warning',
  user: 'default',
  chef: 'secondary',
};

function JsonBlock({ label, value }) {
  if (value == null) return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0, mt: 0.5, p: 1.5, borderRadius: 1, bgcolor: 'action.hover',
          fontSize: '0.72rem', fontFamily: 'monospace', overflowX: 'auto', maxHeight: 220,
        }}
      >
        {JSON.stringify(value, null, 2)}
      </Box>
    </Box>
  );
}

const EMPTY_FILTERS = { startDate: '', endDate: '', action: '', actorId: '' };

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [filterForm, setFilterForm] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [detailRow, setDetailRow] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/users?status=active&limit=200')
      .then((res) => setUsers(res.data.users ?? []))
      .catch(() => {});
  }, [isAdmin]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(paginationModel.page + 1), // DataGrid is 0-indexed; server is 1-indexed
        limit: String(paginationModel.pageSize),
      });
      if (appliedFilters.startDate) params.set('startDate', appliedFilters.startDate);
      if (appliedFilters.endDate) params.set('endDate', appliedFilters.endDate);
      if (appliedFilters.action) params.set('action', appliedFilters.action);
      if (isAdmin && appliedFilters.actorId) params.set('actorId', appliedFilters.actorId);

      const res = await api.get(`/audit-logs?${params}`);
      setRows(res.data.data ?? []);
      setRowCount(res.data.total ?? 0);
    } catch {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, paginationModel, isAdmin]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleApply = () => {
    setAppliedFilters({ ...filterForm });
    setPaginationModel((p) => ({ ...p, page: 0 }));
  };

  const handleReset = () => {
    setFilterForm(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPaginationModel((p) => ({ ...p, page: 0 }));
  };

  const setField = (key) => (e) => setFilterForm((f) => ({ ...f, [key]: e.target.value }));

  const columns = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      flex: 1.4,
      minWidth: 165,
      valueFormatter: (value) =>
        value ? format(new Date(value), 'dd MMM yyyy, HH:mm') : '—',
    },
    {
      field: 'actorName',
      headerName: 'Actor',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'actorRole',
      headerName: 'Role',
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value ?? '—'}
          color={ROLE_COLORS[value] ?? 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 1.2,
      minWidth: 140,
    },
    {
      field: 'targetEntity',
      headerName: 'Target',
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (value) => value ?? '—',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Audit Logs
      </Typography>

      {/* Filter bar */}
      <Card elevation={1} sx={{ mb: 2 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="From" type="date" value={filterForm.startDate} size="small"
              onChange={setField('startDate')}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="To" type="date" value={filterForm.endDate} size="small"
              onChange={setField('endDate')}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              select label="Action" value={filterForm.action} size="small"
              onChange={setField('action')}
              sx={{ minWidth: 190 }}
            >
              {ACTION_TYPES.map((a) => (
                <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
              ))}
            </TextField>
            {isAdmin && (
              <TextField
                select label="Actor" value={filterForm.actorId} size="small"
                onChange={setField('actorId')}
                sx={{ minWidth: 190 }}
              >
                <MenuItem value="">All actors</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
                ))}
              </TextField>
            )}
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={handleApply}>
                Apply
              </Button>
              <Button variant="outlined" size="small" onClick={handleReset}>
                Reset
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* DataGrid */}
      <Box sx={{ height: 620, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row._id}
          rowCount={rowCount}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[20, 50, 100]}
          onRowClick={(params) => setDetailRow(params.row)}
          sx={{
            cursor: 'pointer',
            '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
          }}
          disableRowSelectionOnClick
          localeText={{ noRowsLabel: 'No audit log entries found.' }}
          slotProps={{ loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' } }}
        />
      </Box>

      {/* Detail dialog */}
      <Dialog
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          Log Detail
          <IconButton
            onClick={() => setDetailRow(null)}
            size="small"
            sx={{ position: 'absolute', right: 12, top: 12 }}
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailRow && (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {format(new Date(detailRow.timestamp), 'dd MMM yyyy, HH:mm:ss')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Actor</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {detailRow.actorName}
                    <Chip
                      label={detailRow.actorRole}
                      color={ROLE_COLORS[detailRow.actorRole] ?? 'default'}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 0.75 }}
                    />
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Action</Typography>
                  <Typography variant="body2" fontWeight={600}>{detailRow.action}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Target</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {detailRow.targetEntity ?? '—'}
                    {detailRow.targetId && (
                      <Box
                        component="span"
                        sx={{ ml: 1, fontFamily: 'monospace', fontSize: '0.72rem', color: 'text.secondary' }}
                      >
                        {String(detailRow.targetId).slice(-8)}
                      </Box>
                    )}
                  </Typography>
                </Box>
              </Box>

              <Divider />
              <JsonBlock label="Old Value" value={detailRow.oldValue} />
              <JsonBlock label="New Value" value={detailRow.newValue} />
              {detailRow.oldValue == null && detailRow.newValue == null && (
                <Typography variant="body2" color="text.secondary">
                  No value snapshot recorded for this action.
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
