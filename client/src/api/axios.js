import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
});

let _loggingOut = false;
export const setLoggingOut = (val) => { _loggingOut = val; };

// Cancel outgoing requests during logout (except the logout call itself).
// This stops background polls (NotificationBell, etc.) from firing after
// setLoggingOut(true) but before their host components have unmounted.
api.interceptors.request.use((config) => {
  if (_loggingOut && config.url !== '/auth/logout') {
    return Promise.reject(Object.assign(new Error('logout in progress'), { __logoutAbort: true }));
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.__logoutAbort) return Promise.reject(err);
    if (err.response?.status === 401 && !_loggingOut) {
      if (err.response.data?.error === 'SESSION_STALE') {
        window.location.replace('/login?reason=session_stale');
      } else if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(err);
  },
);

export default api;
