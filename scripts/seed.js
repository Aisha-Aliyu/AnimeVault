// scripts/seed.js
// Run with: npm run seed
// Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// ── Load .env manually ────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabaseUrl    = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

// Service role client — bypasses RLS entirely (server-side only!)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ANILIST_URL = "https://graphql.anilist.co";

// ── Default tags ──────────────────────────────────────────────────────
const DEFAULT_TAGS = [
  { name: "emotional",    category: "mood",    color: "#e11d8f" },
  { name: "hype",         category: "mood",    color: "#f97316" },
  { name: "wholesome",    category: "mood",    color: "#10b981" },
  { name: "dark",         category: "mood",    color: "#6366f1" },
  { name: "melancholic",  category: "mood",    color: "#8b5cf6" },
  { name: "funny",        category: "mood",    color: "#eab308" },
  { name: "tense",        category: "mood",    color: "#ef4444" },
  { name: "peaceful",     category: "mood",    color: "#06b6d4" },
  { name: "sakura",       category: "visual",  color: "#f9a8d4" },
  { name: "rain",         category: "visual",  color: "#60a5fa" },
  { name: "sunset",       category: "visual",  color: "#fb923c" },
  { name: "night sky",    category: "visual",  color: "#818cf8" },
  { name: "ocean",        category: "visual",  color: "#0ea5e9" },
  { name: "snow",         category: "visual",  color: "#e0f2fe" },
  { name: "forest",       category: "visual",  color: "#4ade80" },
  { name: "city lights",  category: "visual",  color: "#fbbf24" },
  { name: "fight scene",  category: "theme",   color: "#ef4444" },
  { name: "confession",   category: "theme",   color: "#f472b6" },
  { name: "sacrifice",    category: "theme",   color: "#a78bfa" },
  { name: "reunion",      category: "theme",   color: "#34d399" },
  { name: "flashback",    category: "theme",   color: "#94a3b8" },
  { name: "power-up",     category: "theme",   color: "#fbbf24" },
  { name: "farewell",     category: "theme",   color: "#818cf8" },
];

// ── Fetch top anime from AniList ──────────────────────────────────────
const fetchTopAnime = async () => {
  const query = `
    query {
      Page(page: 1, perPage: 50) {
        media(
          type: ANIME
          sort: POPULARITY_DESC
          isAdult: false
          status_in: [FINISHED, RELEASING]
        ) {
          id
          title { english romaji }
          coverImage { extraLarge large color }
          bannerImage
          genres
          averageScore
          popularity
          seasonYear
          season
          description(asHtml: false)
        }
      }
    }
  `;

  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`AniList responded with ${res.status}`);
  }

  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  return data.Page.media;
};

// ── Assign tags based on genres ───────────────────────────────────────
const assignTags = (anime, allTags) => {
  const genres = (anime.genres || []).map((g) => g.toLowerCase());
  const picked = new Set();

  if (genres.includes("action"))         picked.add("hype");
  if (genres.includes("drama"))          picked.add("emotional");
  if (genres.includes("comedy"))         picked.add("funny");
  if (genres.includes("romance"))        picked.add("confession");
  if (genres.includes("horror"))         picked.add("dark");
  if (genres.includes("psychological"))  picked.add("tense");
  if (genres.includes("slice of life"))  picked.add("peaceful");
  if (genres.includes("adventure"))      picked.add("hype");
  if (genres.includes("supernatural"))   picked.add("dark");
  if (genres.includes("fantasy"))        picked.add("night sky");
  if (genres.includes("sci-fi"))         picked.add("city lights");
  if (genres.includes("sports"))         picked.add("hype");
  if (genres.includes("music"))          picked.add("emotional");
  if (genres.includes("mecha"))          picked.add("fight scene");
  if (genres.includes("mystery"))        picked.add("tense");
  if (genres.includes("thriller"))       picked.add("tense");
  if (genres.includes("ecchi"))          picked.add("dark");
  if (genres.includes("school"))         picked.add("wholesome");
  if (genres.includes("military"))       picked.add("sacrifice");
  if (genres.includes("historical"))     picked.add("flashback");

  // Limit to 3 tags, pick only valid ones from DB
  return [...picked]
    .slice(0, 3)
    .map((name) => allTags.find((t) => t.name === name))
    .filter(Boolean);
};

// ── Generate scene title based on genre ──────────────────────────────
const generateTitle = (anime, isBanner = true) => {
  const genres = (anime.genres || []).map((g) => g.toLowerCase());

  const pools = {
    action:        ["The Decisive Clash", "Breaking the Limit", "Final Stand", "Into the Storm", "No Turning Back"],
    romance:       ["A Quiet Confession", "The Words Left Unsaid", "Sunset Promise", "Before the Rain", "Close Enough to Touch"],
    drama:         ["The Weight of Loss", "Last Goodbye", "Tears in the Rain", "Everything Falls Apart", "One Last Look"],
    comedy:        ["The Chaos Begins", "That Unexpected Moment", "Pure Panic", "Absolute Disaster", "Nobody Expected This"],
    "slice of life":["A Perfect Afternoon", "Golden Hour", "Peaceful Moments", "Just the Two of Us", "After School"],
    fantasy:       ["The Realm Beyond", "Ancient Power Awakens", "Stars Align", "Through the Portal", "The Prophecy Begins"],
    psychological: ["Shattered Reality", "Into the Abyss", "The Breaking Point", "Nothing Is Real", "Mind's Edge"],
    horror:        ["Something Wicked", "No Escape", "The Darkness Within", "Don't Look Back", "It Found Us"],
    "sci-fi":      ["Into the Void", "Signal Lost", "Zero Hour", "Transmission End", "Last Coordinates"],
    sports:        ["Match Point", "Everything on the Line", "The Final Play", "One Last Sprint", "Championship Moment"],
    music:         ["The Last Performance", "Notes in the Wind", "Soul Resonance", "The Stage Is Set", "Final Encore"],
    mecha:         ["Machine Uprising", "Iron Will", "Pilot's Resolve", "System Override", "Breach Protocol"],
    supernatural:  ["The Veil Lifts", "Between Worlds", "Spirit's Call", "Cursed Ground", "What Lies Beneath"],
    military:      ["Hold the Line", "Brothers in Arms", "Command Issued", "Last Order", "Sector Seven"],
    mystery:       ["The Clue Revealed", "Nothing Adds Up", "Suspect Zero", "Follow the Thread", "Hidden in Plain Sight"],
    historical:    ["An Era Ends", "Echoes of the Past", "The Chronicle Begins", "Before the Fall", "Lost to History"],
  };

  // Key visual titles for cover images
  const keyVisualTitles = [
    "Key Visual",
    "Official Art",
    "Character Spotlight",
    "Promotional Artwork",
    "Season Visual",
  ];

  if (!isBanner) {
    const animeName = anime.title?.english || anime.title?.romaji || "Unknown";
    return `${animeName} — ${keyVisualTitles[Math.floor(Math.random() * keyVisualTitles.length)]}`;
  }

  // Find the first matching genre pool
  for (const genre of genres) {
    if (pools[genre]) {
      const pool = pools[genre];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  // Fallback titles
  const fallback = ["A Fleeting Moment", "Beyond Words", "The Turning Point", "Unforgettable", "That Scene"];
  return fallback[Math.floor(Math.random() * fallback.length)];
};

// ── Generate description ──────────────────────────────────────────────
const generateDescription = (anime, isBanner = true) => {
  const title = anime.title?.english || anime.title?.romaji || "this series";
  const genres = (anime.genres || []).slice(0, 2).join(" and ").toLowerCase();
  const year = anime.seasonYear ? ` (${anime.seasonYear})` : "";

  if (!isBanner) {
    return `Official promotional artwork for ${title}${year}. A ${genres} series.`;
  }

  const descriptions = [
    `An iconic moment from ${title}${year}, a ${genres} series that defined its era.`,
    `One of the most memorable scenes in ${title}${year}. ${genres.charAt(0).toUpperCase() + genres.slice(1)} at its finest.`,
    `${title}${year} — captured at the moment everything changed. A landmark in ${genres} anime.`,
    `From ${title}${year}: the scene fans still talk about. Pure ${genres} storytelling.`,
  ];

  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

// ── Main seed function ────────────────────────────────────────────────
const seed = async () => {
  console.log("🌱 Starting AnimeVault seed...\n");

  // 1. Seed tags
  console.log("📌 Seeding tags...");
  const { error: tagError } = await supabase
    .from("tags")
    .upsert(DEFAULT_TAGS, { onConflict: "name", ignoreDuplicates: true });

  if (tagError) {
    console.error("   ✗ Tag error:", tagError.message);
  } else {
    console.log(`   ✓ ${DEFAULT_TAGS.length} tags seeded`);
  }
  console.log();

  // 2. Fetch tags back with real IDs
  const { data: allTags, error: tagsReadError } = await supabase
    .from("tags")
    .select("*");

  if (tagsReadError || !allTags?.length) {
    console.error("   ✗ Could not read tags:", tagsReadError?.message);
    process.exit(1);
  }
  console.log(`   ✓ Loaded ${allTags.length} tags from DB\n`);

  // 3. Fetch anime from AniList
  console.log("🔍 Fetching anime from AniList...");
  let animeList = [];
  try {
    animeList = await fetchTopAnime();
    console.log(`   ✓ Got ${animeList.length} anime\n`);
  } catch (err) {
    console.error("   ✗ AniList fetch failed:", err.message);
    process.exit(1);
  }

  // 4. Filter to anime with at least one usable image
  const usable = animeList.filter(
    (a) => a.bannerImage || a.coverImage?.extraLarge || a.coverImage?.large
  );
  console.log(`   ✓ ${usable.length} anime have usable images\n`);

  // 5. Upsert anime metadata into our cache table
  console.log("📺 Upserting anime metadata...");
  const animeRows = usable.map((a) => ({
    id:            a.id,
    title_english: a.title?.english   || null,
    title_romaji:  a.title?.romaji    || "Unknown",
    cover_image:   a.coverImage?.extraLarge || a.coverImage?.large || null,
    banner_image:  a.bannerImage      || null,
    genres:        a.genres           || [],
    average_score: a.averageScore     || null,
    popularity:    a.popularity       || null,
    year:          a.seasonYear       || null,
    season:        a.season           || null,
  }));

  const { error: animeError } = await supabase
    .from("anime")
    .upsert(animeRows, { onConflict: "id" });

  if (animeError) {
    console.error("   ✗ Anime upsert error:", animeError.message);
  } else {
    console.log(`   ✓ ${animeRows.length} anime upserted`);
  }
  console.log();

  // 6. Check which anime already have scenes (avoid duplicates on re-run)
  const { data: existing } = await supabase
    .from("scenes")
    .select("anime_id");

  const existingAnimeIds = new Set((existing || []).map((s) => s.anime_id));
  const toSeed = usable.filter((a) => !existingAnimeIds.has(a.id));
  console.log(`🎬 Creating scenes for ${toSeed.length} anime (${usable.length - toSeed.length} already seeded)...\n`);

  let created  = 0;
  let skipped  = 0;
  let failed   = 0;

  for (const anime of toSeed) {
    const animeName = anime.title?.english || anime.title?.romaji || `Anime #${anime.id}`;
    const scenesToInsert = [];

    // Scene 1 — Banner image (cinematic widescreen)
    if (anime.bannerImage) {
      scenesToInsert.push({
        image_url:   anime.bannerImage,
        title:       generateTitle(anime, true),
        description: generateDescription(anime, true),
        is_banner:   true,
      });
    }

    // Scene 2 — Cover image (portrait art)
    const coverImg = anime.coverImage?.extraLarge || anime.coverImage?.large;
    if (coverImg) {
      scenesToInsert.push({
        image_url:   coverImg,
        title:       generateTitle(anime, false),
        description: generateDescription(anime, false),
        is_banner:   false,
      });
    }

    if (scenesToInsert.length === 0) {
      skipped++;
      continue;
    }

    for (const sceneData of scenesToInsert) {
      // Insert scene (service role bypasses RLS)
      const { data: sceneRow, error: sceneError } = await supabase
        .from("scenes")
        .insert({
          title:       sceneData.title,
          description: sceneData.description,
          image_url:   sceneData.image_url,
          anime_id:    anime.id,
          uploaded_by: null,      // null = system seeded
          source:      "api",
          is_approved: true,
          is_reported: false,
          like_count:  Math.floor(Math.random() * 150),   // seed realistic engagement
          comment_count: 0,
        })
        .select("id")
        .single();

      if (sceneError) {
        console.error(`   ✗ Failed [${animeName}]: ${sceneError.message}`);
        failed++;
        continue;
      }

      // Attach tags
      const tags = assignTags(anime, allTags);
      if (tags.length > 0) {
        const { error: tagLinkError } = await supabase
          .from("scene_tags")
          .insert(tags.map((tag) => ({ scene_id: sceneRow.id, tag_id: tag.id })));

        if (tagLinkError) {
          console.warn(`   ⚠ Tag link failed for scene ${sceneRow.id}: ${tagLinkError.message}`);
        }
      }

      console.log(`   ✓ "${sceneData.title}" [${animeName}]`);
      created++;
    }
  }

  console.log("\n" + "─".repeat(52));
  console.log(`✨ Seed complete!`);
  console.log(`   ✓ Created : ${created} scenes`);
  console.log(`   ⏭ Skipped : ${skipped} (no usable images)`);
  if (failed > 0) {
    console.log(`   ✗ Failed  : ${failed} scenes`);
  }
  console.log("─".repeat(52));
  console.log("\n🚀 Run 'npm run dev' → http://localhost:5173\n");
};

seed().catch((err) => {
  console.error("\n💥 Seed crashed:", err.message);
  process.exit(1);
});
