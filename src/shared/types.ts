/**
 * Defines the shape of the successful analysis response for a CEDEAR.
 */
export interface TickerAnalysis {
  ticker: string;
  prices: {
    local_ars: number;
    usa_usd: number;
  };
  analysis: {
    implied_exchange_rate: number;
    market_ccl: number;
    gap_percent: number;
    is_expensive: boolean;
    is_cheap: boolean;
  };
}

/**
 * Defines the shape of the request body for the analyzeCedear function.
 */
export interface AnalyzeAssetRequest {
  ticker?: string;
}

/**
 * Represents a single cashflow event for a bond.
 */
export interface CashflowItem {
  date: string;
  rate: number;
  amortization: number;
}

/**
 * Represents the full data structure for a corporate bond (Obligación Negociable).
 */
export interface Bond {
  ticker: string;
  name: string;
  currency: string;
  face_value: number;
  cashflow: CashflowItem[];
}
