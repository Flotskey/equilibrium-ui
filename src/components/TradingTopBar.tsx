import { Autocomplete, Box, Paper, TextField } from '@mui/material';
import React from 'react';

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

interface TradingTopBarProps {
  exchangeOptions: ExchangeOption[];
  selectedExchange: ExchangeOption;
  onExchangeChange: (_event: any, value: ExchangeOption) => void;
  selectedPair: PairOption;
  pairsForExchange: PairOption[];
  onPairChange: (_event: any, value: PairOption) => void;
}

const TradingTopBar: React.FC<TradingTopBarProps> = ({
  exchangeOptions,
  selectedExchange,
  onExchangeChange,
  selectedPair,
  pairsForExchange,
  onPairChange,
}) => (
  <Paper sx={{ mb: 1, p: 1, borderRadius: 2, minHeight: 40, display: 'flex', alignItems: 'center', gap: 2 }} elevation={1}>
    <Autocomplete
      options={exchangeOptions}
      value={selectedExchange}
      onChange={onExchangeChange}
      renderInput={(params) => <TextField {...params} label="Exchange" />}
      fullWidth={false}
      sx={{ minWidth: 180 }}
      disableClearable
      isOptionEqualToValue={(option, value) => option.value === value.value}
    />
    <Autocomplete
      options={pairsForExchange}
      value={selectedPair}
      onChange={onPairChange}
      renderInput={(params) => <TextField {...params} label="Pair" />}
      fullWidth={false}
      sx={{ minWidth: 240 }}
      disableClearable
      isOptionEqualToValue={(option, value) => option.value === value.value}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 2 }}>
          <span>{option.label}</span>
          <span>{option.lastPrice}</span>
          <span style={{ color: option.priceChange24h.startsWith('-') ? 'red' : 'green', minWidth: 56, textAlign: 'right' }}>{option.priceChange24h}</span>
        </Box>
      )}
    />
    <Box sx={{ ml: 2, fontWeight: 500 }}>
      {selectedExchange && selectedPair
        ? `${selectedExchange.label} / ${selectedPair.label}`
        : 'Select Exchange & Pair'}
    </Box>
  </Paper>
);

export default TradingTopBar; 