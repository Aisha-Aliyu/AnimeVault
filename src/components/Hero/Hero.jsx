import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./Hero.module.css";

const FLOATING_GLYPHS = ["✦", "✧", "⋆", "✦", "✧", "⋆", "✦"];

const Hero = ({ onExplore, trendingCount = 0 }) => {
  return (
    <section className={styles.hero}>
      {/* Floating decorative glyphs */}
      {FLOATING_GLYPHS.map((g, i) => (
        <span
          key={i}
          className={styles.glyph}
          style={{
            left:            `${10 + i * 13}%`,
            top:             `${20 + (i % 3) * 25}%`,
            animationDelay:  `${i * 0.8}s`,
            animationDuration:`${4 + i * 0.5}s`,
            fontSize:        `${0.6 + (i % 3) * 0.4}rem`,
            opacity:         0.15 + (i % 3) * 0.08,
          }}
        >
          {g}
        </span>
      ))}

      <div className={styles.content}>
        <motion.div
          className={styles.badge}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <span className={styles.badgeDot} />
          {trendingCount > 0 ? `${trendingCount.toLocaleString()} scenes and growing` : "Community gallery"}
        </motion.div>

        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Every frame
          <br />
          <span className={styles.titleAccent}>tells a story</span>
        </motion.h1>

        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
        >
          The world's most beautiful anime moments, curated and searchable.
          <br />
          Find scenes by mood, genre, character — or upload your own.
        </motion.p>

        <motion.div
          className={styles.cta}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <button className={styles.primaryBtn} onClick={onExplore}>
            Explore Gallery
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
          <button className={styles.secondaryBtn} onClick={() => document.getElementById('tags')?.scrollIntoView({ behavior: 'smooth' })}>
            Browse by Mood
          </button>
        </motion.div>
      </div>

      {/* Decorative gradient orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />
    </section>
  );
};

export default Hero;
