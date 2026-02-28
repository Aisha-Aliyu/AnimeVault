import { useRef } from "react";
import { motion } from "framer-motion";
import styles from "./GenreFilter.module.css";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Horror", "Mecha", "Music", "Mystery", "Psychological",
  "Romance", "Sci-Fi", "Slice of Life", "Sports",
  "Supernatural", "Thriller",
];

// Each genre gets a subtle signature color
const GENRE_COLORS = {
  "Action":        "#ef4444",
  "Adventure":     "#f97316",
  "Comedy":        "#eab308",
  "Drama":         "#8b5cf6",
  "Fantasy":       "#6e2cf4",
  "Horror":        "#dc2626",
  "Mecha":         "#64748b",
  "Music":         "#ec4899",
  "Mystery":       "#a855f7",
  "Psychological": "#7c3aed",
  "Romance":       "#f472b6",
  "Sci-Fi":        "#0ea5e9",
  "Slice of Life": "#10b981",
  "Sports":        "#22c55e",
  "Supernatural":  "#c026d3",
  "Thriller":      "#b91c1c",
};

const GenreFilter = ({ selected, onSelect }) => {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.arrow} onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>

      <div className={styles.strip} ref={scrollRef}>
        {/* "All" pill */}
        <motion.button
          className={`${styles.pill} ${!selected ? styles.pillAllActive : styles.pillAll}`}
          onClick={() => onSelect(null)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
        >
          ✦ All
        </motion.button>

        {GENRES.map((genre, i) => {
          const isActive = selected === genre;
          const color    = GENRE_COLORS[genre] || "#8b5cf6";
          return (
            <motion.button
              key={genre}
              className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
              style={{
                "--genre-color": color,
                animationDelay: `${i * 0.04}s`,
              }}
              onClick={() => onSelect(isActive ? null : genre)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035, duration: 0.35 }}
            >
              {genre}
            </motion.button>
          );
        })}
      </div>

      <button className={styles.arrow} onClick={() => scroll(1)} aria-label="Scroll right">›</button>
    </div>
  );
};

export default GenreFilter;
