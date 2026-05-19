import { createContext, useContext, useEffect, useState } from 'react';
import api, { setLoggingOut } from '../api/axios';

const AuthContext = createContext(null);

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    await api.post('/notifications/subscribe', { subscription });
  } catch (err) {
    console.warn('[push] subscription failed:', err);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  // Subscribe to push notifications whenever a user session starts
  useEffect(() => {
    if (!user) return;
    subscribeToPush();
  }, [user?._id]);

  const login = async (userData) => {
    setLoggingOut(false);
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch {
      setUser(userData);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    setUser(null);     // unmount UI immediately — stops NotificationBell's interval
    try {
      await api.post('/auth/logout');
    } catch {
      // cookie cleared server-side regardless; safe to ignore errors
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
