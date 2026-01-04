# Gemini Agent Instructions for the CEDEAR Analyzer Project

## 1. Project Overview

This is a TypeScript-based Google Cloud Function (2nd Gen) that serves as an API to analyze Argentine CEDEARs.

The primary goal of the function is to calculate the implied "Contado con Liquidación" (CCL) exchange rate for a given stock ticker and compare it to the market CCL rate to determine if the asset is "cheap" or "expensive" in relative terms.

The API contract is defined in `openapi.yaml`.

## 2. Architecture & File Structure

The project follows a clean, modular architecture separating the entry point, business logic, and external API clients.

- **`src/index.ts`**: The main entry point. It's a thin wrapper responsible ONLY for handling the Google Cloud Functions Framework request and response objects. It validates the incoming request and delegates all business logic to `analyzer.ts`.

- **`src/analyzer/`**: This directory contains all the core application logic.
    - **`analyzer.ts`**: The main business logic orchestrator. It imports clients, calls them to fetch data, performs the financial calculations, and returns a structured analysis object.
    - **`clients/`**: This directory contains modules responsible for communicating with external APIs.
        - `DolarAPIClient.ts`: Fetches the market CCL rate from `dolarapi.com`.
        - `YahooFinanceClient.ts`: Fetches asset prices (both USD and ARS) from the Yahoo Finance API.
    - **`types.ts`**: Contains shared TypeScript interfaces, primarily `TickerAnalysis` which defines the final response shape.
    - **`errors.ts`**: Defines custom error classes like `HttpError` to allow for more specific HTTP error responses (e.g., 404 vs 500).

## 3. Key Logic & Formulas

- The core analysis revolves around calculating an implied exchange rate from a CEDEAR.
- **Implied CCL Rate Formula**: `(Price of CEDEAR in ARS * Ratio) / Price of underlying stock in USD`
- The `CEDEAR_RATIOS` map for this calculation is located in `src/analyzer/analyzer.ts`.
- The result is then compared against the market CCL rate fetched from `dolarapi.com`.

## 4. Development Workflow

- **Dependencies**: Managed via `package.json`.
- **Linting**: Run `npm run lint` or `npm run lint:fix`. The project uses ESLint and Prettier. Please adhere to the existing style.
- **Building**: Run `npm run build`. This compiles all TypeScript files from `src/` into JavaScript in the `dist/` directory.
- **Local Testing**: Run `npm start` to start the local Functions Framework server. Send `POST` requests to `http://localhost:8080` with a JSON body like `{"ticker": "AAPL"}`.
