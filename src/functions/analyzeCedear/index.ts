import { TickerAnalysis } from '../../shared/types';
import { getDolarRates } from '../../shared/clients/DolarAPIClient';
import { getAssetPrices } from '../../shared/clients/YahooFinanceClient';
import { CEDEAR_RATIOS } from '../../shared/constants';

/**
 * Performs the core analysis for a given ticker by coordinating calls to API clients
 * and applying the business logic.
 * @param {string} ticker The ticker symbol to analyze.
 * @returns {Promise<TickerAnalysis>} The complete analysis object.
 */
export async function analyzeCedearLogic(
  ticker: string,
): Promise<TickerAnalysis> {
  const tickerRoot = ticker.toUpperCase();

  // 1. Fetch Data from clients in parallel
  const [rates, prices] = await Promise.all([
    getDolarRates(),
    getAssetPrices(tickerRoot),
  ]);

  const { priceUsd, priceArs } = prices;
  const { ccl_market } = rates;

  // 2. The "Argentine Logic"
  const ratio = CEDEAR_RATIOS[tickerRoot] || 10; // Default to 10:1

  // Corrected Formula: (ARS Price * Ratio) / USD Price
  const impliedCcl = (priceArs * ratio) / priceUsd;
  const cclGap = (impliedCcl / ccl_market - 1) * 100;

  // 3. Assemble and return the final analysis object
  return {
    ticker: tickerRoot,
    prices: {
      local_ars: priceArs,
      usa_usd: priceUsd,
    },
    analysis: {
      implied_exchange_rate: Number(impliedCcl.toFixed(2)),
      market_ccl: ccl_market,
      gap_percent: Number(cclGap.toFixed(2)),
      is_expensive: cclGap > 1.5,
      is_cheap: cclGap < -1.5,
    },
  };
}
