import { Autocomplete, Box, TextField } from "@mui/material";

export interface PairOption {
    label: string;
    value: string;
  }

interface PairSelectProps {
    options: PairOption[];
    value: PairOption;
    onChange: (_event: any, value: PairOption) => void;
    open?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
  }
  
 export const PairSelect: React.FC<PairSelectProps> = ({ options, value, onChange, open, onOpen, onClose }) => (
    <Autocomplete
      options={[...options].sort((a, b) => a.label.localeCompare(b.label))}
      value={value}
      onChange={onChange}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      renderInput={(params) => <TextField {...params} label="Pair" />}
      fullWidth={false}
      sx={{ minWidth: 240 }}
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
          </Box>
        );
      }}
    />
  );