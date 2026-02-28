import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, signUp, sendMagicLink } from "../../services/authService";
import styles from "./AuthModal.module.css";
import clsx from "clsx";

const TABS = [
  { id: "login",  label: "Sign In" },
  { id: "signup", label: "Sign Up" },
  { id: "magic",  label: "✦ Magic Link" },
];

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [tab,       setTab]       = useState("login");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [username,  setUsername]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [magicSent, setMagicSent] = useState(false);

  const reset = () => { setError(""); setMagicSent(false); };
  const changeTab = (t) => { setTab(t); reset(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (tab === "magic") {
      const { error: err } = await sendMagicLink(email);
      setLoading(false);
      if (err) { setError(err); return; }
      setMagicSent(true);
      return;
    }

    if (!email || !password) { setError("Please fill all fields."); setLoading(false); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }
    if (tab === "signup" && !username.trim()) { setError("Username is required."); setLoading(false); return; }
    if (tab === "signup" && username.trim().length < 3) { setError("Username must be at least 3 characters."); setLoading(false); return; }

    const fn = tab === "signup" ? () => signUp(email, password, username) : () => signIn(email, password);
    const { user, error: err } = await fn();
    setLoading(false);
    if (err) { setError(err); return; }
    onSuccess(user);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.93, y: 32 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.95,    y: 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Aurora glow behind modal */}
            <div className={styles.modalGlow} />

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.logoRow}>
                <span className={styles.logoGlyph}>✦</span>
                <span className={styles.logoText}>AnimeVault</span>
              </div>
              <p className={styles.tagline}>Your scenes. Your collection.</p>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={clsx(styles.tab, { [styles.tabActive]: tab === t.id })}
                  onClick={() => changeTab(t.id)}
                >
                  {t.label}
                  {tab === t.id && (
                    <motion.div className={styles.tabUnderline} layoutId="tab-underline" />
                  )}
                </button>
              ))}
            </div>

            {/* Form */}
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <AnimatePresence mode="wait">
                {magicSent ? (
                  <motion.div
                    key="magic-sent"
                    className={styles.magicSuccess}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className={styles.magicIcon}>📬</div>
                    <p className={styles.magicTitle}>Check your inbox</p>
                    <p className={styles.magicSub}>
                      Magic link sent to <strong>{email}</strong>.<br />
                      Click it to sign in — no password needed.
                    </p>
                    <button type="button" className={styles.backBtn} onClick={() => setMagicSent(false)}>
                      Use a different email
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={tab}
                    className={styles.fields}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0  }}
                    exit={{ opacity: 0,   x: -10 }}
                    transition={{ duration: 0.18 }}
                  >
                    {tab === "signup" && (
                      <div className={styles.field}>
                        <label className={styles.label}>Username</label>
                        <input
                          className={styles.input}
                          type="text"
                          placeholder="yourhandle"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          autoComplete="username"
                          spellCheck={false}
                        />
                      </div>
                    )}

                    <div className={styles.field}>
                      <label className={styles.label}>Email</label>
                      <input
                        className={styles.input}
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        spellCheck={false}
                      />
                    </div>

                    {tab !== "magic" && (
                      <div className={styles.field}>
                        <label className={styles.label}>Password</label>
                        <input
                          className={styles.input}
                          type="password"
                          placeholder={tab === "signup" ? "Min. 8 characters" : "Your password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete={tab === "signup" ? "new-password" : "current-password"}
                        />
                      </div>
                    )}

                    {tab === "magic" && (
                      <p className={styles.magicHint}>
                        ✦ We'll email you a one-click sign-in link. No password, ever.
                      </p>
                    )}

                    {error && (
                      <motion.div
                        className={styles.error}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        ⚠ {error}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className={styles.submitSpinner} />
                      ) : (
                        <>
                          {tab === "login"  && "Sign In"}
                          {tab === "signup" && "Create Account"}
                          {tab === "magic"  && "Send Magic Link"}
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <p className={styles.footer}>
              Your data is private and never shared.
            </p>

            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
