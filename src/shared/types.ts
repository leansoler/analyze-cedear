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
 * Represents a cashflow with a final calculated amount and a Date object.
 * This is used as input for XIRR calculations.
 */
export interface PricedCashflow {
  amount: number;
  date: Date;
}

/**
 * Represents the full data structure for a corporate bond (Obligación Negociable).
 */
export interface Bond {
  ticker: string;
  name: string;
  currency: 'USD' | 'ARS';
  faceValue: number;
  cashflow: CashflowItem[];
  market_data?: {
    price: number;
    last_updated: string;
    source: string;
  };
}
