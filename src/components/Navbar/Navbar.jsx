import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./Navbar.module.css";
import clsx from "clsx";

const Navbar = ({ user, onSignIn, onUpload, onOpenCollection, onSignOut }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className={clsx(styles.nav, { [styles.scrolled]: scrolled })}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Logo */}
      <a href="/" className={styles.logo}>
        <span className={styles.logoGlyph}>✦</span>
        <span className={styles.logoText}>AnimeVault</span>
      </a>

      {/* Desktop nav */}
      <div className={styles.links}>
        <a href="#gallery"  className={styles.link}>Gallery</a>
        <a href="#trending" className={styles.link}>Trending</a>
        <a href="#tags"     className={styles.link}>Browse Tags</a>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
       {user ? (
  <>
    <button className={styles.uploadBtn} onClick={onUpload}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Upload
    </button>

    <div className={styles.userMenu}>
      <button
        className={styles.avatar}
        onClick={onOpenCollection}
        title="My Collection"
      >
        {(user.user_metadata?.username || user.email || "?")[0].toUpperCase()}
      </button>
      <button className={styles.signOutMini} onClick={onSignOut} title="Sign out">
        ⏻
      </button>
    </div>
  </>
) : (
  <button className={styles.signInBtn} onClick={onSignIn}>
    Sign In
  </button>
)}
     </div>

      {/* Mobile hamburger */}
      <button
        className={styles.hamburger}
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Menu"
      >
        <span className={clsx(styles.bar, { [styles.barOpen]: mobileOpen })} />
        <span className={clsx(styles.bar, { [styles.barOpen]: mobileOpen })} />
        <span className={clsx(styles.bar, { [styles.barOpen]: mobileOpen })} />
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          className={styles.mobileMenu}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <a href="#gallery"  className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Gallery</a>
          <a href="#trending" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Trending</a>
          <a href="#tags"     className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Browse Tags</a>
          <div className={styles.mobileDivider} />
          {user ? (
            <button className={styles.uploadBtn} onClick={() => { onUpload(); setMobileOpen(false); }}>
              + Upload Scene
            </button>
          ) : (
            <button className={styles.signInBtn} onClick={() => { onSignIn(); setMobileOpen(false); }}>
              Sign In
            </button>
          )}
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
