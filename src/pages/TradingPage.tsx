import OrderManager from '@/components/OrderManager';
import TradingTopBar from '@/components/TradingTopBar';
import { fetchExchangesList, fetchShortMarkets } from '@/services/api';
import { ShortMarketDto } from '@/services/types';
import { useCredentialsStore } from '@/store/credentialsStore';
import { Box, Paper } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import OrderBook from '../components/OrderBook';
import PriceChart from '../components/PriceChart';
import TradingManager from '../components/TradingManager';

interface ExchangeOption {
  label: string;
  value: string;
}
interface PairOption {
  label: string;
  value: string;
}

const LOCAL_STORAGE_KEY_EXCHANGE = 'selectedExchange';
const LOCAL_STORAGE_KEY_PAIR = 'selectedPair';

// Format small numbers like CoinMarketCap
function formatSmallNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(0);
  const [exchangeOptions, setExchangeOptions] = useState<ExchangeOption[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeOption | null>(null);
  const [selectedPair, setSelectedPair] = useState<PairOption | null>(null);
  const [pairsForExchange, setPairsForExchange] = useState<PairOption[]>([]);
  const requestedRef = useRef(false);
  const [pairDropdownOpen, setPairDropdownOpen] = useState(false);
  const { refreshAllCredentials } = useCredentialsStore();

  // Get exchange and symbol from URL query params
  const urlExchangeId = searchParams.get('exchangeId');
  const urlSymbol = searchParams.get('symbol');

  // Initialize credentials store on component mount
  useEffect(() => {
    refreshAllCredentials();
  }, [refreshAllCredentials]);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    fetchExchangesList().then(list => {
      const options = list.map(e => ({ label: e.charAt(0).toUpperCase() + e.slice(1), value: e }));
      setExchangeOptions(options);
      
      // Priority: URL params > localStorage > defaults
      let foundExchange: ExchangeOption | null = null;
      
      if (urlExchangeId) {
        // Use exchange from URL params
        foundExchange = options.find(e => e.value.toLowerCase() === urlExchangeId.toLowerCase()) || null;
        if (foundExchange) {
          // Update localStorage with URL param value
          localStorage.setItem(LOCAL_STORAGE_KEY_EXCHANGE, foundExchange.value);
        }
      }
      
      if (!foundExchange) {
        // Fallback to localStorage or default
        const savedExchange = localStorage.getItem(LOCAL_STORAGE_KEY_EXCHANGE);
        foundExchange = options.find(e => e.value === savedExchange) || 
                       options.find(e => e.value.toLowerCase() === 'binance') || 
                       options[0] || null;
      }
      
      setSelectedExchange(foundExchange);
    });
  }, [urlExchangeId]);

  // Fetch pairs (short-markets) only when dropdown is opened or on mount/exchange change
  const fetchPairsForExchange = async (exchangeId: string) => {
    try {
      const markets = await fetchShortMarkets(exchangeId);
      
      if (!markets || markets.length === 0) {
        setPairsForExchange([]);
        return;
      }

      const pairs = markets.map((m: ShortMarketDto) => {    
        return {
          label: m.symbol,
          value: m.symbol,
        };
      });
      
      setPairsForExchange(pairs);
      
      // Priority: URL params > localStorage > defaults
      let foundPair: PairOption | null = null;
      
      if (urlSymbol) {
        // Use symbol from URL params
        foundPair = pairs.find(p => p.value.toUpperCase() === urlSymbol.toUpperCase()) || null;
        if (foundPair) {
          // Update localStorage with URL param value
          localStorage.setItem(LOCAL_STORAGE_KEY_PAIR, foundPair.value);
        }
      }
      
      if (!foundPair) {
        // Fallback to localStorage or default
        const savedPair = localStorage.getItem(LOCAL_STORAGE_KEY_PAIR);
        foundPair = pairs.find(p => p.value === savedPair) || 
                   pairs.find(p => p.value.toUpperCase() === 'BTC/USDT') || 
                   pairs[0] || null;
      }
      
      setSelectedPair(foundPair);
    } catch (error) {
      console.error(`❌ Error fetching pairs for ${exchangeId}:`, error);
      setPairsForExchange([]);
    }
  };

  // When exchange changes, clear pairs and selectedPair, and fetch pairs immediately
  useEffect(() => {
    if (selectedExchange) {
      setPairsForExchange([]);
      setSelectedPair(null);
      localStorage.setItem(LOCAL_STORAGE_KEY_EXCHANGE, selectedExchange.value);
      
      // Update URL params when exchange changes
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('exchangeId', selectedExchange.value);
      setSearchParams(newSearchParams, { replace: true });
      
      fetchPairsForExchange(selectedExchange.value);
    }
  }, [selectedExchange, searchParams, setSearchParams]);

  // Save selectedPair to localStorage and update URL
  useEffect(() => {
    if (selectedPair) {
      localStorage.setItem(LOCAL_STORAGE_KEY_PAIR, selectedPair.value);
      
      // Update URL params when pair changes
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('symbol', selectedPair.value);
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [selectedPair, searchParams, setSearchParams]);

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
        <Grid2 size={7} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, rowGap: '16px' }}>
            <Box sx={{ flex: 6, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <Paper sx={{ p: 2, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} elevation={2}>
                {selectedExchange && selectedPair && (
                  <PriceChart exchangeId={selectedExchange.value} symbol={selectedPair.value} />
                )}
              </Paper>
            </Box>
            <Box sx={{ flex: 5, display: 'flex', flexDirection: 'column', rowGap: '16px', height: '100%' }}>
              <OrderManager 
                tab={tab} 
                setTab={setTab} 
                selectedExchange={selectedExchange?.value || null}
                selectedSymbol={selectedPair?.value || null}
              />
            </Box>
          </Box>
        </Grid2>
        <Grid2 size={2.5} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '100%' }}>
          {selectedExchange && selectedPair ? (
            <OrderBook exchangeId={selectedExchange.value} symbol={selectedPair.value} />
          ) : (
            <Paper sx={{ flex: 2, p: 2, minHeight: 360, display: 'flex', flexDirection: 'column', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
              Select exchange and pair to view order book
            </Paper>
          )}
        </Grid2>
        <Grid2 size={2.5} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <TradingManager 
            selectedExchange={selectedExchange?.value || null} 
            selectedSymbol={selectedPair?.value || null}
          />
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default TradingPage; 