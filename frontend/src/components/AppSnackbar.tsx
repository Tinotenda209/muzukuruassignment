import { Snackbar, Alert } from '@mui/material';
import type { SnackbarState } from '../types';

interface Props {
  snackbar: SnackbarState;
  onClose: () => void;
}

export default function AppSnackbar({ snackbar, onClose }: Props) {
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: '100%', borderRadius: 2 }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}
