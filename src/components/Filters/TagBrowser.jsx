import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTags } from "../../services/sceneService";
import styles from "./TagBrowser.module.css";

const CATEGORY_META = {
  mood:      { label: "Mood",   icon: "◉", desc: "Emotional tone of the scene" },
  visual:    { label: "Visual", icon: "◈", desc: "What you see — setting, weather, time" },
  theme:     { label: "Theme",  icon: "◆", desc: "What's happening in the scene" },
  character: { label: "Char",   icon: "◇", desc: "Character-focused moments" },
  other:     { label: "Other",  icon: "◌", desc: "Everything else" },
};

const TagBrowser = ({ selectedTagIds, onToggle }) => {
  const [tags,        setTags]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeGroup, setActiveGroup] = useState("mood");

  useEffect(() => {
    fetchTags().then(({ tags: t }) => {
      setTags(t);
      setLoading(false);
    });
  }, []);

  const grouped = tags.reduce((acc, tag) => {
    const cat = tag.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tag);
    return acc;
  }, {});

  const categories = Object.keys(CATEGORY_META).filter((c) => grouped[c]?.length > 0);

  return (
    <section className={styles.wrapper} id="tags">
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleGlyph}>◆</span>
          Browse by Mood & Theme
        </h2>
        <p className={styles.subtitle}>
          Filter scenes by what you're feeling right now
        </p>
      </div>

      {/* Category tabs */}
      <div className={styles.categoryTabs}>
        {categories.map((cat) => {
          const meta  = CATEGORY_META[cat];
          const count = grouped[cat]?.length || 0;
          return (
            <button
              key={cat}
              className={`${styles.catTab} ${activeGroup === cat ? styles.catTabActive : ""}`}
              onClick={() => setActiveGroup(cat)}
            >
              <span className={styles.catIcon}>{meta.icon}</span>
              <span>{meta.label}</span>
              <span className={styles.catCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tag pills for active category */}
      <AnimatePresence mode="wait">
        {!loading && grouped[activeGroup] && (
          <motion.div
            key={activeGroup}
            className={styles.tagGrid}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            {grouped[activeGroup].map((tag, i) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <motion.button
                  key={tag.id}
                  className={`${styles.tagPill} ${isSelected ? styles.tagPillActive : ""}`}
                  style={{ "--tag-color": tag.color }}
                  onClick={() => onToggle(tag.id)}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isSelected && <span className={styles.tagCheck}>✓</span>}
                  {tag.name}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active selections count */}
      {selectedTagIds.length > 0 && (
        <motion.p
          className={styles.selectionHint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {selectedTagIds.length} tag{selectedTagIds.length > 1 ? "s" : ""} selected
          — scroll down to see filtered scenes ↓
        </motion.p>
      )}
    </section>
  );
};

export default TagBrowser;
