import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

const FORBIDDEN_RULES = [
  {
    regex: /court-admissible/i,
    message: 'Forbidden claim: "court-admissible". Use "draft for officer review pending legal confirmation" per Master Prompt Part 1.',
  },
  {
    regex: /detection in ~5 days at foundation stage/i,
    message: 'Forbidden claim: "detection in ~5 days at foundation stage". Detection is possible new construction flagged for human verification.',
  },
  {
    regex: /certified FMB boundary drawings/i,
    message: 'Forbidden claim: "certified FMB boundary drawings". FMB sketches are indicative until certified measurements exist.',
  },
  {
    regex: /automated penalties/i,
    message: 'Forbidden claim: "automated penalties". Statutory enforcement requires due process under Act III of 1905.',
  },
];

let errorsFound = 0;

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'assets') {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile() && /\.(jsx?|tsx?|html)$/.test(entry.name)) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    for (const rule of FORBIDDEN_RULES) {
      if (rule.regex.test(line)) {
        console.error(`[FORBIDDEN STRING VIOLATION] ${filePath}:${index + 1}`);
        console.error(`  > ${line.trim()}`);
        console.error(`  Reason: ${rule.message}\n`);
        errorsFound++;
      }
    }
  });
}

console.log(`Scanning ${SRC_DIR} for Master Prompt forbidden strings...`);
scanDirectory(SRC_DIR);

if (errorsFound > 0) {
  console.error(`❌ FAILED: Found ${errorsFound} forbidden string violation(s).`);
  process.exit(1);
} else {
  console.log(`✅ PASSED: No forbidden marketing or legal claims found in frontend source.`);
  process.exit(0);
}
