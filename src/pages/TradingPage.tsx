import OrderManager from '@/components/OrdersTabs';
import TradingTopBar from '@/components/TradingTopBar';
import { Box } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
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

const LOCAL_STORAGE_KEY = 'selectedExchange';

const TradingPage = () => {
  const [tab, setTab] = useState(0);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeOption>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return (
      mockExchanges.find(e => e.value === saved) || mockExchanges[0]
    );
  });
  const [selectedPair, setSelectedPair] = useState<PairOption>(() => mockPairs[mockExchanges[0].value][0]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, selectedExchange.value);
    setSelectedPair(mockPairs[selectedExchange.value][0]);
  }, [selectedExchange]);

  const handleExchangeChange = (_event: any, value: ExchangeOption) => {
    setSelectedExchange(value);
  };

  const handlePairChange = (_event: any, value: PairOption) => {
    setSelectedPair(value);
  };

  const pairsForExchange: PairOption[] = mockPairs[selectedExchange.value];

  return (
    <Box sx={{ width: '100%', height: '100%', p: 0, m: 0, display: 'flex', flexDirection: 'column' }}>
      <TradingTopBar
        exchangeOptions={mockExchanges}
        selectedExchange={selectedExchange}
        onExchangeChange={handleExchangeChange}
        selectedPair={selectedPair}
        pairsForExchange={pairsForExchange}
        onPairChange={handlePairChange}
      />
      <Grid2 container spacing={2} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Grid2 size={7} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <Box sx={{ flex: 6, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <TradingChart />
            </Box>
            <Box sx={{ flex: 5, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <OrderManager tab={tab} setTab={setTab} />
            </Box>
          </Box>
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