import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Typography, Alert, CircularProgress, TextField, useTheme,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const INITIAL = { name: '', phone: '', roomNumber: '', password: '', confirmPassword: '' };
const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export default function RegisterPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const tok = theme.tokens;

  const [form, setForm] = useState(INITIAL);
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: tok.bg,
      '& fieldset': { borderColor: tok.hairline },
      '&:hover fieldset': { borderColor: tok.muted },
      '&.Mui-focused fieldset': { borderColor: tok.brandSage },
    },
    '& .MuiInputBase-input': { color: tok.ink, fontSize: 14 },
    '& .MuiInputLabel-root': { color: tok.muted, fontSize: 13 },
    '& .MuiInputLabel-root.Mui-focused': { color: tok.brandSage },
  };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    setPhotoError('');
    if (!file) return setPhoto(null);
    if (!ACCEPTED.includes(file.type)) {
      setPhotoError(t('auth.photoTypeError'));
      return setPhoto(null);
    }
    if (file.size > MAX_BYTES) {
      setPhotoError(t('auth.photoSizeError'));
      return setPhoto(null);
    }
    setPhoto(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError(t('auth.passwordMismatch'));
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
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: tok.bg }}>
        <Box sx={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>{t('auth.registrationSuccess')}</Alert>
          <Box component={RouterLink} to="/login" sx={{ fontSize: 14, color: tok.ink, fontWeight: 500 }}>
            {t('auth.backToLogin')}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: tok.bg, color: tok.ink,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      p: { xs: '24px 16px', md: '32px' }, overflowY: 'auto',
    }}>
      <Box sx={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Back link + heading */}
        <Box>
          <Box
            component={RouterLink} to="/login"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: 13, color: tok.muted, textDecoration: 'none',
              mb: '10px', '&:hover': { color: tok.ink },
            }}
          >
            ← {t('auth.backToLogin')}
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: tok.ink }}>
            {t('auth.createAccount')}
          </Typography>
          <Typography sx={{ fontSize: 13, color: tok.muted, mt: '4px', lineHeight: 1.5 }}>
            {t('auth.createAccountSubtitle')}
          </Typography>
        </Box>

        {/* Form card */}
        <Box sx={{
          bgcolor: tok.surface, border: `1px solid ${tok.hairline}`,
          borderRadius: '12px', p: '20px 22px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}

          <TextField label={t('auth.fullName')} name="name" value={form.name} onChange={handleChange} fullWidth required size="small" sx={inputSx} />
          <TextField
            label={t('auth.phone')} name="phone" value={form.phone} onChange={handleChange}
            fullWidth required autoComplete="tel" size="small" sx={inputSx}
            slotProps={{ input: { startAdornment: <Box component="span" sx={{ color: tok.muted, fontSize: 14, mr: 1 }}>+88</Box> } }}
          />
          <TextField label={t('auth.roomNumber')} name="roomNumber" value={form.roomNumber} onChange={handleChange} fullWidth required size="small" sx={inputSx} />
          <TextField label={t('auth.password')} name="password" type="password" value={form.password} onChange={handleChange} fullWidth required autoComplete="new-password" size="small" sx={inputSx} />
          <TextField label={t('auth.confirmPassword')} name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} fullWidth required autoComplete="new-password" size="small" sx={inputSx} />

          {/* Photo uploader */}
          <Box>
            <Typography sx={{ fontSize: 12, color: tok.muted, fontWeight: 500, mb: '6px' }}>
              {t('auth.uploadPhoto')}
            </Typography>
            <Box
              component="label"
              sx={{
                display: 'flex', alignItems: 'center', gap: '12px',
                border: `1px dashed ${tok.hairline}`, borderRadius: '8px',
                p: '16px', bgcolor: tok.bg, cursor: 'pointer',
                '&:hover': { borderColor: tok.muted },
              }}
            >
              <Box sx={{
                width: 40, height: 40, borderRadius: '999px', bgcolor: tok.soft,
                color: tok.muted, display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <PersonOutlineIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: tok.ink }}>
                  {photo ? photo.name : 'Drop or tap to upload'}
                </Typography>
                <Typography sx={{ fontSize: 11, color: tok.muted, mt: '2px' }}>
                  JPEG, PNG, WebP · max 2 MB
                </Typography>
              </Box>
              <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
            </Box>
            {photoError && <Typography sx={{ fontSize: 11, color: tok.dangerInk, mt: '4px' }}>{photoError}</Typography>}
          </Box>

          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth
            disabled={loading || !!photoError}
            sx={{
              mt: '4px', py: '10px', fontSize: 14, borderRadius: '8px',
              bgcolor: tok.btnBg, color: tok.btnInk,
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : t('auth.register')}
          </Button>
        </Box>

        {/* Info banner */}
        <Box sx={{ p: '10px 14px', bgcolor: tok.infoBg, color: tok.infoInk, fontSize: 11, borderRadius: '8px', lineHeight: 1.5 }}>
          <Typography sx={{ fontWeight: 500, mb: '2px', fontSize: 11, color: 'inherit' }}>What happens next</Typography>
          The admin reviews your phone and room number, then approves you. Average wait: under 24 hours.
        </Box>
      </Box>
    </Box>
  );
}
