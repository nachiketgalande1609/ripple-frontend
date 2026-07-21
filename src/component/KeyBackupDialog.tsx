import { useState } from 'react';
import { Box, Typography, TextField, Button, Dialog, DialogContent, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

interface Props {
  mode: 'backup' | 'restore';
  open: boolean;
  onSubmit: (password: string) => Promise<void>;
  onSkip?: () => void;
}

export default function KeyBackupDialog({ mode, open, onSubmit, onSkip }: Props) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(password);
    } catch {
      setError(mode === 'restore' ? 'Incorrect password. Please try again.' : 'Failed to back up keys. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 1 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: 'rgba(124,92,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockOutlinedIcon sx={{ color: '#7c5cfc', fontSize: 22 }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5, color: (t) => t.palette.text.primary }}>
              {mode === 'backup' ? 'Back up your messages' : 'Restore your messages'}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: (t) => t.palette.text.secondary, lineHeight: 1.6 }}>
              {mode === 'backup'
                ? 'Enter your account password to securely back up your encryption keys. This lets you read messages on other devices.'
                : 'Enter your account password to restore your encryption keys and read your messages on this device.'}
            </Typography>
          </Box>

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            placeholder="Account password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            error={!!error}
            helperText={error}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPassword(p => !p)} edge="end">
                    {showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: '10px', fontSize: '0.875rem' }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />

          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            {onSkip && (
              <Button fullWidth onClick={onSkip} sx={{ textTransform: 'none', borderRadius: '10px', color: (t) => t.palette.text.disabled, '&:hover': { bgcolor: (t) => t.palette.action.hover } }}>
                {mode === 'restore' ? 'Start fresh' : 'Skip for now'}
              </Button>
            )}
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={!password.trim() || loading}
              sx={{ textTransform: 'none', borderRadius: '10px', bgcolor: '#7c5cfc', '&:hover': { bgcolor: '#6b4de0' }, fontWeight: 600 }}
            >
              {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : mode === 'backup' ? 'Back up' : 'Restore'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
