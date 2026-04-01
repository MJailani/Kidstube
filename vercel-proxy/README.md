# KidTube Vercel Proxy

This folder is the backend proxy for the GitHub Pages frontend.

## Environment variables

Set these in Vercel project settings:

`YOUTUBE_API_KEY`
`SUPABASE_URL`
`SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is backend-only. Do not expose it to the frontend.

## Endpoint

The frontend calls:

`/api/youtube?action=...`
`/api/feed?profileId=...`

Supported actions:

- `channelVideos`
- `resolveChannel`
- `videoById`
- `searchChannels`
- `searchVideos`
