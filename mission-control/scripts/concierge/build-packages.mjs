#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "dist", "concierge");
const README = path.join(ROOT, "docs", "concierge-client-readme.md");

const bundles = [
  {
    name: "tier2",
    sources: ["packages/mission-control", "packages/scripts"],
  },
  {
    name: "tier3",
    sources: ["packages/mission-control", "packages/scripts", "packages/bounty"],
  }
];

function ensureOutput() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function copyReadme(bundleDir) {
  if (!fs.existsSync(README)) return;
  fs.copyFileSync(README, path.join(bundleDir, "README.md"));
}

function buildBundle(config) {
  const staging = path.join(OUTPUT_DIR, config.name);
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });
  copyReadme(staging);
  for (const rel of config.sources) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) {
      console.warn(`Missing source ${src}, skipping`);
      continue;
    }
    execSync(`rsync -a ${src}/ ${staging}/${path.basename(rel)}/`);
  }
  const zipPath = path.join(OUTPUT_DIR, `${config.name}.zip`);
  execSync(`cd ${OUTPUT_DIR} && zip -r ${zipPath} ${config.name}`);
  console.log(`Built ${zipPath}`);
}

function main() {
  ensureOutput();
  bundles.forEach(buildBundle);
}

main();
