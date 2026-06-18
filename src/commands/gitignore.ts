import fs from "fs";
import path from "path";
import chalk from "chalk";
import { ensureSpecletDir, readSpecletFile } from "../utils.js";

// ─── Pattern registry ─────────────────────────────────────────────────────────

const PATTERNS: Record<string, string[]> = {
  // Runtimes / Languages
  node: ["node_modules/", "npm-debug.log*", "yarn-debug.log*", "yarn-error.log*", "pnpm-debug.log*", ".npm/", ".pnpm-store/"],
  typescript: ["dist/", "build/", "*.tsbuildinfo", "*.js.map"],
  javascript: ["dist/", "build/"],
  python: ["__pycache__/", "*.py[cod]", "*$py.class", ".venv/", "venv/", "env/", ".env/", "dist/", "build/", "*.egg-info/", ".eggs/", "*.egg", ".pytest_cache/", ".mypy_cache/", ".ruff_cache/"],
  java: ["target/", "*.class", "*.jar", "*.war", ".gradle/", "build/", "out/", ".idea/", "*.iml"],
  kotlin: ["build/", "out/", ".gradle/", ".idea/", "*.class", "*.jar", "*.iml", "*.log"],
  go: ["*.exe", "*.exe~", "*.dll", "*.so", "*.dylib", "*.test", "*.out", "vendor/"],
  rust: ["target/", "debug/", "release/", "*.rs.bk", "Cargo.lock"],
  php: ["vendor/", "*.log", "*.cache"],
  ruby: [".bundle/", "log/", "tmp/", "*.gem", "vendor/bundle/", ".ruby-version"],
  swift: [".build/", "DerivedData/", "*.xcworkspace/", "Packages/", "*.resolved"],
  dotnet: ["bin/", "obj/", "*.user", "*.suo", "packages/", ".vs/"],
  // Frameworks
  react: [".next/", "out/", ".nuxt/"],
  nextjs: [".next/", "out/"],
  vue: [".nuxt/", "dist/"],
  angular: ["dist/", ".angular/"],
  nestjs: ["dist/"],
  django: ["*.pyc", "db.sqlite3", "media/", "staticfiles/"],
  laravel: ["vendor/", "bootstrap/cache/", "storage/*.key", "public/hot", "public/storage"],
  rails: ["log/", "tmp/", "storage/", "public/assets/", ".bundle/"],
  // Databases
  sqlite: ["*.sqlite", "*.sqlite3", "*.db"],
  // Infrastructure / DevOps
  docker: [".dockerignore"],
  terraform: [".terraform/", "*.tfstate", "*.tfstate.*", "*.tfvars", ".terraform.lock.hcl", "crash.log"],
  kubernetes: ["*.secret.yaml", "secrets/", "kubeconfig*"],
  // Tools
  vscode: [".vscode/", "*.code-workspace"],
  idea: [".idea/", "*.iml", "*.iws"],
  // Universal
  universal: [".env", ".env.*", "!.env.example", ".DS_Store", "Thumbs.db", "*.log", "*.tmp", "*.swp", "coverage/", ".coverage", "*.lcov"],
};

const KEYWORD_MAP: Record<string, string[]> = {
  "node": ["node"],
  "nodejs": ["node"],
  "typescript": ["node", "typescript"],
  "ts": ["node", "typescript"],
  "javascript": ["node", "javascript"],
  "js": ["node", "javascript"],
  "python": ["python"],
  "py": ["python"],
  "java": ["java"],
  "kotlin": ["kotlin"],
  "go": ["go"],
  "golang": ["go"],
  "rust": ["rust"],
  "php": ["php"],
  "ruby": ["ruby"],
  "swift": ["swift"],
  "c#": ["dotnet"],
  "dotnet": ["dotnet"],
  ".net": ["dotnet"],
  "react": ["react"],
  "next": ["nextjs"],
  "nextjs": ["nextjs"],
  "vue": ["vue"],
  "angular": ["angular"],
  "nestjs": ["nestjs", "node", "typescript"],
  "django": ["python", "django"],
  "laravel": ["php", "laravel"],
  "rails": ["ruby", "rails"],
  "sqlite": ["sqlite"],
  "docker": ["docker"],
  "terraform": ["terraform"],
  "vscode": ["vscode"],
};

function detectGroups(contextContent: string): Set<string> {
  const lower = contextContent.toLowerCase();
  const groups = new Set<string>(["universal"]);

  for (const [keyword, mapped] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      for (const g of mapped) groups.add(g);
    }
  }

  return groups;
}

function buildGitignore(groups: Set<string>): string {
  const sections: string[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    const patterns = PATTERNS[group];
    if (!patterns) continue;

    const fresh = patterns.filter((p) => !seen.has(p));
    if (fresh.length === 0) continue;

    if (group !== "universal") {
      sections.push(`# ${group.charAt(0).toUpperCase() + group.slice(1)}`);
    } else {
      sections.push("# General");
    }

    for (const p of fresh) {
      sections.push(p);
      seen.add(p);
    }
    sections.push("");
  }

  return sections.join("\n").trimEnd() + "\n";
}

// ─── Command ──────────────────────────────────────────────────────────────────

export async function gitignoreCommand(opts: { force?: boolean; dry?: boolean }) {
  ensureSpecletDir();

  const contextContent = readSpecletFile("context.md");
  const groups = detectGroups(contextContent);
  const generated = buildGitignore(groups);

  const gitignorePath = path.join(process.cwd(), ".gitignore");
  const exists = fs.existsSync(gitignorePath);

  if (opts.dry) {
    console.log(chalk.bold("\n📄 .gitignore preview\n"));
    console.log(chalk.dim("Detected groups: ") + [...groups].join(", "));
    console.log();
    console.log(generated);
    return;
  }

  if (exists && !opts.force) {
    // Merge: append only entries not already present
    const existing = fs.readFileSync(gitignorePath, "utf-8");
    const existingLines = new Set(
      existing.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    );

    const newLines = generated
      .split("\n")
      .filter((l) => {
        const trimmed = l.trim();
        if (!trimmed || trimmed.startsWith("#")) return true; // keep headings/blanks
        return !existingLines.has(trimmed);
      });

    const toAppend = newLines.join("\n").trim();
    if (!toAppend) {
      console.log(chalk.green("✔ .gitignore is already up to date — nothing to add."));
      return;
    }

    const merged = existing.trimEnd() + "\n\n# speclet-generated\n" + toAppend + "\n";
    fs.writeFileSync(gitignorePath, merged, "utf-8");
    console.log(
      chalk.green(`✔ Updated .gitignore`) +
      chalk.dim(` (${newLines.filter((l) => l.trim() && !l.startsWith("#")).length} new entries appended)`)
    );
    console.log(chalk.dim("  Detected stack: ") + [...groups].filter((g) => g !== "universal").join(", "));
    console.log(chalk.dim("  Use --force to overwrite instead of merge."));
  } else {
    // Write fresh
    fs.writeFileSync(gitignorePath, generated, "utf-8");
    console.log(
      chalk.green(exists ? "✔ Overwrote .gitignore" : "✔ Created .gitignore") +
      chalk.dim(` (${[...groups].filter((g) => g !== "universal").join(", ")})`)
    );
  }
}

