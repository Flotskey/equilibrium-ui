import { create } from "zustand";
import { devtools } from "zustand/middleware";

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

export const useTradingChartStore = create<TradingChartState>()(
  devtools(
    (set) => ({
      entryPrice: 1000,
      slPrice: 997,
      tpPrice: 1021,
      dragging: null,
      setEntryPrice: (p: number) =>
        set(() => ({ entryPrice: p }), false, "setEntryPrice"),
      setSLPrice: (p: number) =>
        set(() => ({ slPrice: p }), false, "setSLPrice"),
      setTPPrice: (p: number) =>
        set(() => ({ tpPrice: p }), false, "setTPPrice"),
      setDragging: (d: DragType) =>
        set(() => ({ dragging: d }), false, "setDragging"),
    }),
    { name: "TradingChartStore" }
  )
);
