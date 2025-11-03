const { webkit } = require("playwright");

async function scrapeContracts() {
  console.log("Starting contract scraper...");

  // Launch browser
  const browser = await webkit.launch({
    headless: false, // Set to true for production
    slowMo: 1000, // Slow down for debugging
  });

  const page = await browser.newPage();

  // Set viewport and user agent to avoid detection
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.setExtraHTTPHeaders({
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  });

  const resultList = [];

  try {
    // Step 1: Visit the link
    console.log("Navigating to contracts page...");
    await page.goto("https://transparencia.e-publica.net/epublica-portal/#/palmeira/portal/compras/contratoTable", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for the page to load completely
    await page.waitForTimeout(5000);

    let pageNumber = 1;

    while (true) {
      console.log(`Processing page ${pageNumber}...`);

      // Step 2 & 3: Wait for table to be present
      await page.waitForSelector("#compublicaportalcontratoPortalContratoTableService tbody", {
        timeout: 15000,
      });

      // Step 4 & 5: Find all tr elements with ng-repeat-start attribute and save to tableRows array
      const tableRows = await page
        .locator(
          '#compublicaportalcontratoPortalContratoTableService > tbody > tr[ng-repeat-start="(rowIndex, row) in tableReq.rows"]'
        )
        .all();

      console.log(`Found ${tableRows.length} contracts on page ${pageNumber}`);

      if (tableRows.length === 0) {
        console.log("No rows found, breaking...");
        break;
      }

      // Step 6: Process each row from the tableRows array
      for (let i = 0; i < tableRows.length; i++) {
        console.log(`Processing contract ${i + 1}/${tableRows.length} on page ${pageNumber}`);

        try {
          // Step 6.1: Get contract value (before last td with specific class)
          const contractValueElement = await tableRows[i].locator(
            "td:nth-child(6) > div.table-xs-td-content.epublica-truncate-text > span"
          );

          const contractValue = await contractValueElement.textContent();

          if (!contractValue) {
            console.log(`No contract value found for row ${i + 1}, skipping...`);
            continue;
          }

          console.log(`Contract value: ${contractValue.trim()}`);

          // Step 6.2: Create result object
          const result = {
            contract_value: contractValue.trim(),
          };

          // Step 6.3: Click on the td element to navigate to details
          await contractValueElement.click();

          // Wait for navigation and new page to load
          await page.waitForTimeout(3000);

          try {
            // Step 6.4 & 6.5: Find "Finalidade" and get its value using specific selector
            // Wait for the form to be present
            await page.waitForSelector(
              "html > body > div:first-child > div > portal-shell > section > div > div:first-child > div > div > div > ng-transclude > div > div > div > form",
              { timeout: 10000 }
            );

            // Use the specific selector provided to find the Finalidade ng-repeat element
            const finalidadeNgRepeat = page.locator(
              "html > body > div:first-child > div > portal-shell > section > div > div:first-child > div > div > div > ng-transclude > div > div > div > form > div:first-child > ng-form > div:nth-child(8) > p-list > dl > ng-repeat:nth-child(2)"
            );

            if ((await finalidadeNgRepeat.count()) > 0) {
              // Get the dd element within the ng-repeat container
              const purposeElement = finalidadeNgRepeat.locator("dd");
              const purpose = await purposeElement.textContent();

              // Step 6.6: Add purpose to result
              result.purpose = purpose ? purpose.trim() : "Not found";
              console.log(`Purpose: ${result.purpose}`);
            } else {
              // Fallback: try a more generic approach to find any dt with "Finalidade"
              try {
                const finalidadeDt = page.locator("dt").filter({ hasText: "Finalidade:" });
                if ((await finalidadeDt.count()) > 0) {
                  // Get the parent ng-repeat and then find the dd within it
                  const parentNgRepeat = finalidadeDt.locator("..");
                  const purposeElement = parentNgRepeat.locator("dd");
                  const purpose = await purposeElement.textContent();
                  result.purpose = purpose ? purpose.trim() : "Not found";
                } else {
                  result.purpose = "Not found";
                  console.log("Purpose not found with any selector");
                }
              } catch (error) {
                result.purpose = "Not found";
                console.log("Purpose not found with either selector");
              }
            }
          } catch (error) {
            console.log(`Error extracting purpose: ${error.message}`);
            result.purpose = "Error extracting";
          }

          // Step 6.7: Add result to resultList
          resultList.push(result);
          console.log(`Added contract ${resultList.length}: ${JSON.stringify(result)}`);

          // Step 6.8: Navigate back
          await page.goBack();
          await page.waitForTimeout(2000);

          // Wait for table to be visible again
          await page.waitForSelector("#compublicaportalcontratoPortalContratoTableService tbody tr", {
            timeout: 10000,
          });

          // Navigate to the correct page if pageNumber > 1
          if (pageNumber > 1) {
            console.log(`Navigating back to page ${pageNumber} after detail view...`);
            const clicksNeeded = pageNumber - 1;
            console.log(`Need to click next button ${clicksNeeded} times to return to page ${pageNumber}`);

            const nextButton = page.locator("a.btn.btn-blue.pagination-next").filter({ hasText: "Próxima" });

            for (let clickCount = 0; clickCount < clicksNeeded; clickCount++) {
              const buttonExists = await nextButton.count();
              if (buttonExists === 0) {
                console.log("Next button not found during navigation back, stopping");
                break;
              }

              const isDisabled = await nextButton.getAttribute("disabled");
              if (isDisabled !== null && isDisabled !== "") {
                console.log("Next button is disabled during navigation back, stopping");
                break;
              }

              console.log(`Navigation click ${clickCount + 1}/${clicksNeeded}...`);
              await nextButton.click();
              await page.waitForTimeout(2000);
            }

            console.log(`Successfully navigated back to page ${pageNumber}`);
          }
        } catch (error) {
          console.log(`Error processing row ${i + 1}: ${error.message}`);

          // Try to go back if we're stuck on a detail page
          try {
            await page.goBack();
            await page.waitForTimeout(2000);
          } catch (backError) {
            console.log("Could not go back, continuing...");
          }
        }
      }

      // Step 6.10 & 6.11: Check for next page
      try {
        // Based on test results: use class-based selector with text filter
        // Found: <A> class="btn btn-blue pagination-next " text="Próxima"
        const nextButton = page.locator("a.btn.btn-blue.pagination-next").filter({ hasText: "Próxima" });

        console.log("Checking for next page button...");
        const buttonCount = await nextButton.count();
        console.log(`Next button count: ${buttonCount}`);

        if (buttonCount > 0) {
          const isDisabled = await nextButton.getAttribute("disabled");
          const isVisible = await nextButton.isVisible();

          console.log(`Button disabled attribute: ${isDisabled}`);
          console.log(`Button visible: ${isVisible}`);

          if (isVisible && (isDisabled === null || isDisabled === "")) {
            console.log("Moving to next page...");

            // Click once to move to the next page
            await nextButton.click();
            await page.waitForTimeout(3000);
            pageNumber++;
            console.log(`Moved to page ${pageNumber}`);
          } else {
            console.log("Next button is disabled or not visible, finished pagination");
            break;
          }
        } else {
          console.log("Next button not found, finished pagination");
          break;
        }
      } catch (error) {
        console.log(`Error with pagination: ${error.message}`);
        break;
      }
    }
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
  } finally {
    await browser.close();
  }

  return resultList;
}

// Main execution
async function main() {
  try {
    const results = await scrapeContracts();

    console.log("\n=== SCRAPING COMPLETED ===");
    console.log(`Total contracts scraped: ${results.length}`);

    // Save results to JSON file
    const fs = require("fs");
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const filename = `contracts_${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`Results saved to: ${filename}`);

    // Display first few results
    console.log("\nFirst 3 results:");
    results.slice(0, 3).forEach((result, index) => {
      console.log(`${index + 1}. Value: ${result.contract_value}, Purpose: ${result.purpose}`);
    });
  } catch (error) {
    console.error(`Error in main execution: ${error.message}`);
  }
}

// Export for use as module
module.exports = { scrapeContracts };

// Run if called directly
if (require.main === module) {
  main();
}
