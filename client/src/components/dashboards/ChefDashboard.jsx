import { useState, useEffect } from 'react';
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress, Container,
  Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import api from '../../api/axios';

export default function ChefDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/chef')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const { todayMenu = [], todayPortions = [], stock = [] } = data;

  const portionMap = Object.fromEntries(todayPortions.map((p) => [p.mealType, p.totalPortions]));
  const menuMap = Object.fromEntries(todayMenu.map((m) => [m.mealType, m.items]));
  const mealTypes = [...new Set([...todayMenu.map((m) => m.mealType), ...todayPortions.map((p) => p.mealType)])];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Chef Dashboard
      </Typography>

      <Grid container spacing={2}>

        {/* Today's menu + portion count cards */}
        {mealTypes.length === 0 ? (
          <Grid size={12}>
            <Alert severity="info">No menu or meal data for today.</Alert>
          </Grid>
        ) : mealTypes.map((mealType) => {
          const items = menuMap[mealType] ?? [];
          const portions = portionMap[mealType] ?? 0;
          return (
            <Grid key={mealType} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ letterSpacing: 1 }}
                  >
                    {mealType}
                  </Typography>

                  {/* Large portion count */}
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, my: 1 }}>
                    <Typography variant="h2" fontWeight={700} color="primary" lineHeight={1}>
                      {portions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      portions
                    </Typography>
                  </Box>

                  {/* Menu items */}
                  {items.length === 0 ? (
                    <Typography variant="body2" color="text.disabled">
                      Menu not set
                    </Typography>
                  ) : (
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                      {items.map((item) => (
                        <Chip key={item} label={item} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}

        {/* Stock table */}
        <Grid size={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Current Stock
              </Typography>
              {stock.length === 0 ? (
                <Alert severity="info">No stock items found.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stock.map((item) => (
                      <TableRow
                        key={item._id}
                        sx={item.isLow ? {
                          bgcolor: 'error.50',
                          '&:hover': { bgcolor: 'error.100' },
                        } : { '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <TableCell sx={{ fontWeight: item.isLow ? 600 : 400 }}>
                          {item.itemName}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 700, color: item.isLow ? 'error.main' : 'inherit' }}
                        >
                          {item.quantity}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell align="center">
                          {item.isLow
                            ? <Chip label="Low" color="error" size="small" />
                            : <Chip label="OK" color="success" size="small" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Container>
  );
}
