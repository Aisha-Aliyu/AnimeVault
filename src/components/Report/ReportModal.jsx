import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { reportScene, REASONS } from "../../services/reportService";
import styles from "./ReportModal.module.css";

const ReportModal = ({ isOpen, onClose, sceneId, userId, onReported }) => {
  const [selected,   setSelected]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    const { error: err } = await reportScene(sceneId, userId, selected);
    setSubmitting(false);

    if (err === "already_reported") {
      setError("You've already reported this scene.");
      return;
    }
    if (err) { setError(err); return; }

    setDone(true);
    onReported?.();
  };

  const handleClose = () => {
    setSelected("");
    setDone(false);
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.96,    y: 12 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {done ? (
              <div className={styles.success}>
                <div className={styles.successIcon}>✓</div>
                <h3 className={styles.successTitle}>Report submitted</h3>
                <p className={styles.successSub}>Thank you. Our moderation team will review this scene.</p>
                <button className={styles.doneBtn} onClick={handleClose}>Close</button>
              </div>
            ) : (
              <>
                <div className={styles.header}>
                  <h3 className={styles.title}>Report Scene</h3>
                  <button className={styles.closeBtn} onClick={handleClose}>✕</button>
                </div>

                <p className={styles.subtitle}>
                  What's wrong with this scene?
                </p>

                <div className={styles.reasons}>
                  {REASONS.map((reason) => (
                    <button
                      key={reason}
                      className={`${styles.reason} ${selected === reason ? styles.reasonActive : ""}`}
                      onClick={() => setSelected(reason)}
                    >
                      <span className={styles.reasonDot} />
                      {reason}
                    </button>
                  ))}
                </div>

                {error && <div className={styles.error}>⚠ {error}</div>}

                <div className={styles.footer}>
                  <button className={styles.cancelBtn} onClick={handleClose}>Cancel</button>
                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={!selected || submitting}
                  >
                    {submitting ? "Submitting…" : "Submit Report"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
