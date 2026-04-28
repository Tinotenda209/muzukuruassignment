import axios, { AxiosError } from 'axios';
import type { Todo, User } from '../types';

const BASE_URL = 'http://localhost:8000';

export const api = axios.create({ baseURL: BASE_URL });

// Attach token automatically on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Extract a human-readable error message from an Axios error */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') {
      // Map backend error codes to friendly messages
      if (detail === 'USERNAME_TAKEN')
        return 'That username is already taken. Are you already registered?';
      if (detail === 'EMAIL_TAKEN')
        return 'An account with that email already exists. Try logging in instead.';
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).join(', ');
    }
  }
  return 'An unexpected error occurred. Please try again.';
}

// ── Auth ───────────────────────────────────────────────────────────────────
export async function registerUser(
  username: string,
  email: string,
  password: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/register', {
    username,
    email,
    password,
  });
  return data;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ access_token: string; username: string; user_id: number }> {
  const { data } = await api.post<{
    access_token: string;
    token_type: string;
    username: string;
    user_id: number;
  }>('/login', { email, password });
  return data;
}

export async function fetchProtected(): Promise<User & { message: string }> {
  const { data } = await api.get<User & { message: string }>('/protected');
  return data;
}

// ── Todos ──────────────────────────────────────────────────────────────────
export async function fetchTodos(): Promise<Todo[]> {
  const { data } = await api.get<Todo[]>('/todos');
  return data;
}

export async function createTodo(
  title: string,
  description: string,
): Promise<Todo> {
  const { data } = await api.post<Todo>('/todos', { title, description });
  return data;
}

export async function updateTodo(
  id: number,
  patch: { title?: string; description?: string; completed?: boolean },
): Promise<Todo> {
  const { data } = await api.put<Todo>(`/todos/${id}`, patch);
  return data;
}

export async function deleteTodo(id: number): Promise<void> {
  await api.delete(`/todos/${id}`);
}
