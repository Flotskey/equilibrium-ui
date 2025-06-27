import { Paper } from '@mui/material';

const TradingChart = () => (
  <Paper sx={{ flex: 1, mb: 1, p: 2, minHeight: 160, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    Price Chart (candlestick)
  </Paper>
);

export default TradingChart; 