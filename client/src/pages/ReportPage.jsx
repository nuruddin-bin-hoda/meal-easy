import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Container,
  Divider, Grid, MenuItem, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
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

function JsonBlock({ value }) {
  if (value == null) return <Typography variant="body2" color="text.disabled">—</Typography>;
  return (
    <Box
      component="pre"
      sx={{
        m: 0, p: 1.5, borderRadius: 1, bgcolor: 'action.hover',
        fontSize: '0.75rem', fontFamily: 'monospace',
        overflowX: 'auto', maxHeight: 200,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </Box>
  );
}

export default function ReportPage() {
  const { month } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
      .catch((err) => setError(err.response?.data?.message ?? 'Failed to load report.'))
      .finally(() => setLoading(false));
  }, [userId, month]);

  const handleMonthChange = (e) => {
    navigate(`/reports/${e.target.value}`, { replace: true });
  };

  // Collect all meal types present in attendance data
  const mealTypes = useMemo(() => {
    const seen = new Set();
    (data?.mealAttendance ?? []).forEach((day) =>
      day.toggles.forEach((t) => seen.add(t.mealType)),
    );
    return [...seen].sort();
  }, [data]);

  // Fast lookup: date → mealType → { isOn, guestCount }
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
      {/* Controls bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={700}>
          Monthly Report
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          {isAdmin && (
            <TextField
              select label="User" value={selectedUserId} size="small" sx={{ minWidth: 200 }}
              onChange={(e) => setSelectedUserId(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="">— select user —</MenuItem>
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label="Month" type="month" value={month ?? ''} size="small"
            onChange={handleMonthChange}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Tooltip title="PDF download coming in Phase 7">
            <span>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                disabled
                size="small"
              >
                Download PDF
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Admin: prompt to select user */}
      {isAdmin && !selectedUserId && (
        <Alert severity="info">Select a user above to view their report.</Alert>
      )}

      {/* Loading / Error */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Report body */}
      {data && !loading && (
        <>
          {/* Preview banner */}
          {data.isPreview && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Preview — billing for this month has not been finalised yet. Figures may change.
            </Alert>
          )}

          {/* User info header */}
          <Card elevation={0} variant="outlined" sx={{ mb: 3, px: 1 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="h6" fontWeight={700}>{data.user.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Room</Typography>
                  <Typography variant="h6" fontWeight={700}>{data.user.roomNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Billing Month</Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {format(new Date(`${data.billingMonth}-01`), 'MMMM yyyy')}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard label="Meal Rate" value={`৳${(data.mealRate ?? 0).toFixed(2)}/meal`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard label="Total Meals" value={totalMeals} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard label="Total Bill" value={`৳${(data.totalBill ?? 0).toFixed(2)}`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                label="Closing Balance"
                value={`৳${(data.closingBalance ?? 0).toFixed(2)}`}
                color={data.closingBalance >= 0 ? 'success.main' : 'error.main'}
              />
            </Grid>
          </Grid>

          {/* Meal attendance table */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Meal Attendance
              </Typography>
              {data.mealAttendance.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No attendance data for this month.</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                        <TableCell>Date</TableCell>
                        {mealTypes.map((mt) => (
                          <TableCell key={mt} align="center" sx={{ textTransform: 'capitalize' }}>
                            {mt}
                          </TableCell>
                        ))}
                        <TableCell align="center">Guests</TableCell>
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

          {/* Cost breakdown + Deposits side by side */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Cost Breakdown
                  </Typography>
                  <Stack spacing={1.5}>
                    {[
                      { label: 'Meal cost', value: data.mealCost },
                      { label: 'Other cost share', value: data.otherCostShare },
                    ].map(({ label, value }) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={500}>৳{(value ?? 0).toFixed(2)}</Typography>
                      </Box>
                    ))}
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={700}>Total Bill</Typography>
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
                    Deposits This Month
                  </Typography>
                  {data.deposits.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No deposits this month.</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Note</TableCell>
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
                Balance Summary
              </Typography>
              <Stack spacing={1.5}>
                {[
                  { label: 'Opening Balance', value: data.openingBalance },
                  {
                    label: `Deposits (${format(new Date(`${data.billingMonth}-01`), 'MMM yyyy')})`,
                    value: data.deposits.reduce((s, d) => s + d.amount, 0),
                    prefix: '+',
                  },
                  { label: 'Total Bill', value: data.totalBill, prefix: '−' },
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
                  <Typography variant="body1" fontWeight={700}>Closing Balance</Typography>
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
