#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../../codes");
const TOOLS_DIR = path.join(ROOT, "tools");
const TOOLS_FILE = path.join(ROOT, "assets/tools.json");
const ANALYTICS_FILE = path.join(ROOT, "assets/analytics.json");
const INDEX_FILE = path.join(ROOT, "index.html");
const POPULAR_LIMIT = 3;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function renderTool(tool) {
  return [
    '<article class="tool-card">',
    '  <span class="tool-card-icon"><i data-lucide="' + escapeHtml(tool.icon) + '"></i></span>',
    '  <div class="tool-card-content">',
    '    <a class="tool-card-title" href="' + escapeHtml(tool.url) + '">' + escapeHtml(tool.title) + '</a>',
    '    <p class="tool-card-description">' + escapeHtml(tool.description) + '</p>',
    '  </div>',
    '</article>',
  ].join("\n");
}

function renderSection(tools) {
  if (!tools.length) {
    return '<p class="tools-empty">現在、表示できるツールはありません。</p>';
  }

  return '<div class="tool-grid">\n' + tools.map(renderTool).join("\n") + '\n</div>';
}

if (!fs.existsSync(TOOLS_FILE) || !fs.existsSync(ANALYTICS_FILE)) {
  throw new Error("tools.json または analytics.json が見つかりません");
}

const metadata = loadJson(TOOLS_FILE);
const analytics = loadJson(ANALYTICS_FILE);
const directories = fs.readdirSync(TOOLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const tools = directories
  .filter((slug) => metadata[slug])
  .map((slug) => ({ slug, ...metadata[slug] }));

const pageviews = new Map(
  (analytics.pages || []).map((page) => [page.path, Number(page.pageviews) || 0]),
);

const popular = [...tools]
  .map((tool) => ({ ...tool, pageviews: pageviews.get(tool.url) || 0 }))
  .filter((tool) => tool.pageviews > 0)
  .sort((a, b) => b.pageviews - a.pageviews || a.title.localeCompare(b.title, "ja"))
  .slice(0, POPULAR_LIMIT);

const allTools = [...tools].sort((a, b) => a.title.localeCompare(b.title, "ja"));
let html = fs.readFileSync(INDEX_FILE, "utf8");

function replaceSection(source, id, content) {
  const pattern = new RegExp(
    '(<section id="' + id + '">[\\s\\S]*?<h2>[\\s\\S]*?<\\/h2>)[\\s\\S]*?(<\\/section>)',
  );
  if (!pattern.test(source)) {
    throw new Error(id + " セクションが index.html に見つかりません");
  }
  return source.replace(pattern, "$1\n" + content + "\n  $2");
}

html = replaceSection(html, "popular-tools", renderSection(popular));
html = replaceSection(html, "all-tools", renderSection(allTools));

fs.writeFileSync(INDEX_FILE, html, "utf8");
console.log("トップページを生成しました: 人気 " + popular.length + "件 / 全ツール " + allTools.length + "件");
