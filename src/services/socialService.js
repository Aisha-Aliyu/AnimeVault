import { supabase } from "../lib/supabase";

/* ── Likes ────────────────────────────────────────────────────────── */

export const getLikedSceneIds = async (userId) => {
  const { data, error } = await supabase
    .from("likes")
    .select("scene_id")
    .eq("user_id", userId);
  if (error) return [];
  return data.map((r) => r.scene_id);
};

export const likeScene = async (userId, sceneId) => {
  const { error } = await supabase
    .from("likes")
    .insert({ user_id: userId, scene_id: sceneId });
  return { error: error?.message || null };
};

export const unlikeScene = async (userId, sceneId) => {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", userId)
    .eq("scene_id", sceneId);
  return { error: error?.message || null };
};

/* ── Favourites ───────────────────────────────────────────────────── */

export const getFavouriteSceneIds = async (userId) => {
  const { data, error } = await supabase
    .from("favourites")
    .select("scene_id")
    .eq("user_id", userId);
  if (error) return [];
  return data.map((r) => r.scene_id);
};

export const favouriteScene = async (userId, sceneId) => {
  const { error } = await supabase
    .from("favourites")
    .insert({ user_id: userId, scene_id: sceneId });
  return { error: error?.message || null };
};

export const unfavouriteScene = async (userId, sceneId) => {
  const { error } = await supabase
    .from("favourites")
    .delete()
    .eq("user_id", userId)
    .eq("scene_id", sceneId);
  return { error: error?.message || null };
};

/* ── Collection (user's favourites + uploads) ─────────────────────── */

export const getFavouritedScenes = async (userId) => {
  const { data, error } = await supabase
    .from("favourites")
    .select(`
      created_at,
      scene:scene_id (
        id, title, image_url, like_count, comment_count,
        anime:anime_id ( title_english, title_romaji ),
        scene_tags ( tag:tag_id ( id, name, color, category ) )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { scenes: [], error: error.message };
  return { scenes: data.map((r) => r.scene).filter(Boolean), error: null };
};

export const getUserUploadedScenes = async (userId) => {
  const { data, error } = await supabase
    .from("scenes")
    .select(`
      id, title, image_url, like_count, comment_count, created_at,
      anime:anime_id ( title_english, title_romaji ),
      scene_tags ( tag:tag_id ( id, name, color, category ) )
    `)
    .eq("uploaded_by", userId)
    .order("created_at", { ascending: false });

  if (error) return { scenes: [], error: error.message };
  return { scenes: data || [], error: null };
};
