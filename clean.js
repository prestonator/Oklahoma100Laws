const { PDFDocument } = require("pdf-lib");
const fs = require("fs/promises");
const path = require("path");
const { DOWNLOAD_DIR } = require("./config");
const logger = require("./logger");

async function cleanPdf(filePath) {
  try {
    const existingPdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pageCount = pdfDoc.getPageCount();

    if (pageCount > 1) {
      pdfDoc.removePage(pageCount - 1);
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(filePath, pdfBytes);
      logger.info(`Removed last page from ${path.basename(filePath)}`);
    } else {
      logger.warn(
        `Could not remove last page from ${path.basename(
          filePath
        )} as it only has one page.`
      );
    }
  } catch (error) {
    logger.error(
      `Failed to process ${path.basename(filePath)}: ${error.message}`
    );
  }
}

async function cleanAllPdfs() {
  logger.info("Starting PDF cleaning process...");
  try {
    const files = await fs.readdir(DOWNLOAD_DIR);
    const pdfFiles = files.filter((file) =>
      file.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      logger.info("No PDF files found in the downloads directory to clean.");
      return;
    }

    logger.info(`Found ${pdfFiles.length} PDF(s) to clean.`);

    const cleanPromises = pdfFiles.map((file) => {
      const filePath = path.join(DOWNLOAD_DIR, file);
      return cleanPdf(filePath);
    });

    await Promise.all(cleanPromises);

    logger.info("✅ PDF cleaning process finished.");
  } catch (error) {
    logger.error(
      `An error occurred during the cleaning process: ${error.message}`
    );
    if (error.code === "ENOENT") {
      logger.error(`Downloads directory not found at: ${DOWNLOAD_DIR}`);
      logger.error("Please run the scraper first to download some files.");
    }
  }
}

cleanAllPdfs();
