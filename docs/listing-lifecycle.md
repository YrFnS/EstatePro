# Property Listing Lifecycle and Media

EstatePro uses a moderated listing workflow. Creating a property no longer makes it public immediately unless an administrator creates and publishes it from the protected admin interface.

## Status lifecycle

| Status | Meaning | Owner actions | Administrator actions |
|---|---|---|---|
| `draft` | Private work in progress | Edit, add media, submit, duplicate, archive, delete | Publish, move to review, archive |
| `pending_review` | Submitted to moderation | Preview, withdraw, duplicate | Approve, schedule, request changes, reject, archive |
| `changes_requested` | Review feedback requires an update | Edit, resubmit, duplicate, archive, delete | Publish, reject, return to review, archive |
| `scheduled` | Approved for future publication | Preview, duplicate | Publish now, return to review, archive |
| `published` | Publicly searchable | Preview, duplicate, archive | Return to review or archive |
| `rejected` | Not approved, with review notes | Edit, resubmit, duplicate, archive, delete | Publish, reopen, archive |
| `archived` | Hidden and inactive | Restore as draft, duplicate | Restore as draft or publish |

Public property APIs automatically require `listingStatus = published`. Owners, assigned agents, and administrators may preview an unpublished property through the property detail endpoint.

## Submission requirements

A listing must contain:

- English and Arabic titles
- English and Arabic descriptions of at least 30 characters
- a positive price and area
- a sale or rent status
- non-negative bedroom and bathroom counts
- English and Arabic location, address, and city values
- at least one image

The editor reports missing fields before submission and displays a completion percentage throughout the workflow.

## Owner workspace

Routes:

```text
/list-property
/my-listings
/my-listings/<property-id>/edit
```

`/list-property` creates a private draft. After the first save, the user can upload or link media. `/my-listings` shows status counts, review feedback, scheduled publication, media totals, inquiries, and favorites.

All account listing API ownership is derived from the active NextAuth session. The browser never sends a user ID to select ownership.

## Administrator moderation

Route:

```text
/admin/moderation
```

The moderation workspace uses the signed administrator cookie established by the protected admin login. It shows:

- listing and owner details
- completion status
- ordered property media and cover image
- inquiry and favorite counts
- review feedback
- immutable audit history

Available moderation actions are approval, changes requested, rejection, scheduled publication, reopening, and archival. Changes requested and rejection require review notes. Owners receive a persistent in-app notification after each decision.

## Normalized property media

`PropertyMedia` is the source of truth for media order and cover selection. The legacy `Property.images` comma-separated value remains synchronized to avoid breaking older cards and pages while components migrate to the relation.

Supported media categories:

- `image`
- `video`
- `floorplan`
- `document`

A property may contain up to 40 media records. The editor supports drag-and-drop, keyboard-friendly up/down controls, cover selection, deletion, and previews.

## Direct uploads

Direct uploads use S3-compatible presigned PUT URLs. No storage SDK is needed in the application bundle. Configure:

```env
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET="estatepro-media"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_PUBLIC_BASE_URL="https://media.example.com"
S3_FORCE_PATH_STYLE="true"
```

Supported upload formats and limits:

| MIME type | Category | Maximum size |
|---|---|---:|
| `image/jpeg` | image | 15 MB |
| `image/png` | image | 15 MB |
| `image/webp` | image | 15 MB |
| `image/avif` | image | 15 MB |
| `video/mp4` | video | 100 MB |
| `application/pdf` | floor plan | 20 MB |

The upload sequence is:

1. The authenticated owner requests a presigned upload target.
2. The browser uploads directly to object storage.
3. The browser confirms the uploaded object with EstatePro.
4. EstatePro validates ownership of the storage key and persists metadata.

External HTTP/HTTPS media URLs remain available when storage is not configured.

### Storage CORS

The bucket must allow the EstatePro origin to send `PUT` requests and read the response. A typical policy allows:

```json
[
  {
    "AllowedOrigins": ["https://estatepro.example.com"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "DELETE"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Keep bucket credentials server-side. Never expose `S3_SECRET_ACCESS_KEY` to the browser.

## Scheduled publication

Approved listings may be scheduled up to one year ahead. Due listings are claimed with a conditional update so concurrent workers cannot publish the same record twice.

Run directly:

```bash
LISTING_PUBLISH_LIMIT=250 bun run listings:publish
```

Call the protected HTTP endpoint:

```http
GET /api/cron/publish-listings?limit=250
Authorization: Bearer <CRON_SECRET>
```

Or configure the included GitHub Actions workflow. It runs every 15 minutes when the repository `DATABASE_URL` Actions secret is available.

## Audit trail

Every important event creates a `PropertyAuditLog` record, including:

- legacy import
- draft creation
- edits
- submission and withdrawal
- media additions, uploads, deletion, and reordering
- review decisions
- scheduled and automatic publication
- archival, restoration, and duplication

Audit records are deleted only when the property itself is permanently deleted.

## Database deployment

Apply all stacked migrations before deploying the application code:

```bash
bun install
bun run db:generate
bun run db:deploy
```

The lifecycle migration:

- preserves existing properties as published
- backfills publication timestamps
- links legacy agent properties to matching user accounts by email
- converts legacy image strings into ordered media rows
- creates initial audit events

Back up the production database before applying migrations and verify the migration against a staging copy first.

## Operational smoke test

After deployment, verify:

1. A signed-in user can create and resume a draft.
2. Media can be linked or uploaded, reordered, and assigned as cover.
3. An incomplete listing cannot be submitted.
4. A complete listing appears in `/admin/moderation`.
5. Changes requested are visible to the owner.
6. An approved listing becomes public and searchable.
7. A scheduled listing becomes public after the worker runs.
8. Archiving removes the listing from public search.
9. Unauthenticated users cannot fetch unpublished listing details.
10. Audit records show the complete workflow history.
