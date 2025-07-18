import { Autocomplete, TextField } from "@mui/material";

export interface ExchangeOption {
    label: string;
    value: string;
  }
  
  interface ExchangeSelectProps {
    options: ExchangeOption[];
    value: ExchangeOption;
    onChange: (_event: any, value: ExchangeOption) => void;
  }
  
  export const ExchangeSelect: React.FC<ExchangeSelectProps> = ({ options, value, onChange }) => (
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