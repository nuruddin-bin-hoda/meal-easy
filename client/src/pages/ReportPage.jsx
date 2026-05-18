import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Container,
  Divider, Grid, MenuItem, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography, useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTopbar } from '../context/TopbarContext';

const ADMIN_ROLES = ['admin', 'superadmin'];

function SummaryCard({ label, value, color, sub, tok }) {
  return (
    <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px', p: '20px 22px' }}>
      <Typography sx={{ fontSize: 11, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, mb: '4px' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: color ?? tok.ink }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: 11, color: tok.muted, mt: '1px' }}>{sub}</Typography>}
    </Box>
  );
}

export default function ReportPage() {
  const { month } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const tok = theme.tokens;
  const { setTopbar } = useTopbar();

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

  const pdfHref = userId && month
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/reports/${userId}/${month}/pdf`
    : null;

  useEffect(() => {
    setTopbar({
      title: t('report.title'),
      subtitle: month ? format(new Date(`${month}-01`), 'MMMM yyyy') : '',
      actions: pdfHref ? (
        <Button variant="outlined" size="small" startIcon={<PictureAsPdfIcon />}
          component="a" href={pdfHref} target="_blank" rel="noopener noreferrer"
          sx={{ fontSize: 12 }}>
          {t('report.downloadPdf')}
        </Button>
      ) : null,
    });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar, month, pdfHref]);

  const handleMonthChange = (e) => {
    navigate(`/reports/${e.target.value}`, { replace: true });
  };

  const prevMonth = () => {
    if (!month) return;
    const d = new Date(`${month}-01`); d.setMonth(d.getMonth() - 1);
    navigate(`/reports/${d.toISOString().slice(0, 7)}`, { replace: true });
  };
  const nextMonth = () => {
    if (!month) return;
    const d = new Date(`${month}-01`); d.setMonth(d.getMonth() + 1);
    navigate(`/reports/${d.toISOString().slice(0, 7)}`, { replace: true });
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

  const pad = { xs: '16px', md: '28px' };
  return (
    <Box sx={{ p: pad, fontFeatureSettings: '"tnum","cv11"' }}>
      {/* Month picker row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px', gap: '10px' }}>
        <Box
          component="button" onClick={prevMonth}
          sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, color: tok.ink, cursor: 'pointer', display: 'grid', placeItems: 'center', '&:hover': { bgcolor: tok.soft } }}
        >
          <ChevronLeftIcon sx={{ fontSize: 14 }} />
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 11, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{t('report.billingMonth')}</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', mt: '2px', color: tok.ink }}>
            {month ? format(new Date(`${month}-01`), 'MMMM yyyy') : '—'}
          </Typography>
        </Box>
        <Box
          component="button" onClick={nextMonth}
          sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, color: tok.ink, cursor: 'pointer', display: 'grid', placeItems: 'center', '&:hover': { bgcolor: tok.soft } }}
        >
          <ChevronRightIcon sx={{ fontSize: 14 }} />
        </Box>
      </Box>

      {isAdmin && (
        <TextField
          select label={t('common.user')} value={selectedUserId} size="small" sx={{ minWidth: 200, mb: 2 }}
          onChange={(e) => setSelectedUserId(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        >
          <MenuItem value="">{t('report.selectUser')}</MenuItem>
          {users.map((u) => (
            <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
          ))}
        </TextField>
      )}

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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: '12px', mb: '16px' }}>
            <SummaryCard label={t('report.mealRate')} value={`৳${(data.mealRate ?? 0).toFixed(2)}`} tok={tok} />
            <SummaryCard label={t('report.totalMeals')} value={totalMeals} sub={`incl. ${(data?.guestMealCount ?? 0)} guest`} tok={tok} />
            <SummaryCard label={t('report.totalBill')} value={`৳${(data.totalBill ?? 0).toFixed(2)}`} tok={tok} />
            <SummaryCard
              label={t('report.closingBalance')}
              value={`৳${(data.closingBalance ?? 0).toFixed(2)}`}
              color={data.closingBalance >= 0 ? tok.posInk : tok.dangerInk}
              tok={tok}
            />
          </Box>

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
    </Box>
  );
}
