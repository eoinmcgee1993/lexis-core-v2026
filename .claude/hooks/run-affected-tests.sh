#!/bin/bash
#
# PostToolUse hook — runs the test suite that covers whatever file was just
# edited, and reports back only when something fails.
#
# Why this exists. The suites in this repo are plain node scripts with no
# runner and no watch mode, so they only run when somebody remembers to run
# them. That is a real risk here rather than a theoretical one: the viseme
# suite caught four genuine bugs in its own module's first implementation,
# and backend/test/fair-use.test.mjs extracts helpers out of app.mjs BY
# SOURCE TEXT, so renaming fairUseCapSeconds, periodSecondsUsed, passDays or
# paidAccessActive breaks it instantly — exactly the kind of change whose
# author has no reason to think "tests" while making it.
#
# CI now runs the two backend suites too (.github/workflows/test.yml, 9 Sep
# 2026), which does not make this redundant: CI reports after a push, this
# reports inside the edit that caused it, while the reason is still on
# screen. It also still covers the viseme suite, which CI does not run.
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
  # checkout.test.mjs is sensitive to app.mjs in a different way from
  # fair-use: it imports it and drives the real handlers, so what it pins is
  # the params object those handlers build — the Stripe API version, the
  # add-on's two mutually exclusive paths, and the branding fallback that
  # must not carry optional_items onto the SDK's older pinned version.
  # Editing app.mjs therefore runs both backend suites, not one.
  #
  # The loader and shim are how the suite substitutes a local Stripe for the
  # real SDK. Break either and the suite fails for a reason that has nothing
  # to do with the code under test, so they trigger it too.
  */backend/app.mjs|*/backend/test/checkout.test.mjs|*/backend/test/stripe-local-loader.mjs|*/backend/test/stripe-local-shim.mjs)
    suites+=("backend/test/checkout.test.mjs") ;;
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
    # Pull out the FAIL lines and the count summary rather than tailing
    # blindly. All three suites print "FAIL  <name>" at the start of a line
    # and "N passed, M failed" last, so this is the whole story in two greps.
    #
    # The tail this replaced looked fine until checkout.test.mjs existed:
    # that suite provokes a Stripe rejection ON PURPOSE to prove the branding
    # fallback works, and the resulting stack trace fills a 25-line window and
    # pushes the real failing assertion out of it. The report then showed PASS
    # lines and an expected error, which reads as "nothing actually wrong".
    # Falls back to the tail if a suite dies before printing any of its own
    # output — a crash on import has no FAIL line to find.
    detail=$(printf '%s' "$output" | grep -E '^(FAIL|[0-9]+ passed)' | head -25)
    [ -n "$detail" ] || detail=$(printf '%s' "$output" | tail -25)
    failures+="$suite failed:"$'\n'"$detail"$'\n\n'
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
