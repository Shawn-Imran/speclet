#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "module";
import { initCommand } from "./commands/init.js";
import { constitutionCommand } from "./commands/constitution.js";
import { tasksCommand } from "./commands/tasks.js";
import { clarifyCommand } from "./commands/clarify.js";
import { analyzeCommand } from "./commands/analyze.js";
import { implementCommand } from "./commands/implement.js";
import { updateCommand } from "./commands/update.js";
import { gitignoreCommand } from "./commands/gitignore.js";
import { mapCommand } from "./commands/map.js";
import { learnCommand } from "./commands/learn.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const program = new Command();

program
  .name("speclet")
  .description("Minimal spec-driven development CLI")
  .version(version);

program
  .command("init")
  .description("Initialize speclet in a project")
  .argument("[plan]", "Optional: Path to a plan .md file or a folder of .md files")
  .option("-a, --agent <agent>", "AI agent: all (default), claude, copilot, cursor, vibe, commandcode, antigravity", "all")
  .action(initCommand);

program
  .command("map")
  .description("Scan an existing codebase and generate context.md + architecture.md")
  .action(mapCommand);

program
  .command("constitution")
  .description("Scaffold and fill in project ground rules")
  .action(constitutionCommand);

program
  .command("tasks")
  .description("Generate tasks from plan phases")
  .option("-p, --phase <phase>", "Generate tasks for a specific phase only")
  .action(tasksCommand);

program
  .command("clarify")
  .description("Generate clarifying questions about the plan or a phase")
  .option("-p, --phase <phase>", "Clarify a specific phase")
  .action(clarifyCommand);

program
  .command("analyze")
  .description("Analyze tasks for conflicts or gaps, then update task files and implement fixes")
  .argument("[request]", "What to do after analysis (e.g., 'fix the found issues')")
  .option("-p, --phase <phase>", "Analyze a specific phase only")
  .action(analyzeCommand);

program
  .command("implement")
  .description("Generate implementation instructions for a phase")
  .argument("<phase>", "Phase name or number (e.g. 1 or 'Phase 1')")
  .action(implementCommand);

program
  .command("gitignore")
  .description("Generate or update .gitignore based on your stack in context.md")
  .option("-f, --force", "Overwrite existing .gitignore instead of merging")
  .option("-d, --dry", "Preview what would be written without making changes")
  .action(gitignoreCommand);

program
  .command("learn")
  .description("Review auto-captured rules and merge them into the constitution")
  .action(learnCommand);

program
  .command("update")
  .description("Update speclet to the latest version")
  .action(updateCommand);

program.parse();
