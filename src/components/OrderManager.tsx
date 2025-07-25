import { useNotify } from '@/components/NotificationProvider';
import { usePrivateConnection } from '@/hooks';
import { cancelOrder } from '@/services/api';
import { CcxtOrder, CcxtPosition } from '@/services/types';
import { getPrivateStreamingSocket, watchOrders, watchPositions } from '@/services/ws-api';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { ExchangeCredentialsModal } from './credentials/ExchangeCredentialsModal';
import { LockedState } from './credentials/LockedState';
import OpenOrders from './OpenOrders';
import OrderHistory from './OrderHistory';
import Positions from './Positions';
import TradeHistory from './TradeHistory';

interface OrderManagerProps {
  tab: number;
  setTab: (v: number) => void;
  selectedExchange: string | null;
  selectedSymbol?: string | null;
}

const OrderManager = ({ tab, setTab, selectedExchange, selectedSymbol }: OrderManagerProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [orders, setOrders] = useState<CcxtOrder[]>([]);
  const [positions, setPositions] = useState<CcxtPosition[]>([]);
  const notify = useNotify();
  
  // Use custom hook for connection management
  const { hasCredentials, isConnected } = usePrivateConnection({ exchangeId: selectedExchange });

  // Refs for cleanup functions
  const ordersCleanupRef = useRef<(() => void) | null>(null);
  const positionsCleanupRef = useRef<(() => void) | null>(null);

  // WebSocket streaming for orders and positions - only start when connected
  useEffect(() => {
    if (!selectedExchange || !hasCredentials || !isConnected) {
      // Cleanup existing streams
      if (ordersCleanupRef.current) {
        ordersCleanupRef.current();
        ordersCleanupRef.current = null;
      }
      if (positionsCleanupRef.current) {
        positionsCleanupRef.current();
        positionsCleanupRef.current = null;
      }
      setOrders([]);
      setPositions([]);
      return;
    }

    const setupWebSocketStreams = async () => {
      try {
        const socket = await getPrivateStreamingSocket();
        
        // Cleanup existing streams
        if (ordersCleanupRef.current) {
          ordersCleanupRef.current();
        }
        if (positionsCleanupRef.current) {
          positionsCleanupRef.current();
        }

        // Start orders stream
        ordersCleanupRef.current = await watchOrders(
          socket,
          { exchangeId: selectedExchange, symbol: selectedSymbol || undefined },
          (newOrders) => {
            setOrders(newOrders);
          }
        );

        // Start positions stream
        positionsCleanupRef.current = await watchPositions(
          socket,
          { exchangeId: selectedExchange, symbol: selectedSymbol || undefined },
          (newPositions) => {
            setPositions(newPositions);
          }
        );
      } catch (error) {
        console.error('Failed to setup WebSocket streams:', error);
        notify({ 
          message: 'Failed to connect to trading streams. Please check your authentication.', 
          severity: 'error' 
        });
      }
    };

    setupWebSocketStreams();

    // Cleanup on unmount or dependency change
    return () => {
      if (ordersCleanupRef.current) {
        ordersCleanupRef.current();
        ordersCleanupRef.current = null;
      }
      if (positionsCleanupRef.current) {
        positionsCleanupRef.current();
        positionsCleanupRef.current = null;
      }
    };
  }, [selectedExchange, selectedSymbol, hasCredentials, isConnected, notify]);

  const handleUnlock = () => {
    setModalOpen(true);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!selectedExchange) {
      notify({ message: 'No exchange selected', severity: 'error' });
      return;
    }

    try {
      const result = await cancelOrder({
        exchangeId: selectedExchange,
        id: orderId,
        symbol: selectedSymbol || undefined
      });

      notify({ 
        message: `Order ${orderId} cancelled successfully`, 
        severity: 'success' 
      });
      
      console.log('Cancel order result:', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
      notify({ message: errorMessage, severity: 'error' });
    }
  };

  // If no exchange is selected or no credentials, show locked state
  if (!selectedExchange || !hasCredentials || !isConnected) {
    return (
      <>
        <LockedState
          title="Order Manager Locked"
          description={
            !selectedExchange 
              ? "Select an exchange to unlock trading features."
              : !hasCredentials 
                ? "Connect your exchange credentials to place orders and manage trades."
                : "Connecting to exchange... Please wait for the connection to be established."
          }
          buttonText={
            !selectedExchange 
              ? "Select Exchange First"
              : !hasCredentials 
                ? "Connect Exchange" 
                : "Connecting..."
          }
          onUnlock={handleUnlock}
          disabled={!selectedExchange}
        />
        
        {selectedExchange && (
          <ExchangeCredentialsModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            exchangeId={selectedExchange}
          />
        )}
      </>
    );
  }

  return (
    <Paper sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
        <Tab label="Open Orders" />
        <Tab label="Order History" />
        <Tab label="Trade History" />
        <Tab label="Positions" />
      </Tabs>
      <Box sx={{ p: 2, flex: 1, minHeight: 0, overflow: 'auto' }}>
        {tab === 0 && (
          <OpenOrders 
            orders={orders} 
            onCancelOrder={handleCancelOrder}
          />
        )}
        {tab === 1 && selectedExchange && selectedSymbol && isConnected && (
          <OrderHistory 
            exchangeId={selectedExchange} 
            symbol={selectedSymbol}
          />
        )}
        {tab === 2 && selectedExchange && selectedSymbol && isConnected && (
          <TradeHistory 
            exchangeId={selectedExchange} 
            symbol={selectedSymbol}
          />
        )}
        {tab === 3 && (
          <Positions positions={positions} />
        )}
        
        {/* Show message when symbol is not selected for history tabs */}
        {tab === 1 && selectedExchange && !selectedSymbol && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              Please select a symbol to view order history
            </Typography>
          </Box>
        )}
        {tab === 2 && selectedExchange && !selectedSymbol && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              Please select a symbol to view trade history
            </Typography>
          </Box>
        )}
        
        {/* Show message when connection is not established for history tabs */}
        {tab === 1 && selectedExchange && selectedSymbol && !isConnected && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              Connecting to exchange... Please wait
            </Typography>
          </Box>
        )}
        {tab === 2 && selectedExchange && selectedSymbol && !isConnected && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              Connecting to exchange... Please wait
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default OrderManager; 