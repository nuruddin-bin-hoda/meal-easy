import { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import {
  Alert, Box, Card, CardContent, CardHeader, CircularProgress,
  Container, Divider, List, ListItem, ListItemText,
  Stack, TextField, Typography,
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import api from '../api/axios';

const todayPlusOne = () => format(addDays(new Date(), 1), 'yyyy-MM-dd');

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function MenuPage() {
  const [date, setDate] = useState(todayPlusOne);
  const [menus, setMenus] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/menus/${date}`).then(res => {
      setMenus(res.data.menus ?? {});
    }).catch(() => {
      setMenus({});
    }).finally(() => setLoading(false));
  }, [date]);

  const mealTypes = Object.keys(menus);

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: 2 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Menu
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatDate(date)}
      </Typography>

      <TextField
        type="date"
        label="Date"
        value={date}
        onChange={e => setDate(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && mealTypes.length === 0 && (
        <Alert severity="info" icon={<RestaurantMenuIcon />}>
          No menu has been set for this date.
        </Alert>
      )}

      {!loading && mealTypes.length > 0 && (
        <Stack spacing={2}>
          {mealTypes.map(mealType => (
            <Card key={mealType} elevation={2}>
              <CardHeader
                title={mealType}
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ pt: 1, pb: '16px !important' }}>
                {menus[mealType].length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No items listed
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {menus[mealType].map((item, idx) => (
                      <Box key={item}>
                        <ListItem disablePadding sx={{ py: 0.75 }}>
                          <ListItemText primary={item} />
                        </ListItem>
                        {idx < menus[mealType].length - 1 && <Divider component="li" />}
                      </Box>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
