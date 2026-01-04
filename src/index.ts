import * as ff from '@google-cloud/functions-framework';
import { analyze } from './analyzer/analyzer';
import { AnalyzeAssetRequest } from './analyzer/types';
import { HttpError } from './analyzer/errors';

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

    console.log({ ...log, message: 'Request received, starting analysis.' });

    if (typeof ticker !== 'string' || ticker.length === 0) {
      return res
        .status(400)
        .json({ error: 'Ticker is required and must be a string.' });
    }

    // 3. Delegate to Core Logic
    const analysisResult = await analyze(ticker);

    // 4. Send Successful Response
    console.log({
      ...log,
      message: 'Analysis complete, sending response.',
      result: analysisResult.analysis,
    });
    return res.status(200).json(analysisResult);
  } catch (error) {
    // 5. Handle Errors
    console.error({
      ...log,
      message: 'An error occurred during execution.',
      error,
    });

    let statusCode = 500;
    // Check if it's our custom HttpError to get the specific status code.
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
