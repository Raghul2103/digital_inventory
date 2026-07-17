import axios from 'axios';

const customFetch = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send cookies along with request
});

// Request Interceptor: Add Bearer header if accessToken is stored in localStorage
customFetch.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Automatically refresh expired tokens
customFetch.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized (401) and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if refresh token call fails
      if (originalRequest.url === '/auth/refresh-token' || originalRequest.url === '/auth/login') {
        localStorage.removeItem('token');
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Try to obtain a new access token via HTTP-only refresh cookie
        const response = await axios.post(
          `${customFetch.defaults.baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (response.data && response.data.token) {
          const newToken = response.data.token;
          localStorage.setItem('token', newToken);
          
          // Update original request auth headers and execute
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return customFetch(originalRequest);
        }
      } catch (refreshError) {
        console.error('Refresh token expired or invalid:', refreshError.message);
        localStorage.removeItem('token');
        // Clear global session by redirecting if necessary
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Standard API error message extraction
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    error.friendlyMessage = message;

    return Promise.reject(error);
  }
);

export default customFetch;
