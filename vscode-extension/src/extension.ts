import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const SPECLET_DIR = ".speclet";

// ─── File utilities ────────────────────────────────────────────────────────────

function specletPath(root: string, ...segments: string[]): string {
  return path.join(root, SPECLET_DIR, ...segments);
}

function readSpecletFile(root: string, ...segments: string[]): string | null {
  const p = specletPath(root, ...segments);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf-8");
}

function readConstitution(root: string): string | null {
  const content = readSpecletFile(root, "constitution.md");
  if (!content) return null;
  if (content.includes("<!-- speclet:unfilled -->")) return null;
  return content;
}

function buildPreamble(root: string): string {
  const context = readSpecletFile(root, "context.md") ?? "(no context.md found)";
  const constitution = readConstitution(root);
  const blocks = [`<context>\n${context}\n</context>`];
  if (constitution) blocks.push(`<constitution>\n${constitution}\n</constitution>`);
  return blocks.join("\n\n");
}

// ─── Phase resolution ──────────────────────────────────────────────────────────

interface PhaseEntry {
  heading: string;
  file: string;
  sourceFile?: string;
}

function readPhaseIndex(root: string): PhaseEntry[] {
  const index = readSpecletFile(root, "tasks", "index.md");
  if (!index) return [];
  const entries: PhaseEntry[] = [];
  for (const line of index.split("\n")) {
    const match = line.match(/^- \*\*(.+?)\*\*\s*→\s*`(.+?)`(?:\s*_\(source: (.+?)\)_)?/);
    if (match) {
      entries.push({
        heading: match[1],
        file: match[2].replace(/^tasks\//, ""),
        sourceFile: match[3],
      });
    }
  }
  return entries;
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/^phase\s*\d+[:\s]*/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function resolvePhase(root: string, phaseArg: string): PhaseEntry | null {
  const entries = readPhaseIndex(root);
  const num = parseInt(phaseArg, 10);
  if (!isNaN(num) && entries[num - 1]) return entries[num - 1];
  return (
    entries.find(
      (e) =>
        e.heading.toLowerCase().includes(phaseArg.toLowerCase()) ||
        e.file.includes(slugify(phaseArg))
    ) ?? null
  );
}

// ─── Prompt builders ───────────────────────────────────────────────────────────

function buildConstitutionPrompt(root: string): string {
  const preamble = buildPreamble(root);
  const constitutionContent =
    readSpecletFile(root, "constitution.md") ?? "(not found)";
  const instructions =
    readSpecletFile(root, "prompts", "constitution.md") ?? "";
  return [
    preamble,
    `<constitution>\n${constitutionContent}\n</constitution>`,
    `<instructions>\n${instructions}\n</instructions>`,
  ].join("\n\n");
}

function buildClarifyPrompt(root: string, phaseArg?: string): string {
  const preamble = buildPreamble(root);
  const instructions = readSpecletFile(root, "prompts", "clarify.md") ?? "";

  if (phaseArg?.trim()) {
    const entry = resolvePhase(root, phaseArg.trim());
    if (!entry) {
      const all = readPhaseIndex(root);
      return `Phase "${phaseArg}" not found. Available phases:\n${all.map((e, i) => `  ${i + 1}. ${e.heading}`).join("\n")}`;
    }
    const phaseContent =
      readSpecletFile(root, "tasks", entry.file) ?? "(task file not found)";
    return [
      preamble,
      `<phase name="${entry.heading}">\n${phaseContent}\n</phase>`,
      `<instructions>\n${instructions}\n</instructions>`,
    ].join("\n\n");
  }

  const plansDir = specletPath(root, "plans");
  const planBlocks = fs.existsSync(plansDir)
    ? fs
        .readdirSync(plansDir)
        .filter((f) => f.endsWith(".md"))
        .sort()
        .map(
          (f) =>
            `<plan file="${f}">\n${fs.readFileSync(path.join(plansDir, f), "utf-8")}\n</plan>`
        )
        .join("\n\n")
    : "(no plan files found in .speclet/plans/)";

  return [
    preamble,
    planBlocks,
    `<instructions>\n${instructions}\n</instructions>`,
  ].join("\n\n");
}

function buildAnalyzePrompt(root: string, phaseArg?: string): string {
  const preamble = buildPreamble(root);
  const instructions = readSpecletFile(root, "prompts", "analyze.md") ?? "";
  const index = readSpecletFile(root, "tasks", "index.md") ?? "(index not found)";

  if (phaseArg?.trim()) {
    const entry = resolvePhase(root, phaseArg.trim());
    if (!entry) {
      const all = readPhaseIndex(root);
      return `Phase "${phaseArg}" not found. Available phases:\n${all.map((e, i) => `  ${i + 1}. ${e.heading}`).join("\n")}`;
    }
    const phaseContent =
      readSpecletFile(root, "tasks", entry.file) ?? "(task file not found)";
    return [
      preamble,
      `<task-index>\n${index}\n</task-index>`,
      `<phase name="${entry.heading}">\n${phaseContent}\n</phase>`,
      `<instructions>\n${instructions}\n</instructions>`,
    ].join("\n\n");
  }

  return [
    preamble,
    `<task-index>\n${index}\n</task-index>`,
    `<instructions>\n${instructions}\n\nLoad each phase file one at a time as needed — do not load all at once.\n</instructions>`,
  ].join("\n\n");
}

function buildTasksPrompt(root: string, phaseArg?: string): string {
  const preamble = buildPreamble(root);
  const instructions = readSpecletFile(root, "prompts", "tasks.md") ?? "";
  const index = readSpecletFile(root, "tasks", "index.md") ?? "(index not found)";

  if (phaseArg?.trim()) {
    const entry = resolvePhase(root, phaseArg.trim());
    if (!entry) {
      const all = readPhaseIndex(root);
      return `Phase "${phaseArg}" not found. Available phases:\n${all.map((e, i) => `  ${i + 1}. ${e.heading}`).join("\n")}`;
    }

    const taskFilePath = specletPath(root, "tasks", entry.file);
    let phaseBlock: string;
    if (fs.existsSync(taskFilePath)) {
      const content = fs.readFileSync(taskFilePath, "utf-8");
      phaseBlock = `<phase name="${entry.heading}" file="${entry.file}">\n${content}\n</phase>`;
    } else {
      const plansDir = specletPath(root, "plans");
      const planFile = entry.sourceFile
        ? path.join(plansDir, path.basename(entry.sourceFile))
        : null;
      const planContent =
        planFile && fs.existsSync(planFile)
          ? fs.readFileSync(planFile, "utf-8")
          : "(plan source not found)";
      phaseBlock = `<plan file="${entry.sourceFile ?? "unknown"}">\n${planContent}\n</plan>`;
    }

    return [
      preamble,
      `<task-index>\n${index}\n</task-index>`,
      phaseBlock,
      `<instructions>\n${instructions}\n</instructions>`,
    ].join("\n\n");
  }

  // All phases — include plan files
  const plansDir = specletPath(root, "plans");
  const planBlocks = fs.existsSync(plansDir)
    ? fs
        .readdirSync(plansDir)
        .filter((f) => f.endsWith(".md"))
        .sort()
        .map(
          (f) =>
            `<plan file="${f}">\n${fs.readFileSync(path.join(plansDir, f), "utf-8")}\n</plan>`
        )
        .join("\n\n")
    : "";

  return [
    preamble,
    `<task-index>\n${index}\n</task-index>`,
    planBlocks,
    `<instructions>\n${instructions}\n\nProcess one phase at a time. For each phase, create the task file listed in the index.\n</instructions>`,
  ].join("\n\n");
}

function buildImplementPrompt(
  root: string,
  phaseArg: string
): string | { error: string } {
  if (!phaseArg?.trim()) {
    return {
      error:
        "Please specify a phase. Example: `@speclet /implement 1` or `@speclet /implement \"Phase 2\"`",
    };
  }

  const entry = resolvePhase(root, phaseArg.trim());
  if (!entry) {
    const all = readPhaseIndex(root);
    return {
      error:
        `Phase "${phaseArg}" not found.\n\nAvailable phases:\n` +
        all.map((e, i) => `  ${i + 1}. ${e.heading}`).join("\n"),
    };
  }

  const phaseContent = readSpecletFile(root, "tasks", entry.file);
  if (!phaseContent) {
    return {
      error:
        `Task file for **${entry.heading}** not found at \`.speclet/tasks/${entry.file}\`.\n\n` +
        `Generate it first with: \`@speclet /tasks ${phaseArg}\``,
    };
  }

  const preamble = buildPreamble(root);
  const instructions = readSpecletFile(root, "prompts", "implement.md") ?? "";
  const index = readSpecletFile(root, "tasks", "index.md") ?? "";

  return [
    preamble,
    `<task-index>\n${index}\n</task-index>`,
    `<phase name="${entry.heading}" file="${entry.file}">\n${phaseContent}\n</phase>`,
    `<instructions>\n${instructions}\n</instructions>`,
  ].join("\n\n");
}

// ─── Help text ────────────────────────────────────────────────────────────────

function helpText(root: string): string {
  const hasSpecletDir = fs.existsSync(path.join(root, SPECLET_DIR));

  if (!hasSpecletDir) {
    return [
      "## speclet — spec-driven development",
      "",
      "⚠️ No `.speclet` directory found in this workspace.",
      "",
      "**Setup:**",
      "```bash",
      "speclet init ./plans",
      "```",
      "Run that in your terminal first, then come back here.",
    ].join("\n");
  }

  const phases = readPhaseIndex(root);
  const phaseList = phases.length
    ? phases.map((e, i) => `  - \`${i + 1}\` — ${e.heading}`).join("\n")
    : "  *(no phases yet — run `@speclet /tasks` to generate them)*";

  return [
    "## speclet — spec-driven development",
    "",
    "**Commands:**",
    "",
    "| Command | Description |",
    "|---|---|",
    "| `@speclet /tasks` | Generate tasks for all phases |",
    "| `@speclet /tasks 1` | Generate tasks for phase 1 only |",
    "| `@speclet /implement 1` | Implement phase 1 |",
    "| `@speclet /implement \"Phase 2\"` | Implement by name |",
    "| `@speclet /clarify` | Clarifying questions for the full plan |",
    "| `@speclet /clarify 2` | Clarify a specific phase |",
    "| `@speclet /analyze` | Analyze all tasks for gaps and conflicts |",
    "| `@speclet /analyze 1` | Analyze a specific phase |",
    "| `@speclet /constitution` | Fill in or update the project constitution |",
    "",
    "**Phases in this project:**",
    phaseList,
  ].join("\n");
}

// ─── Chat handler ─────────────────────────────────────────────────────────────

async function handler(
  request: vscode.ChatRequest,
  _context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders?.length) {
    stream.markdown(
      "❌ No workspace folder found. Open your project folder in VS Code first."
    );
    return {};
  }

  const root = workspaceFolders[0].uri.fsPath;
  const cmd = request.command;
  const arg = request.prompt.trim();

  // No command — show help
  if (!cmd) {
    stream.markdown(helpText(root));
    return {};
  }

  // Check .speclet exists
  if (!fs.existsSync(path.join(root, SPECLET_DIR))) {
    stream.markdown(
      "❌ No `.speclet` directory found.\n\nRun this in your terminal first:\n```bash\nspeclet init ./plans\n```"
    );
    return {};
  }

  // Build the prompt for the requested command
  let builtPrompt: string;

  switch (cmd) {
    case "constitution":
      stream.progress("Reading .speclet files...");
      builtPrompt = buildConstitutionPrompt(root);
      break;

    case "clarify":
      stream.progress(arg ? `Clarifying phase: ${arg}` : "Clarifying full plan...");
      builtPrompt = buildClarifyPrompt(root, arg);
      break;

    case "analyze":
      stream.progress(arg ? `Analyzing phase: ${arg}` : "Analyzing all phases...");
      builtPrompt = buildAnalyzePrompt(root, arg);
      break;

    case "tasks":
      stream.progress(arg ? `Generating tasks for phase: ${arg}` : "Generating tasks...");
      builtPrompt = buildTasksPrompt(root, arg);
      break;

    case "implement": {
      stream.progress(`Preparing implementation for: ${arg || "(no phase given)"}...`);
      const result = buildImplementPrompt(root, arg);
      if (typeof result === "object" && "error" in result) {
        stream.markdown(`❌ ${result.error}`);
        return {};
      }
      builtPrompt = result;
      break;
    }

    default:
      stream.markdown(helpText(root));
      return {};
  }

  // Send prompt to the Copilot language model
  const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
  if (!models.length) {
    stream.markdown(
      "❌ No Copilot language model available. Make sure GitHub Copilot is installed and signed in."
    );
    return {};
  }

  const model = models[0];
  const messages = [vscode.LanguageModelChatMessage.User(builtPrompt)];

  try {
    const response = await model.sendRequest(messages, {}, token);
    for await (const chunk of response.text) {
      stream.markdown(chunk);
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.name === "Cancelled" || err.message?.includes("cancelled"))
    ) {
      return {};
    }
    stream.markdown(
      `❌ Error calling language model: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return {};
}

// ─── Activation ───────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  const participant = vscode.chat.createChatParticipant("speclet.agent", handler);
  participant.iconPath = new vscode.ThemeIcon("book");
  context.subscriptions.push(participant);
}

export function deactivate(): void {}

