import { Firestore, Settings } from '@google-cloud/firestore';
import { Bond } from '../types';

// Create a configuration object for the Firestore client.
const firestoreSettings: Settings = {};

// When the FIRESTORE_EMULATOR_HOST environment variable is set (i.e., when we're testing locally),
// we need to tell the client library to connect to the emulator instead of the real cloud database.
// We also provide a dummy project ID to prevent it from trying to use a real cloud project.
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('Connecting to Firestore emulator...');
  firestoreSettings.projectId = 'demo-merval-analyst';
} else {
  firestoreSettings.projectId = 'merval-analyst';
}

// Initialize Firestore with our settings.
// In the cloud, this object will be empty and the client will use default credentials.
// Locally, it will use the dummy project ID to connect to the emulator.
const db = new Firestore(firestoreSettings);

// Define collection names
const BONDS_COLLECTION = 'bonds';

/**
 * A dictionary where keys are ticker symbols and values are their market prices.
 */
type MarketData = Record<string, number>;

/**
 * Saves an array of Bond documents to Firestore in a single batch, avoiding duplicates.
 * @param {Bond[]} bonds The array of bond data to save.
 */
export async function batchSaveBonds(bonds: Bond[]): Promise<void> {
  if (bonds.length === 0) {
    return;
  }

  // 1. Fetch all existing document IDs to check for duplicates efficiently.
  console.log(`Checking ${bonds.length} bonds against existing data...`);
  const collectionRef = db.collection(BONDS_COLLECTION);
  const snapshot = await collectionRef.select().get(); // .select() efficiently gets only document IDs.
  const existingTickers = new Set(snapshot.docs.map((doc) => doc.id));

  const bondsToCreate: Bond[] = [];

  // 2. Filter out bonds that already exist and log warnings for them.
  for (const bond of bonds) {
    if (existingTickers.has(bond.ticker)) {
      // Log a warning if the bond ticker already exists in the database.
      console.warn(
        `[SKIPPING] A bond with ticker '${bond.ticker}' already exists.`,
      );
    } else {
      bondsToCreate.push(bond);
    }
  }

  if (bondsToCreate.length === 0) {
    console.log('No new bonds to add.');
    return;
  }

  // 3. Create and commit a batch write with only the new bonds.
  console.log(`Adding ${bondsToCreate.length} new bonds to the database...`);
  const batch = db.batch();
  bondsToCreate.forEach((bond) => {
    const docRef = collectionRef.doc(bond.ticker);
    // .set() is safe here because we have already filtered out existing documents.
    batch.set(docRef, bond);
  });

  await batch.commit();
}

export async function getBond(ticker: string): Promise<Bond | null> {
  const bondDoc = await db.collection(BONDS_COLLECTION).doc(ticker).get();
  if (!bondDoc.exists) {
    return null;
  }
  return bondDoc.data() as Bond;
}

/**
 * Updates the prices of bonds in Firestore based on scraped market data.
 * @param {MarketData} marketData A dictionary mapping ticker symbols to their new prices.
 * @returns {Promise<{ updatedCount: number }>} The number of documents that were updated.
 */
export async function batchUpdateBondPrices(
  marketData: MarketData,
): Promise<{ updatedCount: number }> {
  console.log('Fetching bonds from Firestore to update prices...');
  const bondsSnapshot = await db.collection(BONDS_COLLECTION).get();
  const batch = db.batch();
  let updatedCount = 0;

  console.log(
    `Comparing ${bondsSnapshot.size} bonds from DB with ${Object.keys(marketData).length} scraped prices.`,
  );

  for (const doc of bondsSnapshot.docs) {
    const ticker = doc.id;
    const price = marketData[ticker];

    if (price) {
      // If a price was found in the scraped data for a bond we track,
      // we add an update operation to the batch.
      console.log(
        `[UPDATE] Scheduling update for ${ticker} with new price: ${price}`,
      );
      const bondRef = db.collection(BONDS_COLLECTION).doc(ticker);
      batch.update(bondRef, {
        'market_data.price': price,
        'market_data.last_updated': new Date().toISOString(),
        'market_data.source': 'IOL Scraper',
      });
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    console.log(`Committing batch with ${updatedCount} price updates...`);
    await batch.commit();
    console.log('Batch committed successfully.');
  } else {
    console.log('No price updates were needed.');
  }

  return { updatedCount };
}
