# MinniMemoryMCP for Claude Code

MinniMemoryMCP 1.3.4 as a Claude Code plugin. It audits the memory files Claude Code loads
(`CLAUDE.md`, `AGENTS.md`, your memory folder) and compiles them into a small AlwaysOnMemory
body that loads every turn, plus OnDemandMemory files that load only when a task needs them.
Every change is lossless and undoable: the originals are backed up first and `undo` puts them
back byte for byte. Built by [MinniAI](https://minniai.com).

## Requirements

- Node.js 18.3 or later on your PATH. The server and the hooks run with `node`.
- Claude Code 2.1.275 or later for the one-line install below; older versions add the
  marketplace first (the shell form under it).
- If you installed with `npx minnimemory install` before, run `npx -y minnimemory uninstall`
  first. Otherwise you get two servers and every hook twice.

## Install

```
/plugin install minnimemory --marketplace MinniAI-com/minnimemory-plugin
```

Or from your shell: `claude plugin marketplace add MinniAI-com/minnimemory-plugin`, then
`claude plugin install minnimemory@minniai`.

## Use

In Claude Code, ask for `init` first. It shows the map of what Claude Code loads, the audit and
the change `apply` would make, and writes nothing but that record. Then `apply`, and a week
later `doctor` and `apply` again. `undo` restores the originals. The same four steps are slash
commands from the server's prompts.

## What it runs, reads and sends

- **An MCP server** (`node server/cli.mjs mcp`) with four tools: `init`, `doctor`, `apply`,
  `undo`. It reads only the folder you name. Its one write is the small record `init` saves of
  where Claude Code loads from; it never writes a memory file. `apply` and `undo` return a
  command and the list of file operations, and Claude runs that command only with your approval.
- **Three hooks.** Before each prompt, `drift` checks whether your memory changed since the last
  apply, and `hook` adds the memory that matches the prompt. When Claude Code loads its
  instructions, `loaded` adds that event to a local log of which files it loaded, which `init`
  can read later.
- **Nothing is sent anywhere.** The plugin makes no network requests and collects no data.

## Updates

Turn on auto-update for the `minniai` marketplace in `/plugin`, or run
`claude plugin update minnimemory@minniai`. A new version loads on the next launch
or after `/reload-plugins`.

**Company admins:** keep auto-update off and pin the version in managed settings when every
machine must run the same release.

## Remove

`claude plugin uninstall minnimemory@minniai`. Compiled memory stays compiled;
run `undo` first if you want the originals back.

## Licence

See `LICENSE`. Third-party code bundled in `server/` is listed with its licences in
`THIRD_PARTY_NOTICES.md`.
