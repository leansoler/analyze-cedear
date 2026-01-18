import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import logger from '../../shared/logger';

const url =
  'https://iol.invertironline.com/mercado/cotizaciones/argentina/obligaciones-negociables/todos';

export async function scrap(isLocal: boolean): Promise<Record<string, number>> {
  let browser = null;

  try {
    logger.info(`Launching browser... (isLocal: ${isLocal})`);
    if (isLocal) {
      browser = await puppeteer.launch({
        headless: true,
      });
    } else {
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: 'shell',
      });
    }

    logger.info('Browser launched successfully. Opening new page...');
    const page = await browser.newPage();

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

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

    logger.info('Selecting "Todo" to show all entries...');
    await page.select('select[name="cotizaciones_length"]', '-1');

    await new Promise((res) => setTimeout(res, 500));

    logger.info('Scraping data from the page...');
    const marketData = await page.evaluate(() => {
      const quotes: Record<string, number> = {};
      const rows = document.querySelectorAll('tbody tr');

      for (const row of rows) {
        try {
          const symbolCell = row.querySelector('td:first-child');
          const priceCell = row.querySelector('td:nth-child(2)');

          if (symbolCell && priceCell) {
            const ticker = symbolCell.textContent?.trim() || '';
            const rawPrice = priceCell.textContent?.trim() || '';

            const cleanPrice = parseFloat(
              rawPrice.replace(/\./g, '').replace(',', '.'),
            );

            if (ticker && !isNaN(cleanPrice) && cleanPrice > 0) {
              quotes[ticker] = cleanPrice;
            }
          }
        } catch (e) {
          console.error('Error parsing a row:', e);
        }
      }
      return quotes;
    });

    for (const [ticker, price] of Object.entries(marketData)) {
      logger.debug({ ticker, price }, 'Scraped quote');
    }

    return marketData;
  } finally {
    if (browser) {
      logger.info('Closing browser...');
      await browser.close();
    }
  }
}
