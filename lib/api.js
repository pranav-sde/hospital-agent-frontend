import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

let inMemoryToken = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => {
  return inMemoryToken;
};

export const getRefreshToken = () => {
  return Cookies.get('hospital_refresh_token');
};

export const setRefreshToken = (token) => {
  if (token) {
    Cookies.set('hospital_refresh_token', token, { 
      expires: 7, 
      secure: true, 
      sameSite: 'strict' 
    });
  } else {
    Cookies.remove('hospital_refresh_token');
  }
};

export const clearTokens = () => {
  inMemoryToken = null;
  Cookies.remove('hospital_refresh_token');
  localStorage.removeItem('hospital_username');
};

// Custom fetch wrapper
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Setup headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Auth bearer token if available
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, fetchOptions);

    // If unauthorized, attempt to refresh token
    if (response.status === 401 && endpoint !== '/api/auth/login' && endpoint !== '/api/auth/refresh') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${getAccessToken()}`;
        response = await fetch(url, fetchOptions);
      } else {
        // Refresh failed, clear tokens and redirect to login if in browser
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
}

async function attemptTokenRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken); // Rotated token
      return true;
    }
  } catch (e) {
    console.error('Failed to refresh token:', e);
  }
  return false;
}
