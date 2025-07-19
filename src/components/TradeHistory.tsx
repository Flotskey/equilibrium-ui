import { useNotify } from '@/components/NotificationProvider';
import { fetchTrades } from '@/services/api';
import { CcxtTrade } from '@/services/types';
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

interface TradeHistoryProps {
  exchangeId: string;
  symbol?: string;
}

const TradeHistory = ({ exchangeId, symbol }: TradeHistoryProps) => {
  const [trades, setTrades] = useState<CcxtTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notify = useNotify();

  const fetchTradeHistory = async () => {
    if (!exchangeId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tradeData = await fetchTrades({
        exchangeId,
        symbol,
        limit: 100, // Fetch last 100 trades
      });
      setTrades(tradeData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trades';
      setError(errorMessage);
      notify({ message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeHistory();
  }, [exchangeId, symbol]);

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

  const getTakerMakerColor = (takerOrMaker: string) => {
    return takerOrMaker === 'maker' ? 'success' : 'warning';
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

  if (trades.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography variant="body2" color="text.secondary">
          No trades found
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
            <TableCell>Price</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Cost</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getSideIcon(trade.side)}
                  <Typography variant="body2" sx={{ 
                    color: trade.side === 'buy' ? 'success.main' : 'error.main',
                    fontWeight: 600
                  }}>
                    {trade.side.toUpperCase()}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {trade.symbol}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatWithSubscriptZeros(trade.price)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatWithSubscriptZeros(trade.amount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatWithSubscriptZeros(trade.cost)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={trade.takerOrMaker.toUpperCase()} 
                  size="small" 
                  color={getTakerMakerColor(trade.takerOrMaker) as any}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(trade.timestamp)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TradeHistory; 