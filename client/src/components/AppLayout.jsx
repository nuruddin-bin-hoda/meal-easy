import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import api from '../api/axios';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const currentLang = (i18n.language || 'en').startsWith('bn') ? 'bn' : 'en';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleLangChange = (lang) => {
    i18n.changeLanguage(lang);
    if (user?._id) {
      api.patch(`/users/${user._id}`, { language: lang }).catch(() => {});
    }
  };

  const showBell = user?.role !== 'chef';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'success.dark' }}>
        <Toolbar>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ flexGrow: 1, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => navigate('/dashboard')}
          >
            {t('appName')}
          </Typography>

          {/* Language toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <Button
              color="inherit"
              size="small"
              onClick={() => handleLangChange('en')}
              sx={{
                minWidth: 'auto', px: 1,
                fontWeight: currentLang === 'en' ? 700 : 400,
                opacity: currentLang === 'en' ? 1 : 0.65,
              }}
            >
              {t('lang.en')}
            </Button>
            <Typography variant="body2" color="inherit" sx={{ opacity: 0.5 }}>|</Typography>
            <Button
              color="inherit"
              size="small"
              onClick={() => handleLangChange('bn')}
              sx={{
                minWidth: 'auto', px: 1,
                fontWeight: currentLang === 'bn' ? 700 : 400,
                opacity: currentLang === 'bn' ? 1 : 0.65,
              }}
            >
              {t('lang.bn')}
            </Button>
          </Box>

          {showBell && <NotificationBell />}
          <Button color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
            {t('nav.logout')}
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
}
