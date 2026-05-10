import { Box, Card, CardContent, Chip, Container, Divider, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const ROLE_COLOR = { superadmin: 'error', admin: 'warning', user: 'primary', chef: 'success' };

  const fields = [
    { label: t('common.name'),       value: user?.name },
    { label: t('auth.phone'),        value: user?.phone },
    { label: t('auth.roomNumber'),   value: user?.roomNumber },
  ].filter(f => f.value);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('nav.profile')}
      </Typography>

      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>{user?.name}</Typography>
            <Chip
              label={user?.role}
              color={ROLE_COLOR[user?.role] ?? 'default'}
              size="small"
              sx={{ alignSelf: 'flex-start', textTransform: 'capitalize' }}
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1.5}>
            {fields.map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body1" fontWeight={500}>{value}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
