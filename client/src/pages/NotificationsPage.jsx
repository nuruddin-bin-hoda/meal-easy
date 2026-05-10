import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Alert, Box, Button, Card, Chip, CircularProgress,
  Container, Divider, List, ListItem, ListItemText, Typography,
} from '@mui/material';
import api from '../api/axios';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/notifications?limit=100');
      setNotifications(res.data.data ?? []);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    setMarkingId(id);
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? res.data : n)));
    } catch {}
    setMarkingId(null);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Notifications
        </Typography>
        {unreadCount > 0 && (
          <Chip label={`${unreadCount} unread`} color="primary" size="small" />
        )}
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">No notifications yet.</Alert>
      )}

      {!loading && notifications.length > 0 && (
        <Card elevation={2}>
          <List disablePadding>
            {notifications.map((n, i) => (
              <Box key={n._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 2, py: 1.5,
                    bgcolor: n.isRead ? 'transparent' : 'primary.50',
                    gap: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                          variant="body1"
                          fontWeight={n.isRead ? 400 : 600}
                          component="span"
                        >
                          {n.message}
                        </Typography>
                        {!n.isRead && (
                          <Chip label="New" color="primary" size="small" />
                        )}
                      </Box>
                    }
                    secondary={format(new Date(n.createdAt), 'dd MMM yyyy, HH:mm')}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  {!n.isRead && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => markRead(n._id)}
                      disabled={markingId === n._id}
                      sx={{ flexShrink: 0, alignSelf: 'center', ml: 1 }}
                    >
                      {markingId === n._id
                        ? <CircularProgress size={16} color="inherit" />
                        : 'Mark Read'}
                    </Button>
                  )}
                </ListItem>
                {i < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Card>
      )}
    </Container>
  );
}
