import { useNotify } from '@/components/NotificationProvider';
import { usePrivateConnection } from '@/hooks';
import { CcxtOrder, CcxtPosition } from '@/services/types';
import { getPrivateStreamingSocket, watchOrders, watchPositions } from '@/services/ws-api';
import { Box, Paper, Tab, Tabs } from '@mui/material';
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

  const handleCancelOrder = (orderId: string) => {
    // TODO: Implement cancel order functionality
    console.log('Cancel order:', orderId);
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
            onCredentialsSaved={() => {}}
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
        {tab === 1 && selectedExchange && (
          <OrderHistory 
            exchangeId={selectedExchange} 
            symbol={selectedSymbol || undefined}
          />
        )}
        {tab === 2 && selectedExchange && (
          <TradeHistory 
            exchangeId={selectedExchange} 
            symbol={selectedSymbol || undefined}
          />
        )}
        {tab === 3 && (
          <Positions positions={positions} />
        )}
      </Box>
    </Paper>
  );
};

export default OrderManager; 