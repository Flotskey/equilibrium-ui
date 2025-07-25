import { useNotify } from '@/components/NotificationProvider';
import { useBalance, usePrivateConnection } from '@/hooks';
import { createOrder, fetchLeverage, fetchMarginMode, fetchMarket, setMarginMode } from '@/services/api';
import { CcxtMarket } from '@/services/types';
import { buildTpSlOrderParams } from '@/utils/exchangeParams';
import { TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Select,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { ExchangeCredentialsModal } from './credentials/ExchangeCredentialsModal';
import { LockedState } from './credentials/LockedState';
import { LeverageModal } from './LeverageModal';

interface TradingManagerProps {
  selectedExchange: string | null;
  selectedSymbol?: string | null;
}

type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market' | 'stop' | 'stop_limit' | 'trailing_stop';

interface OrderFormData {
  side: OrderSide;
  type: OrderType;
  price: string;
  amount: string;
  total: string;
  percentage: number;
  takeProfit: boolean;
  stopLoss: boolean;
  tpPrice: string;
  slPrice: string;
  stopPrice?: string;
  trailingPercent?: string;
}



// Spot Trading Manager Component
const SpotTradingManager = ({ 
  selectedExchange, 
  selectedSymbol, 
  marketInfo, 
  orderData, 
  setOrderData, 
  handleSideChange, 
  handleTypeChange, 
  handleInputChange, 
  handlePercentageChange, 
  handleSubmitOrder, 
  orderLoading, 
  loading, 
  balanceLoading, 
  hasInitialData, 
  getFreeBalance 
}: any) => {
  return (
    <Paper sx={{ flex: 1, p: 2, minHeight: 240, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Buy/Sell Toggle */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={orderData.side}
          exclusive
          onChange={(_, value) => value && handleSideChange(value)}
          sx={{ width: '100%' }}
        >
          <ToggleButton 
            value="buy" 
            sx={{ 
              flex: 1, 
              backgroundColor: orderData.side === 'buy' ? 'success.main' : 'transparent',
              color: orderData.side === 'buy' ? 'white' : 'text.primary',
              '&:hover': {
                backgroundColor: orderData.side === 'buy' ? 'success.dark' : 'action.hover'
              }
            }}
          >
            <TrendingUp sx={{ mr: 1 }} />
            Buy
          </ToggleButton>
          <ToggleButton 
            value="sell"
            sx={{ 
              flex: 1,
              backgroundColor: orderData.side === 'sell' ? 'error.main' : 'transparent',
              color: orderData.side === 'sell' ? 'white' : 'text.primary',
              '&:hover': {
                backgroundColor: orderData.side === 'sell' ? 'error.dark' : 'action.hover'
              }
            }}
          >
            <TrendingDown sx={{ mr: 1 }} />
            Sell
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Order Type Selection */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={orderData.type}
          exclusive
          onChange={(_, value) => value && handleTypeChange(value)}
          size="small"
          sx={{ width: '100%' }}
        >
          <ToggleButton value="limit" sx={{ flex: 1 }}>
            Limit
          </ToggleButton>
          <ToggleButton value="market" sx={{ flex: 1 }}>
            Market
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Available Balance */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Available Balance
        </Typography>
        <Typography variant="body2">
          {balanceLoading ? (
            <CircularProgress size={16} />
          ) : marketInfo?.quote ? (
            hasInitialData ? (
              `${getFreeBalance(marketInfo.quote).toFixed(2)} ${marketInfo.quote}`
            ) : (
              <span style={{ color: '#888', fontStyle: 'italic' }}>
                No balance data
              </span>
            )
          ) : (
            `-- ${marketInfo?.quote || 'USDT'}`
          )}
        </Typography>
      </Box>

      {/* Price Input */}
      {orderData.type === 'limit' && (
        <TextField
          label={`Price (${marketInfo?.quote || 'USDT'})`}
          type="number"
          value={orderData.price}
          onChange={(e) => handleInputChange('price', e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
            }
          }}
        />
      )}

      {/* Amount Input */}
      <TextField
        label="Amount"
        type="number"
        value={orderData.amount}
        onChange={(e) => handleInputChange('amount', e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 1 }}
        slotProps={{
          input: {
            endAdornment: <Typography variant="caption">
              {marketInfo?.base || selectedSymbol?.split('/')[0] || 'COIN'}
            </Typography>
          }
        }}
      />

      {/* Percentage Slider */}
      <Box sx={{ mb: 2, px: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Use Balance
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {orderData.percentage}%
          </Typography>
        </Box>
        <Slider
          value={orderData.percentage}
          onChange={(_, value) => handlePercentageChange(value as number)}
          step={1}
          marks={[
            { value: 0, label: '0%' },
            { value: 25, label: '25%' },
            { value: 50, label: '50%' },
            { value: 75, label: '75%' },
            { value: 100, label: '100%' }
          ]}
          sx={{ mt: 1 }}
        />
        {orderData.percentage > 0 && marketInfo?.quote && hasInitialData && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Using {(getFreeBalance(marketInfo.quote) * orderData.percentage / 100).toFixed(2)} {marketInfo.quote} of {getFreeBalance(marketInfo.quote).toFixed(2)} {marketInfo.quote}
          </Typography>
        )}
      </Box>

      {/* Total Input */}
      <TextField
        label={`Total (${marketInfo?.quote || 'USDT'})`}
        type="number"
        value={orderData.total}
        onChange={(e) => handleInputChange('total', e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
          }
        }}
      />

      {/* TP/SL Checkboxes */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={orderData.takeProfit}
                  onChange={(e) => setOrderData((prev: any) => ({ ...prev, takeProfit: e.target.checked }))}
                  name="takeProfit"
                  color="success"
                />
              }
              label="TP"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={orderData.stopLoss}
                  onChange={(e) => setOrderData((prev: any) => ({ ...prev, stopLoss: e.target.checked }))}
                  name="stopLoss"
                  color="error"
                />
              }
              label="SL"
            />
          </Box>
        </Box>
      </Box>

      {/* TP/SL Price Inputs */}
      {(orderData.takeProfit || orderData.stopLoss) && (
        <Box sx={{ mb: 2 }}>
          {orderData.takeProfit && (
            <TextField
              label="Take Profit Price"
              type="number"
              value={orderData.tpPrice}
              onChange={(e) => handleInputChange('tpPrice', e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 1 }}
              slotProps={{
                input: {
                  endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
                }
              }}
            />
          )}
          {orderData.stopLoss && (
            <TextField
              label="Stop Loss Price"
              type="number"
              value={orderData.slPrice}
              onChange={(e) => handleInputChange('slPrice', e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
                }
              }}
            />
          )}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Submit Button */}
      <Button
        variant="contained"
        fullWidth
        onClick={handleSubmitOrder}
        disabled={orderLoading || !orderData.amount || (orderData.type === 'limit' && !orderData.price)}
        sx={{
          py: 1.5,
          backgroundColor: orderData.side === 'buy' ? 'success.main' : 'error.main',
          '&:hover': {
            backgroundColor: orderData.side === 'buy' ? 'success.dark' : 'error.dark'
          }
        }}
      >
        {orderLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          `${orderData.side.toUpperCase()} ${marketInfo?.base || selectedSymbol?.split('/')[0] || 'COIN'}`
        )}
      </Button>

      {/* Fees Information */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {loading ? (
            'Loading fees...'
          ) : marketInfo ? (
            `Fees: Maker ${(marketInfo.maker * 100).toFixed(2)}% / Taker ${(marketInfo.taker * 100).toFixed(2)}%`
          ) : (
            'Fees: --'
          )}
        </Typography>
      </Box>
    </Paper>
  );
};

// Perpetual Futures Trading Manager Component
const PerpTradingManager = ({ 
  selectedExchange, 
  selectedSymbol, 
  marketInfo, 
  orderData, 
  setOrderData, 
  handleSideChange, 
  handleTypeChange, 
  handleInputChange, 
  handlePercentageChange, 
  handleSubmitOrder, 
  orderLoading, 
  loading, 
  balanceLoading, 
  hasInitialData, 
  getFreeBalance 
}: any) => {
  const [leverage, setLeverageState] = useState(3);
  const [leverageModalOpen, setLeverageModalOpen] = useState(false);
  const [marginMode, setMarginModeState] = useState<'isolated' | 'cross'>('isolated');
  const [leverageLoading, setLeverageLoading] = useState(false);
  const [marginModeLoading, setMarginModeLoading] = useState(false);
  const notify = useNotify();

  // Fetch current leverage and margin mode
  useEffect(() => {
    const fetchCurrentSettings = async () => {
      if (!selectedExchange || !selectedSymbol) return;

      try {
        // Fetch current leverage
        const leverageData = await fetchLeverage({
          exchangeId: selectedExchange,
          symbol: selectedSymbol
        });
        
        // Handle exchange-specific response structure
        let currentLeverage = 3; // Default fallback
        if (leverageData && typeof leverageData === 'object') {
          const data = leverageData as any; // Cast to any to handle exchange-specific structure
          // Try different possible response structures
          if (data.longLeverage !== undefined) {
            currentLeverage = data.longLeverage;
          } else if (data.leverage !== undefined) {
            currentLeverage = typeof data.leverage === 'string' 
              ? parseFloat(data.leverage) 
              : data.leverage;
          } else if (data.maxLeverage !== undefined) {
            currentLeverage = typeof data.maxLeverage === 'string' 
              ? parseFloat(data.maxLeverage) 
              : data.maxLeverage;
          }
        }
        
        setLeverageState(currentLeverage);

        // Fetch current margin mode
        const marginModeData = await fetchMarginMode({
          exchangeId: selectedExchange,
          symbol: selectedSymbol
        });
        
        // Handle exchange-specific margin mode response structure
        let currentMarginMode: 'isolated' | 'cross' = 'isolated'; // Default fallback
        if (marginModeData && typeof marginModeData === 'object') {
          const data = marginModeData as any; // Cast to any to handle exchange-specific structure
          // Try different possible response structures
          if (data.marginMode !== undefined) {
            currentMarginMode = data.marginMode;
          } else if (data.mode !== undefined) {
            currentMarginMode = data.mode;
          } else if (data.type !== undefined) {
            currentMarginMode = data.type;
          }
        }
        
        setMarginModeState(currentMarginMode);
      } catch (error) {
        console.error('Failed to fetch current settings:', error);
      }
    };

    fetchCurrentSettings();
  }, [selectedExchange, selectedSymbol]);

  const handleLeverageChange = (newLeverage: number) => {
    setLeverageState(newLeverage);
  };

  const handleMarginModeChange = async (newMarginMode: 'isolated' | 'cross') => {
    if (!selectedExchange || !selectedSymbol) return;

    setMarginModeLoading(true);
    try {
      // Call setMarginMode API but don't rely on its response structure
      await setMarginMode({
        exchangeId: selectedExchange,
        symbol: selectedSymbol,
        marginMode: newMarginMode
      });
      
      // Use our local margin mode value instead of API response
      setMarginModeState(newMarginMode);
      
      notify({ 
        message: `Margin mode set to ${newMarginMode} successfully`, 
        severity: 'success' 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set margin mode';
      notify({ message: errorMessage, severity: 'error' });
    } finally {
      setMarginModeLoading(false);
    }
  };

  // Advanced order types for futures
  const advancedOrderTypes = [
    { value: 'limit', label: 'Limit' },
    { value: 'market', label: 'Market' },
    { value: 'stop', label: 'Stop Market' },
    { value: 'stop_limit', label: 'Stop Limit' },
    { value: 'trailing_stop', label: 'Trailing Stop' }
  ];

  return (
    <Paper sx={{ flex: 1, p: 2, minHeight: 240, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Margin Mode and Leverage Selection */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <ToggleButtonGroup
          value={marginMode}
          exclusive
          onChange={(_, value) => value && handleMarginModeChange(value)}
          size="small"
          sx={{ flex: 1 }}
          disabled={marginModeLoading}
        >
          <ToggleButton value="isolated" sx={{ flex: 1 }}>
            {marginModeLoading ? <CircularProgress size={16} /> : 'Isolated'}
          </ToggleButton>
          <ToggleButton value="cross" sx={{ flex: 1 }}>
            Cross
          </ToggleButton>
        </ToggleButtonGroup>
        
        <Button
          variant="outlined"
          size="small"
          onClick={() => setLeverageModalOpen(true)}
          disabled={leverageLoading}
          sx={{ minWidth: 80 }}
        >
          {leverageLoading ? <CircularProgress size={16} /> : `${leverage}x`}
        </Button>
      </Box>

      {/* Buy/Sell Toggle */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={orderData.side}
          exclusive
          onChange={(_, value) => value && handleSideChange(value)}
          sx={{ width: '100%' }}
        >
          <ToggleButton 
            value="buy" 
            sx={{ 
              flex: 1, 
              backgroundColor: orderData.side === 'buy' ? 'success.main' : 'transparent',
              color: orderData.side === 'buy' ? 'white' : 'text.primary',
              '&:hover': {
                backgroundColor: orderData.side === 'buy' ? 'success.dark' : 'action.hover'
              }
            }}
          >
            <TrendingUp sx={{ mr: 1 }} />
            Buy (Long)
          </ToggleButton>
          <ToggleButton 
            value="sell"
            sx={{ 
              flex: 1,
              backgroundColor: orderData.side === 'sell' ? 'error.main' : 'transparent',
              color: orderData.side === 'sell' ? 'white' : 'text.primary',
              '&:hover': {
                backgroundColor: orderData.side === 'sell' ? 'error.dark' : 'action.hover'
              }
            }}
          >
            <TrendingDown sx={{ mr: 1 }} />
            Sell (Short)
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

             {/* Advanced Order Type Selection */}
       <Box sx={{ mb: 2 }}>
         <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
           Order Type
         </Typography>
                   <Select
            value={orderData.type}
            onChange={(e) => handleTypeChange(e.target.value as OrderType)}
            size="small"
            sx={{ width: '100%' }}
            MenuProps={{
              disableScrollLock: true,
              PaperProps: {
                sx: {
                  maxHeight: 200,
                  '& .MuiSelect-select': {
                    padding: '8px 12px'
                  }
                }
              }
            }}
          >
           {advancedOrderTypes.map((type) => (
             <Box
               key={type.value}
               component="option"
               value={type.value}
               sx={{
                 padding: '8px 12px',
                 cursor: 'pointer',
                 '&:hover': {
                   backgroundColor: 'action.hover'
                 },
                 '&.Mui-selected': {
                   backgroundColor: 'primary.main',
                   color: 'primary.contrastText'
                 }
               }}
             >
               {type.label}
             </Box>
           ))}
         </Select>
       </Box>

      {/* Available Balance */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Available Balance
        </Typography>
        <Typography variant="body2">
          {balanceLoading ? (
            <CircularProgress size={16} />
          ) : marketInfo?.quote ? (
            hasInitialData ? (
              `${getFreeBalance(marketInfo.quote).toFixed(2)} ${marketInfo.quote}`
            ) : (
              <span style={{ color: '#888', fontStyle: 'italic' }}>
                No balance data
              </span>
            )
          ) : (
            `-- ${marketInfo?.quote || 'USDT'}`
          )}
        </Typography>
      </Box>

      {/* Price Input */}
      {(orderData.type === 'limit' || orderData.type === 'stop_limit') && (
        <TextField
          label={`Price (${marketInfo?.quote || 'USDT'})`}
          type="number"
          value={orderData.price}
          onChange={(e) => handleInputChange('price', e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
            }
          }}
        />
      )}

      {/* Stop Price Input for Stop Orders */}
      {(orderData.type === 'stop' || orderData.type === 'stop_limit') && (
        <TextField
          label={`Stop Price (${marketInfo?.quote || 'USDT'})`}
          type="number"
          value={orderData.stopPrice || ''}
          onChange={(e) => handleInputChange('stopPrice', e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
            }
          }}
        />
      )}

      {/* Trailing Stop Percentage */}
      {orderData.type === 'trailing_stop' && (
        <TextField
          label="Trailing Percent (%)"
          type="number"
          value={orderData.trailingPercent || ''}
          onChange={(e) => handleInputChange('trailingPercent', e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              endAdornment: <Typography variant="caption">%</Typography>
            }
          }}
        />
      )}

      {/* Amount Input */}
      <TextField
        label="Amount"
        type="number"
        value={orderData.amount}
        onChange={(e) => handleInputChange('amount', e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 1 }}
        slotProps={{
          input: {
            endAdornment: <Typography variant="caption">
              {marketInfo?.base || selectedSymbol?.split('/')[0] || 'COIN'}
            </Typography>
          }
        }}
      />

      {/* Percentage Slider */}
      <Box sx={{ mb: 2, px: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Use Balance
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {orderData.percentage}%
          </Typography>
        </Box>
        <Slider
          value={orderData.percentage}
          onChange={(_, value) => handlePercentageChange(value as number)}
          step={1}
          marks={[
            { value: 0, label: '0%' },
            { value: 25, label: '25%' },
            { value: 50, label: '50%' },
            { value: 75, label: '75%' },
            { value: 100, label: '100%' }
          ]}
          sx={{ mt: 1 }}
        />
        {orderData.percentage > 0 && marketInfo?.quote && hasInitialData && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Using {(getFreeBalance(marketInfo.quote) * orderData.percentage / 100).toFixed(2)} {marketInfo.quote} of {getFreeBalance(marketInfo.quote).toFixed(2)} {marketInfo.quote}
          </Typography>
        )}
      </Box>

      {/* Total Input */}
      <TextField
        label={`Total (${marketInfo?.quote || 'USDT'})`}
        type="number"
        value={orderData.total}
        onChange={(e) => handleInputChange('total', e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
          }
        }}
      />

      {/* Reduce-only Checkbox */}
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={false}
              onChange={() => {}}
              name="reduceOnly"
              color="primary"
            />
          }
          label="Reduce-only"
        />
      </Box>

      {/* TP/SL Checkboxes */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={orderData.takeProfit}
                  onChange={(e) => setOrderData((prev: any) => ({ ...prev, takeProfit: e.target.checked }))}
                  name="takeProfit"
                  color="success"
                />
              }
              label="TP/SL"
            />
          </Box>
        </Box>
      </Box>

      {/* TP/SL Price Inputs */}
      {orderData.takeProfit && (
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Take Profit Price"
            type="number"
            value={orderData.tpPrice}
            onChange={(e) => handleInputChange('tpPrice', e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 1 }}
            slotProps={{
              input: {
                endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
              }
            }}
          />
          <TextField
            label="Stop Loss Price"
            type="number"
            value={orderData.slPrice}
            onChange={(e) => handleInputChange('slPrice', e.target.value)}
            fullWidth
            size="small"
            slotProps={{
              input: {
                endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
              }
            }}
          />
        </Box>
      )}

      {/* Liquidation Price Display */}
      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Liquidation Price
        </Typography>
        <Typography variant="body1" fontWeight={500}>
          {orderData.side === 'buy' ? '--' : '--'} {marketInfo?.quote || 'USDT'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {marginMode === 'isolated' ? 'Isolated' : 'Cross'} • {leverage}x Leverage
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Submit Button */}
      <Button
        variant="contained"
        fullWidth
        onClick={handleSubmitOrder}
        disabled={orderLoading || !orderData.amount || (orderData.type === 'limit' && !orderData.price)}
        sx={{
          py: 1.5,
          backgroundColor: orderData.side === 'buy' ? 'success.main' : 'error.main',
          '&:hover': {
            backgroundColor: orderData.side === 'buy' ? 'success.dark' : 'error.dark'
          }
        }}
      >
        {orderLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          `${orderData.side === 'buy' ? 'Buy (Long)' : 'Sell (Short)'} ${marketInfo?.base || selectedSymbol?.split('/')[0] || 'COIN'}`
        )}
      </Button>

      {/* Fees Information */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {loading ? (
            'Loading fees...'
          ) : marketInfo ? (
            `Fees: Maker ${(marketInfo.maker * 100).toFixed(2)}% / Taker ${(marketInfo.taker * 100).toFixed(2)}%`
          ) : (
            'Fees: --'
          )}
        </Typography>
      </Box>

      {/* Leverage Modal */}
      <LeverageModal
        open={leverageModalOpen}
        onClose={() => setLeverageModalOpen(false)}
        currentLeverage={leverage}
        onConfirm={handleLeverageChange}
        loading={leverageLoading}
        exchangeId={selectedExchange}
        symbol={selectedSymbol}
      />
    </Paper>
  );
};

const TradingManager = ({ selectedExchange, selectedSymbol }: TradingManagerProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [marketInfo, setMarketInfo] = useState<CcxtMarket | null>(null);
  
  // Use custom hooks for connection and balance management
  const { hasCredentials, isConnected } = usePrivateConnection({ exchangeId: selectedExchange });
  const { getFreeBalance, loading: balanceLoading, hasInitialData } = useBalance({ exchangeId: selectedExchange });
  const notify = useNotify();

  // Order form state
  const [orderData, setOrderData] = useState<OrderFormData>({
    side: 'buy',
    type: 'limit',
    price: '',
    amount: '',
    total: '',
    percentage: 0,
    takeProfit: false,
    stopLoss: false,
    tpPrice: '',
    slPrice: ''
  });

  // Fetch market information when exchange or symbol changes
  useEffect(() => {
    const fetchMarketInfo = async () => {
      if (!selectedExchange || !selectedSymbol) {
        setMarketInfo(null);
        return;
      }

      try {
        setLoading(true);
        const market = await fetchMarket(selectedExchange, selectedSymbol);
        setMarketInfo(market);
      } catch (error) {
        console.error('Failed to fetch market info:', error);
        setMarketInfo(null);
        notify({ 
          message: 'Failed to fetch market information', 
          severity: 'warning' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMarketInfo();
  }, [selectedExchange, selectedSymbol, notify]);

  const handleUnlock = () => {
    setModalOpen(true);
  };

  // Handle order side change (buy/sell)
  const handleSideChange = (side: OrderSide) => {
    setOrderData(prev => ({ ...prev, side }));
  };

  // Handle order type change (limit/market)
  const handleTypeChange = (type: OrderType) => {
    setOrderData(prev => ({ ...prev, type }));
  };

  // Handle input changes
  const handleInputChange = (field: keyof OrderFormData, value: string | number) => {
    setOrderData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset percentage when user manually enters values
      if (field === 'price' || field === 'amount' || field === 'total') {
        newData.percentage = 0;
      }
      
      // Auto-calculate related fields
      if (field === 'price') {
        // When price changes, recalculate total from amount
        if (prev.amount && !isNaN(parseFloat(prev.amount))) {
          const calculatedTotal = calculateTotalFromAmount(prev.amount);
          if (calculatedTotal) {
            newData.total = calculatedTotal;
          }
        }
      } else if (field === 'amount') {
        // When amount changes, recalculate total
        if (prev.type === 'limit' && prev.price) {
          const calculatedTotal = calculateTotalFromAmount(value as string);
          if (calculatedTotal) {
            newData.total = calculatedTotal;
          }
        }
      } else if (field === 'total') {
        // When total changes, recalculate amount for limit orders
        if (prev.type === 'limit' && prev.price) {
          const calculatedAmount = calculateAmountFromTotal(value as string);
          if (calculatedAmount) {
            newData.amount = calculatedAmount;
          }
        }
      }
      
      return newData;
    });
  };

  // Handle percentage slider change
  const handlePercentageChange = (percentage: number) => {
    setOrderData(prev => ({ ...prev, percentage }));
    
    // Calculate amount based on available balance and percentage
    if (marketInfo?.quote && hasInitialData) {
      const availableBalance = getFreeBalance(marketInfo.quote);
      const percentageAmount = (availableBalance * percentage) / 100;
      
      if (orderData.type === 'limit' && orderData.price) {
        // For limit orders, calculate amount from total and price
        const price = parseFloat(orderData.price);
        if (!isNaN(price) && price > 0) {
          const calculatedAmount = percentageAmount / price;
          setOrderData(prev => ({
            ...prev,
            percentage,
            amount: calculatedAmount.toFixed(8),
            total: percentageAmount.toFixed(8)
          }));
        }
      } else {
        // For market orders, set total directly
        setOrderData(prev => ({
          ...prev,
          percentage,
          total: percentageAmount.toFixed(8)
        }));
      }
    }
  };

  // Calculate amount from total (when user enters total manually)
  const calculateAmountFromTotal = (total: string) => {
    if (orderData.type === 'limit' && orderData.price) {
      const totalValue = parseFloat(total);
      const price = parseFloat(orderData.price);
      if (!isNaN(totalValue) && !isNaN(price) && price > 0) {
        const calculatedAmount = totalValue / price;
        return calculatedAmount.toFixed(8);
      }
    }
    return '';
  };

  // Calculate total from amount (when user enters amount manually)
  const calculateTotalFromAmount = (amount: string) => {
    if (orderData.type === 'limit' && orderData.price) {
      const amountValue = parseFloat(amount);
      const price = parseFloat(orderData.price);
      if (!isNaN(amountValue) && !isNaN(price)) {
        const calculatedTotal = amountValue * price;
        return calculatedTotal.toFixed(8);
      }
    }
    return '';
  };

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (!selectedExchange || !selectedSymbol) {
      notify({ message: 'Please select an exchange and symbol', severity: 'error' });
      return;
    }

    if (!orderData.amount || parseFloat(orderData.amount) <= 0) {
      notify({ message: 'Please enter a valid amount', severity: 'error' });
      return;
    }

    if (orderData.type === 'limit' && (!orderData.price || parseFloat(orderData.price) <= 0)) {
      notify({ message: 'Please enter a valid price for limit orders', severity: 'error' });
      return;
    }

    setOrderLoading(true);
    try {
      const orderParams: any = {};
      
      // Get exchange-specific TP/SL parameter names
      const tpSlParams = buildTpSlOrderParams(
        selectedExchange,
        orderData.side,
        orderData.takeProfit ? orderData.tpPrice : undefined,
        orderData.stopLoss ? orderData.slPrice : undefined
      );
      
      // Add TP/SL if enabled with exchange-specific parameter names
      if (orderData.takeProfit && orderData.tpPrice) {
        // TP/SL params are now included in tpSlParams object
        Object.assign(orderParams, tpSlParams);
      }
      if (orderData.stopLoss && orderData.slPrice) {
        // TP/SL params are now included in tpSlParams object
        Object.assign(orderParams, tpSlParams);
      }

      console.log(`Creating order for ${selectedExchange} with params:`, orderParams);

      const order = await createOrder({
        exchangeId: selectedExchange,
        symbol: selectedSymbol,
        type: orderData.type,
        side: orderData.side,
        amount: parseFloat(orderData.amount),
        price: orderData.type === 'limit' ? parseFloat(orderData.price) : undefined,
        params: Object.keys(orderParams).length > 0 ? orderParams : undefined
      });

      notify({ 
        message: `${orderData.side.toUpperCase()} order placed successfully! Order ID: ${order.id}`, 
        severity: 'success' 
      });

      // Reset form
      setOrderData(prev => ({
        ...prev,
        price: '',
        amount: '',
        total: '',
        percentage: 0,
        tpPrice: '',
        slPrice: ''
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order';
      notify({ message: errorMessage, severity: 'error' });
    } finally {
      setOrderLoading(false);
    }
  };

  // Format fee percentage
  const formatFee = (fee: number) => {
    return `${(fee * 100).toFixed(2)}%`;
  };

  // If no exchange is selected, no credentials, or not connected, show locked state
  if (!selectedExchange || !hasCredentials || !isConnected) {
    return (
      <>
        <LockedState
          title="Trading Manager Locked"
          description={
            !selectedExchange 
              ? "Select an exchange to unlock trading features."
              : !hasCredentials 
                ? "Connect your exchange credentials to place orders and manage trades."
                : "Connecting to exchange... Please wait for the connection to be established."
          }
          buttonText={
            !selectedExchange 
              ? "Select Exchange First"
              : !hasCredentials 
                ? "Connect Exchange" 
                : "Connecting..."
          }
          onUnlock={handleUnlock}
          disabled={!selectedExchange || (hasCredentials && !isConnected)}
        />
        
        {selectedExchange && !hasCredentials && (
          <ExchangeCredentialsModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            exchangeId={selectedExchange}
          />
        )}
      </>
    );
  }

  // Determine which trading manager to render based on market type
  const isSpotTrading = marketInfo?.type === 'spot';
  
  const spotTradingManager = (
    <SpotTradingManager
      selectedExchange={selectedExchange}
      selectedSymbol={selectedSymbol}
      marketInfo={marketInfo}
      orderData={orderData}
      setOrderData={setOrderData}
      handleSideChange={handleSideChange}
      handleTypeChange={handleTypeChange}
      handleInputChange={handleInputChange}
      handlePercentageChange={handlePercentageChange}
      handleSubmitOrder={handleSubmitOrder}
      orderLoading={orderLoading}
      loading={loading}
      balanceLoading={balanceLoading}
      hasInitialData={hasInitialData}
      getFreeBalance={getFreeBalance}
    />
  );

  const perpTradingManager = (
    <PerpTradingManager
      selectedExchange={selectedExchange}
      selectedSymbol={selectedSymbol}
      marketInfo={marketInfo}
      orderData={orderData}
      setOrderData={setOrderData}
      handleSideChange={handleSideChange}
      handleTypeChange={handleTypeChange}
      handleInputChange={handleInputChange}
      handlePercentageChange={handlePercentageChange}
      handleSubmitOrder={handleSubmitOrder}
      orderLoading={orderLoading}
      loading={loading}
      balanceLoading={balanceLoading}
      hasInitialData={hasInitialData}
      getFreeBalance={getFreeBalance}
    />
  );

  // Render the appropriate trading manager based on market type
  return isSpotTrading ? spotTradingManager : perpTradingManager;
};

export default TradingManager; 