#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "dist", "concierge");

const manifest = {
  tier2: [
    "docs/concierge-client-readme.md",
    "docs/concierge/stripe-test-download.md",
    "docs/concierge/package-manifest.md",
    "supabase/migrations",
    "scripts/ops/heartbeat-monitor.mjs",
    "scripts/ops/agent-auto-reassign.mjs",
    "scripts/concierge",
    "src/app/approvals",
    "src/app/calendar",
    "src/app/concierge",
    "src/app/content",
    "src/app/data",
    "src/app/projects",
    "package.json",
    "next.config.mjs",
    "tsconfig.json"
  ]
};
manifest.tier3 = [
  ...manifest.tier2,
  "docs/bounty",
  "scripts/bounty"
];

const bundles = [
  { name: "tier2", sources: manifest.tier2 },
  { name: "tier3", sources: manifest.tier3 }
];

function ensureOutput() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function copyEntry(entry, stagingRoot) {
  const sourcePath = path.join(ROOT, entry);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`Missing source ${entry}, skipping`);
    return;
  }
  const destination = path.join(stagingRoot, entry);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const stats = fs.statSync(sourcePath);
  if (stats.isDirectory()) {
    execSync(`rsync -a "${sourcePath}/" "${destination}/"`);
  } else {
    fs.copyFileSync(sourcePath, destination);
  }
}

function buildBundle(config) {
  const staging = path.join(OUTPUT_DIR, config.name);
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });
  config.sources.forEach((entry) => copyEntry(entry, staging));
  const zipPath = path.join(OUTPUT_DIR, `${config.name}.zip`);
  execSync(`cd ${OUTPUT_DIR} && zip -r ${path.basename(zipPath)} ${config.name}`);
  fs.rmSync(staging, { recursive: true, force: true });
  console.log(`Built ${zipPath}`);
}

function main() {
  ensureOutput();
  bundles.forEach(buildBundle);
}

main();
