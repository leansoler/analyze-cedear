/**
 * Defines the shape of the market data for a bond.
 */
export interface MarketData {
  price: number;
  lastUpdated: string;
}

/**
 * Defines the shape of the technical analysis for a bond.
 */
export interface TechnicalAnalysis {
  tirAnnualPercent: number;
  parityPercent: number;
  currentYieldPercent: number;
  durationModified: number;
  maturityDate: string;
}

/**
 * Represents the details of a bond's next payment.
 */
export interface NextPayment {
  date: string;
  amount: number;
}

/**
 * Defines the shape of the cashflow summary for a bond.
 */
export interface CashflowSummary {
  /**
   * The frequency at which the bond makes payments.
   */
  paymentFrequency: 'Semiannual' | 'Annual' | 'Quarterly' | 'Monthly' | 'Other';
  nextPaymentDate: string;
  nextPaymentAmountPer100: number;
  residualValuePercent: number;
}

/**
 * Defines the shape of the verdict for a bond.
 */
export interface Verdict {
  status: 'Discount' | 'Par' | 'Premium'; // Bajo la par, A la par, Sobre la par
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendation: 'Buy' | 'Hold' | 'Sell' | 'Strong Buy' | 'Strong Sell';
}

/**
 * Defines the shape of the successful analysis response for a Bond.
 */
export interface BondAnalysis {
  ticker: string;
  name: string;
  type: 'Corporate Bond' | 'Sovereign Bond';
  currency: 'USD' | 'ARS';
  marketData: MarketData;
  technicalAnalysis: TechnicalAnalysis;
  cashflowSummary: CashflowSummary;
  verdict: Verdict;
}
