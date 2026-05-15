# Xroad Studio — Claude Code Skill

Add this skill to **Claude Code** or a **Claude Project** to let Claude schedule and publish social media posts through the [Xroad Studio](https://xroadstudio.com) API.

Once added, Claude knows how to:
- List your connected social accounts (Instagram, TikTok, LinkedIn, X, YouTube, Facebook, Pinterest, Bluesky, Threads)
- Upload media or re-host expiring image URLs (DALL-E, Canva, Google Drive, Airtable)
- Schedule or immediately publish posts
- List, edit, and cancel scheduled posts

**Requires a paid Xroad Studio account.** Get your API key at [xroadstudio.com/settings](https://xroadstudio.com/settings) → API Keys.

---

## Install

### Claude Code

Copy `xroad-studio-skill.md` into your project's `.claude/skills/` folder:

```bash
curl -o .claude/skills/xroad-studio-skill.md \
  https://raw.githubusercontent.com/xroad-studio/xroad-studio-skill/main/xroad-studio-skill.md
```

Then set your key in the environment:

```bash
export XROAD_API_KEY=xrd_live_...
```

### Claude Project

Open [xroad-studio-skill.md](./xroad-studio-skill.md), copy the full contents, and paste it into your Claude Project's context (Project Instructions).

---

## Quick example

Once the skill is active, you can tell Claude:

> "Post this image to my Instagram: [url]. Caption: Launching today."

> "Schedule a TikTok post for Friday at 10am with this video and caption: [text]."

> "Show me all my scheduled posts for this week."

---

## API docs

Full reference: [xroadstudio.com/docs/api](https://xroadstudio.com/docs/api)  
OpenAPI schema: [xroadstudio.com/openapi.json](https://xroadstudio.com/openapi.json)
