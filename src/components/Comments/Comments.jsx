import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchComments, postComment, deleteComment, buildCommentTree,
} from "../../services/commentService";
import styles from "./Comments.module.css";
import clsx from "clsx";

/* ── Single comment ──────────────────────────────────────────────── */
const Comment = ({ comment, depth = 0, userId, onReply, onDelete }) => {
  const [showReplies, setShowReplies] = useState(true);
  const [replying,    setReplying]    = useState(false);
  const [replyText,   setReplyText]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  const isOwn    = userId && comment.author?.id === userId;
  const hasReplies = comment.replies?.length > 0;
  const initials = (comment.author?.username || "?")[0].toUpperCase();

  const timeAgo = (iso) => {
    const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (secs < 60)   return "just now";
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    await onReply(replyText.trim(), comment.id);
    setReplyText("");
    setReplying(false);
    setSubmitting(false);
    setShowReplies(true);
  };

  return (
    <motion.div
      className={clsx(styles.comment, { [styles.commentReply]: depth > 0 })}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Thread line for replies */}
      {depth > 0 && <div className={styles.threadLine} />}

      <div className={styles.commentInner}>
        {/* Avatar */}
        <div className={styles.avatar} style={{ "--depth": depth }}>
          {initials}
        </div>

        <div className={styles.commentBody}>
          {/* Header */}
          <div className={styles.commentHeader}>
            <span className={styles.username}>{comment.author?.username || "Anonymous"}</span>
            <span className={styles.time}>{timeAgo(comment.created_at)}</span>
          </div>

          {/* Body */}
          <p className={styles.commentText}>{comment.body}</p>

          {/* Actions */}
          <div className={styles.commentActions}>
            {userId && depth === 0 && (
              <button
                className={styles.actionBtn}
                onClick={() => setReplying((r) => !r)}
              >
                {replying ? "Cancel" : "Reply"}
              </button>
            )}
            {isOwn && (
              <button
                className={clsx(styles.actionBtn, styles.deleteBtn)}
                onClick={() => onDelete(comment.id)}
              >
                Delete
              </button>
            )}
            {hasReplies && (
              <button
                className={styles.actionBtn}
                onClick={() => setShowReplies((v) => !v)}
              >
                {showReplies
                  ? `Hide ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`
                  : `Show ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
              </button>
            )}
          </div>

          {/* Reply form */}
          <AnimatePresence>
            {replying && (
              <motion.form
                className={styles.replyForm}
                onSubmit={handleReplySubmit}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <textarea
                  className={styles.replyInput}
                  placeholder={`Reply to ${comment.author?.username || "this comment"}…`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  autoFocus
                />
                <div className={styles.replyFooter}>
                  <span className={styles.charCount}>{replyText.length}/1000</span>
                  <button
                    type="submit"
                    className={styles.replySubmit}
                    disabled={!replyText.trim() || submitting}
                  >
                    {submitting ? "…" : "Reply"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nested replies */}
      <AnimatePresence>
        {showReplies && hasReplies && (
          <motion.div
            className={styles.replies}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                userId={userId}
                onReply={onReply}
                onDelete={onDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Comments container ──────────────────────────────────────────── */
const Comments = ({ sceneId, user }) => {
  const [tree,       setTree]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const totalCount = tree.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  const load = useCallback(async () => {
    setLoading(true);
    const { comments, error: err } = await fetchComments(sceneId);
    setLoading(false);
    if (err) { setError(err); return; }
    setTree(buildCommentTree(comments));
  }, [sceneId]);

  useEffect(() => { load(); }, [load]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    setError("");
    const { comment, error: err } = await postComment({
      sceneId,
      userId: user.id,
      body: newComment.trim(),
    });
    setSubmitting(false);
    if (err) { setError(err); return; }
    setNewComment("");
    // Reload to get accurate tree
    await load();
  };

  const handleReply = useCallback(async (body, parentId) => {
    if (!user) return;
    await postComment({ sceneId, userId: user.id, body, parentId });
    await load();
  }, [sceneId, user, load]);

  const handleDelete = useCallback(async (commentId) => {
    await deleteComment(commentId);
    await load();
  }, [load]);

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          💬 {totalCount > 0 ? `${totalCount} Comment${totalCount === 1 ? "" : "s"}` : "Comments"}
        </span>
      </div>

      {/* Compose */}
      {user ? (
        <form className={styles.compose} onSubmit={handlePost}>
          <div className={styles.composeAvatar}>
            {(user.user_metadata?.username || user.email || "?")[0].toUpperCase()}
          </div>
          <div className={styles.composeField}>
            <textarea
              className={styles.composeInput}
              placeholder="Add a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={1000}
              rows={2}
            />
            <div className={styles.composeFooter}>
              <span className={styles.charCount}>{newComment.length}/1000</span>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className={styles.signInPrompt}>
          Sign in to leave a comment
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.error}>⚠ {error}</div>}

      {/* Comment list */}
      {loading ? (
        <div className={styles.loadingComments}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.commentSkeleton} style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>✧</span>
          <span>No comments yet. Be the first.</span>
        </div>
      ) : (
        <div className={styles.list}>
          {tree.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              depth={0}
              userId={user?.id}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comments;
