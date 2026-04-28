import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  ChecklistRtl as LogoIcon,
} from '@mui/icons-material';

import { loginUser, getErrorMessage } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import AppSnackbar from '../components/AppSnackbar';
import type { SnackbarState, User } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const notify = (message: string, severity: SnackbarState['severity']) =>
    setSnackbar({ open: true, message, severity });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser(email.trim(), password);

      const user: User = {
        id: data.user_id,
        username: data.username,
        email: email.trim(),
      };

      login(data.access_token, user);

      // ✅ (ii) Successful authentication notification
      notify(`Welcome back, ${data.username}! Redirecting…`, 'success');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err: unknown) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #01579b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />

      <Container maxWidth="xs">
        <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {/* Header */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              px: 4,
              pt: 4,
              pb: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
            }}
          >
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                p: 1.5,
                mb: 1.5,
              }}
            >
              <LogoIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>
              Sign In
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              Access your tasks
            </Typography>
          </Box>

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              px: 4,
              py: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
              autoComplete="email"
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <LoginIcon />
                )
              }
              sx={{ mt: 0.5, py: 1.4, fontWeight: 700, borderRadius: 2 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" fontWeight={600}>
                Register
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
