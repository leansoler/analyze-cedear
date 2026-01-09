# Gemini Agent Instructions for the Merval Analyst Project

## 1. Project Overview

This is a multi-function TypeScript project designed to be deployed as separate Google Cloud Functions (2nd Gen). It provides APIs for analyzing Argentine financial assets.

- **`analyzeCedear`**: The primary function. It calculates the implied "Contado con Liquidación" (CCL) exchange rate for a CEDEAR and compares it to a market rate.
- **`analyzeBond`**: A placeholder for future bond analysis functionality.

The project is integrated with Firestore for data persistence and includes a robust local development workflow using the Firestore Emulator. The API contract is defined in `openapi.yaml`.

## 2. Architecture & File Structure

The project follows a highly modular architecture that separates function entry points from shared logic.

- **`src/index.ts`**: The main entry point for Google Cloud Functions. It defines and exports the HTTP wrappers for all functions (`analyzeCedear`, `analyzeBond`). This file ONLY handles HTTP request/response logic and delegates all business logic.

- **`src/functions/`**: This directory contains the specific core logic for each individual cloud function.
    - `analyzeCedear/index.ts`: The business logic for the CEDEAR analysis.
    - `analyzeBond/index.ts`: The placeholder logic for the bond analysis.

- **`src/shared/`**: This directory contains all code that is shared across different functions.
    - `clients/`: Contains modules for communicating with external APIs (e.g., `DolarAPIClient.ts`, `YahooFinanceClient.ts`).
    - `lib/`: Contains shared library code, such as the `firestore.ts` module for database interactions.
    - `types.ts`: Contains all shared TypeScript interfaces (e.g., `TickerAnalysis`, `Bond`).
    - `errors.ts`: Defines custom error classes (`HttpError`).
    - `logger.ts`: Configures the `pino` logger for structured logging.
    - `constants.ts`: Holds shared constants like `CEDEAR_RATIOS`.

- **`scripts/`**: Contains helper scripts for development.
    - `seed.ts`: A script for seeding the database. It processes a specific JSON file and archives it.
    - `data/`: Contains the raw JSON data for seeding, organized into subdirectories by collection name (e.g., `data/bonds/`).
    - `archive/`: Processed seed files are moved here.

## 3. Development Workflow

- **Dependencies**: Managed via `package.json`.
- **Linting**: Use `npm run lint:fix` to check and fix style issues.
- **Building**: Use `npm run build`.

### Local Development & Testing

The full local development workflow involves two terminals.

1.  **Terminal 1: Start the Database Emulator**
    ```bash
    npm run emu:start
    ```
    This starts a local Firestore instance and a web UI to view the data.

2.  **Terminal 2: Seed the Local Database**
    The seed script processes a specific file and requires the path as an argument.
    ```bash
    # Example command
    npm run db:seed:emu -- scripts/data/bonds/bonds.json
    ```

3.  **Terminal 2: Run a Specific Cloud Function**
    ```bash
    # To run the CEDEAR analyzer
    npm run start:cedear

    # To run the Bond analyzer
    npm run start:bond
    ```
    This will start the function on `localhost:8080`, connected to the local Firestore emulator.