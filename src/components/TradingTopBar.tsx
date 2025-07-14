import type { Ticker } from '@/services/types';
import { getStreamingSocket, watchTicker } from '@/services/ws-api';
import { formatWithSubscriptZeros } from '@/utils/format';
import { Autocomplete, Box, Paper, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface ExchangeOption {
  label: string;
  value: string;
}
interface PairOption {
  label: string;
  value: string;
  lastPrice: string;
  priceChange24h: string;
  high24h: string;
  low24h: string;
}

interface ExchangeSelectProps {
  options: ExchangeOption[];
  value: ExchangeOption;
  onChange: (_event: any, value: ExchangeOption) => void;
}

const ExchangeSelect: React.FC<ExchangeSelectProps> = ({ options, value, onChange }) => (
  <Autocomplete
    options={options}
    value={value}
    onChange={onChange}
    renderInput={(params) => <TextField {...params} label="Exchange" />}
    fullWidth={false}
    sx={{ minWidth: 180 }}
    disableClearable
    isOptionEqualToValue={(option, value) => option.value === value.value}
  />
);

interface PairSelectProps {
  options: PairOption[];
  value: PairOption;
  onChange: (_event: any, value: PairOption) => void;
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

const PairSelect: React.FC<PairSelectProps> = ({ options, value, onChange, open, onOpen, onClose }) => (
  <Autocomplete
    options={[...options].sort((a, b) => a.label.localeCompare(b.label))}
    value={value}
    onChange={onChange}
    open={open}
    onOpen={onOpen}
    onClose={onClose}
    renderInput={(params) => <TextField {...params} label="Pair" />}
    fullWidth={false}
    sx={{ minWidth: 380 }}
    disableClearable
    isOptionEqualToValue={(option, value) => option.value === value.value}
    renderOption={(props, option) => {
      const { key, ...rest } = props;
      return (
        <Box
          component="li"
          key={key}
          {...rest}
          sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}
        >
          <span>{option.label}</span>
          <span style={{ color: '#888' }}>|</span>
          <span>{formatWithSubscriptZeros(option.lastPrice)}</span>
          <span style={{ color: '#888' }}>|</span>
          <span style={{ color: option.priceChange24h.startsWith('-') ? 'red' : 'green', textAlign: 'right' }}>{option.priceChange24h}</span>
        </Box>
      );
    }}
  />
);

// Smart component for real-time ticker info
interface SymbolTickerInfoProps {
  exchangeId: string;
  symbol: string;
}

const SymbolTickerInfo: React.FC<SymbolTickerInfoProps> = ({ exchangeId, symbol }) => {
  const [ticker, setTicker] = useState<Ticker | null>(null);
  useEffect(() => {
    setTicker(null); // Clear ticker on symbol/exchange change
    if (!exchangeId || !symbol) return;
    const socket = getStreamingSocket();
    const unsub = watchTicker(socket, { exchangeId, symbol }, setTicker);
    return () => {
      unsub();
    }
  }, [exchangeId, symbol]);

  if (!ticker) return null;
  // Format percent change
  const percentStr =
    typeof ticker.percentage === 'number'
      ? (ticker.percentage > 0
          ? `+${ticker.percentage.toFixed(2)}%`
          : `${ticker.percentage.toFixed(2)}%`)
      : '';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, ml: 2 }}>
      {ticker.last !== undefined && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', }}>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>Last Price</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{formatWithSubscriptZeros(ticker.last)}</span>
        </Box>
      )}
      {ticker.last !== undefined && ticker.high !== undefined && (
        <Box sx={{ width: '1px', height: '32px', background: '#181515', borderRadius: 1 }} />
      )}
      {ticker.high !== undefined && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', }}>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>24H High</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{formatWithSubscriptZeros(ticker.high)}</span>
        </Box>
      )}
      {ticker.high !== undefined && ticker.low !== undefined && (
        <Box sx={{ width: '1px', height: '32px', background: '#181515', borderRadius: 1 }} />
      )}
      {ticker.low !== undefined && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', }}>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>24H Low</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{formatWithSubscriptZeros(ticker.low)}</span>
        </Box>
      )}
      {typeof ticker.percentage === 'number' && ticker.low !== undefined && (
        <Box sx={{ width: '1px', height: '32px', background: '#181515', borderRadius: 1 }} />
      )}
      {typeof ticker.percentage === 'number' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', }}>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>24H Change</span>
          <span style={{ fontWeight: 600, fontSize: 15, color: ticker.percentage < 0 ? 'red' : ticker.percentage > 0 ? 'green' : undefined }}>{percentStr}</span>
        </Box>
      )}
    </Box>
  );
};

interface TradingTopBarProps {
  exchangeOptions: ExchangeOption[];
  selectedExchange: ExchangeOption;
  onExchangeChange: (_event: any, value: ExchangeOption) => void;
  selectedPair: PairOption;
  pairsForExchange: PairOption[];
  onPairChange: (_event: any, value: PairOption) => void;
  onPairDropdownOpen?: () => void;
  onPairDropdownClose?: () => void;
  pairDropdownOpen?: boolean;
}

const TradingTopBar: React.FC<TradingTopBarProps> = ({
  exchangeOptions,
  selectedExchange,
  onExchangeChange,
  selectedPair,
  pairsForExchange,
  onPairChange,
  onPairDropdownOpen,
  onPairDropdownClose,
  pairDropdownOpen,
}) => (
  <Paper sx={{ mb: 1, p: 1, borderRadius: 2, minHeight: 40, display: 'flex', alignItems: 'center', gap: 2 }} elevation={1}>
    <ExchangeSelect options={exchangeOptions} value={selectedExchange} onChange={onExchangeChange} />
    <PairSelect
      options={pairsForExchange}
      value={selectedPair}
      onChange={onPairChange}
      open={pairDropdownOpen}
      onOpen={onPairDropdownOpen}
      onClose={onPairDropdownClose}
    />
    {selectedExchange && selectedPair && (
      <SymbolTickerInfo exchangeId={selectedExchange.value} symbol={selectedPair.value} />
    )}
  </Paper>
);

export default TradingTopBar; 