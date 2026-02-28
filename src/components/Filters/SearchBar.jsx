import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchAnime } from "../../services/anilistService";
import styles from "./SearchBar.module.css";

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const SearchBar = ({ onSearchChange, onAnimeSelect, animeId }) => {
  const [input,       setInput]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [focused,     setFocused]     = useState(false);
  const [selIndex,    setSelIndex]    = useState(-1);
  const inputRef = useRef(null);
  const debounced = useDebounce(input, 320);

  // Fetch AniList suggestions
  useEffect(() => {
    if (!debounced.trim() || debounced.length < 2) {
      setSuggestions([]);
      onSearchChange("");
      return;
    }

    setLoading(true);
    searchAnime(debounced, 1, 6).then((results) => {
      setSuggestions(results);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Also pass to scene title search
    onSearchChange(debounced);
  }, [debounced, onSearchChange]);

  const handleSelect = useCallback((anime) => {
    setInput(anime.title?.english || anime.title?.romaji || "");
    setSuggestions([]);
    onAnimeSelect(anime.id, anime.title?.english || anime.title?.romaji || "");
    onSearchChange("");
  }, [onAnimeSelect, onSearchChange]);

  const handleClear = () => {
    setInput("");
    setSuggestions([]);
    onSearchChange("");
    onAnimeSelect(null, "");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelIndex((i) => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelIndex((i) => Math.max(i - 1, -1)); }
    if (e.key === "Enter" && selIndex >= 0) { handleSelect(suggestions[selIndex]); }
    if (e.key === "Escape") { setSuggestions([]); setFocused(false); inputRef.current?.blur(); }
  };

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.inputWrapper} ${focused ? styles.focused : ""}`}>
        {/* Search icon */}
        <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>

        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Search anime or scenes…"
          value={input}
          onChange={(e) => { setInput(e.target.value); setSelIndex(-1); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />

        {/* Loading / clear */}
        {loading && <div className={styles.spinner} />}
        {!loading && input && (
          <button className={styles.clearBtn} onClick={handleClear} aria-label="Clear">✕</button>
        )}
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {focused && suggestions.length > 0 && (
          <motion.div
            className={styles.dropdown}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <p className={styles.dropdownLabel}>Anime results</p>
            {suggestions.map((anime, i) => (
              <button
                key={anime.id}
                className={`${styles.suggestion} ${i === selIndex ? styles.suggestionActive : ""}`}
                onMouseDown={() => handleSelect(anime)}
                onMouseEnter={() => setSelIndex(i)}
              >
                {anime.coverImage?.large && (
                  <img
                    src={anime.coverImage.large}
                    alt=""
                    className={styles.suggestionCover}
                  />
                )}
                <div className={styles.suggestionInfo}>
                  <span className={styles.suggestionTitle}>
                    {anime.title?.english || anime.title?.romaji}
                  </span>
                  <span className={styles.suggestionMeta}>
                    {anime.genres?.slice(0, 3).join(" · ")}
                    {anime.seasonYear ? ` · ${anime.seasonYear}` : ""}
                  </span>
                </div>
                <span className={styles.suggestionScore}>
                  {anime.averageScore ? `★ ${(anime.averageScore / 10).toFixed(1)}` : ""}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
