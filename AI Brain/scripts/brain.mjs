#!/usr/bin/env node

import { mkdir, readFile, writeFile, access, readdir, stat, cp, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brainRoot = path.resolve(__dirname, "..");
const vaultRoot = path.resolve(brainRoot, "..");
const templatesRoot = path.join(brainRoot, "templates");

const args = process.argv.slice(2);
const command = args[0];

const files = {
  machine: [
    ["machine/current-context.md", "Current Context.md"],
    ["machine/local-setup.md", "Local Setup.md"],
    ["machine/session-log.md", "Session Log.md"],
  ],
  project: [
    ["project/overview.md", "Overview.md"],
    ["project/current-state.md", "Current State.md"],
    ["project/decisions.md", "Decisions.md"],
    ["project/next-steps.md", "Next Steps.md"],
  ],
};

const vaultLogPath = path.join(vaultRoot, "log.md");
const vaultIndexPath = path.join(vaultRoot, "index.md");
const dailyDir = path.join(brainRoot, "Daily");
const synthesisDir = path.join(vaultRoot, "Synthesis");
const machinesDir = path.join(brainRoot, "Machines");
const machineAliasesPath = path.join(machinesDir, "aliases.json");

function help() {
  console.log(`
Obsidian AI Brain helper

Memory & sessions:
  node "AI Brain/scripts/brain.mjs" init-machine "Laptop"
  node "AI Brain/scripts/brain.mjs" init-project "Project Name"
  node "AI Brain/scripts/brain.mjs" new-session "Project Name" "Session title" ["Machine Name"]
  node "AI Brain/scripts/brain.mjs" closeout "Project Name" "Session title" "Laptop" --summary "What happened" --next "What should happen next"
  node "AI Brain/scripts/brain.mjs" install-agent-pointer "Project Name" "/path/to/repo" "Laptop"

Session protocol (in-flight coordination):
  node "AI Brain/scripts/brain.mjs" whoami ["Machine or hostname"]       # resolve to the canonical machine folder
  node "AI Brain/scripts/brain.mjs" startup "Laptop" --agent "Claude Code" --project "Project Name" --focus "What I'm doing"
  node "AI Brain/scripts/brain.mjs" activity "Laptop" --session "<session_id>" --focus "Updated focus"
  node "AI Brain/scripts/brain.mjs" idle "Laptop" --session "<session_id>"  # --session optional when only one is active
  node "AI Brain/scripts/brain.mjs" reap "Laptop" [--hours 48]              # remove ghost sessions (no heartbeat in N hours; terminal kills skip SessionEnd)
  node "AI Brain/scripts/brain.mjs" snapshot                            # who's doing what across all machines

Wiki layer:
  node "AI Brain/scripts/brain.mjs" log-event ingest|query|lint|daily|note "Subject"
  node "AI Brain/scripts/brain.mjs" daily "Laptop"                          # rollup today's sessions into AI Brain/Daily/

Agent installers (one-shot setup of agent flavor on this machine):
  node "AI Brain/scripts/brain.mjs" codex-install "Laptop" [--force]        # append/refresh canonical AI Brain block in ~/.codex/AGENTS.md (idempotent)
  node "AI Brain/scripts/brain.mjs" install-claude-skills [--force]     # copy ALL canonical skills (any dir with SKILL.md, incl. scripts/) from vault → ~/.claude/skills/
  node "AI Brain/scripts/brain.mjs" install-claude-hook [--force]       # wire SessionStart auto-sync hook into ~/.claude/settings.json

Inventory & misc:
  node "AI Brain/scripts/brain.mjs" scan-repos "/path/with/projects"
  node "AI Brain/scripts/brain.mjs" status

Never stores secrets, credentials, or full chat transcripts.
`);
}

function requireName(value, label) {
  if (!value || !value.trim()) {
    console.error(`Missing ${label}.`);
    help();
    process.exit(1);
  }

  return value.trim();
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function timestampParts(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}${pad(date.getMinutes())}`,
  };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readTextIfExists(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return "";
    throw error;
  }
}

async function readMachineAliases() {
  const content = await readTextIfExists(machineAliasesPath);
  if (!content.trim()) return {};

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in ${machineAliasesPath}: ${error.message}`);
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`${machineAliasesPath} must contain a JSON object of alias-to-machine mappings.`);
  }

  const aliases = {};
  for (const [alias, target] of Object.entries(parsed)) {
    if (!alias.trim() || typeof target !== "string" || !target.trim()) {
      throw new Error(`${machineAliasesPath} contains an invalid alias mapping for ${JSON.stringify(alias)}.`);
    }
    aliases[alias.trim()] = target.trim();
  }

  return aliases;
}

function resolveAliasChain(name, aliases) {
  let current = name;
  const seen = new Set();

  while (true) {
    const key = Object.keys(aliases).find((alias) => alias.toLowerCase() === current.toLowerCase());
    if (!key) return current;

    const normalizedKey = key.toLowerCase();
    if (seen.has(normalizedKey)) {
      throw new Error(`Machine alias cycle detected at ${key} in ${machineAliasesPath}.`);
    }
    seen.add(normalizedKey);
    current = aliases[key];
  }
}

async function machineDirectoryNames() {
  let entries;
  try {
    entries = await readdir(machinesDir, { withFileTypes: true });
  } catch (error) {
    // Fresh vault: Machines/ doesn't exist yet (before any init-machine).
    // Treat as "no machines registered" rather than crashing whoami/snapshot.
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

async function resolveMachineName(value = os.hostname()) {
  const requested = requireName(value || os.hostname(), "machine name");
  const aliases = await readMachineAliases();
  const resolved = resolveAliasChain(requested, aliases);
  const folders = await machineDirectoryNames();
  return folders.find((folder) => folder.toLowerCase() === resolved.toLowerCase()) || resolved;
}

async function machineInventory() {
  const aliases = await readMachineAliases();
  const folders = await machineDirectoryNames();
  const aliasKeys = new Set(Object.keys(aliases).map((alias) => alias.toLowerCase()));
  const machines = folders.filter((folder) => !aliasKeys.has(folder.toLowerCase()));
  const aliasesByCanonical = new Map();

  for (const alias of Object.keys(aliases)) {
    const resolved = resolveAliasChain(alias, aliases);
    const canonical = folders.find((folder) => folder.toLowerCase() === resolved.toLowerCase()) || resolved;
    const existing = aliasesByCanonical.get(canonical) || [];
    existing.push(alias);
    aliasesByCanonical.set(canonical, existing.sort());
  }

  return { aliases, aliasesByCanonical, machines };
}

async function whoami(machineArg) {
  const hostname = os.hostname();
  const requested = (machineArg && machineArg.trim()) || hostname;
  const canonical = await resolveMachineName(requested);
  const { aliasesByCanonical } = await machineInventory();
  const folderPath = path.join(machinesDir, canonical);
  const aliases = aliasesByCanonical.get(canonical) || [];

  console.log(`hostname:   ${hostname}`);
  console.log(`requested:  ${requested}`);
  console.log(`canonical:  ${canonical}`);
  console.log(`registered: ${(await exists(folderPath)) ? "yes" : "no"}`);
  console.log(`folder:     ${path.relative(vaultRoot, folderPath)}`);
  if (aliases.length) console.log(`aliases:    ${aliases.join(", ")}`);
}

function parseOptions(values) {
  const options = {};

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (!value.startsWith("--")) continue;

    const key = value.slice(2);
    const next = values[index + 1];

    if (!next || next.startsWith("--")) {
      options[key] = "true";
    } else {
      options[key] = next;
      index += 1;
    }
  }

  return options;
}

function multilineList(value, fallback) {
  if (!value || !value.trim()) return `- ${fallback}`;

  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith("- ") || line.startsWith("- [ ] ") ? line : `- ${line}`))
    .join("\n");
}

async function copyTemplate(templateRelativePath, destinationPath, replacements) {
  if (await exists(destinationPath)) {
    console.log(`exists: ${path.relative(vaultRoot, destinationPath)}`);
    return;
  }

  const templatePath = path.join(templatesRoot, templateRelativePath);
  let content = await readFile(templatePath, "utf8");

  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }

  await writeFile(destinationPath, content, "utf8");
  console.log(`created: ${path.relative(vaultRoot, destinationPath)}`);
}

async function initMachine(name) {
  const machineName = await resolveMachineName(name);
  const destinationDir = path.join(brainRoot, "Machines", machineName);
  const { date } = timestampParts();

  await mkdir(destinationDir, { recursive: true });

  for (const [templateName, outputName] of files.machine) {
    await copyTemplate(templateName, path.join(destinationDir, outputName), {
      MACHINE_NAME: machineName,
      DATE: date,
    });
  }
}

async function initProject(name) {
  const projectName = requireName(name, "project name");
  const destinationDir = path.join(brainRoot, "Projects", projectName);
  const sessionsDir = path.join(destinationDir, "Sessions");
  const { date } = timestampParts();

  await mkdir(sessionsDir, { recursive: true });

  for (const [templateName, outputName] of files.project) {
    await copyTemplate(templateName, path.join(destinationDir, outputName), {
      PROJECT_NAME: projectName,
      DATE: date,
    });
  }
}

async function ensureProject(name) {
  const projectName = requireName(name, "project name");
  const overviewPath = path.join(brainRoot, "Projects", projectName, "Overview.md");

  if (!(await exists(overviewPath))) {
    await initProject(projectName);
  }

  return projectName;
}

async function newSession(projectArg, titleArg, machineArg) {
  const projectName = requireName(projectArg, "project name");
  const title = requireName(titleArg || "Session summary", "session title");
  const machineName = await resolveMachineName(machineArg || os.hostname());
  const { date, time } = timestampParts();
  const sessionsDir = path.join(brainRoot, "Projects", projectName, "Sessions");

  await mkdir(sessionsDir, { recursive: true });

  const fileName = `${date}-${time}-${slug(title) || "session"}.md`;
  const destinationPath = path.join(sessionsDir, fileName);

  await copyTemplate("session/session-summary.md", destinationPath, {
    PROJECT_NAME: projectName,
    MACHINE_NAME: machineName,
    SESSION_TITLE: title,
    DATE: date,
  });
}

async function closeout(projectArg, titleArg, machineArg, optionArgs) {
  const projectName = await ensureProject(projectArg);
  const title = requireName(titleArg || "Session closeout", "session title");
  const machineName = await resolveMachineName(machineArg || os.hostname());
  const options = parseOptions(optionArgs);
  const { date, time } = timestampParts();
  const projectDir = path.join(brainRoot, "Projects", projectName);
  const sessionsDir = path.join(projectDir, "Sessions");
  const machineDir = path.join(brainRoot, "Machines", machineName);
  const sessionLogPath = path.join(machineDir, "Session Log.md");

  await mkdir(sessionsDir, { recursive: true });
  await mkdir(machineDir, { recursive: true });

  const fileName = `${date}-${time}-${slug(title) || "session"}.md`;
  const destinationPath = path.join(sessionsDir, fileName);
  const summary = multilineList(options.summary, "TODO: summarize what happened");
  const changes = multilineList(options.changes, "TODO: list files, repos, or areas touched");
  const decisions = multilineList(options.decisions, "None recorded");
  const questions = multilineList(options.questions, "None recorded");
  const nextSteps = multilineList(options.next, "TODO: add next action");
  const references = multilineList(options.refs, "None");

  const content = `# ${date} - ${title}

Project: ${projectName}
Machine: ${machineName}
Date: ${date}

## Goal

${multilineList(options.goal, "TODO: capture the session goal")}

## Summary

${summary}

## Changes Made

${changes}

## Decisions

${decisions}

## Open Questions

${questions}

## Next Steps

${nextSteps}

## References

${references}
`;

  if (await exists(destinationPath)) {
    console.error(`Session already exists: ${path.relative(vaultRoot, destinationPath)}`);
    process.exit(1);
  }

  await writeFile(destinationPath, content, "utf8");

  const existingLog = await readTextIfExists(sessionLogPath);
  const logEntry = `
## ${date} ${time} - ${title}

- Project: ${projectName}
- Summary: ${options.summary || "TODO"}
- Files or areas touched: ${options.changes || "TODO"}
- Decisions: ${options.decisions || "None recorded"}
- Next: ${options.next || "TODO"}
`;

  await writeFile(sessionLogPath, `${existingLog.trimEnd()}\n${logEntry}`, "utf8");

  console.log(`created: ${path.relative(vaultRoot, destinationPath)}`);
  console.log(`updated: ${path.relative(vaultRoot, sessionLogPath)}`);
  console.log("Next: update Current State.md and Next Steps.md if the project state changed.");
}

function agentPointerContent(projectName, repoPath, machineName) {
  const sharedDir = path.join(brainRoot, "Shared");
  const machineDir = path.join(brainRoot, "Machines", machineName);
  const projectDir = path.join(brainRoot, "Projects", projectName);
  const scriptPath = path.join(brainRoot, "scripts", "brain.mjs");

  return `<!-- AI_BRAIN_MEMORY_START -->
## Shared AI Brain Memory

This repo uses the Obsidian AI Brain vault for long-term Codex memory.

Before meaningful work, read:

- \`${path.join(sharedDir, "Profile.md")}\`
- \`${path.join(sharedDir, "Preferences.md")}\`
- \`${path.join(sharedDir, "Active Projects.md")}\`
- \`${path.join(sharedDir, "Open Loops.md")}\`
- \`${path.join(machineDir, "Current Context.md")}\`
- \`${path.join(machineDir, "Local Setup.md")}\`
- \`${path.join(projectDir, "Overview.md")}\`
- \`${path.join(projectDir, "Current State.md")}\`
- \`${path.join(projectDir, "Next Steps.md")}\`
- \`${path.join(projectDir, "Decisions.md")}\`

During work:

- Store durable facts, decisions, next steps, and open questions in AI Brain.
- Do not store secrets, credentials, raw terminal logs, or full chat transcripts.
- Prefer concise summaries with links to repo files, commits, PRs, or docs.

Before ending a meaningful session:

1. Update the project \`Current State.md\` and \`Next Steps.md\`.
2. Update machine \`Current Context.md\` if local state changed.
3. Add a short session summary with:

\`\`\`sh
node "${scriptPath}" closeout "${projectName}" "Short session title" "${machineName}" --summary "What changed" --next "Next action"
\`\`\`

AI Brain project memory: \`${projectDir}\`
Local repo path when pointer was installed: \`${repoPath}\`
<!-- AI_BRAIN_MEMORY_END -->`;
}

async function installAgentPointer(projectArg, repoPathArg, machineArg) {
  const projectName = await ensureProject(projectArg);
  const repoPath = path.resolve(requireName(repoPathArg, "repo path"));
  const machineName = await resolveMachineName(machineArg || os.hostname());
  const agentsPath = path.join(repoPath, "AGENTS.md");
  const existing = await readTextIfExists(agentsPath);
  const pointer = agentPointerContent(projectName, repoPath, machineName);
  const markerPattern = /<!-- AI_BRAIN_MEMORY_START -->[\s\S]*?<!-- AI_BRAIN_MEMORY_END -->/;
  const nextContent = markerPattern.test(existing)
    ? existing.replace(markerPattern, pointer)
    : `${existing.trimEnd()}${existing.trim() ? "\n\n" : ""}${pointer}\n`;

  await writeFile(agentsPath, nextContent, "utf8");
  console.log(`updated: ${agentsPath}`);
  console.log(`project memory: ${path.join(brainRoot, "Projects", projectName)}`);
}

async function status() {
  const projectsDir = path.join(brainRoot, "Projects");
  const { aliases, machines } = await machineInventory();
  const projects = (await readdir(projectsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
  const recentSessions = [];

  for (const projectName of projects) {
    const sessionsDir = path.join(projectsDir, projectName, "Sessions");
    if (!(await exists(sessionsDir))) continue;

    for (const entry of await readdir(sessionsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const filePath = path.join(sessionsDir, entry.name);
      const fileStat = await stat(filePath);
      recentSessions.push({
        projectName,
        name: entry.name,
        mtime: fileStat.mtime,
      });
    }
  }

  recentSessions.sort((left, right) => right.mtime - left.mtime);

  console.log("AI Brain status\n");
  console.log(`Vault: ${vaultRoot}`);
  console.log(`Brain: ${brainRoot}\n`);
  console.log(`Machines (${machines.length}):`);
  for (const machine of machines) console.log(`- ${machine}`);
  if (Object.keys(aliases).length) {
    console.log("\nMachine aliases:");
    for (const [alias, canonical] of Object.entries(aliases)) console.log(`- ${alias} -> ${canonical}`);
  }
  console.log(`\nProjects (${projects.length}):`);
  for (const project of projects) console.log(`- ${project}`);
  console.log("\nRecent sessions:");
  for (const session of recentSessions.slice(0, 8)) {
    console.log(`- ${session.projectName}: ${session.name}`);
  }
}

async function findGitRepos(rootDir, maxDepth = 3, depth = 0, results = []) {
  if (depth > maxDepth) return results;

  const gitDir = path.join(rootDir, ".git");
  if (await exists(gitDir)) {
    results.push(rootDir);
    return results;
  }

  let entries = [];
  try {
    entries = await readdir(rootDir, { withFileTypes: true });
  } catch {
    return results;
  }

  const ignored = new Set([
    ".Trash",
    ".cache",
    ".codex",
    ".git",
    ".npm",
    "Library",
    "node_modules",
    "Pods",
    "vendor",
  ]);

  for (const entry of entries) {
    if (!entry.isDirectory() || ignored.has(entry.name)) continue;
    if (entry.name.startsWith(".") && entry.name !== ".config") continue;
    await findGitRepos(path.join(rootDir, entry.name), maxDepth, depth + 1, results);
  }

  return results;
}

async function scanRepos(rootArg) {
  const rootDir = path.resolve(requireName(rootArg || process.cwd(), "root path"));
  const repos = (await findGitRepos(rootDir)).sort();

  console.log(`Found ${repos.length} git repos under ${rootDir}\n`);

  for (const repoPath of repos) {
    const agentsPath = path.join(repoPath, "AGENTS.md");
    const agents = await readTextIfExists(agentsPath);
    const isVault = repoPath === vaultRoot;
    const hasPointer = isVault || agents.includes("AI_BRAIN_MEMORY_START");
    const projectName = path.basename(repoPath);
    const statusLabel = isVault ? "vault  " : hasPointer ? "linked " : "missing";

    console.log(`${statusLabel}  ${projectName}  ${repoPath}`);
  }

  console.log("\nTo link one repo:");
  console.log('node "AI Brain/scripts/brain.mjs" install-agent-pointer "Project Name" "/path/to/repo" "Laptop"');
}

function formatTimestamp(date = new Date()) {
  const { date: d, time: t } = timestampParts(date);
  const hhmm = `${t.slice(0, 2)}:${t.slice(2, 4)}`;
  return `${d} ${hhmm}`;
}

function buildActivityFrontmatter({
  status,
  agent,
  sessionId,
  started,
  project,
  focus,
  lastHeartbeat,
  machine,
  cwd,
}) {
  const titleSuffix = sessionId && sessionId !== "multiple" && status !== "idle" ? ` / ${sessionId}` : "";
  const description = sessionId === "multiple"
    ? "Compatibility aggregate for concurrent sessions. Run `brain.mjs snapshot` for per-session details; do not edit this file directly."
    : status === "idle"
      ? "Compatibility summary of the most recently closed session. Historical record lives in `Session Log.md`."
      : "One in-flight session on this machine. Removed when that session is marked idle; historical record lives in `Session Log.md`.";
  return `---
status: ${status}
agent: ${agent}
session_id: ${sessionId}
started: ${started}
project: ${project}
focus: ${focus}
last_heartbeat: ${lastHeartbeat}
machine: ${machine}
cwd: ${cwd}
---

# Current Activity - ${machine}${titleSuffix}

${description}
`;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

function isLiveActivity(meta) {
  return meta.status === "active" || meta.status === "paused";
}

function requireSessionId(value) {
  const sessionId = requireName(value, "session id");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(sessionId)) {
    console.error(`Invalid session id: ${sessionId}`);
    process.exit(1);
  }
  return sessionId;
}

function newActivitySessionId(agent, now = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${slug(agent) || "agent"}-${date}-${time}-${randomUUID().slice(0, 8)}`;
}

function activitySessionsDir(machineName) {
  return path.join(machinesDir, machineName, "Activities");
}

function activitySessionPath(machineName, sessionId) {
  return path.join(activitySessionsDir(machineName), `${requireSessionId(sessionId)}.md`);
}

async function readSessionActivities(machineName) {
  const sessionsDir = activitySessionsDir(machineName);
  if (!(await exists(sessionsDir))) return [];

  const sessions = [];
  for (const entry of await readdir(sessionsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const filePath = path.join(sessionsDir, entry.name);
    const content = await readTextIfExists(filePath);
    const meta = parseFrontmatter(content);
    if (!isLiveActivity(meta)) continue;
    sessions.push({ content, filePath, meta });
  }

  return sessions.sort((left, right) =>
    (left.meta.started || "").localeCompare(right.meta.started || "") ||
    (left.meta.session_id || "").localeCompare(right.meta.session_id || ""),
  );
}

async function importLegacyActivity(machineName) {
  const legacyPath = path.join(machinesDir, machineName, "Current Activity.md");
  const content = await readTextIfExists(legacyPath);
  const meta = parseFrontmatter(content);
  if (!isLiveActivity(meta) || !meta.session_id || meta.session_id === "multiple") return null;

  const sessionId = requireSessionId(meta.session_id);
  const sessionPath = activitySessionPath(machineName, sessionId);
  if (!(await exists(sessionPath))) {
    await mkdir(path.dirname(sessionPath), { recursive: true });
    await writeFile(sessionPath, content, "utf8");
    console.log(`migrated: ${path.relative(vaultRoot, legacyPath)} -> ${path.relative(vaultRoot, sessionPath)}`);
  }
  return sessionPath;
}

async function rebuildCurrentActivity(machineName, fallbackMeta = {}) {
  const activityPath = path.join(machinesDir, machineName, "Current Activity.md");
  const sessions = await readSessionActivities(machineName);

  if (sessions.length === 1) {
    await writeFile(activityPath, sessions[0].content, "utf8");
    return;
  }

  const now = new Date();
  const stamp = formatTimestamp(now);
  if (sessions.length > 1) {
    const activeCount = sessions.filter(({ meta }) => meta.status === "active").length;
    const latestHeartbeat = sessions
      .map(({ meta }) => meta.last_heartbeat || "")
      .sort()
      .at(-1) || stamp;
    const earliestStart = sessions
      .map(({ meta }) => meta.started || stamp)
      .sort()[0];
    const status = activeCount > 0 ? "active" : "paused";
    const content = buildActivityFrontmatter({
      status,
      agent: "Multiple",
      sessionId: "multiple",
      started: earliestStart,
      project: `Multiple (${sessions.length} sessions)`,
      focus: `${sessions.length} concurrent sessions; run brain.mjs snapshot for details`,
      lastHeartbeat: latestHeartbeat,
      machine: machineName,
      cwd: "Multiple",
    });
    await writeFile(activityPath, content, "utf8");
    return;
  }

  const existing = parseFrontmatter(await readTextIfExists(activityPath));
  const content = buildActivityFrontmatter({
    status: "idle",
    agent: fallbackMeta.agent || existing.agent || "—",
    sessionId: fallbackMeta.session_id || existing.session_id || "—",
    started: fallbackMeta.started || existing.started || stamp,
    project: fallbackMeta.project || existing.project || "—",
    focus: "(idle)",
    lastHeartbeat: stamp,
    machine: machineName,
    cwd: fallbackMeta.cwd || existing.cwd || "—",
  });
  await writeFile(activityPath, content, "utf8");
}

async function selectSessionActivity(machineName, requestedSessionId, action) {
  await importLegacyActivity(machineName);
  const sessions = await readSessionActivities(machineName);

  if (requestedSessionId) {
    const sessionId = requireSessionId(requestedSessionId);
    const match = sessions.find(({ meta }) => meta.session_id === sessionId);
    if (!match) {
      console.error(`No active session ${sessionId} for ${machineName}. Run snapshot to list active sessions.`);
      process.exit(1);
    }
    return match;
  }

  if (sessions.length === 1) return sessions[0];
  if (sessions.length === 0) return null;

  console.error(`Multiple active sessions exist for ${machineName}; pass --session <session_id> to ${action}.`);
  for (const { meta } of sessions) {
    console.error(`- ${meta.session_id}: ${meta.project} — ${meta.focus}`);
  }
  process.exit(1);
}

async function startup(machineArg, optionArgs) {
  const machineName = await resolveMachineName(machineArg || os.hostname());
  const options = parseOptions(optionArgs);
  const agent = options.agent || "Unknown agent";
  const project = options.project || "Unknown";
  const focus = options.focus || "Starting work";
  const cwd = options.cwd || process.cwd();
  const machineDir = path.join(brainRoot, "Machines", machineName);

  await mkdir(machineDir, { recursive: true });
  await importLegacyActivity(machineName);

  const now = new Date();
  const sessionId = newActivitySessionId(agent, now);
  const stamp = formatTimestamp(now);

  const content = buildActivityFrontmatter({
    status: "active",
    agent,
    sessionId,
    started: stamp,
    project,
    focus,
    lastHeartbeat: stamp,
    machine: machineName,
    cwd,
  });

  const sessionPath = activitySessionPath(machineName, sessionId);
  await mkdir(path.dirname(sessionPath), { recursive: true });
  await writeFile(sessionPath, content, "utf8");
  await rebuildCurrentActivity(machineName);
  console.log(`updated: ${path.relative(vaultRoot, sessionPath)}`);
  console.log(`session_id: ${sessionId}`);
}

async function activity(machineArg, optionArgs) {
  const machineName = await resolveMachineName(machineArg || os.hostname());
  const options = parseOptions(optionArgs);
  const selected = await selectSessionActivity(machineName, options.session, "update activity");
  if (!selected) {
    console.error(`No active session for ${machineName}. Run startup first.`);
    process.exit(1);
  }

  const meta = selected.meta;
  const now = new Date();
  const stamp = formatTimestamp(now);

  const updated = buildActivityFrontmatter({
    status: options.status || meta.status || "active",
    agent: options.agent || meta.agent || "Unknown",
    sessionId: meta.session_id || "unknown",
    started: meta.started || stamp,
    project: options.project || meta.project || "Unknown",
    focus: options.focus || meta.focus || "Working",
    lastHeartbeat: stamp,
    machine: machineName,
    cwd: options.cwd || meta.cwd || process.cwd(),
  });

  await writeFile(selected.filePath, updated, "utf8");
  await rebuildCurrentActivity(machineName);
  console.log(`heartbeat: ${path.relative(vaultRoot, selected.filePath)} @ ${stamp}`);
  console.log(`session_id: ${meta.session_id}`);
}

async function idle(machineArg, optionArgs) {
  const machineName = await resolveMachineName(machineArg || os.hostname());
  const options = parseOptions(optionArgs);
  await importLegacyActivity(machineName);
  const sessions = await readSessionActivities(machineName);

  if (options.all === "true") {
    for (const session of sessions) await unlink(session.filePath);
    await rebuildCurrentActivity(machineName, sessions.at(-1)?.meta || {});
    console.log(`idle: ${machineName} (${sessions.length} session${sessions.length === 1 ? "" : "s"} cleared)`);
    return;
  }

  const selected = await selectSessionActivity(machineName, options.session, "mark idle");
  if (!selected) {
    await rebuildCurrentActivity(machineName);
    console.log(`idle: ${path.relative(vaultRoot, path.join(machinesDir, machineName, "Current Activity.md"))}`);
    return;
  }

  await unlink(selected.filePath);
  await rebuildCurrentActivity(machineName, selected.meta);
  console.log(`idle: ${path.relative(vaultRoot, selected.filePath)}`);
  console.log(`session_id: ${selected.meta.session_id}`);
}

async function reap(machineArg, optionArgs) {
  const machineName = await resolveMachineName(machineArg || os.hostname());
  const options = parseOptions(optionArgs);
  const hours = Number(options.hours || 48);
  if (!Number.isFinite(hours) || hours <= 0) {
    console.error(`Invalid --hours value: ${options.hours}`);
    process.exit(1);
  }
  const cutoffStamp = formatTimestamp(new Date(Date.now() - hours * 3600 * 1000));

  await importLegacyActivity(machineName);
  const sessions = await readSessionActivities(machineName);
  let removed = 0;
  for (const session of sessions) {
    // Ghost = no heartbeat within the window. Sessions die without cleanup when a
    // terminal is killed (SessionEnd hooks never fire), so anything this stale is dead.
    const heartbeat = session.meta.last_heartbeat || session.meta.started || "";
    if (heartbeat && heartbeat < cutoffStamp) {
      await unlink(session.filePath);
      removed += 1;
      console.log(`reaped: ${path.relative(vaultRoot, session.filePath)} (heartbeat ${heartbeat})`);
    }
  }
  if (removed > 0) await rebuildCurrentActivity(machineName);
  console.log(`reap: ${machineName} — ${removed} stale session(s) removed (heartbeat older than ${cutoffStamp})`);
}

async function snapshot() {
  const { aliasesByCanonical, machines } = await machineInventory();

  console.log("\nIn-flight activity across all machines:\n");
  for (const machineName of machines) {
    const sessions = await readSessionActivities(machineName);
    const aliases = aliasesByCanonical.get(machineName) || [];
    const displayName = aliases.length ? `${machineName} (aliases: ${aliases.join(", ")})` : machineName;
    if (sessions.length) {
      const machineFlag = sessions.some(({ meta }) => meta.status === "active") ? "ACTIVE " : "PAUSED ";
      console.log(`  ${machineFlag} ${displayName}  sessions=${sessions.length}`);
      for (const { meta } of sessions) {
        const flag = meta.status === "active" ? "ACTIVE " : "PAUSED ";
        console.log(`    ${flag} ${meta.session_id || "?"}  agent=${meta.agent || "?"}  project=${meta.project || "?"}`);
        console.log(`             focus: ${meta.focus || "?"}`);
        console.log(`             started: ${meta.started || "?"}   heartbeat: ${meta.last_heartbeat || "?"}`);
      }
      continue;
    }

    const activityPath = path.join(machinesDir, machineName, "Current Activity.md");
    const content = await readTextIfExists(activityPath);
    if (!content) {
      console.log(`  ${machineName}: (no Current Activity file)`);
      continue;
    }
    const meta = parseFrontmatter(content);
    const flag = meta.status === "active" ? "ACTIVE " : meta.status === "paused" ? "PAUSED " : "idle   ";
    console.log(`  ${flag} ${displayName}  agent=${meta.agent || "?"}  project=${meta.project || "?"}`);
    console.log(`           focus: ${meta.focus || "?"}`);
    console.log(`           started: ${meta.started || "?"}   heartbeat: ${meta.last_heartbeat || "?"}`);
  }
  console.log("");
}

async function logEvent(kindArg, subjectArg) {
  const kind = requireName(kindArg, "event kind");
  const subject = requireName(subjectArg, "event subject");
  const allowed = new Set(["ingest", "query", "lint", "daily", "note"]);
  if (!allowed.has(kind)) {
    console.error(`Unknown event kind: ${kind}. Allowed: ${[...allowed].join(", ")}`);
    process.exit(1);
  }

  const existing = await readTextIfExists(vaultLogPath);
  const stamp = formatTimestamp(new Date());
  const entry = `\n## [${stamp}] ${kind} | ${subject}\n`;
  await writeFile(vaultLogPath, `${existing.trimEnd()}\n${entry}`, "utf8");
  console.log(`logged: [${stamp}] ${kind} | ${subject}`);
}

async function daily(machineArg) {
  const machineName = await resolveMachineName(machineArg || os.hostname());
  const projectsDir = path.join(brainRoot, "Projects");
  const projects = (await readdir(projectsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();

  const now = new Date();
  const { date } = timestampParts(now);
  const todayPrefix = date;
  const sessionsToday = [];

  for (const projectName of projects) {
    const sessionsDir = path.join(projectsDir, projectName, "Sessions");
    if (!(await exists(sessionsDir))) continue;
    for (const entry of await readdir(sessionsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      if (!entry.name.startsWith(todayPrefix)) continue;
      sessionsToday.push({ projectName, file: entry.name });
    }
  }

  await mkdir(dailyDir, { recursive: true });
  const outPath = path.join(dailyDir, `${date}.md`);
  const projectsTouched = [...new Set(sessionsToday.map((s) => s.projectName))];
  const sessionsBlock = sessionsToday.length
    ? sessionsToday
        .map((s) => `- [[AI Brain/Projects/${s.projectName}/Sessions/${s.file.replace(/\.md$/, "")}]] (${s.projectName})`)
        .join("\n")
    : "- (no session files written today)";
  const projectsBlock = projectsTouched.length
    ? projectsTouched.map((p) => `- ${p}`).join("\n")
    : "- (none)";

  const todayLogEntries = (await readTextIfExists(vaultLogPath))
    .split(/\n## \[/)
    .filter((chunk) => chunk.startsWith(date))
    .map((chunk) => `- [${chunk.split("\n")[0]}`)
    .join("\n");

  const content = `# Daily Summary - ${date}

Generated: ${formatTimestamp(now)}
Machine: ${machineName}

## Sessions today

${sessionsBlock}

## Projects touched

${projectsBlock}

## Wiki events today (from log.md)

${todayLogEntries || "- (none)"}

## Decisions made

- (review session files above and summarize here)

## Open loops added or resolved

- (check AI Brain/Shared/Open Loops.md diff)

## Notes for tomorrow

- (what should the next session pick up?)
`;

  await writeFile(outPath, content, "utf8");
  console.log(`wrote: ${path.relative(vaultRoot, outPath)}`);

  const existingLog = await readTextIfExists(vaultLogPath);
  const stamp = formatTimestamp(now);
  const entry = `\n## [${stamp}] daily | Rollup written for ${date} (${sessionsToday.length} session(s), ${projectsTouched.length} project(s))\n`;
  await writeFile(vaultLogPath, `${existingLog.trimEnd()}\n${entry}`, "utf8");
}

async function codexInstall(machineArg, optionArgs = []) {
  const machineName = await resolveMachineName(machineArg || os.hostname());
  const options = parseOptions(optionArgs);
  const force = options.force === "true" || options.force === true;
  const snippetPath = path.join(brainRoot, "docs", "codex-agents-snippet.md");
  const codexAgentsPath = path.join(os.homedir(), ".codex", "AGENTS.md");

  const snippet = await readTextIfExists(snippetPath);
  if (!snippet) {
    console.error(`Canonical snippet not found: ${snippetPath}`);
    console.error("Run from a fully bootstrapped vault, or git pull to fetch it.");
    process.exit(1);
  }

  const sentinelStart = "<!-- AI_BRAIN_CODEX_SECTION_START -->";
  const sentinelEnd = "<!-- AI_BRAIN_CODEX_SECTION_END -->";
  const startIdx = snippet.indexOf(sentinelStart);
  const endIdx = snippet.indexOf(sentinelEnd);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.error(`Could not find sentinel markers in ${snippetPath}.`);
    console.error(`Expected ${sentinelStart} ... ${sentinelEnd}. Check the snippet file structure.`);
    process.exit(1);
  }

  const block = snippet
    .slice(startIdx, endIdx + sentinelEnd.length)
    .replaceAll("<MACHINE>", machineName)
    .replaceAll("<VAULT>", vaultRoot);

  const existing = await readTextIfExists(codexAgentsPath);
  // Match the full installed section by sentinels (preferred). Fall back to
  // matching from "### Obsidian AI Brain Memory" through the start of the next
  // top-level marker for sections installed before sentinels existed.
  const sentinelRegex = new RegExp(
    `${sentinelStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${sentinelEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );
  const legacyRegex = /### Obsidian AI Brain Memory[\s\S]*?(?=\n### |\n## |\n<!-- |\n<claude-mem-context>|$)/;
  const sectionRegex = sentinelRegex.test(existing) ? sentinelRegex : legacyRegex;

  const hasExistingSection = existing.includes("### Obsidian AI Brain Memory") || sentinelRegex.test(existing);

  if (hasExistingSection && !force) {
    console.log(`already present: ${codexAgentsPath} already contains an AI Brain section — not modifying.`);
    console.log("Use --force to refresh the section with the latest canonical content.");
    return;
  }

  await mkdir(path.dirname(codexAgentsPath), { recursive: true });
  let nextContent;
  if (hasExistingSection && force) {
    nextContent = existing.replace(sectionRegex, block.trimEnd());
    console.log(`refreshed: ${codexAgentsPath} (replaced existing AI Brain section)`);
  } else {
    const separator = existing.trim() ? "\n\n" : "";
    nextContent = `${existing.trimEnd()}${separator}${block.trimEnd()}\n`;
    console.log(`appended canonical AI Brain block to: ${codexAgentsPath}`);
  }

  await writeFile(codexAgentsPath, nextContent, "utf8");
  console.log(`  machine: ${machineName}`);
  console.log(`  vault:   ${vaultRoot}`);
  console.log("Restart any open Codex session for the new config to take effect.");
}

async function installClaudeHook(optionArgs) {
  const options = parseOptions(optionArgs);
  const force = options.force === "true" || options.force === true;
  const settingsPath = path.join(os.homedir(), ".claude", "settings.json");
  const hookScriptPath = path.join(brainRoot, "scripts", "hooks", "brain-skill-sync.sh");

  if (!(await exists(hookScriptPath))) {
    console.error(`Hook script missing: ${hookScriptPath}`);
    console.error("Run git pull on the vault first.");
    process.exit(1);
  }

  if (!(await exists(settingsPath))) {
    console.error(`Claude Code settings not found at: ${settingsPath}`);
    console.error("Is Claude Code installed and has it been run at least once?");
    process.exit(1);
  }

  const settingsRaw = await readFile(settingsPath, "utf8");
  let settings;
  try {
    settings = JSON.parse(settingsRaw);
  } catch (err) {
    console.error(`Failed to parse ${settingsPath}: ${err.message}`);
    console.error("Settings file may be malformed. Fix it manually before retrying.");
    process.exit(1);
  }

  const hookCommand = `bash "${hookScriptPath}"`;
  const containsBrainSyncHook = (entry) =>
    entry && Array.isArray(entry.hooks) && entry.hooks.some((h) =>
      typeof h?.command === "string" && h.command.includes("brain-skill-sync.sh"),
    );

  settings.hooks = settings.hooks || {};
  settings.hooks.SessionStart = Array.isArray(settings.hooks.SessionStart)
    ? settings.hooks.SessionStart
    : [];

  const alreadyPresent = settings.hooks.SessionStart.some(containsBrainSyncHook);

  if (alreadyPresent && !force) {
    console.log("already present: brain-skill-sync hook is already wired into ~/.claude/settings.json");
    console.log("Use --force to refresh (updates the hook command path).");
    return;
  }

  if (alreadyPresent && force) {
    settings.hooks.SessionStart = settings.hooks.SessionStart.filter(
      (entry) => !containsBrainSyncHook(entry),
    );
  }

  settings.hooks.SessionStart.push({
    hooks: [
      {
        type: "command",
        command: hookCommand,
      },
    ],
  });

  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  console.log(`installed: brain-skill-sync hook → ${settingsPath} (SessionStart)`);
  console.log(`hook script: ${hookScriptPath}`);
  console.log("Takes effect on the NEXT Claude Code session start.");
}

async function installClaudeSkills(optionArgs) {
  const options = parseOptions(optionArgs);
  const force = options.force === "true" || options.force === true;
  const sourceRoot = path.join(brainRoot, "skills-claude-code");
  const targetRoot = path.join(os.homedir(), ".claude", "skills");

  if (!(await exists(sourceRoot))) {
    console.error(`Canonical skills directory not found: ${sourceRoot}`);
    console.error("Run from a fully bootstrapped vault, or git pull to fetch them.");
    process.exit(1);
  }

  // Dynamic: any directory under skills-claude-code/ with a SKILL.md is a canonical
  // skill. The whole directory is copied (skills may carry scripts/, references/, etc.).
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  const skillNames = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (await exists(path.join(sourceRoot, entry.name, "SKILL.md"))) skillNames.push(entry.name);
  }

  await mkdir(targetRoot, { recursive: true });

  let installed = 0;
  let skipped = 0;
  let updated = 0;

  for (const name of skillNames) {
    const sourceDir = path.join(sourceRoot, name);
    const targetDir = path.join(targetRoot, name);
    const targetExists = await exists(path.join(targetDir, "SKILL.md"));

    if (targetExists && !force) {
      console.log(`  exists:    ~/.claude/skills/${name}/ (use --force to overwrite)`);
      skipped += 1;
      continue;
    }

    await cp(sourceDir, targetDir, { recursive: true, force: true });

    if (targetExists) {
      console.log(`  updated:   ~/.claude/skills/${name}/`);
      updated += 1;
    } else {
      console.log(`  installed: ~/.claude/skills/${name}/`);
      installed += 1;
    }
  }

  console.log("");
  console.log(`Result: ${installed} installed, ${updated} updated, ${skipped} skipped (already present).`);
  if (installed + updated > 0) {
    console.log("Start a new Claude Code session for the skills to be picked up.");
  }
}

switch (command) {
  case "whoami":
    await whoami(args[1]);
    break;
  case "init-machine":
    await initMachine(args[1]);
    break;
  case "codex-install":
    await codexInstall(args[1], args.slice(2));
    break;
  case "install-claude-skills":
    await installClaudeSkills(args.slice(1));
    break;
  case "install-claude-hook":
    await installClaudeHook(args.slice(1));
    break;
  case "init-project":
    await initProject(args[1]);
    break;
  case "new-session":
    await newSession(args[1], args[2], args[3]);
    break;
  case "closeout":
    await closeout(args[1], args[2], args[3], args.slice(4));
    break;
  case "install-agent-pointer":
    await installAgentPointer(args[1], args[2], args[3]);
    break;
  case "scan-repos":
    await scanRepos(args[1]);
    break;
  case "status":
    await status();
    break;
  case "startup":
    await startup(args[1], args.slice(2));
    break;
  case "activity":
    await activity(args[1], args.slice(2));
    break;
  case "idle":
    await idle(args[1], args.slice(2));
    break;
  case "reap":
    await reap(args[1], args.slice(2));
    break;
  case "snapshot":
    await snapshot();
    break;
  case "log-event":
    await logEvent(args[1], args[2]);
    break;
  case "daily":
    await daily(args[1]);
    break;
  case "help":
  case undefined:
    help();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    help();
    process.exit(1);
}
