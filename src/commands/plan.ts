import chalk from "chalk";
import { ensureSpecletDir, specletPath, readSpecletFile, buildPreamble } from "../utils.js";

export async function planCommand(opts: { path: string }) {
  ensureSpecletDir();

  const outputPath = opts.path || "plans";

  console.log(chalk.bold(`\n📋 Plan — create feature plan files\n`));
  console.log(
    chalk.dim(
      `Pass the following to your AI agent. It will interview you and\n` +
      `write plan files to ${chalk.cyan(outputPath + "/")}.\n`
    )
  );

  const preamble = buildPreamble();
  const prompt = planPrompt(outputPath);

  console.log([preamble, prompt].join("\n\n"));
}

function planPrompt(outputDir: string): string {
  return `<instructions>
# Plan Prompt

You are helping define a feature plan for this project before development begins.

## Goal

Write one or more markdown plan files to \`${outputDir}/\` that describe what to build, broken into phases using \`##\` headings.

## Instructions

1. Read \`.speclet/context.md\` and \`.speclet/constitution.md\` (if present and filled in) to understand the project.
2. If \`.speclet/architecture.md\` exists, read it to understand existing modules and boundaries.
3. If \`.speclet/plans/\` already contains plan files, read them to understand what already exists.
4. Ask the developer **one question at a time** and wait for answers:

### Phase 1 — Project scope
- **What are you building?** A brief one-liner of the overall feature or project.
- Use this to title the plan file.

### Phase 2 — Break into phases
- **What does "done" look like?** The end state after the feature is fully built.
- Then suggest phases — the logical increments to get from nothing to done.
- For each phase, ask:
  - **Phase name and title** — one line summary
  - **Key deliverables** — what gets built in this phase (2–4 sentence description)
- Recommended: 3–8 phases. Each phase should be one meaningful increment.
- Do NOT generate tasks here — tasks come later via \`speclet tasks\`.

### Phase 3 — Dependencies and order
- **Are any phases dependent on others?** Confirm the ordering.
- **Are any phases optional or can be deferred?** Mark them clearly.

### Phase 4 — File structure
- **Where should new code live?** (e.g., \`src/features/x/\`, \`packages/y/\`)
- **Do existing modules need changes?** If yes, note which ones.

## Output

After collecting all answers, write the plan file(s) to \`${outputDir}/\`. Format:

\`\`\`markdown
# <Feature Name>

> Plan created interactively via speclet plan.

## Phase 1: <Name>
<2–4 sentence description of what gets built in this phase>

## Phase 2: <Name>
<Description>

...
\`\`\`

### File naming
- Use numbered prefixes for ordering: \`01-backend.md\`, \`02-frontend.md\`
- Or a single file: \`01-<feature-slug>.md\`
- Lowercase, hyphens for spaces

### Rules
- Each phase = one \`##\` heading with a descriptive name
- 2–4 sentence description per phase — enough to understand the scope, not a full spec
- Phases must be ordered (what to build first, second, etc.)
- Keep descriptions high-level — your agent will break them into tasks later

## After writing

- List the files created
- Confirm the phase count
- Suggest next step: \`speclet init ./plans\` followed by \`speclet tasks\` to generate concrete tasks
</instructions>`;
}
