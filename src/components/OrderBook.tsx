import { type OrderBook } from '@/services/types';
import { getStreamingSocket, watchOrderBook } from '@/services/ws-api';
import { formatWithSubscriptZeros } from '@/utils/format';
import { Box, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface Props {
  exchangeId: string;
  symbol: string;
}

const OrderBook = ({ exchangeId, symbol }: Props) => {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  useEffect(() => {
    const socket = getStreamingSocket();
    const unsub = watchOrderBook(socket, { exchangeId, symbol }, setOrderBook); 
    return () => {
      unsub();
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
  // Assume sorted: bids descending price, asks ascending
  // Limit to top 20
  const maxRows = 20;

  return (
    <Paper sx={{ flex: 2, p: 2, minHeight: 360, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">Price ({symbol.split('/')[1]})</Typography>
            <Typography variant="subtitle2">Amount ({symbol.split('/')[0]})</Typography>
          </Box>
          {asks.slice(0, maxRows).map(([price, qty], i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'red' }}>{formatWithSubscriptZeros(price)}</span>
              <span>{formatWithSubscriptZeros(qty)}</span>
            </Box>
          ))}
        </Box>
        {/* Divider between asks and bids */}
        <Box sx={{ width: '100%', height: '1px', background: '#333', margin: '10px 0' }} />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {bids.slice(0, maxRows).map(([price, qty], i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'green' }}>{formatWithSubscriptZeros(price)}</span>
              <span>{formatWithSubscriptZeros(qty)}</span>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default OrderBook; 