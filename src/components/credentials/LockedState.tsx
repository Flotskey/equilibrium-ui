import { Lock } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';

interface LockedStateProps {
  title: string;
  description: string;
  buttonText: string;
  onUnlock: () => void;
  disabled?: boolean;
}

export const LockedState = ({
  title,
  description,
  buttonText,
  onUnlock,
  disabled = false
}: LockedStateProps) => {
  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          background: 'repeating-linear-gradient(45deg, #fff, #fff 2px, transparent 2px, transparent 8px)',
          pointerEvents: 'none'
        }}
      />
      
      <Lock
        sx={{
          fontSize: 48,
          color: 'text.secondary',
          mb: 2,
          opacity: 0.6
        }}
      />
      
      <Typography
        variant="h6"
        sx={{
          mb: 1,
          fontWeight: 600,
          color: 'text.primary'
        }}
      >
        {title}
      </Typography>
      
      <Typography
        variant="body2"
        sx={{
          mb: 3,
          color: 'text.secondary',
          maxWidth: 300,
          lineHeight: 1.5
        }}
      >
        {description}
      </Typography>
      
      <Button
        variant="contained"
        onClick={onUnlock}
        disabled={disabled}
        startIcon={<Lock />}
        sx={{
          px: 3,
          py: 1.5,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
          }
        }}
      >
        {buttonText}
      </Button>
    </Paper>
  );
}; 