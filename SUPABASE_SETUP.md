# KidTube Supabase Setup

This is the backend direction for moving parental controls out of browser `localStorage` and into Supabase.

## What changes with Supabase

Each parent gets a real account through Supabase Auth. All family data is attached to that parent account.

- One Supabase auth user = one parent account
- One parent can have multiple child profiles
- Each child profile gets its own:
  - filters
  - blocked keywords
  - allowed channels
  - approved videos
  - pinned videos
  - unlock requests
  - watch history

The database schema and row-level-security policies live in:

- [supabase/schema.sql](C:/Users/Mohamed%20Jailani/Claude%20Projects/Kidstube/supabase/schema.sql)

## How different parents stay separate

Supabase Auth gives every parent a unique user id.

That id becomes the `parent_id` owner for all child profiles and all parental-control data. The row-level-security rules only allow a logged-in parent to read or change rows they own.

## Recommended migration order

1. Create Supabase project
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Add frontend env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Keep the current localStorage app running while we migrate screen by screen
5. Move parent auth first
6. Move child profiles, filters, and channel whitelist next
7. Move approvals, requests, pinned videos, and history after that
8. Finally make the kid feed load from backend-owned profile state

## Frontend scaffolding already added

These files are ready for the migration:

- [kidtube-project/src/lib/supabase.js](C:/Users/Mohamed%20Jailani/Claude%20Projects/Kidstube/kidtube-project/src/lib/supabase.js)
- [kidtube-project/src/lib/supabaseProfileApi.js](C:/Users/Mohamed%20Jailani/Claude%20Projects/Kidstube/kidtube-project/src/lib/supabaseProfileApi.js)

They do not replace the current app state yet. They are the first connection layer so we can migrate without breaking the working app.

## Tables in the schema

- `parent_accounts`
- `child_profiles`
- `profile_filters`
- `profile_keywords`
- `channels`
- `profile_channels`
- `approved_videos`
- `pinned_videos`
- `unlock_requests`
- `watch_history`

## Notes

- Built-in channels can stay shared and readable by everyone.
- Custom channels are owned by the parent that created them.
- The current YouTube Vercel proxy can keep running as-is for now.
- The next coding step after setup is parent sign-in/sign-up using Supabase Auth.
