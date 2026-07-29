/**
 * User Store - 用户状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../lib/api';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => set({ token }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'vocabmaster-user',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Rehydrate isAuthenticated based on persisted user/token
        if (state && state.user) {
          state.isAuthenticated = true;
        }
      },
    }
  )
);
