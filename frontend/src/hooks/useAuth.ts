/**
 * useAuth Hook - 用户认证业务逻辑
 */

import { useState } from 'react';
import { useUserStore } from '../stores/userStore';
import * as api from '../lib/api';

export function useAuth() {
  const { user, token, isAuthenticated, setUser, setToken, logout: logoutStore } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const newUser = await api.register(username, email, password);
      return newUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const tokenData = await api.login(username, password);
      setToken(tokenData.access_token);

      // Get user info
      const userInfo = await api.getCurrentUser(tokenData.access_token);
      setUser(userInfo);

      return userInfo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutStore();
  };

  const clearError = () => setError(null);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    register,
    login,
    logout,
    clearError,
  };
}
