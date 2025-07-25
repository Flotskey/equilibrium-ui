import { useNotify } from '@/components/NotificationProvider';
import { fetchLeverageTiers, setLeverage } from '@/services/api';
import { CcxtLeverageTier } from '@/services/types';
import { Close } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';

interface LeverageModalProps {
  open: boolean;
  onClose: () => void;
  currentLeverage?: number;
  onConfirm: (leverage: number) => void;
  loading: boolean;
  exchangeId?: string;
  symbol?: string;
}

export const LeverageModal = ({ 
  open, 
  onClose, 
  currentLeverage, 
  onConfirm, 
  loading,
  exchangeId,
  symbol
}: LeverageModalProps) => {
  const [leverage, setLeverageLocal] = useState(currentLeverage || 3);
  const [leverageInput, setLeverageInput] = useState((currentLeverage || 3).toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leverageTiers, setLeverageTiers] = useState<CcxtLeverageTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const notify = useNotify();

  // Fetch leverage tiers when modal opens
  useEffect(() => {
    const fetchTiers = async () => {
      if (!open || !exchangeId || !symbol) return;

      setTiersLoading(true);
      try {
        const tiers = await fetchLeverageTiers({
          exchangeId,
          symbols: [symbol]
        });
        setLeverageTiers(tiers);
      } catch (error) {
        console.error('Failed to fetch leverage tiers:', error);
        // Fallback to default tiers if API fails
        setLeverageTiers([]);
      } finally {
        setTiersLoading(false);
      }
    };

    fetchTiers();
  }, [open, exchangeId, symbol]);

  // Update internal state when currentLeverage prop changes
  useEffect(() => {
    if (currentLeverage !== undefined) {
      setLeverageLocal(currentLeverage);
      setLeverageInput(currentLeverage.toString());
    }
  }, [currentLeverage]);

  const handleLeverageChange = (value: number | number[]) => {
    const newLeverage = value as number;
    setLeverageLocal(newLeverage);
    setLeverageInput(newLeverage.toString());
  };

  const handleInputChange = (value: string) => {
    setLeverageInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setLeverageLocal(numValue);
    }
  };

  const handleConfirm = async () => {
    if (!exchangeId || !symbol) {
      notify({ message: 'Exchange and symbol are required', severity: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Call setLeverage API but don't rely on its response structure
      await setLeverage({
        exchangeId,
        symbol,
        leverage
      });
      
      // Use our local leverage value instead of API response
      onConfirm(leverage);
      onClose();
      
      notify({ 
        message: `Leverage set to ${leverage}x successfully`, 
        severity: 'success' 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set leverage';
      notify({ message: errorMessage, severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate slider range and marks from leverage tiers
  const maxLeverage = leverageTiers.length > 0 
    ? Math.max(...leverageTiers.map(tier => tier.maxLeverage))
    : 100;
  
  const minLeverage = 1

  // Create marks from leverage tiers (show every 5th tier to avoid clutter)
  const marks = leverageTiers.length > 0 
    ? leverageTiers
        .filter((_, index) => index % 5 === 0 || index === leverageTiers.length - 1)
        .map(tier => ({
          value: tier.maxLeverage,
          label: `${tier.maxLeverage}x`
        }))
    : [
        { value: 1, label: '1x' },
        { value: 10, label: '10x' },
        { value: 25, label: '25x' },
        { value: 50, label: '50x' },
        { value: 100, label: '100x' }
      ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableScrollLock={true}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Adjust Leverage
        <Button onClick={onClose} sx={{ minWidth: 'auto', p: 0 }}>
          <Close />
        </Button>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Leverage: {leverage}x
          </Typography>
          
          {/* Numeric Input Field */}
          <TextField
            fullWidth
            label="Leverage"
            type="number"
            value={leverageInput}
            onChange={(e) => handleInputChange(e.target.value)}
            inputProps={{ 
              min: minLeverage, 
              max: maxLeverage, 
              step: 0.1 
            }}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                endAdornment: <Typography variant="caption">x</Typography>
              }
            }}
          />
          
          <Box sx={{ px: 1.5, mb: 2 }}>
            {tiersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Slider
                value={leverage}
                onChange={(_, value) => handleLeverageChange(value)}
                min={minLeverage}
                max={maxLeverage}
                step={0.1}
                marks={marks}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Max position size at {leverage}x leverage: 0.00 USDT
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Margin required: 0 USDT
          </Typography>
          {leverageTiers.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Available leverage range: {minLeverage}x - {maxLeverage}x
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={isSubmitting || leverage <= 0}
        >
          {isSubmitting ? <CircularProgress size={20} /> : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 