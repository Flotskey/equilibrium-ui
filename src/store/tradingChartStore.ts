import { create } from "zustand";

export type DragType = null | "entry" | "sl" | "tp";

export interface TradingChartState {
  entryPrice: number;
  slPrice: number;
  tpPrice: number;
  dragging: DragType;
  setEntryPrice: (p: number) => void;
  setSLPrice: (p: number) => void;
  setTPPrice: (p: number) => void;
  setDragging: (d: DragType) => void;
}

export const useTradingChartStore = create<TradingChartState>(
  (
    set: (fn: (state: TradingChartState) => Partial<TradingChartState>) => void
  ) => ({
    entryPrice: 67800,
    slPrice: 67400,
    tpPrice: 68400,
    dragging: null,
    setEntryPrice: (p: number) => set(() => ({ entryPrice: p })),
    setSLPrice: (p: number) => set(() => ({ slPrice: p })),
    setTPPrice: (p: number) => set(() => ({ tpPrice: p })),
    setDragging: (d: DragType) => set(() => ({ dragging: d })),
  })
);
