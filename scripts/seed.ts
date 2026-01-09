import { batchSaveBonds } from '../src/shared/lib/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { Bond } from '../src/shared/types';

/**
 * Parses command line arguments to get the file path.
 * @returns {string} The path to the JSON file to process.
 */
function getFilePathFromArgs(): string {
  const args = process.argv.slice(2); // node, script.ts, filePath
  const filePath = args[0];

  if (!filePath) {
    throw new Error(
      'Missing required argument: Please provide the path to the JSON file.',
    );
  }
  if (path.extname(filePath).toLowerCase() !== '.json') {
    throw new Error(
      'Invalid file type. The provided file must be a .json file.',
    );
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  return filePath;
}

/**
 * Archives the processed file by moving and renaming it with a timestamp.
 * @param {string} sourcePath The original path of the processed file.
 */
function archiveFile(sourcePath: string) {
  // Creates a timestamp string like '2026-01-04T18-30-00'
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

  const ext = path.extname(sourcePath);
  const baseName = path.basename(sourcePath, ext);

  const archiveDir = path.join(__dirname, 'archive');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const newName = `${baseName}-${timestamp}-processed${ext}`;
  const newPath = path.join(archiveDir, newName);

  console.log(`Archiving processed file to: ${newPath}`);
  fs.renameSync(sourcePath, newPath);
}

/**
 * Main function to seed the database from a specific JSON file.
 */
async function seedDatabase() {
  let filePath = ''; // Keep track of the path for the final archive step
  try {
    filePath = getFilePathFromArgs();
    console.log(`Processing file: ${filePath}`);

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as Bond[];

    if (!Array.isArray(data) || data.length === 0) {
      console.log(
        'Seed file is empty or not an array. Archiving without seeding.',
      );
      archiveFile(filePath); // Archive even if empty to prevent reprocessing
      return;
    }

    console.log(`Found ${data.length} bond records.`);
    console.log('Writing to Firestore...');

    // This script now assumes the file contains bond data.
    await batchSaveBonds(data);

    console.log('Database seeded successfully!');

    // Archive the file only after a successful database operation.
    archiveFile(filePath);
  } catch (error) {
    console.error('\nAn error occurred while seeding the database:');
    console.error(error);
    console.log('\nUsage: npm run db:seed -- <path/to/your/file.json>');
    console.log(
      'Example: npm run db:seed -- scripts/data/bonds/2026-01-04.json',
    );

    // We do not archive the file if an error occurred, so it can be re-processed.
    if (filePath) {
      console.log(
        `\nFile '${filePath}' was not archived due to the error and can be processed again.`,
      );
    }

    process.exit(1);
  }
}

seedDatabase();
