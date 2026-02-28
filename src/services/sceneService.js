import { supabase } from "../lib/supabase";
import { mapAnimeToDb } from "./anilistService";

const SCENE_SELECT = `
  id, title, description, image_url, episode, timestamp_seconds,
  source, like_count, comment_count, created_at,
  anime:anime_id ( id, title_english, title_romaji, cover_image, genres ),
  uploader:uploaded_by ( id, username, avatar_url ),
  scene_tags ( tag:tag_id ( id, name, category, color ) )
`;

/**
 * Fetch paginated scenes with optional filters
 */
export const fetchScenes = async ({
  page = 0,
  limit = 24,
  animeId = null,
  tagIds = [],
  search = "",
  sort = "newest",
} = {}) => {
  let q = supabase
    .from("scenes")
    .select(SCENE_SELECT)
    .eq("is_approved", true)
    .range(page * limit, page * limit + limit - 1);

  if (animeId) q = q.eq("anime_id", animeId);

  if (search.trim()) {
    q = q.textSearch("title", search.trim(), { type: "websearch" });
  }

  if (sort === "newest")   q = q.order("created_at", { ascending: false });
  if (sort === "popular")  q = q.order("like_count",  { ascending: false });
  if (sort === "oldest")   q = q.order("created_at",  { ascending: true  });

  const { data, error } = await q;
  if (error) return { scenes: [], error: error.message };

  let scenes = data || [];

  // Client-side tag filter (Supabase many-to-many filtering via join is verbose)
  if (tagIds.length > 0) {
    scenes = scenes.filter((s) =>
      tagIds.every((tid) => s.scene_tags.some((st) => st.tag?.id === tid))
    );
  }

  return { scenes, error: null };
};

/**
 * Fetch a single scene by ID
 */
export const fetchSceneById = async (id) => {
  const { data, error } = await supabase
    .from("scenes")
    .select(SCENE_SELECT)
    .eq("id", id)
    .single();

  if (error) return { scene: null, error: error.message };
  return { scene: data, error: null };
};

/**
 * Upsert anime metadata into our cache table
 */
export const upsertAnime = async (animeData) => {
  const mapped = mapAnimeToDb(animeData);
  const { error } = await supabase
    .from("anime")
    .upsert(mapped, { onConflict: "id" });
  return { error: error?.message || null };
};

/**
 * Upload scene image to Supabase Storage
 */
export const uploadSceneImage = async (file, userId) => {
  const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED.includes(file.type))
    return { url: null, error: "Only JPEG, PNG, WebP, GIF allowed." };
  if (file.size > 10 * 1024 * 1024)
    return { url: null, error: "Image must be under 10MB." };

  const ext  = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("scene-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from("scene-images").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
};

/**
 * Create a scene record
 */
export const createScene = async ({ title, description, imageUrl, animeId, episode, timestampSeconds, userId }) => {
  const clean = {
    title:              title.slice(0, 200),
    description:        (description || "").slice(0, 1000),
    image_url:          imageUrl,
    anime_id:           animeId || null,
    episode:            episode   || null,
    timestamp_seconds:  timestampSeconds || null,
    uploaded_by:        userId,
    source:             "upload",
  };

  const { data, error } = await supabase.from("scenes").insert(clean).select().single();
  if (error) return { scene: null, error: error.message };
  return { scene: data, error: null };
};

/**
 * Fetch all tags
 */
export const fetchTags = async () => {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name");
  return { tags: data || [], error: error?.message || null };
};

/**
 * Seed default tags if none exist
 */
export const seedTags = async () => {
  const DEFAULT_TAGS = [
    // Mood
    { name: "emotional",   category: "mood",    color: "#e11d8f" },
    { name: "hype",        category: "mood",    color: "#f97316" },
    { name: "wholesome",   category: "mood",    color: "#10b981" },
    { name: "dark",        category: "mood",    color: "#6366f1" },
    { name: "melancholic", category: "mood",    color: "#8b5cf6" },
    { name: "funny",       category: "mood",    color: "#eab308" },
    { name: "tense",       category: "mood",    color: "#ef4444" },
    { name: "peaceful",    category: "mood",    color: "#06b6d4" },
    // Visual
    { name: "sakura",      category: "visual",  color: "#f9a8d4" },
    { name: "rain",        category: "visual",  color: "#60a5fa" },
    { name: "sunset",      category: "visual",  color: "#fb923c" },
    { name: "night sky",   category: "visual",  color: "#818cf8" },
    { name: "ocean",       category: "visual",  color: "#0ea5e9" },
    { name: "snow",        category: "visual",  color: "#e0f2fe" },
    { name: "forest",      category: "visual",  color: "#4ade80" },
    { name: "city lights", category: "visual",  color: "#fbbf24" },
    // Theme
    { name: "fight scene", category: "theme",   color: "#ef4444" },
    { name: "confession",  category: "theme",   color: "#f472b6" },
    { name: "sacrifice",   category: "theme",   color: "#a78bfa" },
    { name: "reunion",     category: "theme",   color: "#34d399" },
    { name: "flashback",   category: "theme",   color: "#94a3b8" },
    { name: "power-up",    category: "theme",   color: "#fbbf24" },
    { name: "farewell",    category: "theme",   color: "#818cf8" },
  ];

  const { error } = await supabase
    .from("tags")
    .upsert(DEFAULT_TAGS, { onConflict: "name", ignoreDuplicates: true });
  return { error: error?.message || null };
};
