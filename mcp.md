# Xroad Studio MCP Server

Xroad Studio exposes a remote MCP (Model Context Protocol) server. Instead of teaching your agent to write curl commands from [agent-skills.md](./agent-skills.md), you connect your MCP client once and it gets 13 ready-made tools for posting, scheduling, media, AI images, Brand Kits, and analytics.

Both options use the same API, the same key, and the same plan limits. Pick MCP when your tool supports it (Claude web chat, Claude Code, Claude Desktop, Cursor, Windsurf, Antigravity, n8n). Pick the markdown skill for everything else (ChatGPT Projects, plain prompt contexts).

## Connection

```text
URL:  https://xroadstudio.com/api/mcp
Auth: Authorization: Bearer xrd_live_<your-key>
```

Clients that cannot send a custom header (claude.ai custom connectors, some no-code tools) can pass the key in the URL instead:

```text
https://xroadstudio.com/api/mcp?key=xrd_live_<your-key>
```

Treat that full URL as a secret: it contains your key. Prefer the header form whenever your client supports it.

Transport is Streamable HTTP. Generate your API key at [xroadstudio.com/settings](https://xroadstudio.com/settings) under API Keys, and store it in an environment variable such as `XROAD_API_KEY`. Never paste a real key into config files you commit or share.

## Tools

| Tool | What it does |
|---|---|
| `create_post` | Publish now or schedule a post to connected accounts |
| `list_posts` | List posts with status and date filters, paginated |
| `get_post` | Get one post and its current status |
| `update_post` | Edit a post that is still scheduled |
| `cancel_post` | Cancel a scheduled or processing post |
| `upload_media` | Re-host an expiring URL (DALL-E, Canva, Drive, max 20 MB) onto the permanent Xroad CDN |
| `generate_image` | Generate one AI image and wait for the finished URL (20 credits) |
| `get_image_status` | Check an image job that is still running |
| `list_accounts` | List connected social accounts and their IDs |
| `get_connect_url` | Generate an OAuth URL for connecting a new account |
| `list_brand_kits` | Read sanitized brand voice, colors, audience, offer, banned words |
| `get_brand_kit` | Get one Brand Kit by ID |
| `get_analytics` | Normalized performance metrics per account (Creator and Business plans) |

Errors, quotas, rate limits, and plan rules are identical to the REST API. See [agent-skills.md](./agent-skills.md#error-codes) for the error code table.

## Setup

### Claude Code

```bash
claude mcp add --transport http xroad-studio https://xroadstudio.com/api/mcp \
  --header "Authorization: Bearer $XROAD_API_KEY"
```

### Cursor

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "xroad-studio": {
      "url": "https://xroadstudio.com/api/mcp",
      "headers": {
        "Authorization": "Bearer xrd_live_<your-key>"
      }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "xroad-studio": {
      "serverUrl": "https://xroadstudio.com/api/mcp",
      "headers": {
        "Authorization": "Bearer xrd_live_<your-key>"
      }
    }
  }
}
```

### Claude Web and Claude Desktop (custom connector)

In [claude.ai](https://claude.ai) or the Claude desktop app: Settings, then Connectors, then "Add custom connector". Custom connectors cannot send a custom header, so use the key-in-URL form:

```text
https://xroadstudio.com/api/mcp?key=xrd_live_<your-key>
```

Leave OAuth fields empty. Once added, enable the connector in a chat and ask Claude to list your Xroad accounts to verify. Anyone who sees this URL can post as you, so do not share screenshots of the connector settings, and rotate the key in Xroad Studio if it leaks.

### Antigravity

Open the MCP settings from the agent panel (Manage MCP servers) and add the server to the config JSON:

```json
{
  "mcpServers": {
    "xroad-studio": {
      "serverUrl": "https://xroadstudio.com/api/mcp",
      "headers": {
        "Authorization": "Bearer xrd_live_<your-key>"
      }
    }
  }
}
```

If your Antigravity version does not support the `headers` field, use the key-in-URL form as `serverUrl` instead: `https://xroadstudio.com/api/mcp?key=xrd_live_<your-key>`.

### Claude Desktop and other stdio-only clients

Clients that only speak stdio can bridge to the remote server with `mcp-remote`:

```json
{
  "mcpServers": {
    "xroad-studio": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://xroadstudio.com/api/mcp",
        "--header", "Authorization: Bearer ${XROAD_API_KEY}"
      ],
      "env": {
        "XROAD_API_KEY": "xrd_live_<your-key>"
      }
    }
  }
}
```

This bridge is only needed for clients without remote-server support. Claude Desktop itself can use the custom connector setup above instead.

### n8n

Use the MCP Client Tool node:

- Endpoint: `https://xroadstudio.com/api/mcp`
- Server Transport: HTTP Streamable
- Authentication: Header Auth, name `Authorization`, value `Bearer xrd_live_<your-key>`

### ChatGPT

ChatGPT Custom GPTs work best through GPT Actions with the OpenAPI schema instead of MCP. Import `https://xroadstudio.com/openapi.json` and set authentication to Bearer Token. See the [README](./README.md#chatgpt-custom-gpt).

## Verify the connection

Ask your agent to run the `list_accounts` tool. A connected setup returns your social accounts. Common failures:

- HTTP 401 before any tool runs: no key reached the server. The Authorization header (or `?key=` URL parameter) is missing or does not start with `xrd_live_`.
- `invalid_key` inside a tool result: the key is wrong or revoked. Create a new one in Xroad Studio settings.
- `plan_required` or `subscription_inactive`: API access needs an active paid plan.

## Operational notes

- Rate limit: 60 requests per 60 seconds per key, shared with REST API usage.
- `generate_image` blocks up to 90 seconds while polling. If the image is still processing after that, it returns the pending job; check it with `get_image_status`.
- `upload_media` accepts URLs only (max 20 MB). For local files up to 250 MB, use the REST endpoint `POST /media` with multipart upload, described in [agent-skills.md](./agent-skills.md#upload-media).
- Publishing is a user-visible action. A well-behaved agent confirms the destination account, caption, media, and time before calling `create_post`, `update_post`, or `cancel_post` when anything is ambiguous.
