#!/usr/bin/env node
/* MinniMemoryMCP (c) 2026 MinniAI. Licensed under the MinniMemoryMCP License, see LICENSE. */
import { createRequire as __minniCreateRequire } from "node:module"; const require = __minniCreateRequire(import.meta.url);
import{$ as Ke,$a as V,Aa as ft,Ba as mt,Ca as ce,Da as ht,Ea as yt,F as _e,G as Fe,H as U,I as de,J as Ie,Ja as gt,L as Ae,La as pe,M as I,Ma as q,N as le,Na as fe,O as Be,Oa as Y,P as ue,Pa as K,Q as Ue,Qa as wt,T as He,Ta as kt,U as Je,Ua as me,V as Ge,Va as he,W as We,Wa as bt,X as ze,Xa as vt,Y as Xe,Ya as $t,Z as qe,Za as xt,_ as Ye,_a as Ct,aa as Ve,ab as St,b as F,ba as Qe,bb as Mt,ca as Ze,cb as Tt,da as et,fa as N,fb as Ot,g as Oe,gb as Et,h as c,ha as tt,hb as Rt,i as Ee,ia as ot,ja as rt,k as A,ka as nt,kb as Dt,l as G,la as st,lb as Pt,m as W,ma as it,mb as jt,n as z,na as X,nb as ye,o as Re,oa as at,p as De,pa as dt,q as re,qb as Nt,r as ne,ra as lt,s as se,sb as ge,t as B,tb as we,u as Pe,ub as ke,v as je,vb as be,w as ie,x as Ne,xa as ut,y as Le,ya as ct,z as ae,za as pt}from"./chunks/chunk-6D66BJSA.mjs";import"./chunks/chunk-EDORHNJU.mjs";import{spawnSync as no}from"node:child_process";import b from"node:fs";import Ut from"node:os";import k from"node:path";import{fileURLToPath as so}from"node:url";import{parseArgs as io}from"node:util";import Xt from"node:fs";function qt(t){return t.split(/\r?\n/).map(n=>n.trim()).filter(n=>n!==""&&!n.startsWith("#"))}function Lt(t){let n;try{n=Xt.readFileSync(t,"utf8")}catch{throw new I(`cannot read workload file: ${t}`)}let e=qt(n);if(e.length===0)throw new I(`workload file has no tasks: ${t}
  one task description per line, # for comments`);return e}function Q(t){return`${t.onDemandFile}:${t.startLine}`}function Yt(t){return`${t.onDemandFile} > ${t.heading}`}function Kt(t,n){let e=F(t).flatMap(d=>G({name:d.name,file:d.file},Ie(n,d.file)));return W(e,new Map(F(t).map(d=>[d.name,d.triggers])))}function _t(t,n,e={}){let d=e.root?Kt(t,e.root):void 0,s=d?"section":"file",w=new Set,u=new Map,l=new Map,E=new Map;for(let o of F(t))u.set(o.name,o.tokens),l.set(o.name,o.name),E.set(o.name,o.name);if(d)for(let o of d.units)u.set(Q(o),o.tokens),l.set(Q(o),Yt(o)),E.set(Q(o),o.onDemandFile);let $=[],C=0;n.forEach((o,i)=>{let a=d?Re(z(d,o)).map(p=>Q(p.unit)):De(t,o).filter(p=>p.score>0).map(p=>p.name);a.length===0&&C++;let f=a.filter(p=>!w.has(p));for(let p of f)w.add(p);let y=[...w].reduce((p,g)=>p+(u.get(g)??0),0);$.push({turn:i+1,task:o,opened:f.map(p=>l.get(p)??p),carried:[...w].map(p=>l.get(p)??p),compiledTokens:t.prefix.after+y,baselineTokens:t.prefix.before})});let S=$.reduce((o,i)=>o+i.compiledTokens,0),m=$.reduce((o,i)=>o+i.baselineTokens,0),M=new Set([...w].map(o=>E.get(o)??o)),L=F(t).map(o=>o.name).filter(o=>M.has(o)),R=[...w].reduce((o,i)=>o+(u.get(i)??0),0),T=t.prefix.after+R,j=t.prefix.before-T,O=m-S,r;return O>=0?(r=$.findIndex((o,i)=>$.slice(0,i+1).reduce((f,y)=>f+y.baselineTokens-y.compiledTokens,0)>=0),r=r>=0?r+1:void 0):j>0&&(r=$.length+Math.ceil(-O/j)),{unit:s,turns:$,baselineTotal:m,compiledTotal:S,saving:O,savingPct:m===0?0:O/m*100,onDemandOpened:L,onDemandNeverOpened:F(t).map(o=>o.name).filter(o=>!M.has(o)),unroutedTurns:C,steadyStatePerTurn:T,steadyStateGainPerTurn:j,breakEvenTurn:r}}function Vt(t,n){return n===0?"0.0%":`${(t/n*100).toFixed(1)}%`}function ve(t){return t>=0?`saves ${c(t)}`:`costs ${c(-t)} more`}function $e(t,n){let e=[""];return e.push(`  exact, over ${c(t.turns)} turns. No workload, no assumptions.`),e.push(""),e.push(`    original memory file      ${c(t.baselinePerTurn).padStart(8)} tokens per turn`),e.push(`    compiled always-loaded    ${c(t.compiledPerTurn).padStart(8)} tokens per turn`),e.push(`    OnDemandMemory, all of it   ${c(t.totalOnDemandTokens).padStart(8)} tokens, on demand`),e.push(""),e.push("    best case, no OnDemandMemory file ever opened"),e.push(`      ${c(t.baselineTotal)} -> ${c(t.bestCaseTotal)} tokens, ${ve(t.bestCaseSaving)} (${Vt(t.bestCaseSaving,t.baselineTotal)})`),e.push(""),e.push("    worst case, every OnDemandMemory file opened on turn 1 and carried"),e.push(`      ${c(t.baselineTotal)} -> ${c(t.worstCaseTotal)} tokens, ${ve(t.worstCaseSaving)}`),e.push(""),e.push(`    break-even: ${c(t.breakEvenCarriedTokens)} tokens of OnDemandMemory can sit in`),e.push("    context from turn 1 to the end and come out even. Past that the compiled"),e.push("    shape costs more than the file it replaced."),e.push(""),e.push(`  tokenizer: ${n}, an offline estimate`),e.push(""),e.join(`
`)}function Ft(t,n){let e=[""],d=t.turns.length;if(e.push(`  MODEL, not a measurement. ${c(d)} turns from the workload you supplied.`),e.push(t.unit==="section"?"  routed at section level, as recall() does: a hit carries the section, not the file.":"  routed at file level, as an agent reading a whole file the OnDemandMemory list named would."),e.push(""),e.push(`    memory tokens over the session   ${c(t.baselineTotal)} -> ${c(t.compiledTotal)}`),e.push(`    ${ve(t.saving)}${t.saving>=0?` (${t.savingPct.toFixed(1)}%)`:""}`),e.push(""),t.onDemandOpened.length>0){e.push(`    opened and carried (${t.onDemandOpened.length}):`);for(let s of t.onDemandOpened)e.push(`      ${s}`);e.push("")}if(t.onDemandNeverOpened.length>0){e.push(`    never opened (${t.onDemandNeverOpened.length}) - this is where the saving comes from:`);for(let s of t.onDemandNeverOpened)e.push(`      ${s}`);e.push("")}return e.push("    one more turn, once everything this workload opens is in context:"),e.push(`      ${c(t.steadyStatePerTurn)} vs ${c(t.turns[0]?.baselineTokens??0)} baseline, ${t.steadyStateGainPerTurn>=0?`saves ${c(t.steadyStateGainPerTurn)}`:`costs ${c(-t.steadyStateGainPerTurn)} more`} per turn`),e.push(""),t.saving<0&&t.steadyStateGainPerTurn<=0?(e.push("    this workload never breaks even. The OnDemandMemory files it opens are large enough that"),e.push("    carrying them costs more every turn than the original file did, so a longer"),e.push("    session loses more, not less. Splitting differently, or not compiling this"),e.push("    file at all, is the honest answer here."),e.push("")):t.saving<0&&t.breakEvenTurn!==void 0?(e.push(`    behind by ${c(-t.saving)} at turn ${c(t.turns.length)}, recovering ${c(t.steadyStateGainPerTurn)} per turn:`),e.push(`    breaks even around turn ${c(t.breakEvenTurn)} if nothing further opens.`),e.push("")):t.saving>=0&&t.breakEvenTurn!==void 0&&(e.push(`    ahead from turn ${c(t.breakEvenTurn)} onward.`),e.push("")),t.unroutedTurns>0&&(e.push(`    ${c(t.unroutedTurns)} of ${c(d)} turns matched no OnDemandMemory file at all.`),e.push("    Those turns are cheap here, but a real agent may have needed something and"),e.push("    not been routed to it. Check them before trusting the total."),e.push("")),e.push("  what this number is conditional on:"),e.push("    - your workload being what a real session looks like. It is your file;"),e.push("      the tool cannot tell whether it is representative."),t.unit==="section"?(e.push("    - every section recall() returns being carried for the rest of the session,"),e.push("      up to its token cap per turn. A real agent may widen with outline() or"),e.push("      read the whole file anyway.")):(e.push("    - every OnDemandMemory file whose triggers match being opened in full. A real"),e.push("      agent may read one and stop, or ignore one the list offered.")),e.push("    - memory tokens only. Reasoning, tool results and conversation are excluded"),e.push("      from both sides, so this ratio is not a session bill."),e.push(""),e.push("  For observed usage against a live agent, measure a real multi-turn session with"),e.push("  and without the compile. That is the only path allowed to call a number measured."),e.push(""),e.push(`  tokenizer: ${n}, an offline estimate`),e.push(""),e.join(`
`)}function It(){return["","  No workload given, so only the exact bounds above are available.","","  A session number needs a workload: a file with one task description per line,","  describing what you actually do in this repo.","","    minnimemory bench --workload tasks.txt","","  minnimemory ships no default task list on purpose. A number produced from tasks","  the tool invented for itself would say more about the tool than about your repo.",""].join(`
`)}import H from"node:fs";import P from"node:path";var Qt=800,Zt=1200,At=1024*1024;function eo(t){try{let n=JSON.parse(t);if(n.type!=="user"||n.isMeta===!0||n.message?.role!=="user")return;let e=n.message.content;return typeof e=="string"?e.trim()||void 0:!Array.isArray(e)||e.some(s=>s?.type==="tool_result")?void 0:e.filter(s=>s?.type==="text"&&typeof s.text=="string").map(s=>s.text).join(`
`).trim()||void 0}catch{return}}function to(t){if(t)try{let n=H.statSync(t).size;for(let e of n>At?[n-At,0]:[0]){let d=H.openSync(t,"r"),s;try{let u=Buffer.alloc(n-e);H.readSync(d,u,0,u.length,e),s=u.toString("utf8")}finally{H.closeSync(d)}let w=s.split(`
`);for(let u=w.length-1;u>=(e>0?1:0);u--){let l=eo(w[u]);if(l)return l}}}catch{}}function oo(t,n){if(!n)return;let e=Tt(P.resolve(n));if(!e)return;let d=P.resolve(t);if(ae(P.dirname(d))!==ae(P.resolve(e)))return;let s=P.basename(d);if(!(!/\.md$/i.test(s)||/^MEMORY\.md$/i.test(s)))return{root:P.resolve(e),rel:s}}function ro(t){if(!t||typeof t!="object")return;let n=t,e=n.file;if(!(n.type!=="text"||!e||typeof e.content!="string"||typeof e.filePath!="string"))return t}function Bt(t){try{if(t.toolName!=="Read"||!t.filePath||!t.sessionId||t.offset!==void 0||t.limit!==void 0)return"";let n=ro(t.response);if(!n||n.file.startLine>1)return"";let e=rt(t.filePath)??oo(t.filePath,t.cwd);if(!e)return"";let d=H.readFileSync(P.join(e.root,e.rel),"utf8");if(Oe(d)<Qt)return"";let s=to(t.transcriptPath);if(!s)return"";let w=new Set(A(s)).size,u=Math.min(w,Math.max(2,Math.ceil(w/2))),l=G({name:P.basename(e.rel).replace(/\.md$/i,""),file:e.rel},d),E=z(W(l),s,l.length).map(o=>({...o.unit,score:o.score,matched:o.matched})),$=l.map(o=>new Set(A(o.content))),C=[...new Set(A(s))].filter(o=>{let i=$.filter(a=>a.has(o)).length;return i>0&&i<=Math.floor(l.length/2)});if(C.length===0)return"";let S=[],m=0;for(let o of E){let i=new Set(A(o.content));if(!(o.matched<u||!C.some(a=>i.has(a)))&&!S.some(a=>o.startLine<=a.endLine&&o.endLine>=a.startLine)){if(m+o.tokens>Zt&&S.length>0)break;S.push(o),m+=o.tokens}}if(S.length===0)return"";S.sort((o,i)=>o.startLine-i.startLine);let M=d.split(/\r?\n/),L=S.map(o=>`--- lines ${o.startLine}-${o.endLine} of ${M.length} ---
${M.slice(o.startLine-1,o.endLine).join(`
`)}`),R=l.filter(o=>o.kind==="section"&&o.path.length<=2&&!S.some(i=>o.startLine<=i.endLine&&o.endLine>=i.startLine)),T=[...new Map(R.map(o=>[`${o.startLine}-${o.endLine}`,`${o.path.join(" > ")} (lines ${o.startLine}-${o.endLine})`])).values()],O=`${`minnimemory: this Read shows the ${S.length} section(s) of ${e.rel} that match the current prompt.`+(T.length?` Not shown: ${T.join("; ")}. Read with offset and limit to see one.`:" Read with offset and limit to see the rest.")}

${L.join(`

`)}
`,r={...n,file:{...n.file,content:O,numLines:O.split(`
`).length,startLine:1}};return JSON.stringify({hookSpecificOutput:{hookEventName:"PostToolUse",updatedToolOutput:r}})}catch{return""}}var ao=!1,Z=`
minnimemory ${be}  the agent memory compiler

usage: the four lifecycle verbs, the CLI and the MCP basic profile share.
The only difference is who writes: the CLI writes to disk itself, the MCP tools return the
command that does (and the operations it performs) for the agent to run.
  minnimemory init <folder>     always first: takes where the host loads from (Claude Code:
                                 --loaded, --from-log, --memory-dir, or the agent over MCP;
                                 Codex: its own load rules, the agent's report over MCP),
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
  minnimemory uninstall          remove the registration and the hooks install added (four on
                                 Claude Code, two on Codex; same as install --remove); lists
                                 folders still compiled, to undo first
  minnimemory bench <folder>    what the compiled shape costs over a session
  minnimemory recall <path> <query...>
                                 recall against a compiled workspace or a manifest-less memory
                                 directory (Layout B), whichever <path> is, change nothing
  minnimemory hook               UserPromptSubmit hook (Claude Code, Codex): reads hook JSON from stdin,
                                 prints a fenced memory block to stdout, or nothing on no hit.
                                 Experimental: measured offline only, not yet in a
                                 live session
  minnimemory drift              UserPromptSubmit hook (Claude Code, Codex): prints a one-line notice when
                                 memory files changed since the last apply, once per change,
                                 nothing otherwise
  minnimemory loaded             Claude Code only, InstructionsLoaded hook: records which memory files
                                 Claude Code loaded, for the map init prints; reads hook JSON
                                 from stdin, prints nothing
  minnimemory read               Claude Code only, PostToolUse hook on Read: logs which
                                 OnDemandMemory files sessions open, for doctor's MM024; prints
                                 nothing. --precise (install --precise-reads, off by default):
                                 a whole-file Read of a large OnDemandMemory file returns only
                                 the sections the prompt needs

install options
  --scope <name>          user, project or local, same meaning as claude mcp add   (default user)
  --write                 serve the full profile with its write tools (--profile full
                           --allow-write); the default basic profile never writes
  --dry-run               print the command without running it, exit 0
  --force                 remove an existing registration first, then re-add
  --no-hook               skip the hooks (memory, drift notice, and on Claude Code the load
                           log and the Read usage log); on by default
  --precise-reads         the Read hook also trims a whole-file Read of a large OnDemandMemory
                           file to the sections the prompt needs; off by default (unproven live)
  --remove                remove the MCP registration and the hooks install added (= uninstall)
  --host <name>           codex: register with Codex (codex mcp add) and write the two
                           UserPromptSubmit hooks to ~/.codex/hooks.json (--scope user) or
                           <repo>/.codex/hooks.json (--scope project; no local scope), then
                           run /hooks inside Codex once to trust them
                          cursor, windsurf or json: print the mcpServers snippet (and the
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
  --host <name>           claude or codex: whose load rules apply (default: detected; codex when
                           CODEX_HOME is set or a Codex config.toml registers minnimemory). Codex
                           loads one AGENTS.md chain under project_doc_max_bytes, so --loaded and
                           --from-log are not needed there
  --host <name>           claude or codex: whose load rules apply (default: detected; codex when
                           CODEX_HOME is set or a Codex config.toml registers minnimemory). Codex
                           loads one AGENTS.md chain under project_doc_max_bytes, so --loaded and
                           --from-log are not needed there
  --diff <mode>           summary: the plan and the operation list, no file diffs; full: every
                           diff too                                        (default full)
  --budget <n>            always-loaded token budget AlwaysOnMemory must fit    (default: 60% of the file, at least 2000)
  --profile <name>        how much token-discipline guidance to embed      (default auto)
                            auto     same as none today, for every source
                            none     structure only, embed nothing
                            routing  the rules that make routing work, about 210 tokens
                            output   the answer-length rules alone, about 230 tokens
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
  --host <name>           claude or codex: whose load rules apply (default: detected; codex when
                           CODEX_HOME is set or a Codex config.toml registers minnimemory). Codex
                           loads one AGENTS.md chain under project_doc_max_bytes, so --loaded and
                           --from-log are not needed there
  --host <name>           claude or codex: whose load rules apply (default: detected; codex when
                           CODEX_HOME is set or a Codex config.toml registers minnimemory). Codex
                           loads one AGENTS.md chain under project_doc_max_bytes, so --loaded and
                           --from-log are not needed there
  --budget <n>            always-loaded token budget AlwaysOnMemory must fit    (default: 60% of the file, at least 2000)
  --profile <name>        how much token-discipline guidance to embed      (default auto)
                            auto     same as none today, for every source
                            none     structure only, embed nothing
                            routing  the rules that make routing work, about 210 tokens
                            output   the answer-length rules alone, about 230 tokens
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
  --host <name>           claude or codex: whose load rules apply (default: detected; codex when
                           CODEX_HOME is set or a Codex config.toml registers minnimemory). Codex
                           loads one AGENTS.md chain under project_doc_max_bytes, so --loaded and
                           --from-log are not needed there
  --host <name>           claude or codex: whose load rules apply (default: detected; codex when
                           CODEX_HOME is set or a Codex config.toml registers minnimemory). Codex
                           loads one AGENTS.md chain under project_doc_max_bytes, so --loaded and
                           --from-log are not needed there
  --only <ids>            run only these rules, comma separated
  --ignore <ids>          skip these rules, comma separated
  --rules                 list the rule set and exit
  -h, --help              this message
  -v, --version           print the version

<folder> is required: a repo, a memory directory, or a single file. With none, minnimemory asks
for it (in a terminal) or stops and says so. Type . for the current folder. An @import that
points outside the folder is not read; the report names it.
`;function lo(){let t=["","  rule set",""];for(let n of it)t.push(`  ${n.id.padEnd(8)}${n.severity.padEnd(6)}${n.title}`);return t.push(""),t.join(`
`)}function uo(t,n){if(t===void 0)return n;if(t==="low"||t==="med"||t==="high")return t;throw new Error(`--fail-on must be one of low, med, high (got "${t}")`)}function Ht(t){return t?t.split(",").map(n=>n.trim()).filter(Boolean):[]}function co(t,n){return t.matches.length===0?`
  no match for "${t.query}"

`:n?`${t.matches.map(e=>`${e.onDemandFile} > ${e.path.join(" > ")} (${e.tokens} tokens)`).join(`
`)}
`:`${t.matches.map(e=>`## ${e.onDemandFile} > ${e.path.join(" > ")} (lines ${e.startLine}-${e.endLine}, ${e.tokens} tokens, score ${e.score})

${e.content}`).join(`

---

`)}
`}function po(t){return t.isTTY?"usage":"serve"}function Jt(){return(t,n)=>{let e=process.platform==="win32",d=no(t,e?Ye(n):n,{encoding:"utf8",shell:e});return{code:d.status,stdout:d.stdout??"",stderr:d.stderr??"",error:d.error}}}function fo(t){if(t===void 0||t==="user")return"user";if(t==="project"||t==="local")return t;throw new Error(`--scope must be one of user, project, local (got "${t}")`)}var mo=["cursor","windsurf","json","codex"];function Gt(t){if(t!==void 0){if(mo.includes(t))return t;throw new Error(`--host must be one of codex, cursor, windsurf, json (got "${t}")`)}}function Wt(t){if(t===void 0)return;let n=Number(t);if(!Number.isInteger(n)||n<=0||n>re)throw new Error(`--budget must be a whole number of tokens from 1 to ${re.toLocaleString("en-US")} (got "${t}")`);return Math.floor(n)}function ho(t,n){let e;try{if(e=k.resolve(t),!b.existsSync(e)||!b.statSync(e).isDirectory())throw new U(`not a directory: ${e}`)}catch(s){return s instanceof U?(process.stderr.write(`
  error: ${s.message}

`),2):(process.stderr.write(`
  unexpected error: ${s.stack??String(s)}

`),2)}let d=n.profile??"basic";return d!=="basic"&&d!=="full"?(process.stderr.write(`
  error: --profile must be one of basic, full (got "${d}")

`),2):((async()=>{let[{StdioServerTransport:s},{createMcpServer:w}]=await Promise.all([import("./chunks/stdio-4LUDCT2D.mjs"),import("./chunks/mcpServer-FZD7UJ46.mjs")]);await w(e,{profile:d,allowWrite:n["allow-write"]===!0,host:Pe()}).connect(new s)})().catch(s=>{process.stderr.write(`
  mcp server failed: ${s.message??String(s)}
`),process.exitCode=1}),0)}function yo(){let t=Ct(),n=[];if(t.length>0){n.push("still compiled (they keep working without minnimemory; to put the originals back, undo each one):");for(let d of t)n.push(`  ${_e(d)}`)}let e=N().keepsLoadAndUsageLogs;return n.push(`kept: ${k.dirname(vt())} (init records, ${e?"the load log, the usage log, ":""}undo backups); delete it yourself once you have checked undo-backups/.`),n.push(`restart ${ie()}.`),n.join(`
`)}var go=new Set(["init","doctor","apply","undo","bench"]);function wo(t){if(V(process.cwd()))return!0;let n=xe(t);return fe(n)==="compiled"||he(n)!==void 0||ue(n)!==void 0}function xe(t){let n=k.resolve(t);return b.existsSync(n)&&b.statSync(n).isFile()?k.dirname(n):n}function ko(t){if(V(process.cwd()))return;let n=xe(t);return ue(n)?Be(n):void 0}function bo(t){let n=`minnimemory ${t} <folder>`;if(process.stdin.isTTY!==!0){process.stderr.write(`
  error: name the folder to read: ${n} (type . for the current folder)

`);return}process.stdout.write(`
  Which folder should minnimemory ${t} read? Only that folder and the folders below it are read.
  folder: `);let e=vo().trim();if(e===""){process.stderr.write(`
  error: no folder given; run ${n}

`);return}return e}function vo(){let t=Buffer.alloc(1),n="";for(;;){let e;try{e=b.readSync(0,t,0,1,null)}catch{break}if(e===0)break;let d=t.toString("utf8");if(d===`
`)break;d!=="\r"&&(n+=d)}return n}function $o(t){let n;try{n=io({args:t,allowPositionals:!0,strict:!0,options:{json:{type:"boolean",default:!1},write:{type:"boolean",default:!1},force:{type:"boolean",default:!1},update:{type:"boolean",default:!1},"allow-secrets":{type:"boolean",default:!1},"episodic-json":{type:"boolean",default:!1},"allow-write":{type:"boolean",default:!1},"follow-external-imports":{type:"boolean",default:!1},"include-auto-memory":{type:"boolean",default:!1},scope:{type:"string"},"dry-run":{type:"boolean",default:!1},"auto-memory":{type:"boolean",default:!1},hook:{type:"boolean",default:!1},"no-hook":{type:"boolean",default:!1},"precise-reads":{type:"boolean",default:!1},precise:{type:"boolean",default:!1},remove:{type:"boolean",default:!1},host:{type:"string"},"host-file":{type:"string",multiple:!0},loaded:{type:"string",multiple:!0},"memory-dir":{type:"string"},"from-log":{type:"boolean",default:!1},"only-this-folder":{type:"boolean",default:!1},turns:{type:"string"},workload:{type:"string"},"whole-files":{type:"boolean",default:!1},"max-tokens":{type:"string"},headings:{type:"boolean",default:!1},dir:{type:"string"},profile:{type:"string"},plan:{type:"string"},ci:{type:"boolean",default:!1},rules:{type:"boolean",default:!1},map:{type:"boolean",default:!1},diff:{type:"string"},"fail-on":{type:"string"},budget:{type:"string"},policy:{type:"string"},only:{type:"string"},ignore:{type:"string"},help:{type:"boolean",short:"h",default:!1},version:{type:"boolean",short:"v",default:!1}}})}catch(r){let o=r.message,i=/argument is ambiguous/.test(o)?`
  (a value that starts with '-' must be written as --option=value; --budget must be positive anyway)`:"";return process.stderr.write(`
  error: ${o}${i}
${Z}`),2}let{values:e,positionals:d}=n;if(e.help)return process.stdout.write(Z),0;if(e.version)return process.stdout.write(`${be}
`),0;if(e.rules)return process.stdout.write(lo()),0;let s;if(d[0]===void 0){if(po({isTTY:process.stdin.isTTY===!0})==="usage")return process.stdout.write(Z),0;s="mcp"}else s=d[0];let w=["include-auto-memory","follow-external-imports","auto-memory"].filter(r=>e[r]===!0);w.length>0&&process.stderr.write(`  note: ${w.map(r=>`--${r}`).join(", ")} no longer does anything: minnimemory reads only the folder you name
`);let u=d[1]===void 0?void 0:/^~($|[\\/])/.test(d[1])?Y(d[1]):d[1];if(u===void 0&&typeof e["memory-dir"]=="string"&&(u=e["memory-dir"]),u===void 0&&["doctor","apply","undo"].includes(s)){let r=V(process.cwd());r&&(u=r.target??r.memoryDir??r.project)}if(u===void 0&&go.has(s)&&(u=bo(s),u===void 0))return 2;let l=u??".";if(s!=="install"&&s!=="uninstall")if(e.host!==void 0){if(!se(e.host))return process.stderr.write(`
  error: --host must be claude or codex for ${s} (got "${e.host}")

`),2;B(e.host)}else["init","doctor","apply","undo","mcp"].includes(s)?B(Ne({env:process.env,home:Ut.homedir(),cwd:process.cwd()})):B("claude");if(e.policy!==void 0&&s!=="doctor")return process.stderr.write(`
  error: --policy is a doctor option: \`minnimemory doctor <folder> --policy <file>\`

`),2;if(e.diff!==void 0&&e.diff!=="summary"&&e.diff!=="full")return process.stderr.write(`
  error: --diff takes summary or full, not "${e.diff}"

`),2;let E=e.diff,$=[...e.loaded??[],...e["host-file"]??[]].map(r=>Y(r));if(e["from-log"]===!0){let r=He(process.cwd());if(!r)return process.stderr.write(`
  error: no load log for ${process.cwd()}: open Claude Code in this folder once (install adds the hook that writes it), then run this again

`),2;for(let o of Object.keys(r.files))/\.md$/i.test(o)&&b.existsSync(o)&&$.push(k.resolve(o))}let C=typeof e["memory-dir"]=="string"?Y(e["memory-dir"]):void 0;if(C&&N().isGeneratedMemory(C))return process.stderr.write(`
  error: ${C.split(k.sep).join("/")} is Codex's own memories folder: Codex generates and rewrites it, so minnimemory lists it in the map and never compiles it. Run init on the project; Codex's AGENTS.md files are what it works on.

`),2;let m=$.length>0||C!==void 0||e["only-this-folder"]===!0?{files:[...new Set($)],...C?{memoryDir:C}:{},source:e["from-log"]===!0&&(e.loaded??[]).length===0?"log":"terminal",...e["only-this-folder"]===!0?{onlyThisFolder:!0}:{}}:void 0,M=m||!["doctor","apply"].includes(s)?void 0:ko(l),L=m?void 0:St(process.cwd())??(M?Ue(xe(l)):void 0);M&&process.stderr.write(`  note: this machine has no init record for this project, so ${s} uses the one in the repo: ${k.relative(process.cwd(),M).split(k.sep).join("/")||M}
`);let R={cwd:process.cwd(),...m?{reported:m}:L?{reported:L}:{}},T,j;if(["init","doctor","apply","undo"].includes(s)){let r=wt(l,{reported:m});r&&(T=kt(l,r),j=k.resolve(l),l=r.dir,u=r.dir,s!=="init"&&e.json!==!0&&process.stdout.write(`
  ${T}
`))}if(s==="install"||s==="uninstall"){let r;try{r={write:e.write===!0,scope:fo(e.scope),dryRun:e["dry-run"]===!0,force:e.force===!0,host:Gt(e.host),hook:qe(Gt(e.host))&&e["no-hook"]!==!0,preciseReads:e["precise-reads"]===!0,cliPath:process.argv[1]?xo(process.argv[1]):void 0}}catch(y){return process.stderr.write(`
  error: ${y.message}

`),2}let o={home:Ut.homedir(),platform:process.platform,cwd:process.cwd(),configDir:Le(),codexConfigDir:je("codex"),...process.env.CODEX_HOME?{codexHome:process.env.CODEX_HOME}:{}},i=s==="uninstall"||e.remove===!0;i&&se(r.host)&&B(r.host);let a=i?Ke(r,o,Jt()):Ve(r,o,Jt()),f=a.exitCode===0?process.stdout:process.stderr;return f.write(`
${a.output}
`),i&&f.write(`${yo()}

`),a.exitCode}if(s==="init"||s==="apply"){if(s==="init"&&(e.write===!0||e.update===!0))return process.stderr.write(`
  error: init never writes; use apply

`),2;let r=e.profile??"auto";if(r!=="auto"&&!Ee(r))return process.stderr.write(`
  error: --profile must be one of auto, none, routing, output, full (got "${r}")

`),2;let o;try{o=Wt(e.budget)}catch(g){return process.stderr.write(`
  error: ${g.message}

`),2}let i=s==="apply",a=r==="auto"?void 0:r,f=e["episodic-json"]===!0,y=[...N().cliFlags,...a?[`--profile ${a}`]:[],...f?["--episodic-json"]:[],...e["only-this-folder"]===!0?["--only-this-folder"]:[]],p={budget:o,force:e.force===!0,profileName:a,episodicJson:f,discover:R};try{if(!i){let h=b.existsSync(l)&&b.statSync(l).isFile()?k.dirname(k.resolve(l)):k.resolve(l),v;try{let _=K(l,R);_.shape==="memory-dir"&&(v=_)}catch{v=void 0}let D=!v&&N().loadsChain?Qe(process.cwd(),{projectRoot:j??h}):void 0,te=D?void 0:v?ze(v):Ge(h,{machine:!1,projectRoot:h}),Ce=D?Ze(D):Xe(te),zt=()=>D?et(D):We(te);if(e.map===!0)return process.stdout.write(e.json?`${JSON.stringify(D??te,null,2)}
`:Ce),0;e.json||process.stdout.write(Ce),T&&!e.json&&process.stdout.write(`  ${T}

`);let J=ge(l,p);if(e.json){let _=JSON.parse(ke(J,u,y));process.stdout.write(`${JSON.stringify({map:zt(),..._},null,2)}
`)}else process.stdout.write(we(J,{color:!1,ci:e.ci===!0,target:u,flags:y,diff:E}));let oe=J.workspace.folderRoot??k.resolve(l),Se=J.workspace.claudeMemoryFolder?oe:void 0,Me=$t(process.cwd(),m?{...m,...m.memoryDir??Se?{memoryDir:m.memoryDir??Se}:{}}:void 0,oe);!m&&D&&Mt(process.cwd(),D.chain.map(_=>_.abs)),m&&!e.json&&process.stdout.write(Me?`  saved what ${ie()} loads here for apply, doctor and undo: ${Me}

`:`  could not save the locations; pass them again to apply

`);let Te=xt(process.cwd(),oe);return Te&&process.stderr.write(`  ${Te}

`),0}let g=K(l,R);if(g.shape==="memory-dir"&&!g.reported)return process.stderr.write(`
  error: apply refused: nothing reported the files Claude Code loads, so an import of this folder's files from outside it could break. Run from Claude Code (the agent passes them), or add --from-log (Claude Code's own load log for this folder), or --loaded <path> for each file. If nothing outside this folder loads it, pass --only-this-folder. Nothing was changed.

`),2;let x=dt(g,{budget:o??g.manifest?.budget,profileName:a,episodicJson:f,sortAnyway:e.force===!0});if(e.plan!==void 0&&x.plan!==e.plan)return process.stderr.write(`
  error: the plan on disk no longer matches --plan ${e.plan} (now ${x.plan}); run doctor again

`),2;if(x.verdict==="nothing")return process.stdout.write(pe(x,{write:!0})),0;if(x.verdict==="leave"&&e.force!==!0)return process.stderr.write(`
  error: ${gt(x)} (${x.before} -> ${x.after} tokens; break-even ${x.bounds.breakEvenCarriedTokens} tokens of OnDemandMemory open all session)
  Pass --force to write it anyway.

`),2;let ee=pe(x,{write:!0,target:u});return lt(x,{allowSecrets:e["allow-secrets"]===!0}),process.stdout.write(ee),0}catch(g){return g instanceof q||g instanceof X?(process.stderr.write(`
  error: ${g.message}

`),2):(process.stderr.write(`
  unexpected error: ${g.stack??String(g)}

`),2)}}if(s==="undo")try{let r;try{r=K(l).folderRoot}catch(h){if(!(h instanceof q))throw h}if(!r)return process.stdout.write(`
  nothing to undo

`),0;let o=he(r),i=o?void 0:bt(r),a=i?yt(r,i):!o&&me(r)?ft(r):pt(r,o);if(a.kind==="none")return!o&&me(r)?(process.stderr.write(`
  error: ${at(r)}

`),2):(process.stdout.write(`
  nothing to undo

`),0);if(a.kind==="kept-only")return process.stderr.write(`
  error: undo has nothing left to restore here: ${mt(a.kept)}

`),2;if(a.kind==="missing-original")return process.stderr.write(`
  error: no original copy under ${ne}/original/ for: ${a.files.join(", ")}.
  Backups stay on the machine that ran apply (they are gitignored), and a clone that re-applied backs up the compiled file, not the original; on a clone, the way back is git history.

`),2;let f=ut(a.plan);if(f&&e.force!==!0)return process.stderr.write(`
  error: ${f}

`),2;let y=f?ct(a.plan):void 0;ht(a.plan);let p=[a.plan,...a.plan.chain??[]],g=h=>h.operations.filter(v=>v.op==="write"||v.op==="move").length,x=h=>h.operations.filter(v=>v.op==="delete").length,ee=p.length===1?`
  restored ${g(a.plan)} file(s) in ${r}
`:`
  restored ${p.reduce((h,v)=>h+g(v),0)} file(s) in ${p.length} folders:
`+p.map(h=>`    ${h===a.plan?r:h.root}: ${g(h)} file(s)
`).join("");return process.stdout.write(ee+`  deleted: ${p.reduce((h,v)=>h+x(v),0)} path(s), ${ne}/ ${a.plan.keptBackups?.length?"kept":"included"}
`+(ce(a.plan)?`  ${ce(a.plan)}
`:"")+(a.plan.left?.length?`  left in place: ${a.plan.left.join(", ")} (without manifest.json undo cannot tell which files there it wrote)
`:"")+(y?`  the files as they were before this undo are copied to ${y.split(k.sep).join("/")}
`:"")+`
`),0}catch(r){return r instanceof X?(process.stderr.write(`
  error: ${r.message}

`),2):(process.stderr.write(`
  unexpected error: ${r.stack??String(r)}

`),2)}if(s==="mcp")return ao?((async()=>{let[{StdioServerTransport:r},{createDisabledMcpServer:o,DISABLED_MESSAGE:i}]=await Promise.all([import("./chunks/stdio-4LUDCT2D.mjs"),import("./chunks/mcpServer-FZD7UJ46.mjs")]);process.stderr.write(`
  mcp: ${i}

`),await o().connect(new r)})().catch(r=>{process.stderr.write(`
  mcp server failed: ${r.message??String(r)}
`),process.exitCode=1}),0):ho(l,e);if(s==="recall"){let r=d.slice(2).join(" ").trim();if(!r)return process.stderr.write(`
  error: recall needs a query: minnimemory recall <path> <query...>

`),2;let o;if(e["max-tokens"]!==void 0){let a=Number(e["max-tokens"]);if(!Number.isFinite(a)||a<=0)return process.stderr.write(`
  error: --max-tokens must be a positive number (got "${e["max-tokens"]}")

`),2;o=Math.floor(a)}let i=k.resolve(l);try{let a=fe(i),f;if(a==="compiled")f=Ae(i,de(i),r,{maxTokens:o});else if(a==="memory-dir")f=Et(i,r,{maxTokens:o});else return process.stderr.write(`
  error: ${i} is neither a compiled workspace (.minnimemory/manifest.json) nor a manifest-less memory directory (an index file plus topic files) - nothing for recall to query

`),2;return process.stdout.write(co(f,e.headings===!0)),0}catch(a){return a instanceof U||a instanceof Ot?(process.stderr.write(`
  error: ${a.message}

`),2):(process.stderr.write(`
  unexpected error: ${a.stack??String(a)}

`),2)}}if(s==="hook"){let r="";try{r=b.readFileSync(0,"utf8")}catch{r=""}let o;if(e["max-tokens"]!==void 0){let i=Number(e["max-tokens"]);Number.isFinite(i)&&i>0&&(o=Math.floor(i))}try{let i=ye(r);try{N().recordHookRan(i.cwd??process.cwd())}catch{}let a=N().waitLine?Dt(i):"",f=Pt(i,{headings:e.headings===!0,maxTokens:o,dir:e.dir}),y=[a,f].filter(Boolean).join(`

`);y&&process.stdout.write(`${y}
`)}catch(i){process.stderr.write(`
  hook: ${i.message??String(i)}
`)}return 0}if(s==="loaded"){let r="";try{r=b.readFileSync(0,"utf8")}catch{r=""}try{let o=JSON.parse(r);Je(o),o.load_reason==="compact"&&typeof o.session_id=="string"&&Rt(o.session_id)}catch{}return 0}if(s==="read"){let r="";try{r=b.readFileSync(0,"utf8")}catch{r=""}let o=nt(r);if(st(o),e.precise===!0){let i=Bt(o);i&&process.stdout.write(`${i}
`)}return 0}if(s==="drift"){let r="";try{r=b.readFileSync(0,"utf8")}catch{r=""}try{let o=ye(r),i=jt(o);i&&process.stdout.write(`${i}
`)}catch(o){process.stderr.write(`
  drift: ${o.message??String(o)}
`)}return 0}if(s==="bench")try{let r=k.resolve(l),o=de(r),i=e.turns===void 0?50:Number(e.turns);if(!Number.isFinite(i))throw new I(`--turns must be a positive whole number (got "${e.turns}")`);let a=le(o,i);if(e.workload===void 0)return e.json===!0?(process.stdout.write(`${JSON.stringify({bounds:a,tokenizer:o.tokenizer},null,2)}
`),0):(process.stdout.write($e(a,o.tokenizer)),process.stdout.write(It()),0);let f=Lt(e.workload),y=_t(o,f,e["whole-files"]===!0?{}:{root:r});return e.json===!0?(process.stdout.write(`${JSON.stringify({bounds:a,model:y,tokenizer:o.tokenizer},null,2)}
`),0):(process.stdout.write($e(a,o.tokenizer)),process.stdout.write(Ft(y,o.tokenizer)),0)}catch(r){return r instanceof I||r instanceof U?(process.stderr.write(`
  error: ${r.message}

`),2):(process.stderr.write(`
  unexpected error: ${r.stack??String(r)}

`),2)}if(s!=="doctor")return process.stderr.write(`
  error: unknown command "${s}"
${Z}`),2;if(!wo(l))return process.stderr.write(`
  error: run init first: doctor checks memory init has already looked at, and init has no record for this project and ${l} has not been compiled. Run \`${Fe(l)}\`.

`),2;let O;try{let r;if(e.policy!==void 0)try{r=ot(e.policy)}catch(o){throw o instanceof tt?new Error(`--policy: ${o.message}`):o}O={discover:R,budget:Wt(e.budget)??r?.budgets.always_on_tokens,budgetFromPolicy:e.budget===void 0&&r?.budgets.always_on_tokens!==void 0,policy:r,failOn:uo(e["fail-on"],"high"),only:Ht(e.only),ignore:Ht(e.ignore),force:e.force===!0}}catch(r){return process.stderr.write(`
  error: ${r.message}

`),2}try{let r=ge(l,O);if(e.json)process.stdout.write(`${ke(r,u)}
`);else{let o=!e.ci&&!process.env.NO_COLOR&&process.stdout.isTTY===!0;process.stdout.write(we(r,{color:o,ci:e.ci===!0,target:u,diff:E}))}return Nt(r.audit.findings,r.config.failOn)}catch(r){return r instanceof q||r instanceof X?(process.stderr.write(`
  error: ${r.message}

`),2):(process.stderr.write(`
  unexpected error: ${r.stack??String(r)}

`),2)}}function xo(t){try{return b.realpathSync(t)}catch{return k.resolve(t)}}function Co(){let t=process.argv[1];if(!t)return!1;try{return b.realpathSync(so(import.meta.url))===b.realpathSync(t)}catch{return!1}}Co()&&(process.exitCode=$o(process.argv.slice(2)));export{ao as MCP_STASHED,po as defaultCommand,$o as main};
