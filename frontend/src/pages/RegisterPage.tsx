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
  PersonAddAlt1 as PersonAddIcon,
  ChecklistRtl as LogoIcon,
} from '@mui/icons-material';

import { registerUser, getErrorMessage } from '../api/client';
import AppSnackbar from '../components/AppSnackbar';
import type { SnackbarState } from '../types';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
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

  const notify = (
    message: string,
    severity: SnackbarState['severity'],
  ) => setSnackbar({ open: true, message, severity });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (username.trim().length < 3) {
      notify('Username must be at least 3 characters.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify('Please enter a valid email address.', 'error');
      return;
    }
    if (password.length < 6) {
      notify('Password must be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(username.trim(), email.trim(), password);
      // ✅ (iii) Successfully registered
      notify(res.message || 'Account created! Redirecting to login…', 'success');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      // ✅ (i) Already registered detection
      const isAlreadyRegistered =
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('taken');
      notify(msg, isAlreadyRegistered ? 'warning' : 'error');
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
        <Paper
          elevation={8}
          sx={{ borderRadius: 3, overflow: 'hidden' }}
        >
          {/* Header band */}
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
              Create Account
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              Join To-Do App today
            </Typography>
          </Box>

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ px: 4, py: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              autoFocus
              inputProps={{ minLength: 3 }}
              helperText="At least 3 characters"
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              helperText="At least 6 characters"
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
                  <PersonAddIcon />
                )
              }
              sx={{ mt: 0.5, py: 1.4, fontWeight: 700, borderRadius: 2 }}
            >
              {loading ? 'Creating account…' : 'Register'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
