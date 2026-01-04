# CEDEAR Analyzer API

A simple Google Cloud Function (2nd Gen) written in TypeScript to analyze Argentine CEDEARs.

This API calculates the implied "Contado con Liquidación" (CCL) exchange rate for a given stock ticker and compares it to the live market rate to determine if the asset's valuation is currently higher ("expensive") or lower ("cheap") than the market average.

---

## API Usage

The API has a single endpoint that accepts a `POST` request.

- **Endpoint**: `/`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Example Request

You can use `curl` to send a request:

```bash
curl -X POST <YOUR_FUNCTION_URL> \
-H "Content-Type: application/json" \
-d '{"ticker": "AAPL"}'
```

### Example Successful Response (200 OK)

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

For a complete API contract including all response schemas and error codes, please see the `openapi.yaml` file.

---

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Function Locally
```bash
npm start
```
This command will compile the TypeScript code and start a local server using the Google Cloud Functions Framework, typically on `http://localhost:8080`.

You can then send requests to this local server for testing.

---

## Deployment

This function is designed to be deployed as a Google Cloud Function (2nd Gen).

### Prerequisites
- Google Cloud SDK (`gcloud`) installed and authenticated.
- A Google Cloud project with the Cloud Functions, Cloud Build, and Cloud Run APIs enabled.

### Deploy Command

```bash
gcloud functions deploy analyze-cedear \
  --gen2 \
  --runtime nodejs20 \
  --region [YOUR_REGION] \
  --source . \
  --entry-point TypescriptFunction \
  --trigger-http \
  --allow-unauthenticated
```
**Note:** Replace `[YOUR_REGION]` with your target region (e.g., `us-central1`). The `--allow-unauthenticated` flag makes the function public; remove it and configure IAM for a private function.

---

## Available Scripts

- `npm start`: Runs the function locally for development.
- `npm run build`: Compiles the TypeScript source code into JavaScript in the `dist/` directory.
- `npm run lint`: Lints the codebase for errors and style issues.
- `npm run lint:fix`: Automatically fixes all fixable linting and formatting issues.
- `npm run clean`: Deletes the `dist/` directory.
