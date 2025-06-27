import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Autocomplete, Box, IconButton, Paper, TextField } from '@mui/material';
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
  selectedExchange: ExchangeOption | null;
  selectedPair: PairOption | null;
  pairsForExchange: PairOption[];
  handleBack: () => void;
  handlePairChange: (_event: any, value: PairOption | null) => void;
}

const TradingTopBar: React.FC<TradingTopBarProps> = ({
  selectedExchange,
  selectedPair,
  pairsForExchange,
  handleBack,
  handlePairChange,
}) => (
  <Paper sx={{ mb: 1, p: 2, borderRadius: 2, minHeight: 56, display: 'flex', alignItems: 'center', gap: 2 }} elevation={1}>
    <IconButton onClick={handleBack} size="small" color="primary">
      <ArrowBackIcon />
    </IconButton>
    <Autocomplete
      options={pairsForExchange}
      value={selectedPair ?? undefined}
      onChange={handlePairChange}
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