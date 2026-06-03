import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sourceUrl = 'https://xroadstudio.com/openapi.json';
const outputPath = new URL('../openapi.json', import.meta.url);
const outputFile = fileURLToPath(outputPath);

async function loadRawSchema() {
  if (process.env.OPENAPI_SOURCE_FILE) {
    return readFile(process.env.OPENAPI_SOURCE_FILE, 'utf8');
  }

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    try {
      return execFileSync('curl', ['-fsSL', sourceUrl], { encoding: 'utf8' });
    } catch {
      throw new Error(`Failed to fetch OpenAPI schema from ${sourceUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

const raw = await loadRawSchema();

function repairTrailingCommas(input) {
  return input.replace(/,\s*([}\]])/g, '$1');
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  parsed = JSON.parse(repairTrailingCommas(raw));
}

const formatted = `${JSON.stringify(parsed, null, 2)}\n`;
await writeFile(outputPath, formatted, 'utf8');

console.log(`Wrote ${outputFile} from ${sourceUrl}`);
