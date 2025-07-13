import { Box, Button, ButtonGroup } from '@mui/material';
import React from 'react';

interface Timeframe {
  label: string;
  seconds: number;
}

interface TimeframeSelectProps {  
  timeframes: Timeframe[];  
  selectedIdx: number;
  onSelect: (idx: number) => void;
  sx?: object;
}

const TimeframeSelect: React.FC<TimeframeSelectProps> = ({ timeframes, selectedIdx, onSelect, sx }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
    <ButtonGroup variant="text" size="small">
      {timeframes.map((tf, idx) => (
        <Button
          key={tf.label}
          sx={{ color: selectedIdx === idx ? '#ffb300' : '#aaa', fontWeight: selectedIdx === idx ? 700 : 400 }}
          onClick={() => onSelect(idx)}
        >
          {tf.label}
        </Button>
      ))}
    </ButtonGroup>
    <Box sx={{ ml: 2, color: '#888', fontSize: 13 }}>
      {timeframes[selectedIdx]?.label ? `Timeframe: ${timeframes[selectedIdx].label}` : 'No timeframes'}
    </Box>
  </Box>
);

export default TimeframeSelect; 