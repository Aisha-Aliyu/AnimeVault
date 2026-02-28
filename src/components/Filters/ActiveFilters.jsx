import { motion, AnimatePresence } from "framer-motion";
import styles from "./ActiveFilters.module.css";

const ActiveFilters = ({
  search, selectedTags, allTags, selectedGenre, animeName,
  onClearSearch, onClearTag, onClearGenre, onClearAnime, onClearAll,
  hasActiveFilters,
}) => {
  if (!hasActiveFilters) return null;

  const tagObjects = selectedTags
    .map((id) => allTags.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <motion.div
      className={styles.bar}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
    >
      <span className={styles.label}>Filtering by:</span>

      <div className={styles.chips}>
        {/* Search chip */}
        {search && (
          <FilterChip
            label={`"${search}"`}
            color="#8b5cf6"
            onRemove={onClearSearch}
          />
        )}

        {/* Anime chip */}
        {animeName && (
          <FilterChip
            label={animeName}
            color="#0ea5e9"
            onRemove={onClearAnime}
          />
        )}

        {/* Genre chip */}
        {selectedGenre && (
          <FilterChip
            label={selectedGenre}
            color="#f97316"
            onRemove={onClearGenre}
          />
        )}

        {/* Tag chips */}
        {tagObjects.map((tag) => (
          <FilterChip
            key={tag.id}
            label={tag.name}
            color={tag.color}
            onRemove={() => onClearTag(tag.id)}
          />
        ))}
      </div>

      <button className={styles.clearAll} onClick={onClearAll}>
        Clear all
      </button>
    </motion.div>
  );
};

const FilterChip = ({ label, color, onRemove }) => (
  <motion.span
    className={styles.chip}
    style={{ "--chip-color": color }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    layout
  >
    {label}
    <button
      className={styles.chipRemove}
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
    >
      ✕
    </button>
  </motion.span>
);

export default ActiveFilters;
