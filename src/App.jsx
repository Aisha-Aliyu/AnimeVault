import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import GalleryWithScenes from "./components/Gallery/GalleryWithScenes";
import FeaturedBanner from "./components/Featured/FeaturedBanner";
import TagBrowser from "./components/Filters/TagBrowser";
import GenreFilter from "./components/Filters/GenreFilter";
import SearchBar from "./components/Filters/SearchBar";
import ActiveFilters from "./components/Filters/ActiveFilters";
import SceneModal from "./components/SceneModal/SceneModal";
import AuthModal from "./components/Auth/AuthModal";
import UploadModal from "./components/Upload/UploadModal";
import CollectionPanel from "./components/Collection/CollectionPanel";
import { useFilters } from "./hooks/useFilters";
import { useSocial } from "./hooks/useSocial";
import { fetchTrending } from "./services/anilistService";
import { upsertAnime, seedTags, fetchTags } from "./services/sceneService";
import { signOut } from "./services/authService";
import { supabase } from "./lib/supabase";
import "./styles/fonts.css";

function App() {
  const [user,         setUser]         = useState(null);
  const [allTags,      setAllTags]      = useState([]);
  const [scenes,       setScenes]       = useState([]);
  const [modalScene,   setModalScene]   = useState(null);
  const [modalIndex,   setModalIndex]   = useState(-1);

  const [isAuthOpen,       setIsAuthOpen]       = useState(false);
  const [isUploadOpen,     setIsUploadOpen]     = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);

  const filters = useFilters();
  const social  = useSocial(user);

  // ── Auth listener ────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Seed + init ──────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await seedTags();
      const { tags } = await fetchTags();
      setAllTags(tags);
      const trending = await fetchTrending(1, 20).catch(() => []);
      for (const anime of trending) {
        await upsertAnime(anime).catch(() => {});
      }
    };
    init();
  }, []);

  // ── Scene modal helpers ──────────────────────────────────────────
  const handleSceneClick = useCallback((scene, allLoadedScenes) => {
    setModalScene(scene);
    const idx = allLoadedScenes?.findIndex((s) => s.id === scene.id) ?? -1;
    setModalIndex(idx);
    setScenes(allLoadedScenes || []);
  }, []);

  const handlePrev = useCallback(() => {
    if (modalIndex > 0) {
      setModalScene(scenes[modalIndex - 1]);
      setModalIndex((i) => i - 1);
    }
  }, [modalIndex, scenes]);

  const handleNext = useCallback(() => {
    if (modalIndex < scenes.length - 1) {
      setModalScene(scenes[modalIndex + 1]);
      setModalIndex((i) => i + 1);
    }
  }, [modalIndex, scenes]);

  // ── Sign out ─────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
    setIsCollectionOpen(false);
  }, []);

  // ── Upload success ───────────────────────────────────────────────
  const handleUploadSuccess = useCallback(() => {
    filters.setSort("newest");
  }, [filters]);

  const scrollToGallery = () => {
    document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar
        user={user}
        onSignIn={() => setIsAuthOpen(true)}
        onUpload={() => user ? setIsUploadOpen(true) : setIsAuthOpen(true)}
        onOpenCollection={() => setIsCollectionOpen(true)}
        onSignOut={handleSignOut}
      />

      <Hero onExplore={scrollToGallery} trendingCount={1200} />

      {/* Featured trending scenes */}
      <FeaturedBanner
        onSceneClick={(scene) => {
          setModalScene(scene);
          setModalIndex(-1);
          setScenes([scene]);
        }}
      />

      {/* Tag browser */}
      <TagBrowser
        selectedTagIds={filters.selectedTags}
        onToggle={filters.toggleTag}
      />

      {/* Filter section */}
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "0 clamp(16px, 4vw, 48px)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        marginBottom: 8,
      }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar
            onSearchChange={filters.setSearch}
            onAnimeSelect={(id, name) => {
              filters.setAnimeId(id);
              filters.setAnimeName(name);
            }}
            animeId={filters.animeId}
          />
        </div>

        <GenreFilter
          selected={filters.selectedGenre}
          onSelect={filters.setSelectedGenre}
        />

        <AnimatePresence>
          {filters.hasActiveFilters && (
            <ActiveFilters
              search={filters.search}
              selectedTags={filters.selectedTags}
              allTags={allTags}
              selectedGenre={filters.selectedGenre}
              animeName={filters.animeName}
              onClearSearch={() => filters.setSearch("")}
              onClearTag={filters.clearTag}
              onClearGenre={() => filters.setSelectedGenre(null)}
              onClearAnime={() => { filters.setAnimeId(null); filters.setAnimeName(""); }}
              onClearAll={filters.clearAll}
              hasActiveFilters={filters.hasActiveFilters}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Gallery */}
      <GalleryWithScenes
        filters={filters.filterPayload}
        sort={filters.sort}
        onSortChange={filters.setSort}
        onSceneClick={handleSceneClick}
      />

      {/* Scene modal */}
      <SceneModal
        scene={modalScene}
        isOpen={!!modalScene}
        onClose={() => setModalScene(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={modalIndex > 0}
        hasNext={modalIndex < scenes.length - 1}
        user={user}
        isLiked={social.isLiked(modalScene?.id)}
        isFavourite={social.isFavourite(modalScene?.id)}
        onLike={(id, count, setCount) => social.toggleLike(id, count, setCount)}
        onFavourite={(id) => social.toggleFavourite(id)}
      />

      {/* Auth modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => { setUser(u); setIsAuthOpen(false); }}
      />

      {/* Upload modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        userId={user?.id}
        onSuccess={handleUploadSuccess}
      />

      {/* Collection panel */}
      <CollectionPanel
        isOpen={isCollectionOpen}
        onClose={() => setIsCollectionOpen(false)}
        user={user}
        onSceneClick={(scene) => {
          setModalScene(scene);
          setModalIndex(-1);
          setScenes([]);
        }}
      />
    </div>
  );
}

export default App;
