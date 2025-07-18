import { CcxtTicker } from "@/services/types";
import { getStreamingSocket, watchTicker } from "@/services/ws-api";
import { formatWithSubscriptZeros } from "@/utils/format";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";

interface SymbolTickerInfoProps {
    exchangeId: string;
    symbol: string;
  }
  
 export const SymbolTickerInfo: React.FC<SymbolTickerInfoProps> = ({ exchangeId, symbol }) => {
    const [ticker, setTicker] = useState<CcxtTicker | null>(null);
    useEffect(() => {
      setTicker(null); // Clear ticker on symbol/exchange change
      if (!exchangeId || !symbol) return;
      const socket = getStreamingSocket();
      const unsub = watchTicker(socket, { exchangeId, symbol }, setTicker);
      return () => {
        unsub();
      }
    }, [exchangeId, symbol]);
  
    if (!ticker) return null;
    // Format percent change
    const percentStr =
      typeof ticker.percentage === 'number'
        ? (ticker.percentage > 0
            ? `+${ticker.percentage.toFixed(2)}%`
            : `${ticker.percentage.toFixed(2)}%`)
        : '';
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, ml: 2 }}>
        {ticker.last !== undefined && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', }}>
            <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>Last Price</span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{formatWithSubscriptZeros(ticker.last)}</span>
          </Box>
        )}
        {ticker.last !== undefined && ticker.high !== undefined && (
          <Box sx={{ width: '1px', height: '32px', background: '#181515', borderRadius: 1 }} />
        )}
        {ticker.high !== undefined && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', }}>
            <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>24H High</span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{formatWithSubscriptZeros(ticker.high)}</span>
          </Box>
        )}
        {ticker.high !== undefined && ticker.low !== undefined && (
          <Box sx={{ width: '1px', height: '32px', background: '#181515', borderRadius: 1 }} />
        )}
        {ticker.low !== undefined && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', }}>
            <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>24H Low</span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{formatWithSubscriptZeros(ticker.low)}</span>
          </Box>
        )}
        {typeof ticker.percentage === 'number' && ticker.low !== undefined && (
          <Box sx={{ width: '1px', height: '32px', background: '#181515', borderRadius: 1 }} />
        )}
        {typeof ticker.percentage === 'number' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', }}>
            <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>24H Change</span>
            <span style={{ fontWeight: 600, fontSize: 15, color: ticker.percentage < 0 ? 'red' : ticker.percentage > 0 ? 'green' : undefined }}>{percentStr}</span>
          </Box>
        )}
      </Box>
    );
  };