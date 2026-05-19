import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, CircularProgress, useTheme,
  InputAdornment, IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import api from '../api/axios';

function PlateMark({ size = 48, surfaceColor }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <circle cx="50" cy="52" r="34" fill="#7F9E6E"/>
      <circle cx="50" cy="52" r="29" fill={surfaceColor}/>
      <circle cx="55" cy="55" r="17" fill="#5A7140"/>
      <circle cx="38" cy="42" r="3.5" fill="currentColor"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const tok = theme.tokens;
  const { toggleMode, mode } = useColorMode();

  const staleMessage = new URLSearchParams(location.search).get('reason') === 'session_stale'
    ? 'Your account role has changed. Please log in again.'
    : null;

  const [form, setForm] = useState({ phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentLang = (i18n.language || 'en').startsWith('bn') ? 'bn' : 'en';

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      await login(res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const autofillBg   = theme.palette.mode === 'dark' ? '#253040' : '#f3f6fa';
  const autofillText = theme.palette.mode === 'dark' ? '#cdd6e4' : '#111827';

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: tok.bg,
      '& fieldset': { borderColor: tok.hairline },
      '&:hover fieldset': { borderColor: tok.muted },
      '&.Mui-focused fieldset': { borderColor: tok.brandSage },
      '& input:-webkit-autofill': {
        WebkitBoxShadow: `0 0 0 100px ${autofillBg} inset`,
        WebkitTextFillColor: autofillText,
      },
      '& input:-webkit-autofill:focus': {
        WebkitBoxShadow: `0 0 0 100px ${autofillBg} inset`,
        WebkitTextFillColor: autofillText,
      },
    },
    '& .MuiInputBase-input': { color: tok.ink, fontSize: 14 },
    '& .MuiInputLabel-root': { color: tok.muted, fontSize: 13 },
    '& .MuiInputLabel-root.Mui-focused': { color: tok.brandSage },
  };

  return (
    <Box sx={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'background.default',
      padding: '16px',
      overflowY: 'auto',
    }}>
      <Box sx={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 1, color: tok.ink }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '14px', bgcolor: tok.soft,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: '14px',
          }}>
            <PlateMark size={48} surfaceColor={tok.surface} />
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: tok.ink }}>
            Meal<Box component="span" sx={{ color: '#7F9E6E', fontStyle: 'italic', ml: '4px' }}>Easy</Box>
          </Typography>
          <Typography sx={{ fontSize: 13, color: tok.muted, mt: '4px' }}>
            {t('auth.signInSubtitle')}
          </Typography>
        </Box>

        {staleMessage && (
          <Alert severity="info" sx={{ borderRadius: '8px' }}>{staleMessage}</Alert>
        )}

        {/* Card */}
        <Box sx={{
          bgcolor: tok.surface, border: `1px solid ${tok.hairline}`,
          borderRadius: '12px', p: '20px 22px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}

          <TextField
            label={t('auth.phone')}
            name="phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
            required
            autoComplete="tel"
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <Box component="span" sx={{ color: tok.muted, fontSize: 14, mr: 1, whiteSpace: 'nowrap' }}>+88</Box>
                ),
              },
            }}
            sx={inputSx}
          />

          <Box>
            <TextField
              label={t('auth.password')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              fullWidth
              required
              autoComplete="current-password"
              size="small"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={inputSx}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '6px' }}>
              <Typography component="span" sx={{ fontSize: 12, color: tok.muted, cursor: 'pointer' }}>
                Forgot password?
              </Typography>
            </Box>
          </Box>

          <Button
            type="button"
            onClick={handleSubmit}
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: '4px', py: '10px', fontSize: 14, borderRadius: '8px',
              bgcolor: tok.btnBg, color: tok.btnInk,
              '&:hover': { bgcolor: mode === 'dark' ? '#D4CCBC' : '#2D2820' },
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : t('auth.signIn')}
          </Button>
        </Box>

        {/* Footer */}
        <Typography sx={{ textAlign: 'center', fontSize: 13, color: tok.muted }}>
          {t('auth.noAccount')}{' '}
          <Box
            component={RouterLink}
            to="/register"
            sx={{ color: tok.ink, fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {t('auth.register')} →
          </Box>
        </Typography>

        {/* Lang toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
          {['en', 'bn'].map((lang, i) => (
            <Box key={lang} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {i > 0 && <Typography sx={{ fontSize: 11, color: tok.dim }}>·</Typography>}
              <Box
                component="button"
                onClick={() => {
                  i18n.changeLanguage(lang);
                }}
                sx={{
                  border: 'none', bgcolor: 'transparent', cursor: 'pointer',
                  fontSize: 11, color: currentLang === lang ? tok.ink : tok.dim,
                  fontWeight: currentLang === lang ? 500 : 400, fontFamily: 'inherit',
                }}
              >
                {lang === 'en' ? 'EN' : 'বাংলা'}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
