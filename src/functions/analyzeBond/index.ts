import { getDolarRates } from '../../shared/clients/DolarAPIClient';
import {
  calculateResidualValue,
  calculateXIRR,
} from '../../shared/lib/financialMath';
import { getBond } from '../../shared/lib/firestore';
import { BondAnalysis, Verdict, NextPayment } from './types';
import { CashflowItem } from '../../shared/types';
import { PARITY_THRESHOLDS, VERDICT_STATUS } from '../../shared/constants';

/**
 * Performs a comprehensive analysis of a given bond based on its ticker symbol.
 *
 * This function is designed to be decoupled from the specific runtime environment (e.g., Cloud Functions),
 * allowing for easier testing and maintenance. It fetches real-time market data and bond information
 * to calculate key financial metrics.
 *
 * @param {string} ticker The ticker symbol of the bond to be analyzed (e.g., 'AL30').
 * @returns {Promise<BondAnalysis>} A promise that resolves to an object containing the detailed bond analysis.
 * @throws {Error} Throws an error if the bond is not found or if data fetching fails.
 */
export async function analyzeBondLogic(ticker: string): Promise<BondAnalysis> {
  // 1. Fetch all required data in parallel
  const [bondData, dolarRates] = await Promise.all([
    getBond(ticker),
    getDolarRates(),
  ]);

  if (!bondData) {
    throw new Error(`Bond with ticker ${ticker} not found`);
  }

  const priceArs = bondData.marketData?.price || 0;
  const lastUpdated = bondData.marketData?.lastUpdated
    ? new Date(bondData.marketData.lastUpdated)
    : new Date();

  if (priceArs === 0) {
    // Soft error: return basic info with a warning, or throw if you prefer strictness.
    throw new Error(
      `Price not available for ${ticker}. Scraper may need to run.`,
    );
  }

  const ccl = dolarRates.ccl_market;
  const priceUsd = priceArs / ccl;
  const now = new Date();

  // 2. Separate past and future cashflows to calculate the current state of the bond
  const pastCashflows =
    bondData.cashflow
      .filter((cf: CashflowItem) => new Date(cf.date) < now)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) || [];

  const futureCashflows =
    bondData.cashflow
      .filter((cf: CashflowItem) => new Date(cf.date) >= now)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) || [];

  // 3. Calculate total amortized principal and the remaining residual value
  const totalAmortized = pastCashflows.reduce(
    (acc, cf) => acc + (cf.amortization || 0),
    0,
  );

  const residualValuePercent = calculateResidualValue(100, totalAmortized);

  // 4. Build the cashflow stream for XIRR calculation using Array.reduce
  // This approach is more functional and avoids mutating variables outside the loop's scope.
  const initialState = {
    stream: [{ amount: -priceUsd, date: now }],
    accumulatedAmortization: totalAmortized,
  };

  const finalState = futureCashflows.reduce((acc, cf) => {
    // Interest is paid on the remaining principal for the current period.
    const residualPrincipalForPeriod = 100 - acc.accumulatedAmortization;

    const interestPayment = residualPrincipalForPeriod * (cf.rate / 100);
    const amortPayment = cf.amortization || 0;
    const totalPayment = interestPayment + amortPayment;

    const newStreamEntry = {
      amount: totalPayment,
      date: new Date(cf.date),
    };

    // Return the next state of the accumulator
    return {
      stream: [...acc.stream, newStreamEntry],
      accumulatedAmortization: acc.accumulatedAmortization + amortPayment,
    };
  }, initialState);

  const xirrStream = finalState.stream;

  // 5. Determine the next payment from the stream we just built.
  // The first cashflow in the stream (index 0) is the initial investment.
  // The next payment is the second cashflow (index 1), if it exists.
  const nextPayment: NextPayment | null =
    futureCashflows.length > 0 && xirrStream.length > 1
      ? {
          date: futureCashflows[0].date, // Use the original date string
          amount: xirrStream[1].amount,
        }
      : null;

  // 6. Calculate final metrics: TIR (XIRR) and Parity
  const tir = calculateXIRR(xirrStream);
  const parity =
    residualValuePercent > 0 ? (priceUsd / residualValuePercent) * 100 : 0;

  // 7. Determine the verdict based on parity
  let verdictStatus: Verdict['status'] = VERDICT_STATUS.PAR;
  if (parity < PARITY_THRESHOLDS.DISCOUNT) {
    verdictStatus = VERDICT_STATUS.DISCOUNT;
  } else if (parity > PARITY_THRESHOLDS.PREMIUM) {
    verdictStatus = VERDICT_STATUS.PREMIUM;
  }

  // 8. Assemble the final analysis object
  const analysis: BondAnalysis = {
    ticker: bondData.ticker,
    name: bondData.name,
    type: 'Corporate Bond', // Placeholder, could be derived from bondData if available
    currency: bondData.currency,
    marketData: {
      price: priceArs,
      lastUpdated: lastUpdated.toISOString(),
    },
    technicalAnalysis: {
      tirAnnualPercent: tir,
      parityPercent: parity,
      // The following are placeholders as they require more complex calculations or more data
      currentYieldPercent: 0, // Placeholder
      durationModified: 0, // Placeholder
      maturityDate: futureCashflows[futureCashflows.length - 1]?.date || '',
    },
    cashflowSummary: {
      // Placeholder, could be derived from cashflow dates if needed
      paymentFrequency: 'Semiannual',
      nextPaymentDate: nextPayment?.date || '',
      nextPaymentAmountPer100: nextPayment?.amount || 0,
      residualValuePercent: residualValuePercent,
    },
    verdict: {
      status: verdictStatus,
      riskLevel: 'Medium', // Placeholder
      recommendation: 'Hold', // Placeholder
    },
  };

  return analysis;
}
