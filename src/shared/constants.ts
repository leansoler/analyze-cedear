/**
 * A map containing the conversion ratios for some popular CEDEARs.
 * This ratio defines how many CEDEARs (local asset) correspond to one share of the underlying foreign stock.
 * This data is central to calculating the implied exchange rate.
 */
export const CEDEAR_RATIOS: { [key: string]: number } = {
  AAPL: 10,
  GOOGL: 29,
  MSFT: 10,
  AMZN: 144,
  TSLA: 15,
  KO: 5,
  GGAL: 10,
  MELI: 60,
  WFC: 3,
  XOM: 5,
};

/**
 * Defines the possible verdict statuses for a bond analysis.
 * Using "as const" creates a readonly type with the exact string values,
 * preventing typos and ensuring type safety.
 */
export const VERDICT_STATUS = {
  PAR: 'Par',
  DISCOUNT: 'Discount',
  PREMIUM: 'Premium',
} as const;

/**
 * Defines the parity percentage thresholds for determining a bond's verdict status.
 */
export const PARITY_THRESHOLDS = {
  DISCOUNT: 98,
  PREMIUM: 102,
} as const;
