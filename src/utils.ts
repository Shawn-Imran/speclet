import fs from "fs";
import path from "path";

export const SPECLET_DIR = ".speclet";

export function specletPath(...segments: string[]): string {
  return path.join(process.cwd(), SPECLET_DIR, ...segments);
}

export function ensureSpecletDir() {
  const dir = specletPath();
  if (!fs.existsSync(dir)) {
    throw new Error(`No .speclet directory found. Run "speclet init <plan>" first.`);
  }
}

export function readSpecletFile(...segments: string[]): string {
  const p = specletPath(...segments);
  if (!fs.existsSync(p)) {
    throw new Error(`File not found: ${path.join(SPECLET_DIR, ...segments)}`);
  }
  return fs.readFileSync(p, "utf-8");
}

export function writeSpecletFile(content: string, ...segments: string[]) {
  const p = specletPath(...segments);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf-8");
}

export function fileExists(...segments: string[]): boolean {
  return fs.existsSync(specletPath(...segments));
}

/**
 * Read constitution.md if it exists, otherwise return null.
 * Used to optionally inject it into prompts.
 */
export function readConstitution(): string | null {
  const p = specletPath("constitution.md");
  if (!fs.existsSync(p)) return null;
  const content = fs.readFileSync(p, "utf-8");
  // Only return it if it has been filled in (not just the placeholder template)
  if (content.includes("<!-- speclet:unfilled -->")) return null;
  return content;
}

/**
 * Read constitution.learned.md if it has pending rules.
 * Returns null if the file is missing or has no captured rules yet.
 */
export function readLearnedConstitution(): string | null {
  const p = specletPath("constitution.learned.md");
  if (!fs.existsSync(p)) return null;
  const content = fs.readFileSync(p, "utf-8");
  // Only inject if there are actual rule entries (lines starting with ###)
  if (!content.includes("### ")) return null;
  return content;
}

/**
 * Build the standard preamble block for agent prompts.
 * Includes context, constitution (if present), and learned rules (if any).
 */
export function buildPreamble(): string {
  const context = readSpecletFile("context.md");
  const constitution = readConstitution();
  const learned = readLearnedConstitution();
  const blocks: string[] = [`<context>\n${context}\n</context>`];
  if (constitution) {
    blocks.push(`<constitution>\n${constitution}\n</constitution>`);
  }
  if (learned) {
    blocks.push(`<constitution-learned>\n${learned}\n</constitution-learned>`);
  }
  return blocks.join("\n\n");
}

/**
 * Parse ## headings from a markdown file and return
 * an array of { heading, content, sourceFile } objects.
 */
export function parsePhases(
  markdown: string,
  sourceFile?: string
): Array<{ heading: string; content: string; sourceFile?: string }> {
  const lines = markdown.split("\n");
  const phases: Array<{ heading: string; content: string; sourceFile?: string }> = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) {
        phases.push({
          heading: current.heading,
          content: current.lines.join("\n").trim(),
          sourceFile,
        });
      }
      current = { heading: line.replace("## ", "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    phases.push({
      heading: current.heading,
      content: current.lines.join("\n").trim(),
      sourceFile,
    });
  }

  return phases;
}

/**
 * Collect and parse all plan files from a path.
 * Accepts either a single .md file or a folder of .md files.
 * Returns phases in order, with sourceFile tracking.
 */
export function loadPlanFiles(
  inputPath: string
): Array<{ heading: string; content: string; sourceFile: string }> {
  const resolved = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Path not found: ${inputPath}`);
  }

  const stat = fs.statSync(resolved);
  let files: string[] = [];

  if (stat.isDirectory()) {
    files = fs
      .readdirSync(resolved)
      .filter((f) => f.endsWith(".md"))
      .sort() // alphabetical order — users can prefix files with 01-, 02- to control order
      .map((f) => path.join(resolved, f));

    if (files.length === 0) {
      throw new Error(`No .md files found in folder: ${inputPath}`);
    }
  } else if (stat.isFile()) {
    files = [resolved];
  } else {
    throw new Error(`Not a file or directory: ${inputPath}`);
  }

  const allPhases: Array<{ heading: string; content: string; sourceFile: string }> = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const relFile = path.relative(process.cwd(), file);
    const phases = parsePhases(content, relFile);
    for (const p of phases) {
      allPhases.push({ ...p, sourceFile: relFile });
    }
  }

  return allPhases;
}

/**
 * Slugify a phase heading for use as a filename.
 * "Phase 1: Setup" -> "setup"  (strips the "Phase N:" prefix)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/^phase\s*\d+[:\s]*/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Read index.md and return all phase entries.
 */
export function readPhaseIndex(): Array<{ heading: string; file: string; sourceFile?: string }> {
  const index = readSpecletFile("tasks", "index.md");
  const entries: Array<{ heading: string; file: string; sourceFile?: string }> = [];
  for (const line of index.split("\n")) {
    // Format: - **Heading** → `tasks/phase-N-slug.md` _(source: plans/foo.md)_
    const match = line.match(/^- \*\*(.+?)\*\*\s*→\s*`(.+?)`(?:\s*_\(source: (.+?)\)_)?/);
    if (match) {
      const filePath = match[2].replace(/^tasks\//, "");
      entries.push({
        heading: match[1],
        file: filePath,
        sourceFile: match[3],
      });
    }
  }
  return entries;
}

/**
 * Resolve a phase argument (number or name) to its index entry.
 */
export function resolvePhase(phaseArg: string): { heading: string; file: string; sourceFile?: string } {
  const entries = readPhaseIndex();

  const num = parseInt(phaseArg, 10);
  if (!isNaN(num) && entries[num - 1]) return entries[num - 1];

  const match = entries.find(
    (e) =>
      e.heading.toLowerCase().includes(phaseArg.toLowerCase()) ||
      e.file.includes(slugify(phaseArg))
  );
  if (match) return match;

  throw new Error(
    `Phase "${phaseArg}" not found. Available:\n` +
    entries.map((e, i) => `  ${i + 1}. ${e.heading}`).join("\n")
  );
}
