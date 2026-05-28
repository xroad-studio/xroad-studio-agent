# Xroad Studio — Autoposting Skill

Add this skill to any AI assistant to schedule and publish social media posts through the [Xroad Studio](https://xroadstudio.com) API.

Works with **Claude Code, Cursor, Windsurf, ChatGPT, Copilot, n8n AI nodes, or any AI that reads context files.**

Once added, your AI knows how to:
- List your connected social accounts (Instagram, TikTok, LinkedIn, X, YouTube, Facebook, Pinterest, Bluesky, Threads)
- Fetch your Brand Kit context before drafting on-brand content
- Upload media or re-host expiring image URLs (DALL-E, Canva, Google Drive, Airtable)
- Schedule or immediately publish posts
- List, edit, and cancel scheduled posts

**Requires a paid Xroad Studio account.** Get your API key at [xroadstudio.com/settings](https://xroadstudio.com/settings) → API Keys.

---

## Install

### Claude Code

```bash
curl -o .claude/skills/xroad-studio-skill.md \
  https://raw.githubusercontent.com/xroad-studio/Skill_autoposting/main/xroad-studio-skill.md
```

### Cursor / Windsurf

Drop the file into your project root — it gets picked up as context automatically:

```bash
curl -O https://raw.githubusercontent.com/xroad-studio/Skill_autoposting/main/xroad-studio-skill.md
```

### ChatGPT Custom GPT

Import [xroadstudio.com/openapi.json](https://xroadstudio.com/openapi.json) as a GPT Action. Set Authentication to Bearer Token and paste your API key.

### Claude Project / ChatGPT Project

Open [xroad-studio-skill.md](./xroad-studio-skill.md), copy the full contents, paste into your Project Instructions.

### Any other AI agent

Fetch the raw file and inject it as system context:

```
https://raw.githubusercontent.com/xroad-studio/Skill_autoposting/main/xroad-studio-skill.md
```

Then set your key:

```bash
export XROAD_API_KEY=xrd_live_...
```

---

## Quick example

Once the skill is active, tell your AI:

> "Post this image to my Instagram: [url]. Caption: Launching today."

> "Use my Garnierusa Brand Kit and schedule an on-brand LinkedIn post for tomorrow."

> "Schedule a TikTok post for Friday at 10am with this video: [url]."

> "Show me all my scheduled posts for this week."

> "Cancel post [id]."

---

## API docs

Full reference: [xroadstudio.com/docs/api](https://xroadstudio.com/docs/api)  
OpenAPI schema: [xroadstudio.com/openapi.json](https://xroadstudio.com/openapi.json)
