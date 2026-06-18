import chalk from "chalk";
import { ensureSpecletDir, readSpecletFile, resolvePhase, buildPreamble, readPhaseIndex } from "../utils.js";

export async function analyzeCommand(request: string | undefined, opts: { phase?: string }) {
  ensureSpecletDir();

  const prompt = readSpecletFile("prompts", "analyze.md");
  const preamble = buildPreamble();
  const index = readSpecletFile("tasks", "index.md");

  if (opts.phase) {
    const entry = resolvePhase(opts.phase);
    const phaseContent = readSpecletFile("tasks", entry.file);

    console.log(chalk.bold(`\n🔎 Analyze: ${entry.heading}\n`));
    console.log(chalk.dim("Pass the following to your AI agent:\n"));
    const blocks = [
      preamble,
      `<task-index>\n${index}\n</task-index>`,
      `<phase name="${entry.heading}">\n${phaseContent}\n</phase>`,
      `<instructions>\n${prompt}\n</instructions>`,
    ];
    if (request) {
      blocks.push(`<follow-up>\n${request}\n</follow-up>`);
    }
    console.log(blocks.join("\n\n"));
  } else {
    const phases = readPhaseIndex();
    console.log(chalk.bold(`\n🔎 Analyze: all ${phases.length} phases\n`));
    console.log(
      chalk.yellow(`Tip: Use --phase <n> to analyze one phase at a time for lower token cost.\n`)
    );
    console.log(chalk.dim("Pass the following to your AI agent:\n"));
    const blocks = [
      preamble,
      `<task-index>\n${index}\n</task-index>`,
      `<instructions>\n${prompt}\n\nLoad each phase file one at a time as needed — do not load all at once.\n</instructions>`,
    ];
    if (request) {
      blocks.push(`<follow-up>\n${request}\n</follow-up>`);
    }
    console.log(blocks.join("\n\n"));
  }
}
