import { useCredentialsStore } from '@/store/credentialsStore';
import { Box, Paper, Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';
import { ExchangeCredentialsModal } from './credentials/ExchangeCredentialsModal';
import { LockedState } from './credentials/LockedState';

interface OrderManagerProps {
  tab: number;
  setTab: (v: number) => void;
  selectedExchange: string | null;
}

const OrderManager = ({ tab, setTab, selectedExchange }: OrderManagerProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  
  // Use Zustand store for credentials state
  const { 
    credentialsMap, 
    checkCredentials, 
    setHasCredentials, 
    startConnectionRefresh, 
    stopConnectionRefresh 
  } = useCredentialsStore();
  const hasCredentials = selectedExchange ? credentialsMap[selectedExchange] || false : false;

  // Check if credentials exist for the selected exchange and manage connection refresh
  useEffect(() => {
    if (selectedExchange) {
      const hasCreds = checkCredentials(selectedExchange);
      if (hasCreds !== hasCredentials) {
        setHasCredentials(selectedExchange, hasCreds);
      }
      
      // Start connection refresh if credentials are available
      if (hasCreds) {
        startConnectionRefresh(selectedExchange);
      } else {
        stopConnectionRefresh(selectedExchange);
      }
    }
    
    // Cleanup on unmount or exchange change
    return () => {
      if (selectedExchange) {
        stopConnectionRefresh(selectedExchange);
      }
    };
  }, [selectedExchange, checkCredentials, setHasCredentials, hasCredentials, startConnectionRefresh, stopConnectionRefresh]);

  const handleUnlock = () => {
    setModalOpen(true);
  };

  const handleCredentialsSaved = () => {
    if (selectedExchange) {
      setHasCredentials(selectedExchange, true);
      // Start connection refresh after credentials are saved
      startConnectionRefresh(selectedExchange);
    }
  };

  // If no exchange is selected or no credentials, show locked state
  if (!selectedExchange || !hasCredentials) {
    return (
      <>
        <LockedState
          title="Order Manager Locked"
          description={
            selectedExchange 
              ? "Connect your exchange credentials to view orders, positions, and trading history."
              : "Select an exchange to unlock order management features."
          }
          buttonText={
            selectedExchange 
              ? "Connect Exchange" 
              : "Select Exchange First"
          }
          onUnlock={handleUnlock}
          disabled={!selectedExchange}
        />
        
        {selectedExchange && (
          <ExchangeCredentialsModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            exchangeId={selectedExchange}
            onCredentialsSaved={handleCredentialsSaved}
          />
        )}
      </>
    );
  }

  // Show normal order manager when credentials are available
  return (
    <Paper sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
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
};

export default OrderManager; 