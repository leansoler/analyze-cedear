import * as ff from '@google-cloud/functions-framework';
import { analyze } from './analyzer/analyzer';
import { AnalyzeAssetRequest } from './analyzer/types';
import { HttpError } from './analyzer/errors';
import logger from './analyzer/logger';

/**
 * HTTP Cloud Function entry point.
 * This function handles the request and response, delegating the core logic to the 'analyze' function.
 *
 * @param {ff.Request} req The request object from Functions Framework.
 * @param {ff.Response} res The response object from Functions Framework.
 */
ff.http('TypescriptFunction', async (req: ff.Request, res: ff.Response) => {
    // 1. Validate HTTP Method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Create a log object for structured logging.
    const log = {
        ticker: 'N/A',
    };

    try {
        // 2. Validate Request Body
        const { ticker } = req.body as AnalyzeAssetRequest;
        log.ticker = ticker || 'N/A';

        logger.info(log, 'Request received, starting analysis.');

        if (typeof ticker !== 'string' || ticker.length === 0) {
            return res.status(400).json({ error: 'Ticker is required and must be a string.' });
        }

        // 3. Delegate to Core Logic
        const analysisResult = await analyze(ticker);

        // 4. Send Successful Response
        logger.info({ ...log, result: analysisResult.analysis }, 'Analysis complete, sending response.');
        return res.status(200).json(analysisResult);

    } catch (error) {
        // 5. Handle Errors
        logger.error({ ...log, err: error }, 'An error occurred during execution.');

        let statusCode = 500;
        // Check if it's our custom HttpError to get the specific status code.s
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
