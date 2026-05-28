# xroad-studio-skill.md — Xroad Studio API

Use this file as context in Claude Code or a Claude Project to let Claude schedule and publish social media posts through the Xroad Studio API.

**What you can do with this skill:**
- List your connected social accounts
- Read Brand Kit context before drafting content
- Upload media (files up to 1 GB, or re-host expiring URLs from DALL-E, Canva, Google Drive, etc. — max 20 MB for URL mode)
- Schedule or immediately publish posts to Instagram, TikTok, LinkedIn, X, YouTube, Facebook, Pinterest, Bluesky, Threads
- List, edit, and cancel scheduled posts

**Requirements:** A paid Xroad Studio account (Starter, Creator, or Business). Generate your API key at https://xroadstudio.com/settings under API Keys.

---

## Authentication

Every request needs the header:

```
Authorization: Bearer xrd_live_<your-key>
```

Base URL: `https://xroadstudio.com/api/v1`

Store your key in an environment variable — never hardcode it. Suggested: `XROAD_API_KEY`.

---

## Endpoints

### List Brand Kits

```
GET /v1/brand-kits
```

Use this before writing or scheduling branded content. If the user mentions a brand by name, call the endpoint with `?name=` first. If no brand name is given and multiple Brand Kits are returned, ask which brand to use before drafting.

```bash
curl "https://xroadstudio.com/api/v1/brand-kits?name=Garnierusa" \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Garnierusa",
      "logo_url": "https://media.xroadstudio.com/...",
      "colors": {
        "primary": "#005C43",
        "accent": "#799B2A",
        "mood": "#21362C",
        "intensity": "subtle"
      },
      "language": "en",
      "text_style": "professional, consumers interested in hair and skin care products",
      "tone_of_voice": null,
      "audience": null,
      "offer": null,
      "banned_words": null,
      "image_style": "Gotham SSm typography, professional, medium energy",
      "created_at": "2026-05-18T07:45:53.6025+00:00",
      "updated_at": "2026-05-18T07:46:26.177102+00:00"
    }
  ]
}
```

Brand Kit fields are sanitized for external agents. The response does not include `user_id`, storage keys, disabled color values, or internal database-only fields.

---

### Get one Brand Kit

```
GET /v1/brand-kits/{id}
```

Use this when the user or a previous API response gives you the Brand Kit UUID.

```bash
curl https://xroadstudio.com/api/v1/brand-kits/$BRAND_ID \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

---

### List connected accounts

```
GET /v1/accounts
```

Returns active social accounts the user has connected. Use the `id` field as `social_account_ids` when creating posts.

```bash
curl https://xroadstudio.com/api/v1/accounts \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

Response:
```json
{
  "data": [
    { "id": "acc_abc123", "platform": "instagram", "username": "myhandle" },
    { "id": "acc_xyz789", "platform": "tiktok",    "username": "myhandle" }
  ]
}
```

---

### Upload media

Two modes — use whichever fits:

**Option A: Upload a file (up to 1 GB)**

```bash
curl -X POST https://xroadstudio.com/api/v1/media \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -F "file=@/path/to/photo.jpg"
```

**Option B: Re-host an expiring URL (DALL-E, Gemini, Canva, Google Drive, Airtable — max 20 MB)**

```bash
curl -X POST https://xroadstudio.com/api/v1/media \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://oaidalleapiprodscus.blob.core.windows.net/..." }'
```

Response (both modes):
```json
{ "data": { "url": "https://media.xroadstudio.com/..." } }
```

The returned URL is permanent. Use it as `media_url` in the post creation call below.

Google Drive tip: use `https://drive.google.com/uc?export=download&id=FILE_ID` (file must be shared publicly).

> **Important:** After upload, always verify the media URL is reachable before creating the post (see Safe Media Posting workflow below). Videos in particular can take 10-15s to finish processing on the CDN.

---

### Create a post

```
POST /v1/posts
```

```bash
curl -X POST https://xroadstudio.com/api/v1/posts \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Your post caption here",
    "scheduled_at": "2026-06-01T10:00:00Z",
    "social_account_ids": ["acc_abc123", "acc_xyz789"],
    "media_url": "https://media.xroadstudio.com/..."
  }'
```

**Body fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `caption` | string | yes | Max 2200 chars |
| `social_account_ids` | string[] | yes | From GET /v1/accounts |
| `scheduled_at` | ISO 8601 datetime | no | Omit to publish immediately. Must be 30s+ in future, max 3 months out. |
| `media_url` | string | no | Permanent public URL. Mutually exclusive with `asset_id`. |
| `asset_id` | UUID | no | ID of an asset from your Xroad library or generation history. Mutually exclusive with `media_url`. |
| `platform_configurations` | object | no | Per-platform options (TikTok privacy, YouTube title, etc.). See OpenAPI schema. |

Response (201):
```json
{
  "data": {
    "id": "uuid",
    "caption": "Your post caption here",
    "status": "scheduled",
    "scheduled_at": "2026-06-01T10:00:00Z",
    "social_account_ids": ["acc_abc123"],
    "media_url": "https://media.xroadstudio.com/...",
    "created_at": "2026-05-15T09:00:00Z"
  }
}
```

---

### Get a single post

```
GET /v1/posts/{id}
```

```bash
curl https://xroadstudio.com/api/v1/posts/$POST_ID \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

**Post status lifecycle:** `scheduled` → `processing` → `published` (or `failed` / `cancelled`)

---

### List posts

```
GET /v1/posts
```

Query params: `status` (scheduled/processing/published/failed/cancelled), `from` (ISO datetime), `to` (ISO datetime), `limit` (1-100, default 25), `cursor` (for pagination).

```bash
curl "https://xroadstudio.com/api/v1/posts?status=scheduled&limit=10" \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

Response includes `next_cursor` for pagination. Pass it as `cursor=` in the next request.

---

### Edit a scheduled post

```
PATCH /v1/posts/{id}
```

Only works while `status = scheduled`. Editable fields: `caption`, `scheduled_at`, `media_url`, `platform_configurations`.

```bash
curl -X PATCH https://xroadstudio.com/api/v1/posts/$POST_ID \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Updated caption",
    "scheduled_at": "2026-06-01T14:00:00Z"
  }'
```

---

### Cancel a scheduled post

```
DELETE /v1/posts/{id}
```

Works on `scheduled` and `processing` posts. Published posts cannot be cancelled here — manage those on the platform directly.

```bash
curl -X DELETE https://xroadstudio.com/api/v1/posts/$POST_ID \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

Response: `{ "data": { "id": "...", "status": "cancelled" } }`

---

## Common workflows

### Branded autoposting workflow

Use this workflow whenever the user asks for branded, on-brand, brand-consistent, client-specific, or named-brand content.

1. Fetch the Brand Kit:

```bash
curl "https://xroadstudio.com/api/v1/brand-kits?name=BRAND_NAME" \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

2. Draft using the Brand Kit:

- Use `language` for output language.
- Use `text_style` and `tone_of_voice` for caption tone and structure.
- Use `audience` to decide what pain points and benefits to emphasize.
- Use `offer` to keep the call to action aligned with the business.
- Avoid exact words or phrases listed in `banned_words`.
- Use `colors` and `image_style` when generating or selecting visuals.
- Use `logo_url` only if the user asks to include the logo or brand mark.

3. Continue with media upload, social account lookup, and post creation.

Do not invent Brand Kit fields that are `null`. If a field is missing, use the user's brief and the available fields.

---

### Safe media posting (ALWAYS use this when posting with media)

Never post immediately after upload — the CDN needs time to propagate. Images take ~5s, videos can take 10-15s. Always verify the URL returns 200 before creating the post.

```bash
# 1. Upload media and get permanent URL
MEDIA_URL=$(curl -s -X POST https://xroadstudio.com/api/v1/media \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"$SOURCE_URL\"}" | jq -r '.data.url')

if [ -z "$MEDIA_URL" ] || [ "$MEDIA_URL" = "null" ]; then
  echo "Media upload failed" && exit 1
fi

# 2. Poll until media is live on CDN (every 5s, max 15 attempts = 75s timeout)
MAX_ATTEMPTS=15
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MEDIA_URL")
  if [ "$STATUS" = "200" ]; then
    echo "Media verified live after $((ATTEMPT * 5))s"
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "Media never became available after ${MAX_ATTEMPTS}x5s — aborting" && exit 1
  fi
  sleep 5
done

# 3. Get account ID
ACCOUNT_ID=$(curl -s https://xroadstudio.com/api/v1/accounts \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  | jq -r '.data[] | select(.platform=="instagram") | .id')

# 4. Now safe to post
curl -s -X POST https://xroadstudio.com/api/v1/posts \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"caption\": \"Your caption here\",
    \"social_account_ids\": [\"$ACCOUNT_ID\"],
    \"media_url\": \"$MEDIA_URL\"
  }"
```

Why 75s max? Images are ready in 1-2 polls (5-10s). Videos can take 10-15s to transcode. 75s gives comfortable headroom for large video files without blocking forever.

---

### Post an AI-generated image immediately

```bash
SOURCE_URL="<dalle-or-other-expiring-url>"

# 1. Re-host to permanent URL
MEDIA_URL=$(curl -s -X POST https://xroadstudio.com/api/v1/media \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"$SOURCE_URL\"}" | jq -r '.data.url')

# 2. Verify media is live (poll every 5s, max 15 tries)
for i in $(seq 1 15); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$MEDIA_URL")" = "200" ] && break
  [ $i -eq 15 ] && echo "Media not available — aborting" && exit 1
  sleep 5
done

# 3. Get account ID + post
ACCOUNT=$(curl -s https://xroadstudio.com/api/v1/accounts \
  -H "Authorization: Bearer $XROAD_API_KEY" | jq -r '.data[0].id')

curl -X POST https://xroadstudio.com/api/v1/posts \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"caption\":\"Check this out!\",\"social_account_ids\":[\"$ACCOUNT\"],\"media_url\":\"$MEDIA_URL\"}"
```

### Schedule a week of posts from an n8n loop

In n8n: use an HTTP Request node for each step. Set `Authentication: Header Auth`, key `Authorization`, value `Bearer {{$credentials.xroadApiKey}}`. Import `/openapi.json` at `https://xroadstudio.com/openapi.json` for schema auto-complete.

For media verification in n8n: add a Wait node (5s) after the media upload, then an HTTP Request node doing a GET on the media URL. Use an IF node to check status code = 200 before proceeding to post creation. Loop back to the Wait node if not yet 200 (up to 15 iterations).

---

## Error codes

All errors return `{ "error": { "code": "...", "message": "..." } }`.

| Code | HTTP | Meaning |
|---|---|---|
| `invalid_key` | 401 | Key missing, malformed, or revoked. |
| `plan_required` | 403 | Account is not on a paid plan. |
| `subscription_inactive` | 403 | Subscription expired or payment failed. |
| `quota_monthly` | 429 | Monthly post limit reached. |
| `quota_queue` | 429 | Too many posts queued waiting to publish. |
| `rate_limited` | 429 | Over 60 requests/minute. Check `retry_after` in response + `Retry-After` header. |
| `media_fetch_failed` | 422 | URL not reachable or over 20 MB. |
| `media_processing_failed` | 422 | Media uploaded successfully but could not be processed by the provider. Retry the request — it resolves automatically in most cases. |
| `asset_not_found` | 404 | `asset_id` not found in your library. |
| `not_updatable` | 409 | Post is past `scheduled` status — cannot edit. |
| `not_cancellable` | 409 | Post already published. |
| `duplicate` | 409 | Identical post submitted within 30 seconds. |
| `invalid_request` | 400 | Validation error — check `message` for details. |

---

## Limits

- Rate limit: 60 requests / 60 seconds per key
- Monthly post quota: Starter 30/mo, Creator 120/mo, Business 500/mo (shared with dashboard)
- Media file upload: 1 GB max
- Media URL re-host: 20 MB max
- `scheduled_at`: minimum 30 seconds in future, maximum 3 months out
- 1 active API key per account (revoke existing key to rotate)

---

## OpenAPI schema

Full schema (Postman, Insomnia, GPT Actions): `https://xroadstudio.com/openapi.json`
