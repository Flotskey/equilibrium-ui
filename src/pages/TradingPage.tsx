import OrderManager from '@/components/OrderManager';
import TradingTopBar from '@/components/TradingTopBar';
import { fetchExchangesList, fetchShortTickers } from '@/services/api';
import { Box, Paper } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { useEffect, useRef, useState } from 'react';
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

const LOCAL_STORAGE_KEY_EXCHANGE = 'selectedExchange';
const LOCAL_STORAGE_KEY_PAIR = 'selectedPair';

// Format small numbers like CoinMarketCap
function formatSmallNumber(num: number): string {
  if (num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 0.01) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  // For numbers < 0.01, show all leading zeros after the dot, then 2-4 significant digits
  const str = num.toExponential();
  const match = str.match(/(-?)(\d(?:\.\d+)?)[eE]([+-]?\d+)/);
  if (!match) return num.toString();
  const sign = match[1];
  let mantissa = match[2].replace('.', '');
  let exp = parseInt(match[3], 10);
  let zeros = '';
  if (exp < 0) {
    zeros = '0.' + '0'.repeat(Math.abs(exp) - 1);
    mantissa = mantissa.slice(0, 4); // 4 significant digits
    return `${sign}${zeros}${mantissa}`;
  }
  return num.toString();
}

const TradingPage = () => {
  const [tab, setTab] = useState(0);
  const [exchangeOptions, setExchangeOptions] = useState<ExchangeOption[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeOption | null>(null);
  const [selectedPair, setSelectedPair] = useState<PairOption | null>(null);
  const [pairsForExchange, setPairsForExchange] = useState<PairOption[]>([]);
  const requestedRef = useRef(false);
  const [pairDropdownOpen, setPairDropdownOpen] = useState(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    fetchExchangesList().then(list => {
      const options = list.map(e => ({ label: e.charAt(0).toUpperCase() + e.slice(1), value: e }));
      setExchangeOptions(options);
      // Restore from localStorage or default to Binance/first
      const savedExchange = localStorage.getItem(LOCAL_STORAGE_KEY_EXCHANGE);
      const foundExchange = options.find(e => e.value === savedExchange) || options.find(e => e.value.toLowerCase() === 'binance') || options[0] || null;
      setSelectedExchange(foundExchange);
    });
  }, []);

  // Fetch pairs (short-tickers) only when dropdown is opened or on mount/exchange change
  const fetchPairsForExchange = async (exchangeId: string) => {
    try {
      const tickers = await fetchShortTickers(exchangeId);
      const pairs = tickers.map((t: any) => {
        // Convert change to human-readable percent
        let percent = 0;
        if (t.last !== 0) {
          percent = (t.change / (t.last - t.change)) * 100;
        }
        const percentStr = `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
        return {
          label: t.symbol,
          value: t.symbol,
          lastPrice: formatSmallNumber(t.last),
          priceChange24h: percentStr,
        };
      });
      setPairsForExchange(pairs);
      // Restore selectedPair from localStorage or default to BTC/USDT/first
      const savedPair = localStorage.getItem(LOCAL_STORAGE_KEY_PAIR);
      setSelectedPair(prev => {
        if (prev && pairs.some(p => p.value === prev.value)) return prev;
        const foundPair = pairs.find(p => p.value === savedPair) || pairs.find(p => p.value.toUpperCase() === 'BTC/USDT') || pairs[0] || null;
        return foundPair;
      });
    } catch {}
  };

  // When exchange changes, clear pairs and selectedPair, and fetch pairs immediately
  useEffect(() => {
    if (selectedExchange) {
      setPairsForExchange([]);
      setSelectedPair(null);
      localStorage.setItem(LOCAL_STORAGE_KEY_EXCHANGE, selectedExchange.value);
      fetchPairsForExchange(selectedExchange.value);
    }
  }, [selectedExchange]);

  // Save selectedPair to localStorage
  useEffect(() => {
    if (selectedPair) {
      localStorage.setItem(LOCAL_STORAGE_KEY_PAIR, selectedPair.value);
    }
  }, [selectedPair]);

  // Handler for PairSelect dropdown open
  const handlePairDropdownOpen = () => {
    setPairDropdownOpen(true);
    if (selectedExchange) {
      fetchPairsForExchange(selectedExchange.value);
    }
  };
  const handlePairDropdownClose = () => {
    setPairDropdownOpen(false);
  };

  const handleExchangeChange = (_event: any, value: ExchangeOption) => {
    setSelectedExchange(value);
  };

  const handlePairChange = (_event: any, value: PairOption) => {
    setSelectedPair(value);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 0, m: 0, display: 'flex', flexDirection: 'column' }}>
      <TradingTopBar
        exchangeOptions={exchangeOptions}
        selectedExchange={selectedExchange as any}
        onExchangeChange={handleExchangeChange}
        selectedPair={selectedPair as any}
        pairsForExchange={pairsForExchange}
        onPairChange={handlePairChange}
        onPairDropdownOpen={handlePairDropdownOpen}
        onPairDropdownClose={handlePairDropdownClose}
        pairDropdownOpen={pairDropdownOpen}
      />
      <Grid2 container spacing={2} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Grid2 size={7} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, rowGap: '16px' }}>
            <Box sx={{ flex: 6, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <Paper sx={{ p: 2, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} elevation={2}>
                {selectedExchange && selectedPair && (
                  <TradingChart exchangeId={selectedExchange.value} symbol={selectedPair.value} />
                )}
              </Paper>
            </Box>
            <Box sx={{ flex: 5, display: 'flex', flexDirection: 'column', rowGap: '16px', height: '100%' }}>
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