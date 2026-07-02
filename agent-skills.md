# Agent skills

Use this file as context in an AI agent to let the agent schedule and publish social media posts through the Xroad Studio API.

Last verified against the public Xroad Studio API: June 3, 2026

## Agent role

You are an agent workflow assistant for Xroad Studio. Your current job is to help the user draft, upload, schedule, publish, inspect, edit, and cancel social media posts using the Xroad Studio API.

Before creating or changing a post, make sure you know:

- Which connected social account or platform to use.
- Whether the post should publish immediately or be scheduled.
- The final caption text.
- The final media source, if media is required.
- The Brand Kit to use, if the user asks for branded or client-specific content.

If any of those details are ambiguous, ask a concise clarification before posting. Treat publishing as a user-visible action and avoid posting to a guessed account.

**What you can do with this skill:**
- Generate one AI image at a time with Xroad Studio, then poll until the image URL is ready
- List your connected social accounts
- Read Brand Kit context before drafting content
- Upload media (JPG, PNG, WebP, MP4, MOV files up to 250 MB, or re-host public/temporary URLs up to 20 MB)
- Schedule or immediately publish posts to Instagram, TikTok, TikTok Business, YouTube, Facebook, X, LinkedIn, Pinterest, Threads, and Bluesky
- List, edit, and cancel scheduled posts
- Generate OAuth connection URLs when the user needs to connect a new social account

**Requirements:** Xroad Studio API access, currently described in the public OpenAPI schema for Creator and Business plans. Generate your API key at https://xroadstudio.com/settings under API Keys. The user must connect social accounts in Xroad Studio before you can post to them. Brand Kit context is available only after the user creates Brand Kits in Xroad Studio.

---

## Authentication

Every request needs the header:

```
Authorization: Bearer xrd_live_<your-key>
```

Base URL: `https://xroadstudio.com/api/v1`

Store your key in an environment variable - never hardcode it. Suggested: `XROAD_API_KEY`.

Endpoint examples below are relative to the base URL. For example, `GET /brand-kits` means `GET https://xroadstudio.com/api/v1/brand-kits`.

Security rules:

- Never print, commit, or store the user's full API key.
- If the key is missing, ask the user to set `XROAD_API_KEY` or configure the secret in their agent/runtime.
- If an API call returns `401 invalid_key`, ask the user to create or rotate the key in Xroad Studio settings.
- Do not publish, reschedule, or cancel posts when the intended account or post ID is unclear.

---

## Endpoints

### List Brand Kits

```
GET /brand-kits
```

Use this before writing or scheduling branded content. If the user mentions a brand by name, call the endpoint with URL-encoded `?name=` first. If no brand name is given and multiple Brand Kits are returned, ask which brand to use before drafting.

```bash
curl "https://xroadstudio.com/api/v1/brand-kits?name=Example%20Studio" \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

Response shape:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Brand name",
      "logo_url": "https://media.xroadstudio.com/...",
      "colors": { "primary": "#005C43", "accent": "#799B2A", "mood": null, "intensity": "subtle" },
      "language": "en",
      "text_style": "professional",
      "tone_of_voice": "Example brand voice...",
      "audience": "Who this brand speaks to",
      "offer": "What this brand sells or promises",
      "banned_words": "words, phrases, to avoid",
      "image_style": "visual style guidance"
    }
  ]
}
```

Brand Kit fields are sanitized for external agents. The response does not include `user_id`, storage keys, OAuth tokens, provider credentials, disabled color values, or internal database-only fields. Do not ask the user for private provider credentials; Xroad Studio handles connected-account authorization behind the API.

---

### Get one Brand Kit

```
GET /brand-kits/{id}
```

Use this when the user or a previous API response gives you the Brand Kit UUID.

```bash
curl https://xroadstudio.com/api/v1/brand-kits/$BRAND_ID \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

---

### List connected accounts

```
GET /accounts
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
    {
      "id": "acc_abc123",
      "platform": "instagram",
      "username": "myhandle",
      "profile_photo_url": "https://...",
      "status": "active",
      "created_at": "2026-05-15T09:00:00Z"
    },
    {
      "id": "acc_xyz789",
      "platform": "tiktok",
      "username": "myhandle",
      "profile_photo_url": "https://...",
      "status": "active",
      "created_at": "2026-05-15T09:00:00Z"
    }
  ]
}
```

Use this before every create-post request. If multiple accounts match the user's request, ask which one to use. If no account is connected for the requested platform, tell the user to connect it in Xroad Studio or generate an OAuth URL with `POST /accounts/connect`.

Supported platform values:

- `instagram`
- `tiktok`
- `tiktok_business`
- `youtube`
- `facebook`
- `x`
- `linkedin`
- `pinterest`
- `threads`
- `bluesky`

---

### Generate a social account connection URL

```
POST /accounts/connect
```

Use this only when the user needs to connect a new social account. The response returns an OAuth URL that the user must open in a browser. API-only flows cannot complete the OAuth handshake for the user.

```bash
curl -X POST https://xroadstudio.com/api/v1/accounts/connect \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "platform": "instagram" }'
```

Response:
```json
{
  "data": {
    "auth_url": "https://...",
    "platform": "instagram",
    "expires_in": 600
  }
}
```

---

### Upload media

Two modes - use whichever fits:

**Option A: Upload a file (up to 250 MB)**

```bash
curl -X POST https://xroadstudio.com/api/v1/media \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -F "file=@/path/to/photo.jpg"
```

**Option B: Re-host an expiring URL (DALL-E, Gemini, Canva, Google Drive, Airtable - max 20 MB)**

```bash
curl -X POST https://xroadstudio.com/api/v1/media \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://oaidalleapiprodscus.blob.core.windows.net/..." }'
```

Response (both modes):
```json
{ "data": { "url": "https://media.xroadstudio.com/...", "skip_processing": false } }
```

The returned URL is permanent. Use it as `media_url` in the post creation call below.

Google Drive tip: use `https://drive.google.com/uc?export=download&id=FILE_ID` (file must be shared publicly).

> **Important:** After upload, always verify the media URL is reachable before creating the post (see Safe Media Posting workflow below). Videos in particular can take 10-15s to finish processing on the CDN.

---

### Generate an image

```
POST /images
```

Generates one GPT Image 2 image. This endpoint is polling-only: start the job, then call `GET /images/{job_id}` until `status` is `completed`.

```bash
curl -X POST https://xroadstudio.com/api/v1/images \
  -H "Authorization: Bearer $XROAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A clean studio product photo on a matte black surface",
    "aspect_ratio": "1:1"
  }'
```

Body fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `prompt` | string | yes | Max 4000 chars |
| `aspect_ratio` | string | no | `1:1`, `16:9`, `9:16`, `4:3`, or `3:4`. Defaults to `1:1`. |

Only one image generation can be active at a time. Wait until the current image returns an `image_url` before starting the next one.

Response:

```json
{
  "data": {
    "job_id": "uuid",
    "asset_id": "uuid",
    "status": "processing",
    "poll_url": "/api/v1/images/uuid"
  }
}
```

> **Note:** If an identical prompt is submitted again within the dedup window, the response omits `asset_id`. Rely on `job_id` and poll `GET /images/{job_id}` for the result.

### Get generated image status

```
GET /images/{job_id}
```

```bash
curl https://xroadstudio.com/api/v1/images/$JOB_ID \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

When complete, use `image_url` directly in `POST /posts` as `media_url`.

```json
{
  "data": {
    "job_id": "uuid",
    "asset_id": "uuid",
    "status": "completed",
    "image_url": "https://media.xroadstudio.com/...",
    "thumbnail_url": null,
    "error_message": null
  }
}
```

For branded images, call `GET /brand-kits` first and include the Brand Kit's `image_style`, `colors`, `audience`, and `offer` when drafting the image prompt. The image endpoint does not silently inject Brand Kit context.

---

### Create a post

```
POST /posts
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
| `social_account_ids` | string[] | yes | From GET /accounts |
| `scheduled_at` | ISO 8601 datetime | no | Omit to publish immediately. Must be 30s+ in future, max 3 months out. |
| `media_url` | string | no | Permanent public URL. Mutually exclusive with `asset_id`. |
| `asset_id` | UUID | no | ID of an asset from your Xroad library or generation history. Mutually exclusive with `media_url`. |
| `platform_configurations` | object | no | Per-platform options (TikTok privacy, YouTube title, etc.). See OpenAPI schema. |

Common `platform_configurations` examples:

```json
{
  "instagram": { "placement": "feed" },
  "tiktok": {
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "disable_duet": false,
    "disable_comment": false,
    "disable_stitch": false
  },
  "youtube": {
    "title": "Video title",
    "privacy_status": "public"
  }
}
```

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
GET /posts/{id}
```

```bash
curl https://xroadstudio.com/api/v1/posts/$POST_ID \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

**Post status lifecycle:** `scheduled` -> `processing` -> `published` (or `failed` / `cancelled`)

---

### List posts

```
GET /posts
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
PATCH /posts/{id}
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
DELETE /posts/{id}
```

Works on `scheduled` and `processing` posts. Published posts cannot be cancelled here - manage those on the platform directly.

```bash
curl -X DELETE https://xroadstudio.com/api/v1/posts/$POST_ID \
  -H "Authorization: Bearer $XROAD_API_KEY"
```

Response: `{ "data": { "id": "...", "status": "cancelled" } }`

---

## Common workflows

### Preflight checklist before creating a post

Always follow this order:

1. Confirm the API key is configured.
2. If the user asks for branded content, fetch the Brand Kit first.
3. List connected accounts with `GET /accounts`.
4. Match the user's requested destination to an account ID.
5. If media is included, upload or re-host it with `POST /media`.
6. Poll the media URL until it returns HTTP 200.
7. Create the post with `POST /posts`.
8. Report the post ID, status, destination account(s), and scheduled time.

If the requested account is not connected, do not create the post. Help the user connect the account first.

---

### Brand-aware posting workflow

Use this workflow whenever the user asks for branded, on-brand, brand-consistent, client-specific, or named-brand content.

1. Fetch the Brand Kit:

```bash
curl "https://xroadstudio.com/api/v1/brand-kits?name=URL_ENCODED_BRAND_NAME" \
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

If the Brand Kit lookup returns no matches, ask the user to create the Brand Kit in Xroad Studio or provide the brand guidance directly in the prompt. Do not invent brand voice, banned words, or offer details and present them as Brand Kit data.

---

### Safe media posting (ALWAYS use this when posting with media)

Never post immediately after upload - the CDN needs time to propagate. Images take ~5s, videos can take 10-15s. Always verify the URL returns 200 before creating the post.

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
    echo "Media never became available after ${MAX_ATTEMPTS}x5s - aborting" && exit 1
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
  [ $i -eq 15 ] && echo "Media not available - aborting" && exit 1
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
| `insufficient_credits` | 402 | Not enough credits to start image generation. |
| `quota_monthly` | 429 | Monthly post limit reached. |
| `quota_queue` | 429 | Too many posts queued waiting to publish. |
| `rate_limited` | 429 | Over 60 requests/minute. Check `retry_after` in response + `Retry-After` header. |
| `image_in_progress` | 409 | Wait for the current image to finish before starting another. |
| `provider_failed` | 500 | Image provider failed to start or complete. |
| `media_fetch_failed` | 422 | URL not reachable or over 20 MB. |
| `media_processing_failed` | 422 | Media uploaded successfully but could not be processed by the provider. Retry the request - it resolves automatically in most cases. |
| `asset_not_found` | 404 | `asset_id` not found in your library. |
| `not_found` | 404 | Post, image job, or brand kit not found or not owned by this key. |
| `model_unavailable` | 500 | Image generation model is temporarily unavailable. Retry shortly. |
| `db_error` | 500 | Unexpected database error. Retry shortly. |
| `not_updatable` | 409 | Post is past `scheduled` status - cannot edit. |
| `not_cancellable` | 409 | Post already published. |
| `duplicate` | 409 | Identical post submitted within 30 seconds. |
| `invalid_request` | 400 | Validation error - check `message` for details. |

---

## Limits

- Rate limit: 60 requests / 60 seconds per key
- Image generation: one active image at a time, 20 credits per image
- Monthly post quota depends on the user's Xroad Studio plan and is shared with the dashboard
- Media file upload: 250 MB max
- Media URL re-host: 20 MB max
- `scheduled_at`: minimum 30 seconds in future, maximum 3 months out
- 1 active API key per account (revoke existing key to rotate)

---

## OpenAPI schema

Full schema (Postman, Insomnia, GPT Actions): `https://xroadstudio.com/openapi.json`
