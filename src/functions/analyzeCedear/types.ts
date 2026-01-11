/**
 * Defines the shape of the successful analysis response for a CEDEAR.
 */
export interface TickerAnalysis {
  ticker: string;
  prices: {
    localArs: number;
    usaUsd: number;
  };
  analysis: {
    impliedExchangeRate: number;
    marketCcl: number;
    gapPercent: number;
    isExpensive: boolean;
    isCheap: boolean;
  };
}
