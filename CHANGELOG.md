# Changelog

All notable changes to speclet are documented here.

---

## Unreleased

---

## 0.3.1 — 2026-06-21

### Added
- **`/speclet-plan` slash command** — planning is now an AI agent command, scaffolded by `speclet init` for all four agents: Claude Code (`/project:speclet-plan`), Copilot Chat (`/speclet.plan`, with handoffs to clarify/tasks), Mistral Vibe (`/speclet-plan`), and Command Code (`/speclet-plan`). The agent acts as a **system architect / lead engineer**: for every decision (architecture, tech choices, phase boundaries, ordering, scope) it proposes 2–4 options with trade-offs and a recommendation, asks the developer to choose or offer their own, asks one question at a time, and never decides unilaterally.
- **`plan.md` prompt template** — scaffolded by `speclet init` into `.speclet/prompts/plan.md`; drives the architect-style interview and writes phased plan files straight into `.speclet/plans/`.

### Changed
- Each agent now scaffolds **8 commands** (was 7) — `plan` added to the Claude, Copilot, Vibe, and Command Code command/skill/agent maps, and to the Cursor rules prompt list and Vibe `AGENTS.md` command list.
- `speclet init` "next steps" and placeholder output now point users to the `/speclet-plan` slash command instead of a terminal command.

### Removed
- **`speclet plan` CLI command** — removed along with `src/commands/plan.ts` and its `cli.ts` registration. Planning was never meant to be a terminal command; it now exists **only** as the `/speclet-plan` agent command. Because the agent writes plan files directly into `.speclet/plans/`, the agent path skips the `speclet init ./plans` copy step (`speclet init` → `/speclet-plan` → `/speclet-tasks`).

### Documentation
- Reworked the "How it works" workflow diagram to show both new-project paths: agent-written (`speclet init` → `/speclet-plan` → `/speclet-tasks`) and hand-written (`write plans/*.md` → `speclet init ./plans` → `/speclet-tasks`)
- Replaced the `speclet plan` CLI reference subsection with a "Not a CLI command" note redirecting to `/speclet-plan`, and removed its Table of Contents entry
- Added `/speclet-plan` rows to all four agent command tables (Copilot, Claude Code, Vibe, Command Code)
- Updated Step 1 ("Write your plan") to describe the architect-style `/speclet-plan` flow and removed the old `speclet plan` terminal examples

---

## 0.3.0 — 2026-06-16

### Added
- **`speclet learn` command** — reviews auto-captured rules from `.speclet/constitution.learned.md` and guides the agent to merge, skip, or defer each one into `constitution.md` via a one-at-a-time review flow.
- **`constitution.learned.md`** — new file scaffolded by `speclet init`. During `speclet implement`, the agent automatically appends corrections and discovered patterns here (e.g. missing bash flags, wrong path assumptions, project conventions found mid-task). Format: `### [date] category: title` + `**Rule:**` / `**Why:**` fields.
- **Auto-injection of learned rules** — `buildPreamble()` now injects `constitution.learned.md` into all future prompts via a `<constitution-learned>` block, so the agent benefits from captured rules on the very next phase without needing a merge first.
- **`/speclet-learn` slash command** — added to all five agent integrations: Claude Code (`/project:speclet-learn`), Copilot Chat (`/speclet.learn`), Mistral Vibe (`/speclet-learn`), Command Code (`/speclet-learn`). Copilot Chat's implement agent now includes a "Review Learned Rules" handoff button.
- **`learn.md` prompt template** — scaffolded by `speclet init` into `.speclet/prompts/learn.md`; drives the agent's Keep / Skip / Defer review loop.
- **Learning instructions in implement** — all implement agent templates (Claude, Copilot, Vibe, CommandCode) and `.speclet/prompts/implement.md` updated to instruct the agent to read `constitution.learned.md` before starting, capture rules during implementation, and surface them at the end of a phase.

### Documentation
- Added **Step 10 — Review learned rules** to the step-by-step guide with an example of captured rule format and the Keep / Skip / Defer flow
- Added `speclet learn` CLI reference section
- Updated all agent command tables (Copilot, Claude Code, Vibe, CommandCode) with the new `/speclet-learn` command
- Updated `.speclet directory structure` section — added `constitution.learned.md` and `prompts/learn.md` entries
- Updated Step 2 init output listing and Step 9 agent behavior list
- Updated all file tree listings in Step 2 (`.claude/commands/`, `.github/agents/`, `.github/prompts/`, `.vibe/skills/`, `.commandcode/skills/`)
- Rewrote the CLI reference section of `README.md` — every command now has its own subsection with a full argument/option table, step-by-step behavior explanation, and concrete examples
- Documented `speclet gitignore` pattern registry — full table of all detected stack keywords and their generated patterns
- Documented phase resolution logic for `speclet tasks`, `speclet clarify`, `speclet analyze`, and `speclet implement`
- Documented `speclet update` binary-location strategy and non-git-install fallback behavior
- Documented `speclet map` project snapshot details

---

## 0.2.0 — 2026-06-13

### Added
- **`speclet map` command** — scans an existing codebase and prints a structured prompt that tells your AI agent how to produce all speclet context files (`context.md`, `architecture.md`, `constitution.md`, plan files, and completed task history). Bootstraps `.speclet/` automatically if it does not exist.
- **`speclet plan` command** — prints a prompt that guides your AI agent to interview you and write plan files. Accepts `--path <dir>` (default: `plans/`) to control where the agent writes the output.
- **Mistral Vibe integration** — `speclet init --agent vibe` (and `--agent all`) now scaffolds `.vibe/AGENTS.md` (always-on context) and `.vibe/skills/speclet-*/SKILL.md` (six custom slash commands: `/speclet-map`, `/speclet-constitution`, `/speclet-tasks`, `/speclet-implement`, `/speclet-clarify`, `/speclet-analyze`).
- **Command Code integration** — `speclet init --agent commandcode` (and `--agent all`) now scaffolds `.commandcode/skills/speclet-*/SKILL.md` (same six slash commands for Command Code).
- **`--agent` option for `speclet init`** — short flag `-a` supported; `commandcode` and `vibe` added as valid values alongside `all`, `claude`, `copilot`, `cursor`.
- **Dynamic versioning** — CLI reads version from `package.json` at runtime using `createRequire`, so `speclet --version` always reports the installed version without a rebuild.

### Changed
- **`analyze` command** — after running analysis, the agent now **updates task/phase files first** before implementing code changes. This keeps `.speclet/tasks/` in sync as the source of truth. If no follow-up instruction is given, behavior is unchanged (analysis report only).
  - Affects all agent scaffolds: Copilot Chat agent, Claude Code slash command, Mistral Vibe skill, Command Code skill, and `.speclet/prompts/analyze.md`
  - Vibe `speclet-analyze` skill now includes `write_file`, `edit`, and `bash` tools to enable task file updates and code implementation

---

## 0.1.0 — 2026-06-10

Initial release.

### Commands
- `speclet init <plan>` — initialize `.speclet/` from a plan file or folder
- `speclet constitution` — set project ground rules
- `speclet tasks [--phase n]` — generate tasks from plan phases
- `speclet clarify [--phase n]` — generate clarifying questions
- `speclet analyze [--phase n]` — analyze tasks for gaps and conflicts
- `speclet implement <phase>` — implement a single phase
- `speclet gitignore` — generate `.gitignore` from stack in `context.md`
- `speclet update` — self-update from git remote

### Agent integrations
- **GitHub Copilot Chat** — `.github/agents/speclet.*.agent.md` (dropdown) + `.github/prompts/speclet.*.prompt.md` (slash commands)
- **Claude Code** — `.claude/commands/speclet-*.md` (`/project:speclet-*` commands)
- **Cursor** — `.cursor/rules/speclet.mdc` (workflow rules)
- Default `--agent` scaffolds all three at once
