import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchAnime } from "../../services/anilistService";
import { uploadSceneImage, createScene, fetchTags, upsertAnime } from "../../services/sceneService";
import { supabase } from "../../lib/supabase";
import styles from "./UploadModal.module.css";

const STEPS = ["Image", "Anime", "Details", "Tags"];

const UploadModal = ({ isOpen, onClose, userId, onSuccess }) => {
  const [step,        setStep]        = useState(0);
  const [file,        setFile]        = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [dragging,    setDragging]    = useState(false);
  const [animeSearch, setAnimeSearch] = useState("");
  const [animeResults,setAnimeResults]= useState([]);
  const [animeLoading,setAnimeLoading]= useState(false);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [episode,     setEpisode]     = useState("");
  const [timestamp,   setTimestamp]   = useState("");
  const [allTags,     setAllTags]     = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [tagsLoaded,  setTagsLoaded]  = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState("");
  const fileRef = useRef(null);

  // Load tags when reaching step 3
  const loadTags = async () => {
    if (tagsLoaded) return;
    const { tags } = await fetchTags();
    setAllTags(tags);
    setTagsLoaded(true);
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnimeSearch = async (q) => {
    setAnimeSearch(q);
    if (!q.trim() || q.length < 2) { setAnimeResults([]); return; }
    setAnimeLoading(true);
    const results = await searchAnime(q, 1, 8).catch(() => []);
    setAnimeResults(results);
    setAnimeLoading(false);
  };

  const toggleTag = (id) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    setError("");
    if (step === 0 && !file)  { setError("Please select an image."); return; }
    if (step === 2 && !title.trim()) { setError("Please add a title."); return; }
    if (step === 3) { await handleSubmit(); return; }
    if (step === 3 - 1) await loadTags();
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setUploading(true);
    setError("");

    // 1. Upload image
    const { url: imageUrl, error: imgErr } = await uploadSceneImage(file, userId);
    if (imgErr) { setError(imgErr); setUploading(false); return; }

    // 2. Upsert anime if selected
    let animeId = null;
    if (selectedAnime) {
      await upsertAnime(selectedAnime);
      animeId = selectedAnime.id;
    }

    // 3. Create scene
    const { scene, error: sceneErr } = await createScene({
      title: title.trim(),
      description: description.trim(),
      imageUrl,
      animeId,
      episode:          episode  ? parseInt(episode)  : null,
      timestampSeconds: timestamp? parseInt(timestamp) : null,
      userId,
    });

    if (sceneErr) { setError(sceneErr); setUploading(false); return; }

    // 4. Attach tags
    if (selectedTagIds.length > 0) {
      await supabase.from("scene_tags").insert(
        selectedTagIds.map((tagId) => ({ scene_id: scene.id, tag_id: tagId }))
      );
    }

    setUploading(false);
    onSuccess?.(scene);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setStep(0); setFile(null); setPreview(null);
    setSelectedAnime(null); setAnimeSearch(""); setAnimeResults([]);
    setTitle(""); setDescription(""); setEpisode(""); setTimestamp("");
    setSelectedTagIds([]); setError("");
  };

  if (!isOpen) return null;

  const grouped = allTags.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) { onClose(); resetForm(); } }}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow */}
            <div className={styles.glow} />

            {/* Header */}
            <div className={styles.header}>
              <h2 className={styles.title}>Upload a Scene</h2>
              <button className={styles.closeBtn} onClick={() => { onClose(); resetForm(); }}>✕</button>
            </div>

            {/* Step progress */}
            <div className={styles.stepper}>
              {STEPS.map((s, i) => (
                <div key={s} className={styles.stepItem}>
                  <div className={`${styles.stepDot} ${i <= step ? styles.stepDotActive : ""} ${i < step ? styles.stepDotDone : ""}`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={`${styles.stepLabel} ${i === step ? styles.stepLabelActive : ""}`}>{s}</span>
                  {i < STEPS.length - 1 && (
                    <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ""}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div className={styles.body}>
              <AnimatePresence mode="wait">
                {/* Step 0 — Image */}
                {step === 0 && (
                  <motion.div key="step0" {...stepAnim}>
                    <div
                      className={`${styles.dropzone} ${dragging ? styles.dragging : ""} ${preview ? styles.hasPreview : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => !preview && fileRef.current?.click()}
                    >
                      {preview ? (
                        <>
                          <img src={preview} alt="preview" className={styles.previewImg} />
                          <button
                            className={styles.changeImg}
                            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                          >
                            Change Image
                          </button>
                        </>
                      ) : (
                        <>
                          <div className={styles.dropIcon}>🖼</div>
                          <p className={styles.dropText}>Drop your screenshot here</p>
                          <p className={styles.dropSub}>JPEG · PNG · WebP · GIF · Max 10MB</p>
                          <button className={styles.browseBtn} type="button">Browse Files</button>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: "none" }}
                      onChange={(e) => handleFile(e.target.files[0])}
                    />
                  </motion.div>
                )}

                {/* Step 1 — Anime */}
                {step === 1 && (
                  <motion.div key="step1" {...stepAnim} className={styles.animeStep}>
                    <p className={styles.stepHint}>Search for the anime this scene is from — or skip if unknown.</p>

                    {selectedAnime ? (
                      <div className={styles.selectedAnime}>
                        {selectedAnime.coverImage?.large && (
                          <img src={selectedAnime.coverImage.large} alt="" className={styles.selectedCover} />
                        )}
                        <div className={styles.selectedInfo}>
                          <span className={styles.selectedTitle}>
                            {selectedAnime.title?.english || selectedAnime.title?.romaji}
                          </span>
                          <span className={styles.selectedMeta}>
                            {selectedAnime.genres?.slice(0, 3).join(" · ")}
                            {selectedAnime.seasonYear ? ` · ${selectedAnime.seasonYear}` : ""}
                          </span>
                        </div>
                        <button className={styles.clearAnime} onClick={() => setSelectedAnime(null)}>
                          Change
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className={styles.animeSearchWrapper}>
                          <input
                            className={styles.animeSearchInput}
                            type="text"
                            placeholder="Search anime title…"
                            value={animeSearch}
                            onChange={(e) => handleAnimeSearch(e.target.value)}
                            autoFocus
                            spellCheck={false}
                          />
                          {animeLoading && <div className={styles.spinner} />}
                        </div>

                        {animeResults.length > 0 && (
                          <div className={styles.animeResults}>
                            {animeResults.map((a) => (
                              <button
                                key={a.id}
                                className={styles.animeResult}
                                onClick={() => { setSelectedAnime(a); setAnimeResults([]); setAnimeSearch(""); }}
                              >
                                {a.coverImage?.large && (
                                  <img src={a.coverImage.large} alt="" className={styles.resultCover} />
                                )}
                                <div className={styles.resultInfo}>
                                  <span className={styles.resultTitle}>{a.title?.english || a.title?.romaji}</span>
                                  <span className={styles.resultMeta}>
                                    {a.genres?.slice(0, 3).join(" · ")}
                                    {a.seasonYear ? ` · ${a.seasonYear}` : ""}
                                  </span>
                                </div>
                                {a.averageScore && (
                                  <span className={styles.resultScore}>★ {(a.averageScore / 10).toFixed(1)}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* Step 2 — Details */}
                {step === 2 && (
                  <motion.div key="step2" {...stepAnim} className={styles.detailsStep}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Scene Title *</label>
                      <input
                        className={styles.fieldInput}
                        type="text"
                        placeholder="Give this moment a name…"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={200}
                        autoFocus
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Description</label>
                      <textarea
                        className={styles.fieldTextarea}
                        placeholder="What makes this scene special?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={1000}
                        rows={3}
                      />
                    </div>

                    <div className={styles.rowFields}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Episode</label>
                        <input
                          className={styles.fieldInput}
                          type="number"
                          placeholder="e.g. 12"
                          value={episode}
                          onChange={(e) => setEpisode(e.target.value)}
                          min={1}
                          max={9999}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Timestamp (secs)</label>
                        <input
                          className={styles.fieldInput}
                          type="number"
                          placeholder="e.g. 1340"
                          value={timestamp}
                          onChange={(e) => setTimestamp(e.target.value)}
                          min={0}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3 — Tags */}
                {step === 3 && (
                  <motion.div key="step3" {...stepAnim} className={styles.tagsStep}>
                    <p className={styles.stepHint}>Add tags to help people discover this scene.</p>

                    {Object.entries(grouped).map(([cat, tags]) => (
                      <div key={cat} className={styles.tagGroup}>
                        <span className={styles.tagGroupLabel}>{cat}</span>
                        <div className={styles.tagPills}>
                          {tags.map((tag) => {
                            const active = selectedTagIds.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                className={`${styles.tagPill} ${active ? styles.tagPillActive : ""}`}
                                style={{ "--tag-color": tag.color }}
                                onClick={() => toggleTag(tag.id)}
                              >
                                {active && "✓ "}{tag.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.error}>⚠ {error}</div>
            )}

            {/* Footer nav */}
            <div className={styles.footer}>
              {step > 0 && (
                <button className={styles.backBtn} onClick={() => { setStep((s) => s - 1); setError(""); }}>
                  ← Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              {step < 3 && step === 1 && !selectedAnime && (
                <button className={styles.skipBtn} onClick={() => setStep((s) => s + 1)}>
                  Skip
                </button>
              )}
              <button
                className={styles.nextBtn}
                onClick={handleNext}
                disabled={uploading}
              >
                {uploading ? (
                  <span className={styles.spinner} />
                ) : step === 3 ? (
                  "✦ Upload Scene"
                ) : (
                  "Next →"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const stepAnim = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0  },
  exit:    { opacity: 0, x: -16 },
  transition: { duration: 0.2 },
};

export default UploadModal;
