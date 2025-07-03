const fs = require("fs/promises");
const path = require("path");
const logger = require("./logger");

/**
 * Downloads a file from a given URL and saves it to a specified directory.
 * @param {string} url - The URL of the file to download.
 * @param {string} fileName - The name to save the file as.
 * @param {string} downloadDir - The directory to save the file in.
 */
async function downloadFile(url, fileName, downloadDir) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to download PDF. Status: ${response.status} ${response.statusText}`
      );
    }

    const pdfArrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    const filePath = path.join(downloadDir, `${fileName}.pdf`);
    await fs.writeFile(filePath, pdfBuffer);
    logger.info(`✅ Successfully downloaded and saved to: ${filePath}`);
  } catch (error) {
    logger.error(`❌ Failed to download file from ${url}: ${error.message}`);
    throw error; // Re-throw to be caught by the caller
  }
}

module.exports = { downloadFile };
