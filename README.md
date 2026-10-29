# MinniMemoryMCP for Claude Code

MinniMemoryMCP 1.4.2 as a Claude Code plugin. It audits the memory files Claude Code loads
(`CLAUDE.md`, `AGENTS.md`, your memory folder) and compiles them into a small AlwaysOnMemory
body that loads every turn, plus OnDemandMemory files that load only when a task needs them.
Every change is lossless and undoable: the originals are backed up first and `undo` puts them
back byte for byte. Everything runs on your machine, on your own files, only when you ask.
Built by [MinniAI](https://minniai.com).

## Requirements

- Node.js 18.3 or later on your PATH. The server and the hooks run with `node`. Claude Code's
  own installer does not need Node, so check with `node --version` first.
- Claude Code 2.1.275 or later for the one-line install below; older versions add the
  marketplace first (the shell form under it).

## Install

```
/plugin install minnimemory --marketplace MinniAI-com/minnimemory-plugin
```

Or from your shell: `claude plugin marketplace add MinniAI-com/minnimemory-plugin`, then
`claude plugin install minnimemory@minniai`.

The plugin loads in Claude Code, and in Cowork when the session runs on your computer. In
claude.ai chat it is ignored: a local MCP server and hooks do not run there.

Pick one route per machine. If you ran `npx minnimemory install` before, run
`npx -y minnimemory uninstall` first: otherwise the server is registered twice and every prompt
starts two copies of each hook (the second copy stays silent, but you pay its start).

## Use

Three prompts cover the whole loop, in your project in Claude Code:

1. "Clean up my memory with minnimemory." Claude calls `init`, which shows the map of what
   Claude Code loads here, the audit and the change `apply` would make. It writes nothing but
   a small record of where your memory loads from.
2. "Apply it." Claude calls `apply`, which hands back one command and the list of file
   operations; the command runs only through your approval prompt.
3. A week later, "check my memory." Claude calls `doctor`, which shows what drifted and the
   re-apply plan; "undo the memory compile" restores the originals.

The same four steps are slash commands: `/mcp__minnimemory__init`, `doctor`, `apply`, `undo`.

## What it runs, reads, writes and sends

- **An MCP server** (`node server/cli.mjs mcp`) with four tools: `init`, `doctor`, `apply`,
  `undo`. It reads only the folder a tool call names and the files you or Claude tell it Claude
  Code loads; nothing is searched for. `apply` and `undo` return a command and the list of
  file operations, and Claude runs that command only with your approval. The command is
  `node "<plugin folder>/server/cli.mjs" apply --plan <hash> <folder>`: the plugin's own file,
  never a download.
- **Three hooks.** Before each prompt, `drift` checks whether your memory changed since the last
  apply and prints one line when it did; `hook` adds the one short section of memory that
  matches the prompt, inside a block marked as data, once per session, and never a section that
  holds a credential-shaped line (it says so instead). The prompt hook's saving was measured in
  live Claude Code sessions on our own memory folder (the number is on the docs page); on other
  folders it is unmeasured. When Claude Code loads its instructions, `loaded` records
  which file it loaded in a local log that `init` can read later.
- **Also in the bundle, never run by the plugin.** `server/cli.mjs` is the npm package's
  command line, so it also contains the `install` and `uninstall` commands of the npx
  route, which run `claude mcp add` and `claude mcp remove` and write the npx form of the
  hooks into your settings, and a `mcp --profile full` maintainer mode with six more tools
  (recall, outline, list, audit, plan, compile). The plugin starts the server with `mcp` alone,
  the four-tool profile above; nothing in the plugin calls the rest. They are there for someone
  who runs the file by hand.
- **What "memory" means here.** Your own files on disk: `CLAUDE.md`, the files it imports, and
  the memory folder Claude Code keeps for a project, read only when you point a tool at them.
  The plugin never reads chat history, conversation summaries or uploaded files.

## Try it on a sample first

`examples/CLAUDE.md` in this folder is a fictional project's memory file. Copy it into an empty
folder, open Claude Code there and say "Clean up my memory with minnimemory", then "Apply it",
then "undo the memory compile". That is the whole loop on a file you cannot break.

## Security reports

Report a vulnerability to MinniMemory@gmail.com or as a GitHub issue on this repository; both
are read by the maintainer. The plugin makes no network calls, so most reports will be about
what it reads or writes on disk.
- **What it writes, and where.** Under your Claude config folder (`~/.claude` unless
  `CLAUDE_CONFIG_DIR` says otherwise): `minnimemory/discovery.json` (where your memory loads
  from, written by `init`), `minnimemory/loads/<project>.jsonl` (the load log),
  `minnimemory/hook-sessions/<session>.json` (which sections the prompt hook already placed),
  and `minnimemory/undo-backups/` (a copy of what a forced undo discards). In a compiled project
  or memory folder: `.minnimemory/` holds the backups the apply command makes and a small
  drift stamp. No memory file is ever written by the server itself.
- **Nothing is sent anywhere.** The plugin makes no network requests, calls no model and
  collects no data. The only data it reads from your session is the prompt text the hook
  matches against your memory, and that is not stored.

## Troubleshooting

- **"hook failed to start" on every prompt, or the server does not connect.** Node is missing
  or not on the PATH Claude Code sees. Install Node 18.3 or later; a Claude Code started from a
  desktop launcher may need a restart after the install so it picks up the new PATH.
- **The prompt hook never adds anything.** It places a section only when it clearly matches the
  prompt, is small enough to be cheaper placed than read, and is not already in the always-loaded
  body. A tiny or uncompiled memory gives it nothing to place; run `init` and `apply` first.
- **Two servers named minnimemory.** You have both the npx install and the plugin. Run
  `npx -y minnimemory uninstall` and restart Claude Code.
- **`apply` says the plan hash does not match.** A memory file changed since the preview. Run
  `doctor` for a fresh plan, then `apply` again.

Issues: https://github.com/MinniAI-com/minnimemory-plugin/issues. Documentation: https://minniai.com/minnimemorymcp/docs.

## Updates

Turn on auto-update for the `minniai` marketplace in `/plugin`, or run
`claude plugin update minnimemory@minniai`. A new version loads on the next launch
or after `/reload-plugins`.

**Company admins:** keep auto-update off and pin the version in managed settings when every
machine must run the same release.

## Remove

`claude plugin uninstall minnimemory@minniai`. Compiled memory stays compiled;
run `undo` first if you want the originals back. The small records under
`<config>/minnimemory/` stay too; delete that folder if you want nothing left.

## Licence

See `LICENSE`. Third-party code bundled in `server/` is listed with its licences in
`THIRD_PARTY_NOTICES.md`.
