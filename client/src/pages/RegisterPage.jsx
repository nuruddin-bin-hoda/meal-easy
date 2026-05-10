import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Link,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const INITIAL = { name: '', phone: '', roomNumber: '', password: '', confirmPassword: '' };
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function RegisterPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState(INITIAL);
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    setPhotoError('');
    if (!file) return setPhoto(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPhotoError(t('auth.photoTypeError'));
      return setPhoto(null);
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t('auth.photoSizeError'));
      return setPhoto(null);
    }
    setPhoto(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError(t('auth.passwordMismatch'));
    }

    const data = new FormData();
    data.append('name', form.name);
    data.append('phone', form.phone);
    data.append('roomNumber', form.roomNumber);
    data.append('password', form.password);
    if (photo) data.append('photo', photo);

    setLoading(true);
    try {
      await api.post('/auth/register', data);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>{t('auth.requestSubmitted')}</Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              {t('auth.registrationSuccess')}
            </Alert>
            <Link component={RouterLink} to="/login">{t('auth.backToLogin')}</Link>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={1}>{t('auth.createAccount')}</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {t('auth.createAccountSubtitle')}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField label={t('auth.fullName')} name="name" value={form.name} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
            <TextField label={t('auth.phone')} name="phone" value={form.phone} onChange={handleChange} fullWidth required autoComplete="tel" sx={{ mb: 2 }} />
            <TextField label={t('auth.roomNumber')} name="roomNumber" value={form.roomNumber} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
            <TextField label={t('auth.password')} name="password" type="password" value={form.password} onChange={handleChange} fullWidth required autoComplete="new-password" sx={{ mb: 2 }} />
            <TextField label={t('auth.confirmPassword')} name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} fullWidth required autoComplete="new-password" sx={{ mb: 2 }} />

            <Button variant="outlined" component="label" fullWidth sx={{ mb: photoError ? 1 : 2 }}>
              {photo ? photo.name : t('auth.uploadPhoto')}
              <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
            </Button>
            {photoError && <Typography variant="caption" color="error" display="block" mb={2}>{photoError}</Typography>}

            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading || !!photoError}>
              {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.register')}
            </Button>
          </Box>

          <Typography variant="body2" align="center" mt={3}>
            {t('auth.haveAccount')}{' '}
            <Link component={RouterLink} to="/login">{t('auth.signInLink')}</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
