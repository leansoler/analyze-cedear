import { PricedCashflow } from '../types';

/**
 * Calculates the internal rate of return for a series of cashflows that may not be periodic.
 * This function implements the Newton-Raphson method to find the discount rate
 * that makes the net present value (NPV) of the cashflows equal to zero.
 *
 * @param cashflows An array of objects, where each object represents a cashflow
 *                  with an `amount` (a positive or negative number) and a `date`.
 * @param guess An optional initial guess for the rate. Defaults to 0.1 (10%).
 * @returns The calculated internal rate of return as a percentage (e.g., 15.5 for 15.5%).
 *          Returns `NaN` if the calculation does not converge.
 */
export function calculateXIRR(
  cashflows: PricedCashflow[],
  guess = 0.1,
): number {
  // Constants for the Newton-Raphson method
  const tolerance = 1e-6; // The desired precision of the result
  const maxIterations = 100; // The maximum number of iterations to try

  let rateGuess = guess;
  const dayInMillis = 1000 * 60 * 60 * 24;
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0; // Net Present Value
    let npvDerivative = 0; // Derivative of the NPV with respect to the rate

    for (const cf of cashflows) {
      // Calculate the time difference in years from the first cashflow
      const daysDifference =
        (cf.date.getTime() - cashflows[0].date.getTime()) / dayInMillis;
      const yearsDifference = daysDifference / 365;

      // This is the core of the NPV calculation
      const factor = Math.pow(1 + rateGuess, yearsDifference);

      // Add the present value of the cashflow to the NPV
      npv += cf.amount / factor;

      // Calculate the derivative of the NPV, which is needed for the next guess
      npvDerivative -=
        (yearsDifference * cf.amount) / (factor * (1 + rateGuess));
    }

    // The Newton-Raphson formula to find the next guess for the rate
    const newRateGuess = rateGuess - npv / npvDerivative;

    // If the new guess is very close to the previous one, we've found our rate
    if (Math.abs(newRateGuess - rateGuess) < tolerance) {
      return newRateGuess * 100;
    }

    rateGuess = newRateGuess;
  }

  // If the loop finishes without converging, return NaN
  return NaN;
}

/**
 * Calculates the residual value of a financial instrument (e.g., a bond).
 * The residual value is the remaining face value after some amortization payments have been made.
 *
 * @param faceValue The initial face value of the instrument.
 * @param pastAmortizationsSum The sum of all amortization payments made to date.
 * @returns The residual value. This will be at least 0.
 */
export function calculateResidualValue(
  faceValue: number,
  pastAmortizationsSum: number,
): number {
  return Math.max(0, faceValue - pastAmortizationsSum);
}
