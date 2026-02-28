import { supabase } from "../lib/supabase";

const COMMENT_SELECT = `
  id, body, created_at, parent_id,
  author:user_id ( id, username, avatar_url )
`;

/**
 * Fetch all comments for a scene (flat list, client sorts into tree)
 */
export const fetchComments = async (sceneId) => {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("scene_id", sceneId)
    .order("created_at", { ascending: true });

  if (error) return { comments: [], error: error.message };
  return { comments: data || [], error: null };
};

/**
 * Post a new comment or reply
 */
export const postComment = async ({ sceneId, userId, body, parentId = null }) => {
  const clean = body.trim().slice(0, 1000);
  if (!clean) return { comment: null, error: "Comment cannot be empty." };

  const { data, error } = await supabase
    .from("comments")
    .insert({ scene_id: sceneId, user_id: userId, body: clean, parent_id: parentId })
    .select(COMMENT_SELECT)
    .single();

  if (error) return { comment: null, error: error.message };
  return { comment: data, error: null };
};

/**
 * Delete a comment (own only — RLS enforces)
 */
export const deleteComment = async (commentId) => {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);
  return { error: error?.message || null };
};

/**
 * Flatten comment list into a tree: { ...comment, replies: [...] }
 * Only 2 levels deep (comment → replies)
 */
export const buildCommentTree = (flat) => {
  const roots = [];
  const map   = {};

  flat.forEach((c) => { map[c.id] = { ...c, replies: [] }; });

  flat.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
};
