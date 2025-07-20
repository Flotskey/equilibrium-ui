import { useNotify } from '@/components/NotificationProvider';
import { createConnection, fetchRequiredCredentials } from '@/services/api';
import { CredentialEncryptionService } from '@/services/encryption';
import { CcxtRequiredCredentials, ExchangeCredentialsDto } from '@/services/types';
import { useCredentialsStore } from '@/store/credentialsStore';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';

interface ExchangeCredentialsModalProps {
  open: boolean;
  onClose: () => void;
  exchangeId: string;
  onCredentialsSaved?: () => void;
}

const CREDENTIAL_FIELDS = [
  { key: 'apiKey', label: 'API Key', type: 'password' },
  { key: 'secret', label: 'Secret Key', type: 'password' },
  { key: 'uid', label: 'UID', type: 'password' },
  { key: 'login', label: 'Login', type: 'text' },
  { key: 'password', label: 'Password', type: 'password' },
  { key: 'twofa', label: '2FA Code', type: 'text' },
  { key: 'privateKey', label: 'Private Key', type: 'password' },
  { key: 'walletAddress', label: 'Wallet Address', type: 'text' },
  { key: 'token', label: 'Token', type: 'password' },
] as const;

const steps = ['Enter Credentials', 'Set Encryption Password', 'Enter Encryption Password'];

export const ExchangeCredentialsModal = ({
  open,
  onClose,
  exchangeId,
  onCredentialsSaved
}: ExchangeCredentialsModalProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requiredFields, setRequiredFields] = useState<CcxtRequiredCredentials | null>(null);
  const [credentials, setCredentials] = useState<ExchangeCredentialsDto>({});
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notify = useNotify();
  const { 
    refreshAllCredentials, 
    getEncryptionPassword, 
    setEncryptionPassword: storePassword,
    clearEncryptionPassword 
  } = useCredentialsStore();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      // Check if we have encrypted credentials for this exchange
      const hasEncryptedCredentials = CredentialEncryptionService.hasCredentials(exchangeId);
      
      if (hasEncryptedCredentials) {
        // Skip to password entry step (step 3) if we have encrypted credentials
        setActiveStep(2);
        setEncryptionPassword('');
        
        // Check if we have a stored password for this exchange
        const storedPassword = getEncryptionPassword(exchangeId);
        if (storedPassword) {
          // Validate stored password using the new validation function
          CredentialEncryptionService.validateCredentials(exchangeId, storedPassword).then(isValid => {
            if (isValid) {
              CredentialEncryptionService.decryptCredentials(exchangeId, storedPassword).then(decryptedCredentials => {
                if (decryptedCredentials) {
                  setEncryptionPassword(storedPassword);
                  // Set the decrypted credentials in state for display purposes only
                  // Don't auto-save - let user decide if they want to update
                  setCredentials(decryptedCredentials);
                }
              });
            } else {
              // Stored password is invalid, clear it and let user enter new one
              setEncryptionPassword('');
              // Clear the invalid password from sessionStorage
              clearEncryptionPassword(exchangeId);
            }
          });
        }
      } else {
        // Start with credentials step if no encrypted credentials exist
        setActiveStep(0);
        setCredentials({});
        setEncryptionPassword('');
        fetchRequiredFields();
      }
      
      setError(null);
    }
  }, [open, exchangeId, getEncryptionPassword]);

  const fetchRequiredFields = async () => {
    try {
      setLoading(true);
      const fields = await fetchRequiredCredentials(exchangeId);
      setRequiredFields(fields);
    } catch (error) {
      setError('Failed to fetch required fields');
      notify({ message: 'Failed to fetch required fields', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialChange = (field: keyof ExchangeCredentialsDto, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test connection with backend
      await createConnection(exchangeId, credentials);
      
      // If successful, move to password step
      setActiveStep(1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setError(errorMessage);
      notify({ message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentialsWithPassword = async (password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Encrypt and store credentials
      await CredentialEncryptionService.encryptAndStore(
        exchangeId,
        credentials,
        password
      );
      
      // Store the password in the store for future use
      storePassword(exchangeId, password);
      
      notify({ message: 'Credentials saved successfully', severity: 'success' });
      onCredentialsSaved?.();
      onClose();
      
      // Delay the refresh to prevent immediate connection test
      // This prevents duplicate createConnection calls
      setTimeout(() => {
        refreshAllCredentials();
      }, 100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save credentials';
      setError(errorMessage);
      notify({ message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!encryptionPassword.trim()) {
      setError('Please enter an encryption password');
      return;
    }

    // Only validate password if there are encrypted credentials in localStorage
    const hasEncryptedCredentials = CredentialEncryptionService.hasCredentials(exchangeId);
    if (hasEncryptedCredentials) {
      // Validate password using the new validation function
      const isValid = await CredentialEncryptionService.validateCredentials(exchangeId, encryptionPassword);
      if (!isValid) {
        setError('Invalid encryption password. Please try again.');
        return;
      }
    }

    await handleSaveCredentialsWithPassword(encryptionPassword);
  };

  const handleUnlockCredentials = async () => {
    if (!encryptionPassword.trim()) {
      setError('Please enter your encryption password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to decrypt credentials with the provided password
      const decryptedCredentials = await CredentialEncryptionService.decryptCredentials(exchangeId, encryptionPassword);
      
      if (!decryptedCredentials || Object.keys(decryptedCredentials).length === 0) {
        setError('Invalid encryption password. Please try again.');
        return;
      }

      // Store the password in the store for future use
      storePassword(exchangeId, encryptionPassword);
      
      // Set the decrypted credentials in state
      setCredentials(decryptedCredentials);
      
      notify({ message: 'Credentials unlocked successfully', severity: 'success' });
      onCredentialsSaved?.();
      onClose();
      
      // Delay the refresh to prevent immediate connection test
      setTimeout(() => {
        refreshAllCredentials();
      }, 100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlock credentials';
      setError(errorMessage);
      notify({ message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !loading) {
      event.preventDefault();
      if (activeStep === 0) {
        handleCreateConnection();
      } else if (activeStep === 1) {
        handleSaveCredentials();
      } else if (activeStep === 2) {
        handleUnlockCredentials();
      }
    }
  };

  const renderCredentialFields = () => {
    if (!requiredFields) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {CREDENTIAL_FIELDS.map(({ key, label, type }) => {
          if (!requiredFields[key]) return null;
          
          return (
            <TextField
              key={key}
              label={label}
              type={type}
              value={credentials[key] || ''}
              onChange={(e) => handleCredentialChange(key, e.target.value)}
              fullWidth
              required
              disabled={loading}
            />
          );
        })}
      </Box>
    );
  };

  const renderPasswordStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {Object.keys(credentials).length > 0 
          ? "Enter your encryption password to update your existing exchange credentials."
          : "Enter a password to encrypt your exchange credentials. This password will be required to access your credentials in the future."
        }
      </Typography>
      
      <TextField
        label="Encryption Password"
        type={showPassword ? 'text' : 'password'}
        value={encryptionPassword}
        onChange={(e) => setEncryptionPassword(e.target.value)}
        fullWidth
        required
        disabled={loading}
        slotProps={{
          input: {
            endAdornment: (
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            ),
          }
        }}
      />
      
      <Typography variant="caption" color="text.secondary">
        ⚠️ Remember this password! It cannot be recovered if lost.
      </Typography>
    </Box>
  );

  const renderUnlockStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter your encryption password to unlock your existing exchange credentials.
      </Typography>
      
      <TextField
        label="Encryption Password"
        type={showPassword ? 'text' : 'password'}
        value={encryptionPassword}
        onChange={(e) => setEncryptionPassword(e.target.value)}
        fullWidth
        required
        disabled={loading}
        slotProps={{
          input: {
            endAdornment: (
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            ),
          }
        }}
      />
      
      <Typography variant="caption" color="text.secondary">
        Enter the password you used to encrypt your credentials.
      </Typography>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth 
      disableScrollLock={true}
      onKeyPress={handleKeyPress}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lock />
          <Typography variant="h6">
            {exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1)} Credentials
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {activeStep === 0 && renderCredentialFields()}
        {activeStep === 1 && renderPasswordStep()}
        {activeStep === 2 && renderUnlockStep()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        
        {activeStep === 0 && (
          <Button
            onClick={handleCreateConnection}
            variant="contained"
            disabled={loading || !requiredFields}
          >
            Apply
          </Button>
        )}
        
        {activeStep === 1 && (
          <Button
            onClick={handleSaveCredentials}
            variant="contained"
            disabled={loading || !encryptionPassword.trim()}
          >
            Apply
          </Button>
        )}

        {activeStep === 2 && (
          <Button
            onClick={handleUnlockCredentials}
            variant="contained"
            disabled={loading || !encryptionPassword.trim()}
          >
            Unlock
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}; 