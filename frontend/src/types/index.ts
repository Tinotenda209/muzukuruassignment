export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  owner_id: number;
  created_at: string | null;
}

export interface ApiError {
  detail: string;
}

export type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}
