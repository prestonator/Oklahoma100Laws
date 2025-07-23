const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const path = require("path");
const logger = require("./logger");

// Configuration
const BASE_URL = "https://sunberryvillage.wiki.gg";
const STARTING_URL = "https://sunberryvillage.wiki.gg/wiki/Special:AllPages";
const OUTPUT_FILE = "wiki_urls.txt";
const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Scrapes all URLs from the Sunberry Village wiki Special:AllPages page
 * and saves them to a text file.
 */
async function scrapeWikiUrls() {
  logger.info("Starting wiki URL scraper...");

  const browser = await puppeteer.launch({ headless: true });
  let page = null;

  try {
    page = await browser.newPage();

    // Navigate to the starting URL
    logger.info(`Navigating to: ${STARTING_URL}`);
    await page.goto(STARTING_URL, { waitUntil: "networkidle2" });

    // Extract all URLs from the page
    const urls = await extractUrls(page);

    if (urls.length === 0) {
      logger.warn("No URLs found on the page.");
      return;
    }

    logger.info(`Found ${urls.length} URLs on the page.`);

    // Save URLs to text file
    await saveUrlsToFile(urls, OUTPUT_FILE);

    logger.info(`✅ Successfully saved ${urls.length} URLs to ${OUTPUT_FILE}`);
  } catch (error) {
    logger.error(`❌ Error during scraping: ${error.message}`);
    throw error;
  } finally {
    if (page && !page.isClosed()) {
      await page.close();
    }
    await browser.close();
  }
}

/**
 * Extracts URLs from the Special:AllPages page using the specified selectors.
 * @param {import("puppeteer").Page} page - The Puppeteer page instance.
 * @returns {Promise<string[]>} Array of complete URLs.
 */
async function extractUrls(page) {
  logger.info("Extracting URLs from the page...");

  const urls = await page.evaluate((baseUrl) => {
    const extractedUrls = [];

    // Find all div.mw-allpages-body ul.mw-allpages-chunk elements
    const chunks = document.querySelectorAll(
      "div.mw-allpages-body ul.mw-allpages-chunk"
    );

    chunks.forEach((chunk) => {
      // Within each chunk, find all list items
      const listItems = chunk.querySelectorAll("li");

      listItems.forEach((li) => {
        // Find the anchor tag within each list item
        const anchor = li.querySelector("a");
        if (anchor && anchor.href) {
          const href = anchor.getAttribute("href");
          // Check if it's a relative wiki URL
          if (href && href.startsWith("/wiki/")) {
            // Append to base URL
            const fullUrl = baseUrl + href;
            extractedUrls.push(fullUrl);
          }
        }
      });
    });

    return extractedUrls;
  }, BASE_URL);

  // Remove duplicates and sort
  const uniqueUrls = [...new Set(urls)].sort();

  logger.info(`Extracted ${uniqueUrls.length} unique URLs.`);
  return uniqueUrls;
}

/**
 * Saves URLs to a text file, one URL per line.
 * @param {string[]} urls - Array of URLs to save.
 * @param {string} filename - Name of the output file.
 */
async function saveUrlsToFile(urls, filename) {
  logger.info(`Saving URLs to ${filename}...`);

  try {
    const content = urls.join("\n") + "\n";
    await fs.writeFile(filename, content, "utf8");
    logger.info(`Successfully wrote ${urls.length} URLs to ${filename}`);
  } catch (error) {
    logger.error(`Failed to write URLs to file: ${error.message}`);
    throw error;
  }
}

/**
 * Wraps the scraping process with retry logic.
 */
async function runScraperWithRetries() {
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    try {
      await scrapeWikiUrls();
      return; // Success, exit the loop
    } catch (error) {
      logger.error(`❌ Attempt ${attempt} failed: ${error.message}`);
      if (attempt < RETRY_COUNT) {
        logger.info(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        logger.error(`   All retries failed.`);
        process.exit(1);
      }
    }
  }
}

// --- START THE SCRIPT ---
if (require.main === module) {
  runScraperWithRetries();
}

module.exports = { scrapeWikiUrls, extractUrls, saveUrlsToFile };
