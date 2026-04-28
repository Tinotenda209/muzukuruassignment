import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  LinearProgress,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExitToApp as LogoutIcon,
  ChecklistRtl as LogoIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assignment as EmptyIcon,
} from '@mui/icons-material';

import {
  fetchTodos,
  fetchProtected,
  createTodo,
  updateTodo,
  deleteTodo,
  getErrorMessage,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import AppSnackbar from '../components/AppSnackbar';
import type { Todo, SnackbarState } from '../types';

type FilterTab = 'all' | 'active' | 'completed';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // My awesome add task dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Inline edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // My filter tabs for organizing tasks
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));
  const notify = (message: string, severity: SnackbarState['severity']) =>
    setSnackbar({ open: true, message, severity });

  // ── My data loading magic: check auth and fetch my todos ─────────────────────────────────────
  const loadData = useCallback(async () => {
    setPageLoading(true);
    try {
      await fetchProtected(); // My token verification step
      const data = await fetchTodos();
      setTodos(data);
    } catch {
      notify('Session expired. Please log in again.', 'error');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } finally {
      setPageLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ── My logout handler ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── My task creation logic ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      notify('Title cannot be empty.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const todo = await createTodo(newTitle.trim(), newDesc.trim());
      setTodos((prev) => [todo, ...prev]);
      setAddOpen(false);
      setNewTitle('');
      setNewDesc('');
      notify('Task added!', 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── My toggle completion feature ───────────────────────────────────────────────────────
  const handleToggle = async (todo: Todo) => {
    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  // ── My inline editing system ───────────────────────────────────────────────────────────
  const startEdit = (todo: Todo) => {
    setEditId(todo.id);
    setEditTitle(todo.title);
    setEditDesc(todo.description);
  };

  const cancelEdit = () => setEditId(null);

  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim()) {
      notify('Title cannot be empty.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await updateTodo(id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
      });
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditId(null);
      notify('Task updated.', 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── My delete task functionality ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    setActionLoading(true);
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      notify('Task deleted.', 'info');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── My smart filtering logic ────────────────────────────────────────────────────────────────
  const filtered = todos.filter((t) => {
    if (filterTab === 'active') return !t.completed;
    if (filterTab === 'completed') return t.completed;
    return true;
  });

  const completedCount = todos.filter((t) => t.completed).length;
  const progress = todos.length ? (completedCount / todos.length) * 100 : 0;

  // ── My rendering section ────────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading your tasks…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />

      {/* My custom app bar */}
      <AppBar position="sticky" elevation={2}>
        <Toolbar>
          <LogoIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            My Tasks
          </Typography>
          <Avatar
            sx={{
              bgcolor: 'secondary.main',
              width: 34,
              height: 34,
              fontSize: 14,
              mr: 1,
            }}
          >
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Typography
            variant="body2"
            sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}
          >
            {user?.username}
          </Typography>
          <Tooltip title="Sign out">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>

        {/* My progress indicator */}
        {todos.length > 0 && (
          <LinearProgress
            variant="determinate"
            value={progress}
            color="secondary"
            sx={{ height: 4 }}
          />
        )}
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4, pb: 12 }}>
        {/* My task statistics */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={`${todos.length} Total`} variant="outlined" />
          <Chip
            label={`${todos.length - completedCount} Active`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${completedCount} Completed`}
            color="success"
            variant="outlined"
          />
        </Box>

        {/* Filter tabs */}
        <Tabs
          value={filterTab}
          onChange={(_e, v: FilterTab) => setFilterTab(v)}
          sx={{ mb: 3, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}
          TabIndicatorProps={{ sx: { height: 3, borderRadius: 1.5 } }}
        >
          <Tab label="All" value="all" />
          <Tab label="Active" value="active" />
          <Tab label="Completed" value="completed" />
        </Tabs>

        {/* Action loading bar */}
        {actionLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* Empty state */}
        {filtered.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <EmptyIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">
              {filterTab === 'all'
                ? 'No tasks yet. Add one!'
                : `No ${filterTab} tasks.`}
            </Typography>
          </Box>
        )}

        {/* Todo list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map((todo) => (
            <Card
              key={todo.id}
              elevation={1}
              sx={{
                borderRadius: 2,
                borderLeft: '4px solid',
                borderColor: todo.completed ? 'success.main' : 'primary.main',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: 4 },
                opacity: todo.completed ? 0.85 : 1,
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                {editId === todo.id ? (
                  /* ── Edit mode ── */
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <TextField
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      label="Title"
                      size="small"
                      fullWidth
                      autoFocus
                    />
                    <TextField
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      label="Description (optional)"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSaveEdit(todo.id)}
                        disabled={actionLoading}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  /* ── View mode ── */
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onChange={() => handleToggle(todo)}
                      color="success"
                      sx={{ mt: -0.5 }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="body1"
                        fontWeight={500}
                        sx={{
                          textDecoration: todo.completed
                            ? 'line-through'
                            : 'none',
                          color: todo.completed
                            ? 'text.disabled'
                            : 'text.primary',
                        }}
                      >
                        {todo.title}
                      </Typography>
                      {todo.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.3 }}
                        >
                          {todo.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <Tooltip title="Edit task">
                        <IconButton
                          size="small"
                          onClick={() => startEdit(todo)}
                          disabled={actionLoading}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete task">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(todo.id)}
                          disabled={actionLoading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* FAB – add task */}
      <Fab
        color="primary"
        aria-label="Add task"
        onClick={() => setAddOpen(true)}
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        <AddIcon />
      </Fab>

      {/* Add dialog */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>New Task</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Title *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            fullWidth
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate();
            }}
          />
          <TextField
            label="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAddOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={actionLoading || !newTitle.trim()}
            startIcon={
              actionLoading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />
            }
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
