#!/usr/bin/env node
/* MinniMemoryMCP (c) 2026 MinniAI. Licensed under the MinniMemoryMCP License, see LICENSE. */
import { createRequire as __minniCreateRequire } from "node:module"; const require = __minniCreateRequire(import.meta.url);
import{$ as Ve,A as Ae,Aa as st,B as E,Ba as it,C as V,Ca as oe,D as Ee,F as Ie,Fa as at,G as D,H as X,Ha as se,I as Ne,Ia as ie,J as Q,Ja as ae,K as Fe,Ka as dt,L as Le,La as lt,M as Be,Ma as ut,N as He,Na as ct,O as H,Oa as pt,P as Ue,Pa as de,Q as Je,Qa as le,R as _e,U as We,V as Ge,W as qe,X as ze,Y as Ye,Z,_ as Ke,b as P,ea as Xe,g,ga as ee,h as $e,ha as U,ia as te,j as xe,ja as J,k as Ce,ka as _,l as Se,la as ne,m as Oe,ma as re,n as Me,na as Qe,o as Y,oa as Ze,p as K,pa as et,q as je,qa as tt,r as Te,ra as W,sa as nt,v as Re,w as Pe,wa as rt,xa as ot,z as De}from"./chunks/chunk-I6CGXOLG.mjs";import"./chunks/chunk-EDORHNJU.mjs";import{spawnSync as Xt}from"node:child_process";import S from"node:fs";import Qt from"node:os";import x from"node:path";import{fileURLToPath as Zt}from"node:url";import{parseArgs as en}from"node:util";import Et from"node:fs";function It(e){return e.split(/\r?\n/).map(n=>n.trim()).filter(n=>n!==""&&!n.startsWith("#"))}function ft(e){let n;try{n=Et.readFileSync(e,"utf8")}catch{throw new D(`cannot read workload file: ${e}`)}let t=It(n);if(t.length===0)throw new D(`workload file has no tasks: ${e}
  one task description per line, # for comments`);return t}function G(e){return`${e.onDemandFile}:${e.startLine}`}function Nt(e){return`${e.onDemandFile} > ${e.heading}`}function Ft(e,n){let t=P(e).flatMap(o=>xe({name:o.name,file:o.file},Ee(n,o.file)));return Ce(t,new Map(P(e).map(o=>[o.name,o.triggers])))}function mt(e,n,t={}){let o=t.root?Ft(e,t.root):void 0,r=o?"section":"file",c=new Set,u=new Map,d=new Map,l=new Map;for(let i of P(e))u.set(i.name,i.tokens),d.set(i.name,i.name),l.set(i.name,i.name);if(o)for(let i of o.units)u.set(G(i),i.tokens),d.set(G(i),Nt(i)),l.set(G(i),i.onDemandFile);let y=[],v=0;n.forEach((i,h)=>{let C=o?Oe(Se(o,i)).map(f=>G(f.unit)):Me(e,i).filter(f=>f.score>0).map(f=>f.name);C.length===0&&v++;let $=C.filter(f=>!c.has(f));for(let f of $)c.add(f);let b=[...c].reduce((f,z)=>f+(u.get(z)??0),0);y.push({turn:h+1,task:i,opened:$.map(f=>d.get(f)??f),carried:[...c].map(f=>d.get(f)??f),compiledTokens:e.prefix.after+b,baselineTokens:e.prefix.before})});let w=y.reduce((i,h)=>i+h.compiledTokens,0),m=y.reduce((i,h)=>i+h.baselineTokens,0),k=new Set([...c].map(i=>l.get(i)??i)),j=P(e).map(i=>i.name).filter(i=>k.has(i)),R=[...c].reduce((i,h)=>i+(u.get(h)??0),0),A=e.prefix.after+R,s=e.prefix.before-A,a=m-w,p;return a>=0?(p=y.findIndex((i,h)=>y.slice(0,h+1).reduce(($,b)=>$+b.baselineTokens-b.compiledTokens,0)>=0),p=p>=0?p+1:void 0):s>0&&(p=y.length+Math.ceil(-a/s)),{unit:r,turns:y,baselineTotal:m,compiledTotal:w,saving:a,savingPct:m===0?0:a/m*100,onDemandOpened:j,onDemandNeverOpened:P(e).map(i=>i.name).filter(i=>!k.has(i)),unroutedTurns:v,steadyStatePerTurn:A,steadyStateGainPerTurn:s,breakEvenTurn:p}}function Lt(e,n){return n===0?"0.0%":`${(e/n*100).toFixed(1)}%`}function ue(e){return e>=0?`saves ${g(e)}`:`costs ${g(-e)} more`}function ce(e,n){let t=[""];return t.push(`  exact, over ${g(e.turns)} turns. No workload, no assumptions.`),t.push(""),t.push(`    original memory file      ${g(e.baselinePerTurn).padStart(8)} tokens per turn`),t.push(`    compiled always-loaded    ${g(e.compiledPerTurn).padStart(8)} tokens per turn`),t.push(`    OnDemandMemory, all of it   ${g(e.totalOnDemandTokens).padStart(8)} tokens, on demand`),t.push(""),t.push("    best case, no OnDemandMemory file ever opened"),t.push(`      ${g(e.baselineTotal)} -> ${g(e.bestCaseTotal)} tokens, ${ue(e.bestCaseSaving)} (${Lt(e.bestCaseSaving,e.baselineTotal)})`),t.push(""),t.push("    worst case, every OnDemandMemory file opened on turn 1 and carried"),t.push(`      ${g(e.baselineTotal)} -> ${g(e.worstCaseTotal)} tokens, ${ue(e.worstCaseSaving)}`),t.push(""),t.push(`    break-even: ${g(e.breakEvenCarriedTokens)} tokens of OnDemandMemory can sit in`),t.push("    context from turn 1 to the end and come out even. Past that the compiled"),t.push("    shape costs more than the file it replaced."),t.push(""),t.push(`  tokenizer: ${n}, an offline estimate`),t.push(""),t.join(`
`)}function ht(e,n){let t=[""],o=e.turns.length;if(t.push(`  MODEL, not a measurement. ${g(o)} turns from the workload you supplied.`),t.push(e.unit==="section"?"  routed at section level, as recall() does: a hit carries the section, not the file.":"  routed at file level, as an agent reading a whole file the OnDemandMemory list named would."),t.push(""),t.push(`    memory tokens over the session   ${g(e.baselineTotal)} -> ${g(e.compiledTotal)}`),t.push(`    ${ue(e.saving)}${e.saving>=0?` (${e.savingPct.toFixed(1)}%)`:""}`),t.push(""),e.onDemandOpened.length>0){t.push(`    opened and carried (${e.onDemandOpened.length}):`);for(let r of e.onDemandOpened)t.push(`      ${r}`);t.push("")}if(e.onDemandNeverOpened.length>0){t.push(`    never opened (${e.onDemandNeverOpened.length}) - this is where the saving comes from:`);for(let r of e.onDemandNeverOpened)t.push(`      ${r}`);t.push("")}return t.push("    one more turn, once everything this workload opens is in context:"),t.push(`      ${g(e.steadyStatePerTurn)} vs ${g(e.turns[0]?.baselineTokens??0)} baseline, ${e.steadyStateGainPerTurn>=0?`saves ${g(e.steadyStateGainPerTurn)}`:`costs ${g(-e.steadyStateGainPerTurn)} more`} per turn`),t.push(""),e.saving<0&&e.steadyStateGainPerTurn<=0?(t.push("    this workload never breaks even. The OnDemandMemory files it opens are large enough that"),t.push("    carrying them costs more every turn than the original file did, so a longer"),t.push("    session loses more, not less. Splitting differently, or not compiling this"),t.push("    file at all, is the honest answer here."),t.push("")):e.saving<0&&e.breakEvenTurn!==void 0?(t.push(`    behind by ${g(-e.saving)} at turn ${g(e.turns.length)}, recovering ${g(e.steadyStateGainPerTurn)} per turn:`),t.push(`    breaks even around turn ${g(e.breakEvenTurn)} if nothing further opens.`),t.push("")):e.saving>=0&&e.breakEvenTurn!==void 0&&(t.push(`    ahead from turn ${g(e.breakEvenTurn)} onward.`),t.push("")),e.unroutedTurns>0&&(t.push(`    ${g(e.unroutedTurns)} of ${g(o)} turns matched no OnDemandMemory file at all.`),t.push("    Those turns are cheap here, but a real agent may have needed something and"),t.push("    not been routed to it. Check them before trusting the total."),t.push("")),t.push("  what this number is conditional on:"),t.push("    - your workload being what a real session looks like. It is your file;"),t.push("      the tool cannot tell whether it is representative."),e.unit==="section"?(t.push("    - every section recall() returns being carried for the rest of the session,"),t.push("      up to its token cap per turn. A real agent may widen with outline() or"),t.push("      read the whole file anyway.")):(t.push("    - every OnDemandMemory file whose triggers match being opened in full. A real"),t.push("      agent may read one and stop, or ignore one the list offered.")),t.push("    - memory tokens only. Reasoning, tool results and conversation are excluded"),t.push("      from both sides, so this ratio is not a session bill."),t.push(""),t.push("  For observed usage against a live agent, measure a real multi-turn session with"),t.push("  and without the compile. That is the only path allowed to call a number measured."),t.push(""),t.push(`  tokenizer: ${n}, an offline estimate`),t.push(""),t.join(`
`)}function gt(){return["","  No workload given, so only the exact bounds above are available.","","  A session number needs a workload: a file with one task description per line,","  describing what you actually do in this repo.","","    minnimemory bench --workload tasks.txt","","  minnimemory ships no default task list on purpose. A number produced from tasks","  the tool invented for itself would say more about the tool than about your repo.",""].join(`
`)}import O from"node:fs";import M from"node:path";function I(e){let n=Te(e);return n&&Re(n)?n:void 0}function kt(e){return Pe(e)??`"${e.replace(/"/g,'\\"')}"`}function T(e){return e.map(kt).join(" ")}function vt(e){return e.map(kt)}function yt(e){if(!(!e.servedDirect||!/\/_npx\//.test(e.servedDirect)))return"note: this copy lives in the npx cache, which `npm cache clean` or a newer version can remove; the registration and the hook would then stop starting. For a durable install: npm i -g minnimemory, then minnimemory install --force"}function Bt(e){if(e==="cursor")return"~/.cursor/mcp.json";if(e==="windsurf")return"~/.codeium/windsurf/mcp_config.json"}function bt(e,n){let t=[];e.write&&t.push("--profile","full","--allow-write");let o=I(e.cliPath),r=o?["node",o,"mcp",...t]:["npx","-y","minnimemory","mcp",...t],c=["claude","mcp","add","minnimemory","-s",e.scope,"--",...r],u=["claude","mcp","remove","minnimemory","-s",e.scope],d=["claude","mcp","get","minnimemory"],l=["claude","--version"],y=T(c),v=JSON.stringify({mcpServers:{minnimemory:{command:"npx",args:["-y","minnimemory","mcp",...t]}}},null,2),w={scope:e.scope,servedFlags:t,servedArgv:r,...o?{servedDirect:o}:{},addArgv:c,removeArgv:u,getArgv:d,probeArgv:l,manualLine:y,jsonSnippet:v};if(e.host&&e.host!=="json"){let m=Bt(e.host);m&&(w.hostConfigPath=m)}return w}function $t(e){return e.error!==void 0&&e.error.code==="ENOENT"}var fe="npx -y minnimemory drift";function Ht(e){let n=I(e);return n?`node "${n}" drift`:fe}var me="npx -y minnimemory hook";function Ut(e){let n=I(e);return n?`node "${n}" hook`:me}function Jt(e){return typeof e=="string"&&(e===me||he(e,"hook"))}function _t(e,n){let t=u=>u.replace(/\\/g,"/").toLowerCase(),o=/^\s*Command:\s*(.*)$/m.exec(e)?.[1]?.trim(),r=/^\s*Args:\s*(.*)$/m.exec(e)?.[1]?.trim(),c=t(o?`${o} ${r??""}
${e}`:e);return n.servedDirect?c.includes(t(n.servedDirect)):c.includes("npx -y minnimemory mcp")}function Wt(e){let n=/Scope:\s*(User|Project|Local)\b/i.exec(e);return n?n[1].toLowerCase():void 0}function he(e,n){let t=/^node "([^"]+)" (drift|loaded|hook)$/.exec(e);if(t===null||t[2]!==n)return!1;let o=t[1];return/minnimemory/i.test(o)||Gt(o)}function Gt(e){if(!M.isAbsolute(e))return!1;let n=M.dirname(e);for(let t=0;t<4;t++)try{return JSON.parse(O.readFileSync(M.join(n,"package.json"),"utf8")).name==="minnimemory"}catch{let o=M.dirname(n);if(o===n)return!1;n=o}return!1}function qt(e){return typeof e=="string"&&(e===fe||he(e,"drift"))}var ge="npx -y minnimemory loaded";function zt(e){let n=I(e);return n?`node "${n}" loaded`:ge}function Yt(e){return typeof e=="string"&&(e===ge||he(e,"loaded"))}function xt(e){let n=Ht(e),t=Ut(e),o=zt(e);return[{event:"UserPromptSubmit",command:n,fallback:fe,isOurs:r=>r===n||qt(r)},{event:"UserPromptSubmit",command:t,fallback:me,isOurs:r=>r===t||Jt(r)},{event:"InstructionsLoaded",command:o,fallback:ge,isOurs:r=>r===o||Yt(r)}]}function Ct(e,n){let t=n.cwd??process.cwd();return e==="user"?M.join(n.configDir??M.join(n.home,".claude"),"settings.json"):e==="project"?M.join(t,".claude","settings.json"):M.join(t,".claude","settings.local.json")}function St(e,n){let t=[];for(let o of e){if(!o||typeof o!="object")continue;let r=o.hooks;if(Array.isArray(r))for(let c of r){let u=c&&typeof c=="object"?c.command:void 0;n(u)&&t.push(u)}}return t}function Ot(e){if(!O.existsSync(e))return{};try{let n=JSON.parse(O.readFileSync(e,"utf8"));return!n||typeof n!="object"||Array.isArray(n)?void 0:n}catch{return}}function Mt(e,n){let t=`${JSON.stringify(n,null,2)}
`,o=`${e}.minnimemory-${process.pid}.tmp`;O.writeFileSync(o,t,"utf8");try{O.renameSync(o,e)}catch{O.rmSync(o,{force:!0}),O.writeFileSync(e,t,"utf8")}}function jt(e){let n=e.hooks;return n&&typeof n=="object"&&!Array.isArray(n)?n:void 0}function Kt(e,n){let t=Ct(e.scope,n),o=xt(e.cliPath);if(e.dryRun)return{exitCode:0,output:o.map(l=>`would add the ${l.event} hook \`${l.command}\` to ${t}`).join(`
`),path:t};let r=Ot(t);if(!r)return{exitCode:1,output:`install --hook: ${t} is not valid JSON; not touched.`,path:t};let c=jt(r)??{},u=[],d=!1;for(let l of o){let y=Array.isArray(c[l.event])?[...c[l.event]]:[],v=St(y,l.isOurs);if(v.includes(l.command)){u.push(l.event==="UserPromptSubmit"?`hook: \`${l.fallback.split(" ").pop()}\` already present in ${t}`:`hook: ${l.event} already present in ${t}`);continue}if(v.length>0){for(let w of y){let m=w&&typeof w=="object"?w.hooks:void 0;if(Array.isArray(m))for(let k of m)k&&typeof k=="object"&&l.isOurs(k.command)&&(k.command=l.command)}u.push(`hook: updated \`${v[0]}\` -> \`${l.command}\` in ${t} (${l.event}). Restart Claude Code.`)}else{let w={hooks:[{type:"command",command:l.command}]};y.push(w),u.push(`hook: added \`${l.command}\` to ${t} (${l.event}). Restart Claude Code.`)}c[l.event]=y,d=!0}return d&&(r.hooks=c,O.mkdirSync(M.dirname(t),{recursive:!0}),Mt(t,r)),{exitCode:0,output:u.join(`
`),path:t}}function wt(e,n){let t=Ct(e.scope,n),o=xt(e.cliPath);if(e.dryRun)return{exitCode:0,output:o.map(d=>`would remove the ${d.event} hook (\`${d.fallback}\` or its direct node form) from ${t}`).join(`
`),path:t};if(!O.existsSync(t))return{exitCode:0,output:`hook: nothing to remove (${t} does not exist)`,path:t};let r=Ot(t);if(!r)return{exitCode:1,output:`install --remove: ${t} is not valid JSON; not touched.`,path:t};let c=jt(r),u=[];for(let d of o){let l=c&&Array.isArray(c[d.event])?c[d.event]:void 0,y=l?St(l,d.isOurs):[];if(!c||!l||y.length===0)continue;let v=l.filter(w=>{if(!w||typeof w!="object")return!0;let m=w.hooks;if(!Array.isArray(m))return!0;let k=m.filter(j=>!(j&&typeof j=="object"&&d.isOurs(j.command)));return k.length===0?!1:(w.hooks=k,!0)});v.length===0?delete c[d.event]:c[d.event]=v,u.push(`hook: removed \`${y[0]}\` from ${t}`)}return u.length===0?{exitCode:0,output:`hook: nothing to remove in ${t}`,path:t}:(c&&Object.keys(c).length===0&&delete r.hooks,Mt(t,r),{exitCode:0,output:u.join(`
`),path:t})}function Tt(e,n,t){let o=bt(e,n),r=[];if(e.dryRun){r.push(`would run: ${T(o.removeArgv)}`);let l=wt({...e,dryRun:!0},n);return r.push(l.output),{exitCode:0,output:`${r.join(`
`)}
`}}let c=t(o.probeArgv[0],o.probeArgv.slice(1)),u=0;if($t(c))r.push("the claude CLI is not on PATH; skipping the MCP registration removal.");else{let l=t(o.removeArgv[0],o.removeArgv.slice(1));r.push(`ran: ${T(o.removeArgv)}`),l.code!==0&&/no mcp server named/i.test(`${l.stdout}
${l.stderr}`)?r.push(`nothing registered as minnimemory in ${e.scope} scope`):l.code!==0?(r.push(l.stderr.trim()),u=1):l.stdout.trim()&&r.push(l.stdout.trim())}let d=wt(e,n);return r.push(d.output),d.exitCode!==0&&(u=d.exitCode),{exitCode:u,output:`${r.join(`
`)}
`}}function Vt(e){let n=I(e);return`next: restart Claude Code, then ask it to clean up your memory with minnimemory; it starts with init. In a terminal: \`${n?`node "${n}" init`:"npx -y minnimemory init"} <folder> --from-log\` from your project.`}function pe(e,n,t,o){if(e.hook){let r=Kt(e,n);t.push(r.output),r.exitCode!==0&&(o=r.exitCode)}return o===0&&t.push(Vt(e.cliPath)),{exitCode:o,output:`${t.join(`
`)}
`}}function Rt(e,n,t){let o=bt(e,n),r=[];if(e.hook&&e.host)return{exitCode:2,output:`--hook only applies to Claude Code
`};if(e.host)return r.push(o.jsonSnippet),o.hostConfigPath?r.push("",`config file: ${o.hostConfigPath}`):r.push("",`add this under "mcpServers" in your host's MCP config file.`),{exitCode:0,output:`${r.join(`
`)}
`};if(e.dryRun){e.force&&r.push(`would run: ${T(o.removeArgv)}`),r.push(`would run: ${T(o.addArgv)}`);let k=yt(o);return k&&r.push(k),pe(e,n,r,0)}let c=t(o.probeArgv[0],o.probeArgv.slice(1));if($t(c))return r.push("the claude CLI is not on PATH. Register minnimemory manually:","",`  ${o.manualLine}`,"","or add this to another host's MCP config:","",o.jsonSnippet),{exitCode:2,output:`${r.join(`
`)}
`};let u=t(o.getArgv[0],o.getArgv.slice(1)),d=u.code===0?Wt(u.stdout):void 0,l=d!==void 0&&d!==e.scope;l&&r.push(`minnimemory is also registered at ${d} scope; that registration is left as it is (Claude Code uses local, then project, then user).`);let y=u.code===0&&!l,v=y&&!_t(u.stdout,o);if(y&&!e.force&&!v)return r.push("minnimemory is already registered.",`to change it: ${T(["npx","-y","minnimemory","install","--force","--scope",e.scope,...e.write?["--write"]:[]])}`),pe(e,n,r,0);if(y){v&&!e.force&&r.push("minnimemory is registered with a different command; repointing it at this copy.");let k=t(o.removeArgv[0],o.removeArgv.slice(1));if(k.code!==0)return r.push(`ran: ${T(o.removeArgv)}`,k.stderr.trim()),{exitCode:1,output:`${r.join(`
`)}
`}}let w=t(o.addArgv[0],o.addArgv.slice(1));if(r.push(`ran: ${T(o.addArgv)}`),w.code!==0)return r.push(w.stderr.trim()),{exitCode:1,output:`${r.join(`
`)}
`};w.stdout.trim()&&r.push(w.stdout.trim());let m=yt(o);return m&&r.push(m),pe(e,n,r,0)}var tn=!1,q=`
minnimemory ${le}  the agent memory compiler

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
`;function nn(){let e=["","  rule set",""];for(let n of He)e.push(`  ${n.id.padEnd(8)}${n.severity.padEnd(6)}${n.title}`);return e.push(""),e.join(`
`)}function rn(e,n){if(e===void 0)return n;if(e==="low"||e==="med"||e==="high")return e;throw new Error(`--fail-on must be one of low, med, high (got "${e}")`)}function Pt(e){return e?e.split(",").map(n=>n.trim()).filter(Boolean):[]}function on(e,n){return e.matches.length===0?`
  no match for "${e.query}"

`:n?`${e.matches.map(t=>`${t.onDemandFile} > ${t.path.join(" > ")} (${t.tokens} tokens)`).join(`
`)}
`:`${e.matches.map(t=>`## ${t.onDemandFile} > ${t.path.join(" > ")} (lines ${t.startLine}-${t.endLine}, ${t.tokens} tokens, score ${t.score})

${t.content}`).join(`

---

`)}
`}function sn(e){return e.isTTY?"usage":"serve"}function Dt(){return(e,n)=>{let t=process.platform==="win32",o=Xt(e,t?vt(n):n,{encoding:"utf8",shell:t});return{code:o.status,stdout:o.stdout??"",stderr:o.stderr??"",error:o.error}}}function an(e){if(e===void 0||e==="user")return"user";if(e==="project"||e==="local")return e;throw new Error(`--scope must be one of user, project, local (got "${e}")`)}function dn(e){if(e!==void 0){if(e==="cursor"||e==="windsurf"||e==="json")return e;throw new Error(`--host must be one of cursor, windsurf, json (got "${e}")`)}}function At(e){if(e===void 0)return;let n=Number(e);if(!Number.isInteger(n)||n<=0||n>Y)throw new Error(`--budget must be a whole number of tokens from 1 to ${Y.toLocaleString("en-US")} (got "${e}")`);return Math.floor(n)}function ln(e,n){let t;try{if(t=x.resolve(e),!S.existsSync(t)||!S.statSync(t).isDirectory())throw new E(`not a directory: ${t}`)}catch(r){return r instanceof E?(process.stderr.write(`
  error: ${r.message}

`),2):(process.stderr.write(`
  unexpected error: ${r.stack??String(r)}

`),2)}let o=n.profile??"basic";return o!=="basic"&&o!=="full"?(process.stderr.write(`
  error: --profile must be one of basic, full (got "${o}")

`),2):((async()=>{let[{StdioServerTransport:r},{createMcpServer:c}]=await Promise.all([import("./chunks/stdio-4LUDCT2D.mjs"),import("./chunks/mcpServer-HWLFIKTV.mjs")]);await c(t,{profile:o,allowWrite:n["allow-write"]===!0}).connect(new r)})().catch(r=>{process.stderr.write(`
  mcp server failed: ${r.message??String(r)}
`),process.exitCode=1}),0)}function un(){let e=tt(),n=[];if(e.length>0){n.push("still compiled (they keep working without minnimemory; to put the originals back, undo each one):");for(let t of e)n.push(`  ${De(t)}`)}return n.push(`kept: ${x.dirname(Ze())} (init records, the load log, undo backups); delete it yourself once you have checked undo-backups/.`),n.push("restart Claude Code."),n.join(`
`)}var cn=new Set(["init","doctor","apply","undo","bench"]);function pn(e){if(W(process.cwd()))return!0;let n=ye(e);return te(n)==="compiled"||re(n)!==void 0||Q(n)!==void 0}function ye(e){let n=x.resolve(e);return S.existsSync(n)&&S.statSync(n).isFile()?x.dirname(n):n}function fn(e){if(W(process.cwd()))return;let n=ye(e);return Q(n)?Ne(n):void 0}function mn(e){let n=`minnimemory ${e} <folder>`;if(process.stdin.isTTY!==!0){process.stderr.write(`
  error: name the folder to read: ${n} (type . for the current folder)

`);return}process.stdout.write(`
  Which folder should minnimemory ${e} read? Only that folder and the folders below it are read.
  folder: `);let t=hn().trim();if(t===""){process.stderr.write(`
  error: no folder given; run ${n}

`);return}return t}function hn(){let e=Buffer.alloc(1),n="";for(;;){let t;try{t=S.readSync(0,e,0,1,null)}catch{break}if(t===0)break;let o=e.toString("utf8");if(o===`
`)break;o!=="\r"&&(n+=o)}return n}function gn(e){let n;try{n=en({args:e,allowPositionals:!0,strict:!0,options:{json:{type:"boolean",default:!1},write:{type:"boolean",default:!1},force:{type:"boolean",default:!1},update:{type:"boolean",default:!1},"allow-secrets":{type:"boolean",default:!1},"episodic-json":{type:"boolean",default:!1},"allow-write":{type:"boolean",default:!1},"follow-external-imports":{type:"boolean",default:!1},"include-auto-memory":{type:"boolean",default:!1},scope:{type:"string"},"dry-run":{type:"boolean",default:!1},"auto-memory":{type:"boolean",default:!1},hook:{type:"boolean",default:!1},"no-hook":{type:"boolean",default:!1},remove:{type:"boolean",default:!1},host:{type:"string"},"host-file":{type:"string",multiple:!0},loaded:{type:"string",multiple:!0},"memory-dir":{type:"string"},"from-log":{type:"boolean",default:!1},"only-this-folder":{type:"boolean",default:!1},turns:{type:"string"},workload:{type:"string"},"whole-files":{type:"boolean",default:!1},"max-tokens":{type:"string"},headings:{type:"boolean",default:!1},dir:{type:"string"},profile:{type:"string"},plan:{type:"string"},ci:{type:"boolean",default:!1},rules:{type:"boolean",default:!1},map:{type:"boolean",default:!1},diff:{type:"string"},"fail-on":{type:"string"},budget:{type:"string"},policy:{type:"string"},only:{type:"string"},ignore:{type:"string"},help:{type:"boolean",short:"h",default:!1},version:{type:"boolean",short:"v",default:!1}}})}catch(s){let a=s.message,p=/argument is ambiguous/.test(a)?`
  (a value that starts with '-' must be written as --option=value; --budget must be positive anyway)`:"";return process.stderr.write(`
  error: ${a}${p}
${q}`),2}let{values:t,positionals:o}=n;if(t.help)return process.stdout.write(q),0;if(t.version)return process.stdout.write(`${le}
`),0;if(t.rules)return process.stdout.write(nn()),0;let r;if(o[0]===void 0){if(sn({isTTY:process.stdin.isTTY===!0})==="usage")return process.stdout.write(q),0;r="mcp"}else r=o[0];let c=["include-auto-memory","follow-external-imports","auto-memory"].filter(s=>t[s]===!0);c.length>0&&process.stderr.write(`  note: ${c.map(s=>`--${s}`).join(", ")} no longer does anything: minnimemory reads only the folder you name
`);let u=o[1]===void 0?void 0:/^~($|[\\/])/.test(o[1])?J(o[1]):o[1];if(u===void 0&&typeof t["memory-dir"]=="string"&&(u=t["memory-dir"]),u===void 0&&["doctor","apply","undo"].includes(r)){let s=W(process.cwd());s&&(u=s.target??s.memoryDir??s.project)}if(u===void 0&&cn.has(r)&&(u=mn(r),u===void 0))return 2;let d=u??".";if(t.policy!==void 0&&r!=="doctor")return process.stderr.write(`
  error: --policy is a doctor option: \`minnimemory doctor <folder> --policy <file>\`

`),2;if(t.diff!==void 0&&t.diff!=="summary"&&t.diff!=="full")return process.stderr.write(`
  error: --diff takes summary or full, not "${t.diff}"

`),2;let l=t.diff,y=[...t.loaded??[],...t["host-file"]??[]].map(s=>J(s));if(t["from-log"]===!0){let s=dt(process.cwd());if(!s)return process.stderr.write(`
  error: no load log for ${process.cwd()}: open Claude Code in this folder once (install adds the hook that writes it), then run this again

`),2;for(let a of Object.keys(s.files))/\.md$/i.test(a)&&S.existsSync(a)&&y.push(x.resolve(a))}let v=typeof t["memory-dir"]=="string"?J(t["memory-dir"]):void 0,m=y.length>0||v!==void 0||t["only-this-folder"]===!0?{files:[...new Set(y)],...v?{memoryDir:v}:{},source:t["from-log"]===!0&&(t.loaded??[]).length===0?"log":"terminal",...t["only-this-folder"]===!0?{onlyThisFolder:!0}:{}}:void 0,k=m||!["doctor","apply"].includes(r)?void 0:fn(d),j=m?void 0:nt(process.cwd())??(k?Fe(ye(d)):void 0);k&&process.stderr.write(`  note: this machine has no init record for this project, so ${r} uses the one in the repo: ${x.relative(process.cwd(),k).split(x.sep).join("/")||k}
`);let R={cwd:process.cwd(),...m?{reported:m}:j?{reported:j}:{}};if(r==="install"||r==="uninstall"){let s;try{s={write:t.write===!0,scope:an(t.scope),dryRun:t["dry-run"]===!0,force:t.force===!0,host:dn(t.host),hook:t.host===void 0&&t["no-hook"]!==!0,cliPath:process.argv[1]?yn(process.argv[1]):void 0}}catch(C){return process.stderr.write(`
  error: ${C.message}

`),2}let a={home:Qt.homedir(),platform:process.platform,cwd:process.cwd(),configDir:je()},p=r==="uninstall"||t.remove===!0,i=p?Tt(s,a,Dt()):Rt(s,a,Dt()),h=i.exitCode===0?process.stdout:process.stderr;return h.write(`
${i.output}
`),p&&h.write(`${un()}

`),i.exitCode}if(r==="init"||r==="apply"){if(r==="init"&&(t.write===!0||t.update===!0))return process.stderr.write(`
  error: init never writes; use apply

`),2;let s=t.profile??"auto";if(s!=="auto"&&!$e(s))return process.stderr.write(`
  error: --profile must be one of auto, none, routing, full (got "${s}")

`),2;let a;try{a=At(t.budget)}catch(b){return process.stderr.write(`
  error: ${b.message}

`),2}let p=r==="apply",i=s==="auto"?void 0:s,h=t["episodic-json"]===!0,C=[...i?[`--profile ${i}`]:[],...h?["--episodic-json"]:[],...t["only-this-folder"]===!0?["--only-this-folder"]:[]],$={budget:a,force:t.force===!0,profileName:i,episodicJson:h,discover:R};try{if(!p){let we=S.existsSync(d)&&S.statSync(d).isFile()?x.dirname(x.resolve(d)):x.resolve(d),N;try{let B=_(d,R);B.shape==="memory-dir"&&(N=B)}catch{N=void 0}let F=N?pt(N):ut(we,{machine:!1,projectRoot:we});if(t.map===!0)return process.stdout.write(t.json?`${JSON.stringify(F,null,2)}
`:de(F)),0;t.json||process.stdout.write(de(F));let L=se(d,$);if(t.json){let B=JSON.parse(ae(L,u,C));process.stdout.write(`${JSON.stringify({map:ct(F),...B},null,2)}
`)}else process.stdout.write(ie(L,{color:!1,ci:t.ci===!0,target:u,flags:C,diff:l}));let ke=L.workspace.folderRoot??x.resolve(d),ve=L.workspace.claudeMemoryFolder?ke:void 0,be=et(process.cwd(),m?{...m,...m.memoryDir??ve?{memoryDir:m.memoryDir??ve}:{}}:void 0,ke);return m&&!t.json&&process.stdout.write(be?`  saved what Claude Code loads here for apply, doctor and undo: ${be}

`:`  could not save the locations; pass them again to apply

`),0}let b=_(d,R);if(b.shape==="memory-dir"&&!b.reported)return process.stderr.write(`
  error: apply refused: nothing reported the files Claude Code loads, so an import of this folder's files from outside it could break. Run from Claude Code (the agent passes them), or add --from-log (Claude Code's own load log for this folder), or --loaded <path> for each file. If nothing outside this folder loads it, pass --only-this-folder. Nothing was changed.

`),2;let f=Je(b,{budget:a??b.manifest?.budget,profileName:i,episodicJson:h});if(t.plan!==void 0&&f.plan!==t.plan)return process.stderr.write(`
  error: the plan on disk no longer matches --plan ${t.plan} (now ${f.plan}); run doctor again

`),2;if(f.verdict==="nothing")return process.stdout.write(ee(f,{write:!0})),0;if(f.verdict==="leave"&&t.force!==!0)return process.stderr.write(`
  error: ${Xe(f)} (${f.before} -> ${f.after} tokens; break-even ${f.bounds.breakEvenCarriedTokens} tokens of OnDemandMemory open all session)
  Pass --force to write it anyway.

`),2;let z=ee(f,{write:!0,target:u});return _e(f,{allowSecrets:t["allow-secrets"]===!0}),process.stdout.write(z),0}catch(b){return b instanceof U||b instanceof H?(process.stderr.write(`
  error: ${b.message}

`),2):(process.stderr.write(`
  unexpected error: ${b.stack??String(b)}

`),2)}}if(r==="undo")try{let s;try{s=_(d).folderRoot}catch($){if(!($ instanceof U))throw $}if(!s)return process.stdout.write(`
  nothing to undo

`),0;let a=re(s),p=a?void 0:Qe(s),i=p?Ve(s,p):!a&&ne(s)?ze(s):qe(s,a);if(i.kind==="none")return!a&&ne(s)?(process.stderr.write(`
  error: ${Ue(s)}

`),2):(process.stdout.write(`
  nothing to undo

`),0);if(i.kind==="kept-only")return process.stderr.write(`
  error: undo has nothing left to restore here: ${Ye(i.kept)}

`),2;if(i.kind==="missing-original")return process.stderr.write(`
  error: no original copy under ${K}/original/ for: ${i.files.join(", ")}.
  Backups stay on the machine that ran apply (they are gitignored), and a clone that re-applied backs up the compiled file, not the original; on a clone, the way back is git history.

`),2;let h=We(i.plan);if(h&&t.force!==!0)return process.stderr.write(`
  error: ${h}

`),2;let C=h?Ge(i.plan):void 0;return Ke(i.plan),process.stdout.write(`
  restored ${i.plan.operations.filter($=>$.op==="write"||$.op==="move").length} file(s) in ${s}
  deleted: ${i.plan.operations.filter($=>$.op==="delete").length} path(s), ${K}/ ${i.plan.keptBackups?.length?"kept":"included"}
`+(Z(i.plan)?`  ${Z(i.plan)}
`:"")+(i.plan.left?.length?`  left in place: ${i.plan.left.join(", ")} (without manifest.json undo cannot tell which files there it wrote)
`:"")+(C?`  the files as they were before this undo are copied to ${C.split(x.sep).join("/")}
`:"")+`
`),0}catch(s){return s instanceof H?(process.stderr.write(`
  error: ${s.message}

`),2):(process.stderr.write(`
  unexpected error: ${s.stack??String(s)}

`),2)}if(r==="mcp")return tn?((async()=>{let[{StdioServerTransport:s},{createDisabledMcpServer:a,DISABLED_MESSAGE:p}]=await Promise.all([import("./chunks/stdio-4LUDCT2D.mjs"),import("./chunks/mcpServer-HWLFIKTV.mjs")]);process.stderr.write(`
  mcp: ${p}

`),await a().connect(new s)})().catch(s=>{process.stderr.write(`
  mcp server failed: ${s.message??String(s)}
`),process.exitCode=1}),0):ln(d,t);if(r==="recall"){let s=o.slice(2).join(" ").trim();if(!s)return process.stderr.write(`
  error: recall needs a query: minnimemory recall <path> <query...>

`),2;let a;if(t["max-tokens"]!==void 0){let i=Number(t["max-tokens"]);if(!Number.isFinite(i)||i<=0)return process.stderr.write(`
  error: --max-tokens must be a positive number (got "${t["max-tokens"]}")

`),2;a=Math.floor(i)}let p=x.resolve(d);try{let i=te(p),h;if(i==="compiled")h=Ie(p,V(p),s,{maxTokens:a});else if(i==="memory-dir")h=ot(p,s,{maxTokens:a});else return process.stderr.write(`
  error: ${p} is neither a compiled workspace (.minnimemory/manifest.json) nor a manifest-less memory directory (an index file plus topic files) - nothing for recall to query

`),2;return process.stdout.write(on(h,t.headings===!0)),0}catch(i){return i instanceof E||i instanceof rt?(process.stderr.write(`
  error: ${i.message}

`),2):(process.stderr.write(`
  unexpected error: ${i.stack??String(i)}

`),2)}}if(r==="hook"){let s="";try{s=S.readFileSync(0,"utf8")}catch{s=""}let a;if(t["max-tokens"]!==void 0){let p=Number(t["max-tokens"]);Number.isFinite(p)&&p>0&&(a=Math.floor(p))}try{let p=oe(s),i=st(p,{headings:t.headings===!0,maxTokens:a,dir:t.dir});i&&process.stdout.write(`${i}
`)}catch(p){process.stderr.write(`
  hook: ${p.message??String(p)}
`)}return 0}if(r==="loaded"){let s="";try{s=S.readFileSync(0,"utf8")}catch{s=""}try{lt(JSON.parse(s))}catch{}return 0}if(r==="drift"){let s="";try{s=S.readFileSync(0,"utf8")}catch{s=""}try{let a=oe(s),p=it(a);p&&process.stdout.write(`${p}
`)}catch(a){process.stderr.write(`
  drift: ${a.message??String(a)}
`)}return 0}if(r==="bench")try{let s=x.resolve(d),a=V(s),p=t.turns===void 0?50:Number(t.turns);if(!Number.isFinite(p))throw new D(`--turns must be a positive whole number (got "${t.turns}")`);let i=X(a,p);if(t.workload===void 0)return t.json===!0?(process.stdout.write(`${JSON.stringify({bounds:i,tokenizer:a.tokenizer},null,2)}
`),0):(process.stdout.write(ce(i,a.tokenizer)),process.stdout.write(gt()),0);let h=ft(t.workload),C=mt(a,h,t["whole-files"]===!0?{}:{root:s});return t.json===!0?(process.stdout.write(`${JSON.stringify({bounds:i,model:C,tokenizer:a.tokenizer},null,2)}
`),0):(process.stdout.write(ce(i,a.tokenizer)),process.stdout.write(ht(C,a.tokenizer)),0)}catch(s){return s instanceof D||s instanceof E?(process.stderr.write(`
  error: ${s.message}

`),2):(process.stderr.write(`
  unexpected error: ${s.stack??String(s)}

`),2)}if(r!=="doctor")return process.stderr.write(`
  error: unknown command "${r}"
${q}`),2;if(!pn(d))return process.stderr.write(`
  error: run init first: doctor checks memory init has already looked at, and init has no record for this project and ${d} has not been compiled. Run \`${Ae(d)}\`.

`),2;let A;try{let s;if(t.policy!==void 0)try{s=Be(t.policy)}catch(a){throw a instanceof Le?new Error(`--policy: ${a.message}`):a}A={discover:R,budget:At(t.budget)??s?.budgets.always_on_tokens,policy:s,failOn:rn(t["fail-on"],"high"),only:Pt(t.only),ignore:Pt(t.ignore),force:t.force===!0}}catch(s){return process.stderr.write(`
  error: ${s.message}

`),2}try{let s=se(d,A);if(t.json)process.stdout.write(`${ae(s,u)}
`);else{let a=!t.ci&&!process.env.NO_COLOR&&process.stdout.isTTY===!0;process.stdout.write(ie(s,{color:a,ci:t.ci===!0,target:u,diff:l}))}return at(s.audit.findings,s.config.failOn)}catch(s){return s instanceof U||s instanceof H?(process.stderr.write(`
  error: ${s.message}

`),2):(process.stderr.write(`
  unexpected error: ${s.stack??String(s)}

`),2)}}function yn(e){try{return S.realpathSync(e)}catch{return x.resolve(e)}}function wn(){let e=process.argv[1];if(!e)return!1;try{return S.realpathSync(Zt(import.meta.url))===S.realpathSync(e)}catch{return!1}}wn()&&(process.exitCode=gn(process.argv.slice(2)));export{tn as MCP_STASHED,sn as defaultCommand,gn as main};
