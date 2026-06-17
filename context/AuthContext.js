'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest, setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const [isOnboarded, setIsOnboarded] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('hospital_username');
      const refreshToken = getRefreshToken();

      // Check onboarding status first
      try {
        const onboardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/onboard-status`);
        if (onboardRes.ok) {
          const statusData = await onboardRes.json();
          setIsOnboarded(statusData.onboarded);
          if (!statusData.onboarded) {
            setLoading(false);
            return; // Onboarding required, stop initialization
          }
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      }

      if (refreshToken && savedUser) {
        // Attempt to auto-refresh access token
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/refresh`, {
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
            setUser({ username: savedUser });
          } else {
            clearTokens();
          }
        } catch (e) {
          console.error('Auto login refresh failed:', e);
          clearTokens();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Protect pages check
  useEffect(() => {
    if (!loading) {
      if (!isOnboarded) {
        if (pathname !== '/onboard') {
          router.push('/onboard');
        }
        return;
      }

      const isPublicPath = pathname === '/login' || pathname === '/onboard';
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && isPublicPath) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router, isOnboarded]);

  const login = async (username, password) => {
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      localStorage.setItem('hospital_username', data.username);
      setUser({ username: data.username });
      router.push('/');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Invalid credentials' };
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (e) {
      console.error('Logout API call failed:', e);
    } finally {
      clearTokens();
      setUser(null);
      router.push('/login');
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          username: user.username,
          oldPassword,
          newPassword
        }),
      });

      // After password change, backend revokes all tokens, so we log out locally too
      clearTokens();
      setUser(null);
      router.push('/login');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to change password' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
