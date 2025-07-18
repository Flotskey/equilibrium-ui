import { type OrderBook } from '@/services/types';
import { getStreamingSocket, watchOrderBook } from '@/services/ws-api';
import { formatWithSubscriptZeros } from '@/utils/format';
import { Box, Paper } from '@mui/material';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

interface Props {
  exchangeId: string;
  symbol: string;
}

// Custom scrollbar styles for react-virtuoso scroller
const scrollerStyle: React.CSSProperties = {
  scrollbarWidth: 'none' as const,
  msOverflowStyle: 'none',
};

// Forward ref wrapper for the Scroller component
const CustomScroller = forwardRef<HTMLDivElement, any>((props, ref) => (
  <div {...props} ref={ref} style={{ ...props.style, ...scrollerStyle }} />
));

CustomScroller.displayName = 'CustomScroller';

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
  const asksVirtuosoRef = useRef<any>(null);
  const bidsVirtuosoRef = useRef<any>(null);
  
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
    
    const sortedAsks = [...orderBook.asks].sort((a, b) => b[0] - a[0]); // Highest price first
    const sortedBids = [...orderBook.bids].sort((a, b) => b[0] - a[0]); // Highest price first
    
    const askAmounts = sortedAsks.map(([, qty]) => qty);
    const bidAmounts = sortedBids.map(([, qty]) => qty);
    
    const maxAskAmount = Math.max(...askAmounts);
    const maxBidAmount = Math.max(...bidAmounts);
    const minAskAmount = Math.min(...askAmounts);
    const minBidAmount = Math.min(...bidAmounts);
    
    return {
      askFillParams: { maxAmount: maxAskAmount, minAmount: minAskAmount },
      bidFillParams: { maxAmount: maxBidAmount, minAmount: minBidAmount }
    };
  }, [exchangeId, symbol]);

  if (!orderBook) {
    return (
      <Paper sx={{ flex: 2, p: 2, minHeight: 360, display: 'flex', flexDirection: 'column', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
        Loading order book...
      </Paper>
    );
  }

  const { asks, bids } = orderBook;

  const sortedAsks = [...asks].sort((a, b) => b[0] - a[0]); // Highest price first
  const sortedBids = [...bids].sort((a, b) => b[0] - a[0]); // Highest price first

  // Handle mouse leave for the entire order book area
  const handleOrderBookMouseLeave = () => {
    // Scroll asks to bottom (highest prices) - use 'end' to show highest prices at bottom
    if (asksVirtuosoRef.current) {
      asksVirtuosoRef.current.scrollToIndex({ index: sortedAsks.length - 1, align: 'end' });
    }
    // Scroll bids to top (highest bids)  
    if (bidsVirtuosoRef.current) {
      bidsVirtuosoRef.current.scrollToIndex({ index: 0, align: 'start' });
    }
  };

  // Row renderer for asks
  const AskRow = (index: number) => {
    const [price, qty] = sortedAsks[index];
    const fillWidth = calculateFillWidth(qty, askFillParams.maxAmount, askFillParams.minAmount);
    
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.9rem',
          position: 'relative',
          borderRadius: '4px',
          p: 0.5,
          cursor: 'pointer',
          height: '32px',
          boxSizing: 'border-box',
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
  };

  // Row renderer for bids
  const BidRow = (index: number) => {
    const [price, qty] = sortedBids[index];
    const fillWidth = calculateFillWidth(qty, bidFillParams.maxAmount, bidFillParams.minAmount);
    
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.9rem',
          position: 'relative',
          borderRadius: '4px',
          p: 0.5,
          cursor: 'pointer',
          height: '32px',
          boxSizing: 'border-box',
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
  };

  return (
    <Paper sx={{ flex: 2, p: 2, minHeight: 360, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Column Headers */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'text.secondary', mb: 1, flexShrink: 0 }}>
        <span>Price ({symbol.split('/')[1]})</span>
        <span>Amount ({symbol.split('/')[0]})</span>
      </Box>

      {/* Order Book Content */}
      <Box 
        sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        onMouseLeave={handleOrderBookMouseLeave}
      >
        {/* Asks Section with react-virtuoso virtual scrolling */}
        <Box sx={{ height: '50%', overflow: 'hidden' }}>
          <Virtuoso
            ref={asksVirtuosoRef}
            data={sortedAsks}
            itemContent={(index) => AskRow(index)}
            style={{ height: '100%' }}
            className="virtuoso-grid-list"
            components={{
              Scroller: CustomScroller,
            }}
            initialTopMostItemIndex={{ index: sortedAsks.length - 1, align: 'end' }}
          />
        </Box>

        {/* Divider - fixed height */}
        <Box sx={{ width: '100%', height: '1px', background: '#333', my: 1, flexShrink: 0 }} />

        {/* Bids Section with react-virtuoso virtual scrolling */}
        <Box sx={{ height: '50%', overflow: 'hidden' }}>
          <Virtuoso
            ref={bidsVirtuosoRef}
            data={sortedBids}
            itemContent={(index) => BidRow(index)}
            style={{ height: '100%' }}
            className="virtuoso-grid-list"
            components={{
              Scroller: CustomScroller,
            }}
            initialTopMostItemIndex={{ index: 0, align: 'start' }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default OrderBook; 