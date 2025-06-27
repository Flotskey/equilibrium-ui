import { Box, Paper, Tab, Tabs } from '@mui/material';

const OrdersTabs = ({ tab, setTab }: { tab: number, setTab: (v: number) => void }) => (
  <Paper sx={{ p: 0, minHeight: 400, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
    <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
      <Tab label="Positions" />
      <Tab label="Open Orders" />
      <Tab label="Order History" />
      <Tab label="Trade History" />
      <Tab label="Assets" />
    </Tabs>
    <Box sx={{ p: 2, flex: 1, minHeight: 0, overflow: 'auto' }}>
      {tab === 0 && 'Positions'}
      {tab === 1 && 'Open Orders'}
      {tab === 2 && 'Order History'}
      {tab === 3 && 'Trade History'}
      {tab === 4 && 'Assets'}
    </Box>
  </Paper>
);

export default OrdersTabs; 