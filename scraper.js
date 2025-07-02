const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const path = require("path");

// --- CONFIGURATION ---
const URLS_TO_SCRAPE = [
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1075",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1086",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1087",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1096",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1277",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1278",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1282",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1287",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1360",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1372",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1376",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1393",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1412",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1465",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1466",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1483",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1485",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1512",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1521",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1521",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1576",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1688",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1727",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1732",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1751",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1865",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB1940",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2082",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2158",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2207",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2257",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2259",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2286",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2287",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2289",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2374",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2516",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2518",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2728",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2743",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2758",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2770",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2771",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2772",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2777",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2779",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2788",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2789",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2790",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2793",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=HB2903",
  "https://www.oklegislature.gov/BillInfo.aspx?Bill=SB102",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1024",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB105",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1126",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1129",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1137",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1140",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1141",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1143",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1150",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1151",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1152",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1153",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1155",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1169",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB1180",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB135",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB190",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB251",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB31",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB335",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB341",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB391",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB393",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB394",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB395",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB396",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB434",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB443",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB460",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB469",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB480",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB527",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB553",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB56",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB672",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB676",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB711",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB745",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB752",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB794",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB796",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB806",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB813",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB814",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB840",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB841",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB912",
  "http://www.oklegislature.gov/BillInfo.aspx?Bill=SB940",
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
