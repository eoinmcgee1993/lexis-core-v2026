# Rushes clip pipeline (n8n)

An n8n automation, unrelated to the LEXIS product in the rest of this repo. It lives here
because that's where it was asked to be committed — treat this folder as a standalone
workflow, not part of the LEXIS app or its deploy process.

**What it does:** POST a source link + a brief to a webhook → Reap generates clips →
Claude reviews every clip against the brief → Resend emails a summary of what passed and
what needs a look.

## Files

- `workflow.json` — the n8n workflow. Import it via n8n's *Import from File* (or paste
  into *Import from URL/Clipboard*). Accept any node-version-update prompt on import.
- `SETUP.md` — the original setup guide: accounts/keys needed, where to paste them after
  import, how to send a test job, and the known rough edges.

## What's implemented vs. the setup guide

The imported workflow matches `SETUP.md` with two of its "known rough edges" already
addressed, since they're cheap to fix and called out as necessary before real client use:

- **Bounded polling.** `Init Poll State` / `Increment Poll Count` track a `poll_count`
  alongside the Reap project id. `IF: Failed or Timed Out?` routes out of the loop once
  `poll_count >= 30` (~30 minutes at 60s/check), instead of polling forever.
- **A visible failure path.** Both a real Reap `failed` status and a poll timeout route to
  `Resend: Send Failure Alert`, which emails the same inbox as the QC summary. Point it at
  a real address (or swap in Slack) before this touches a paying client.

Everything else — the three accounts/keys, pasting keys into the HTTP nodes then moving
them to n8n credentials, the test `curl`, and the QC prompt being a starter rubric to
replace with real rules — is as described in `SETUP.md`.

## Quick start

1. Import `workflow.json` into your n8n instance.
2. Follow `SETUP.md` → *After you import* to paste in your Reap / Anthropic / Resend keys
   (nodes: `Reap: Create Clips`, `Reap: Get Status`, `Reap: Get Clips`, `Claude: QC
   Review`, `Resend: Send QC Summary`, `Resend: Send Failure Alert`).
3. Set real `from`/`to` addresses on both Resend nodes.
4. Activate the workflow and send it a test job per `SETUP.md` → *Testing it*.
