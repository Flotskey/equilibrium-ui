// Exchange-specific TP/SL order configuration
export interface TpSlOrderConfig {
  // Basic parameters
  takeProfitParam: string;
  stopLossParam: string;

  // Order type for TP/SL orders
  takeProfitOrderType?: string;
  stopLossOrderType?: string;

  // Additional required parameters
  additionalParams?: Record<string, any>;

  // Special handling flags
  requiresTriggerPrice?: boolean;
  requiresExecutePrice?: boolean;
  requiresReduceOnly?: boolean;
  requiresClosePosition?: boolean;
  requiresAlgoType?: boolean;
  requiresOrderPriceType?: boolean;
  requiresCloseOnTrigger?: boolean;
}

export const EXCHANGE_TP_SL_CONFIG: Record<string, TpSlOrderConfig> = {
  binance: {
    takeProfitParam: "stopPrice",
    stopLossParam: "stopPrice",
    takeProfitOrderType: "TAKE_PROFIT",
    stopLossOrderType: "STOP_LOSS",
    requiresClosePosition: true, // For futures
    additionalParams: {
      timeInForce: "GTC",
    },
  },

  bybit: {
    takeProfitParam: "triggerPrice",
    stopLossParam: "triggerPrice",
    requiresTriggerPrice: true,
    requiresReduceOnly: true,
    requiresCloseOnTrigger: true,
    additionalParams: {
      orderType: "StopOrder",
    },
  },

  okx: {
    takeProfitParam: "tpTriggerPx",
    stopLossParam: "slTriggerPx",
    requiresExecutePrice: true,
    additionalParams: {
      tpOrdPx: "", // Will be set dynamically
      slOrdPx: "", // Will be set dynamically
    },
  },

  bitget: {
    takeProfitParam: "triggerPrice",
    stopLossParam: "triggerPrice",
    requiresTriggerPrice: true,
    requiresExecutePrice: true,
    requiresReduceOnly: true,
    additionalParams: {
      triggerType: "market_price",
      orderType: "stop",
    },
  },

  mexc: {
    takeProfitParam: "stopPrice",
    stopLossParam: "stopPrice",
    requiresExecutePrice: true,
    additionalParams: {
      activationPrice: "", // Will be set dynamically
      price: "", // Will be set dynamically
    },
  },

  gate: {
    takeProfitParam: "trigger_price",
    stopLossParam: "trigger_price",
    requiresTriggerPrice: true,
    requiresReduceOnly: true,
    requiresAlgoType: true,
    additionalParams: {
      algo_type: "conditional",
    },
  },

  kucoin: {
    takeProfitParam: "stop",
    stopLossParam: "stop",
    additionalParams: {
      stopPrice: "", // Will be set dynamically
    },
  },

  htx: {
    takeProfitParam: "triggerPrice",
    stopLossParam: "triggerPrice",
    requiresTriggerPrice: true,
    requiresOrderPriceType: true,
    additionalParams: {
      orderPriceType: "limit",
    },
  },

  bingx: {
    takeProfitParam: "triggerPrice",
    stopLossParam: "triggerPrice",
    requiresTriggerPrice: true,
    additionalParams: {
      orderType: "Stop",
    },
  },

  coinex: {
    takeProfitParam: "trigger_price",
    stopLossParam: "trigger_price",
    requiresTriggerPrice: true,
    requiresAlgoType: true,
    additionalParams: {
      algo_type: "conditional",
      price: "", // Will be set dynamically
    },
  },

  coinbase: {
    takeProfitParam: "stop_price",
    stopLossParam: "stop_price",
    additionalParams: {
      stop: "loss", // or 'entry' depending on order type
    },
  },

  // Commented out as requested
  // 'kraken': {
  //   takeProfitParam: 'price',
  //   stopLossParam: 'price',
  //   additionalParams: {
  //     ordertype: 'stop-loss',
  //     price2: '' // Will be set dynamically
  //   }
  // },

  phemex: {
    takeProfitParam: "stopPx",
    stopLossParam: "stopPx",
    additionalParams: {
      // Phemex uses position-based TP/SL
      orderType: "Stop",
    },
  },

  blofin: {
    takeProfitParam: "triggerPrice",
    stopLossParam: "triggerPrice",
    requiresTriggerPrice: true,
    additionalParams: {
      orderType: "Stop",
      takeProfitPrice: "", // Will be set dynamically
      stopLossPrice: "", // Will be set dynamically
    },
  },

  // Commented out as requested
  // 'upbit': {
  //   takeProfitParam: 'takeProfit',
  //   stopLossParam: 'stopLoss'
  // }
};

/**
 * Get exchange-specific TP/SL configuration
 * @param exchange - Exchange name (lowercase)
 * @returns TP/SL order configuration for the exchange
 */
export const getTpSlConfig = (exchange: string): TpSlOrderConfig | null => {
  const config = EXCHANGE_TP_SL_CONFIG[exchange.toLowerCase()];
  if (!config) {
    console.warn(`No TP/SL configuration found for exchange: ${exchange}`);
    return null;
  }
  return config;
};

/**
 * Build TP/SL order parameters for a specific exchange
 * @param exchange - Exchange name
 * @param side - Order side (buy/sell)
 * @param takeProfitPrice - Take profit price (optional)
 * @param stopLossPrice - Stop loss price (optional)
 * @returns Object with order parameters
 */
export const buildTpSlOrderParams = (
  exchange: string,
  side: "buy" | "sell",
  takeProfitPrice?: string,
  stopLossPrice?: string
) => {
  const config = getTpSlConfig(exchange);
  if (!config) {
    return {};
  }

  const params: Record<string, any> = { ...config.additionalParams };

  // Add TP/SL prices if provided
  if (takeProfitPrice && config.takeProfitParam) {
    params[config.takeProfitParam] = takeProfitPrice;
  }

  if (stopLossPrice && config.stopLossParam) {
    params[config.stopLossParam] = stopLossPrice;
  }

  // Set order types if specified
  if (config.takeProfitOrderType && takeProfitPrice) {
    params.type = config.takeProfitOrderType;
  } else if (config.stopLossOrderType && stopLossPrice) {
    params.type = config.stopLossOrderType;
  }

  // Set dynamic parameters
  if (config.requiresExecutePrice) {
    if (takeProfitPrice) {
      params.tpOrdPx = takeProfitPrice;
    }
    if (stopLossPrice) {
      params.slOrdPx = stopLossPrice;
    }
  }

  return params;
};
