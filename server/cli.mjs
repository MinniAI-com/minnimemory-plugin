#!/usr/bin/env node
/* MinniMemoryMCP (c) 2026 MinniAI. Licensed under the MinniMemoryMCP License, see LICENSE. */
import { createRequire as __minniCreateRequire } from "node:module"; const require = __minniCreateRequire(import.meta.url);
import {
  BenchError,
  COMPILED_DIR_NAME,
  DiscoveryError,
  FolderError,
  MAX_BUDGET,
  McpTargetError,
  PolicyError,
  RULES,
  RecallDirError,
  VERSION,
  allRouted,
  applyFolderPlan,
  applyFolderUndo,
  backupBeforeForcedUndo,
  bounds,
  buildClaudeMap,
  buildPreview,
  buildSearchIndex,
  claudeConfigDir,
  claudeMapJson,
  compiledFolders,
  detectPhase,
  directCliPath,
  discover,
  discoveryRecordPath,
  exitCodeFor,
  formatTokens,
  initCommand,
  isProfileName,
  keptBackupsNote,
  keptOnlyMessage,
  leaveReason,
  loadManifest,
  loadOnDemandContent,
  loadPolicy,
  manifestLost,
  memoryFolderMap,
  parseHookInput,
  planFolder,
  planFolderUndo,
  planLostManifestUndo,
  planOldManifestUndo,
  rankOnDemandFiles,
  rankUnits,
  readDiscovery,
  readFolderManifest,
  readLoadLog,
  readOldManifestVersion,
  readRepoRecord,
  recall,
  recallDir,
  recordLoad,
  recordedSet,
  renderClaudeMap,
  renderDriftNotice,
  renderFolderPlan,
  renderHook,
  renderPreviewJson,
  renderPreviewText,
  repoRecordPath,
  repoRecordedSet,
  resolveReported,
  saveDiscovery,
  selectUnits,
  shellSafe,
  shellWord,
  undoCommand,
  undoNoBackupMessage,
  undoRefusal,
  unitsOf
} from "./chunks/chunk-Z6CK4DYJ.mjs";
import "./chunks/chunk-ZVIOPPZP.mjs";

// src/surface/cli.ts
import { spawnSync } from "node:child_process";
import fs3 from "node:fs";
import os from "node:os";
import path2 from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// src/bench/bench.ts
import fs from "node:fs";
function parseWorkload(content) {
  return content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "" && !l.startsWith("#"));
}
function readWorkload(file) {
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    throw new BenchError(`cannot read workload file: ${file}`);
  }
  const tasks = parseWorkload(content);
  if (tasks.length === 0) {
    throw new BenchError(`workload file has no tasks: ${file}
  one task description per line, # for comments`);
  }
  return tasks;
}
function unitId(u) {
  return `${u.onDemandFile}:${u.startLine}`;
}
function unitLabel(u) {
  return `${u.onDemandFile} > ${u.heading}`;
}
function buildIndex(manifest, root) {
  const units = allRouted(manifest).flatMap(
    (m) => unitsOf({ name: m.name, file: m.file }, loadOnDemandContent(root, m.file))
  );
  return buildSearchIndex(units, new Map(allRouted(manifest).map((m) => [m.name, m.triggers])));
}
function model(manifest, tasks, options = {}) {
  const index = options.root ? buildIndex(manifest, options.root) : void 0;
  const unit = index ? "section" : "file";
  const carried = /* @__PURE__ */ new Set();
  const tokensOf = /* @__PURE__ */ new Map();
  const labelOf = /* @__PURE__ */ new Map();
  const onDemandFileOf = /* @__PURE__ */ new Map();
  for (const m of allRouted(manifest)) {
    tokensOf.set(m.name, m.tokens);
    labelOf.set(m.name, m.name);
    onDemandFileOf.set(m.name, m.name);
  }
  if (index) {
    for (const u of index.units) {
      tokensOf.set(unitId(u), u.tokens);
      labelOf.set(unitId(u), unitLabel(u));
      onDemandFileOf.set(unitId(u), u.onDemandFile);
    }
  }
  const turns = [];
  let unroutedTurns = 0;
  tasks.forEach((task, i) => {
    const matched = index ? selectUnits(rankUnits(index, task)).map((r) => unitId(r.unit)) : rankOnDemandFiles(manifest, task).filter((r) => r.score > 0).map((m) => m.name);
    if (matched.length === 0) unroutedTurns++;
    const opened2 = matched.filter((id) => !carried.has(id));
    for (const id of opened2) carried.add(id);
    const carriedTokens2 = [...carried].reduce((n, id) => n + (tokensOf.get(id) ?? 0), 0);
    turns.push({
      turn: i + 1,
      task,
      opened: opened2.map((id) => labelOf.get(id) ?? id),
      carried: [...carried].map((id) => labelOf.get(id) ?? id),
      compiledTokens: manifest.prefix.after + carriedTokens2,
      baselineTokens: manifest.prefix.before
    });
  });
  const compiledTotal = turns.reduce((n, t) => n + t.compiledTokens, 0);
  const baselineTotal = turns.reduce((n, t) => n + t.baselineTokens, 0);
  const touchedOnDemandFiles = new Set([...carried].map((id) => onDemandFileOf.get(id) ?? id));
  const opened = allRouted(manifest).map((m) => m.name).filter((n) => touchedOnDemandFiles.has(n));
  const carriedTokens = [...carried].reduce((n, id) => n + (tokensOf.get(id) ?? 0), 0);
  const steadyStatePerTurn = manifest.prefix.after + carriedTokens;
  const steadyStateGainPerTurn = manifest.prefix.before - steadyStatePerTurn;
  const saving = baselineTotal - compiledTotal;
  let breakEvenTurn;
  if (saving >= 0) {
    breakEvenTurn = turns.findIndex((_, i) => {
      const upTo = turns.slice(0, i + 1);
      return upTo.reduce((n, t) => n + t.baselineTokens - t.compiledTokens, 0) >= 0;
    });
    breakEvenTurn = breakEvenTurn >= 0 ? breakEvenTurn + 1 : void 0;
  } else if (steadyStateGainPerTurn > 0) {
    breakEvenTurn = turns.length + Math.ceil(-saving / steadyStateGainPerTurn);
  }
  return {
    unit,
    turns,
    baselineTotal,
    compiledTotal,
    saving,
    savingPct: baselineTotal === 0 ? 0 : saving / baselineTotal * 100,
    onDemandOpened: opened,
    onDemandNeverOpened: allRouted(manifest).map((m) => m.name).filter((n) => !touchedOnDemandFiles.has(n)),
    unroutedTurns,
    steadyStatePerTurn,
    steadyStateGainPerTurn,
    breakEvenTurn
  };
}

// src/bench/benchReport.ts
function pct(part, whole) {
  if (whole === 0) return "0.0%";
  return `${(part / whole * 100).toFixed(1)}%`;
}
function signed(n) {
  return n >= 0 ? `saves ${formatTokens(n)}` : `costs ${formatTokens(-n)} more`;
}
function renderBounds(b, tokenizer) {
  const out = [""];
  out.push(`  exact, over ${formatTokens(b.turns)} turns. No workload, no assumptions.`);
  out.push("");
  out.push(`    original memory file      ${formatTokens(b.baselinePerTurn).padStart(8)} tokens per turn`);
  out.push(`    compiled always-loaded    ${formatTokens(b.compiledPerTurn).padStart(8)} tokens per turn`);
  out.push(`    OnDemandMemory, all of it   ${formatTokens(b.totalOnDemandTokens).padStart(8)} tokens, on demand`);
  out.push("");
  out.push(`    best case, no OnDemandMemory file ever opened`);
  out.push(
    `      ${formatTokens(b.baselineTotal)} -> ${formatTokens(b.bestCaseTotal)} tokens, ${signed(b.bestCaseSaving)} (${pct(b.bestCaseSaving, b.baselineTotal)})`
  );
  out.push("");
  out.push(`    worst case, every OnDemandMemory file opened on turn 1 and carried`);
  out.push(
    `      ${formatTokens(b.baselineTotal)} -> ${formatTokens(b.worstCaseTotal)} tokens, ${signed(b.worstCaseSaving)}`
  );
  out.push("");
  out.push(`    break-even: ${formatTokens(b.breakEvenCarriedTokens)} tokens of OnDemandMemory can sit in`);
  out.push(`    context from turn 1 to the end and come out even. Past that the compiled`);
  out.push(`    shape costs more than the file it replaced.`);
  out.push("");
  out.push(`  tokenizer: ${tokenizer}, an offline estimate`);
  out.push("");
  return out.join("\n");
}
function renderModel(m, tokenizer) {
  const out = [""];
  const turns = m.turns.length;
  out.push(`  MODEL, not a measurement. ${formatTokens(turns)} turns from the workload you supplied.`);
  out.push(
    m.unit === "section" ? `  routed at section level, as recall() does: a hit carries the section, not the file.` : `  routed at file level, as an agent reading a whole file the OnDemandMemory list named would.`
  );
  out.push("");
  out.push(
    `    memory tokens over the session   ${formatTokens(m.baselineTotal)} -> ${formatTokens(m.compiledTotal)}`
  );
  out.push(`    ${signed(m.saving)}${m.saving >= 0 ? ` (${m.savingPct.toFixed(1)}%)` : ""}`);
  out.push("");
  if (m.onDemandOpened.length > 0) {
    out.push(`    opened and carried (${m.onDemandOpened.length}):`);
    for (const name of m.onDemandOpened) out.push(`      ${name}`);
    out.push("");
  }
  if (m.onDemandNeverOpened.length > 0) {
    out.push(`    never opened (${m.onDemandNeverOpened.length}) - this is where the saving comes from:`);
    for (const name of m.onDemandNeverOpened) out.push(`      ${name}`);
    out.push("");
  }
  out.push(`    one more turn, once everything this workload opens is in context:`);
  out.push(
    `      ${formatTokens(m.steadyStatePerTurn)} vs ${formatTokens(m.turns[0]?.baselineTokens ?? 0)} baseline, ${m.steadyStateGainPerTurn >= 0 ? `saves ${formatTokens(m.steadyStateGainPerTurn)}` : `costs ${formatTokens(-m.steadyStateGainPerTurn)} more`} per turn`
  );
  out.push("");
  if (m.saving < 0 && m.steadyStateGainPerTurn <= 0) {
    out.push(`    this workload never breaks even. The OnDemandMemory files it opens are large enough that`);
    out.push(`    carrying them costs more every turn than the original file did, so a longer`);
    out.push(`    session loses more, not less. Splitting differently, or not compiling this`);
    out.push(`    file at all, is the honest answer here.`);
    out.push("");
  } else if (m.saving < 0 && m.breakEvenTurn !== void 0) {
    out.push(
      `    behind by ${formatTokens(-m.saving)} at turn ${formatTokens(m.turns.length)}, recovering ${formatTokens(m.steadyStateGainPerTurn)} per turn:`
    );
    out.push(`    breaks even around turn ${formatTokens(m.breakEvenTurn)} if nothing further opens.`);
    out.push("");
  } else if (m.saving >= 0 && m.breakEvenTurn !== void 0) {
    out.push(`    ahead from turn ${formatTokens(m.breakEvenTurn)} onward.`);
    out.push("");
  }
  if (m.unroutedTurns > 0) {
    out.push(
      `    ${formatTokens(m.unroutedTurns)} of ${formatTokens(turns)} turns matched no OnDemandMemory file at all.`
    );
    out.push(`    Those turns are cheap here, but a real agent may have needed something and`);
    out.push(`    not been routed to it. Check them before trusting the total.`);
    out.push("");
  }
  out.push(`  what this number is conditional on:`);
  out.push(`    - your workload being what a real session looks like. It is your file;`);
  out.push(`      the tool cannot tell whether it is representative.`);
  if (m.unit === "section") {
    out.push(`    - every section recall() returns being carried for the rest of the session,`);
    out.push(`      up to its token cap per turn. A real agent may widen with outline() or`);
    out.push(`      read the whole file anyway.`);
  } else {
    out.push(`    - every OnDemandMemory file whose triggers match being opened in full. A real`);
    out.push(`      agent may read one and stop, or ignore one the list offered.`);
  }
  out.push(`    - memory tokens only. Reasoning, tool results and conversation are excluded`);
  out.push(`      from both sides, so this ratio is not a session bill.`);
  out.push("");
  out.push(`  For observed usage against a live agent, measure a real multi-turn session with`);
  out.push(`  and without the compile. That is the only path allowed to call a number measured.`);
  out.push("");
  out.push(`  tokenizer: ${tokenizer}, an offline estimate`);
  out.push("");
  return out.join("\n");
}
function renderNoWorkload() {
  return [
    "",
    "  No workload given, so only the exact bounds above are available.",
    "",
    "  A session number needs a workload: a file with one task description per line,",
    "  describing what you actually do in this repo.",
    "",
    "    minnimemory bench --workload tasks.txt",
    "",
    "  minnimemory ships no default task list on purpose. A number produced from tasks",
    "  the tool invented for itself would say more about the tool than about your repo.",
    ""
  ].join("\n");
}

// src/runtime/install.ts
import fs2 from "node:fs";
import path from "node:path";
function safeDirectCliPath(cliPath) {
  const direct = directCliPath(cliPath);
  return direct && shellSafe(direct) ? direct : void 0;
}
function quoteArg(arg) {
  return shellWord(arg) ?? `"${arg.replace(/"/g, '\\"')}"`;
}
function formatCommand(argv) {
  return argv.map(quoteArg).join(" ");
}
function shellArgs(args) {
  return args.map(quoteArg);
}
function npxCacheNote(plan) {
  if (!plan.servedDirect || !/\/_npx\//.test(plan.servedDirect)) return void 0;
  return "note: this copy lives in the npx cache, which `npm cache clean` or a newer version can remove; the registration and the hook would then stop starting. For a durable install: npm i -g minnimemory, then minnimemory install --force";
}
function hostConfigPath(host) {
  if (host === "cursor") return "~/.cursor/mcp.json";
  if (host === "windsurf") return "~/.codeium/windsurf/mcp_config.json";
  return void 0;
}
function planInstall(options, _env) {
  const servedFlags = [];
  if (options.write) servedFlags.push("--profile", "full", "--allow-write");
  const servedDirect = safeDirectCliPath(options.cliPath);
  const servedArgv = servedDirect ? ["node", servedDirect, "mcp", ...servedFlags] : ["npx", "-y", "minnimemory", "mcp", ...servedFlags];
  const addArgv = ["claude", "mcp", "add", "minnimemory", "-s", options.scope, "--", ...servedArgv];
  const removeArgv = ["claude", "mcp", "remove", "minnimemory", "-s", options.scope];
  const getArgv = ["claude", "mcp", "get", "minnimemory"];
  const probeArgv = ["claude", "--version"];
  const manualLine = formatCommand(addArgv);
  const jsonSnippet = JSON.stringify(
    {
      mcpServers: {
        minnimemory: {
          command: "npx",
          args: ["-y", "minnimemory", "mcp", ...servedFlags]
        }
      }
    },
    null,
    2
  );
  const plan = {
    scope: options.scope,
    servedFlags,
    servedArgv,
    ...servedDirect ? { servedDirect } : {},
    addArgv,
    removeArgv,
    getArgv,
    probeArgv,
    manualLine,
    jsonSnippet
  };
  if (options.host && options.host !== "json") {
    const configPath = hostConfigPath(options.host);
    if (configPath) plan.hostConfigPath = configPath;
  }
  return plan;
}
function isMissingBinary(outcome) {
  return outcome.error !== void 0 && outcome.error.code === "ENOENT";
}
var DRIFT_HOOK_COMMAND = "npx -y minnimemory drift";
function driftHookCommand(cliPath) {
  const direct = safeDirectCliPath(cliPath);
  return direct ? `node "${direct}" drift` : DRIFT_HOOK_COMMAND;
}
var MEMORY_HOOK_COMMAND = "npx -y minnimemory hook";
function memoryHookCommand(cliPath) {
  const direct = safeDirectCliPath(cliPath);
  return direct ? `node "${direct}" hook` : MEMORY_HOOK_COMMAND;
}
function isMemoryHookCommand(command) {
  return typeof command === "string" && (command === MEMORY_HOOK_COMMAND || isOwnNodeForm(command, "hook"));
}
function registrationMatches(getOutput, plan) {
  const norm = (s) => s.replace(/\\/g, "/").toLowerCase();
  const command = /^\s*Command:\s*(.*)$/m.exec(getOutput)?.[1]?.trim();
  const args = /^\s*Args:\s*(.*)$/m.exec(getOutput)?.[1]?.trim();
  const out = norm(command ? `${command} ${args ?? ""}
${getOutput}` : getOutput);
  return plan.servedDirect ? out.includes(norm(plan.servedDirect)) : out.includes("npx -y minnimemory mcp");
}
function registeredScope(getOutput) {
  const m = /Scope:\s*(User|Project|Local)\b/i.exec(getOutput);
  return m ? m[1].toLowerCase() : void 0;
}
function isOwnNodeForm(command, verb) {
  const m = /^node "([^"]+)" (drift|loaded|hook)$/.exec(command);
  if (m === null || m[2] !== verb) return false;
  const file = m[1];
  return /minnimemory/i.test(file) || ownPackageAt(file);
}
function ownPackageAt(file) {
  if (!path.isAbsolute(file)) return false;
  let dir = path.dirname(file);
  for (let i = 0; i < 4; i++) {
    try {
      const pkg = JSON.parse(fs2.readFileSync(path.join(dir, "package.json"), "utf8"));
      return pkg.name === "minnimemory";
    } catch {
      const up = path.dirname(dir);
      if (up === dir) return false;
      dir = up;
    }
  }
  return false;
}
function isDriftHookCommand(command) {
  return typeof command === "string" && (command === DRIFT_HOOK_COMMAND || isOwnNodeForm(command, "drift"));
}
var LOADED_HOOK_COMMAND = "npx -y minnimemory loaded";
function loadedHookCommand(cliPath) {
  const direct = safeDirectCliPath(cliPath);
  return direct ? `node "${direct}" loaded` : LOADED_HOOK_COMMAND;
}
function isLoadedHookCommand(command) {
  return typeof command === "string" && (command === LOADED_HOOK_COMMAND || isOwnNodeForm(command, "loaded"));
}
function ownHooks(cliPath) {
  const drift = driftHookCommand(cliPath);
  const memory = memoryHookCommand(cliPath);
  const loaded = loadedHookCommand(cliPath);
  return [
    { event: "UserPromptSubmit", command: drift, fallback: DRIFT_HOOK_COMMAND, isOurs: (c) => c === drift || isDriftHookCommand(c) },
    { event: "UserPromptSubmit", command: memory, fallback: MEMORY_HOOK_COMMAND, isOurs: (c) => c === memory || isMemoryHookCommand(c) },
    { event: "InstructionsLoaded", command: loaded, fallback: LOADED_HOOK_COMMAND, isOurs: (c) => c === loaded || isLoadedHookCommand(c) }
  ];
}
function hookSettingsPath(scope, env) {
  const cwd = env.cwd ?? process.cwd();
  if (scope === "user") return path.join(env.configDir ?? path.join(env.home, ".claude"), "settings.json");
  if (scope === "project") return path.join(cwd, ".claude", "settings.json");
  return path.join(cwd, ".claude", "settings.local.json");
}
function ourCommandsIn(entries, isOurs) {
  const found = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const inner = entry["hooks"];
    if (!Array.isArray(inner)) continue;
    for (const h of inner) {
      const command = h && typeof h === "object" ? h["command"] : void 0;
      if (isOurs(command)) found.push(command);
    }
  }
  return found;
}
function readSettings(settingsPath) {
  if (!fs2.existsSync(settingsPath)) return {};
  try {
    const parsed = JSON.parse(fs2.readFileSync(settingsPath, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return void 0;
    return parsed;
  } catch {
    return void 0;
  }
}
function writeSettings(settingsPath, settings) {
  const text = `${JSON.stringify(settings, null, 2)}
`;
  const tmp = `${settingsPath}.minnimemory-${process.pid}.tmp`;
  fs2.writeFileSync(tmp, text, "utf8");
  try {
    fs2.renameSync(tmp, settingsPath);
  } catch {
    fs2.rmSync(tmp, { force: true });
    fs2.writeFileSync(settingsPath, text, "utf8");
  }
}
function hooksOf(settings) {
  const h = settings["hooks"];
  return h && typeof h === "object" && !Array.isArray(h) ? h : void 0;
}
function installHook(options, env) {
  const settingsPath = hookSettingsPath(options.scope, env);
  const hooks = ownHooks(options.cliPath);
  if (options.dryRun) {
    return {
      exitCode: 0,
      output: hooks.map((h) => `would add the ${h.event} hook \`${h.command}\` to ${settingsPath}`).join("\n"),
      path: settingsPath
    };
  }
  const settings = readSettings(settingsPath);
  if (!settings) {
    return { exitCode: 1, output: `install --hook: ${settingsPath} is not valid JSON; not touched.`, path: settingsPath };
  }
  const all = hooksOf(settings) ?? {};
  const lines = [];
  let changed = false;
  for (const h of hooks) {
    const entries = Array.isArray(all[h.event]) ? [...all[h.event]] : [];
    const present = ourCommandsIn(entries, h.isOurs);
    if (present.includes(h.command)) {
      lines.push(h.event === "UserPromptSubmit" ? `hook: \`${h.fallback.split(" ").pop()}\` already present in ${settingsPath}` : `hook: ${h.event} already present in ${settingsPath}`);
      continue;
    }
    if (present.length > 0) {
      for (const entry of entries) {
        const inner = entry && typeof entry === "object" ? entry["hooks"] : void 0;
        if (!Array.isArray(inner)) continue;
        for (const hk of inner) {
          if (hk && typeof hk === "object" && h.isOurs(hk["command"])) {
            hk["command"] = h.command;
          }
        }
      }
      lines.push(`hook: updated \`${present[0]}\` -> \`${h.command}\` in ${settingsPath} (${h.event}). Restart Claude Code.`);
    } else {
      const entry = { hooks: [{ type: "command", command: h.command }] };
      entries.push(entry);
      lines.push(`hook: added \`${h.command}\` to ${settingsPath} (${h.event}). Restart Claude Code.`);
    }
    all[h.event] = entries;
    changed = true;
  }
  if (changed) {
    settings["hooks"] = all;
    fs2.mkdirSync(path.dirname(settingsPath), { recursive: true });
    writeSettings(settingsPath, settings);
  }
  return { exitCode: 0, output: lines.join("\n"), path: settingsPath };
}
function removeHook(options, env) {
  const settingsPath = hookSettingsPath(options.scope, env);
  const hooks = ownHooks(options.cliPath);
  if (options.dryRun) {
    return {
      exitCode: 0,
      output: hooks.map((h) => `would remove the ${h.event} hook (\`${h.fallback}\` or its direct node form) from ${settingsPath}`).join("\n"),
      path: settingsPath
    };
  }
  if (!fs2.existsSync(settingsPath)) {
    return { exitCode: 0, output: `hook: nothing to remove (${settingsPath} does not exist)`, path: settingsPath };
  }
  const settings = readSettings(settingsPath);
  if (!settings) {
    return { exitCode: 1, output: `install --remove: ${settingsPath} is not valid JSON; not touched.`, path: settingsPath };
  }
  const all = hooksOf(settings);
  const lines = [];
  for (const h of hooks) {
    const entries = all && Array.isArray(all[h.event]) ? all[h.event] : void 0;
    const removed = entries ? ourCommandsIn(entries, h.isOurs) : [];
    if (!all || !entries || removed.length === 0) continue;
    const kept = entries.filter((entry) => {
      if (!entry || typeof entry !== "object") return true;
      const inner = entry["hooks"];
      if (!Array.isArray(inner)) return true;
      const others = inner.filter((hk) => !(hk && typeof hk === "object" && h.isOurs(hk["command"])));
      if (others.length === 0) return false;
      entry["hooks"] = others;
      return true;
    });
    if (kept.length === 0) delete all[h.event];
    else all[h.event] = kept;
    lines.push(`hook: removed \`${removed[0]}\` from ${settingsPath}`);
  }
  if (lines.length === 0) return { exitCode: 0, output: `hook: nothing to remove in ${settingsPath}`, path: settingsPath };
  if (all && Object.keys(all).length === 0) delete settings["hooks"];
  writeSettings(settingsPath, settings);
  return { exitCode: 0, output: lines.join("\n"), path: settingsPath };
}
function runUninstall(options, env, runner) {
  const plan = planInstall(options, env);
  const lines = [];
  if (options.dryRun) {
    lines.push(`would run: ${formatCommand(plan.removeArgv)}`);
    const hookPreview = removeHook({ ...options, dryRun: true }, env);
    lines.push(hookPreview.output);
    return { exitCode: 0, output: `${lines.join("\n")}
` };
  }
  const probe = runner(plan.probeArgv[0], plan.probeArgv.slice(1));
  let exitCode = 0;
  if (isMissingBinary(probe)) {
    lines.push("the claude CLI is not on PATH; skipping the MCP registration removal.");
  } else {
    const removed = runner(plan.removeArgv[0], plan.removeArgv.slice(1));
    lines.push(`ran: ${formatCommand(plan.removeArgv)}`);
    if (removed.code !== 0 && /no mcp server named/i.test(`${removed.stdout}
${removed.stderr}`)) {
      lines.push(`nothing registered as minnimemory in ${options.scope} scope`);
    } else if (removed.code !== 0) {
      lines.push(removed.stderr.trim());
      exitCode = 1;
    } else if (removed.stdout.trim()) {
      lines.push(removed.stdout.trim());
    }
  }
  const hookResult = removeHook(options, env);
  lines.push(hookResult.output);
  if (hookResult.exitCode !== 0) exitCode = hookResult.exitCode;
  return { exitCode, output: `${lines.join("\n")}
` };
}
function nextStep(cliPath) {
  const direct = safeDirectCliPath(cliPath);
  const init = direct ? `node "${direct}" init` : "npx -y minnimemory init";
  return `next: restart Claude Code, then ask it to clean up your memory with minnimemory; it starts with init. In a terminal: \`${init} <folder> --from-log\` from your project.`;
}
function withHook(options, env, lines, exitCode) {
  if (options.hook) {
    const hookResult = installHook(options, env);
    lines.push(hookResult.output);
    if (hookResult.exitCode !== 0) exitCode = hookResult.exitCode;
  }
  if (exitCode === 0) lines.push(nextStep(options.cliPath));
  return { exitCode, output: `${lines.join("\n")}
` };
}
function runInstall(options, env, runner) {
  const plan = planInstall(options, env);
  const lines = [];
  if (options.hook && options.host) {
    return { exitCode: 2, output: "--hook only applies to Claude Code\n" };
  }
  if (options.host) {
    lines.push(plan.jsonSnippet);
    if (plan.hostConfigPath) {
      lines.push("", `config file: ${plan.hostConfigPath}`);
    } else {
      lines.push("", `add this under "mcpServers" in your host's MCP config file.`);
    }
    return { exitCode: 0, output: `${lines.join("\n")}
` };
  }
  if (options.dryRun) {
    if (options.force) lines.push(`would run: ${formatCommand(plan.removeArgv)}`);
    lines.push(`would run: ${formatCommand(plan.addArgv)}`);
    const note2 = npxCacheNote(plan);
    if (note2) lines.push(note2);
    return withHook(options, env, lines, 0);
  }
  const probe = runner(plan.probeArgv[0], plan.probeArgv.slice(1));
  if (isMissingBinary(probe)) {
    lines.push(
      "the claude CLI is not on PATH. Register minnimemory manually:",
      "",
      `  ${plan.manualLine}`,
      "",
      "or add this to another host's MCP config:",
      "",
      plan.jsonSnippet
    );
    return { exitCode: 2, output: `${lines.join("\n")}
` };
  }
  const existing = runner(plan.getArgv[0], plan.getArgv.slice(1));
  const foundScope = existing.code === 0 ? registeredScope(existing.stdout) : void 0;
  const otherScope = foundScope !== void 0 && foundScope !== options.scope;
  if (otherScope) {
    lines.push(`minnimemory is also registered at ${foundScope} scope; that registration is left as it is (Claude Code uses local, then project, then user).`);
  }
  const alreadyRegistered = existing.code === 0 && !otherScope;
  const stale = alreadyRegistered && !registrationMatches(existing.stdout, plan);
  if (alreadyRegistered && !options.force && !stale) {
    lines.push(
      "minnimemory is already registered.",
      `to change it: ${formatCommand(["npx", "-y", "minnimemory", "install", "--force", "--scope", options.scope, ...options.write ? ["--write"] : []])}`
    );
    return withHook(options, env, lines, 0);
  }
  if (alreadyRegistered) {
    if (stale && !options.force) lines.push("minnimemory is registered with a different command; repointing it at this copy.");
    const removed = runner(plan.removeArgv[0], plan.removeArgv.slice(1));
    if (removed.code !== 0) {
      lines.push(`ran: ${formatCommand(plan.removeArgv)}`, removed.stderr.trim());
      return { exitCode: 1, output: `${lines.join("\n")}
` };
    }
  }
  const added = runner(plan.addArgv[0], plan.addArgv.slice(1));
  lines.push(`ran: ${formatCommand(plan.addArgv)}`);
  if (added.code !== 0) {
    lines.push(added.stderr.trim());
    return { exitCode: 1, output: `${lines.join("\n")}
` };
  }
  if (added.stdout.trim()) lines.push(added.stdout.trim());
  const note = npxCacheNote(plan);
  if (note) lines.push(note);
  return withHook(options, env, lines, 0);
}

// src/surface/cli.ts
var MCP_STASHED = false;
var USAGE = `
minnimemory ${VERSION}  the agent memory compiler

usage: the four lifecycle verbs, the CLI and the MCP basic profile share.
The only difference is who writes: the CLI writes to disk itself, the MCP tools return the
command that does (and the operations it performs) for the agent to run.
  minnimemory init <folder>     always first: takes where Claude Code loads from (--loaded,
                                 --from-log, --memory-dir; the agent passes them over MCP),
                                 checks and saves them, then the map, the audit and the diff
                                 apply would write; writes only that record; ends with the
                                 apply command to run. --map prints only the map
  minnimemory doctor [folder]   after init, never first: the audit, drift since the last
                                 apply, the re-apply diff; no folder means the one init saved;
                                 exit 1 at --fail-on for CI
  minnimemory apply <folder>    write what init/doctor showed: a compile, a re-apply, or
                                 "nothing to apply"
  minnimemory undo <folder>     restore the original memory files and remove .minnimemory/

more
  minnimemory                    no subcommand: serves mcp when stdin is not a terminal (how
                                 every MCP host launches it), prints this usage otherwise
  minnimemory mcp [path]        start the MCP server. Serves init/doctor/apply/undo by
                                 default; --profile full serves the seven maintainer tools
  minnimemory install            register minnimemory with the current host
  minnimemory uninstall          remove the registration and the three hooks install added (same
                                 as install --remove); lists folders still compiled, to undo first
  minnimemory bench <folder>    what the compiled shape costs over a session
  minnimemory recall <path> <query...>
                                 recall against a compiled workspace or a manifest-less memory
                                 directory (Layout B), whichever <path> is, change nothing
  minnimemory hook               Claude Code UserPromptSubmit hook: reads hook JSON from stdin,
                                 prints a fenced memory block to stdout, or nothing on no hit.
                                 Experimental: measured offline only, not yet in a
                                 live session
  minnimemory drift              Claude Code UserPromptSubmit hook: prints a one-line notice when
                                 memory files changed since the last apply, once per change,
                                 nothing otherwise
  minnimemory loaded             Claude Code InstructionsLoaded hook: records which memory files
                                 Claude Code loaded, for the map init prints; reads hook JSON
                                 from stdin, prints nothing

install options
  --scope <name>          user, project or local, same meaning as claude mcp add   (default user)
  --write                 serve the full profile with its write tools (--profile full
                           --allow-write); the default basic profile never writes
  --dry-run               print the command without running it, exit 0
  --force                 remove an existing registration first, then re-add
  --no-hook               skip the three hooks (memory, drift notice, load log); on by default
  --remove                remove the MCP registration and the hooks install added (= uninstall)
  --host <name>           cursor, windsurf or json: print the mcpServers snippet (and the
                           config file for cursor/windsurf) to paste, instead of registering
                           with Claude Code; no hook
  without the claude CLI on PATH: print the manual claude mcp add line and the JSON snippet,
  exit 2. If claude reports an error, print its stderr and exit 1. Already registered without
  --force: say so and print the command to change it, exit 0. Prints the next step in one line.

recall options
  --max-tokens <n>        cap on returned tokens (default 1500); the top hit is always returned
  --headings              print only "file > heading path (n tokens)" lines, not the content

hook options
  --max-tokens <n>        cap on returned tokens (default 600)
  --headings              print only "file > heading path (n tokens)" lines, not the content
  --dir <path>            an explicit memory directory (compiled or manifest-less), overriding
                           the hook JSON's own cwd resolution (cwd/.minnimemory, else cwd's
                           Claude Code auto-memory folder)

init and doctor options
  Neither writes; pass --write or --update to init and it prints one line and exits instead.
  Run apply to actually compile or re-apply. A host file (CLAUDE.md and friends) is compiled
  into .minnimemory/; a memory folder (an index plus topic files, such as a Claude Code
  memory folder under ~/.claude/projects/) has its always-loaded files split in place,
  routed pieces beside them and a fenced list appended to the index.
  Only the folder you name and the folders below it are read. A file outside it is read only
  when it is reported as loaded (--loaded, --from-log, or by the agent over MCP); nothing outside
  is searched for. apply on a memory folder needs that report, or --only-this-folder.
  --force                 on a compiled workspace with no drift, preview the re-apply plan
                           anyway
  --loaded <path>         a file Claude Code loads this session (repeatable); the only way a
                           file outside the named folder is read (--host-file still works)
  --memory-dir <path>     the auto memory folder Claude Code names; also the folder to use
  --from-log              take the loaded files from Claude Code's own load log for this folder
  --only-this-folder      apply to a memory folder with nothing reported, when nothing outside loads it
  --diff <mode>           summary: the plan and the operation list, no file diffs; full: every
                           diff too                                        (default full)
  --budget <n>            always-loaded token budget AlwaysOnMemory must fit    (default: 60% of the file, at least 2000)
  --profile <name>        how much token-discipline guidance to embed      (default auto)
                            auto     same as none today, for every source
                            none     structure only, embed nothing
                            routing  the rules that make routing work, about 210 tokens
                            full     the complete set, about 710 tokens
  --allow-secrets         preview as if a credential-shaped source were allowed through
  --episodic-json         plan episodic OnDemandMemory files (changelogs, logs) as JSON, not
                           Markdown (O3)

apply options
  Looks at the workspace: uncompiled compilable file or memory folder - compiles it; compiled
  and drifted - re-applies it; compiled with no drift - "nothing to apply". Same backups
  (.minnimemory/original/, .minnimemory/previous/) and refusals as init previews.
  --force                 accept a compile that would not shrink the always-loaded prefix
  --loaded <path>         a file Claude Code loads this session (repeatable); the only way a
                           file outside the named folder is read (--host-file still works)
  --memory-dir <path>     the auto memory folder Claude Code names; also the folder to use
  --from-log              take the loaded files from Claude Code's own load log for this folder
  --only-this-folder      apply to a memory folder with nothing reported, when nothing outside loads it
  --budget <n>            always-loaded token budget AlwaysOnMemory must fit    (default: 60% of the file, at least 2000)
  --profile <name>        how much token-discipline guidance to embed      (default auto)
                            auto     same as none today, for every source
                            none     structure only, embed nothing
                            routing  the rules that make routing work, about 210 tokens
                            full     the complete set, about 710 tokens
  --allow-secrets         compile even when the source holds a credential-shaped string
  --episodic-json         write episodic OnDemandMemory files (changelogs, logs) as JSON, not
                           Markdown (O3)

undo options
  Restores the host memory file from .minnimemory/original/<name>.bak and removes
  .minnimemory/. "nothing to undo" when not compiled; a clear error when the original copy is
  missing (doctor reports that as a finding before it matters).
  --force                 restore even after a re-apply; what changed since the first apply
                           is discarded (undo refuses without it and says so)

mcp options
  Every tool definition is charged to the client's prefix on every turn, called or not, so the
  server only advertises the profile you asked for.
  --profile <name>        basic (default) or full
                            basic  the one-time converter: init, doctor, apply, undo, always
                                   registered, read-only. The server never writes your disk;
                                   apply and undo return files for you to write yourself
                            full   recall, modules, outline, doctor, plan, always registered;
                                   apply with --allow-write. Six tools, for maintainers
  --allow-write           adds the full profile's write tool (apply).
                           No effect on basic, which is read-only by construction; without
                           --allow-write that tool is not registered at all on full: it
                           is absent from tools/list, not present-and-refusing
  The server reads only inside its root (the folder it was started in, or [path]), and every
  tool call names a folder inside it.

bench options
  --turns <n>             session length for the exact bounds                 (default 50)
  --workload <file>       one task description per line. Without it, only the
                           assumption-free bounds are reported
  --whole-files           model an agent that reads the whole file the OnDemandMemory list named,
                           instead of the sections recall() would return
  --json                  machine-readable output

doctor options
  --json                  machine-readable output
  --ci                    terse output, no colour
  --fail-on <sev>         exit 1 at this severity or above: low, med, high   (default high)
  --budget <n>            always-loaded token budget for MM001               (default: the compiled budget, else 60% of the file, at least 2000)
  --policy <file>         a company rule pack (policy.json): adds MM020 required lines and MM021
                           banned text, and its always-loaded budget when --budget is not given
  --loaded <path>         a file Claude Code loads this session (repeatable); the only way a
                           file outside the named folder is read (--host-file still works)
  --memory-dir <path>     the auto memory folder Claude Code names; also the folder to use
  --from-log              take the loaded files from Claude Code's own load log for this folder
  --only-this-folder      apply to a memory folder with nothing reported, when nothing outside loads it
  --only <ids>            run only these rules, comma separated
  --ignore <ids>          skip these rules, comma separated
  --rules                 list the rule set and exit
  -h, --help              this message
  -v, --version           print the version

<folder> is required: a repo, a memory directory, or a single file. With none, minnimemory asks
for it (in a terminal) or stops and says so. Type . for the current folder. An @import that
points outside the folder is not read; the report names it.
`;
function listRules() {
  const lines = ["", "  rule set", ""];
  for (const r of RULES) {
    lines.push(`  ${r.id.padEnd(8)}${r.severity.padEnd(6)}${r.title}`);
  }
  lines.push("");
  return lines.join("\n");
}
function parseSeverity(value, fallback) {
  if (value === void 0) return fallback;
  if (value === "low" || value === "med" || value === "high") return value;
  throw new Error(`--fail-on must be one of low, med, high (got "${value}")`);
}
function parseIds(value) {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}
function renderRecall(result, headingsOnly) {
  if (result.matches.length === 0) {
    return `
  no match for "${result.query}"

`;
  }
  if (headingsOnly) {
    return `${result.matches.map((m) => `${m.onDemandFile} > ${m.path.join(" > ")} (${m.tokens} tokens)`).join("\n")}
`;
  }
  return `${result.matches.map(
    (m) => `## ${m.onDemandFile} > ${m.path.join(" > ")} (lines ${m.startLine}-${m.endLine}, ${m.tokens} tokens, score ${m.score})

${m.content}`
  ).join("\n\n---\n\n")}
`;
}
function defaultCommand(opts) {
  return opts.isTTY ? "usage" : "serve";
}
function processRunner() {
  return (command, args) => {
    const shell = process.platform === "win32";
    const result = spawnSync(command, shell ? shellArgs(args) : args, {
      encoding: "utf8",
      shell
    });
    return {
      code: result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      error: result.error
    };
  };
}
function parseScope(value) {
  if (value === void 0 || value === "user") return "user";
  if (value === "project" || value === "local") return value;
  throw new Error(`--scope must be one of user, project, local (got "${value}")`);
}
function parseHost(value) {
  if (value === void 0) return void 0;
  if (value === "cursor" || value === "windsurf" || value === "json") return value;
  throw new Error(`--host must be one of cursor, windsurf, json (got "${value}")`);
}
function parseBudget(value) {
  if (value === void 0) return void 0;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > MAX_BUDGET) throw new Error(`--budget must be a whole number of tokens from 1 to ${MAX_BUDGET.toLocaleString("en-US")} (got "${value}")`);
  return Math.floor(n);
}
function runMcpCommand(target, values) {
  let root;
  try {
    root = path2.resolve(target);
    if (!fs3.existsSync(root) || !fs3.statSync(root).isDirectory()) {
      throw new McpTargetError(`not a directory: ${root}`);
    }
  } catch (err) {
    if (err instanceof McpTargetError) {
      process.stderr.write(`
  error: ${err.message}

`);
      return 2;
    }
    process.stderr.write(`
  unexpected error: ${err.stack ?? String(err)}

`);
    return 2;
  }
  const profileName = values.profile ?? "basic";
  if (profileName !== "basic" && profileName !== "full") {
    process.stderr.write(`
  error: --profile must be one of basic, full (got "${profileName}")

`);
    return 2;
  }
  void (async () => {
    const [{ StdioServerTransport }, { createMcpServer }] = await Promise.all([
      import("./chunks/stdio-5QN5KZ3B.mjs"),
      import("./chunks/mcpServer-3UTS2F5T.mjs")
    ]);
    const server = createMcpServer(root, {
      profile: profileName,
      allowWrite: values["allow-write"] === true
    });
    await server.connect(new StdioServerTransport());
  })().catch((err) => {
    process.stderr.write(`
  mcp server failed: ${err.message ?? String(err)}
`);
    process.exitCode = 1;
  });
  return 0;
}
function uninstallNotes() {
  const folders = compiledFolders();
  const lines = [];
  if (folders.length > 0) {
    lines.push("still compiled (they keep working without minnimemory; to put the originals back, undo each one):");
    for (const d of folders) lines.push(`  ${undoCommand(d)}`);
  }
  lines.push(`kept: ${path2.dirname(discoveryRecordPath())} (init records, the load log, undo backups); delete it yourself once you have checked undo-backups/.`);
  lines.push("restart Claude Code.");
  return lines.join("\n");
}
var FOLDER_COMMANDS = /* @__PURE__ */ new Set(["init", "doctor", "apply", "undo", "bench"]);
function doctorMayRun(target) {
  if (readDiscovery(process.cwd())) return true;
  const dir = folderOf(target);
  return detectPhase(dir) === "compiled" || readFolderManifest(dir) !== void 0 || readRepoRecord(dir) !== void 0;
}
function folderOf(target) {
  const abs = path2.resolve(target);
  return fs3.existsSync(abs) && fs3.statSync(abs).isFile() ? path2.dirname(abs) : abs;
}
function repoRecordInUse(target) {
  if (readDiscovery(process.cwd())) return void 0;
  const dir = folderOf(target);
  return readRepoRecord(dir) ? repoRecordPath(dir) : void 0;
}
function askForFolder(command) {
  const usage = `minnimemory ${command} <folder>`;
  if (process.stdin.isTTY !== true) {
    process.stderr.write(`
  error: name the folder to read: ${usage} (type . for the current folder)

`);
    return void 0;
  }
  process.stdout.write(`
  Which folder should minnimemory ${command} read? Only that folder and the folders below it are read.
  folder: `);
  const answer = readLineSync().trim();
  if (answer === "") {
    process.stderr.write(`
  error: no folder given; run ${usage}

`);
    return void 0;
  }
  return answer;
}
function readLineSync() {
  const byte = Buffer.alloc(1);
  let line = "";
  for (; ; ) {
    let n;
    try {
      n = fs3.readSync(0, byte, 0, 1, null);
    } catch {
      break;
    }
    if (n === 0) break;
    const c = byte.toString("utf8");
    if (c === "\n") break;
    if (c !== "\r") line += c;
  }
  return line;
}
function main(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        json: { type: "boolean", default: false },
        write: { type: "boolean", default: false },
        force: { type: "boolean", default: false },
        update: { type: "boolean", default: false },
        "allow-secrets": { type: "boolean", default: false },
        "episodic-json": { type: "boolean", default: false },
        "allow-write": { type: "boolean", default: false },
        "follow-external-imports": { type: "boolean", default: false },
        "include-auto-memory": { type: "boolean", default: false },
        scope: { type: "string" },
        "dry-run": { type: "boolean", default: false },
        "auto-memory": { type: "boolean", default: false },
        hook: { type: "boolean", default: false },
        "no-hook": { type: "boolean", default: false },
        remove: { type: "boolean", default: false },
        host: { type: "string" },
        "host-file": { type: "string", multiple: true },
        loaded: { type: "string", multiple: true },
        "memory-dir": { type: "string" },
        "from-log": { type: "boolean", default: false },
        "only-this-folder": { type: "boolean", default: false },
        turns: { type: "string" },
        workload: { type: "string" },
        "whole-files": { type: "boolean", default: false },
        "max-tokens": { type: "string" },
        headings: { type: "boolean", default: false },
        dir: { type: "string" },
        profile: { type: "string" },
        plan: { type: "string" },
        ci: { type: "boolean", default: false },
        rules: { type: "boolean", default: false },
        map: { type: "boolean", default: false },
        diff: { type: "string" },
        "fail-on": { type: "string" },
        budget: { type: "string" },
        policy: { type: "string" },
        only: { type: "string" },
        ignore: { type: "string" },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false }
      }
    });
  } catch (err) {
    const message = err.message;
    const hint = /argument is ambiguous/.test(message) ? "\n  (a value that starts with '-' must be written as --option=value; --budget must be positive anyway)" : "";
    process.stderr.write(`
  error: ${message}${hint}
${USAGE}`);
    return 2;
  }
  const { values, positionals } = parsed;
  if (values.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (values.version) {
    process.stdout.write(`${VERSION}
`);
    return 0;
  }
  if (values.rules) {
    process.stdout.write(listRules());
    return 0;
  }
  let command;
  if (positionals[0] === void 0) {
    if (defaultCommand({ isTTY: process.stdin.isTTY === true }) === "usage") {
      process.stdout.write(USAGE);
      return 0;
    }
    command = "mcp";
  } else {
    command = positionals[0];
  }
  const retired = ["include-auto-memory", "follow-external-imports", "auto-memory"].filter((f) => values[f] === true);
  if (retired.length > 0) {
    process.stderr.write(`  note: ${retired.map((f) => `--${f}`).join(", ")} no longer does anything: minnimemory reads only the folder you name
`);
  }
  let named = positionals[1] === void 0 ? void 0 : /^~($|[\\/])/.test(positionals[1]) ? resolveReported(positionals[1]) : positionals[1];
  if (named === void 0 && typeof values["memory-dir"] === "string") named = values["memory-dir"];
  if (named === void 0 && ["doctor", "apply", "undo"].includes(command)) {
    const rec = readDiscovery(process.cwd());
    if (rec) named = rec.target ?? rec.memoryDir ?? rec.project;
  }
  if (named === void 0 && FOLDER_COMMANDS.has(command)) {
    named = askForFolder(command);
    if (named === void 0) return 2;
  }
  const target = named ?? ".";
  if (values.policy !== void 0 && command !== "doctor") {
    process.stderr.write(`
  error: --policy is a doctor option: \`minnimemory doctor <folder> --policy <file>\`

`);
    return 2;
  }
  if (values.diff !== void 0 && values.diff !== "summary" && values.diff !== "full") {
    process.stderr.write(`
  error: --diff takes summary or full, not "${values.diff}"

`);
    return 2;
  }
  const diffMode = values.diff;
  const reportedFiles = [...values.loaded ?? [], ...values["host-file"] ?? []].map((f) => resolveReported(f));
  if (values["from-log"] === true) {
    const log = readLoadLog(process.cwd());
    if (!log) {
      process.stderr.write(`
  error: no load log for ${process.cwd()}: open Claude Code in this folder once (install adds the hook that writes it), then run this again

`);
      return 2;
    }
    for (const f of Object.keys(log.files)) if (/\.md$/i.test(f) && fs3.existsSync(f)) reportedFiles.push(path2.resolve(f));
  }
  const memoryDirFlag = typeof values["memory-dir"] === "string" ? resolveReported(values["memory-dir"]) : void 0;
  const anyReport = reportedFiles.length > 0 || memoryDirFlag !== void 0;
  const freshReport = anyReport || values["only-this-folder"] === true ? { files: [...new Set(reportedFiles)], ...memoryDirFlag ? { memoryDir: memoryDirFlag } : {}, source: values["from-log"] === true && (values.loaded ?? []).length === 0 ? "log" : "terminal", ...values["only-this-folder"] === true ? { onlyThisFolder: true } : {} } : void 0;
  const fromRepo = freshReport || !["doctor", "apply"].includes(command) ? void 0 : repoRecordInUse(target);
  const recorded = freshReport ? void 0 : recordedSet(process.cwd()) ?? (fromRepo ? repoRecordedSet(folderOf(target)) : void 0);
  if (fromRepo) {
    process.stderr.write(`  note: this machine has no init record for this project, so ${command} uses the one in the repo: ${path2.relative(process.cwd(), fromRepo).split(path2.sep).join("/") || fromRepo}
`);
  }
  const discoverOptions = {
    cwd: process.cwd(),
    ...freshReport ? { reported: freshReport } : recorded ? { reported: recorded } : {}
  };
  if (command === "install" || command === "uninstall") {
    let options;
    try {
      options = {
        write: values.write === true,
        scope: parseScope(values.scope),
        dryRun: values["dry-run"] === true,
        force: values.force === true,
        host: parseHost(values.host),
        // The drift hook is on by default (DESIGN.md 6.12, decision 3); --no-hook opts out.
        // Never on for --host: the hook is a Claude Code settings entry, not an MCP host concept
        // (installHook/runInstall already refuse the combination, --host here just avoids
        // tripping that refusal by default on every non-Claude-Code install).
        hook: values.host === void 0 && values["no-hook"] !== true,
        // The hook calls this very CLI by path (driftHookCommand); under npx that is the cached
        // package, under a checkout it is dist/surface/cli.js.
        cliPath: process.argv[1] ? realOrResolved(process.argv[1]) : void 0
      };
    } catch (err) {
      process.stderr.write(`
  error: ${err.message}

`);
      return 2;
    }
    const env = { home: os.homedir(), platform: process.platform, cwd: process.cwd(), configDir: claudeConfigDir() };
    const removing = command === "uninstall" || values.remove === true;
    const result = removing ? runUninstall(options, env, processRunner()) : runInstall(options, env, processRunner());
    const stream = result.exitCode === 0 ? process.stdout : process.stderr;
    stream.write(`
${result.output}
`);
    if (removing) stream.write(`${uninstallNotes()}

`);
    return result.exitCode;
  }
  if (command === "init" || command === "apply") {
    if (command === "init" && (values.write === true || values.update === true)) {
      process.stderr.write(`
  error: init never writes; use apply

`);
      return 2;
    }
    const profileName = values.profile ?? "auto";
    if (profileName !== "auto" && !isProfileName(profileName)) {
      process.stderr.write(`
  error: --profile must be one of auto, none, routing, full (got "${profileName}")

`);
      return 2;
    }
    let budget;
    try {
      budget = parseBudget(values.budget);
    } catch (err) {
      process.stderr.write(`
  error: ${err.message}

`);
      return 2;
    }
    const write = command === "apply";
    const explicitProfile = profileName === "auto" ? void 0 : profileName;
    const episodicJson = values["episodic-json"] === true;
    const cliFlags = [...explicitProfile ? [`--profile ${explicitProfile}`] : [], ...episodicJson ? ["--episodic-json"] : [], ...values["only-this-folder"] === true ? ["--only-this-folder"] : []];
    const previewOptions2 = {
      budget,
      force: values.force === true,
      profileName: explicitProfile,
      episodicJson,
      discover: discoverOptions
    };
    try {
      if (!write) {
        const mapDir = fs3.existsSync(target) && fs3.statSync(target).isFile() ? path2.dirname(path2.resolve(target)) : path2.resolve(target);
        let folderWs;
        try {
          const ws = discover(target, discoverOptions);
          if (ws.shape === "memory-dir") folderWs = ws;
        } catch {
          folderWs = void 0;
        }
        const map = folderWs ? memoryFolderMap(folderWs) : buildClaudeMap(mapDir, { machine: false, projectRoot: mapDir });
        if (values.map === true) {
          process.stdout.write(values.json ? `${JSON.stringify(map, null, 2)}
` : renderClaudeMap(map));
          return 0;
        }
        if (!values.json) process.stdout.write(renderClaudeMap(map));
        const preview = buildPreview(target, previewOptions2);
        if (values.json) {
          const json = JSON.parse(renderPreviewJson(preview, named, cliFlags));
          process.stdout.write(`${JSON.stringify({ map: claudeMapJson(map), ...json }, null, 2)}
`);
        } else process.stdout.write(renderPreviewText(preview, { color: false, ci: values.ci === true, target: named, flags: cliFlags, diff: diffMode }));
        const folder = preview.workspace.folderRoot ?? path2.resolve(target);
        const asMemory = preview.workspace.claudeMemoryFolder ? folder : void 0;
        const where = saveDiscovery(process.cwd(), freshReport ? { ...freshReport, ...freshReport.memoryDir ?? asMemory ? { memoryDir: freshReport.memoryDir ?? asMemory } : {} } : void 0, folder);
        if (freshReport && !values.json) process.stdout.write(where ? `  saved what Claude Code loads here for apply, doctor and undo: ${where}

` : "  could not save the locations; pass them again to apply\n\n");
        return 0;
      }
      const workspace = discover(target, discoverOptions);
      if (workspace.shape === "memory-dir" && !workspace.reported) {
        process.stderr.write(
          `
  error: apply refused: nothing reported the files Claude Code loads, so an import of this folder's files from outside it could break. Run from Claude Code (the agent passes them), or add --from-log (Claude Code's own load log for this folder), or --loaded <path> for each file. If nothing outside this folder loads it, pass --only-this-folder. Nothing was changed.

`
        );
        return 2;
      }
      const plan = planFolder(workspace, { budget: budget ?? workspace.manifest?.budget, profileName: explicitProfile, episodicJson });
      if (values.plan !== void 0 && plan.plan !== values.plan) {
        process.stderr.write(
          `
  error: the plan on disk no longer matches --plan ${values.plan} (now ${plan.plan}); run doctor again

`
        );
        return 2;
      }
      if (plan.verdict === "nothing") {
        process.stdout.write(renderFolderPlan(plan, { write: true }));
        return 0;
      }
      if (plan.verdict === "leave" && values.force !== true) {
        process.stderr.write(
          `
  error: ${leaveReason(plan)} (${plan.before} -> ${plan.after} tokens; break-even ${plan.bounds.breakEvenCarriedTokens} tokens of OnDemandMemory open all session)
  Pass --force to write it anyway.

`
        );
        return 2;
      }
      const report = renderFolderPlan(plan, { write: true, target: named });
      applyFolderPlan(plan, { allowSecrets: values["allow-secrets"] === true });
      process.stdout.write(report);
      return 0;
    } catch (err) {
      if (err instanceof DiscoveryError || err instanceof FolderError) {
        process.stderr.write(`
  error: ${err.message}

`);
        return 2;
      }
      process.stderr.write(`
  unexpected error: ${err.stack ?? String(err)}

`);
      return 2;
    }
  }
  if (command === "undo") {
    try {
      let folderRoot;
      try {
        const ws = discover(target);
        folderRoot = ws.folderRoot;
      } catch (err) {
        if (!(err instanceof DiscoveryError)) throw err;
      }
      if (!folderRoot) {
        process.stdout.write("\n  nothing to undo\n\n");
        return 0;
      }
      const currentManifest = readFolderManifest(folderRoot);
      const oldVersion = currentManifest ? void 0 : readOldManifestVersion(folderRoot);
      const outcome = oldVersion ? planOldManifestUndo(folderRoot, oldVersion) : !currentManifest && manifestLost(folderRoot) ? planLostManifestUndo(folderRoot) : planFolderUndo(folderRoot, currentManifest);
      if (outcome.kind === "none") {
        if (!currentManifest && manifestLost(folderRoot)) {
          process.stderr.write(`
  error: ${undoNoBackupMessage(folderRoot)}

`);
          return 2;
        }
        process.stdout.write("\n  nothing to undo\n\n");
        return 0;
      }
      if (outcome.kind === "kept-only") {
        process.stderr.write(`
  error: undo has nothing left to restore here: ${keptOnlyMessage(outcome.kept)}

`);
        return 2;
      }
      if (outcome.kind === "missing-original") {
        process.stderr.write(
          `
  error: no original copy under ${COMPILED_DIR_NAME}/original/ for: ${outcome.files.join(", ")}.
  Backups stay on the machine that ran apply (they are gitignored), and a clone that re-applied backs up the compiled file, not the original; on a clone, the way back is git history.

`
        );
        return 2;
      }
      const refusal = undoRefusal(outcome.plan);
      if (refusal && values.force !== true) {
        process.stderr.write(`
  error: ${refusal}

`);
        return 2;
      }
      const savedTo = refusal ? backupBeforeForcedUndo(outcome.plan) : void 0;
      applyFolderUndo(outcome.plan);
      process.stdout.write(
        `
  restored ${outcome.plan.operations.filter((o) => o.op === "write" || o.op === "move").length} file(s) in ${folderRoot}
  deleted: ${outcome.plan.operations.filter((o) => o.op === "delete").length} path(s), ${COMPILED_DIR_NAME}/ ${outcome.plan.keptBackups?.length ? "kept" : "included"}
` + (keptBackupsNote(outcome.plan) ? `  ${keptBackupsNote(outcome.plan)}
` : "") + (outcome.plan.left?.length ? `  left in place: ${outcome.plan.left.join(", ")} (without manifest.json undo cannot tell which files there it wrote)
` : "") + (savedTo ? `  the files as they were before this undo are copied to ${savedTo.split(path2.sep).join("/")}
` : "") + "\n"
      );
      return 0;
    } catch (err) {
      if (err instanceof FolderError) {
        process.stderr.write(`
  error: ${err.message}

`);
        return 2;
      }
      process.stderr.write(`
  unexpected error: ${err.stack ?? String(err)}

`);
      return 2;
    }
  }
  if (command === "mcp") {
    if (!MCP_STASHED) return runMcpCommand(target, values);
    void (async () => {
      const [{ StdioServerTransport }, { createDisabledMcpServer, DISABLED_MESSAGE }] = await Promise.all([
        import("./chunks/stdio-5QN5KZ3B.mjs"),
        import("./chunks/mcpServer-3UTS2F5T.mjs")
      ]);
      process.stderr.write(`
  mcp: ${DISABLED_MESSAGE}

`);
      await createDisabledMcpServer().connect(new StdioServerTransport());
    })().catch((err) => {
      process.stderr.write(`
  mcp server failed: ${err.message ?? String(err)}
`);
      process.exitCode = 1;
    });
    return 0;
  }
  if (command === "recall") {
    const query = positionals.slice(2).join(" ").trim();
    if (!query) {
      process.stderr.write(`
  error: recall needs a query: minnimemory recall <path> <query...>

`);
      return 2;
    }
    let maxTokens;
    if (values["max-tokens"] !== void 0) {
      const n = Number(values["max-tokens"]);
      if (!Number.isFinite(n) || n <= 0) {
        process.stderr.write(`
  error: --max-tokens must be a positive number (got "${values["max-tokens"]}")

`);
        return 2;
      }
      maxTokens = Math.floor(n);
    }
    const root = path2.resolve(target);
    try {
      const phase = detectPhase(root);
      let result;
      if (phase === "compiled") {
        result = recall(root, loadManifest(root), query, { maxTokens });
      } else if (phase === "memory-dir") {
        result = recallDir(root, query, { maxTokens });
      } else {
        process.stderr.write(
          `
  error: ${root} is neither a compiled workspace (.minnimemory/manifest.json) nor a manifest-less memory directory (an index file plus topic files) - nothing for recall to query

`
        );
        return 2;
      }
      process.stdout.write(renderRecall(result, values.headings === true));
      return 0;
    } catch (err) {
      if (err instanceof McpTargetError || err instanceof RecallDirError) {
        process.stderr.write(`
  error: ${err.message}

`);
        return 2;
      }
      process.stderr.write(`
  unexpected error: ${err.stack ?? String(err)}

`);
      return 2;
    }
  }
  if (command === "hook") {
    let raw = "";
    try {
      raw = fs3.readFileSync(0, "utf8");
    } catch {
      raw = "";
    }
    let maxTokens;
    if (values["max-tokens"] !== void 0) {
      const n = Number(values["max-tokens"]);
      if (Number.isFinite(n) && n > 0) maxTokens = Math.floor(n);
    }
    try {
      const input = parseHookInput(raw);
      const text = renderHook(input, { headings: values.headings === true, maxTokens, dir: values.dir });
      if (text) process.stdout.write(`${text}
`);
    } catch (err) {
      process.stderr.write(`
  hook: ${err.message ?? String(err)}
`);
    }
    return 0;
  }
  if (command === "loaded") {
    let raw = "";
    try {
      raw = fs3.readFileSync(0, "utf8");
    } catch {
      raw = "";
    }
    try {
      recordLoad(JSON.parse(raw));
    } catch {
    }
    return 0;
  }
  if (command === "drift") {
    let raw = "";
    try {
      raw = fs3.readFileSync(0, "utf8");
    } catch {
      raw = "";
    }
    try {
      const input = parseHookInput(raw);
      const text = renderDriftNotice(input);
      if (text) process.stdout.write(`${text}
`);
    } catch (err) {
      process.stderr.write(`
  drift: ${err.message ?? String(err)}
`);
    }
    return 0;
  }
  if (command === "bench") {
    try {
      const root = path2.resolve(target);
      const manifest = loadManifest(root);
      const turns = values.turns === void 0 ? 50 : Number(values.turns);
      if (!Number.isFinite(turns)) {
        throw new BenchError(`--turns must be a positive whole number (got "${values.turns}")`);
      }
      const b = bounds(manifest, turns);
      if (values.workload === void 0) {
        if (values.json === true) {
          process.stdout.write(`${JSON.stringify({ bounds: b, tokenizer: manifest.tokenizer }, null, 2)}
`);
          return 0;
        }
        process.stdout.write(renderBounds(b, manifest.tokenizer));
        process.stdout.write(renderNoWorkload());
        return 0;
      }
      const tasks = readWorkload(values.workload);
      const m = model(manifest, tasks, values["whole-files"] === true ? {} : { root });
      if (values.json === true) {
        process.stdout.write(
          `${JSON.stringify({ bounds: b, model: m, tokenizer: manifest.tokenizer }, null, 2)}
`
        );
        return 0;
      }
      process.stdout.write(renderBounds(b, manifest.tokenizer));
      process.stdout.write(renderModel(m, manifest.tokenizer));
      return 0;
    } catch (err) {
      if (err instanceof BenchError || err instanceof McpTargetError) {
        process.stderr.write(`
  error: ${err.message}

`);
        return 2;
      }
      process.stderr.write(`
  unexpected error: ${err.stack ?? String(err)}

`);
      return 2;
    }
  }
  if (command !== "doctor") {
    process.stderr.write(`
  error: unknown command "${command}"
${USAGE}`);
    return 2;
  }
  if (!doctorMayRun(target)) {
    process.stderr.write(
      `
  error: run init first: doctor checks memory init has already looked at, and init has no record for this project and ${target} has not been compiled. Run \`${initCommand(target)}\`.

`
    );
    return 2;
  }
  let previewOptions;
  try {
    let policy;
    if (values.policy !== void 0) {
      try {
        policy = loadPolicy(values.policy);
      } catch (err) {
        if (err instanceof PolicyError) throw new Error(`--policy: ${err.message}`);
        throw err;
      }
    }
    previewOptions = {
      discover: discoverOptions,
      budget: parseBudget(values.budget) ?? policy?.budgets.always_on_tokens,
      policy,
      failOn: parseSeverity(values["fail-on"], "high"),
      only: parseIds(values.only),
      ignore: parseIds(values.ignore),
      force: values.force === true
    };
  } catch (err) {
    process.stderr.write(`
  error: ${err.message}

`);
    return 2;
  }
  try {
    const preview = buildPreview(target, previewOptions);
    if (values.json) {
      process.stdout.write(`${renderPreviewJson(preview, named)}
`);
    } else {
      const color = !values.ci && !process.env["NO_COLOR"] && process.stdout.isTTY === true;
      process.stdout.write(renderPreviewText(preview, { color, ci: values.ci === true, target: named, diff: diffMode }));
    }
    return exitCodeFor(preview.audit.findings, preview.config.failOn);
  } catch (err) {
    if (err instanceof DiscoveryError || err instanceof FolderError) {
      process.stderr.write(`
  error: ${err.message}

`);
      return 2;
    }
    process.stderr.write(`
  unexpected error: ${err.stack ?? String(err)}

`);
    return 2;
  }
}
function realOrResolved(p) {
  try {
    return fs3.realpathSync(p);
  } catch {
    return path2.resolve(p);
  }
}
function invokedDirectly() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return fs3.realpathSync(fileURLToPath(import.meta.url)) === fs3.realpathSync(entry);
  } catch {
    return false;
  }
}
if (invokedDirectly()) {
  process.exitCode = main(process.argv.slice(2));
}
export {
  MCP_STASHED,
  defaultCommand,
  main
};
