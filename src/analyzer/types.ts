/**
 * Defines the shape of the successful analysis response.
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
 * Defines the shape of the request body.
 */
export interface AnalyzeAssetRequest {
  ticker?: string;
}
