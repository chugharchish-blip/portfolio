// Renders each case study page to an A4 PDF in downloads/ using the print stylesheet.
// Usage: node scripts/build-pdfs.mjs   (needs Playwright + Chromium)
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = [
  "banking-consortium-fraud-investigation",
  "national-health-insurance-audit",
  "audit-analytics-automation",
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const name of pages) {
  const url = pathToFileURL(path.join(root, "case-studies", `${name}.html`)).href;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: path.join(root, "downloads", `${name}.pdf`),
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate:
      '<div style="font:8px sans-serif;color:#6b8081;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>Archish Chugh · Case study</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
  });
  console.log("wrote", name + ".pdf");
}
await browser.close();
