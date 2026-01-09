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
}

// Initialize Firestore with our settings.
// In the cloud, this object will be empty and the client will use default credentials.
// Locally, it will use the dummy project ID to connect to the emulator.
const db = new Firestore(firestoreSettings);

// Define collection names
const BONDS_COLLECTION = 'bonds';

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
