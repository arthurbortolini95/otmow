# Contracts Scraper

A robust web scraper built with Playwright to extract contract information from the Palmeira municipal transparency portal.

## 🎯 Overview

This scraper automates the extraction of contract data from the Palmeira transparency portal (`transparencia.e-publica.net`), collecting contract values and purposes across multiple pages of the contracts table.

## 📋 Features

- ✅ **Multi-page Navigation**: Automatically handles pagination across all contract pages
- ✅ **Detailed Data Extraction**: Extracts contract values and purposes (finalidade)
- ✅ **Smart Navigation**: Handles page navigation after detail views
- ✅ **Error Handling**: Robust error handling with fallback mechanisms
- ✅ **JSON Output**: Saves results in structured JSON format with timestamps
- ✅ **Debug Mode**: Visual browser mode for debugging and monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Run the scraper**:

   ```bash
   npm run scrap
   ```

   _Alternatively, you can run directly:_

   ```bash
   node contracts/scraper.js
   ```

### Output

The scraper generates a timestamped JSON file:

```
contracts_2025-11-03T10-30-45-123Z.json
```

## 📊 Data Structure

Each contract record contains:

```json
{
  "contract_value": "R$ 1.234,56",
  "purpose": "Contratação de Serviços"
}
```

### Sample Output

```json
[
  {
    "contract_value": "R$ 2.500,00",
    "purpose": "Contratação de Serviços de Limpeza"
  },
  {
    "contract_value": "R$ 15.000,00",
    "purpose": "Aquisição de Material de Escritório"
  }
]
```

## 🔧 Configuration

### Browser Settings

```javascript
const browser = await webkit.launch({
  headless: false, // Set to true for production
  slowMo: 1000, // Slow down for debugging
});
```

### Timeouts and Delays

- **Page Load**: 30 seconds timeout
- **Element Wait**: 15 seconds for table elements
- **Navigation**: 3 seconds between page transitions
- **Detail View**: 10 seconds for form elements

## 🏗️ Architecture

### Files Structure

```
contracts/
├── automation.txt    # Step-by-step automation instructions
├── scraper.js       # Main scraper implementation
├── test.js          # Button testing utility (if exists)
└── README.md        # This documentation
```

### Automation Flow

1. **Page Navigation**: Navigate to contracts table URL
2. **Row Detection**: Find all contract rows with `ng-repeat-start` attribute
3. **Data Extraction**: For each contract:
   - Extract contract value from 6th column
   - Click to view details
   - Extract purpose from detail page
   - Navigate back to table
   - Handle multi-page navigation if needed
4. **Pagination**: Continue to next page until no more pages
5. **Data Export**: Save all results to JSON file

## 🛠️ Technical Details

### Selectors Used

- **Contract Rows**: `tr[ng-repeat-start="(rowIndex, row) in tableReq.rows"]`
- **Contract Values**: `td:nth-child(6) > div.table-xs-td-content.epublica-truncate-text > span`
- **Purpose Field**: Dynamic selector for "Finalidade" field in detail view
- **Next Button**: `a.btn.btn-blue.pagination-next` with text "Próxima"

### Browser Engine

Uses **WebKit** for compatibility and performance:

```javascript
const { webkit } = require("playwright");
```

### Smart Navigation

The scraper implements intelligent page navigation:

- After viewing contract details, it navigates back to the correct page
- Uses `(pageNumber - 1)` clicks to return to the appropriate page
- Handles page state management across navigation

## 🐛 Debugging

### Debug Mode

Run with visual browser for debugging:

```javascript
headless: false; // In browser launch options
```

### Common Issues

1. **Slow Page Loading**: Increase timeout values
2. **Element Not Found**: Check if selectors have changed
3. **Navigation Issues**: Verify pagination button selector

### Logging

The scraper provides detailed console output:

- Contract processing progress
- Page navigation status
- Error messages with context
- Final statistics

## 📈 Performance

### Typical Performance

- **Processing Speed**: ~10-15 contracts per minute
- **Memory Usage**: Low (single page operation)
- **Network**: Depends on site response time

### Optimization Tips

- Set `headless: true` for production
- Adjust `slowMo` to 0 for faster execution
- Increase timeouts for slower networks

## 🔍 Monitoring

### Real-time Monitoring

```
Processing page 1...
Found 20 contracts on page 1
Processing contract 1/20 on page 1
Contract value: R$ 2.500,00
Purpose: Contratação de Serviços
Added contract 1: {"contract_value":"R$ 2.500,00","purpose":"Contratação de Serviços"}
```

### Final Statistics

```
=== SCRAPING COMPLETED ===
Total contracts scraped: 156
Results saved to: contracts_2025-11-03T10-30-45-123Z.json
```

## 🤖 Automation Reference

The scraper follows the detailed steps outlined in `automation.txt`:

1. **Initial Navigation**: Visit the contracts table URL
2. **Table Detection**: Locate table with ID `#compublicaportalcontratoPortalContratoTableService`
3. **Row Processing**: Find all `tr` elements with `ng-repeat-start` attribute
4. **Value Extraction**: Get contract value from before-last `td` element
5. **Detail Navigation**: Click on contract to view details
6. **Purpose Extraction**: Find and extract "Finalidade" field
7. **Return Navigation**: Navigate back to table
8. **Page Management**: Handle multi-page navigation correctly
9. **Pagination**: Continue until "Próxima" button is disabled

## 🔧 Maintenance

### Selector Updates

If the website structure changes, update these key selectors in `scraper.js`:

```javascript
// Table rows
'#compublicaportalcontratoPortalContratoTableService > tbody > tr[ng-repeat-start="(rowIndex, row) in tableReq.rows"]';

// Contract value
"td:nth-child(6) > div.table-xs-td-content.epublica-truncate-text > span";

// Purpose field (dynamic)
"html > body > div:first-child > div > portal-shell > section > div > div:first-child > div > div > div > ng-transclude > div > div > div > form > div:first-child > ng-form > div:nth-child(8) > p-list > dl > ng-repeat:nth-child(2)";

// Next button
"a.btn.btn-blue.pagination-next";
```

### Testing

Use the included test utilities to verify selectors:

```bash
npm run scrap  # Run the main scraper
node contracts/test.js  # If test file exists
```

## 📄 License

This project is part of the OTMOW transparency scraping suite.

## 🤝 Contributing

1. Follow the existing automation patterns
2. Test selectors before implementing
3. Add appropriate error handling
4. Document any selector changes

---

**Note**: This scraper is designed specifically for the Palmeira municipal transparency portal. Selectors and automation steps may need updates if the website structure changes.
