import { type OrderBook } from '@/services/types';
import { getStreamingSocket, watchOrderBook } from '@/services/ws-api';
import { formatWithSubscriptZeros } from '@/utils/format';
import { Box, Paper, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  exchangeId: string;
  symbol: string;
}

// Custom scrollbar styles - invisible scrollbars
const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '0px',
    display: 'none',
  },
  '&::-webkit-scrollbar-track': {
    display: 'none',
  },
  '&::-webkit-scrollbar-thumb': {
    display: 'none',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    display: 'none',
  },
  // For Firefox
  scrollbarWidth: 'none',
  // For IE/Edge
  msOverflowStyle: 'none',
};

const calculateFillWidth = (amount: number, maxAmount: number, minAmount: number): number => {
    if (maxAmount <= 0 || amount <= 0) return 0;
    
    // Use logarithmic scale for better distribution
    const logMax = Math.log(maxAmount + 1);
    const logMin = Math.log(minAmount + 1);
    const logAmount = Math.log(amount + 1);
    
    // Calculate percentage using logarithmic scale
    const logPercentage = (logAmount - logMin) / (logMax - logMin);
    
    // Apply minimum fill width (5%) and maximum (100%)
    const minFill = 5;
    const maxFill = 100;
    const fillWidth = Math.max(minFill, Math.min(maxFill, logPercentage * 100));
    
    return fillWidth;
  };

const OrderBook = ({ exchangeId, symbol }: Props) => {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const asksContainerRef = useRef<HTMLDivElement>(null);
  const bidsContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const socket = getStreamingSocket();
    const unsub = watchOrderBook(socket, { exchangeId, symbol }, setOrderBook); 
    return () => {
      unsub();
    };
  }, [exchangeId, symbol]); 

  // Calculate fill parameters using logarithmic scale for better visibility
  const { askFillParams, bidFillParams } = useMemo(() => {
    if (!orderBook) {
      return { askFillParams: { maxAmount: 0, minAmount: 0 }, bidFillParams: { maxAmount: 0, minAmount: 0 } };
    }
    
    const askAmounts = orderBook.asks.map(([, qty]) => qty);
    const bidAmounts = orderBook.bids.map(([, qty]) => qty);
    
    const maxAskAmount = Math.max(...askAmounts);
    const maxBidAmount = Math.max(...bidAmounts);
    const minAskAmount = Math.min(...askAmounts);
    const minBidAmount = Math.min(...bidAmounts);
    
    return {
      askFillParams: { maxAmount: maxAskAmount, minAmount: minAskAmount },
      bidFillParams: { maxAmount: maxBidAmount, minAmount: minBidAmount }
    };
  }, [exchangeId, symbol]);

  // Handle mouse leave for the entire order book area
  const handleOrderBookMouseLeave = () => {
    // Scroll asks to bottom (highest prices)
    if (asksContainerRef.current) {
      asksContainerRef.current.scrollTop = asksContainerRef.current.scrollHeight;
    }
    // Scroll bids to top (highest bids)
    if (bidsContainerRef.current) {
      bidsContainerRef.current.scrollTop = 0;
    }
  };

  if (!orderBook) {
    return (
      <Paper sx={{ flex: 2, p: 2, minHeight: 360, display: 'flex', flexDirection: 'column', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
        Loading order book...
      </Paper>
    );
  }

  const { asks, bids } = orderBook;

  const sortedAsks = asks.slice().sort((a, b) => b[0] - a[0]);
  const sortedBids = bids.slice().sort((a, b) => b[0] - a[0]);

  return (
    <Paper sx={{ flex: 2, p: 2, minHeight: 360, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header - fixed height */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexShrink: 0 }}>
        <Typography variant="subtitle2">Price ({symbol.split('/')[1]})</Typography>
        <Typography variant="subtitle2">Amount ({symbol.split('/')[0]})</Typography>
      </Box>
      
      {/* Main content area - takes remaining space */}
      <Box 
        onMouseLeave={handleOrderBookMouseLeave}
        sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        {/* Asks Section - exactly 50% with invisible scrollbar */}
        <Box 
          ref={asksContainerRef}
          sx={{ 
            overflow: 'auto',
            ...scrollbarStyles
          }}
        >
          {sortedAsks.map(([price, qty], i) => {
            const fillWidth = calculateFillWidth(qty, askFillParams.maxAmount, askFillParams.minAmount);
            return (
              <Box 
                key={i} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.9rem',
                  position: 'relative',
                  borderRadius: '4px',
                  p: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                {/* Transparent fill bar for asks (red) */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: `${fillWidth}%`,
                    backgroundColor: 'rgba(255, 0, 0, 0.15)',
                    zIndex: 0,
                  }}
                />
                {/* Content */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'relative', zIndex: 1 }}>
                  <span style={{ color: 'red' }}>{formatWithSubscriptZeros(price)}</span>
                  <span>{formatWithSubscriptZeros(qty)}</span>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Divider - fixed height */}
        <Box sx={{ width: '100%', height: '1px', background: '#333', my: 1, flexShrink: 0 }} />
        
        {/* Bids Section - exactly 50% with invisible scrollbar */}
        <Box 
          ref={bidsContainerRef}
          sx={{ 
            overflow: 'auto',
            ...scrollbarStyles
          }}
        >
          {sortedBids.map(([price, qty], i) => {
            const fillWidth = calculateFillWidth(qty, bidFillParams.maxAmount, bidFillParams.minAmount);
            return (
              <Box 
                key={i} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.9rem',
                  position: 'relative',
                  borderRadius: '4px',
                  p: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                {/* Transparent fill bar for bids (green) */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: `${fillWidth}%`,
                    backgroundColor: 'rgba(0, 255, 0, 0.15)',
                    zIndex: 0,
                  }}
                />
                {/* Content */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'relative', zIndex: 1 }}>
                  <span style={{ color: 'green' }}>{formatWithSubscriptZeros(price)}</span>
                  <span>{formatWithSubscriptZeros(qty)}</span>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};

export default OrderBook; 