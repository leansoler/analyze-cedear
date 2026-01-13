import * as ff from '@google-cloud/functions-framework';
import { analyzeCedearLogic } from './functions/analyzeCedear';
import { analyzeBondLogic } from './functions/analyzeBond';
import { AnalyzeAssetRequest } from './shared/types';
import { HttpError } from './shared/errors';
import logger from './shared/logger';
import { scrapInvertirOnline } from './functions/scrapInvertirOnline';

/**
 * Cloud Function to analyze a CEDEAR.
 * This is the HTTP wrapper for the core analysis logic.
 */
ff.http('analyzeCedear', async (req: ff.Request, res: ff.Response) => {
  const log = { function: 'analyzeCedear', ticker: 'N/A' };

  try {
    if (req.method !== 'POST') {
      throw new HttpError('Method Not Allowed', 405);
    }

    const { ticker } = req.body as AnalyzeAssetRequest;
    log.ticker = ticker || 'N/A';
    logger.info(log, 'Request received.');

    if (typeof ticker !== 'string' || ticker.length === 0) {
      throw new HttpError('Ticker is required and must be a string.', 400);
    }

    const analysisResult = await analyzeCedearLogic(ticker);

    logger.info(
      { ...log, result: analysisResult.analysis },
      'Analysis complete.',
    );
    return res.status(200).json(analysisResult);
  } catch (error) {
    logger.error({ ...log, err: error }, 'An error occurred.');

    let statusCode = 500;
    if (error instanceof HttpError) {
      statusCode = error.statusCode;
    }

    let errorMessage = 'An internal error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
});

/**
 * Cloud Function to analyze a bond (placeholder).
 * This is the HTTP wrapper for the core analysis logic.
 */
ff.http('analyzeBond', async (req: ff.Request, res: ff.Response) => {
  const log = { function: 'analyzeBond', ticker: 'N/A' };

  try {
    const { ticker } = req.body as AnalyzeAssetRequest;
    log.ticker = ticker || 'N/A';
    logger.info(log, 'Request received.');

    if (typeof ticker !== 'string' || ticker.length === 0) {
      throw new HttpError('Ticker is required and must be a string.', 400);
    }

    const analysisResult = await analyzeBondLogic(ticker);

    logger.info({ ...log, result: analysisResult }, 'Analysis complete.');
    return res.status(200).json(analysisResult);
  } catch (error) {
    logger.error({ ...log, err: error }, 'An error occurred.');

    let statusCode = 500;
    if (error instanceof HttpError) {
      statusCode = error.statusCode;
    }

    let errorMessage = 'An internal error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
});

ff.http('scrapInvertirOnline', async (req: ff.Request, res: ff.Response) => {
  const log = { function: 'scrapInvertirOnline' };

  try {
    logger.info(log, 'Request received.');

    const result = await scrapInvertirOnline();

    logger.info({ ...log, result: result }, 'Scraping complete.');

    return res.status(200).json(result);
  } catch (error) {
    logger.error({ ...log, err: error }, 'An error occurred.');

    let statusCode = 500;
    if (error instanceof HttpError) {
      statusCode = error.statusCode;
    }

    let errorMessage = 'An internal error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
});
