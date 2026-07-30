/**
 * API Client - 封装后端 API 调用
 */

import { apiFetch, type ApiResponse } from '../adapters';

// 从环境变量获取 API 地址，默认本地开发地址
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:8000/api';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface WordBank {
  id: number;
  name: string;
  description: string | null;
  total_words: number;
}

export interface Word {
  id: number;
  spelling: string;
  phonetic: string | null;
  pronunciation_url: string | null;
  meaning: string;
  example_sentence: string | null;
}

export interface Progress {
  word_id: number;
  is_mastered: boolean;
  mastered_at: string | null;
}

export interface ProgressStats {
  total_words: number;
  mastered_words: number;
  progress_percentage: number;
}

// Auth API
export async function register(username: string, email: string, password: string): Promise<User> {
  const response = await apiFetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

export async function login(username: string, password: string): Promise<Token> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  let response: ApiResponse;
  try {
    response = await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
  } catch (err) {
    // Network failure (proxy error, fetch exception, etc.)
    throw new Error('无法连接到服务器，请检查后端是否正常运行');
  }

  if (!response.ok) {
    const error = await response.json();
    // Distinguish 401 (auth failure) from other errors
    if (response.status === 401) {
      throw new Error(error.detail || '用户名或密码错误');
    }
    throw new Error(error.detail || '登录失败');
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await apiFetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
}

// Word Bank API
export async function getWordBanks(): Promise<WordBank[]> {
  const response = await apiFetch(`${API_BASE}/word-banks`);

  if (!response.ok) {
    throw new Error('Failed to get word banks');
  }

  return response.json();
}

export async function getWords(wordBankId: number, skip = 0, limit = 20): Promise<{ words: Word[]; total: number }> {
  const response = await apiFetch(`${API_BASE}/word-banks/${wordBankId}/words?skip=${skip}&limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to get words');
  }

  return response.json();
}

export async function getWord(wordId: number): Promise<Word> {
  const response = await apiFetch(`${API_BASE}/words/${wordId}`);

  if (!response.ok) {
    throw new Error('Failed to get word');
  }

  return response.json();
}

// Progress API
export async function getProgress(wordBankId: number, token: string): Promise<Progress[]> {
  const response = await apiFetch(`${API_BASE}/progress/${wordBankId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get progress');
  }

  return response.json();
}

export async function getProgressStats(wordBankId: number, token: string): Promise<ProgressStats> {
  const response = await apiFetch(`${API_BASE}/progress/${wordBankId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get progress stats');
  }

  return response.json();
}

export async function markWordMastered(wordId: number, token: string): Promise<Progress> {
  const response = await apiFetch(`${API_BASE}/progress/${wordId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to mark word as mastered');
  }

  return response.json();
}

export async function unmarkWordMastered(wordId: number, token: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/progress/${wordId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to unmark word');
  }
}

export async function changePassword(oldPassword: string, newPassword: string, token: string): Promise<{ message: string }> {
  const response = await apiFetch(`${API_BASE}/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 400) {
      throw new Error(error.detail || '密码修改失败');
    }
    if (response.status === 422) {
      throw new Error(error.detail?.message || '密码强度不足');
    }
    throw new Error(error.detail || '密码修改失败');
  }

  return response.json();
}
