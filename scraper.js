const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const {
  URLS_TO_SCRAPE,
  DOWNLOAD_DIR,
  RETRY_COUNT,
  RETRY_DELAY_MS,
  BATCH_SIZE,
} = require("./config");
const logger = require("./logger");
const { scrapeAndDownload } = require("./pageScraper");

// --- MAIN SCRAPER LOGIC ---

async function runScraper() {
  logger.info("Starting the scraper...");
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: false });
  logger.info(
    `Scraping ${URLS_TO_SCRAPE.length} unique URL(s) in batches of ${BATCH_SIZE}...`
  );

  for (let i = 0; i < URLS_TO_SCRAPE.length; i += BATCH_SIZE) {
    const batch = URLS_TO_SCRAPE.slice(i, i + BATCH_SIZE);
    logger.info(`--- Processing batch ${i / BATCH_SIZE + 1} ---`);
    // Process URLs in parallel for efficiency
    const scrapePromises = batch.map((url) =>
      processUrlWithRetries(browser, url)
    );
    await Promise.all(scrapePromises);
  }

  await browser.close();
  logger.info("\n✅ Scraper finished.");
}

/**
 * Wraps the scraping process for a single URL with retry logic.
 * @param {puppeteer.Browser} browser - The Puppeteer browser instance.
 * @param {string} url - The URL to process.
 */
async function processUrlWithRetries(browser, url) {
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    let page = null; // Declare page here to ensure it's in scope for finally
    try {
      page = await browser.newPage();
      // Ensure the page is closed even on navigation errors
      await page.goto(url);
      await scrapeAndDownload(page, url, DOWNLOAD_DIR);
      return; // Success, exit the loop
    } catch (error) {
      logger.error(`❌ Attempt ${attempt} failed for ${url}: ${error.message}`);
      if (attempt < RETRY_COUNT) {
        logger.info(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        logger.error(`   All retries failed for ${url}.`);
      }
    } finally {
      if (page && !page.isClosed()) {
        await page.close();
        logger.info(`   Page closed for ${url}`);
      }
    }
  }
}

// --- START THE SCRIPT ---
runScraper();
