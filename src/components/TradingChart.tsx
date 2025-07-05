import { CandlestickSeries, ColorType, createChart } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

const data = [
  { time: '2024-06-01', open: 67000, high: 67500, low: 66500, close: 67200 },
  { time: '2024-06-02', open: 67200, high: 67800, low: 67000, close: 67600 },
  { time: '2024-06-03', open: 67600, high: 68000, low: 67400, close: 67800 },
  { time: '2024-06-04', open: 67800, high: 68200, low: 67700, close: 68000 },
  { time: '2024-06-05', open: 68000, high: 68500, low: 67900, close: 68400 },
  { time: '2024-06-06', open: 68400, high: 68800, low: 68300, close: 68700 },
  { time: '2024-06-07', open: 68700, high: 69000, low: 68600, close: 68900 },
];

const TradingChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    // Remove previous chart if any
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
    const series = chart.addSeries(CandlestickSeries, {});
    series.setData(data);

    // Responsive resize
    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  return (
    <div ref={chartContainerRef} style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, flex: 1 }} />
  );
};

export default TradingChart; 