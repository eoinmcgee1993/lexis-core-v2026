#!/bin/bash
#
# PostToolUse hook — runs the test suite that covers whatever file was just
# edited, and reports back only when something fails.
#
# Why this exists. Both suites in this repo are plain node scripts with no
# runner and no watch mode, so they only run when somebody remembers to run
# them. That is a real risk here rather than a theoretical one: the viseme
# suite caught four genuine bugs in its own module's first implementation,
# and backend/test/fair-use.test.mjs extracts helpers out of app.mjs BY
# SOURCE TEXT, so renaming fairUseCapSeconds, periodSecondsUsed, passDays or
# paidAccessActive breaks it instantly — exactly the kind of change whose
# author has no reason to think "tests" while making it.
#
# Deliberately NOT run-everything-on-every-edit. Only the two files each
# suite actually depends on trigger it, so editing a page component doesn't
# pay for a backend test run.
#
# Silent on success. A hook that prints on every edit becomes noise that
# gets ignored, which defeats the point.
#
# NOT `set -e`: a failing test must be reported, not abort the script before
# it can report.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$root" || exit 0

payload=$(cat)
# PostToolUse gives the written path in tool_response for Write and in
# tool_input for Edit; take whichever is present.
file=$(printf '%s' "$payload" | jq -r '.tool_response.filePath // .tool_input.file_path // empty' 2>/dev/null)
[ -n "$file" ] || exit 0

suites=()
case "$file" in
  # The fair-use suite reads app.mjs's source directly, so a change to
  # either file can invalidate it.
  */backend/app.mjs|*/backend/test/fair-use.test.mjs)
    suites+=("backend/test/fair-use.test.mjs") ;;
esac
case "$file" in
  */frontend/src/lib/visemes.js|*/frontend/scripts/visemes.test.mjs)
    suites+=("frontend/scripts/visemes.test.mjs") ;;
esac

[ ${#suites[@]} -gt 0 ] || exit 0

failures=""
for suite in "${suites[@]}"; do
  [ -f "$suite" ] || continue
  if ! output=$(node "$suite" 2>&1); then
    # Keep the tail: these suites print one line per case and the summary
    # last, so the end of the output is the part worth reading.
    failures+="$suite failed:"$'\n'"$(printf '%s' "$output" | tail -25)"$'\n\n'
  fi
done

if [ -z "$failures" ]; then
  # Passed. Say nothing at all.
  exit 0
fi

# Report to the user AND back into the model's context, so a break is acted
# on rather than scrolled past. Not a "block": the edit itself was fine, and
# halting the turn mid-refactor over a transiently red suite is worse than
# surfacing it.
jq -nc --arg f "$failures" '{
  systemMessage: ("Tests failing after this edit:\n" + $f),
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: ("A test suite covering the file you just edited is now failing. Fix it before continuing.\n\n" + $f)
  }
}'
