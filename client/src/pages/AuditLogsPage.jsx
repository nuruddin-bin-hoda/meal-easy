import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Container, Dialog, DialogContent, DialogTitle, Divider, IconButton,
  MenuItem, Stack, TextField, Typography, useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { DataGrid } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getBadge } from '../utils/badgeStyles';
import { useTopbar } from '../context/TopbarContext';

const ADMIN_ROLES = ['admin', 'superadmin'];

const ACTION_VALUES = [
  { value: '', key: 'audit.allActions' },
  { value: 'PURCHASE_CREATED', key: 'audit.purchaseCreated' },
  { value: 'PURCHASE_DELETED', key: 'audit.purchaseDeleted' },
  { value: 'DEPOSIT_RECORDED', key: 'audit.depositRecorded' },
  { value: 'MEAL_TOGGLED', key: 'audit.mealToggled' },
  { value: 'BILLING_SUBMITTED', key: 'audit.billingSubmitted' },
  { value: 'USER_APPROVED', key: 'audit.userApproved' },
  { value: 'USER_REJECTED', key: 'audit.userRejected' },
  { value: 'USER_BLOCKED', key: 'audit.userBlocked' },
  { value: 'USER_UNBLOCKED', key: 'audit.userUnblocked' },
  { value: 'STOCK_UPDATE', key: 'audit.stockUpdate' },
  { value: 'MENU_UPDATED', key: 'audit.menuUpdated' },
  { value: 'SETTINGS_UPDATED', key: 'audit.settingsUpdated' },
  { value: 'SALARY_RECORDED', key: 'audit.salaryRecorded' },
  { value: 'BONUS_RECORDED', key: 'audit.bonusRecorded' },
];

const ROLE_BADGE_TYPE = {
  superadmin: 'error',
  admin: 'warning',
  user: 'info',
  chef: 'success',
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
  const { t } = useTranslation();
  const theme = useTheme();
  const mode = theme.palette.mode;
  const { setTopbar } = useTopbar();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  useEffect(() => {
    setTopbar({ title: t('nav.auditLogs') });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

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
        page: String(paginationModel.page + 1),
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
      setError(t('audit.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, paginationModel, isAdmin, t]);

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

  const buildExportHref = () => {
    const base = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/audit-logs/export`;
    const params = new URLSearchParams();
    if (appliedFilters.startDate) params.set('startDate', appliedFilters.startDate);
    if (appliedFilters.endDate) params.set('endDate', appliedFilters.endDate);
    if (appliedFilters.action) params.set('action', appliedFilters.action);
    if (isAdmin && appliedFilters.actorId) params.set('actorId', appliedFilters.actorId);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const columns = [
    {
      field: 'timestamp',
      headerName: t('audit.timestamp'),
      flex: 1.4,
      minWidth: 165,
      valueFormatter: (value) =>
        value ? format(new Date(value), 'dd MMM yyyy, HH:mm') : '—',
    },
    {
      field: 'actorName',
      headerName: t('audit.actor'),
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'actorRole',
      headerName: t('common.role'),
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value ?? '—'}
          size="small"
          sx={getBadge(ROLE_BADGE_TYPE[value] ?? 'info', mode)}
        />
      ),
    },
    {
      field: 'action',
      headerName: t('audit.action'),
      flex: 1.2,
      minWidth: 140,
    },
    {
      field: 'targetEntity',
      headerName: t('audit.target'),
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (value) => value ?? '—',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('audit.title')}
      </Typography>

      <Card elevation={0} sx={{ mb: 2 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
            <DatePicker
              label={t('common.from')}
              value={filterForm.startDate ? dayjs(filterForm.startDate) : null}
              onChange={(newVal) => setFilterForm(f => ({ ...f, startDate: newVal ? newVal.format('YYYY-MM-DD') : '' }))}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
            />
            <DatePicker
              label={t('common.to')}
              value={filterForm.endDate ? dayjs(filterForm.endDate) : null}
              onChange={(newVal) => setFilterForm(f => ({ ...f, endDate: newVal ? newVal.format('YYYY-MM-DD') : '' }))}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
            />
            <TextField
              select label={t('audit.action')} value={filterForm.action} size="small"
              onChange={setField('action')}
              sx={{ minWidth: 190 }}
            >
              {ACTION_VALUES.map((a) => (
                <MenuItem key={a.value} value={a.value}>{t(a.key)}</MenuItem>
              ))}
            </TextField>
            {isAdmin && (
              <TextField
                select label={t('audit.actor')} value={filterForm.actorId} size="small"
                onChange={setField('actorId')}
                sx={{ minWidth: 190 }}
              >
                <MenuItem value="">{t('audit.allActors')}</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
                ))}
              </TextField>
            )}
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={handleApply}>
                {t('common.apply')}
              </Button>
              <Button variant="outlined" size="small" onClick={handleReset}>
                {t('common.reset')}
              </Button>
              {isAdmin && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PictureAsPdfIcon />}
                  component="a"
                  href={buildExportHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('audit.exportPdf')}
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
          localeText={{ noRowsLabel: t('audit.noEntries') }}
          slotProps={{ loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' } }}
        />
      </Box>

      {/* Detail dialog */}
      <Dialog open={!!detailRow} onClose={() => setDetailRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          {t('audit.logDetail')}
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
                  <Typography variant="caption" color="text.secondary">{t('audit.timestamp')}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {format(new Date(detailRow.timestamp), 'dd MMM yyyy, HH:mm:ss')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('audit.actor')}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {detailRow.actorName}
                    <Chip
                      label={detailRow.actorRole}
                      size="small"
                      sx={{ ...getBadge(ROLE_BADGE_TYPE[detailRow.actorRole] ?? 'info', mode), ml: 0.75 }}
                    />
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('audit.action')}</Typography>
                  <Typography variant="body2" fontWeight={600}>{detailRow.action}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('audit.target')}</Typography>
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
              <JsonBlock label={t('audit.oldValue')} value={detailRow.oldValue} />
              <JsonBlock label={t('audit.newValue')} value={detailRow.newValue} />
              {detailRow.oldValue == null && detailRow.newValue == null && (
                <Typography variant="body2" color="text.secondary">
                  {t('audit.noValueSnapshot')}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
