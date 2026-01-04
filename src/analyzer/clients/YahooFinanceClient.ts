import { HttpError } from '../errors';
import YahooFinance from 'yahoo-finance2';

// Create an instance of the YahooFinance class to be used for all API calls.
const yahooFinance = new YahooFinance();

/**
 * The response shape for asset prices fetched from Yahoo Finance.
 */
export interface AssetPrices {
  priceUsd: number;
  priceArs: number;
}

/**
 * Fetches the USD and ARS prices for a given asset ticker.
 * @param {string} tickerRoot The root symbol of the asset (e.g., 'AAPL').
 * @returns {Promise<AssetPrices>} An object containing the asset's price in USD and the CEDEAR's price in ARS.
 * @throws {HttpError} If price data cannot be found.
 */
export async function getAssetPrices(tickerRoot: string): Promise<AssetPrices> {
  try {
    const [quoteUsdResult, quoteArsResult] = await Promise.all([
      yahooFinance.quoteSummary(tickerRoot, { modules: ['price'] }), // US Price
      yahooFinance.quoteSummary(`${tickerRoot}.BA`, { modules: ['price'] }), // ARS Price
    ]);

    const priceUsd = quoteUsdResult.price?.regularMarketPrice;
    const priceArs = quoteArsResult.price?.regularMarketPrice;

    if (typeof priceUsd !== 'number' || typeof priceArs !== 'number') {
      // This handles cases where the ticker exists but price data is missing.
      throw new HttpError(
        `Price data is incomplete for ticker ${tickerRoot}`,
        404,
      );
    }

    return { priceUsd, priceArs };
  } catch (error) {
    // This handles cases where the ticker itself does not exist in Yahoo Finance.
    if (error instanceof Error && error.message.includes('Quote not found')) {
      throw new HttpError(
        `The ticker '${tickerRoot}' was not found on Yahoo Finance.`,
        404,
      );
    }
    // For other issues (e.g., network errors), let them bubble up to be handled as a 500.
    throw error;
  }
}
