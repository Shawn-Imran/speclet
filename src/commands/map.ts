import fs from "fs";
import path from "path";
import chalk from "chalk";
import { specletPath, writeSpecletFile } from "../utils.js";

export async function mapCommand() {
  const cwd = process.cwd();
  const specletDir = specletPath();

  // Bootstrap .speclet/ if it doesn't exist yet
  const isNew = !fs.existsSync(specletDir);
  if (isNew) {
    fs.mkdirSync(specletPath("prompts"), { recursive: true });
    fs.mkdirSync(specletPath("plans"), { recursive: true });
    fs.mkdirSync(specletPath("tasks"), { recursive: true });
    console.log(
      chalk.green(`✔ Bootstrapped .speclet/`) +
      chalk.dim(` — the map prompt below will fill in all speclet files`)
    );
  } else {
    console.log(chalk.dim(`  .speclet/ already exists — map will regenerate all speclet files from the codebase`));
  }

  // Write the map prompt template so agents can reference it
  writeSpecletFile(mapPrompt(), "prompts", "map.md");

  // Build the project snapshot that goes into the prompt
  const snapshot = buildProjectSnapshot(cwd);

  console.log(chalk.bold(`\n🗺  Map: scan existing codebase\n`));
  console.log(
    chalk.dim("This will generate:\n") +
    chalk.dim("  .speclet/context.md        — stack, conventions, constraints\n") +
    chalk.dim("  .speclet/architecture.md   — module map, key files, data flow\n") +
    chalk.dim("  .speclet/constitution.md   — ground rules inferred from the code\n") +
    chalk.dim("  .speclet/plans/            — plan files for what was already built\n") +
    chalk.dim("  .speclet/tasks/            — task files with all past work marked [x] done\n")
  );
  console.log(chalk.dim("Pass the following to your AI agent:\n"));

  console.log([
    snapshot,
    `<instructions>\n${mapPrompt()}\n</instructions>`,
  ].join("\n\n"));
}

// ─── Project snapshot ─────────────────────────────────────────────────────────

function buildProjectSnapshot(cwd: string): string {
  const blocks: string[] = [];

  // Directory tree (2 levels deep, filtered)
  const tree = buildTree(cwd, 2);
  if (tree) blocks.push(`<project-tree>\n${tree}\n</project-tree>`);

  // Key config files
  const configs = [
    "package.json",
    "tsconfig.json",
    "pyproject.toml",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "Gemfile",
    "composer.json",
    "docker-compose.yml",
    "Dockerfile",
    ".eslintrc.js",
    ".eslintrc.json",
    "eslint.config.js",
    "eslint.config.ts",
    "jest.config.js",
    "jest.config.ts",
    "vitest.config.ts",
    "vite.config.ts",
    "next.config.js",
    "next.config.ts",
  ];

  const foundConfigs: string[] = [];
  for (const cfg of configs) {
    const full = path.join(cwd, cfg);
    if (fs.existsSync(full)) {
      try {
        const content = fs.readFileSync(full, "utf-8");
        // Truncate large files
        const truncated = content.length > 4000
          ? content.slice(0, 4000) + "\n...(truncated)"
          : content;
        foundConfigs.push(`<file name="${cfg}">\n${truncated}\n</file>`);
      } catch {
        // ignore unreadable files
      }
    }
  }
  if (foundConfigs.length > 0) {
    blocks.push(`<config-files>\n${foundConfigs.join("\n\n")}\n</config-files>`);
  }

  return blocks.join("\n\n");
}

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next", ".nuxt",
  "__pycache__", ".venv", "venv", "env", ".env", "target", "vendor",
  ".gradle", ".idea", ".vscode", "coverage", ".nyc_output",
]);

function buildTree(dir: string, depth: number, prefix = ""): string {
  if (depth < 0) return "";
  let result = "";
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return "";
  }

  const filtered = entries
    .filter((e) => !e.name.startsWith(".") || e.name === ".speclet")
    .filter((e) => !SKIP_DIRS.has(e.name))
    .sort((a, b) => {
      // Directories first
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];
    const isLast = i === filtered.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";

    result += `${prefix}${connector}${entry.name}${entry.isDirectory() ? "/" : ""}\n`;

    if (entry.isDirectory() && depth > 0) {
      result += buildTree(
        path.join(dir, entry.name),
        depth - 1,
        prefix + childPrefix
      );
    }
  }
  return result.trimEnd();
}

// ─── Templates ────────────────────────────────────────────────────────────────

function mapPrompt(): string {
  return `# Map Prompt

You are performing a **full retroactive speclet setup** of an existing codebase.
The goal is to produce every speclet file as if this project had been using speclet from the start —
with all past work already documented and marked done — so new features can be planned and
implemented on top of it immediately.

## Outputs you must produce

| File | What it is |
|---|---|
| \`.speclet/context.md\` | Real stack, module structure, conventions, constraints |
| \`.speclet/architecture.md\` | Module map, key files, data flow, integrations, tech debt |
| \`.speclet/constitution.md\` | Ground rules inferred from the codebase (lint, patterns, tests, DoD) |
| \`.speclet/plans/<name>.md\` | Plan file(s) describing what was built, grouped into phases |
| \`.speclet/tasks/index.md\` | Phase map — one entry per phase |
| \`.speclet/tasks/phase-N-<slug>.md\` | Task file per phase — all tasks marked \`[x]\` done |

---

## Step 1 — Deep scan the codebase

Use the project tree and config files already provided. Then go deeper:

- Read the top-level source directories (\`src/\`, \`lib/\`, \`app/\`, \`packages/\`, etc.)
- Read 2–4 representative source files **per layer or module** to understand patterns and naming
- Read any README, CHANGELOG, docs/, or ADR files at the project root
- Read CI config files (\`.github/workflows/\`, \`Jenkinsfile\`, \`.travis.yml\`, etc.)
- Read linting/formatting configs (\`.eslintrc\`, \`eslint.config.*\`, \`.prettierrc\`, \`pyproject.toml\` tool sections, etc.)
- Read test config and a sample of test files to understand coverage expectations
- Check git log if available: \`git log --oneline -20\` gives a quick picture of what was built when

---

## Step 2 — Write \`.speclet/context.md\`

Overwrite \`.speclet/context.md\` with a factual, concise description:

\`\`\`markdown
# Project Context

## Stack
- Language: <language and version>
- Framework: <framework and version>
- Database: <database and ORM/driver, if any>
- Package manager: <npm/pnpm/yarn/pip/cargo/etc>
- Deployment: <where/how it runs>

## Module Structure
<Describe each top-level directory and what it contains>

## Conventions
- <naming convention: kebab-case files, PascalCase classes, etc.>
- <layering pattern: controllers → services → repositories, etc.>
- <state/data management approach>
- <any other consistently-observed conventions>

## Test Setup
- Framework: <jest/vitest/pytest/go test/etc>
- Test location: <co-located __tests__/ or top-level test/>
- Run command: <npm test / pytest / cargo test / etc>

## Constraints
- <technology or pattern that must NOT be changed or introduced>
- <any known hard rules already in place>
\`\`\`

---

## Step 3 — Write \`.speclet/architecture.md\`

\`\`\`markdown
# Architecture Map

> Auto-generated by speclet map. Update when the architecture changes.

## Directory Structure
\`\`\`
<key directories and purpose, 3 levels deep>
\`\`\`

## Modules / Packages
| Module | Path | Responsibility |
|---|---|---|

## Key Files
| File | Purpose |
|---|---|

## Data Flow
<How a typical request/operation flows through the system — entry point → layers → persistence>

## External Integrations
| Integration | Type | Env vars / connection details |
|---|---|---|

## Known Technical Debt
- <TODOs, FIXMEs, inconsistent patterns, outdated dependencies>
\`\`\`

---

## Step 4 — Write \`.speclet/constitution.md\`

**Infer** the constitution from the codebase — do NOT ask questions. Read the evidence and write rules.

\`\`\`markdown
# Project Constitution

> Inferred by speclet map from the existing codebase. Edit to correct or extend.

## Code Quality
<Infer from: .eslintrc / eslint.config.*, .prettierrc, tsconfig strict mode, linting scripts>
- <e.g. "ESLint with airbnb config — no-unused-vars, no-explicit-any enforced">
- <e.g. "Prettier with 2-space indent, single quotes, trailing commas">
- <e.g. "TypeScript strict mode — no implicit any">

## Architecture Principles
<Infer from: folder structure, import patterns, layering observed in source files>
- <e.g. "Feature-based modules — one folder per domain, no cross-domain imports">
- <e.g. "Controllers only orchestrate — business logic lives in services">
- <e.g. "All DB access goes through the repository layer">

## Testing Requirements
<Infer from: jest.config / vitest.config, coverage config, sample test files>
- <e.g. "Jest with ts-jest — unit tests co-located in __tests__/">
- <e.g. "Coverage threshold: 80% lines enforced in CI">
- <e.g. "Integration tests in test/integration/ — run separately from unit tests">

## What To Avoid
<Infer from: lint rules that ban things, patterns explicitly absent from the codebase, README warnings>
- <e.g. "No any types — use unknown + type narrowing">
- <e.g. "No raw SQL — all queries via Prisma">
- <e.g. "No direct process.env access — use ConfigService">

## Definition of Done
<Infer from: CI pipeline steps, PR templates, CONTRIBUTING.md>
A task is done when:
- <e.g. "All unit tests pass (npm test)">
- <e.g. "No lint errors (npm run lint)">
- <e.g. "TypeScript compiles without errors">
- <e.g. "Code reviewed and merged to main">
\`\`\`

Remove the \`<!-- speclet:unfilled -->\` marker — this constitution is filled.

---

## Step 5 — Group the existing work into phases

Analyze the codebase and divide all existing implemented work into **logical phases** — the same phases that would have been planned before building.

**Grouping rules:**
- Each phase = one coherent increment of work (e.g., "Project Setup", "Auth", "User Management", "Payment Integration")
- Keep phases focused — 5–10 tasks each is ideal
- Order phases chronologically (how they would have been built)
- Name each phase: "Phase N: <Short Name>" — use the same format as a speclet plan

A typical phasing for a web app:
1. Project Setup (scaffolding, CI, linting, config)
2. Database & Models (schema, migrations, seed data)
3. Authentication (register, login, JWT, sessions)
4. Core Domain features (the main business logic modules)
5. API Layer (routes, controllers, DTOs, validation)
6. Frontend / Client (if applicable)
7. Testing & Quality (if tests were added in a dedicated pass)
8. Deployment & Infrastructure

Adjust to match what is actually present in this project.

---

## Step 6 — Write \`.speclet/plans/<filename>.md\`

Write one plan file (or a few if the project is large) to \`.speclet/plans/\`.
Filename: \`01-existing.md\` (or split by domain: \`01-backend.md\`, \`02-frontend.md\`).

Format — use \`##\` headings, one per phase:

\`\`\`markdown
# Existing Implementation

> Documented by speclet map. All phases below are already implemented.

## Phase 1: Project Setup
<2–4 sentence description of what was set up: scaffolding, tooling, CI, environment config>

## Phase 2: <Name>
<Description of what was implemented in this phase>

## Phase 3: <Name>
<Description>

...
\`\`\`

---

## Step 7 — Write \`.speclet/tasks/index.md\`

\`\`\`markdown
# Task Index

> Auto-generated by speclet map. All phases below are already implemented.

## Phases

- **Phase 1: Project Setup** → \`tasks/phase-1-project-setup.md\` _(source: plans/01-existing.md)_
- **Phase 2: <Name>** → \`tasks/phase-2-<slug>.md\` _(source: plans/01-existing.md)_
...
\`\`\`

Use slugified phase names for file paths (lowercase, hyphens, no special chars, strip "Phase N:" prefix).

---

## Step 8 — Write task files — all marked \`[x]\` done

For each phase, write \`.speclet/tasks/phase-N-<slug>.md\`.

**Format:**

\`\`\`markdown
Status: Complete
Completed: <inferred or approximate date>

## Phase N: <Name>

> Documented by speclet map. All tasks below were already implemented before speclet was added.

- [x] **<Task title>** — <what was done and what the result is>
- [x] **<Task title>** — <what was done>
...
\`\`\`

**Rules for writing tasks:**
- Each task = one concrete unit of work that was actually done (a file created, a feature built, a config set up)
- Be specific: include file names, command names, or feature names where possible
- Order tasks in the sequence they would have been done
- Aim for 5–10 tasks per phase — not too granular, not too coarse
- Every task must be \`[x]\` — nothing is pending

---

## Step 9 — Report

After writing all files, print a summary:

\`\`\`
## speclet map complete

### What was generated
- .speclet/context.md       ✔
- .speclet/architecture.md  ✔
- .speclet/constitution.md  ✔  (<N> rules inferred)
- .speclet/plans/           ✔  (<N> plan file(s))
- .speclet/tasks/index.md   ✔  (<N> phases)
- .speclet/tasks/phase-*.md ✔  (<total> tasks, all marked done)

### Stack detected
<language> / <framework> / <database>

### Phases mapped
1. Phase 1: <Name> — <N> tasks
2. Phase 2: <Name> — <N> tasks
...

### Low-confidence areas
<Anything you couldn't determine for certain — flag it so the developer can review>

### Next steps
1. Review and edit .speclet/context.md and .speclet/constitution.md for accuracy
2. Run \`speclet constitution\` (or /speclet.constitution) if you want to refine the ground rules interactively
3. Write new feature plans in \`plans/\` (e.g., \`plans/02-new-feature.md\`)
4. Run \`speclet init ./plans\` to register the new plans
5. Use \`/speclet.tasks\` and \`/speclet.implement\` to build the new features
\`\`\`
`;
}





