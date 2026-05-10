import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Container,
  Divider, Grid, MenuItem, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['admin', 'superadmin'];

function SummaryCard({ label, value, color }) {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ color: color ?? 'inherit' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function ReportPage() {
  const { month } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userId = isAdmin ? selectedUserId : user?._id;

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/users?status=active&limit=200')
      .then((res) => setUsers(res.data.users ?? []))
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (!userId || !month) return;
    setLoading(true);
    setData(null);
    setError('');
    api.get(`/reports/${userId}/${month}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message ?? t('report.failedToLoad')))
      .finally(() => setLoading(false));
  }, [userId, month, t]);

  const handleMonthChange = (e) => {
    navigate(`/reports/${e.target.value}`, { replace: true });
  };

  const mealTypes = useMemo(() => {
    const seen = new Set();
    (data?.mealAttendance ?? []).forEach((day) =>
      day.toggles.forEach((t) => seen.add(t.mealType)),
    );
    return [...seen].sort();
  }, [data]);

  const attendanceLookup = useMemo(() => {
    const map = {};
    (data?.mealAttendance ?? []).forEach((day) => {
      map[day.date] = {};
      day.toggles.forEach((t) => { map[day.date][t.mealType] = t; });
    });
    return map;
  }, [data]);

  const totalMeals = data
    ? Object.values(data.totalMealsByType ?? {}).reduce((s, n) => s + n, 0)
    : 0;

  const pdfHref = userId && month
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/reports/${userId}/${month}/pdf`
    : '#';

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={700}>
          {t('report.title')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          {isAdmin && (
            <TextField
              select label={t('common.user')} value={selectedUserId} size="small" sx={{ minWidth: 200 }}
              onChange={(e) => setSelectedUserId(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="">{t('report.selectUser')}</MenuItem>
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label={t('common.month')} type="month" value={month ?? ''} size="small"
            onChange={handleMonthChange}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Tooltip title={t('report.pdfComingSoon')}>
            <span>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                disabled
                size="small"
              >
                {t('report.downloadPdf')}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {isAdmin && !selectedUserId && (
        <Alert severity="info">{t('report.selectUserPrompt')}</Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {data && !loading && (
        <>
          {data.isPreview && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('report.previewBanner')}
            </Alert>
          )}

          <Card elevation={0} variant="outlined" sx={{ mb: 3, px: 1 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('common.name')}</Typography>
                  <Typography variant="h6" fontWeight={700}>{data.user.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('common.room')}</Typography>
                  <Typography variant="h6" fontWeight={700}>{data.user.roomNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('report.billingMonth')}</Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {format(new Date(`${data.billingMonth}-01`), 'MMMM yyyy')}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                label={t('report.mealRate')}
                value={`৳${(data.mealRate ?? 0).toFixed(2)}${t('common.perMealUnit')}`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard label={t('report.totalMeals')} value={totalMeals} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard label={t('report.totalBill')} value={`৳${(data.totalBill ?? 0).toFixed(2)}`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                label={t('report.closingBalance')}
                value={`৳${(data.closingBalance ?? 0).toFixed(2)}`}
                color={data.closingBalance >= 0 ? 'success.main' : 'error.main'}
              />
            </Grid>
          </Grid>

          {/* Meal attendance table */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t('report.mealAttendance')}
              </Typography>
              {data.mealAttendance.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('report.noAttendance')}</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                        <TableCell>{t('common.date')}</TableCell>
                        {mealTypes.map((mt) => (
                          <TableCell key={mt} align="center" sx={{ textTransform: 'capitalize' }}>
                            {mt}
                          </TableCell>
                        ))}
                        <TableCell align="center">{t('report.guestsCol')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.mealAttendance.map((day) => {
                        const dayMap = attendanceLookup[day.date] ?? {};
                        const guests = day.toggles.reduce(
                          (sum, t) => sum + (t.isOn ? (t.guestCount ?? 0) : 0), 0,
                        );
                        return (
                          <TableRow key={day.date} hover>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {format(new Date(`${day.date}T00:00:00`), 'dd MMM, EEE')}
                            </TableCell>
                            {mealTypes.map((mt) => {
                              const cell = dayMap[mt];
                              return (
                                <TableCell
                                  key={mt}
                                  align="center"
                                  sx={{
                                    color: cell?.isOn ? 'success.main' : 'text.disabled',
                                    fontWeight: cell?.isOn ? 700 : 400,
                                    fontSize: '1rem',
                                  }}
                                >
                                  {cell?.isOn ? '✓' : '✗'}
                                </TableCell>
                              );
                            })}
                            <TableCell align="center">
                              {guests > 0 ? guests : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {t('report.costBreakdown')}
                  </Typography>
                  <Stack spacing={1.5}>
                    {[
                      { label: t('report.mealCost'), value: data.mealCost },
                      { label: t('report.otherCostShare'), value: data.otherCostShare },
                    ].map(({ label, value }) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={500}>৳{(value ?? 0).toFixed(2)}</Typography>
                      </Box>
                    ))}
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={700}>{t('report.totalBill')}</Typography>
                      <Typography variant="body2" fontWeight={700}>৳{(data.totalBill ?? 0).toFixed(2)}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {t('report.depositsThisMonth')}
                  </Typography>
                  {data.deposits.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">{t('report.noDeposits')}</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                          <TableCell>{t('common.date')}</TableCell>
                          <TableCell align="right">{t('common.amount')}</TableCell>
                          <TableCell>{t('common.note')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.deposits.map((d, i) => (
                          <TableRow key={i} hover>
                            <TableCell>{format(new Date(d.date), 'dd MMM yyyy')}</TableCell>
                            <TableCell align="right">৳{d.amount.toFixed(2)}</TableCell>
                            <TableCell>{d.note || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Balance summary */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t('report.balanceSummary')}
              </Typography>
              <Stack spacing={1.5}>
                {[
                  { label: t('report.openingBalance'), value: data.openingBalance },
                  {
                    label: t('report.depositsLabel', { month: format(new Date(`${data.billingMonth}-01`), 'MMM yyyy') }),
                    value: data.deposits.reduce((s, d) => s + d.amount, 0),
                    prefix: '+',
                  },
                  { label: t('report.totalBill'), value: data.totalBill, prefix: '−' },
                ].map(({ label, value, prefix }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {prefix} ৳{(value ?? 0).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" fontWeight={700}>{t('report.closingBalance')}</Typography>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{ color: data.closingBalance >= 0 ? 'success.main' : 'error.main' }}
                  >
                    ৳{(data.closingBalance ?? 0).toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
}
