/**
 * useOverview Hook - 首页整体学习进度概览业务逻辑
 * REQ-UI-005: 首页 Hero 区展示跨全部词库的整体学习进度概览
 */

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../stores/userStore';
import * as api from '../lib/api';
import type { ProgressOverview } from '../lib/api';

export function useOverview() {
  const { token } = useUserStore();
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    // Overview is a per-user aggregate; without a token there is nothing to show.
    if (!token) {
      setOverview(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getProgressOverview(token);
      setOverview(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load overview';
      setError(message);
      // Keep any previously-loaded overview so a transient failure does not
      // blank out the Hero; the section degrades gracefully to library stats.
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Load once the token is available (login / rehydrate) and refresh when it changes.
  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return { overview, isLoading, error, loadOverview };
}
