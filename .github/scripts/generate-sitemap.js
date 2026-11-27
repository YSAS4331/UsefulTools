#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

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

    // Error pages are not useful search results.
    if (entry.name.toLowerCase() === "404.html") {
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

function getLastModified(filePath) {
  const relativePath = path.relative(path.resolve(__dirname, "../.."), filePath);

  try {
    const date = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", relativePath],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();

    return date && !Number.isNaN(Date.parse(date)) ? date : null;
  } catch {
    return null;
  }
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
  .map((filePath) => ({
    loc: toPublicUrl(filePath),
    lastmod: getLastModified(filePath),
  }))
  .sort((a, b) => a.loc.localeCompare(b.loc));

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(({ loc, lastmod }) => [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    ...(lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : []),
    "  </url>",
  ].join("\n")),
  "</urlset>",
  "",
].join("\n");

fs.writeFileSync(OUTPUT, xml, "utf8");
console.log(`Generated ${path.relative(process.cwd(), OUTPUT)} with ${urls.length} URLs (${urls.filter(({ lastmod }) => lastmod).length} lastmod values).`);
