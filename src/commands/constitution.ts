import fs from "fs";
import chalk from "chalk";
import { ensureSpecletDir, specletPath, readSpecletFile, buildPreamble } from "../utils.js";

export async function constitutionCommand() {
  ensureSpecletDir();

  const constitutionPath = specletPath("constitution.md");
  const exists = fs.existsSync(constitutionPath);
  const isUnfilled = exists && fs.readFileSync(constitutionPath, "utf-8").includes("<!-- speclet:unfilled -->");

  if (!exists) {
    console.error(
      chalk.red(`✖ .speclet/constitution.md not found.\n`) +
      chalk.dim(`  Run "speclet init" first.`)
    );
    process.exit(1);
  }

  const constitutionContent = readSpecletFile("constitution.md");
  const prompt = readSpecletFile("prompts", "constitution.md");
  const preamble = buildPreamble(); // context only (constitution itself isn't injected here)

  if (isUnfilled) {
    console.log(chalk.bold(`\n📜 Constitution — first-time setup\n`));
    console.log(
      chalk.dim(
        "Your constitution.md hasn't been filled in yet.\n" +
        "Pass the following to your AI agent — it will ask you questions\n" +
        "and then write the answers into .speclet/constitution.md.\n"
      )
    );
  } else {
    console.log(chalk.bold(`\n📜 Constitution — update\n`));
    console.log(
      chalk.dim(
        "Pass the following to your AI agent to review or update your constitution.\n"
      )
    );
  }

  console.log(
    [
      preamble,
      `<constitution>\n${constitutionContent}\n</constitution>`,
      `<instructions>\n${prompt}\n</instructions>`,
    ].join("\n\n")
  );

  console.log(
    chalk.dim(
      "\n─────────────────────────────────────────\n" +
      "After the agent fills it in, it will save .speclet/constitution.md.\n" +
      "Once saved, it will be injected into all future speclet prompts.\n"
    )
  );
}
