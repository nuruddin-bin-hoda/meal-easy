import { useState } from 'react';
import {
  Avatar, Box, Drawer, IconButton, Tooltip, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Inventory as StockIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  ManageSearch as AuditIcon,
  MenuBook as MenuBookIcon,
  Notifications as BellIcon,
  People as UsersIcon,
  Person as ProfileIcon,
  Restaurant as MealsIcon,
  SoupKitchen as ChefsIcon,
  Settings as SettingsIcon,
  AccountBalanceWallet as DepositsIcon,
  ShoppingCart as PurchasesIcon,
  Receipt as CostsIcon,
  ReceiptLong as BillingIcon,
  GridView as DashboardIcon,
  MoreHoriz as MoreIcon,
  Close as CloseIcon,
  RestaurantMenu as SetMenuIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useColorMode } from '../../context/ThemeContext';
import { useTopbar } from '../../context/TopbarContext';
import NotificationBell from '../NotificationBell';
import api from '../../api/axios';

// ─── Plate mark SVG ────────────────────────────────────────────────────────────

function PlateMark({ size = 30, surfaceColor }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="50" cy="52" r="34" fill="#7F9E6E"/>
      <circle cx="50" cy="52" r="29" fill={surfaceColor}/>
      <circle cx="55" cy="55" r="17" fill="#5A7140"/>
      <circle cx="38" cy="42" r="3.5" fill="currentColor"/>
    </svg>
  );
}

// ─── Nav configs ───────────────────────────────────────────────────────────────

const NAV_USER = [
  { path: '/dashboard', label: 'nav.dashboard',  Icon: DashboardIcon },
  { path: '/meals',     label: 'nav.meals',       Icon: MealsIcon     },
  { path: '/menu',      label: 'nav.menu',        Icon: MenuBookIcon  },
  { path: '/reports',   label: 'nav.reports',     Icon: ReportIcon    },
  { path: '/profile',   label: 'nav.profile',     Icon: ProfileIcon   },
];

const NAV_ADMIN = [
  { path: '/dashboard',  label: 'nav.dashboard',  Icon: DashboardIcon },
  { path: '/users',      label: 'nav.users',       Icon: UsersIcon     },
  { path: '/meals',      label: 'nav.meals',       Icon: MealsIcon     },
  { path: '/menu',       label: 'nav.menu',        Icon: MenuBookIcon  },
  { path: '/set-menu',   label: 'nav.setMenu',     Icon: SetMenuIcon   },
  { path: '/purchases',  label: 'nav.purchases',   Icon: PurchasesIcon },
  { path: '/costs',      label: 'nav.costs',       Icon: CostsIcon     },
  { path: '/deposits',   label: 'nav.deposits',    Icon: DepositsIcon  },
  { path: '/billing',    label: 'nav.billing',     Icon: BillingIcon   },
  { path: '/stock',      label: 'nav.stock',       Icon: StockIcon     },
  { path: '/chefs',      label: 'nav.chefs',       Icon: ChefsIcon     },
  { path: '/reports',    label: 'nav.reports',     Icon: ReportIcon    },
  { path: '/audit-logs', label: 'nav.auditLogs',   Icon: AuditIcon     },
  { path: '/profile',   label: 'nav.profile',     Icon: ProfileIcon   },
  { path: '/settings',   label: 'nav.settings',    Icon: SettingsIcon  },
];

const NAV_SUPERADMIN = [
  ...NAV_ADMIN.slice(0, 2), // dashboard, users
  { path: '/admins',    label: 'nav.admins',    Icon: AdminPanelSettingsIcon },
  ...NAV_ADMIN.slice(2), // everything else
];

const NAV_CHEF = [
  { path: '/dashboard', label: 'nav.dashboard', Icon: DashboardIcon },
  { path: '/stock',     label: 'nav.stock',     Icon: StockIcon     },
  { path: '/profile',   label: 'nav.profile',   Icon: ProfileIcon   },
];

// Mobile bottom tabs
const TABS_USER = [
  { path: '/dashboard', label: 'Home',   Icon: DashboardIcon },
  { path: '/meals',     label: 'Meals',  Icon: MealsIcon     },
  { path: '/menu',      label: 'Menu',   Icon: MenuBookIcon  },
  { path: '/reports',   label: 'Report', Icon: ReportIcon    },
  { path: '__more__',   label: 'More',   Icon: MoreIcon      },
];

const TABS_ADMIN = [
  { path: '/dashboard', label: 'Home',  Icon: DashboardIcon },
  { path: '/meals',     label: 'Meals', Icon: MealsIcon     },
  { path: '/stock',     label: 'Stock', Icon: StockIcon     },
  { path: '/billing',   label: 'Money', Icon: BillingIcon   },
  { path: '__more__',   label: 'More',  Icon: MoreIcon      },
];

const TABS_CHEF = [
  { path: '/dashboard', label: 'Today',   Icon: DashboardIcon },
  { path: '/stock',     label: 'Stock',   Icon: StockIcon     },
  { path: '/profile',   label: 'Profile', Icon: ProfileIcon   },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return '?';
  return (parts[0][0] + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

const ROLE_LABELS = {
  superadmin: 'Admin',
  admin:      'Admin',
  chef:       'Kitchen',
  user:       'Member',
};

// ─── Sidebar nav item ──────────────────────────────────────────────────────────

function NavItem({ path, label, Icon, active, onClick, tok }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', px: '10px', py: '8px', borderRadius: '8px',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        mb: '2px', textAlign: 'left',
        bgcolor: active ? tok.soft : 'transparent',
        color: active ? tok.ink : tok.muted,
        fontSize: 13, fontWeight: active ? 500 : 400,
        transition: 'background 0.12s',
        '&:hover': { bgcolor: tok.soft, color: tok.ink },
      }}
    >
      <Icon sx={{ fontSize: 17, flexShrink: 0, strokeWidth: active ? 1.9 : 1.55 }} />
      <span>{label}</span>
    </Box>
  );
}

// ─── AppLayout ─────────────────────────────────────────────────────────────────

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useColorMode();
  const { title, subtitle, actions } = useTopbar();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { t, i18n } = useTranslation();
  const theme      = useTheme();
  const tok        = theme.tokens;
  const isMobile   = useMediaQuery(theme.breakpoints.down('md'));

  const [moreOpen, setMoreOpen] = useState(false);
  const isDark = mode === 'dark';

  const role    = user?.role ?? 'user';
  const cfgRole = role === 'superadmin' ? 'admin' : role;
  const navItems = role === 'superadmin' ? NAV_SUPERADMIN : cfgRole === 'admin' ? NAV_ADMIN : cfgRole === 'chef' ? NAV_CHEF : NAV_USER;
  const tabs     = cfgRole === 'admin' ? TABS_ADMIN : cfgRole === 'chef' ? TABS_CHEF : TABS_USER;

  const currentLang = (i18n.language || 'en').startsWith('bn') ? 'bn' : 'en';

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleLang = (lang) => {
    i18n.changeLanguage(lang);
    if (user?._id) api.patch(`/users/${user._id}`, { language: lang }).catch(() => {});
  };

  const roleLabel = ROLE_LABELS[role] ?? 'Member';
  const userName  = user?.name ?? '—';
  const roomNo    = user?.roomNumber ?? '';

  // Platform-specific plate inner color
  const plateRim = isDark ? tok.surface : '#FFFFFF';

  // ── Sidebar content (shared between desktop permanent + mobile drawer) ─────
  const sidebarContent = (
    <Box sx={{
      width: 240, height: '100%', display: 'flex', flexDirection: 'column',
      bgcolor: tok.surface, borderRight: `1px solid ${tok.hairline}`,
    }}>
      {/* Logo header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', px: '18px', pt: '20px', pb: '14px' }}>
        <Box sx={{
          width: 30, height: 30, borderRadius: '7px', bgcolor: tok.soft,
          display: 'grid', placeItems: 'center', flexShrink: 0, color: tok.ink,
        }}>
          <PlateMark size={30} surfaceColor={plateRim} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em', color: tok.ink }}>
            Meal Easy
          </Typography>
          <Typography sx={{ fontSize: 10, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {roleLabel}
          </Typography>
        </Box>
      </Box>

      {/* Nav list */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: '10px' }}>
        {navItems.map(({ path, label, Icon }) => (
          <NavItem
            key={path}
            path={path}
            label={t(label)}
            Icon={Icon}
            active={isActive(path)}
            tok={tok}
            onClick={() => { navigate(path); setMoreOpen(false); }}
          />
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: '10px',
        px: '14px', py: '14px',
        borderTop: `1px solid ${tok.hairlineSoft}`,
      }}>
        {user?.photo ? (
          <Avatar src={`/uploads/${user.photo}`} sx={{ width: 32, height: 32, flexShrink: 0 }} />
        ) : (
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
            {getInitials(userName)}
          </Avatar>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: tok.ink }} noWrap>
            {userName.split(' ').slice(0, 2).join(' ')}
          </Typography>
          <Typography sx={{ fontSize: 11, color: tok.muted }} noWrap>
            {cfgRole === 'admin' ? roleLabel : cfgRole === 'chef' ? 'Chef' : roomNo || roleLabel}
          </Typography>
        </Box>
        <Tooltip title={t('nav.logout')}>
          <IconButton size="small" onClick={handleLogout} sx={{ color: tok.muted, width: 28, height: 28, borderRadius: '6px' }}>
            <LogoutIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  // ── Topbar (desktop) ────────────────────────────────────────────────────────
  const topbar = (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: '12px',
      px: '28px', py: '14px',
      bgcolor: tok.surface, borderBottom: `1px solid ${tok.hairline}`,
      flexShrink: 0,
    }}>
      {/* Title */}
      <Box sx={{ flex: 1 }}>
        {subtitle && (
          <Typography sx={{ fontSize: 11, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
        <Typography sx={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', color: tok.ink }}>
          {title || t('appName')}
        </Typography>
      </Box>

      {/* Lang toggle */}
      <Box component="button"
        onClick={() => handleLang(currentLang === 'en' ? 'bn' : 'en')}
        sx={{
          px: '10px', py: '6px', borderRadius: '8px',
          border: `1px solid ${tok.hairline}`, bgcolor: 'transparent',
          color: tok.ink, fontSize: 12, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
          '&:hover': { bgcolor: tok.soft },
        }}
      >
        {currentLang === 'en' ? 'EN · বাংলা' : 'বাংলা · EN'}
      </Box>

      {/* Dark mode toggle */}
      <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
        <IconButton
          size="small"
          onClick={toggleMode}
          sx={{
            width: 34, height: 34, borderRadius: '8px',
            border: `1px solid ${tok.hairline}`, color: tok.ink,
            '&:hover': { bgcolor: tok.soft },
          }}
        >
          {isDark ? <LightModeIcon sx={{ fontSize: 15 }} /> : <DarkModeIcon sx={{ fontSize: 15 }} />}
        </IconButton>
      </Tooltip>

      {/* Notification bell */}
      <NotificationBell />

      {/* Page action slot */}
      {actions}
    </Box>
  );

  // ── Mobile top bar ──────────────────────────────────────────────────────────
  const mobileTopBar = (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: '10px',
      px: '16px', pt: '12px', pb: '10px',
      bgcolor: tok.bg, borderBottom: `1px solid ${tok.hairlineSoft}`,
      flexShrink: 0,
    }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {subtitle && (
          <Typography sx={{ fontSize: 10, color: tok.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
        <Typography sx={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2, color: tok.ink }} noWrap>
          {title || t('appName')}
        </Typography>
      </Box>
      {actions}
      <NotificationBell />
      {user?.photo ? (
        <Avatar
          src={`/uploads/${user.photo}`}
          sx={{ width: 36, height: 36, flexShrink: 0, cursor: 'pointer' }}
          onClick={() => navigate('/profile')}
        />
      ) : (
        <Avatar
          sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 13, fontWeight: 500, flexShrink: 0, cursor: 'pointer' }}
          onClick={() => navigate('/profile')}
        >
          {getInitials(userName)}
        </Avatar>
      )}
    </Box>
  );

  // ── Mobile bottom tabs ──────────────────────────────────────────────────────
  const activeTabPath = (() => {
    for (const tab of tabs) {
      if (tab.path !== '__more__' && isActive(tab.path)) return tab.path;
    }
    return null;
  })();

  const mobileBottomTabs = (
    <Box sx={{
      display: 'flex', flexShrink: 0,
      borderTop: `1px solid ${tok.hairlineSoft}`, bgcolor: tok.surface,
      pt: '8px', pb: '14px',
    }}>
      {tabs.map(({ path, label, Icon }) => {
        const active = path === '__more__' ? false : activeTabPath === path;
        return (
          <Box
            key={path}
            component="button"
            onClick={() => path === '__more__' ? setMoreOpen(true) : navigate(path)}
            sx={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              py: '6px', border: 'none', bgcolor: 'transparent', cursor: 'pointer',
              fontFamily: 'inherit', color: active ? tok.ink : tok.muted,
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontSize: 10, fontWeight: active ? 500 : 400, letterSpacing: '0.02em' }}>
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );

  // ── Mobile "More" drawer ────────────────────────────────────────────────────
  const moreDrawer = (
    <Drawer anchor="bottom" open={moreOpen} onClose={() => setMoreOpen(false)}
      PaperProps={{ sx: { borderRadius: '16px 16px 0 0', bgcolor: tok.surface, maxHeight: '80vh' } }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.ink }}>Navigation</Typography>
          <IconButton size="small" onClick={() => setMoreOpen(false)} sx={{ color: tok.muted }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        {navItems.map(({ path, label, Icon }) => (
          <NavItem key={path} path={path} label={t(label)} Icon={Icon}
            active={isActive(path)} tok={tok}
            onClick={() => { navigate(path); setMoreOpen(false); }}
          />
        ))}
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${tok.hairlineSoft}` }}>
          <Box component="button" onClick={toggleMode}
            sx={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', px: '10px', py: '8px', borderRadius: '8px',
              border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
              color: tok.muted, fontSize: 13, '&:hover': { bgcolor: tok.soft },
            }}
          >
            {isDark ? <LightModeIcon sx={{ fontSize: 17 }} /> : <DarkModeIcon sx={{ fontSize: 17 }} />}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </Box>
          <Box component="button" onClick={handleLogout}
            sx={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', px: '10px', py: '8px', borderRadius: '8px',
              border: 'none', bgcolor: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
              color: tok.dangerInk, fontSize: 13, '&:hover': { bgcolor: tok.dangerBg },
            }}
          >
            <LogoutIcon sx={{ fontSize: 17 }} />
            <span>{t('nav.logout')}</span>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', bgcolor: tok.bg }}>
        {mobileTopBar}
        <Box component="main" sx={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </Box>
        {mobileBottomTabs}
        {moreDrawer}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100dvh', overflow: 'hidden' }}>
      {sidebarContent}
      <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: tok.bg }}>
        {topbar}
        <Box component="main" sx={{ flex: 1, overflowY: 'auto', bgcolor: tok.bg }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
