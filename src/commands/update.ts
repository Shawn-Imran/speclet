import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";

export async function updateCommand() {
  // Find where speclet is installed globally
  const specletBin = findSpecletRoot();

  if (!specletBin) {
    console.error(
      chalk.red("✖ Could not locate speclet's install directory.\n") +
      chalk.dim("Update manually:\n") +
      chalk.dim("  cd /path/to/speclet\n") +
      chalk.dim("  npm install && npm run build && npm install -g .\n")
    );
    process.exit(1);
  }

  console.log(chalk.dim(`Found speclet at: ${specletBin}\n`));

  // Check if it's a git repo
  const isGit = fs.existsSync(path.join(specletBin, ".git"));

  if (!isGit) {
    console.log(
      chalk.yellow("⚠ speclet was not installed from a git repository.\n") +
      chalk.dim("To update, re-install manually:\n\n") +
      chalk.cyan("  cd " + specletBin + "\n") +
      chalk.cyan("  npm install\n") +
      chalk.cyan("  npm run build\n") +
      chalk.cyan("  npm install -g .\n")
    );
    process.exit(0);
  }

  // Pull latest
  console.log(chalk.bold("Pulling latest changes..."));
  const pull = spawnSync("git", ["pull"], { cwd: specletBin, stdio: "inherit" });
  if (pull.status !== 0) {
    console.error(chalk.red("\n✖ git pull failed. Check the output above."));
    process.exit(1);
  }

  // Reinstall deps
  console.log(chalk.bold("\nInstalling dependencies..."));
  const install = spawnSync("npm", ["install"], { cwd: specletBin, stdio: "inherit" });
  if (install.status !== 0) {
    console.error(chalk.red("\n✖ npm install failed."));
    process.exit(1);
  }

  // Rebuild
  console.log(chalk.bold("\nBuilding..."));
  const build = spawnSync("npm", ["run", "build"], { cwd: specletBin, stdio: "inherit" });
  if (build.status !== 0) {
    console.error(chalk.red("\n✖ Build failed."));
    process.exit(1);
  }

  // Re-install globally
  console.log(chalk.bold("\nReinstalling globally..."));
  const globalInstall = spawnSync("npm", ["install", "-g", "."], { cwd: specletBin, stdio: "inherit" });
  if (globalInstall.status !== 0) {
    console.error(chalk.red("\n✖ Global install failed. Try running with sudo."));
    process.exit(1);
  }

  // Show new version
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(specletBin, "package.json"), "utf-8"));
    console.log(chalk.green(`\n✔ speclet updated to v${pkg.version}`));
  } catch {
    console.log(chalk.green("\n✔ speclet updated successfully"));
  }
}

function findSpecletRoot(): string | null {
  // Strategy 1: resolve the running binary back to its source
  try {
    const bin = execSync("which speclet", { encoding: "utf-8" }).trim();
    if (bin) {
      // npm global bin is usually a symlink — resolve it
      const real = fs.realpathSync(bin);
      // real is something like /usr/local/lib/node_modules/speclet/dist/cli.js
      // walk up to find package.json
      let dir = path.dirname(real);
      for (let i = 0; i < 5; i++) {
        if (fs.existsSync(path.join(dir, "package.json"))) {
          const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf-8"));
          if (pkg.name === "speclet") return dir;
        }
        dir = path.dirname(dir);
      }
    }
  } catch { /* ignore */ }

  // Strategy 2: check common global npm paths
  const candidates = [
    "/usr/local/lib/node_modules/speclet",
    "/usr/lib/node_modules/speclet",
    path.join(process.env.HOME || "", ".npm-global/lib/node_modules/speclet"),
    path.join(process.env.NVM_DIR || "", "versions/node", process.version, "lib/node_modules/speclet"),
  ];

  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "package.json"))) return c;
  }

  return null;
}
