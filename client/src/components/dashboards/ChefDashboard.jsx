import { useState, useEffect } from 'react';
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress, Container,
  Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { getBadge } from '../../utils/badgeStyles';
import { useTopbar } from '../../context/TopbarContext';

export default function ChefDashboard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const mode = theme.palette.mode;
  const isDark = mode === 'dark';
  const { setTopbar } = useTopbar();

  useEffect(() => {
    setTopbar({ title: t('nav.dashboard') });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/chef')
      .then((res) => setData(res.data))
      .catch(() => setError(t('dashboard.failedToLoad')))
      .finally(() => setLoading(false));
  }, [t]);

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

  const lowBg    = isDark ? '#3a1a1a' : '#FCEBEB';
  const lowHover = isDark ? '#4a2222' : '#f8d7d7';

  return (
    <Container maxWidth="lg" sx={{ py: '24px', px: { xs: 2, md: '32px' } }}>
      <Typography sx={{ fontSize: 22, fontWeight: 500, color: 'text.primary', mb: 3 }}>
        {t('dashboard.chefTitle')}
      </Typography>

      <Grid container spacing={2}>

        {mealTypes.length === 0 ? (
          <Grid size={12}>
            <Alert severity="info">{t('dashboard.noMenuOrMealData')}</Alert>
          </Grid>
        ) : mealTypes.map((mealType) => {
          const items = menuMap[mealType] ?? [];
          const portions = portionMap[mealType] ?? 0;
          return (
            <Grid key={mealType} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card elevation={0} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                    {mealType}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1 }}>
                    <Typography sx={{ fontSize: 40, fontWeight: 500, color: 'primary.main', lineHeight: 1 }}>
                      {portions}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {t('dashboard.portions')}
                    </Typography>
                  </Box>

                  {items.length === 0 ? (
                    <Typography variant="body2" color="text.disabled">
                      {t('dashboard.menuNotSetShort')}
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {items.map((item) => (
                        <Chip key={item} label={item} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}

        {/* Stock table */}
        <Grid size={12}>
          <Card elevation={0}>
            <CardContent>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
                {t('dashboard.currentStock')}
              </Typography>
              {stock.length === 0 ? (
                <Alert severity="info">{t('dashboard.noStockItemsFound')}</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('common.item')}</TableCell>
                      <TableCell align="right">{t('common.quantity')}</TableCell>
                      <TableCell>{t('common.unit')}</TableCell>
                      <TableCell align="center">{t('common.status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stock.map((item) => (
                      <TableRow
                        key={item._id}
                        sx={item.isLow ? {
                          bgcolor: lowBg,
                          '&:hover': { bgcolor: lowHover },
                        } : { '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <TableCell sx={{ fontWeight: item.isLow ? 500 : 400 }}>
                          {item.itemName}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 500, color: item.isLow ? getBadge('error', mode).color : 'inherit' }}
                        >
                          {item.quantity}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell align="center">
                          {item.isLow
                            ? <Chip label={t('stock.lowStock')} size="small" sx={{ ...getBadge('error', mode), fontSize: 11 }} />
                            : <Chip label={t('stock.ok')} size="small" sx={{ ...getBadge('success', mode), fontSize: 11 }} />}
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
