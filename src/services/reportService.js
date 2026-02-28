import { supabase } from "../lib/supabase";

const REASONS = [
  "Spoiler without warning",
  "Wrong anime",
  "Inappropriate content",
  "Low quality / broken image",
  "Other",
];

export { REASONS };

export const reportScene = async (sceneId, userId, reason) => {
  const { error } = await supabase
    .from("reports")
    .insert({ scene_id: sceneId, user_id: userId, reason });

  if (error) {
    // Unique violation = already reported
    if (error.code === "23505") return { error: "already_reported" };
    return { error: error.message };
  }
  return { error: null };
};

export const hasUserReported = async (sceneId, userId) => {
  if (!userId) return false;
  const { data } = await supabase
    .from("reports")
    .select("id")
    .eq("scene_id", sceneId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
};
