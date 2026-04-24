import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 30000
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token) {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token));
  failedQueue = [];
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: token => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        const res = await api.post('/api/auth/refresh', { refreshToken }); // ✅ FIX

        const { accessToken, refreshToken: newRefresh } = res.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;

        return api(original);

      } catch (refreshErr) {
        processQueue(refreshErr, null);

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        window.location.href = '/login';

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;