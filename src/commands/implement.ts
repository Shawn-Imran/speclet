import chalk from "chalk";
import { ensureSpecletDir, readSpecletFile, resolvePhase, buildPreamble } from "../utils.js";

export async function implementCommand(phaseArg: string) {
  ensureSpecletDir();

  const entry = resolvePhase(phaseArg);
  const prompt = readSpecletFile("prompts", "implement.md");
  const preamble = buildPreamble();
  const index = readSpecletFile("tasks", "index.md");
  const phaseContent = readSpecletFile("tasks", entry.file);

  console.log(chalk.bold(`\n🚀 Implement: ${entry.heading}\n`));
  console.log(chalk.dim("Pass the following to your AI agent:\n"));
  console.log([
    preamble,
    `<task-index>\n${index}\n</task-index>`,
    `<phase name="${entry.heading}" file="${entry.file}">\n${phaseContent}\n</phase>`,
    `<instructions>\n${prompt}\n</instructions>`,
  ].join("\n\n"));
}
