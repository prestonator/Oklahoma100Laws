const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const path = require("path");

// --- CONFIGURATION ---
// The list of URLs you want to scrape.
const URLS_TO_SCRAPE = [
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1075&Session=2500",
];

const DOWNLOAD_DIR = path.join(__dirname, "downloads"); // Folder to save PDFs

// --- MAIN SCRAPER LOGIC ---

/**
 * The main function that orchestrates the scraping process.
 */
async function runScraper() {
  console.log("Starting the scraper...");

  // Ensure the download directory exists
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

  // Launch a headless browser instance
  const browser = await puppeteer.launch({
    headless: true, // Use the new headless mode
  });

  console.log(`Scraping ${URLS_TO_SCRAPE.length} URL(s)...`);

  // Process each URL in the list
  for (const url of URLS_TO_SCRAPE) {
    // Create a new page for each URL to ensure a clean state
    const page = await browser.newPage();
    try {
      await scrapeAndDownload(page, url);
    } catch (error) {
      console.error(`❌ Failed to process ${url}:`, error.message);
    } finally {
      // Close the page to free up resources
      await page.close();
    }
  }

  // Close the browser once all URLs have been processed
  await browser.close();
  console.log("\n✅ Scraper finished.");
}

/**
 * Scrapes a single page to find the PDF link and downloads the file.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} url - The URL of the bill to scrape.
 */
async function scrapeAndDownload(page, url) {
  console.log(`\nNavigating to: ${url}`);

  // Extract the Bill name from the URL for the filename
  const billName = new URL(url).searchParams.get("Bill");
  if (!billName) {
    console.error(`   Could not determine bill name from URL. Skipping.`);
    return;
  }

  // Navigate to the page and wait for it to be fully loaded
  await page.goto(url, { waitUntil: "networkidle2" });

  // 1. Find the index of the "Versions" tab
  const versionsTabIndex = await page.evaluate(() => {
    // Select all the tab header elements
    const tabHeaders = Array.from(
      document.querySelectorAll(".ajax__tab_header span.ajax__tab_tab")
    );
		console.log(tabHeaders)
    // Find the index of the tab with the text "Versions"
    return tabHeaders.findIndex(
      (span) => span.textContent.trim() === "Versions"
    );
  });

  if (versionsTabIndex === -1) {
    console.log(
      `   ⚠️ Could not find the 'Versions' tab for ${billName}. Skipping.`
    );
    return;
  }
  console.log(`   Found 'Versions' tab at index: ${versionsTabIndex}`);

  // 2. Find the PDF link within the corresponding tab body
  // The tab body panels are direct children of .ajax__tab_body
  // We use the found index to select the correct panel.
  const pdfUrl = await page.evaluate((index) => {
    // CSS :nth-child is 1-based, so we add 1 to our 0-based index
    const panelSelector = `.ajax__tab_body > div:nth-child(${index + 1})`;
    const versionPanel = document.querySelector(panelSelector);

    if (!versionPanel) return null;

    // Find the anchor tag with the specific text
    const allLinks = Array.from(versionPanel.querySelectorAll("a"));
    const targetLink = allLinks.find(
      (a) => a.textContent.trim() === "Enrolled (final version)"
    );

    // Return the href if the link is found
    return targetLink ? targetLink.href : null;
  }, versionsTabIndex); // Pass the index to the browser context

  if (!pdfUrl) {
    console.log(
      `   ⚠️ Could not find 'Enrolled (final version)' link for ${billName}. Skipping.`
    );
    return;
  }
  console.log(`   Found PDF link: ${pdfUrl}`);

  // 3. Download the PDF
  // We can't just fetch the PDF directly. It's better to use the browser's context
  // to handle any cookies or session data that might be required.
  const pdfResponse = await page.goto(pdfUrl, { waitUntil: "networkidle2" });
  const pdfBuffer = await pdfResponse.buffer();

  // 4. Save the PDF to a file
  const filePath = path.join(DOWNLOAD_DIR, `${billName}.pdf`);
  await fs.writeFile(filePath, pdfBuffer);
  console.log(`   ✅ Successfully downloaded and saved to: ${filePath}`);
}

// --- START THE SCRIPT ---
runScraper();
