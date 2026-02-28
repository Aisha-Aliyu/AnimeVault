import { useRef } from "react";
import { motion } from "framer-motion";
import { useTrending } from "../../hooks/useTrending";
import styles from "./FeaturedBanner.module.css";

const FeaturedCard = ({ scene, rank, onClick }) => {
  const anime = scene.anime;
  const title = anime?.title_english || anime?.title_romaji || "";
  const tags  = scene.scene_tags?.map((st) => st.tag).filter(Boolean).slice(0, 2) || [];

  return (
    <motion.div
      className={styles.card}
      onClick={() => onClick?.(scene)}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.22 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(scene)}
    >
      {/* Rank badge */}
      <div className={styles.rank}>
        {rank === 1 ? "✦" : `#${rank}`}
      </div>

      {/* Image */}
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={scene.image_url} alt={scene.title} loading="lazy" />
        <div className={styles.gradient} />
      </div>

      {/* Info overlay */}
      <div className={styles.info}>
        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag.id} className={styles.tag} style={{ "--tc": tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
        <h3 className={styles.sceneTitle}>{scene.title}</h3>
        <p className={styles.animeTitle}>{title}</p>
        <div className={styles.stats}>
          <span className={styles.stat}>♥ {scene.like_count || 0}</span>
          <span className={styles.stat}>💬 {scene.comment_count || 0}</span>
        </div>
      </div>

      {/* Iridescent shimmer on hover */}
      <div className={styles.shimmer} />
    </motion.div>
  );
};

const FeaturedBanner = ({ onSceneClick }) => {
  const { trending, loading } = useTrending(10);
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  if (!loading && trending.length === 0) return null;

  return (
    <section className={styles.section}>
      {/* Section header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerGlyph}>◆</span>
          <div>
            <h2 className={styles.headerTitle}>Trending Now</h2>
            <p className={styles.headerSub}>The most loved scenes this week</p>
          </div>
        </div>
        <div className={styles.arrows}>
          <button className={styles.arrow} onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
          <button className={styles.arrow} onClick={() => scroll(1)}  aria-label="Scroll right">›</button>
        </div>
      </div>

      {/* Scrollable strip */}
      <div className={styles.strip} ref={scrollRef}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))
          : trending.map((scene, i) => (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
              >
                <FeaturedCard
                  scene={scene}
                  rank={i + 1}
                  onClick={onSceneClick}
                />
              </motion.div>
            ))
        }
      </div>
    </section>
  );
};

export default FeaturedBanner;
