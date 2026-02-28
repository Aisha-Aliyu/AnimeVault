import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFavouritedScenes, getUserUploadedScenes } from "../../services/socialService";
import styles from "./CollectionPanel.module.css";

const TABS = [
  { id: "favourites", label: "Favourites", icon: "◈" },
  { id: "uploads",    label: "My Uploads", icon: "✦" },
];

const MiniCard = ({ scene, onClick }) => (
  <motion.div
    className={styles.miniCard}
    whileHover={{ y: -3, scale: 1.02 }}
    onClick={() => onClick?.(scene)}
  >
    <img src={scene.image_url} alt={scene.title} className={styles.miniImg} />
    <div className={styles.miniOverlay}>
      <span className={styles.miniTitle}>{scene.title}</span>
      <span className={styles.miniAnime}>
        {scene.anime?.title_english || scene.anime?.title_romaji || ""}
      </span>
      <div className={styles.miniStats}>
        <span>♥ {scene.like_count || 0}</span>
        <span>💬 {scene.comment_count || 0}</span>
      </div>
    </div>
  </motion.div>
);

const CollectionPanel = ({ isOpen, onClose, user, onSceneClick }) => {
  const [tab,       setTab]       = useState("favourites");
  const [scenes,    setScenes]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    setLoading(true);
    setError("");

    const fn = tab === "favourites"
      ? () => getFavouritedScenes(user.id)
      : () => getUserUploadedScenes(user.id);

    fn().then(({ scenes: s, error: err }) => {
      setLoading(false);
      if (err) { setError(err); return; }
      setScenes(s);
    });
  }, [isOpen, tab, user?.id]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className={styles.panel}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 38 }}
          >
            {/* Aurora glow */}
            <div className={styles.panelGlow} />

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.userRow}>
                <div className={styles.avatar}>
                  {user?.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.username}>
                    {user?.user_metadata?.username || user?.email?.split("@")[0] || "Explorer"}
                  </span>
                  <span className={styles.userEmail}>{user?.email}</span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.tabBtn} ${tab === t.id ? styles.tabBtnActive : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  <span className={styles.tabIcon}>{t.icon}</span>
                  {t.label}
                  {tab === t.id && (
                    <motion.div className={styles.tabBar} layoutId="collection-tab-bar" />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className={styles.content}>
              {loading && (
                <div className={styles.loadingGrid}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.skeleton} />
                  ))}
                </div>
              )}

              {error && (
                <div className={styles.error}>⚠ {error}</div>
              )}

              {!loading && !error && scenes.length === 0 && (
                <div className={styles.empty}>
                  <span className={styles.emptyGlyph}>
                    {tab === "favourites" ? "◈" : "✦"}
                  </span>
                  <p>
                    {tab === "favourites"
                      ? "No saved scenes yet. Browse and hit ◈ Save on any scene."
                      : "You haven't uploaded any scenes yet."}
                  </p>
                </div>
              )}

              {!loading && scenes.length > 0 && (
                <div className={styles.grid}>
                  {scenes.map((scene, i) => (
                    <motion.div
                      key={scene.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <MiniCard
                        scene={scene}
                        onClick={(s) => { onSceneClick?.(s); onClose(); }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CollectionPanel;
