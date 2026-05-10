import { useState, useEffect } from 'react';
import { Badge, IconButton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      try {
        const res = await api.get('/notifications?limit=100');
        if (!cancelled) {
          setUnreadCount((res.data.data ?? []).filter((n) => !n.isRead).length);
        }
      } catch {}
    };

    fetch();
    const timer = setInterval(fetch, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <IconButton
      color="inherit"
      onClick={() => navigate('/notifications')}
      aria-label="Notifications"
    >
      <Badge badgeContent={unreadCount || null} color="error" max={99}>
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
}
