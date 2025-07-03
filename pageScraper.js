const { downloadFile } = require("./fileDownloader");
const logger = require("./logger");

/**
 * Scrapes a single page to find the PDF link and downloads the file.
 * @param {import("puppeteer").Page} page - The Puppeteer page instance.
 * @param {string} url - The URL of the bill to scrape.
 * @param {string} downloadDir - The directory to save the file in.
 */
async function scrapeAndDownload(page, url, downloadDir) {
  const billName = new URL(url).searchParams.get("Bill");
  if (!billName) {
    logger.warn(`Could not determine bill name from URL: ${url}. Skipping.`);
    return;
  }

  logger.info(`Navigating to: ${url}`);
  await page.goto(url);

  const versionsTabIndex = await page.evaluate(() => {
    const tabHeaders = Array.from(
      document.querySelectorAll(".ajax__tab_header span.ajax__tab_tab")
    );
    return tabHeaders.findIndex(
      (span) => span.textContent.trim() === "Versions"
    );
  });

  if (versionsTabIndex === -1) {
    logger.warn(`Could not find the 'Versions' tab for ${billName}. Skipping.`);
    return;
  }
  logger.info(
    `Found 'Versions' tab for ${billName} at index: ${versionsTabIndex}`
  );

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
    logger.warn(
      `Could not find 'Enrolled (final version)' link for ${billName}. Skipping.`
    );
    return;
  }
  logger.info(`Found PDF link for ${billName}: ${pdfUrl}`);

  await downloadFile(pdfUrl, billName, downloadDir);
}

module.exports = { scrapeAndDownload };
