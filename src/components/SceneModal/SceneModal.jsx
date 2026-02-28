import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./SceneModal.module.css";
import clsx from "clsx";
import Comments from "../Comments/Comments";
import ReportModal from "../Report/ReportModal";

const SceneModal = ({
  scene, isOpen, onClose, onPrev, onNext, hasPrev, hasNext,
  user, isLiked, isFavourite, onLike, onFavourite,
}) => {
  const [localLikeCount, setLocalLikeCount] = useState(scene?.like_count || 0);
  const [reportOpen,     setReportOpen]     = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    setLocalLikeCount(scene?.like_count || 0);
  }, [scene?.id, scene?.like_count]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape")                onClose();
      if (e.key === "ArrowLeft"  && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else        document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!scene) return null;

  const anime      = scene.anime;
  const tags       = scene.scene_tags?.map((st) => st.tag).filter(Boolean) || [];
  const animeTitle = anime?.title_english || anime?.title_romaji || "Unknown";
  const genres     = anime?.genres || [];

  const formatTimestamp = (secs) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: scene.title, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.96,    y: 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >

            {/* Left — image */}
            <div className={styles.imageSection}>
              <img
                className={styles.image}
                src={scene.image_url}
                alt={scene.title}
              />
              <div className={styles.imageBorderShimmer} />
              {hasPrev && (
                <button
                  className={clsx(styles.navBtn, styles.navPrev)}
                  onClick={onPrev}
                  aria-label="Previous scene"
                >
                  ‹
                </button>
              )}
              {hasNext && (
                <button
                  className={clsx(styles.navBtn, styles.navNext)}
                  onClick={onNext}
                  aria-label="Next scene"
                >
                  ›
                </button>
              )}
              <div className={styles.likeBar}>
                <span className={styles.likeCount}>
                  <span className={styles.likeHeart}>♥</span>
                  {localLikeCount} likes
                </span>
                <span className={styles.commentCount}>
                  💬 {scene.comment_count || 0} comments
                </span>
              </div>
            </div>

            {/* Right — metadata + comments */}
            <div className={styles.meta}>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

              {anime && (
                <div className={styles.animeBlock}>
                  {anime.cover_image && (
                    <img
                      src={anime.cover_image}
                      alt={animeTitle}
                      className={styles.animeCover}
                    />
                  )}
                  <div className={styles.animeInfo}>
                    <span className={styles.animeLabel}>From</span>
                    <h3 className={styles.animeTitle}>{animeTitle}</h3>
                    {genres.length > 0 && (
                      <div className={styles.animeGenres}>
                        {genres.slice(0, 4).map((g) => (
                          <span key={g} className={styles.animeGenre}>{g}</span>
                        ))}
                      </div>
                    )}
                    {anime.average_score && (
                      <span className={styles.animeScore}>
                        ★ {(anime.average_score / 10).toFixed(1)}
                        {anime.year ? ` · ${anime.year}` : ""}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.divider} />

              <h2 className={styles.sceneTitle}>{scene.title}</h2>

              {scene.description && (
                <p className={styles.description}>{scene.description}</p>
              )}

              {(scene.episode || scene.timestamp_seconds) && (
                <div className={styles.episodeRow}>
                  {scene.episode && (
                    <span className={styles.episodeBadge}>Episode {scene.episode}</span>
                  )}
                  {scene.timestamp_seconds && (
                    <span className={styles.timestampBadge}>
                      ⏱ {formatTimestamp(scene.timestamp_seconds)}
                    </span>
                  )}
                </div>
              )}

              {tags.length > 0 && (
                <div className={styles.tagsSection}>
                  <span className={styles.tagsLabel}>Tags</span>
                  <div className={styles.tags}>
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className={styles.tag}
                        style={{ "--tag-color": tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {scene.uploader && (
                <div className={styles.uploaderRow}>
                  <div className={styles.uploaderAvatar}>
                    {scene.uploader.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className={styles.uploaderInfo}>
                    <span className={styles.uploaderLabel}>Uploaded by</span>
                    <span className={styles.uploaderName}>{scene.uploader.username}</span>
                  </div>
                </div>
              )}

              <div className={styles.actions}>
                <button
                  className={clsx(styles.likeBtn, { [styles.likeBtnActive]: isLiked })}
                  onClick={() => onLike?.(scene.id, localLikeCount, setLocalLikeCount)}
                  disabled={!user}
                  title={user ? "Like this scene" : "Sign in to like"}
                >
                  <span>{isLiked ? "♥" : "♡"}</span>
                  {localLikeCount}
                </button>

                <button
                  className={clsx(styles.saveBtn, { [styles.saveBtnActive]: isFavourite })}
                  onClick={() => onFavourite?.(scene.id)}
                  disabled={!user}
                  title={user ? (isFavourite ? "Unsave" : "Save to collection") : "Sign in to save"}
                >
                  <span>{isFavourite ? "◈" : "◇"}</span>
                  {isFavourite ? "Saved" : "Save"}
                </button>

                <button className={styles.shareBtn} onClick={handleShare}>
                  <span>↗</span> Share
                </button>

                {user && (
                  <button
                    className={styles.reportBtn}
                    onClick={() => setReportOpen(true)}
                    title="Report this scene"
                  >
                    ⚑
                  </button>
                )}
              </div>

              <div className={styles.commentsSection}>
                <Comments sceneId={scene.id} user={user} />
              </div>

            </div>

          </motion.div>

          {user && (
            <ReportModal
              isOpen={reportOpen}
              onClose={() => setReportOpen(false)}
              sceneId={scene.id}
              userId={user?.id}
              onReported={() => setReportOpen(false)}
            />
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SceneModal;
