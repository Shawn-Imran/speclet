import chalk from "chalk";
import { ensureSpecletDir, readSpecletFile, resolvePhase, buildPreamble, specletPath } from "../utils.js";
import fs from "fs";
import path from "path";

export async function clarifyCommand(opts: { phase?: string }) {
  ensureSpecletDir();

  const prompt = readSpecletFile("prompts", "clarify.md");
  const preamble = buildPreamble();

  if (opts.phase) {
    const entry = resolvePhase(opts.phase);
    const phaseContent = readSpecletFile("tasks", entry.file);

    console.log(chalk.bold(`\n🔍 Clarify: ${entry.heading}\n`));
    console.log(chalk.dim("Pass the following to your AI agent:\n"));
    console.log([
      preamble,
      `<phase name="${entry.heading}">\n${phaseContent}\n</phase>`,
      `<instructions>\n${prompt}\n</instructions>`,
    ].join("\n\n"));
  } else {
    // Load all plan files from .speclet/plans/
    const plansDir = specletPath("plans");
    const planFiles = fs.existsSync(plansDir)
      ? fs.readdirSync(plansDir).filter((f) => f.endsWith(".md")).sort()
      : [];

    const planBlocks = planFiles.map((f) => {
      const content = fs.readFileSync(path.join(plansDir, f), "utf-8");
      return `<plan file="${f}">\n${content}\n</plan>`;
    }).join("\n\n");

    console.log(chalk.bold(`\n🔍 Clarify: full plan\n`));
    console.log(chalk.dim("Pass the following to your AI agent:\n"));
    console.log([
      preamble,
      planBlocks || `<plan>\n${readSpecletFile("plans", "plan.md")}\n</plan>`,
      `<instructions>\n${prompt}\n</instructions>`,
    ].join("\n\n"));
  }
}
