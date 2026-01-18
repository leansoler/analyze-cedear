// IMPORTANT: `puppeteer` is used for local development and debugging,
// while `puppeteer-core` and `@sparticuz/chromium` are used for production.
// However, due to how GCP builds the project, `puppeteer` is required in the
// `dependencies` section of `package.json` to be available in the cloud
// environment.
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import logger from '../../shared/logger';

// The URL for the "Obligaciones Negociables" (corporate bonds) page on IOL.
const url =
  'https://iol.invertironline.com/mercado/cotizaciones/argentina/obligaciones-negociables/todos';

/**
 * Scrapes the bond prices from the InvertirOnline website.
 * @param isLocal - Whether the scraper is running in a local environment.
 * @returns A promise that resolves to a record of bond tickers and their prices.
 */
export async function scrap(isLocal: boolean): Promise<Record<string, number>> {
  let browser = null;

  try {
    // 1. Launch Browser
    logger.info(`Launching browser... (isLocal: ${isLocal})`);
    if (isLocal) {
      // Use the full puppeteer package for local development
      browser = await puppeteer.launch({
        headless: true, // Run headful for local debugging if needed
      });
    } else {
      // Use puppeteer-core with chromium for production
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: 'shell',
      });
    }

    logger.info('Browser launched successfully. Opening new page...');
    const page = await browser.newPage();

    // Optimization: Block heavy resources like images, CSS, and fonts to
    // speed up loading and reduce bandwidth usage.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (
        ['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    logger.info(`Navigating to ${url}...`);

    // Navigate to the page and wait until the network is idle, which gives
    // time for the dynamic content (the table) to load.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

    // 2. Extract Data from the DOM
    logger.info('Scraping data from the page...');
    const marketData = await page.evaluate(() => {
      // This code runs in the browser context.
      const quotes: Record<string, number> = {};
      const rows = document.querySelectorAll('tbody tr');

      for (const row of rows) {
        try {
          // Assumption about IOL's table structure:
          // Column 1: Ticker (Symbol)
          // Column 2: Last Price
          const symbolCell = row.querySelector('td:first-child');
          const priceCell = row.querySelector('td:nth-child(2)');

          if (symbolCell && priceCell) {
            const ticker = symbolCell.textContent?.trim() || '';
            const rawPrice = priceCell.textContent?.trim() || '';

            // The price is in Argentine format (e.g., "$ 1.234,50").
            // We need to parse it into a standard number.
            const cleanPrice = parseFloat(
              rawPrice.replace(/\./g, '').replace(',', '.'),
            );

            if (ticker && !isNaN(cleanPrice) && cleanPrice > 0) {
              quotes[ticker] = cleanPrice;
            }
          }
        } catch (e) {
          // If a single row fails to parse, we log it in the browser console
          // and continue with the next rows.
          console.error('Error parsing a row:', e);
        }
      }
      return quotes;
    });

    // Add a debug log for each scraped quote.
    // This is useful for debugging the scraper.
    for (const [ticker, price] of Object.entries(marketData)) {
      logger.debug({ ticker, price }, 'Scraped quote');
    }

    return marketData;
  } finally {
    // Ensure the browser is always closed, even if errors occur.
    if (browser) {
      logger.info('Closing browser...');
      await browser.close();
    }
  }
}
