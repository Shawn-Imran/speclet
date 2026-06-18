import fs from "fs";
import path from "path";
import chalk from "chalk";
import {
  ensureSpecletDir,
  readSpecletFile,
  readPhaseIndex,
  resolvePhase,
  buildPreamble,
  specletPath,
} from "../utils.js";

export async function tasksCommand(opts: { phase?: string }) {
  ensureSpecletDir();

  const prompt = readSpecletFile("prompts", "tasks.md");
  const preamble = buildPreamble();
  const index = readSpecletFile("tasks", "index.md");

  if (opts.phase) {
    const entry = resolvePhase(opts.phase);
    const phaseFileExists = fs.existsSync(specletPath("tasks", entry.file));

    // If task file already exists, include it so the agent can add to/revise it.
    // If not (first run), include the plan content instead so the agent has context.
    const phaseBlock = phaseFileExists
      ? `<phase name="${entry.heading}" file="${entry.file}">\n${readSpecletFile("tasks", entry.file)}\n</phase>`
      : planBlockForPhase(entry.heading, entry.sourceFile);

    console.log(chalk.bold(`\n📋 Tasks: ${entry.heading}\n`));
    console.log(chalk.dim("Pass the following to your AI agent:\n"));
    console.log([
      preamble,
      `<task-index>\n${index}\n</task-index>`,
      phaseBlock,
      `<instructions>\n${prompt}\n</instructions>`,
    ].join("\n\n"));
  } else {
    const phases = readPhaseIndex();
    console.log(chalk.bold(`\n📋 Tasks: all ${phases.length} phases\n`));
    console.log(
      chalk.dim(
        "Tip: Run one phase at a time for lower token cost:\n" +
        phases.map((_, i) => `  speclet tasks --phase ${i + 1}`).join("\n") +
        "\n\nOr pass the following to your agent to process phases one at a time:\n"
      )
    );

    // Include all plan files so the agent has the full picture
    const planBlocks = loadPlanBlocks();

    console.log([
      preamble,
      `<task-index>\n${index}\n</task-index>`,
      planBlocks,
      `<instructions>\n${prompt}\n\nProcess one phase at a time. For each phase, create the task file listed in the index.\n</instructions>`,
    ].join("\n\n"));
  }
}

function loadPlanBlocks(): string {
  const plansDir = specletPath("plans");
  if (!fs.existsSync(plansDir)) return "";
  return fs
    .readdirSync(plansDir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const content = fs.readFileSync(path.join(plansDir, f), "utf-8");
      return `<plan file="${f}">\n${content}\n</plan>`;
    })
    .join("\n\n");
}

function planBlockForPhase(heading: string, sourceFile?: string): string {
  if (!sourceFile) return `<plan-phase name="${heading}">\n(no plan content found)\n</plan-phase>`;

  const plansDir = specletPath("plans");
  const planFile = path.join(plansDir, path.basename(sourceFile));

  if (!fs.existsSync(planFile)) {
    // Fall back to reading from original path
    const origPath = path.resolve(process.cwd(), sourceFile);
    if (fs.existsSync(origPath)) {
      const content = fs.readFileSync(origPath, "utf-8");
      return `<plan file="${sourceFile}">\n${content}\n</plan>`;
    }
    return `<plan-phase name="${heading}">\n(source file not found: ${sourceFile})\n</plan-phase>`;
  }

  const content = fs.readFileSync(planFile, "utf-8");
  return `<plan file="${path.basename(sourceFile)}">\n${content}\n</plan>`;
}
