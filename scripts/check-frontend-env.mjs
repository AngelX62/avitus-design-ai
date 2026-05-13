import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();

const envFiles = readdirSync(cwd, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /^\.env(?:\.|$)/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

const forbiddenKeyPatterns = [
  { pattern: /OPENAI/i, reason: "OpenAI keys must stay server-side." },
  { pattern: /SERVICE[_-]?ROLE/i, reason: "Service-role keys must stay server-side." },
  { pattern: /SB[_-]?SECRET/i, reason: "Supabase secret keys must stay server-side." },
  { pattern: /SECRET[_-]?KEY/i, reason: "Secret keys must not be exposed to the frontend." },
  { pattern: /SUPABASE.*SECRET/i, reason: "Supabase secrets must stay server-side." },
];

const forbiddenValuePatterns = [
  { pattern: /sb_secret_/i, reason: "Supabase secret key value detected." },
  { pattern: /service[_-]?role/i, reason: "Service-role-like value detected." },
];

const violations = [];

for (const file of envFiles) {
  const content = readFileSync(join(cwd, file), "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!match) return;

    const [, key, rawValue] = match;

    for (const check of forbiddenKeyPatterns) {
      if (check.pattern.test(key)) {
        violations.push({
          file,
          line: index + 1,
          key,
          reason: check.reason,
        });
      }
    }

    for (const check of forbiddenValuePatterns) {
      if (check.pattern.test(rawValue)) {
        violations.push({
          file,
          line: index + 1,
          key,
          reason: check.reason,
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error("Frontend env safety check failed:");
  for (const issue of violations) {
    console.error(`- ${issue.file}:${issue.line} ${issue.key} — ${issue.reason}`);
  }
  console.error("Move server secrets to Supabase Edge Function secrets or trusted backend env.");
  process.exit(1);
}

console.log(`Frontend env safety check passed (${envFiles.length} env file${envFiles.length === 1 ? "" : "s"} scanned).`);
