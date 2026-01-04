/**
 * Custom error class to represent HTTP-related errors.
 * It includes a 'statusCode' property to allow for more specific error responses.
 */
export class HttpError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}
