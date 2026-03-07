#!/usr/bin/env node
/**
 * Generates sitemap.xml from olympiad_data.json.gz
 * Run: node scripts/generate-sitemap.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { gunzipSync } from "zlib";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = process.env.SITE_URL || "https://moresults.org";
const DATA_PATH = resolve(__dirname, "../public/data/olympiad_data.json.gz");
const OUTPUT_PATH = resolve(__dirname, "../public/sitemap.xml");

const gzData = readFileSync(DATA_PATH);
const jsonStr = gunzipSync(gzData).toString("utf-8");
const db = JSON.parse(jsonStr);

const urls = [];

function addUrl(path, priority, changefreq = "monthly") {
  urls.push({ loc: `${SITE_URL}${path}`, priority, changefreq });
}

// Static pages
addUrl("/", 1.0, "weekly");
addUrl("/contestants", 0.8, "weekly");
addUrl("/competitions", 0.8, "weekly");
addUrl("/countries/individual", 0.8, "weekly");
addUrl("/countries/compare", 0.5, "monthly");
addUrl("/hall-of-fame", 0.9, "weekly");
addUrl("/data", 0.4, "monthly");

// Individual contestant pages
for (const person of Object.values(db.people)) {
  addUrl(`/contestants/${person.id}`, 0.6);
}

// Individual competition pages + statistics
for (const comp of Object.values(db.competitions)) {
  addUrl(`/competitions/${comp.id}`, 0.7);
  addUrl(`/competitions/${comp.id}/statistics`, 0.5);
}

// Individual country pages
for (const country of Object.values(db.countries)) {
  addUrl(`/countries/individual/${country.code.toLowerCase()}`, 0.7);
}

// Generate XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync(OUTPUT_PATH, xml, "utf-8");
console.log(`Sitemap generated with ${urls.length} URLs at ${OUTPUT_PATH}`);
