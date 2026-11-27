#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../../codes");
const OUTPUT = path.join(ROOT, "sitemap.xml");
const SITE_URL = (process.env.SITE_URL || "https://ysas4331.pages.dev").replace(/\/+$/, "");

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function collectHtmlFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(fullPath));
      continue;
    }

    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".html")) {
      continue;
    }

    // Google Search Console verification files are not public content pages.
    if (/^google.*\.html$/i.test(entry.name)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    if (/google-site-verification\s*:/i.test(content)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function toPublicUrl(filePath) {
  const relativePath = path.relative(ROOT, filePath).split(path.sep);
  const fileName = relativePath.pop();

  if (fileName.toLowerCase() === "index.html") {
    const directory = relativePath.map(encodeURIComponent).join("/");
    return directory ? `${SITE_URL}/${directory}/` : `${SITE_URL}/`;
  }

  const encodedPath = [...relativePath, fileName].map(encodeURIComponent).join("/");
  return `${SITE_URL}/${encodedPath}`;
}

if (!fs.existsSync(ROOT)) {
  throw new Error(`Source directory not found: ${ROOT}`);
}

const urls = collectHtmlFiles(ROOT)
  .map(toPublicUrl)
  .sort((a, b) => a.localeCompare(b));

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
  "</urlset>",
  "",
].join("\n");

fs.writeFileSync(OUTPUT, xml, "utf8");
console.log(`Generated ${path.relative(process.cwd(), OUTPUT)} with ${urls.length} URLs.`);
