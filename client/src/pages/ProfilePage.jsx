import { Avatar, Box, Button, CircularProgress, IconButton, TextField, Typography, useTheme } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import { useTopbar } from '../context/TopbarContext';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { getBadge } from '../utils/badgeStyles';

const ROLE_TYPE = { superadmin: 'error', admin: 'warning', user: 'info', chef: 'success' };

const getPhotoUrl = (photo) => {
  if (!photo) return null;
  return `/uploads/${photo}`;
};

const getInitials = (name = '') => {
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '');
};

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const tok = theme.tokens;
  const mode = theme.palette.mode;
  const { toggleMode } = useColorMode();
  const { setTopbar } = useTopbar();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({ name: '', roomNumber: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    setTopbar({ title: t('nav.profile'), subtitle: '' });
    return () => setTopbar({ title: '', subtitle: '', actions: null });
  }, [t, setTopbar]);

  useEffect(() => {
    if (editing) {
      setForm({ name: user?.name ?? '', roomNumber: user?.roomNumber ?? '' });
      setPhotoFile(null);
      setPhotoPreview(null);
      setSaveError('');
    }
  }, [editing, user]);

  const roleBadge = getBadge(ROLE_TYPE[user?.role] ?? 'info', mode);

  const fields = [
    { label: t('common.name'),     value: user?.name },
    { label: t('auth.roomNumber'), value: user?.roomNumber },
    { label: t('auth.phone'),      value: user?.phone },
    { label: 'Member since',   value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : null },
  ].filter((f) => f.value);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type) || file.size > MAX_BYTES) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const userId = user?._id;
      const data = new FormData();
      data.append('name', form.name.trim());
      data.append('roomNumber', form.roomNumber.trim());
      if (photoFile) data.append('photo', photoFile);
      await api.patch(`/users/${userId}`, data);
      await login(user); // re-fetch full profile into auth context
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const pad = { xs: '16px', md: '28px' };
  const avatarSrc = photoPreview ?? getPhotoUrl(user?.photo);

  return (
    <Box sx={{ p: pad, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 560 }}>

      {/* Hero card */}
      <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px', p: '20px 22px', position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {avatarSrc ? (
            <Avatar src={avatarSrc} sx={{ width: 64, height: 64, fontSize: 24 }} />
          ) : (
            <Avatar sx={{ width: 64, height: 64, fontSize: 24, backgroundColor: 'primary.main' }}>
              {getInitials(user?.name ?? '').toUpperCase()}
            </Avatar>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 500, color: tok.ink }} noWrap>{user?.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mt: '4px', flexWrap: 'wrap' }}>
              <Box component="span" sx={{ ...roleBadge, px: '8px', py: '2px', borderRadius: '999px', textTransform: 'capitalize' }}>
                {user?.role}
              </Box>
            </Box>
          </Box>
        </Box>
        {!editing && (
          <IconButton
            size="small"
            onClick={() => setEditing(true)}
            sx={{ position: 'absolute', top: 12, right: 12, color: tok.muted, '&:hover': { color: tok.ink } }}
            aria-label="Edit profile"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Edit form */}
      {editing && (
        <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px', p: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <TextField
            label={t('common.name')}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            size="small"
          />

          <TextField
            label={t('auth.roomNumber')}
            value={form.roomNumber}
            onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
            fullWidth
            size="small"
          />

          {/* Photo upload */}
          <Box>
            <Typography sx={{ fontSize: 12, color: tok.muted, fontWeight: 500, mb: '6px' }}>
              {t('auth.uploadPhoto')}
            </Typography>
            <Box
              component="label"
              sx={{
                display: 'flex', alignItems: 'center', gap: '12px',
                border: `1px dashed ${tok.hairline}`, borderRadius: '8px',
                p: '14px', bgcolor: tok.bg, cursor: 'pointer',
                '&:hover': { borderColor: tok.muted },
              }}
            >
              {photoPreview ? (
                <Avatar src={photoPreview} sx={{ width: 40, height: 40, flexShrink: 0 }} />
              ) : (
                <Box sx={{ width: 40, height: 40, borderRadius: '999px', bgcolor: tok.soft, color: tok.muted, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <PersonOutlineIcon sx={{ fontSize: 20 }} />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: tok.ink }}>
                  {photoFile ? photoFile.name : 'Tap to change photo'}
                </Typography>
                <Typography sx={{ fontSize: 11, color: tok.muted, mt: '2px' }}>
                  JPEG, PNG, WebP · max 2 MB
                </Typography>
              </Box>
              <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
            </Box>
          </Box>

          {saveError && (
            <Typography sx={{ fontSize: 12, color: tok.dangerInk }}>{saveError}</Typography>
          )}

          <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button size="small" onClick={handleCancel} disabled={saving} sx={{ color: tok.muted }}>
              {t('common.cancel')}
            </Button>
            <Button
              size="small" variant="contained" onClick={handleSave}
              disabled={saving || !form.name.trim()}
              sx={{ bgcolor: tok.btnBg, color: tok.btnInk, '&:hover': { bgcolor: mode === 'dark' ? '#D4CCBC' : '#2D2820' } }}
            >
              {saving ? <CircularProgress size={16} color="inherit" /> : t('common.save')}
            </Button>
          </Box>
        </Box>
      )}

      {/* Settings list */}
      <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px' }}>
        {fields.map(({ label, value }, i) => (
          <Box key={label} sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            p: '14px 18px', gap: '12px',
            borderTop: i === 0 ? 'none' : `1px solid ${tok.hairlineSoft}`,
          }}>
            <Typography sx={{ fontSize: 13, color: tok.muted }}>{label}</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.ink }}>{value}</Typography>
          </Box>
        ))}

        {/* Theme toggle */}
        <Box
          component="button"
          onClick={toggleMode}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', p: '14px 18px', gap: '12px',
            borderTop: `1px solid ${tok.hairlineSoft}`,
            bgcolor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            '&:hover': { bgcolor: tok.soft },
          }}
        >
          <Typography sx={{ fontSize: 13, color: tok.muted }}>Theme</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.ink }}>
              {mode === 'dark' ? 'Dark' : 'Light'}
            </Typography>
            <ChevronRightIcon sx={{ fontSize: 16, color: tok.dim }} />
          </Box>
        </Box>
      </Box>

      {/* Danger row */}
      <Box sx={{ bgcolor: tok.surface, border: `1px solid ${tok.hairline}`, borderRadius: '12px' }}>
        <Box
          component="button"
          onClick={async () => { await logout(); navigate('/login', { replace: true }); }}
          sx={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', p: '14px 18px',
            bgcolor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: tok.dangerInk, borderRadius: '12px',
            '&:hover': { bgcolor: tok.dangerBg },
          }}
        >
          <LogoutIcon sx={{ fontSize: 18, color: tok.dangerInk }} />
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: tok.dangerInk }}>{t('nav.logout')}</Typography>
        </Box>
      </Box>

    </Box>
  );
}
