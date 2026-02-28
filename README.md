# AnimeVault

**A community gallery for anime scenes built in 2 days.**

🔗 **[animevault-kappa.vercel.app](https://animevault-kappa.vercel.app)**

-----

I built this because I kept losing anime screenshots in my camera roll. I wanted something searchable where you could find that one scene from an episode you half-remember, or just browse by vibe when you’re feeling a certain type of way. Existing options were either Reddit threads that die in a week or massive databases with no soul. This is my attempt at something in between.

-----

## What it does

You can browse thousands of anime scenes, filter by mood (emotional, hype, peaceful, dark), genre, or specific show. Search pulls live data from AniList’s GraphQL API so you always get accurate anime metadata with cover art. Upload your own screenshots with a 4-step wizard: pick an image, tag the anime, add details, choose mood tags. Scenes you love go into your personal collection. You can like, save, and comment on anything, with threaded replies.

There’s a trending section at the top that scores scenes by engagement + recency, not just raw likes so fresh content actually has a chance to surface.

-----

## Tech

|              |                                            |
|--------------|--------------------------------------------|
|**Frontend**  |React 18, Vite, CSS Modules, Framer Motion  |
|**Backend**   |Supabase (Postgres + Auth + Storage)        |
|**API**       |AniList GraphQL                             |
|**Deployment**|Vercel with security headers at the edge    |
|**PWA**       |Custom service worker, offline image caching|

-----

## Things I’m proud of

**The filter system.** Everything — search, genre, mood tags, active filter chips — runs through a single `useFilters` hook. One source of truth. No prop drilling, no sync bugs. Adding a new filter type takes about 5 lines.

**Optimistic likes.** Clicking the like button updates the count instantly and fires the DB call in the background. If it fails it rolls back. Feels snappy on slow connections.

**The trending algorithm.** Simple but effective: `(likes × 3 + comments) × recency decay`. Scenes from the last 24h get a 2× multiplier, last 7 days get 1.5×. Computed client-side from the top 60 by raw likes so no scheduled jobs needed.

**RLS everywhere.** Every single Supabase table has Row Level Security enabled with explicit policies. The anon key is safe to ship in the browser because the DB enforces ownership at the row level, not the application layer.

**Abuse prevention.** Reporting is one click. A unique constraint stops spam reports, and a Postgres trigger auto-flags scenes after 3 reports. Flagged scenes disappear from the public gallery without any manual moderation step.

-----

## Project structure

```
src/
├── components/
│   ├── Auth/           email + magic link modal
│   ├── Collection/     slide-in panel, favourites + uploads tabs
│   ├── Comments/       threaded comments with collapsible replies
│   ├── Featured/       trending banner, horizontal scroll
│   ├── Filters/        search, genre strip, tag browser, active chips
│   ├── Gallery/        infinite scroll grid
│   ├── Hero/
│   ├── Navbar/
│   ├── Report/         reason picker, duplicate prevention
│   ├── SceneCard/
│   ├── SceneModal/     full detail view, keyboard nav
│   └── Upload/         4-step wizard, drag & drop
├── hooks/
│   ├── useFilters.js         all filter state in one place
│   ├── useSocial.js          likes + favourites, optimistic updates
│   ├── useTrending.js        scoring + recency decay
│   └── useInfiniteScroll.js  IntersectionObserver sentinel
└── services/
    ├── anilistService.js     GraphQL queries
    ├── authService.js
    ├── commentService.js     CRUD + tree builder
    ├── reportService.js
    ├── sceneService.js       scenes, tags, storage upload
    └── socialService.js      likes + favourites
```

-----

## Running locally

```bash
git clone https://github.com/Aisha-Aliyu/animevault.git
cd animevault
npm install
```

Create `.env`:

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Set up the Supabase schema (tables, RLS policies, triggers), then populate with real content:

```bash
npm run seed   # pulls top 50 anime from AniList, creates ~80 scenes
npm run dev
```

-----

## Security

- No `dangerouslySetInnerHTML` anywhere — React’s JSX escaping handles all user content
- File uploads are MIME-whitelisted, capped at 10MB, and saved to user-scoped storage paths
- HTTP security headers (CSP, HSTS, X-Frame-Options, nosniff) applied at Vercel’s edge — not in the app
- Supabase Auth manages sessions and token rotation
- Reports have a unique constraint per user per scene to prevent abuse

-----

## What I’d do next

Video clip support is the obvious one — HLS for short scene clips would make this genuinely useful. Dynamic OG images per scene using Vercel’s `@vercel/og` so sharing a specific scene gives a proper preview card. And swap the `unsafe-inline` in CSP for nonces — that’s the one security gap I’d want to close.

-----

MIT License