import { useNotify } from '@/components/NotificationProvider';
import { fetchOrders } from '@/services/api';
import { CcxtOrder } from '@/services/types';
import { formatWithSubscriptZeros } from '@/utils/format';
import { TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';

interface OrderHistoryProps {
  exchangeId: string;
  symbol?: string;
}

const OrderHistory = ({ exchangeId, symbol }: OrderHistoryProps) => {
  const [orders, setOrders] = useState<CcxtOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notify = useNotify();

  const fetchOrderHistory = async () => {
    if (!exchangeId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const orderData = await fetchOrders({
        exchangeId,
        symbol,
      });
      setOrders(orderData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      notify({ message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, [exchangeId, symbol]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'success';
      case 'open':
        return 'warning';
      case 'canceled':
        return 'error';
      case 'expired':
        return 'error';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSideIcon = (side: string) => {
    return side === 'buy' ? (
      <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
    ) : (
      <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography variant="body2" color="text.secondary">
          No orders found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Side</TableCell>
            <TableCell>Symbol</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Filled</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getSideIcon(order.side)}
                  <Typography variant="body2" sx={{ 
                    color: order.side === 'buy' ? 'success.main' : 'error.main',
                    fontWeight: 600
                  }}>
                    {order.side.toUpperCase()}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {order.symbol}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={order.type.toUpperCase()} 
                  size="small" 
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatWithSubscriptZeros(order.price)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatWithSubscriptZeros(order.amount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatWithSubscriptZeros(order.filled)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={order.status.toUpperCase()} 
                  size="small" 
                  color={getStatusColor(order.status) as any}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(order.timestamp)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OrderHistory; 