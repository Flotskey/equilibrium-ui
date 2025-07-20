import { fetchMarket, fetchOhlcv, fetchTimeframes } from '@/services/api';
import { OhlcvWsMessage } from '@/services/types';
import { getStreamingSocket, watchOhlcv } from '@/services/ws-api';
import type { TradingChartState } from '@/store/tradingChartStore';
import { useTradingChartStore } from '@/store/tradingChartStore';
import { stepToPrecision } from '@/utils/format';
import { Box } from '@mui/material';
import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  Time
} from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';
import TimeframeSelect from './TimeframeSelect';

interface TimeframeDef { label: string; seconds: number; }

interface TradingChartProps {
  exchangeId: string;
  symbol: string;
}

const PriceChart = ({ exchangeId, symbol }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const entryLineRef = useRef<IPriceLine | null>(null);
  const slLineRef = useRef<IPriceLine | null>(null);
  const tpLineRef = useRef<IPriceLine | null>(null);
  const [selectedTimeframeIdx, setSelectedTimeframeIdx] = useState(2); // default 15m
  const [timeframes, setTimeframes] = useState<TimeframeDef[]>([]);
  const [timeframesLoading, setTimeframesLoading] = useState(false);
  const [handlePositions, setHandlePositions] = useState<{ entry: number; sl: number; tp: number }>({ entry: 0, sl: 0, tp: 0 });
  const dragYRef = useRef<number | null>(null);
  const candleDataRef = useRef<CandlestickData<Time>[]>([]); // holds the current candles
  const currentTimeframeRef = useRef<string>(''); // track current timeframe
  const [loading, setLoading] = useState(true);
  const [pricePrecision, setPricePrecision] = useState(6); // default to 6

  // Zustand state
  const entryPrice = useTradingChartStore((s: TradingChartState) => s.entryPrice);
  const slPrice = useTradingChartStore((s: TradingChartState) => s.slPrice);
  const tpPrice = useTradingChartStore((s: TradingChartState) => s.tpPrice);
  const dragging = useTradingChartStore((s: TradingChartState) => s.dragging);
  const setEntryPrice = useTradingChartStore((s: TradingChartState) => s.setEntryPrice);
  const setSLPrice = useTradingChartStore((s: TradingChartState) => s.setSLPrice);
  const setTPPrice = useTradingChartStore((s: TradingChartState) => s.setTPPrice);
  const setDragging = useTradingChartStore((s: TradingChartState) => s.setDragging);

  // Fetch available timeframes for the exchange
  useEffect(() => {
    if (!exchangeId) return;
    setTimeframesLoading(true);
    fetchTimeframes(exchangeId)
      .then((tfObj) => {
        // tfObj: { '1m': '1', ... }
        // Map to array: label, seconds, backend
        const labelToSeconds: Record<string, number> = {
          '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '2h': 7200, '4h': 14400, '6h': 21600, '12h': 43200, '1d': 86400, '1w': 604800, '1M': 2592000, 'D': 86400, 'W': 604800, 'M': 2592000
        };
        const arr: TimeframeDef[] = Object.keys(tfObj).map(label => ({
          label,
          seconds: labelToSeconds[label] ?? 0,
        })).filter(tf => tf.seconds > 0);
        // Sort by seconds ascending
        arr.sort((a, b) => a.seconds - b.seconds);
        setTimeframes(arr);
        setSelectedTimeframeIdx(arr.length > 0 ? 2 : -1); // default to third available or -1 if none
      })
      .finally(() => setTimeframesLoading(false));
  }, [exchangeId]);

  // Fetch market info and set price precision
  useEffect(() => {
    if (!exchangeId || !symbol) return;
    fetchMarket(exchangeId, symbol)
      .then(mkt => {
        setPricePrecision(stepToPrecision(mkt.precision?.price ?? 1e-6));
      })
      .catch(() => setPricePrecision(6));
  }, [exchangeId, symbol]);

  // Chart initialization and price lines
  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    const width = chartContainerRef.current.clientWidth;
    const height = chartContainerRef.current.clientHeight;
    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#181A20' },
        textColor: '#ccc',
      },
      grid: { vertLines: { color: '#222' }, horzLines: { color: '#222' } },
      rightPriceScale: { borderColor: '#444' },
      timeScale: { borderColor: '#444' },
    });
    chartRef.current = chart;
    const candleSeries = chart.addSeries(CandlestickSeries, {
      priceFormat: {
        type: 'price',
        precision: pricePrecision,
        minMove: Math.pow(10, -pricePrecision),
      }
    });
    candleSeriesRef.current = candleSeries;

    // Create price lines (Entry: gold, TP: green, SL: red)
    // TODO: add price lines logic later
    // entryLineRef.current = candleSeries.createPriceLine({
    //   price: entryPrice,
    //   color: 'gold',
    //   lineWidth: 1,
    //   lineStyle: LineStyle.Dashed,
    //   axisLabelVisible: true,
    //   title: 'Entry',
    // });
    // slLineRef.current = candleSeries.createPriceLine({
    //   price: slPrice,
    //   color: 'red',
    //   lineWidth: 1,
    //   lineStyle: LineStyle.Dashed,
    //   axisLabelVisible: true,
    //   title: 'SL',
    // });
    // tpLineRef.current = candleSeries.createPriceLine({
    //   price: tpPrice,
    //   color: 'green',
    //   lineWidth: 1,
    //   lineStyle: LineStyle.Dashed,
    //   axisLabelVisible: true,
    //   title: 'TP',
    // });

    // Responsive resize
    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
      updateHandlePositions();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [selectedTimeframeIdx, timeframes, pricePrecision]);

  // Unified candle mapping and deduplication
  function mapCandle(candle: [number, number, number, number, number, number]) {
    const [time, open, high, low, close, volume] = candle;
    return {
      time: Math.floor(time / 1000) as Time, // always seconds
      open, high, low, close,
    };
  }
  function dedupeAndSort(candles: { time: Time, open: number, high: number, low: number, close: number }[]) {
    const deduped = Array.from(new Map(candles.map(c => [c.time, c])).values());
    deduped.sort((a, b) => Number(a.time) - Number(b.time));
    return deduped;
  }

  useEffect(() => {
    if (!timeframes.length) return;
    let isMounted = true;
    setLoading(true);
    const tf = timeframes[selectedTimeframeIdx]?.label || timeframes[0]?.label;
    if (!tf) return;
    fetchOhlcv({ exchangeId, symbol, timeframe: tf, limit: 100 })
      .then((data) => {
        if (!isMounted) return;
        const candles = data.map(mapCandle);
        candleDataRef.current = dedupeAndSort(candles);
        candleSeriesRef.current?.setData(candleDataRef.current);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [exchangeId, symbol, selectedTimeframeIdx, timeframes]);

  // WebSocket subscription - include timeframe in dependencies but handle efficiently
  useEffect(() => {
    if (!exchangeId || !symbol || !timeframes.length) return;
    const tf = timeframes[selectedTimeframeIdx]?.label || timeframes[0]?.label;
    if (!tf) return;
    
    const socket = getStreamingSocket();
    const handleCandle = (msg: OhlcvWsMessage) => {
      const c = mapCandle(msg.candle);
      // Update last or push new, merging high/low for same time
      const arr = candleDataRef.current;
      const idx = arr.findIndex(x => x.time === c.time);
      if (idx !== -1) {
        arr[idx] = {
          ...arr[idx],
          open: arr[idx].open,
          close: c.close,
          high: Math.max(arr[idx].high, c.high),
          low: Math.min(arr[idx].low, c.low),
        };
      } else {
        arr.push(c); // append new candle
      }
      candleDataRef.current = dedupeAndSort(arr);
      candleSeriesRef.current?.setData([...candleDataRef.current]);
    };
    
    console.log(`Setting up WebSocket subscription for ${exchangeId}/${symbol}/${tf}`);
    
    // Subscribe to WebSocket stream
    const unsub = watchOhlcv(socket, { exchangeId, symbol, timeframe: tf }, handleCandle);
    
    return () => {
      console.log(`Cleaning up WebSocket subscription for ${exchangeId}/${symbol}/${tf}`);
      unsub();
    };
  }, [exchangeId, symbol, selectedTimeframeIdx, timeframes]); // Include timeframe dependencies

  // Update price lines and handle positions when prices or timeframe change
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    // Remove old lines if they exist
    if (entryLineRef.current) candleSeriesRef.current.removePriceLine(entryLineRef.current);
    if (slLineRef.current) candleSeriesRef.current.removePriceLine(slLineRef.current);
    if (tpLineRef.current) candleSeriesRef.current.removePriceLine(tpLineRef.current);
    // Add new lines (Entry: gold, TP: green, SL: red)
    // TODO: add price lines logic later
    // entryLineRef.current = candleSeriesRef.current.createPriceLine({
    //   price: entryPrice,
    //   color: 'gold',
    //   lineWidth: 1,
    //   lineStyle: LineStyle.Dashed,
    //   axisLabelVisible: true,
    //   title: 'Entry',
    // });
    // slLineRef.current = candleSeriesRef.current.createPriceLine({
    //   price: slPrice,
    //   color: 'red',
    //   lineWidth: 1,
    //   lineStyle: LineStyle.Dashed,
    //   axisLabelVisible: true,
    //   title: 'SL',
    // });
    // tpLineRef.current = candleSeriesRef.current.createPriceLine({
    //   price: tpPrice,
    //   color: 'green',
    //   lineWidth: 1,
    //   lineStyle: LineStyle.Dashed,
    //   axisLabelVisible: true,
    //   title: 'TP',
    // });
    updateHandlePositions();
    // Including selectedTimeframeIdx ensures price lines are recreated after timeframe change/chart re-init
  }, [entryPrice, slPrice, tpPrice, selectedTimeframeIdx]);

  // Update handle positions (Y in px) for overlays
  function updateHandlePositions(): void {
    if (!chartRef.current || !candleSeriesRef.current) return;
    const entryY: number | null = candleSeriesRef.current.priceToCoordinate(entryPrice);
    const slY: number | null = candleSeriesRef.current.priceToCoordinate(slPrice);
    const tpY: number | null = candleSeriesRef.current.priceToCoordinate(tpPrice);
    setHandlePositions({
      entry: entryY ?? 0,
      sl: slY ?? 0,
      tp: tpY ?? 0,
    });
  }

  // Drag logic
  function onDragStart(type: 'entry' | 'sl' | 'tp', e: React.MouseEvent): void {
    setDragging(type);
    document.body.style.cursor = 'grabbing';
  }
  function onDrag(e: React.MouseEvent): void {
    if (!dragging || !chartRef.current || !candleSeriesRef.current || !chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    dragYRef.current = y;
  }
  function onDragEnd(e: React.MouseEvent): void {
    if (!dragging || !chartRef.current || !candleSeriesRef.current || !chartContainerRef.current) {
      setDragging(null);
      document.body.style.cursor = '';
      return;
    }
    const y = dragYRef.current;
    if (typeof y === 'number') {
      const price = candleSeriesRef.current.coordinateToPrice(y);
      if (typeof price === 'number') {
        if (dragging === 'entry') setEntryPrice(Number(price.toFixed(2)));
        if (dragging === 'sl') setSLPrice(Number(price.toFixed(2)));
        if (dragging === 'tp') setTPPrice(Number(price.toFixed(2)));
      }
    }
    setDragging(null);
    document.body.style.cursor = '';
    dragYRef.current = null;
  }

  // Sync handle positions on price/resize
  useEffect(() => {
    updateHandlePositions();
  }, [entryPrice, slPrice, tpPrice]);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {timeframesLoading ? (
        <Box sx={{ p: 2, textAlign: 'center', color: '#888' }}>Loading timeframes...</Box>
      ) : (
        <TimeframeSelect
          timeframes={timeframes.map(({ label, seconds }) => ({ label, seconds }))}
          selectedIdx={selectedTimeframeIdx}
          onSelect={setSelectedTimeframeIdx}
          sx={{ mb: 1, pl: 1 }}
        />
      )}
      <Box sx={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        {loading && <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
        <div
          ref={chartContainerRef}
          style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, flex: 1 }}
          onMouseMove={dragging ? onDrag : undefined}
          onMouseUp={dragging ? onDragEnd : undefined}
          onMouseLeave={dragging ? onDragEnd : undefined}
        />
      </Box>
    </Box>
  );
};

export default PriceChart; 