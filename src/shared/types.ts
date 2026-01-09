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

/**
 * Defines the shape of the market data for a bond.
 */
export interface MarketData {
  price: number;
  last_updated: string;
}

/**
 * Defines the shape of the technical analysis for a bond.
 */
export interface TechnicalAnalysis {
  tir_annual_percent: number;
  parity_percent: number;
  current_yield_percent: number;
  duration_modified: number;
  maturity_date: string;
}

/**
 * Defines the shape of the cashflow summary for a bond.
 */
export interface CashflowSummary {
  payment_frequency: string;
  next_payment_date: string;
  next_payment_amount_per_100: number;
  residual_value_percent: number;
}

/**
 * Defines the shape of the verdict for a bond.
 */
export interface Verdict {
  status: 'Discount' | 'Par' | 'Premium'; // Bajo la par, A la par, Sobre la par
  risk_level: 'Low' | 'Medium' | 'High';
  recommendation?: string;
}

/**
 * Defines the shape of the successful analysis response for a Bond.
 */
export interface BondAnalysis {
  ticker: string;
  name: string;
  type: 'Corporate Bond' | 'Sovereign Bond';
  currency: 'USD' | 'ARS';
  market_data: MarketData;
  technical_analysis: TechnicalAnalysis;
  cashflow_summary: CashflowSummary;
  verdict: Verdict;
}
