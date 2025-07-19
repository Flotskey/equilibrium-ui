import { useCredentialsStore } from '@/store/credentialsStore';
import { Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { ExchangeCredentialsModal } from './credentials/ExchangeCredentialsModal';
import { LockedState } from './credentials/LockedState';

interface TradingManagerProps {
  selectedExchange: string | null;
}

const TradingManager = ({ selectedExchange }: TradingManagerProps) => {
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
          title="Trading Manager Locked"
          description={
            selectedExchange 
              ? "Connect your exchange credentials to place orders and manage trades."
              : "Select an exchange to unlock trading features."
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

  // Show normal trading manager when credentials are available
  return (
    <Paper sx={{ flex: 1, p: 2, minHeight: 240, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      Trading Manager
    </Paper>
  );
};

export default TradingManager; 