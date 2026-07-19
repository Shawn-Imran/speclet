# speclet

**Spec-driven development CLI.** Write your plan in markdown, speclet turns it into structured AI agent workflows — native slash commands in GitHub Copilot Chat, Claude Code, Cursor, and Mistral Vibe, with no copy-paste required.

---

## Table of Contents

1. [How it works](#how-it-works)
2. [Install](#install)
3. [Step-by-step guide](#step-by-step-guide)
   - [Step 1 — Write your plan](#step-1--write-your-plan)
   - [Step 2 — Initialize speclet](#step-2--initialize-speclet)
   - [Step 3 — Fill in context.md](#step-3--fill-in-contextmd)
   - [Step 4 — Set project ground rules](#step-4--set-project-ground-rules)
   - [Step 5 — Generate a .gitignore](#step-5--generate-a-gitignore)
   - [Step 6 — Clarify the plan (optional)](#step-6--clarify-the-plan-optional)
   - [Step 7 — Generate tasks](#step-7--generate-tasks)
   - [Step 8 — Analyze tasks (optional)](#step-8--analyze-tasks-optional)
   - [Step 9 — Implement](#step-9--implement)
   - [Step 10 — Review learned rules (optional)](#step-10--review-learned-rules-optional)
4. [Adding speclet to an existing project](#adding-speclet-to-an-existing-project)
5. [Using speclet in your AI agent](#using-speclet-in-your-ai-agent)
   - [GitHub Copilot Chat](#github-copilot-chat-vs-code)
   - [Claude Code](#claude-code)
   - [Cursor](#cursor)
   - [Mistral Vibe](#mistral-vibe)
   - [Command Code](#command-code)
   - [Antigravity CLI](#antigravity-cli)
6. [CLI reference](#cli-reference)
   - [speclet init](#speclet-init)
   - [speclet map](#speclet-map)
   - [speclet constitution](#speclet-constitution)
   - [speclet tasks](#speclet-tasks)
   - [speclet clarify](#speclet-clarify)
   - [speclet analyze](#speclet-analyze)
   - [speclet implement](#speclet-implement)
   - [speclet learn](#speclet-learn)
   - [speclet gitignore](#speclet-gitignore)
   - [speclet update](#speclet-update)
7. [.speclet directory structure](#speclet-directory-structure)
8. [Updating speclet](#updating-speclet)

---

## How it works

speclet reads your plan files and `.speclet/` context, then assembles structured prompts for your AI agent. The agent reads only what it needs, does the work, and writes results back to your task files.

```
new project (agent writes the plan):
    speclet init  →  /speclet-plan  →  .speclet/plans/*.md  →  /speclet-tasks  →  /speclet-implement 1

new project (you write the plan by hand):
    write plans/*.md  →  speclet init ./plans  →  /speclet-tasks  →  /speclet-implement 1

existing project:
    speclet map   →  context.md + architecture.md + constitution.md + plans/ + tasks/
                            ↓
                     review → /speclet-plan new features → normal workflow above
```

**speclet is the scaffolding and the prompt factory. The agent does the thinking and coding.**

- `context.md` and `constitution.md` are injected into every prompt automatically
- Agents load **one phase file at a time** — never the whole project at once
- Every command is a native slash command inside your agent — no copy-paste needed

---

## Install

```bash
npm install -g speclet
```

Verify:

```bash
speclet --version
```

> **Development install** (if you're working on speclet itself):
> ```bash
> git clone https://github.com/Shawn-Imran/speclet.git
> cd speclet
> npm install
> npm run build
> npm install -g .
> ```

---

## Step-by-step guide

### Step 1 — Write your plan

Create a `plans/` folder in your project. Write your feature plan as one or more markdown files, using `##` headings to define phases. Prefix filenames with numbers to control the order.

```
my-app/
└── plans/
    ├── 01-backend.md
    └── 02-frontend.md
```

**Example plan file:**

```markdown
# plans/01-backend.md

## Phase 1: Setup
Initialize Node project, install Express, configure dotenv and TypeScript.

## Phase 2: API
Build authentication endpoints (register, login, refresh).
Build user CRUD endpoints with role-based access.

## Phase 3: Database
Set up PostgreSQL with Prisma. Write migrations for user and session tables.
```

> **Rules for plans:**
> - Use `##` headings for phase boundaries — speclet parses these automatically
> - Each phase should be one meaningful increment of work
> - Keep descriptions high-level — your agent will break them into concrete tasks later

**Don't want to write plans by hand?** Run `speclet init` first, then use the `/speclet-plan` slash command. Your AI agent acts as a system architect / lead engineer — it proposes options with trade-offs, asks you to decide, and writes the plan files straight into `.speclet/plans/` (so you can skip `speclet init ./plans` and go straight to `/speclet-tasks`):

| Agent | Command |
|---|---|
| Copilot Chat | `/speclet.plan` |
| Claude Code | `/project:speclet-plan` |
| Mistral Vibe | `/speclet-plan` |
| Command Code | `/speclet-plan` |
| Antigravity CLI | `/speclet-plan` |

---

### Step 2 — Initialize speclet

Run `speclet init` from your project root:

```bash
cd my-app
speclet init ./plans                    # with plan files — scaffold for all agents (recommended)
speclet init ./plans/01-backend.md      # single plan file
speclet init ./plans --agent copilot    # Copilot only
speclet init ./plans --agent claude     # Claude Code only
speclet init ./plans --agent cursor     # Cursor only
speclet init ./plans --agent vibe       # Mistral Vibe only
speclet init ./plans --agent commandcode # Command Code only
speclet init ./plans --agent antigravity # Antigravity CLI only

speclet init                            # no plans yet — scaffold templates only
```

**With plans:** Creates the `.speclet/` directory, copies plans, writes the phase index, and scaffolds agent files. Once init is done you can go straight to task generation — no other steps are required before `/speclet-tasks`.

**Without plans** (no plans yet): Creates `.speclet/` with template files and agent scaffolding. From here you have two paths:

| Situation | What to do next |
|---|---|
| New project, no plan yet | Run `/speclet-plan` — agent interviews you and writes the plan files |
| Existing codebase | Run `/speclet-map` — agent scans the project and generates everything automatically |
| Have plans, want ground rules first | Run `/speclet-constitution` → then `/speclet-tasks` |
| Have plans, want to skip constitution for now | Go straight to `/speclet-tasks` — constitution is optional until you need it |

You don't have to follow the steps in strict order. `speclet init ./plans --agent claude` gets you to task generation in one command — constitution, clarify, and analyze are there when you want them, not gates you have to pass through.

This creates the following in your project:

```
.speclet/
├── context.md                ← edit with your stack (Step 3)
├── constitution.md           ← fill in with your agent (Step 4)
├── constitution.learned.md   ← auto-filled during implementation (Step 9–10)
├── plans/                    ← copies of your plan files (if provided)
├── tasks/
│   └── index.md              ← phase map (task files generated later in Step 7)
└── prompts/                  ← prompt templates used by each command

.github/                ← GitHub Copilot Chat integration
├── copilot-instructions.md
├── agents/             ← custom agents (appear in Copilot Chat dropdown)
│   ├── speclet.map.agent.md
│   ├── speclet.constitution.agent.md
│   ├── speclet.tasks.agent.md
│   ├── speclet.implement.agent.md
│   ├── speclet.clarify.agent.md
│   ├── speclet.analyze.agent.md
│   └── speclet.learn.agent.md
└── prompts/            ← slash command shortcuts → reference agent files
    ├── speclet.map.prompt.md
    ├── speclet.constitution.prompt.md
    ├── speclet.tasks.prompt.md
    ├── speclet.implement.prompt.md
    ├── speclet.clarify.prompt.md
    ├── speclet.analyze.prompt.md
    └── speclet.learn.prompt.md

.claude/
└── commands/           ← Claude Code slash commands (/project:speclet-*)
    ├── speclet-map.md
    ├── speclet-constitution.md
    ├── speclet-tasks.md
    ├── speclet-implement.md
    ├── speclet-clarify.md
    ├── speclet-analyze.md
    └── speclet-learn.md

.cursor/
└── rules/
    └── speclet.mdc        ← Cursor workflow rules

.vibe/
├── AGENTS.md           ← Always-on context for Vibe sessions
└── skills/             ← Vibe custom slash commands (/speclet-*)
    ├── speclet-map/
    │   └── SKILL.md
    ├── speclet-constitution/
    │   └── SKILL.md
    ├── speclet-tasks/
    │   └── SKILL.md
    ├── speclet-implement/
    │   └── SKILL.md
    ├── speclet-clarify/
    │   └── SKILL.md
    ├── speclet-analyze/
    │   └── SKILL.md
    └── speclet-learn/
        └── SKILL.md

.commandcode/
└── skills/             ← Command Code custom slash commands (/speclet-*)
    ├── speclet-map/
    │   └── SKILL.md
    ├── speclet-constitution/
    │   └── SKILL.md
    ├── speclet-clarify/
    │   └── SKILL.md
    ├── speclet-analyze/
    │   └── SKILL.md
    ├── speclet-tasks/
    │   └── SKILL.md
    ├── speclet-implement/
    │   └── SKILL.md
    └── speclet-learn/
        └── SKILL.md

.agents/
└── skills/             ← Antigravity CLI custom slash commands (/speclet-*)
    ├── speclet-map/
    │   └── SKILL.md
    ├── speclet-constitution/
    │   └── SKILL.md
    ├── speclet-clarify/
    │   └── SKILL.md
    ├── speclet-analyze/
    │   └── SKILL.md
    ├── speclet-tasks/
    │   └── SKILL.md
    ├── speclet-implement/
    │   └── SKILL.md
    └── speclet-learn/
        └── SKILL.md
```

> Task files (`.speclet/tasks/phase-N-*.md`) are **not** created here. Your agent creates them in Step 7.

---

### Step 3 — Fill in context.md

Open `.speclet/context.md` and describe your project's stack, conventions, and constraints. Keep it short — it is injected into **every** speclet prompt, so every agent action is grounded in your actual stack.

For existing projects, run `speclet map` first — your agent scans the codebase and fills this in automatically.

```markdown
# Project Context

## Stack
- Language: TypeScript
- Framework: NestJS 10
- Database: PostgreSQL 16 with Prisma 7
- Package manager: pnpm

## Conventions
- Feature-based module structure (one NestJS module per domain)
- Controllers are thin — business logic lives in services only
- DTOs with class-validator for all controller inputs

## Constraints
- No microservices — single NestJS process
- No raw SQL except where Prisma cannot handle it
- All secrets via ConfigService, never hardcoded
```

---

### Step 4 — Set project ground rules

The constitution defines non-negotiable principles for the project — architecture rules, testing requirements, quality standards, and definition of done. It is injected into every future prompt once filled in.

**In Copilot Chat:**
```
/speclet.constitution
```

**In Claude Code:**
```
/project:speclet-constitution
```

**In Mistral Vibe:**
```
/speclet-constitution
```

**In Command Code:**
```
/speclet-constitution
```

**In Antigravity CLI:**
```
/speclet-constitution
```

**CLI (copy-paste to any agent):**
```bash
speclet constitution
```

Your agent will interview you section by section:

| Section | What to define |
|---|---|
| Code Quality | ESLint rules, Prettier, max file length, no `any` types |
| Architecture Principles | Layered / hexagonal, module boundaries, forbidden patterns |
| Testing Requirements | Unit + integration, testing library, coverage threshold |
| What To Avoid | Banned libraries, security rules, anti-patterns |
| Definition of Done | Tests pass, PR reviewed, no lint errors, feature complete |

The agent writes your answers into `.speclet/constitution.md` and removes the `<!-- speclet:unfilled -->` marker. From that point on, the constitution is automatically included in every speclet prompt.

---

### Step 5 — Generate a .gitignore

speclet can auto-generate a `.gitignore` tailored to your stack by reading `.speclet/context.md`:

```bash
speclet gitignore          # creates or merges into an existing .gitignore
speclet gitignore --dry    # preview what would be written without touching the file
speclet gitignore --force  # overwrite instead of merging
```

Stack keywords in `context.md` are detected automatically (TypeScript, NestJS, Python, Django, Go, Rust, Docker, Terraform, etc.) and the appropriate patterns are added.

---

### Step 6 — Clarify the plan (optional but recommended)

Before generating tasks, have your agent ask clarifying questions to surface ambiguities and missing decisions. This prevents costly rework later.

**In Copilot Chat:**
```
/speclet.clarify           ← full plan
/speclet.clarify 2         ← phase 2 only
```

**In Claude Code:**
```
/project:speclet-clarify 2
```

**In Mistral Vibe:**
```
/speclet-clarify           ← full plan
/speclet-clarify 2         ← phase 2 only
```

**In Command Code:**
```
/speclet-clarify           ← full plan
/speclet-clarify 2         ← phase 2 only
```

**In Antigravity CLI:**
```
/speclet-clarify           ← full plan
/speclet-clarify 2         ← phase 2 only
```

**CLI:**
```bash
speclet clarify              # full plan
speclet clarify --phase 2    # specific phase
```

The agent scans for scope ambiguities, technical unknowns, missing edge cases, and unspecified non-functional requirements. It asks up to 5 targeted questions (one at a time, with recommendations) and updates the plan with your answers.

---

### Step 7 — Generate tasks

Have your agent break each phase into concrete, ordered tasks and write them to `.speclet/tasks/phase-N-*.md`.

**In Copilot Chat:**
```
/speclet.tasks             ← all phases
/speclet.tasks 1           ← phase 1 only (recommended — lower token cost)
```

**In Claude Code:**
```
/project:speclet-tasks 1
```

**In Mistral Vibe:**
```
/speclet-tasks             ← all phases
/speclet-tasks 1           ← phase 1 only
```

**In Command Code:**
```
/speclet-tasks             ← all phases
/speclet-tasks 1           ← phase 1 only
```

**In Antigravity CLI:**
```
/speclet-tasks             ← all phases
/speclet-tasks 1           ← phase 1 only
```

**CLI:**
```bash
speclet tasks --phase 1    # one phase at a time (recommended)
speclet tasks              # all phases at once
```

> **Tip:** Process one phase at a time to minimize token usage and get more focused, accurate output.

The agent creates a task file like `.speclet/tasks/phase-1-setup.md`:

```markdown
## Phase 1: Setup

- [ ] **Initialize project** — run `pnpm init`, configure TypeScript with strict mode in tsconfig.json
- [ ] **Install dependencies** — NestJS CLI, class-validator, class-transformer, @nestjs/config
- [ ] **Configure ESLint + Prettier** — add .eslintrc.js and .prettierrc, add lint-staged + husky
- [ ] **Set up environment** — create .env.example with all required keys, add ConfigModule to AppModule
```

---

### Step 8 — Analyze tasks (optional)

Before implementing, have your agent check all generated tasks for gaps, conflicts, and risks — then fix them automatically.

**In Copilot Chat:**
```
/speclet.analyze                         ← all phases
/speclet.analyze 1                       ← phase 1 only
/speclet.analyze "fix the found issues"  ← analyze, then fix
```

**In Claude Code:**
```
/speclet-analyze
/speclet-analyze "fix the found issues"
```

**In Mistral Vibe:**
```
/speclet-analyze                         ← all phases
/speclet-analyze 1                       ← phase 1 only
/speclet-analyze "fix the found issues"  ← analyze, then fix
```

**In Command Code:**
```
/speclet-analyze                         ← all phases
/speclet-analyze 1                       ← phase 1 only
/speclet-analyze "fix the found issues"  ← analyze, then fix
```

**In Antigravity CLI:**
```
/speclet-analyze                         ← all phases
/speclet-analyze 1                       ← phase 1 only
/speclet-analyze "fix the found issues"  ← analyze, then fix
```

**CLI:**
```bash
speclet analyze --phase 1
speclet analyze
speclet analyze "fix the found issues"
```

The agent runs analysis first, producing a structured report covering:

| Category | What it finds |
|---|---|
| **Conflicts** | Tasks that contradict each other or touch the same file in incompatible ways |
| **Gaps** | Features mentioned in the plan with no corresponding task |
| **Risks** | Vague tasks, missing file paths, unclear success criteria |
| **Constitution violations** | Anything conflicting with your ground rules — always marked CRITICAL |

After analysis, if a follow-up instruction was given (e.g., "fix the found issues"), the agent will:

1. **Update task/phase files first** — add, modify, or remove tasks to reflect needed changes, keeping `.speclet/tasks/` in sync as the source of truth
2. **Implement code changes** — make the actual code edits described by the updated tasks

---

### Step 9 — Implement

Have your agent work through a phase's tasks one by one, marking each `[x]` when complete.

**In Copilot Chat:**
```
/speclet.implement 1
/speclet.implement "Phase 2: API"
```

**In Claude Code:**
```
/project:speclet-implement 1
```

**In Mistral Vibe:**
```
/speclet-implement 1
/speclet-implement "Phase 2: API"
```

**In Command Code:**
```
/speclet-implement 1
/speclet-implement "Phase 2: API"
```

**In Antigravity CLI:**
```
/speclet-implement 1
/speclet-implement "Phase 2: API"
```

**CLI:**
```bash
speclet implement 1
speclet implement "Phase 2"
```

The agent will:

1. Read `context.md`, `constitution.md`, and `constitution.learned.md` (if present) to know your stack, rules, and any previously captured patterns
2. Load **only** the requested phase file — never other phases
3. Work through each `- [ ]` task in order
4. Mark each task `- [x]` immediately after completing it
5. When all tasks are done, add `Status: Complete` to the phase file and summarize what was built
6. If it corrected any bash commands or discovered patterns mid-task, it appends them to `.speclet/constitution.learned.md` and suggests running `speclet learn`

Repeat for each phase:

```
/speclet.implement 1  →  /speclet.implement 2  →  /speclet.implement 3
```

---

### Step 10 — Review learned rules (optional)

While implementing, the agent automatically captures corrections and patterns it discovers — things like a missing flag on a command, a wrong path assumption, or a project convention it had to figure out mid-task. These are written to `.speclet/constitution.learned.md` as pending rules.

Learned rules are injected into all future implement prompts automatically, so the agent stops repeating the same mistakes from phase to phase without you doing anything. But they are kept separate from `constitution.md` until you review them.

Once a phase (or a few phases) is done, run:

```bash
speclet learn
```

Or use the slash command:

| Agent | Command |
|---|---|
| Copilot Chat | `/speclet.learn` |
| Claude Code | `/project:speclet-learn` |
| Mistral Vibe | `/speclet-learn` |
| Command Code | `/speclet-learn` |
| Antigravity CLI | `/speclet-learn` |

Your agent presents each pending rule one at a time and asks: **Keep, Skip, or Defer?**

- **Keep** — merged permanently into `.speclet/constitution.md`
- **Skip** — discarded
- **Defer** — stays in `constitution.learned.md` for next time

**Example captured rules:**

```markdown
### [2026-06-16] bash: npm install
**Rule:** Always use --legacy-peer-deps with npm install in this project.
**Why:** npm install failed without it — peer dependency conflict with existing packages.

### [2026-06-16] bash: typescript compiler
**Rule:** Use `npx tsc` not `tsc` — TypeScript is a local dep only.
**Why:** `tsc` not in PATH, only available via npx.
```

After merging, these rules live in `constitution.md` and are automatically applied from the very start of every future implementation session.

---

## Adding speclet to an existing project

If you already have a working codebase and want to use speclet for **new features**, run `speclet map` first. It scans your project and auto-generates all the context files speclet needs — no manual editing.

```bash
cd my-existing-app
speclet map
```

The command prints a prompt with a project snapshot. Feed it to your AI agent and it will produce:

| File | What it contains |
|---|---|
| `.speclet/context.md` | Real stack, module structure, conventions, constraints |
| `.speclet/architecture.md` | Module map, key files, data flow, integrations, tech debt |
| `.speclet/constitution.md` | Ground rules **inferred** from lint configs, patterns, test setup, CI |
| `.speclet/plans/01-existing.md` | Plan file with `##` phases describing what was already built |
| `.speclet/tasks/index.md` | Phase map |
| `.speclet/tasks/phase-N-*.md` | Task file per phase — all past tasks marked `[x]` done |

The constitution is filled in automatically by reading the evidence — no questions asked. The plans and tasks document the existing work as if speclet had been used from the start, giving you a clean baseline to continue from.

### Existing project workflow

```
existing codebase  →  speclet map  →  .speclet/context.md        (real stack, auto-filled)
                                    .speclet/architecture.md   (module map)
                                    .speclet/constitution.md   (inferred from lint/patterns/CI)
                                    .speclet/plans/01-existing.md  (what was already built)
                                    .speclet/tasks/phase-N-*.md    (all [x] done)
                                              ↓
                                   review + edit any file the agent got wrong
                                              ↓
                                   speclet plan               → write plans for new features
                                              ↓
                                   speclet init ./plans/02-new-feature.md
                                              ↓
                                   normal speclet workflow (tasks → implement)
```

You can also use the slash command directly in your agent:

| Agent | Command |
|---|---|
| Copilot Chat | `/speclet.map` |
| Claude Code | `/project:speclet-map` |
| Mistral Vibe | `/speclet-map` |
| Command Code | `/speclet-map` |
| Antigravity CLI | `/speclet-map` |
| Cursor | "Map the existing codebase following the speclet workflow" |

---

## Using speclet in your AI agent

### GitHub Copilot Chat (VS Code)

After `speclet init`, open Copilot Chat. The speclet agents appear in the **agent dropdown** at the top of the chat panel. You can also trigger them with slash commands:

| Command | Description |
|---|---|
| `/speclet.plan` | Plan a new feature with an architect/lead-engineer agent — proposes options, you decide, writes phased plan files |
| `/speclet.map` | Full retroactive speclet setup — scans codebase, generates context, architecture, constitution, plans, and completed tasks |
| `/speclet.constitution` | Fill in or update the project constitution |
| `/speclet.tasks` | Generate tasks for all phases |
| `/speclet.tasks 1` | Generate tasks for phase 1 only |
| `/speclet.clarify` | Clarify the full plan |
| `/speclet.clarify 2` | Clarify phase 2 |
| `/speclet.analyze` | Analyze all tasks for gaps and conflicts, then fix |
| `/speclet.analyze 1` | Analyze phase 1, then fix |
| `/speclet.analyze "fix issues"` | Analyze, then update tasks and implement fixes |
| `/speclet.implement 1` | Implement phase 1 |
| `/speclet.implement "Phase 2"` | Implement by phase name |
| `/speclet.learn` | Review auto-captured rules and merge them into the constitution |

After each command, Copilot Chat shows **handoff buttons** to continue the workflow — e.g., after `/speclet.implement` you'll see "Review Learned Rules" if any new rules were captured.

**How the files work:**

| File | Purpose |
|---|---|
| `.github/agents/speclet.*.agent.md` | Full agent definitions — VS Code surfaces these in the dropdown |
| `.github/prompts/speclet.*.prompt.md` | 3-line wrappers: `agent: speclet.tasks` — links `/speclet.X` slash commands to agent files |
| `.github/copilot-instructions.md` | Always-on context block that Copilot reads in every session |

---

### Claude Code

After `speclet init`, type `/` in Claude Code to see all project commands:

| Command | Description |
|---|---|
| `/project:speclet-plan` | Plan a new feature with an architect/lead-engineer agent — proposes options, you decide, writes phased plan files |
| `/project:speclet-map` | Full retroactive speclet setup — scans codebase, generates context, architecture, constitution, plans, and completed tasks |
| `/project:speclet-constitution` | Fill in or update the project constitution |
| `/project:speclet-tasks` | Generate tasks for all phases |
| `/project:speclet-tasks 1` | Generate tasks for phase 1 |
| `/project:speclet-clarify` | Clarify the full plan |
| `/project:speclet-clarify 2` | Clarify a specific phase |
| `/project:speclet-analyze` | Analyze tasks for gaps and conflicts, then fix |
| `/project:speclet-analyze "fix issues"` | Analyze, then update tasks and implement fixes |
| `/project:speclet-implement 1` | Implement phase 1 |
| `/project:speclet-learn` | Review auto-captured rules and merge them into the constitution |

Anything you type after the command name is passed to the agent as `$ARGUMENTS` — so `/project:speclet-implement 2` tells the agent to implement phase 2.

Claude Code automatically registers `.claude/commands/speclet-*.md` as `/project:speclet-*` commands.

---

### Cursor

Cursor reads `.cursor/rules/speclet.mdc` and applies the speclet workflow rules whenever you work in the project. Use natural language in Cursor chat:

> "Generate tasks for Phase 1 following the speclet workflow"
> "Implement Phase 2 — follow context.md and the implement prompt"
> "Analyze phase-2-api.md for gaps and conflicts"

---

### Mistral Vibe

After `speclet init`, Vibe picks up the speclet workflow from two places:

- **`.vibe/AGENTS.md`** — always-on context injected into every Vibe session, pointing Vibe at the `.speclet/` files
- **`.vibe/skills/speclet-*/SKILL.md`** — custom slash commands registered in Vibe's autocompletion menu

Type `/` in Vibe to see all speclet commands:

| Command | Description |
|---|---|
| `/speclet-plan` | Plan a new feature with an architect/lead-engineer agent — proposes options, you decide, writes phased plan files |
| `/speclet-map` | Full retroactive speclet setup — scans codebase, generates context, architecture, constitution, plans, and completed tasks |
| `/speclet-constitution` | Fill in or update the project constitution |
| `/speclet-tasks` | Generate tasks for all phases |
| `/speclet-tasks 1` | Generate tasks for phase 1 |
| `/speclet-clarify` | Clarify the full plan |
| `/speclet-clarify 2` | Clarify a specific phase |
| `/speclet-analyze` | Analyze tasks for gaps and conflicts, then fix |
| `/speclet-analyze 1` | Analyze phase 1, then fix |
| `/speclet-analyze "fix issues"` | Analyze, then update tasks and implement fixes |
| `/speclet-implement 1` | Implement phase 1 |
| `/speclet-implement "Phase 2"` | Implement by phase name |
| `/speclet-learn` | Review auto-captured rules and merge them into the constitution |

Anything you type after the command name is passed to the agent as context — so `/speclet-implement 2` tells the agent to implement phase 2.

Vibe discovers skills from the `.vibe/skills/` directory automatically. Each skill directory contains a `SKILL.md` file that defines the command's behavior using the [Agent Skills](https://agentskills.io/specification) specification.

---

### Command Code

After `speclet init`, Command Code discovers the speclet workflow from the `.commandcode/skills/` directory. Each skill directory contains a `SKILL.md` file that registers as a custom slash command.

Type `/` in Command Code to see all speclet commands:

| Command | Description |
|---|---|
| `/speclet-plan` | Plan a new feature with an architect/lead-engineer agent — proposes options, you decide, writes phased plan files |
| `/speclet-map` | Full retroactive speclet setup — scans codebase, generates context, architecture, constitution, plans, and completed tasks |
| `/speclet-constitution` | Fill in or update the project constitution |
| `/speclet-tasks` | Generate tasks for all phases |
| `/speclet-tasks 1` | Generate tasks for phase 1 |
| `/speclet-clarify` | Clarify the full plan |
| `/speclet-clarify 2` | Clarify a specific phase |
| `/speclet-analyze` | Analyze tasks for gaps and conflicts, then fix |
| `/speclet-analyze 1` | Analyze phase 1, then fix |
| `/speclet-analyze "fix issues"` | Analyze, then update tasks and implement fixes |
| `/speclet-implement 1` | Implement phase 1 |
| `/speclet-implement "Phase 2"` | Implement by phase name |
| `/speclet-learn` | Review auto-captured rules and merge them into the constitution |

Anything you type after the command name is passed to the agent as context — so `/speclet-implement 2` tells the agent to implement phase 2.

---

### Antigravity CLI

After `speclet init`, the Antigravity CLI discovers the speclet workflow from the `.agents/skills/` directory. Each skill directory contains a `SKILL.md` file that registers as a custom slash command.

Type `/` in the Antigravity CLI to see all speclet commands:

| Command | Description |
|---|---|
| `/speclet-plan` | Plan a new feature with an architect/lead-engineer agent — proposes options, you decide, writes phased plan files |
| `/speclet-map` | Full retroactive speclet setup — scans codebase, generates context, architecture, constitution, plans, and completed tasks |
| `/speclet-constitution` | Fill in or update the project constitution |
| `/speclet-tasks` | Generate tasks for all phases |
| `/speclet-tasks 1` | Generate tasks for phase 1 |
| `/speclet-clarify` | Clarify the full plan |
| `/speclet-clarify 2` | Clarify a specific phase |
| `/speclet-analyze` | Analyze tasks for gaps and conflicts, then fix |
| `/speclet-analyze 1` | Analyze phase 1, then fix |
| `/speclet-analyze "fix issues"` | Analyze, then update tasks and implement fixes |
| `/speclet-implement 1` | Implement phase 1 |
| `/speclet-implement "Phase 2"` | Implement by phase name |
| `/speclet-learn` | Review auto-captured rules and merge them into the constitution |

Anything you type after the command name is passed to the agent as context — so `/speclet-implement 2` tells the agent to implement phase 2.

Skills follow the [Agent Skills](https://agentskills.io/specification) specification — the same format used by Mistral Vibe and Command Code.

---

## CLI reference

Every CLI command assembles a structured prompt and prints it to stdout. You paste it into your AI agent, or (for slash commands) the agent receives it automatically.

---

### speclet init

Initialize speclet in a project directory.

```
speclet init [plan] [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `plan` | Optional path to a single `.md` plan file or a folder of `.md` plan files |

**Options:**

| Flag | Short | Default | Description |
|---|---|---|---|
| `--agent <agent>` | `-a` | `all` | Which agent(s) to scaffold: `all`, `claude`, `copilot`, `cursor`, `vibe`, `commandcode`, `antigravity` |

**What it does:**

1. If `plan` is given, reads all `.md` files (sorted alphabetically — prefix with `01-`, `02-` to control order) and parses `##` headings as phase boundaries
2. Creates `.speclet/` with the following files:
   - `context.md` — blank template to fill in with your stack (kept if it already exists)
   - `constitution.md` — blank template with `<!-- speclet:unfilled -->` marker (kept if it already exists)
   - `plans/` — copies of your plan files (if `plan` was given)
   - `tasks/index.md` — phase map linking heading names to task file paths
   - `prompts/` — internal prompt templates (`clarify.md`, `analyze.md`, `tasks.md`, `implement.md`, `constitution.md`)
3. Scaffolds agent integration files based on `--agent`:
   - `all` scaffolds for every agent
   - `claude` → `.claude/commands/speclet-*.md` (7 commands including `/project:speclet-learn`)
   - `copilot` → `.github/copilot-instructions.md`, `.github/agents/`, `.github/prompts/`
   - `cursor` → `.cursor/rules/speclet.mdc`
   - `vibe` → `.vibe/AGENTS.md`, `.vibe/skills/` (7 skills including `/speclet-learn`)
   - `commandcode` → `.commandcode/skills/` (7 skills including `/speclet-learn`)
   - `antigravity` → `.agents/skills/` (8 skills including `/speclet-learn`)
4. If `.speclet/` already exists, re-initializes (warns and continues — existing `context.md`, `constitution.md`, and `constitution.learned.md` are preserved)

**Examples:**

```bash
# New project — all agents, plan folder
speclet init ./plans

# Single plan file, Claude Code only
speclet init ./plans/01-backend.md --agent claude

# No plans yet — scaffold templates only, then plan with your agent
speclet init
# then run /speclet-plan in your AI agent — it writes straight to .speclet/plans/
```

---

### speclet map

Scan an existing codebase and generate a prompt that tells your AI agent how to produce all speclet context files.

```
speclet map
```

**Arguments:** none

**Options:** none

**What it does:**

1. Bootstraps `.speclet/` (with `plans/`, `tasks/`, `prompts/` subdirectories) if it does not already exist
2. Writes `.speclet/prompts/map.md` — the detailed instructions the agent will follow
3. Builds a **project snapshot** — a directory tree (2 levels deep, ignoring `node_modules`, `.git`, `dist`, etc.) plus the content of key config files it finds (`package.json`, `tsconfig.json`, `Cargo.toml`, `Dockerfile`, ESLint/Jest/Vite configs, etc.)
4. Prints the snapshot followed by the map instructions — paste this into your AI agent

**Your agent will produce:**

| File | Content |
|---|---|
| `.speclet/context.md` | Real stack, module structure, conventions, test setup, constraints |
| `.speclet/architecture.md` | Module map, key files, data flow, external integrations, known tech debt |
| `.speclet/constitution.md` | Ground rules inferred from lint configs, folder structure, CI pipelines — `<!-- speclet:unfilled -->` removed |
| `.speclet/plans/01-existing.md` | Plan file grouping all existing work into `##` phases |
| `.speclet/tasks/index.md` | Phase map |
| `.speclet/tasks/phase-N-*.md` | One task file per phase — every task marked `[x]` done |

**Example:**

```bash
cd my-existing-app
speclet map
# Copy the printed output → paste into your AI agent
```

---

### speclet plan

> **Not a CLI command.** Planning is an **AI agent command only** — there is no `speclet plan` in the terminal. After `speclet init`, run `/speclet-plan` (Claude: `/project:speclet-plan`, Copilot: `/speclet.plan`) in your agent.
>
> The agent acts as a **system architect / lead engineer**: for each decision (architecture, tech choices, phase boundaries, ordering, scope) it proposes 2–4 options with trade-offs and a recommendation, then asks you to choose or offer your own — it never decides for you. It asks one question at a time and writes the phased plan files straight into `.speclet/plans/`, so you can go directly to `/speclet-tasks` afterward.

---

### speclet constitution

Print a prompt that guides your AI agent to fill in or update `.speclet/constitution.md`.

```
speclet constitution
```

**Arguments:** none

**Options:** none

**What it does:**

1. Requires `.speclet/` to exist and `constitution.md` to be present (run `speclet init` first)
2. Reads `constitution.md` and checks whether it still contains the `<!-- speclet:unfilled -->` marker
3. Builds the preamble from `context.md` (constitution itself is not injected here — it is what you're writing)
4. Prints the preamble, the current constitution content, and the interview prompt — paste into your AI agent

**First-time setup** (marker present): The agent asks you questions section by section and waits for your answers before moving on:

| Section | Questions asked |
|---|---|
| Code Quality | Coding standards, linting tools (ESLint, Prettier) |
| Architecture Principles | Architectural patterns, forbidden patterns |
| Testing Requirements | Coverage level, test types (unit/integration/e2e), testing libraries |
| What To Avoid | Banned libraries, security or compliance rules |
| Definition of Done | What "done" means, review process |

**Update mode** (marker absent): The agent reviews the existing constitution and asks whether any section needs updating.

After the session, the agent rewrites `.speclet/constitution.md` with the answers filled in and removes the `<!-- speclet:unfilled -->` marker. From that point on, the constitution is injected into every speclet prompt automatically.

**Example:**

```bash
speclet constitution
# Copy the output → paste into your AI agent
```

---

### speclet tasks

Print a prompt that guides your AI agent to generate tasks for one or all plan phases.

```
speclet tasks [options]
```

**Arguments:** none

**Options:**

| Flag | Short | Default | Description |
|---|---|---|---|
| `--phase <phase>` | `-p` | _(all phases)_ | Generate tasks for a specific phase only, by number (e.g. `1`) or by name (e.g. `"Phase 2: API"`) |

**What it does:**

- Requires `.speclet/` with `tasks/index.md` (run `speclet init` first)
- Builds the preamble from `context.md` and `constitution.md` (if filled in)
- Reads `tasks/index.md` for the phase map

**With `--phase`:** Prints the preamble, the task index, and the content of the requested phase (the existing task file if it exists, or the corresponding plan file if not), plus the tasks prompt. The agent writes tasks for that single phase only.

**Without `--phase`:** Prints the preamble, the task index, all plan files, and the tasks prompt. The agent is instructed to process phases one at a time. A tip listing `speclet tasks --phase N` for each phase is also shown.

**Phase resolution:** Phase can be a 1-based number (`1`, `2`, `3`) or a partial name match against the phase heading (e.g., `"setup"`, `"API"`). The match is case-insensitive.

**Examples:**

```bash
speclet tasks                  # prompt for all phases (agent processes one at a time)
speclet tasks --phase 1        # prompt for phase 1 only (lower token cost)
speclet tasks -p "Phase 2"     # prompt for the phase whose heading contains "Phase 2"
```

> **Tip:** Process one phase at a time (`--phase N`) for lower token cost and more focused output.

---

### speclet clarify

Print a prompt that guides your AI agent to generate clarifying questions about the plan or a specific phase.

```
speclet clarify [options]
```

**Arguments:** none

**Options:**

| Flag | Short | Default | Description |
|---|---|---|---|
| `--phase <phase>` | `-p` | _(full plan)_ | Clarify a specific phase only, by number or name |

**What it does:**

- Requires `.speclet/` (run `speclet init` first)
- Builds the preamble from `context.md` and `constitution.md` (if filled in)

**With `--phase`:** Prints the preamble, the content of the requested phase task file, and the clarify prompt. The agent generates questions about that phase only.

**Without `--phase`:** Prints the preamble, all plan files from `.speclet/plans/`, and the clarify prompt. The agent generates questions about the full plan.

**Your agent will:**

1. Scan for ambiguities across 5 categories: Scope, Technical, Dependencies, Edge cases, Non-functional requirements
2. Ask up to 5 questions, prioritized by impact, one at a time — waiting for your answer before the next
3. For questions with multiple valid options, recommend the best one with brief reasoning
4. Update plan or task files immediately if an answer changes the approach

**Examples:**

```bash
speclet clarify                # questions about the full plan
speclet clarify --phase 2      # questions about phase 2 only
speclet clarify -p "API"       # questions about the phase whose heading contains "API"
```

---

### speclet analyze

Print a prompt that guides your AI agent to analyze tasks for gaps, conflicts, and risks — then optionally update task files and implement fixes.

```
speclet analyze [request] [options]
```

**Arguments:**

| Argument | Description |
|---|---|
| `request` | Optional follow-up instruction to run after the analysis (e.g., `"fix the found issues"`) |

**Options:**

| Flag | Short | Default | Description |
|---|---|---|---|
| `--phase <phase>` | `-p` | _(all phases)_ | Analyze a specific phase only, by number or name |

**What it does:**

- Requires `.speclet/` with `tasks/index.md` (run `speclet init` first)
- Builds the preamble from `context.md` and `constitution.md` (if filled in)
- Reads `tasks/index.md`

**With `--phase`:** Prints the preamble, the task index, the requested phase file, and the analyze prompt. The agent analyzes that phase only.

**Without `--phase`:** Prints the preamble, the task index, and the analyze prompt (with an instruction to load phase files one at a time). Also prints a tip to use `--phase` for lower token cost.

**With `request`:** Appends a `<follow-up>` block containing the request. The agent runs the full analysis first, then addresses the follow-up — updating task files before making any code changes.

**Analysis categories:**

| Category | What the agent looks for |
|---|---|
| **Conflicts** | Same file created in two phases, contradictory patterns (e.g. REST vs GraphQL without explanation) |
| **Gaps** | Features mentioned in plans with no corresponding task, missing dependency tasks |
| **Risks** | Vague tasks without file paths, tasks that span multiple phases, unclear success criteria |
| **Constitution violations** | Any task contradicting `.speclet/constitution.md` — always marked CRITICAL |

**Follow-up order:** The agent MUST output the analysis report first, then handle the follow-up. It updates task files before making any code changes — task files are always the source of truth.

**Examples:**

```bash
speclet analyze                              # analyze all phases
speclet analyze --phase 1                    # analyze phase 1 only
speclet analyze "fix the found issues"       # analyze all, then fix
speclet analyze "fix the found issues" -p 2  # analyze phase 2, then fix
```

---

### speclet implement

Print a prompt that guides your AI agent to implement all tasks in a single phase.

```
speclet implement <phase>
```

**Arguments:**

| Argument | Required | Description |
|---|---|---|
| `phase` | Yes | Phase number (e.g. `1`) or phase name/partial name (e.g. `"Phase 2: API"`) |

**Options:** none

**What it does:**

- Requires `.speclet/` with `tasks/index.md` and the phase's task file (run `speclet tasks` first)
- Builds the preamble from `context.md` and `constitution.md` (if filled in)
- Resolves the phase argument: first tries it as a 1-based number, then as a case-insensitive substring match against phase headings
- Prints the preamble, the task index, the full content of the resolved phase task file, and the implement prompt

**Your agent will:**

1. Read `context.md` and `constitution.md` to understand the exact stack and rules
2. Load **only** the requested phase task file — never other phases
3. Work through each unchecked `- [ ]` task in order
4. Mark each task `- [x]` immediately after completing it
5. When all tasks are done, update the phase file header with `Status: Complete` and `Completed: <date>`, then summarize what was built

If the phase argument doesn't match anything in the index, the command exits with an error listing all available phases.

**Examples:**

```bash
speclet implement 1              # implement phase 1
speclet implement 2              # implement phase 2
speclet implement "Phase 3"      # implement by partial name match
speclet implement "setup"        # implements the phase whose heading contains "setup"
```

---

### speclet learn

Review auto-captured rules from recent implementation sessions and decide which ones to permanently add to the constitution.

```
speclet learn
```

**Arguments:** none

**Options:** none

**What it does:**

1. Requires `.speclet/` to exist
2. Reads `.speclet/constitution.learned.md` — if it has no pending rules (no `### ` entries), exits with a "nothing to review" message
3. Builds the standard preamble from `context.md` and `constitution.md`
4. Prints the preamble, the current constitution, the learned rules, and a review prompt — paste into your AI agent

**Your agent will:**

1. Present each pending rule from `constitution.learned.md` one at a time
2. Ask: **Keep, Skip, or Defer?** — wait for your answer before the next
3. **Keep** → merge into the appropriate section of `constitution.md` (create a new section if needed)
4. **Skip** → remove from `constitution.learned.md`
5. **Defer** → leave unchanged in `constitution.learned.md`
6. Rewrite both files, then report how many rules were merged, skipped, and deferred

**When to run it:**

After finishing a phase (or a few phases). You don't have to run it after every single phase — learned rules are already injected into future implement sessions automatically, so the agent benefits from them whether or not you've merged them yet.

**Examples:**

```bash
speclet learn
# Copy the output → paste into your AI agent
```

---

### speclet gitignore

Generate or update `.gitignore` based on your stack in `.speclet/context.md`.

```
speclet gitignore [options]
```

**Arguments:** none

**Options:**

| Flag | Short | Description |
|---|---|---|
| `--dry` | `-d` | Preview what would be written without making any changes |
| `--force` | `-f` | Overwrite the existing `.gitignore` instead of merging |

**What it does:**

1. Requires `.speclet/` with `context.md`
2. Reads `context.md` and detects stack keywords (case-insensitive) to determine which pattern groups to include
3. Builds a `.gitignore` from matching pattern groups — always includes a "General" section with universal patterns (`.env`, `.DS_Store`, `*.log`, `coverage/`, etc.)

**Detected stacks and their patterns:**

| Keyword(s) in context.md | Patterns added |
|---|---|
| `node`, `nodejs` | `node_modules/`, `npm-debug.log*`, `.npm/`, `.pnpm-store/` |
| `typescript`, `ts` | `dist/`, `build/`, `*.tsbuildinfo`, `*.js.map` |
| `javascript`, `js` | `dist/`, `build/` |
| `python`, `py` | `__pycache__/`, `*.pyc`, `.venv/`, `dist/`, `.pytest_cache/`, `.mypy_cache/` |
| `java` | `target/`, `*.class`, `*.jar`, `.gradle/`, `.idea/` |
| `kotlin` | `build/`, `.gradle/`, `.idea/`, `*.class` |
| `go`, `golang` | `*.exe`, `*.dll`, `*.so`, `vendor/` |
| `rust` | `target/`, `debug/`, `release/`, `Cargo.lock` |
| `php` | `vendor/`, `*.log`, `*.cache` |
| `ruby` | `.bundle/`, `log/`, `tmp/`, `vendor/bundle/` |
| `swift` | `.build/`, `DerivedData/`, `Packages/` |
| `c#`, `dotnet`, `.net` | `bin/`, `obj/`, `packages/`, `.vs/` |
| `react`, `next`, `nextjs` | `.next/`, `out/` |
| `vue` | `.nuxt/`, `dist/` |
| `angular` | `dist/`, `.angular/` |
| `nestjs` | `dist/` (plus `node` and `typescript` groups) |
| `django` | `*.pyc`, `db.sqlite3`, `media/`, `staticfiles/` |
| `laravel` | `vendor/`, `bootstrap/cache/`, `storage/*.key` |
| `rails` | `log/`, `tmp/`, `storage/`, `public/assets/` |
| `sqlite` | `*.sqlite`, `*.sqlite3`, `*.db` |
| `docker` | `.dockerignore` |
| `terraform` | `.terraform/`, `*.tfstate`, `*.tfvars`, `crash.log` |
| `vscode` | `.vscode/`, `*.code-workspace` |

**Default behavior (no flags):** If `.gitignore` already exists, new entries are **merged** — only patterns not already present are appended under a `# speclet-generated` heading. Existing entries are never removed.

**Examples:**

```bash
speclet gitignore              # merge new entries into existing .gitignore
speclet gitignore --dry        # preview detected stacks and patterns without writing
speclet gitignore --force      # overwrite the entire .gitignore
```

**`--dry` output example:**
```
📄 .gitignore preview

Detected groups: node, typescript, nestjs

# General
.env
.env.*
...

# Node
node_modules/
...
```

---

### speclet update

Update speclet CLI to the latest version (only works for git clone installs).

```
speclet update
```

**Arguments:** none

**Options:** none

**What it does:**

1. Locates the global speclet install directory by resolving the running binary (follows symlinks) and walking up to find `package.json` with `"name": "speclet"`. Falls back to checking common global npm paths (`/usr/local/lib/node_modules/speclet`, `~/.npm-global/lib/node_modules/speclet`, etc.)
2. Checks whether the install directory is a git repository (`.git` present)
3. If it is a git repo: runs `git pull`, `npm install`, `npm run build`, then `npm install -g .` in sequence
4. Prints the new version number on success

**If not a git install:** Prints manual update instructions and exits with code 0.

**If the binary cannot be located:** Prints an error with manual update instructions and exits with code 1.

**Examples:**

```bash
speclet update
```

For npm registry installs, update via npm instead:

```bash
npm update -g speclet
```

---

## .speclet directory structure

```
.speclet/
├── context.md                Stack, conventions, constraints
│                             → Edit manually (new projects) or fill via speclet map (existing projects).
│                             → Injected into every speclet prompt.
│
├── constitution.md           Project ground rules
│                             → Filled in by your agent via /speclet.constitution
│                             → Injected into every prompt once the unfilled marker is removed
│
├── constitution.learned.md   Auto-captured rules from implementation sessions
│                             → Written by the agent during /speclet.implement
│                             → Injected into future prompts automatically
│                             → Review and merge with speclet learn
│
├── architecture.md           Existing module map, key files, data flow, integration points
│                             → Generated by speclet map on existing projects
│                             → Read by agents during implementation to respect module boundaries
│                             → Not present on new (greenfield) projects
│
├── plans/                    Read-only copies of your original plan files
│
├── tasks/
│   ├── index.md              Phase map — auto-generated by speclet init, do not edit
│   └── phase-N-name.md       Task files — generated by your agent via /speclet.tasks
│
└── prompts/                  Prompt instruction files used internally by each command
    ├── map.md
    ├── constitution.md
    ├── clarify.md
    ├── analyze.md
    ├── tasks.md
    ├── implement.md
    └── learn.md
```

**Commit everything in `.speclet/` and all agent files** — they are project configuration, not build artifacts.

---

## Updating speclet

```bash
npm update -g speclet
```

Or use the built-in update command (git clone installs only):

```bash
speclet update
```

> **Development update** (if you installed from git clone):
> ```bash
> cd /path/to/speclet
> git pull
> npm install
> npm run build
> npm install -g .
> ```

