# KidTube Vercel Proxy

This folder is the backend proxy for the GitHub Pages frontend.

## Environment variable

Set this in Vercel project settings:

`YOUTUBE_API_KEY`

## Endpoint

The frontend calls:

`/api/youtube?action=...`

Supported actions:

- `channelVideos`
- `resolveChannel`
- `videoById`
- `searchChannels`
- `searchVideos`
