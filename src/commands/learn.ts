import fs from "fs";
import chalk from "chalk";
import { ensureSpecletDir, specletPath, readSpecletFile, buildPreamble } from "../utils.js";

export async function learnCommand() {
  ensureSpecletDir();

  const learnedPath = specletPath("constitution.learned.md");

  if (!fs.existsSync(learnedPath)) {
    console.log(
      chalk.dim(
        `No .speclet/constitution.learned.md found.\n` +
        `Rules are captured automatically during implementation sessions.\n`
      )
    );
    process.exit(0);
  }

  const learnedContent = fs.readFileSync(learnedPath, "utf-8");
  const hasPending = learnedContent.includes("### ");

  if (!hasPending) {
    console.log(chalk.dim(`No pending learned rules to review.\n`));
    process.exit(0);
  }

  const constitutionContent = readSpecletFile("constitution.md");
  const preamble = buildPreamble();

  console.log(chalk.bold(`\n🧠 Learned Rules — Review & Merge\n`));
  console.log(
    chalk.dim(
      "New rules were captured during implementation.\n" +
      "Pass the following to your AI agent to review and decide which to keep.\n"
    )
  );

  console.log(
    [
      preamble,
      `<constitution>\n${constitutionContent}\n</constitution>`,
      `<constitution-learned>\n${learnedContent}\n</constitution-learned>`,
      `<instructions>\n${learnPrompt()}\n</instructions>`,
    ].join("\n\n")
  );

  console.log(
    chalk.dim(
      "\n─────────────────────────────────────────\n" +
      "After merging, the agent will update .speclet/constitution.md and\n" +
      "remove processed rules from .speclet/constitution.learned.md.\n"
    )
  );
}

function learnPrompt(): string {
  return `# Learn Prompt

You are reviewing auto-captured rules from recent implementation sessions and deciding which ones to permanently add to the project constitution.

## Instructions

1. Read the \`<constitution-learned>\` block — these are pending rules captured during implementation.
2. Read the \`<constitution>\` block — the current permanent ground rules.
3. Present each pending rule from \`<constitution-learned>\` to the developer one at a time.
   For each rule, ask: **Keep (merge into constitution), Skip (discard), or Defer (leave for later)?**
   Wait for the answer before moving to the next.

## Merge Rules

- **Keep**: Add the rule to the appropriate section of \`.speclet/constitution.md\`. If no section fits, add a new one.
- **Skip**: Remove the rule from \`.speclet/constitution.learned.md\`.
- **Defer**: Leave the rule in \`.speclet/constitution.learned.md\` unchanged.

## After Processing All Rules

1. Rewrite \`.speclet/constitution.md\` with all kept rules merged in.
2. Rewrite \`.speclet/constitution.learned.md\` with only deferred rules remaining (remove kept and skipped rules).
   If no rules remain, leave the file with its header and empty \`## Pending Rules\` section.
3. Report: how many rules were merged, skipped, and deferred.
`;
}
