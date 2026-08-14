# Rushes clip pipeline: setup

What this workflow does: you POST a link and a brief to a webhook, Reap generates the clips, Claude reviews every clip against the brief, and you get an email with what passed and what needs a look.

## Before you import

Three accounts, three keys. Nothing else required to get a first run working.

1. **Reap**: sign up at reap.video, grab an API key from Studio Settings. The Automation API needs an active paid plan (Creator or Studio), not the free tier.
2. **Anthropic**: an API key from console.anthropic.com. This is separate from your claude.ai login.
3. **Resend**: an API key, plus a verified sending domain if you want to send from your own address rather than Resend's shared one.

## After you import

Open each HTTP Request node and replace the placeholder text with your real key:

- `Reap: Create Clips`, `Reap: Get Status`, `Reap: Get Clips` all have `Bearer YOUR_REAP_API_KEY` in their headers.
- `Claude: QC Review` has `YOUR_ANTHROPIC_API_KEY`.
- `Resend: Send QC Summary` has `YOUR_RESEND_API_KEY`, plus a `from` and `to` address to change from the placeholder domain.

Pasting the key straight into the header works and is the fastest way to get a first run done. Once it is working, move each one into a proper n8n credential (Header Auth type) instead, so the keys are not sitting in plain text in the workflow file.

## Testing it

Activate the workflow, copy its production webhook URL from the `New Job (Webhook)` node, and send it a test job:

```bash
curl -X POST "YOUR_N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test Client",
    "source_url": "https://www.youtube.com/watch?v=SOME_VIDEO_ID",
    "brief": "Pull the three most quotable moments, each under 45 seconds, skip anything about pricing.",
    "orientation": "portrait"
  }'
```

You should get an immediate acknowledgement response, then an email a few minutes later once Reap finishes and Claude has reviewed the clips.

## Where your actual rules go

The QC prompt inside `Claude: QC Review` is a starter rubric: does the clip match the brief, does it stand alone, is the title strong, any risky cut. It is not your real standardised workflow rules, because those have not been written down yet. When they are, replace the prompt text in that node with the real thing.

## Known rough edges

- The polling loop checks every 60 seconds with no maximum retry count, so a stuck Reap project would loop indefinitely. Worth adding a counter that stops after, say, 30 checks (30 minutes) once you are running this for real clients.
- The failed branch just stops and does nothing visible. Wire it to an alert (Slack message, email, whatever you will actually see) before this touches a paying client.
- Webhooks from Reap itself (push instead of this poll) are available on the Creator plan and up, one webhook URL, and would let you drop the Wait loop entirely. Worth switching to once volume justifies it: Profile > Settings > Webhooks in the Reap dashboard, pointed at a second n8n webhook node.
- Node type versions may prompt an update when you import into your instance. That is normal, accept the update.
