// Interface for the expected API response from DolarAPI for type safety.
interface DolarApiResponse {
  venta: number;
}

/**
 * Fetches the market "Contado con Liquidación" (CCL) exchange rate.
 * @returns {Promise<{ ccl_market: number }>} An object containing the market CCL rate.
 * @throws {Error} If the API request fails or returns an unexpected format.
 */
export async function getDolarRates(): Promise<{ ccl_market: number }> {
  const cclRes = await fetch('https://dolarapi.com/v1/dolares/contadoconliqui');

  if (!cclRes.ok) {
    throw new Error(`DolarAPI failed with status: ${cclRes.status}`);
  }

  const ccl = (await cclRes.json()) as DolarApiResponse;

  if (typeof ccl.venta !== 'number') {
    throw new Error('Invalid DolarAPI response format.');
  }

  return { ccl_market: ccl.venta };
}
