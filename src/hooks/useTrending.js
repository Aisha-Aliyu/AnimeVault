import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * Trending score = (likes × 3 + comments) × recency_decay
 *
 * Recency decay: scenes posted < 24h ago get 2×,
 *               < 7 days get 1.5×, older get 1×
 */
const trendingScore = (scene) => {
  const engagement = (scene.like_count || 0) * 3 + (scene.comment_count || 0);
  const ageMs      = Date.now() - new Date(scene.created_at).getTime();
  const ageHours   = ageMs / (1000 * 60 * 60);

  let decay = 1;
  if (ageHours < 24)        decay = 2.0;
  else if (ageHours < 168)  decay = 1.5;  // 7 days

  return engagement * decay + (scene.like_count || 0); // base likes floor
};

export const useTrending = (limit = 12) => {
  const [trending, setTrending] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Fetch most liked scenes from last 30 days
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("scenes")
        .select(`
          id, title, image_url, like_count, comment_count, created_at,
          anime:anime_id ( id, title_english, title_romaji, cover_image, genres ),
          scene_tags ( tag:tag_id ( id, name, color, category ) )
        `)
        .eq("is_approved", true)
        .eq("is_reported", false)
        .gte("created_at", since)
        .order("like_count", { ascending: false })
        .limit(60);

      if (error || !data) { setLoading(false); return; }

      // Sort client-side with full trending formula
      const sorted = [...data]
        .sort((a, b) => trendingScore(b) - trendingScore(a))
        .slice(0, limit);

      setTrending(sorted);
      setLoading(false);
    };

    fetch();
  }, [limit]);

  return { trending, loading };
};
