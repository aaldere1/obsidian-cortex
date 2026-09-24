export const meta = {
  name: 'friction-deep-read',
  description: 'Deep-read top-friction Claude Code sessions and return structured friction narratives',
  phases: [
    { title: 'DeepRead', detail: 'one agent per high-friction session transcript' },
  ],
}

const SCHEMA = {
  type: 'object',
  required: ['project', 'date', 'goal', 'events', 'dominant_theme', 'fix_idea'],
  properties: {
    project: { type: 'string' },
    date: { type: 'string' },
    goal: { type: 'string', description: 'what the user was trying to accomplish, 1-2 sentences' },
    events: {
      type: 'array',
      items: {
        type: 'object',
        required: ['taxonomy', 'detail'],
        properties: {
          taxonomy: { type: 'string', enum: ['premature-stop', 'context-loss', 'wrong-target', 'verification-gap', 'tool-error-loop', 'permission-friction', 'infra-flake', 'scope-misread', 'rework', 'other'] },
          detail: { type: 'string' },
          quote: { type: 'string', description: 'short verbatim user quote if one captures it' },
          wasted_turns: { type: 'number' },
        },
      },
    },
    dominant_theme: { type: 'string' },
    fix_idea: { type: 'string', description: 'concrete fix: a skill, hook, automation, or CLAUDE.md rule that would have prevented this' },
  },
}

phase('DeepRead')
// args may arrive as a JSON string — always parse defensively
const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
const results = await parallel(parsedArgs.sessions.map(s => () => agent(`
You are a session-forensics analyst. Analyze ONE Claude Code session transcript for USER FRICTION — places where the user had to correct, repeat, interrupt, deny, or wait on Claude, or where Claude's process wasted the user's time.

Transcript (JSONL, may be 5-15MB — do NOT Read the whole file; use targeted extraction):
${s.path}

Extraction recipes (run with Bash, adjust as needed):
1. Typed user prompts in order:
   jq -r 'select(.type=="user" and (.isMeta|not) and (.isSidechain|not)) | .message.content | if type=="string" then . elif type=="array" then ([.[] | select(.type=="text") | .text] | join(" ")) else empty end | select(length>0) | .[0:500]' FILE
2. Interruptions with context: grep -n 'Request interrupted by user' FILE, then sed -n 'N,Mp' nearby lines
3. Denials: grep -n "doesn't want to proceed" FILE
4. Error results: jq -r 'select(.type=="user") | .message.content? | if type=="array" then .[] else empty end | select(.type=="tool_result" and .is_error==true) | .content | if type=="string" then .[0:200] else ([.[]? | select(.type=="text") | .text] | join(" "))[0:200] end' FILE
5. Session start/cwd: head -c 2000 FILE

Known signal counts: ${s.signals}

Reconstruct: (a) what the user was trying to do, (b) each concrete friction event, (c) whether the cause was Claude's behavior (stopped early, wrong target, didn't verify), tooling (build failures, permission prompts, file-not-read errors), or environment (API blips, device issues). Focus on the USER's experience.

Your final output is consumed programmatically — return ONLY the structured object per the schema. Quotes under 200 chars. Cap events at 8, most costly first.`, { label: `read:${s.label}`, phase: 'DeepRead', schema: SCHEMA })))

return results
