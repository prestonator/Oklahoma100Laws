const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const path = require("path");
// No new imports needed, 'fetch' is built-in in modern Node.js (v18+)

// --- CONFIGURATION ---
const URLS_TO_SCRAPE = [
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1075",
  // Add more URLs here...
];

const DOWNLOAD_DIR = path.join(__dirname, "downloads");

// --- MAIN SCRAPER LOGIC ---

async function runScraper() {
  console.log("Starting the scraper...");
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: false });
  console.log(`Scraping ${URLS_TO_SCRAPE.length} URL(s)...`);

  for (const url of URLS_TO_SCRAPE) {
    const page = await browser.newPage();
    try {
      await scrapeAndDownload(page, url);
    } catch (error) {
      console.error(`❌ Failed to process ${url}:`, error.message);
    } finally {
      await page.close();
    }
  }

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

  const billName = new URL(url).searchParams.get("Bill");
  if (!billName) {
    console.error(`   Could not determine bill name from URL. Skipping.`);
    return;
  }

  await page.goto(url);

  // 1. Find the index of the "Versions" tab (No changes here)
  const versionsTabIndex = await page.evaluate(() => {
    const tabHeaders = Array.from(
      document.querySelectorAll(".ajax__tab_header span.ajax__tab_tab")
    );
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

  // 2. Find the PDF link within the corresponding tab body (No changes here)
  const pdfUrl = await page.evaluate((index) => {
    const panelSelector = `.ajax__tab_body > div:nth-child(${index + 1})`;
    const versionPanel = document.querySelector(panelSelector);
    if (!versionPanel) return null;
    const allLinks = Array.from(versionPanel.querySelectorAll("a"));
    const targetLink = allLinks.find(
      (a) => a.textContent.trim() === "Enrolled (final version)"
    );
    return targetLink ? targetLink.href : null;
  }, versionsTabIndex);

  if (!pdfUrl) {
    console.log(
      `   ⚠️ Could not find 'Enrolled (final version)' link for ${billName}. Skipping.`
    );
    return;
  }
  console.log(`   Found PDF link: ${pdfUrl}`);

  // --- MODIFIED SECTION ---
  // 3. Download the PDF directly using fetch
  // This is more reliable for direct file downloads than using page.goto().
  console.log(`   Fetching PDF directly...`);

  const response = await fetch(pdfUrl);

  // Check if the request was successful
  if (!response.ok) {
    throw new Error(
      `Failed to download PDF. Status: ${response.status} ${response.statusText}`
    );
  }

  // Get the PDF data as an ArrayBuffer
  const pdfArrayBuffer = await response.arrayBuffer();
  // Convert it to a Node.js Buffer, which is needed for fs.writeFile
  const pdfBuffer = Buffer.from(pdfArrayBuffer);

  // 4. Save the PDF to a file
  const filePath = path.join(DOWNLOAD_DIR, `${billName}.pdf`);
  await fs.writeFile(filePath, pdfBuffer);
  console.log(`   ✅ Successfully downloaded and saved to: ${filePath}`);
}

// --- START THE SCRIPT ---
runScraper();
