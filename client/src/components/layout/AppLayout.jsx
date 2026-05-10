import { useState } from 'react';
import {
  AppBar, Avatar, BottomNavigation, BottomNavigationAction, Box,
  Divider, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Menu, MenuItem as MuiMenuItem, Paper,
  Toolbar, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import {
  AccountBalanceWallet as DepositIcon,
  Assessment as ReportsIcon,
  Dashboard as DashboardIcon,
  Inventory as StockIcon,
  Logout as LogoutIcon,
  ManageSearch as AuditIcon,
  Menu as HamburgerIcon,
  MenuBook as MenuBookIcon,
  MoreHoriz as MoreIcon,
  Notifications as NotificationsIcon,
  People as UsersIcon,
  Person as ProfileIcon,
  ReceiptLong as BillingIcon,
  Restaurant as MealsIcon,
  Settings as SettingsIcon,
  ShoppingCart as PurchasesIcon,
  SoupKitchen as ChefsIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';
import api from '../../api/axios';

const DRAWER_WIDTH = 240;

// ── nav item definitions ─────────────────────────────────────────────────────
const NAV_CONFIG = {
  admin: [
    { key: 'nav.dashboard',    path: '/dashboard',  Icon: DashboardIcon },
    { key: 'nav.users',        path: '/users',       Icon: UsersIcon },
    { key: 'nav.meals',        path: '/meals',       Icon: MealsIcon },
    { key: 'nav.purchases',    path: '/purchases',   Icon: PurchasesIcon },
    { key: 'nav.deposits',     path: '/deposits',    Icon: DepositIcon },
    { key: 'nav.stock',        path: '/stock',       Icon: StockIcon },
    { key: 'nav.chefs',        path: '/chefs',       Icon: ChefsIcon },
    { key: 'nav.billing',      path: '/billing',     Icon: BillingIcon },
    { key: 'nav.auditLogs',    path: '/audit-logs',  Icon: AuditIcon },
    { key: 'nav.settings',     path: '/settings',    Icon: SettingsIcon },
  ],
  user: [
    { key: 'nav.dashboard',    path: '/dashboard',       Icon: DashboardIcon },
    { key: 'nav.meals',        path: '/meals',            Icon: MealsIcon },
    { key: 'nav.menu',         path: '/menu',             Icon: MenuBookIcon },
    { key: 'nav.reports',      path: '/reports',          Icon: ReportsIcon },
    { key: 'nav.stock',        path: '/stock',            Icon: StockIcon },
    { key: 'nav.notifications',path: '/notifications',    Icon: NotificationsIcon },
    { key: 'nav.profile',      path: '/profile',          Icon: ProfileIcon },
  ],
  chef: [
    { key: 'nav.dashboard',    path: '/dashboard',   Icon: DashboardIcon },
    { key: 'nav.menu',         path: '/menu',         Icon: MenuBookIcon },
    { key: 'nav.stock',        path: '/stock',        Icon: StockIcon },
    { key: 'nav.profile',      path: '/profile',      Icon: ProfileIcon },
  ],
};

// Bottom nav — first 4 tabs + optional "More"
const BOTTOM_NAV_CONFIG = {
  admin: [
    { key: 'nav.dashboard', path: '/dashboard', Icon: DashboardIcon },
    { key: 'nav.meals',     path: '/meals',     Icon: MealsIcon },
    { key: 'nav.menu',      path: '/menu',      Icon: MenuBookIcon },
    { key: 'nav.reports',   path: '/reports',   Icon: ReportsIcon },
    { key: 'nav.more',      path: '__more__',   Icon: MoreIcon },
  ],
  user: [
    { key: 'nav.dashboard', path: '/dashboard', Icon: DashboardIcon },
    { key: 'nav.meals',     path: '/meals',     Icon: MealsIcon },
    { key: 'nav.menu',      path: '/menu',      Icon: MenuBookIcon },
    { key: 'nav.reports',   path: '/reports',   Icon: ReportsIcon },
    { key: 'nav.more',      path: '__more__',   Icon: MoreIcon },
  ],
  chef: [
    { key: 'nav.dashboard', path: '/dashboard', Icon: DashboardIcon },
    { key: 'nav.menu',      path: '/menu',      Icon: MenuBookIcon },
    { key: 'nav.stock',     path: '/stock',     Icon: StockIcon },
  ],
};

const AVATAR_BG = {
  superadmin: '#b71c1c',
  admin:      '#e65100',
  user:       '#1565c0',
  chef:       '#2e7d32',
};

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { t, i18n } = useTranslation();
  const theme      = useTheme();
  const isMobile   = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const role         = user?.role ?? 'user';
  const cfgRole      = role === 'superadmin' ? 'admin' : role;
  const navItems     = NAV_CONFIG[cfgRole]       ?? NAV_CONFIG.user;
  const bottomItems  = BOTTOM_NAV_CONFIG[cfgRole] ?? BOTTOM_NAV_CONFIG.user;
  const currentLang  = (i18n.language || 'en').startsWith('bn') ? 'bn' : 'en';

  // Determine which nav item matches the current route
  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Active value for BottomNavigation
  const activeBottom = (() => {
    for (const item of bottomItems) {
      if (item.path !== '__more__' && isActive(item.path)) return item.path;
    }
    return bottomItems.some((i) => i.path === '__more__') ? '__more__' : null;
  })();

  const handleBottomChange = (_, value) => {
    if (value === '__more__') setMobileOpen(true);
    else navigate(value);
  };

  const handleLangChange = (lang) => {
    i18n.changeLanguage(lang);
    if (user?._id) api.patch(`/users/${user._id}`, { language: lang }).catch(() => {});
  };

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await logout();
    navigate('/login', { replace: true });
  };

  // ── drawer body (shared between mobile overlay + desktop permanent) ────────
  const drawerBody = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* User card */}
      <Box sx={{ px: 2, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: AVATAR_BG[role] ?? '#1565c0', width: 38, height: 38, fontSize: '0.85rem' }}>
          {getInitials(user?.name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{user?.name ?? '—'}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {role}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Nav items */}
      <List dense sx={{ flex: 1, overflowY: 'auto', px: 1, pt: 0.5 }}>
        {navItems.map(({ key, path, Icon }) => {
          const active = isActive(path);
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                selected={active}
                onClick={() => { navigate(path); setMobileOpen(false); }}
                sx={{
                  borderRadius: 1.5,
                  py: 0.75,
                  '&.Mui-selected': {
                    bgcolor: 'success.dark',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'success.main' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={t(key)}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: active ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>

      {/* ── AppBar ──────────────────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{ bgcolor: 'success.dark', zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ gap: 0.5 }}>
          {/* Hamburger — mobile only */}
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label="open navigation"
              sx={{ mr: 0.5 }}
            >
              <HamburgerIcon />
            </IconButton>
          )}

          {/* App name */}
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ cursor: 'pointer', userSelect: 'none', letterSpacing: 0.3, flexGrow: 1 }}
            onClick={() => navigate('/dashboard')}
          >
            {t('appName')}
          </Typography>

          {/* Language toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
            {['en', 'bn'].map((lang, i) => (
              <>
                {i === 1 && (
                  <Typography key="sep" variant="caption" sx={{ opacity: 0.35, color: 'white', mx: 0.25 }}>
                    |
                  </Typography>
                )}
                <Box
                  key={lang}
                  component="button"
                  onClick={() => handleLangChange(lang)}
                  sx={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'white', fontFamily: 'inherit',
                    fontSize: lang === 'bn' ? '0.78rem' : '0.75rem',
                    fontWeight: currentLang === lang ? 700 : 400,
                    opacity: currentLang === lang ? 1 : 0.55,
                    px: 0.5, py: 0.25, borderRadius: 0.5,
                    '&:hover': { opacity: 1 },
                  }}
                >
                  {t(`lang.${lang}`)}
                </Box>
              </>
            ))}
          </Box>

          {/* Notification bell — non-chef */}
          {role !== 'chef' && <NotificationBell />}

          {/* User avatar → menu */}
          <Tooltip title={user?.name ?? ''}>
            <IconButton
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{ ml: 0.25, p: 0.5 }}
              aria-label="account menu"
            >
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: AVATAR_BG[role] ?? '#1565c0' }}>
                {getInitials(user?.name)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* ── Mobile drawer (temporary overlay) ──────────────────────────── */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        {drawerBody}
      </Drawer>

      {/* ── Desktop drawer (permanent) ──────────────────────────────────── */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          },
        }}
        open
      >
        <Toolbar />
        {drawerBody}
      </Drawer>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          // Leave space below for bottom nav on mobile
          pb: { xs: '56px', md: 0 },
        }}
      >
        <Toolbar /> {/* spacer for fixed AppBar */}
        {children}
      </Box>

      {/* ── Bottom navigation (mobile only) ────────────────────────────── */}
      <Paper
        elevation={8}
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: (t) => t.zIndex.appBar,
        }}
      >
        <BottomNavigation
          value={activeBottom}
          onChange={handleBottomChange}
          showLabels
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        >
          {bottomItems.map(({ key, path, Icon }) => (
            <BottomNavigationAction
              key={path}
              label={t(key)}
              value={path}
              icon={<Icon fontSize="small" />}
              sx={{
                minWidth: 0,
                px: 0.5,
                '&.Mui-selected': { color: 'success.dark' },
                '& .MuiBottomNavigationAction-label': { fontSize: '0.58rem' },
                '& .MuiBottomNavigationAction-label.Mui-selected': { fontSize: '0.63rem' },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>

      {/* ── User avatar dropdown menu ───────────────────────────────────── */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { elevation: 3, sx: { minWidth: 180, mt: 0.5 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {role}
          </Typography>
        </Box>
        <Divider />
        <MuiMenuItem
          onClick={() => { setUserMenuAnchor(null); navigate('/profile'); }}
          sx={{ gap: 1.5, py: 1 }}
        >
          <ProfileIcon fontSize="small" color="action" />
          {t('nav.profile')}
        </MuiMenuItem>
        <Divider />
        <MuiMenuItem
          onClick={handleLogout}
          sx={{ gap: 1.5, py: 1, color: 'error.main' }}
        >
          <LogoutIcon fontSize="small" color="error" />
          {t('nav.logout')}
        </MuiMenuItem>
      </Menu>

    </Box>
  );
}
