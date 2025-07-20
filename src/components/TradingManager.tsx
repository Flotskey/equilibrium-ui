import { useNotify } from '@/components/NotificationProvider';
import { usePrivateConnection } from '@/hooks';
import { createOrder, fetchMarket } from '@/services/api';
import { CcxtMarket } from '@/services/types';
import { TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { ExchangeCredentialsModal } from './credentials/ExchangeCredentialsModal';
import { LockedState } from './credentials/LockedState';

interface TradingManagerProps {
  selectedExchange: string | null;
  selectedSymbol?: string | null;
}

type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market';

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
}

const TradingManager = ({ selectedExchange, selectedSymbol }: TradingManagerProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [marketInfo, setMarketInfo] = useState<CcxtMarket | null>(null);
  
  // Use custom hook for connection management
  const { hasCredentials } = usePrivateConnection({ exchangeId: selectedExchange });
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

  const handleCredentialsSaved = () => {
    // Connection refresh is now handled automatically by the usePrivateConnection hook
    // when credentials are saved and the component re-renders
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
      
      // Auto-calculate total when price or amount changes
      if (field === 'price' || field === 'amount') {
        const price = field === 'price' ? parseFloat(value as string) : parseFloat(prev.price);
        const amount = field === 'amount' ? parseFloat(value as string) : parseFloat(prev.amount);
        
        if (!isNaN(price) && !isNaN(amount)) {
          newData.total = (price * amount).toFixed(8);
        } else {
          newData.total = '';
        }
      }
      
      return newData;
    });
  };

  // Handle percentage slider change
  const handlePercentageChange = (percentage: number) => {
    setOrderData(prev => ({ ...prev, percentage }));
    // TODO: Calculate amount based on available balance
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
      
      // Add TP/SL if enabled
      if (orderData.takeProfit && orderData.tpPrice) {
        orderParams.takeProfit = parseFloat(orderData.tpPrice);
      }
      if (orderData.stopLoss && orderData.slPrice) {
        orderParams.stopLoss = parseFloat(orderData.slPrice);
      }

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

  // If no exchange is selected or no credentials, show locked state
  if (!selectedExchange || !hasCredentials) {
    return (
      <>
        <LockedState
          title="Trading Manager Locked"
          description={
            selectedExchange 
              ? "Connect your exchange credentials to place orders and manage trades."
              : "Select an exchange to unlock trading features."
          }
          buttonText={
            selectedExchange 
              ? "Connect Exchange" 
              : "Select Exchange First"
          }
          onUnlock={handleUnlock}
          disabled={!selectedExchange}
        />
        
        {selectedExchange && (
          <ExchangeCredentialsModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            exchangeId={selectedExchange}
            onCredentialsSaved={handleCredentialsSaved}
          />
        )}
      </>
    );
  }

  // Show trading panel when credentials are available
  return (
    <Paper sx={{ flex: 1, p: 2, minHeight: 240, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Trade
      </Typography>

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
          -- {marketInfo?.quote || 'USDT'}
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
          InputProps={{
            endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
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
        InputProps={{
          endAdornment: <Typography variant="caption">
            {marketInfo?.base || selectedSymbol?.split('/')[0] || 'COIN'}
          </Typography>
        }}
      />

      {/* Percentage Slider */}
      <Box sx={{ mb: 2 }}>
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
        InputProps={{
          endAdornment: <Typography variant="caption">{marketInfo?.quote || 'USDT'}</Typography>
        }}
      />

      {/* Max Buy/Sell Amount */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Max {orderData.side === 'buy' ? 'buy' : 'sell'}
        </Typography>
        <Typography variant="body2">
          -- {marketInfo?.base || selectedSymbol?.split('/')[0] || 'COIN'}
        </Typography>
      </Box>

      {/* TP/SL Checkboxes */}
      {/* TODO: Exchange-specific params mapping */}
      {/* <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={orderData.takeProfit}
              onChange={(e) => setOrderData(prev => ({ ...prev, takeProfit: e.target.checked }))}
              size="small"
            />
          }
          label="TP"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={orderData.stopLoss}
              onChange={(e) => setOrderData(prev => ({ ...prev, stopLoss: e.target.checked }))}
              size="small"
            />
          }
          label="SL"
        />
      </Box> */}

      {/* TP/SL Price Inputs */}
      {/* TODO: Exchange-specific params mapping */}
      {/* {(orderData.takeProfit || orderData.stopLoss) && (
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
            />
          )}
        </Box>
      )} */}

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
            `Fees: Maker ${formatFee(marketInfo.maker)} / Taker ${formatFee(marketInfo.taker)}`
          ) : (
            'Fees: --'
          )}
        </Typography>
      </Box>
    </Paper>
  );
};

export default TradingManager; 