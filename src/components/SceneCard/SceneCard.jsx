import { motion } from "framer-motion";
import styles from "./SceneCard.module.css";
import clsx from "clsx";

const SceneCard = ({ scene, index = 0, onClick }) => {
  const anime = scene.anime;
  const tags  = scene.scene_tags?.map((st) => st.tag).filter(Boolean).slice(0, 3) || [];

  const title = anime?.title_english || anime?.title_romaji || "Unknown Anime";

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay: (index % 12) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      onClick={() => onClick?.(scene)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(scene)}
    >
      {/* Image */}
      <div className={styles.imageWrapper}>
        <img
          className={styles.image}
          src={scene.image_url}
          alt={scene.title}
          loading="lazy"
        />
        <div className={styles.imageOverlay} />

        {/* Iridescent border glow */}
        <div className={styles.borderGlow} />

        {/* Like count overlay */}
        <div className={styles.likeOverlay}>
          <span className={styles.likeIcon}>♥</span>
          <span>{scene.like_count || 0}</span>
        </div>

        {/* Anime badge */}
        {anime?.cover_image && (
          <div className={styles.animeBadge}>
            <img src={anime.cover_image} alt={title} className={styles.animeCover} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.sceneTitle}>{scene.title}</h3>
        <p className={styles.animeTitle}>{title}</p>

        {/* Tags */}
        {tags.length > 0 && (
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
        )}
      </div>
    </motion.article>
  );
};

export default SceneCard;
