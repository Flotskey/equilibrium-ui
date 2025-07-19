import { CcxtOrder } from '@/services/types';
import { formatWithSubscriptZeros } from '@/utils/format';
import { Cancel, TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';

interface OpenOrdersProps {
  orders: CcxtOrder[];
  onCancelOrder?: (orderId: string) => void;
}

const OpenOrders = ({ orders, onCancelOrder }: OpenOrdersProps) => {
  // Filter only open orders
  const openOrders = orders.filter(order => order.status === 'open');

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

  if (openOrders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography variant="body2" color="text.secondary">
          No open orders
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
            <TableCell>Remaining</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {openOrders.map((order) => (
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
                <Typography variant="body2">
                  {formatWithSubscriptZeros(order.remaining)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(order.timestamp)}
                </Typography>
              </TableCell>
              <TableCell>
                {onCancelOrder && (
                  <Tooltip title="Cancel Order">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onCancelOrder(order.id)}
                    >
                      <Cancel fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OpenOrders; 