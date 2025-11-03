# Contracts Scraper

This scraper extracts contract information from the Palmeira transparency portal.

## Installation

Make sure you have the dependencies installed:

```bash
npm install
```

## Usage

Run the scraper:

```bash
node contracts/scraper.js
```

## What it does

The scraper follows these steps:

1. Visits the contracts table page
2. Finds all contract rows with the `ng-repeat-start` attribute
3. For each contract:
   - Extracts the contract value from the "before last" td element
   - Clicks on the contract to view details
   - Extracts the "Finalidade" (purpose) from the detail page
   - Navigates back to the table
4. Handles pagination by clicking the "next" button until disabled
5. Saves all results to a timestamped JSON file

## Output

The scraper creates a JSON file with the format:

```json
[
  {
    "contract_value": "R$ 1.234,56",
    "purpose": "Contract purpose description"
  }
]
```

## Configuration

- Set `headless: true` in the browser launch options for production use
- Adjust timeouts and delays as needed for the target website's performance
- The scraper uses WebKit browser engine by default
