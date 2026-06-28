import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

for (const target of [".next", "out"]) {
  rmSync(path.join(projectRoot, target), {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
}
