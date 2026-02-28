import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import SceneCard from "../SceneCard/SceneCard";
import { fetchScenes } from "../../services/sceneService";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import styles from "./Gallery.module.css";

const SORT_OPTIONS = [
  { value: "newest",  label: "Newest" },
  { value: "popular", label: "Most Liked" },
  { value: "oldest",  label: "Oldest" },
];

const Gallery = ({ filters, onSceneClick, sort, onSortChange, onScenesLoaded }) => {
  const [scenes,   setScenes]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(0);
  const [hasMore,  setHasMore]  = useState(true);
  const [error,    setError]    = useState(null);
  const LIMIT = 24;
  const pageRef = useRef(0);

  const load = useCallback(async (reset = false) => {
    if (loading && !reset) return;
    setLoading(true);
    setError(null);

    const currentPage = reset ? 0 : pageRef.current;
    const { scenes: newScenes, error: err } = await fetchScenes({
      page: currentPage,
      limit: LIMIT,
      sort,
      ...filters,
    });

    setLoading(false);
    if (err) { setError(err); return; }

    setScenes((prev) => {
      const next = reset ? newScenes : [...prev, ...newScenes];
      onScenesLoaded?.(next);
      return next;
    });

    setHasMore(newScenes.length === LIMIT);
    const nextPage = reset ? 1 : currentPage + 1;
    pageRef.current = nextPage;
    setPage(nextPage);
  }, [sort, filters, loading, onScenesLoaded]);

  // Reset when filters/sort change
  useEffect(() => {
    pageRef.current = 0;
    setScenes([]);
    setHasMore(true);
    setPage(0);
    // Small timeout to avoid race condition
    const t = setTimeout(() => load(true), 50);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, JSON.stringify(filters)]);

  // Infinite scroll sentinel
  const sentinelRef = useInfiniteScroll(hasMore, loading, () => load(false));

  return (
    <section className={styles.wrapper} id="gallery">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.titleGlyph}>✦</span>
            Scene Gallery
          </h2>
          {scenes.length > 0 && !loading && (
            <span className={styles.count}>{scenes.length} scenes</span>
          )}
        </div>

        <div className={styles.sortGroup}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.sortBtn} ${sort === opt.value ? styles.sortActive : ""}`}
              onClick={() => onSortChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>⚠ {error}</div>}

      {!loading && scenes.length === 0 && !error && (
        <motion.div className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className={styles.emptyGlyph}>✧</span>
          <p>No scenes match your filters.</p>
          <p className={styles.emptyHint}>Try clearing some filters or upload the first one.</p>
        </motion.div>
      )}

      <div className={styles.grid}>
        {scenes.map((scene, i) => (
          <SceneCard key={scene.id} scene={scene} index={i} onClick={onSceneClick} />
        ))}
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={`sk-${i}`} className={styles.skeleton}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineShort} />
            </div>
          </div>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />

      {/* End of results */}
      {!loading && !hasMore && scenes.length > 0 && (
        <div className={styles.endMessage}>
          <span className={styles.endGlyph}>✦</span>
          <span>You've seen everything</span>
          <span className={styles.endGlyph}>✦</span>
        </div>
      )}
    </section>
  );
};

export default Gallery;
