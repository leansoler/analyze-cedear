# CEDEAR & Bond Analyzer API

A multi-function TypeScript project for analyzing Argentine financial assets, designed to be deployed as Google Cloud Functions (2nd Gen).

- **`analyzeCedear`**: Calculates the implied "Contado con Liquidación" (CCL) exchange rate for a CEDEAR and compares it to a market rate.
- **`analyzeBond`**: Provides a detailed analysis of a corporate bond, including its TIR, parity, and other key metrics.

---

## API Usage

The project exposes multiple API endpoints.

### Analyze CEDEAR

- **Function Name**: `analyzeCedear`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Example Request

```bash
curl -X POST <YOUR_FUNCTION_URL>/analyzeCedear \
-H "Content-Type: application/json" \
-d '{"ticker": "AAPL"}'
```

#### Example Successful Response (200 OK)

```json
{
  "ticker": "AAPL",
  "prices": {
    "local_ars": 18050.00,
    "usa_usd": 180.00
  },
  "analysis": {
    "implied_exchange_rate": 1002.78,
    "market_ccl": 1050.50,
    "gap_percent": -4.54,
    "is_expensive": false,
    "is_cheap": true
  }
}
```

### Analyze Bond

- **Function Name**: `analyzeBond`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Example Request

```bash
curl -X POST <YOUR_FUNCTION_URL>/analyzeBond \
-H "Content-Type: application/json" \
-d '{"ticker": "AL30"}'
```

#### Example Successful Response (200 OK)

```json
{
  "ticker": "AL30",
  "name": "BONO REP. ARG. LEY ARG. DOLAR STEP UP 2030",
  "type": "Sovereign Bond",
  "currency": "USD",
  "marketData": {
    "price": 50.00,
    "lastUpdated": "2024-01-10T15:00:00Z"
  },
  "technicalAnalysis": {
    "tirAnnualPercent": 25.5,
    "parityPercent": 75.2,
    "currentYieldPercent": 8.5,
    "durationModified": 2.5,
    "maturityDate": "2030-07-09"
  },
  "cashflowSummary": {
    "paymentFrequency": "Semiannual",
    "nextPaymentDate": "2025-01-09",
    "nextPaymentAmountPer100": 1.75,
    "residualValuePercent": 100
  },
  "verdict": {
    "status": "Discount",
    "riskLevel": "High",
    "recommendation": "Buy"
  }
}
```

For a complete API contract, please see the `openapi.yaml` file.

---

## Local Development Workflow

### 1. Install Dependencies
```bash
npm install
```

### 2. Running a Function
Use the `npm run start:<function_name>` commands to run a specific function.

```bash
# To run the CEDEAR analyzer
npm run start:cedear

# To run the bond analyzer
npm run start:bond
```
This starts a local server via the Google Cloud Functions Framework, typically on `http://localhost:8080`.

### 3. Testing with the Firestore Emulator

For development that involves the database, use the local Firestore emulator.

**Step A: Start the Emulator**
In a separate terminal, run:
```bash
npm run emu:start
```
Leave this process running in the background. It provides a local, offline database and a web UI to view the data.

**Step B: Seed the Local Database**
To populate your local emulator with data, use the `db:seed:emu` script. See the "Database Seeding" section below for details on the command.

---

## Database Seeding

The project includes a script to process a data file and seed its contents into the Firestore database.

### Data & Archive Structure

- **Data Files**: Place your raw JSON data files in an appropriate subdirectory (e.g., `scripts/data/bonds/`).
- **Archive**: After a file is successfully processed by the seed script, it will be moved to the `scripts/archive/` directory and renamed with a timestamp to prevent reprocessing.

### How to Run the Seeder

Use the `npm run db:seed` command for a live database or `npm run db:seed:emu` for the local emulator. You must provide the path to the data file you want to process.

**Command Structure:**

```bash
# For local emulator
npm run db:seed:emu -- <path/to/your/file.json>

# For live database (use with caution!)
npm run db:seed -- <path/to/your/file.json>
```

**Example:**
```bash
npm run db:seed:emu -- scripts/data/bonds/bonds.json
```

---

## Deployment

Deploy each function individually using `gcloud`.

### Prerequisites
- Google Cloud SDK (`gcloud`) installed and authenticated.
- A Google Cloud project with the necessary APIs enabled (Cloud Functions, Cloud Build, Cloud Run).

### Deploy Command Example

To deploy the `analyzeCedear` function:
```bash
gcloud functions deploy analyzeCedear \
  --gen2 \
  --runtime nodejs20 \
  --region [YOUR_REGION] \
  --source . \
  --entry-point analyzeCedear \
  --trigger-http \
  --allow-unauthenticated
```
**Note:** Replace `[YOUR_REGION]`. To deploy other functions, change the function name and `--entry-point` value.

---

## Available Scripts

- **`npm run start:cedear`**: Builds and runs the `analyzeCedear` function locally.
- **`npm run start:bond`**: Builds and runs the `analyzeBond` function locally.
- **`npm run emu:start`**: Starts the local Firestore emulator.
- **`npm run db:seed`**: Seeds the live Firestore database from a file.
- **`npm run db:seed:emu`**: Seeds the local Firestore emulator from a file.
- **`npm run build`**: Compiles the TypeScript project.
- **`npm run lint:fix`**: Lints and automatically fixes style issues.
- **`npm run clean`**: Deletes the `dist/` directory.
