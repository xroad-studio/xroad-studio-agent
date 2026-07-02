# Agent skills

Last verified against the public Xroad Studio API: June 3, 2026

This repository contains a portable AI-agent skill for generating images, publishing, and scheduling social media posts through the [Xroad Studio](https://xroadstudio.com) API.

Use it when you want an AI assistant to act like a social media operations agent: check which accounts are connected, read sanitized Brand Kit context, draft on-brand captions, upload or re-host media, then publish or schedule posts through Xroad Studio.

## Capabilities

**Posting API**
- Publish, schedule, edit, and cancel posts across 10 platforms.
- Post immediately or schedule for later.
- Confirms destination account, caption, media, and time before publishing when anything is ambiguous.
- → [`POST /posts`](./agent-skills.md#create-a-post) · [`GET /posts`](./agent-skills.md#list-posts) · [`PATCH /posts/{id}`](./agent-skills.md#edit-a-scheduled-post) · [`DELETE /posts/{id}`](./agent-skills.md#cancel-a-scheduled-post)

**Analytics API**
- Normalized post performance per connected account: reach, views, engagement, likes, comments, shares.
- Same response shape across every platform — no per-platform metric mapping needed.
- Creator and Business plans only.
- → [`GET /analytics/{accountId}`](./agent-skills.md#read-post-analytics)

**Image Creation API**
- Generate one AI image at a time from a text prompt.
- Poll until the permanent CDN URL is ready.
- Post the generated image directly, no manual download/upload step.
- → [`POST /images`](./agent-skills.md#generate-an-image) · [`GET /images/{job_id}`](./agent-skills.md#get-generated-image-status)

**Brand Kit API**
- Read sanitized brand voice, colors, audience, offer, and banned-words context.
- Keeps drafts on-brand without manual copy-pasting.
- → [`GET /brand-kits`](./agent-skills.md#list-brand-kits) · [`GET /brand-kits/{id}`](./agent-skills.md#get-one-brand-kit)

**Accounts & Media**
- List connected social accounts and generate OAuth connection URLs for new ones.
- Upload local files or re-host expiring URLs (ChatGPT/DALL-E, Canva, Gemini, Google Drive, Airtable) into a permanent CDN URL.
- Verifies the resulting URL is reachable before it's used in a post.
- → [`GET /accounts`](./agent-skills.md#list-connected-accounts) · [`POST /accounts/connect`](./agent-skills.md#generate-a-social-account-connection-url) · [`POST /media`](./agent-skills.md#upload-media)

The skill also guides the agent when an account, Brand Kit, API key, or OAuth connection is missing, instead of failing silently.

## Supported Platforms

The API can post to connected accounts on:

- Instagram
- TikTok
- TikTok Business
- YouTube
- Facebook
- X
- LinkedIn
- Pinterest
- Threads
- Bluesky

The exact posting behavior depends on the connected social account and the platform-specific options supported by Xroad Studio, such as Instagram placement, TikTok privacy settings, or YouTube title/privacy settings.

## Requirements

- Xroad Studio account with API access. The public OpenAPI schema currently describes API access for Creator and Business plans.
- Xroad Studio API key from [xroadstudio.com/settings](https://xroadstudio.com/settings) under API Keys.
- At least one social account connected in Xroad Studio before the agent can publish to it.
- A Brand Kit created in Xroad Studio when you want branded or client-specific content.
- An AI tool that can read instruction/context files, such as Claude Code, Cursor, Windsurf, ChatGPT Projects, Custom GPT Actions, Copilot, n8n AI nodes, or another agent runtime.

Never commit or paste a real API key into this repository. Store it in an environment variable such as `XROAD_API_KEY`.

## Setup In Xroad Studio

Before using the skill, complete this setup in Xroad Studio:

1. Open [xroadstudio.com/settings](https://xroadstudio.com/settings).
2. Create or copy an API key from the API Keys section.
3. Connect the social accounts you want the agent to post to.
4. Create a Brand Kit for each brand or client you want the agent to write for.
5. Store your key locally:

```bash
export XROAD_API_KEY=xrd_live_...
```

You can verify the account connection from a terminal:

```bash
curl https://xroadstudio.com/api/v1/accounts \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

## Install

### MCP Server (Recommended For Claude Code, Cursor, Windsurf, n8n)

Xroad Studio also runs a remote MCP server at `https://xroadstudio.com/api/mcp`. If your tool supports MCP, connect it once and skip the manual context setup below. Setup instructions per client are in [mcp.md](./mcp.md).

```bash
claude mcp add --transport http xroad-studio https://xroadstudio.com/api/mcp \
  --header "Authorization: Bearer $XROAD_API_KEY"
```

### Claude Code

Claude Code only auto-discovers skills laid out as `.claude/skills/<name>/SKILL.md` with YAML frontmatter. This file is plain Markdown without frontmatter, so download it into your project root and reference it from `CLAUDE.md` instead:

```bash
curl -O https://raw.githubusercontent.com/xroad-studio/xroad-studio-agent/main/agent-skills.md
```

Then add this line to your project's `CLAUDE.md` so Claude Code loads it as context:

```text
@agent-skills.md
```

### Cursor Or Windsurf

Download the skill into your project root so the agent can read it as context:

```bash
curl -O https://raw.githubusercontent.com/xroad-studio/xroad-studio-agent/main/agent-skills.md
```

### ChatGPT Custom GPT

Import the OpenAPI schema as a GPT Action:

```text
https://xroadstudio.com/openapi.json
```

Set authentication to Bearer Token and provide your Xroad Studio API key.

### Claude Project Or ChatGPT Project

Open [agent-skills.md](./agent-skills.md), copy the full contents, and paste it into the project's instructions or knowledge/context area.

### n8n Or Other Agent Runtimes

Fetch the raw skill file and inject it as system or workflow context:

```text
https://raw.githubusercontent.com/xroad-studio/xroad-studio-agent/main/agent-skills.md
```

Use an HTTP Request node with:

- Header name: `Authorization`
- Header value: `Bearer {{$credentials.xroadApiKey}}`
- Base URL: `https://xroadstudio.com/api/v1`

## How It Works

1. The user asks the AI assistant to create, schedule, edit, or cancel social content.
2. The assistant loads this skill as instruction context.
3. The assistant checks the user's Xroad Studio API key and calls the Xroad API.
4. For branded content, the assistant fetches the requested Brand Kit first.
5. The assistant lists connected social accounts and selects the right account IDs.
6. If media is provided, the assistant uploads or re-hosts it, then verifies the CDN URL is live.
7. If the user needs a new AI image, the assistant starts `POST /images` and polls `GET /images/{job_id}` until `image_url` is ready.
8. The assistant creates a post through `POST /posts`, either immediate or scheduled.

The skill is intentionally written as plain Markdown so it can be reused across many AI systems without requiring a package install.

## Example Prompts

```text
Post this image to my Instagram account. Use the attached image URL and write a concise launch caption.
```

```text
Generate a clean product image, then post it to Instagram with a short caption.
```

```text
Use my Brand Kit named Example Studio and schedule an on-brand LinkedIn post for tomorrow at 10:00 UTC.
```

```text
Create a TikTok post for Friday at 10am with this video URL. Use public privacy and disable comments.
```

```text
Show all scheduled posts for this week.
```

```text
Cancel post 6a0f20d7-0c3a-4b4b-a2d8-000000000000.
```

## API Surface Used By The Skill

Base URL:

```text
https://xroadstudio.com/api/v1
```

Primary endpoints:

- `GET /brand-kits`
- `GET /brand-kits/{id}`
- `GET /accounts`
- `POST /accounts/connect`
- `GET /analytics/{accountId}`
- `POST /media`
- `POST /images`
- `GET /images/{job_id}`
- `POST /posts`
- `GET /posts`
- `GET /posts/{id}`
- `PATCH /posts/{id}`
- `DELETE /posts/{id}`

Full API reference:

- [API docs](https://xroadstudio.com/docs/api)
- [OpenAPI schema](https://xroadstudio.com/openapi.json)

## Secure By Design

The skill is designed for public agent use without exposing sensitive Xroad Studio internals.

- Uses the public Xroad Studio API only.
- Requires Bearer-token authentication on every request.
- Instructs agents to store API keys in environment variables or secret managers.
- Reads only sanitized Brand Kit fields intended for external agents.
- Does not expose internal database fields, user IDs, storage keys, provider credentials, OAuth tokens, or private implementation details.
- Keeps third-party provider plumbing behind the Xroad Studio API instead of documenting internal posting infrastructure.
- Requires the agent to confirm ambiguous posting destinations before publishing, editing, or cancelling posts.

## Limits And Operational Notes

- Rate limit: 60 requests per 60 seconds per key.
- Media file upload: JPG, PNG, WebP, MP4, or MOV up to 250 MB.
- Media URL re-hosting: public URL up to 20 MB.
- `caption`: max 2,200 characters.
- `scheduled_at`: at least 30 seconds in the future and no more than 3 months out.
- Post status lifecycle: `scheduled`, `processing`, `published`, `failed`, `cancelled`.
- Published posts cannot be cancelled through this API.
- Media should be verified with an HTTP `200` check before creating the post.

## Security

- Do not hardcode API keys in prompts, code, screenshots, commits, or shared project files.
- Use environment variables or your agent runtime's secret manager.
- Revoke and recreate the API key in Xroad Studio if it may have been exposed.
- Treat social posting as a user-approved action. The agent should confirm destination accounts, caption, media, and schedule before publishing when there is any ambiguity.
