#!/usr/bin/env node
/**
 * Validates LLM documentation links and syncs llms.txt to site/public.
 * Run: pnpm validate:docs
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED_FILES = [
  "llms.txt",
  "docs/llm-guide.md",
  "AGENTS.md",
  ".spec/TASK_TRACKING.md",
  ".spec/ROADMAP.md",
  ".cursor/rules/00-llm-onboarding.mdc",
];

const SCANNED_MARKDOWN = ["llms.txt", "docs/llm-guide.md", "README.md"];

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/** @param {string} content */
function extractRelativeLinks(content) {
  /** @type {string[]} */
  const links = [];

  for (const match of content.matchAll(LINK_PATTERN)) {
    const raw = match[2].trim();
    if (
      raw.startsWith("http://") ||
      raw.startsWith("https://") ||
      raw.startsWith("mailto:") ||
      raw.startsWith("#")
    ) {
      continue;
    }
    links.push(raw.split("#")[0]);
  }

  return [...new Set(links)];
}

/** @param {string} sourceFile @param {string} link */
function validateLink(sourceFile, link) {
  const sourceDir = dirname(join(ROOT, sourceFile));
  const target = join(sourceDir, link);
  if (!existsSync(target)) {
    return `${sourceFile}: broken link → ${link}`;
  }
  return null;
}

/** @param {string[]} errors */
function reportAndExit(errors) {
  if (errors.length === 0) {
    console.log("validate:docs — all checks passed");
    return;
  }

  console.error("validate:docs — failed:\n");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

/** Sync llms.txt to site/public for deployed docs */
function syncLlmsTxtToSite() {
  const source = join(ROOT, "llms.txt");
  const dest = join(ROOT, "site/public/llms.txt");

  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(source, dest);
}

function main() {
  /** @type {string[]} */
  const errors = [];

  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(ROOT, file))) {
      errors.push(`missing required file: ${file}`);
    }
  }

  for (const file of SCANNED_MARKDOWN) {
    const fullPath = join(ROOT, file);
    if (!existsSync(fullPath)) {
      errors.push(`missing scanned file: ${file}`);
      continue;
    }

    const content = readFileSync(fullPath, "utf8");
    for (const link of extractRelativeLinks(content)) {
      const issue = validateLink(file, link);
      if (issue) {
        errors.push(issue);
      }
    }
  }

  if (errors.length > 0) {
    reportAndExit(errors);
  }

  syncLlmsTxtToSite();
  reportAndExit([]);
}

main();
