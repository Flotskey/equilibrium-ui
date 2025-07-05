import { Box, Button, ButtonGroup } from '@mui/material';
import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  LineStyle,
  Time,
  WhitespaceData,
} from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

const data = [
  { time: '2024-06-01', open: 67000, high: 67500, low: 66500, close: 67200 },
  { time: '2024-06-02', open: 67200, high: 67800, low: 67000, close: 67600 },
  { time: '2024-06-03', open: 67600, high: 68000, low: 67400, close: 67800 },
  { time: '2024-06-04', open: 67800, high: 68200, low: 67700, close: 68000 },
  { time: '2024-06-05', open: 68000, high: 68500, low: 67900, close: 68400 },
  { time: '2024-06-06', open: 68400, high: 68800, low: 68300, close: 68700 },
  { time: '2024-06-07', open: 68700, high: 69000, low: 68600, close: 68900 },
];

const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', 'D', 'W', 'M'];

const initialEntry = 67800;
const initialSL = 67400;
const initialTP = 68400;

const handleStyle = (color: string, dragging: boolean): React.CSSProperties => ({
  position: 'absolute',
  left: 0,
  width: '100%',
  height: '16px',
  borderRadius: '4px',
  cursor: 'ns-resize',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 600,
  fontSize: '12px',
  pointerEvents: 'auto',
  userSelect: 'none',
  background: dragging ? `${color}44` : `${color}22`,
  boxShadow: dragging ? `0 0 8px 2px ${color}88` : undefined,
});

const TradingChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<
    ISeriesApi<'Candlestick', Time, CandlestickData<Time> | WhitespaceData<Time>, any, any> | null
  >(null);
  const entryLineRef = useRef<IPriceLine | null>(null);
  const slLineRef = useRef<IPriceLine | null>(null);
  const tpLineRef = useRef<IPriceLine | null>(null);

  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30m');
  const [entryPrice, setEntryPrice] = useState<number>(initialEntry);
  const [slPrice, setSLPrice] = useState<number>(initialSL);
  const [tpPrice, setTPPrice] = useState<number>(initialTP);
  const [dragging, setDragging] = useState<null | 'entry' | 'sl' | 'tp'>(null);
  const [handlePositions, setHandlePositions] = useState<{ entry: number; sl: number; tp: number }>({ entry: 0, sl: 0, tp: 0 });

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
    const candleSeries = chart.addSeries(CandlestickSeries, {});
    candleSeriesRef.current = candleSeries;
    candleSeries.setData(data);

    // Initial price lines
    entryLineRef.current = candleSeries.createPriceLine({
      price: entryPrice,
      color: 'green',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Entry',
    });
    slLineRef.current = candleSeries.createPriceLine({
      price: slPrice,
      color: 'red',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'SL',
    });
    tpLineRef.current = candleSeries.createPriceLine({
      price: tpPrice,
      color: 'gold',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'TP',
    });

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

    // Initial handle positions
    setTimeout(updateHandlePositions, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line
  }, []);

  // Update price lines and handle positions when prices change
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    // Remove old lines
    if (entryLineRef.current) candleSeriesRef.current.removePriceLine(entryLineRef.current);
    if (slLineRef.current) candleSeriesRef.current.removePriceLine(slLineRef.current);
    if (tpLineRef.current) candleSeriesRef.current.removePriceLine(tpLineRef.current);
    // Add new lines
    entryLineRef.current = candleSeriesRef.current.createPriceLine({
      price: entryPrice,
      color: 'green',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Entry',
    });
    slLineRef.current = candleSeriesRef.current.createPriceLine({
      price: slPrice,
      color: 'red',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'SL',
    });
    tpLineRef.current = candleSeriesRef.current.createPriceLine({
      price: tpPrice,
      color: 'gold',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'TP',
    });
    updateHandlePositions();
    // eslint-disable-next-line
  }, [entryPrice, slPrice, tpPrice]);

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
    document.body.style.cursor = 'ns-resize';
  }
  function onDrag(e: React.MouseEvent): void {
    if (!dragging || !chartRef.current || !candleSeriesRef.current) return;
    // const rect = chartContainerRef.current!.getBoundingClientRect();
    // const y = e.clientY - rect.top;
    // const price = candleSeriesRef.current.coordinateToPrice(y);
    // if (typeof price === 'number') {
    //   if (dragging === 'entry') setEntryPrice(Number(price.toFixed(2)));
    //   if (dragging === 'sl') setSLPrice(Number(price.toFixed(2)));
    //   if (dragging === 'tp') setTPPrice(Number(price.toFixed(2)));
    // }
  }
  function onDragEnd(e: React.MouseEvent): void {
    if (!dragging || !chartRef.current || !candleSeriesRef.current) return;
    
    const rect = chartContainerRef.current!.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const price = candleSeriesRef.current.coordinateToPrice(y);
    if (typeof price === 'number') {
      if (dragging === 'entry') setEntryPrice(Number(price.toFixed(2)));
      if (dragging === 'sl') setSLPrice(Number(price.toFixed(2)));
      if (dragging === 'tp') setTPPrice(Number(price.toFixed(2)));
    }

    setDragging(null);
    document.body.style.cursor = '';
  }

  // Sync handle positions on price/resize
  useEffect(() => {
    updateHandlePositions();
    // eslint-disable-next-line
  }, [entryPrice, slPrice, tpPrice]);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, pl: 1 }}>
        <ButtonGroup variant="text" size="small">
          {timeframes.map(tf => (
            <Button
              key={tf}
              sx={{ color: selectedTimeframe === tf ? '#ffb300' : '#aaa', fontWeight: selectedTimeframe === tf ? 700 : 400 }}
              onClick={() => setSelectedTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </ButtonGroup>
      </Box>
      <Box sx={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        <div
          ref={chartContainerRef}
          style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, flex: 1 }}
          onMouseMove={dragging ? onDrag : undefined}
          onMouseUp={dragging ? onDragEnd : undefined}
          onMouseLeave={dragging ? onDragEnd : undefined}
        />
        {/* Entry handle */}
        <div
          style={{ ...handleStyle('green', dragging === 'entry'), top: handlePositions.entry }}
          onMouseDown={e => onDragStart('entry', e)}
        >
          Entry ({entryPrice})
        </div>
        {/* SL handle */}
        <div
          style={{ ...handleStyle('red', dragging === 'sl'), top: handlePositions.sl }}
          onMouseDown={e => onDragStart('sl', e)}
        >
          SL ({slPrice})
        </div>
        {/* TP handle */}
        <div
          style={{ ...handleStyle('gold', dragging === 'tp'), top: handlePositions.tp }}
          onMouseDown={e => onDragStart('tp', e)}
        >
          TP ({tpPrice})
        </div>
      </Box>
    </Box>
  );
};

export default TradingChart; 