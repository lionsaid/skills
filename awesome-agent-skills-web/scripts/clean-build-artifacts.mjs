import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

function removeDsStoreFiles(rootPath) {
  if (!existsSync(rootPath)) {
    return;
  }

  for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
    const entryPath = path.join(rootPath, entry.name);

    if (entry.name === "test-results") {
      continue;
    }

    if (entry.isDirectory()) {
      removeDsStoreFiles(entryPath);
      continue;
    }

    if (entry.name === ".DS_Store") {
      rmSync(entryPath, { force: true });
    }
  }
}

removeDsStoreFiles(projectRoot);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeBuildTarget(targetPath) {
  const attempts = 6;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      rmSync(targetPath, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      });
      return;
    } catch (error) {
      if (
        attempt === attempts ||
        !(error instanceof Error) ||
        !("code" in error) ||
        (error.code !== "ENOTEMPTY" && error.code !== "EBUSY" && error.code !== "EPERM")
      ) {
        throw error;
      }

      await sleep(250 * attempt);
    }
  }
}

await Promise.all([".next", "out"].map((target) => removeBuildTarget(path.join(projectRoot, target))));
