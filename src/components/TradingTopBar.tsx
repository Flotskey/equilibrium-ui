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
    options={options}
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
          <span>{option.lastPrice}</span>
          <span style={{ color: '#888' }}>|</span>
          <span style={{ color: option.priceChange24h.startsWith('-') ? 'red' : 'green', textAlign: 'right' }}>{option.priceChange24h}</span>
        </Box>
      );
    }}
  />
);

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
    {/* TODO: a place for other data */}
  </Paper>
);

export default TradingTopBar; 