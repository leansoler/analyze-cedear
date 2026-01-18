import logger from '../../shared/logger';
import { batchUpdateBondPrices } from '../../shared/lib/firestore';
import { scrap } from '../../shared/lib/bondScrapper';

/**
 * Defines the structure of the result object returned by the scraper function.
 */
interface ScrapResult {
  success: boolean;
  message: string;
  scraped_total: number;
  updated_in_db: number;
  error?: string;
}

/**
 * Scrapes "Obligaciones Negociables" (corporate bonds) prices from InvertirOnline (IOL)
 * and updates them in Firestore.
 * This function is designed to run in a serverless environment.
 */
export async function scrapInvertirOnline(): Promise<ScrapResult> {
  logger.info('Starting Bond scraper for InvertirOnline...');

  try {
    const isLocal = process.env.IS_LOCAL === 'true';
    const marketData = await scrap(isLocal);

    const scrapedCount = Object.keys(marketData).length;
    if (scrapedCount === 0) {
      logger.warn(
        'Scraper finished but found 0 assets on the page. The table structure might have changed.',
      );
      // Still return a success response, but with a warning.
      return {
        success: true,
        message:
          'Scraping completed, but no data was found. The page layout may have changed.',
        scraped_total: 0,
        updated_in_db: 0,
      };
    }
    logger.info(`Successfully scraped ${scrapedCount} quotes from IOL.`);

    // 3. Update Firestore
    // Pass the scraped market data to the dedicated Firestore function
    // to handle the batch update logic.
    logger.info('Passing scraped data to Firestore update function...');
    const { updatedCount } = await batchUpdateBondPrices(marketData);

    const result = {
      success: true,
      scraped_total: scrapedCount,
      updated_in_db: updatedCount,
      message: 'Bond prices updated successfully from IOL.',
    };

    logger.info(result, 'Scraping process completed successfully.');
    return result;
  } catch (error) {
    logger.error(
      { err: error },
      'A critical error occurred during the scraping process.',
    );
    // In case of an error, we should not throw, as the function framework
    // might not handle it gracefully. Instead, we return an error object.
    return {
      success: false,
      message: 'An unexpected error occurred.',
      error: error instanceof Error ? error.message : String(error),
      scraped_total: 0,
      updated_in_db: 0,
    };
  }
}
