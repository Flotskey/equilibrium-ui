import { CcxtPosition } from '@/services/types';
import { formatWithSubscriptZeros } from '@/utils/format';
import { TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Box,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

interface PositionsProps {
  positions: CcxtPosition[];
}

const Positions = ({ positions }: PositionsProps) => {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString();
  };

  const getSideIcon = (side: string) => {
    return side === 'buy' ? (
      <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
    ) : (
      <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
    );
  };

  const getPnlColor = (pnl?: number) => {
    if (!pnl) return 'text.secondary';
    return pnl > 0 ? 'success.main' : pnl < 0 ? 'error.main' : 'text.secondary';
  };

  const getPnlSign = (pnl?: number) => {
    if (!pnl) return '';
    return pnl > 0 ? '+' : '';
  };

  if (positions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography variant="body2" color="text.secondary">
          No open positions
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
            <TableCell>Size</TableCell>
            <TableCell>Entry Price</TableCell>
            <TableCell>Mark Price</TableCell>
            <TableCell>Unrealized PnL</TableCell>
            <TableCell>Realized PnL</TableCell>
            <TableCell>Leverage</TableCell>
            <TableCell>Margin</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id || position.symbol} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getSideIcon(position.side)}
                  <Typography variant="body2" sx={{ 
                    color: position.side === 'buy' ? 'success.main' : 'error.main',
                    fontWeight: 600
                  }}>
                    {position.side.toUpperCase()}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {position.symbol}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatWithSubscriptZeros(position.contracts || position.notional || 0)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {position.entryPrice ? formatWithSubscriptZeros(position.entryPrice) : '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {position.markPrice ? formatWithSubscriptZeros(position.markPrice) : '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ color: getPnlColor(position.unrealizedPnl) }}>
                  {position.unrealizedPnl !== undefined ? (
                    `${getPnlSign(position.unrealizedPnl)}${formatWithSubscriptZeros(position.unrealizedPnl)}`
                  ) : '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ color: getPnlColor(position.realizedPnl) }}>
                  {position.realizedPnl !== undefined ? (
                    `${getPnlSign(position.realizedPnl)}${formatWithSubscriptZeros(position.realizedPnl)}`
                  ) : '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {position.leverage ? `${position.leverage}x` : '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" fontSize="0.75rem">
                    {position.marginMode?.toUpperCase() || '-'}
                  </Typography>
                                     {position.marginRatio !== undefined && (
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <LinearProgress 
                         variant="determinate" 
                         value={Math.min((position.marginRatio || 0) * 100, 100)}
                         sx={{ 
                           width: 40, 
                           height: 4,
                           backgroundColor: 'grey.300',
                           '& .MuiLinearProgress-bar': {
                             backgroundColor: (position.marginRatio || 0) > 0.8 ? 'error.main' : 'warning.main'
                           }
                         }}
                       />
                       <Typography variant="caption" fontSize="0.7rem">
                         {((position.marginRatio || 0) * 100).toFixed(1)}%
                       </Typography>
                     </Box>
                   )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Positions; 