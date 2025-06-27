import OrdersTabs from '@/components/OrdersTabs';
import TradingTopBar from '@/components/TradingTopBar';
import { Box, List, ListItem, ListItemButton, ListItemText, Paper, TextField, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { useState } from 'react';
import OrderBook from '../components/OrderBook';
import TradingChart from '../components/TradingChart';
import TradingForm from '../components/TradingForm';

interface ExchangeOption {
  label: string;
  value: string;
}
interface PairOption {
  label: string;
  value: string;
  lastPrice: string;
  priceChange24h: string;
}

const mockExchanges: ExchangeOption[] = [
  { label: 'Binance', value: 'binance' },
  { label: 'Coinbase', value: 'coinbase' },
  { label: 'Bitget', value: 'bitget' },
  // ...add more for testing long list
  ...Array.from({ length: 30 }, (_, i) => ({ label: `Exchange ${i + 1}`, value: `exchange${i + 1}` })),
];
const mockPairs: Record<string, PairOption[]> = {
  binance: [
    { label: 'BTC/USDT', value: 'BTC/USDT', lastPrice: '67000', priceChange24h: '+2.5%' },
    { label: 'ETH/USDT', value: 'ETH/USDT', lastPrice: '3500', priceChange24h: '-1.2%' },
  ],
  coinbase: [
    { label: 'BTC/USD', value: 'BTC/USD', lastPrice: '66900', priceChange24h: '+2.3%' },
    { label: 'ETH/USD', value: 'ETH/USD', lastPrice: '3490', priceChange24h: '-1.0%' },
  ],
  bitget: [
    { label: 'BCH/USDT', value: 'BCH/USDT', lastPrice: '480', priceChange24h: '+0.8%' },
    { label: 'LTC/USDT', value: 'LTC/USDT', lastPrice: '95', priceChange24h: '+1.1%' },
  ],
};
// Add default pairs for mock exchanges
for (let i = 1; i <= 30; i++) {
  mockPairs[`exchange${i}`] = [
    { label: 'BTC/USDT', value: 'BTC/USDT', lastPrice: '67000', priceChange24h: '+2.5%' },
    { label: 'ETH/USDT', value: 'ETH/USDT', lastPrice: '3500', priceChange24h: '-1.2%' },
  ];
}

const TradingPage = () => {
  const [tab, setTab] = useState(0);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeOption | null>(null);
  const [selectedPair, setSelectedPair] = useState<PairOption | null>(null);
  const [search, setSearch] = useState('');
  const [pairOpen, setPairOpen] = useState(false);

  // Filter exchanges by search
  const filteredExchanges = mockExchanges.filter(e =>
    e.label.toLowerCase().includes(search.toLowerCase())
  );

  // When exchange is selected, set default pair
  const handleExchangeSelect = (exchange: ExchangeOption) => {
    setSelectedExchange(exchange);
    setSelectedPair(mockPairs[exchange.value][0]);
  };

  const handlePairChange = (_event: any, value: PairOption | null) => {
    setSelectedPair(value);
  };

  const handleBack = () => {
    setSelectedExchange(null);
    setSelectedPair(null);
  };

  const pairsForExchange: PairOption[] = selectedExchange ? mockPairs[selectedExchange.value] : [];

  // Exchange list view
  if (!selectedExchange) {
    return (
      <Box sx={{ width: '100%', height: '100%', p: 0, m: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, minWidth: 480, maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }} elevation={3}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Select Exchange</Typography>
          <TextField
            label="Search Exchange"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: '100%' }}
            autoFocus
          />
          <List sx={{ width: '100%', maxHeight: 600, overflow: 'auto', mt: 1 }}>
            {filteredExchanges.map((exchange) => (
              <ListItem key={exchange.value} disablePadding>
                <ListItemButton onClick={() => handleExchangeSelect(exchange)}>
                  <ListItemText primary={exchange.label} />
                </ListItemButton>
              </ListItem>
            ))}
            {filteredExchanges.length === 0 && (
              <ListItem>
                <ListItemText primary="No exchanges found" />
              </ListItem>
            )}
          </List>
        </Paper>
      </Box>
    );
  }

  // Trading terminal view
  return (
    <Box sx={{ width: '100%', height: '100%', p: 0, m: 0, display: 'flex', flexDirection: 'column' }}>
      <TradingTopBar
        selectedExchange={selectedExchange}
        selectedPair={selectedPair}
        pairsForExchange={pairsForExchange}
        handleBack={handleBack}
        handlePairChange={handlePairChange}
      />
      <Grid2 container spacing={2} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Grid2 size={7} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <TradingChart />
          <OrdersTabs tab={tab} setTab={setTab} />
        </Grid2>
        <Grid2 size={2.5} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <OrderBook />
        </Grid2>
        <Grid2 size={2.5} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <TradingForm />
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default TradingPage; 