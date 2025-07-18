import { Paper } from '@mui/material';
import React from 'react';
import { ExchangeOption, ExchangeSelect } from './ExchangeSelect';
import { PairOption, PairSelect } from './PairSelect';
import { SymbolTickerInfo } from './SymbolTickerInfo';

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