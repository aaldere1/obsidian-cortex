#!/usr/bin/env node
// Optional TypeSafe Jev (System One) gates for AI Brain.
// Jev classifies / routes / scores. It does not write prose or session files.
// Official HTTP: POST https://api.typesafe.ai/v1/systemone  (docs.typesafe.ai)

import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const TYPESAFE_ENDPOINT_PATH = "/v1/systemone";
export const DEFAULT_TYPESAFE_BASE_URL = "https://api.typesafe.ai";
export const DEFAULT_TYPESAFE_MODEL = "jev-latest";
export const DEFAULT_TIMEOUT_MS = 8000;
export const PROJECT_CONFIDENCE_MIN = 0.6;
export const CLOSEOUT_RICH_MIN = 0.6;
export const SCRUB_PERSONAL_MIN = 0.5;
export const SCRUB_PUBLIC_MAX = 0.35;
export const PROJECT_CANDIDATE_CAP = 20;
export const OTHER_OPTION = "other";

const HELPER_ENV_REL = path.join(".config", "typesafe-helper", "env");

export function abstractPath(value) {
  const parts = String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  return parts.at(-1) || "";
}

export function optionSlug(value) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "unnamed";
}

export function parseActiveProjectNames(markdown) {
  const names = [];
  const pattern = /`AI Brain\/Projects\/([^`]+?)\/`/g;
  let match;
  while ((match = pattern.exec(String(markdown || ""))) !== null) {
    const name = match[1].trim();
    if (name && !name.startsWith("_")) names.push(name);
  }
  return uniqueNames(names);
}

export function uniqueNames(values) {
  const seen = new Set();
  const out = [];
  for (const value of values || []) {
    const name = String(value || "").trim();
    if (!name || name.startsWith("_") || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

export function mergeProjectNames(activeNames, folderNames) {
  return uniqueNames([...(activeNames || []), ...(folderNames || [])]);
}

export function shortlistProjects(allNames, { guess = "", cwd = "" } = {}) {
  const names = uniqueNames(allNames);
  const guessName = String(guess || "").trim();
  const cwdName = abstractPath(cwd);
  const guessSlug = optionSlug(guessName);
  const cwdSlug = optionSlug(cwdName);

  const score = (name) => {
    const slug = optionSlug(name);
    if (name === guessName || name === cwdName) return 0;
    if (name.toLowerCase() === guessName.toLowerCase() || name.toLowerCase() === cwdName.toLowerCase()) {
      return 1;
    }
    if (slug === guessSlug || slug === cwdSlug) return 2;
    if (guessSlug && (slug.includes(guessSlug) || guessSlug.includes(slug))) return 3;
    if (cwdSlug && (slug.includes(cwdSlug) || cwdSlug.includes(slug))) return 4;
    return 10;
  };

  return [...names].sort((left, right) => {
    const delta = score(left) - score(right);
    return delta !== 0 ? delta : left.localeCompare(right);
  }).slice(0, PROJECT_CANDIDATE_CAP);
}

export function buildProjectCriteria(names) {
  const optionMap = { [OTHER_OPTION]: null };
  const criteria = {
    [OTHER_OPTION]: "None of these folders match; keep the caller's original guess unchanged.",
  };

  for (const name of uniqueNames(names)) {
    let key = optionSlug(name);
    let suffix = 2;
    while (Object.prototype.hasOwnProperty.call(criteria, key)) {
      key = `${optionSlug(name)}-${suffix}`;
      suffix += 1;
    }
    optionMap[key] = name;
    criteria[key] = `Project folder: ${name}`;
  }

  return { criteria, optionMap };
}

export async function readApiKey({ env = process.env, homedir = os.homedir, readFileFn = readFile, helperFile } = {}) {
  const fromEnv = String(env.TYPESAFE_API_KEY || "").trim();
  if (fromEnv) return { key: fromEnv, source: "env" };

  const helperPath = helperFile || path.join(homedir(), HELPER_ENV_REL);
  try {
    const text = await readFileFn(helperPath, "utf8");
    const key = parseHelperEnv(text);
    if (key) return { key, source: "typesafe-helper-env" };
  } catch {
    // Missing helper file is normal. Other read errors still fail-open.
  }
  return { key: "", source: "none" };
}

export function parseHelperEnv(text) {
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const stripped = line.replace(/^export\s+/, "");
    const match = stripped.match(/^TYPESAFE_API_KEY\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[1].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value) return value;
  }
  return "";
}

export function describeEnablement({ env = process.env, flags = {}, keyPresent = false } = {}) {
  const brainJev = String(env.BRAIN_JEV || "").trim();
  if (flags.noJev === true || brainJev === "0") {
    return { enabled: false, reason: "forced-off" };
  }
  if (flags.useJev === true || brainJev === "1") {
    return { enabled: true, reason: keyPresent ? "explicit-opt-in" : "explicit-opt-in-missing-key" };
  }
  if (keyPresent) return { enabled: true, reason: "key-present" };
  return { enabled: false, reason: "default-off" };
}

export async function jevStatus({ env = process.env, flags = {}, homedir = os.homedir, readFileFn = readFile, helperFile } = {}) {
  const resolved = await readApiKey({ env, homedir, readFileFn, helperFile });
  const enablement = describeEnablement({ env, flags, keyPresent: Boolean(resolved.key) });
  return {
    enabled: enablement.enabled,
    reason: enablement.reason,
    key_present: Boolean(resolved.key),
    key_source: resolved.source,
    endpoint: typesafeEndpoint(env),
    model: env.TYPESAFE_DEFAULT_MODEL || DEFAULT_TYPESAFE_MODEL,
  };
}

export function typesafeEndpoint(env = process.env) {
  const base = String(env.TYPESAFE_BASE_URL || DEFAULT_TYPESAFE_BASE_URL).replace(/\/+$/, "");
  return `${base}${TYPESAFE_ENDPOINT_PATH}`;
}

export function decideProjectChoice({
  guess = "",
  choice,
  confidence,
  optionMap = {},
  minConfidence = PROJECT_CONFIDENCE_MIN,
} = {}) {
  const fallback = String(guess || "").trim();
  if (!choice || choice === OTHER_OPTION) {
    return { used: false, project: fallback, reason: choice === OTHER_OPTION ? "other" : "no-choice" };
  }
  if (!Number.isFinite(Number(confidence)) || Number(confidence) < minConfidence) {
    return { used: false, project: fallback, reason: "low-confidence", choice, confidence: Number(confidence) };
  }
  const mapped = optionMap[choice];
  if (!mapped) {
    return { used: false, project: fallback, reason: "unknown-option", choice };
  }
  return { used: true, project: mapped, reason: "accepted", choice, confidence: Number(confidence) };
}

export function decideCloseoutRichness({ noul, min = CLOSEOUT_RICH_MIN } = {}) {
  if (!Number.isFinite(Number(noul))) {
    return { used: false, rich: null, reason: "no-noul" };
  }
  const value = Number(noul);
  return {
    used: true,
    rich: value >= min,
    noul: value,
    reason: value >= min ? "rich" : "not-rich",
  };
}

export function decidePersonalScrub({ noul, personalMin = SCRUB_PERSONAL_MIN, publicMax = SCRUB_PUBLIC_MAX } = {}) {
  if (!Number.isFinite(Number(noul))) {
    return { used: false, publish: false, personal: null, reason: "fail-safe" };
  }
  const value = Number(noul);
  if (value >= personalMin) {
    return { used: true, publish: false, personal: true, noul: value, reason: "personal-only" };
  }
  if (value <= publicMax) {
    return { used: true, publish: true, personal: false, noul: value, reason: "not-personal" };
  }
  return { used: true, publish: false, personal: null, noul: value, reason: "unsure" };
}

function publicErrorMessage(error) {
  if (!error) return "unknown-error";
  const message = String(error.message || error);
  return message.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 200);
}

export async function systemOne({
  state,
  questions,
  env = process.env,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  readFileFn = readFile,
  homedir = os.homedir,
  helperFile,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is not available in this Node runtime");
  }

  const resolved = await readApiKey({ env, homedir, readFileFn, helperFile });
  if (!resolved.key) throw new Error("missing-key");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(typesafeEndpoint(env), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resolved.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state,
        model: env.TYPESAFE_DEFAULT_MODEL || DEFAULT_TYPESAFE_MODEL,
        questions,
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`typesafe-http-${response.status}`);
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error("typesafe-invalid-json");
    }
    return payload;
  } catch (error) {
    if (error && error.name === "AbortError") throw new Error("typesafe-timeout");
    throw new Error(publicErrorMessage(error));
  } finally {
    clearTimeout(timer);
  }
}

async function gatedCall(kind, fallback, work, deps) {
  const { env = process.env, flags = {} } = deps;
  const resolved = await readApiKey(deps);
  const enablement = describeEnablement({ env, flags, keyPresent: Boolean(resolved.key) });
  if (!enablement.enabled) {
    return { gate: kind, enabled: false, used: false, reason: enablement.reason, ...fallback };
  }
  if (!resolved.key) {
    return { gate: kind, enabled: true, used: false, reason: "missing-key", ...fallback };
  }
  try {
    return { gate: kind, enabled: true, ...(await work(resolved)) };
  } catch (error) {
    return {
      gate: kind,
      enabled: true,
      used: false,
      reason: "api-error",
      error: publicErrorMessage(error),
      ...fallback,
    };
  }
}

export async function judgeProject(input = {}) {
  const {
    guess = "",
    cwd = "",
    focus = "",
    candidates,
    loadCandidates,
    flags = {},
    env = process.env,
    fetchImpl,
    timeoutMs,
    readFileFn,
    homedir,
    helperFile,
  } = input;
  const fallback = { project: String(guess || "").trim() };

  return gatedCall("project-choice", fallback, async () => {
    let names = Array.isArray(candidates) ? uniqueNames(candidates) : [];
    if (!names.length && typeof loadCandidates === "function") {
      names = uniqueNames(await loadCandidates());
    }
    const shortlist = shortlistProjects(names, { guess: fallback.project, cwd });
    const { criteria, optionMap } = buildProjectCriteria(shortlist);
    const payload = await systemOne({
      state: {
        caller_guess: fallback.project || "(none)",
        cwd_basename: abstractPath(cwd),
        focus: String(focus || "").slice(0, 160),
        candidate_folders: shortlist,
      },
      questions: {
        project: {
          type: "choice",
          instructions: "Which project folder best matches this working directory and caller guess?",
          criteria,
        },
      },
      env,
      fetchImpl,
      timeoutMs,
      readFileFn,
      homedir,
      helperFile,
    });
    const answer = payload?.answers?.project || {};
    return {
      ...decideProjectChoice({
        guess: fallback.project,
        choice: answer.choice,
        confidence: answer.confidence,
        optionMap,
      }),
      candidates: shortlist,
    };
  }, { env, flags, readFileFn, homedir, helperFile });
}

export async function judgeCloseoutRichness(input = {}) {
  const {
    hadCommits = false,
    hadFileEdits = false,
    hadPrOrShip = false,
    durationBand = "unknown",
    flags = {},
    env = process.env,
    fetchImpl,
    timeoutMs,
    readFileFn,
    homedir,
    helperFile,
  } = input;

  const fallback = { rich: null };
  return gatedCall("closeout-richness", fallback, async () => {
    const payload = await systemOne({
      state: {
        had_commits: Boolean(hadCommits),
        had_file_edits: Boolean(hadFileEdits),
        had_pr_or_ship: Boolean(hadPrOrShip),
        duration_band: ["short", "medium", "long", "unknown"].includes(durationBand)
          ? durationBand
          : "unknown",
      },
      questions: {
        rich_closeout: {
          type: "noul",
          instructions: "Is this a rich closeout-worthy session — durable work that should get a full session summary?",
          criteria: {
            true: "Commits, file edits, or a ship/PR happened; a future session would benefit from a durable note.",
            false: "Trivial or lookup-only; a full closeout is optional.",
          },
        },
      },
      env,
      fetchImpl,
      timeoutMs,
      readFileFn,
      homedir,
      helperFile,
    });
    return decideCloseoutRichness({ noul: payload?.answers?.rich_closeout?.noul });
  }, { env, flags, readFileFn, homedir, helperFile });
}

export async function judgePersonalScrub(input = {}) {
  const {
    pathKind = "unknown",
    contentClass = "unknown",
    filename = "",
    destination = "public-cortex",
    denyListed = false,
    allowlistOnly = false,
    fileCount,
    flags = {},
    env = process.env,
    fetchImpl,
    timeoutMs,
    readFileFn,
    homedir,
    helperFile,
  } = input;

  const deps = { env, flags, readFileFn, homedir, helperFile };
  const resolved = await readApiKey(deps);
  const enablement = describeEnablement({ env, flags, keyPresent: Boolean(resolved.key) });

  // Disabled: do not change the existing denylist path.
  if (!enablement.enabled) {
    return {
      gate: "personal-scrub",
      enabled: false,
      used: false,
      reason: enablement.reason,
      publish: null,
      personal: null,
      skip: true,
    };
  }

  // Enabled but no key / API error / unsure: safest public default is do not publish.
  const failSafe = {
    gate: "personal-scrub",
    enabled: true,
    used: false,
    publish: false,
    personal: null,
    skip: false,
  };
  if (!resolved.key) return { ...failSafe, reason: "missing-key" };

  try {
    const payload = await systemOne({
      state: {
        destination,
        path_kind: String(pathKind || "unknown").slice(0, 64),
        content_class: String(contentClass || "unknown").slice(0, 64),
        filename: abstractPath(filename),
        already_deny_listed: Boolean(denyListed),
        allowlist_only: Boolean(allowlistOnly),
        file_count: Number.isFinite(Number(fileCount)) ? Number(fileCount) : null,
      },
      questions: {
        personal_only: {
          type: "noul",
          instructions: "Does this look like personal-only content that must stay private and must not be published to a public repository?",
          criteria: {
            true: "Machine memory, private notes, credentials-shaped material, or other personal-only content.",
            false: "Portable system engine, skills, or templates that are safe to publish after the existing denylist.",
          },
        },
      },
      env,
      fetchImpl,
      timeoutMs,
      readFileFn,
      homedir,
      helperFile,
    });
    return {
      gate: "personal-scrub",
      enabled: true,
      skip: false,
      ...decidePersonalScrub({ noul: payload?.answers?.personal_only?.noul }),
    };
  } catch (error) {
    return { ...failSafe, reason: "api-error", error: publicErrorMessage(error) };
  }
}

export function parseJevFlags(options = {}) {
  return {
    useJev: options["use-jev"] === "true" || options["use-jev"] === true,
    noJev: options["no-jev"] === "true" || options["no-jev"] === true,
  };
}

export function redactResult(result) {
  const copy = { ...(result || {}) };
  delete copy.key;
  delete copy.apiKey;
  delete copy.authorization;
  return copy;
}
