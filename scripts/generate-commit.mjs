import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(".");
const configPath = resolve(repoRoot, "config/commit-config.json");
const logPath = resolve(repoRoot, "data/meaningless-log.txt");
const feedPath = resolve(repoRoot, "public/commits.json");

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function randInt(min, max) {
  if (max <= min) {
    return min;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return "meaningless maintenance";
  }
  return list[randInt(0, list.length - 1)];
}

function ensureParent(filePath) {
  const parent = dirname(filePath);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }
}

function git(args, options = {}) {
  const command = `git ${args}`;
  return execSync(command, {
    cwd: repoRoot,
    stdio: options.stdio ?? "pipe",
    encoding: "utf8"
  });
}

function getBranch() {
  const fromEnv = process.env.GITHUB_REF_NAME;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  const abbr = git("rev-parse --abbrev-ref HEAD").trim();
  if (abbr === "HEAD") {
    throw new Error(
      "Detached HEAD: checkout a branch (e.g. main) or run in GitHub Actions where GITHUB_REF_NAME is set."
    );
  }
  return abbr;
}

function syncWithOrigin() {
  const branch = getBranch();
  git(`fetch origin ${branch}`, { stdio: "inherit" });
  git(`rebase origin/${branch}`, { stdio: "inherit" });
}

function pushWithRetry() {
  const branch = getBranch();
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      git(`push origin HEAD:${branch}`, { stdio: "inherit" });
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      console.log(
        `Push failed (attempt ${attempt}/${maxAttempts}); fetching and rebasing onto origin/${branch}, then retrying.`
      );
      git(`fetch origin ${branch}`, { stdio: "inherit" });
      git(`rebase origin/${branch}`, { stdio: "inherit" });
    }
  }
}

function readJson(filePath, fallback) {
  if (!existsSync(filePath)) {
    return fallback;
  }
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureParent(filePath);
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function appendLogLine(message) {
  const now = new Date().toISOString();
  const line = `- ${now} :: ${message}\n`;
  const existing = existsSync(logPath) ? readFileSync(logPath, "utf8") : "";
  const next = existing.endsWith("\n") ? `${existing}${line}` : `${existing}\n${line}`;
  writeFileSync(logPath, next, "utf8");
}

async function main() {
  const config = readJson(configPath, {
    enabled: true,
    commitsPerRun: 1,
    minDelayMs: 0,
    maxDelayMs: 0,
    maxEntries: 100,
    phrases: ["meaningless maintenance"]
  });

  if (!config.enabled) {
    console.log("Generator disabled in config/commit-config.json");
    return;
  }

  syncWithOrigin();

  const commitsPerRun = Math.max(1, Number(config.commitsPerRun) || 1);
  const minDelayMs = Math.max(0, Number(config.minDelayMs) || 0);
  const maxDelayMs = Math.max(minDelayMs, Number(config.maxDelayMs) || 0);
  const maxEntries = Math.max(1, Number(config.maxEntries) || 100);

  const existingFeed = readJson(feedPath, { generatedAt: null, items: [] });
  const items = Array.isArray(existingFeed.items) ? existingFeed.items : [];

  for (let i = 0; i < commitsPerRun; i += 1) {
    const phrase = pickOne(config.phrases);
    const seed = Math.random().toString(36).slice(2, 8);
    const commitMessage = `${phrase} (${seed})`;

    appendLogLine(commitMessage);
    git("add data/meaningless-log.txt");
    git("add public/commits.json");

    const status = git("status --porcelain").trim();
    if (!status) {
      console.log("No file changes detected; skipping commit.");
      continue;
    }

    git(`commit -m "${commitMessage.replaceAll('"', '\\"')}"`, { stdio: "inherit" });

    items.unshift({
      timestamp: new Date().toISOString(),
      message: commitMessage
    });

    const delay = randInt(minDelayMs, maxDelayMs);
    if (delay > 0 && i < commitsPerRun - 1) {
      console.log(`Sleeping ${delay}ms before next commit.`);
      await sleep(delay);
    }
  }

  writeJson(feedPath, {
    generatedAt: new Date().toISOString(),
    items: items.slice(0, maxEntries)
  });

  git("add public/commits.json");
  const feedStatus = git("status --porcelain").trim();
  if (feedStatus) {
    git('commit -m "update generated commit feed"', { stdio: "inherit" });
  }

  if (!process.env.CI) {
    pushWithRetry();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
