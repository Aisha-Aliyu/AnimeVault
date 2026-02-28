import { useState, useCallback, useMemo } from "react";

export const useFilters = () => {
  const [search,       setSearch]       = useState("");
  const [selectedTags, setSelectedTags] = useState([]);   // tag IDs
  const [selectedGenre,setSelectedGenre]= useState(null); // genre string
  const [animeId,      setAnimeId]      = useState(null); // AniList anime ID
  const [animeName,    setAnimeName]    = useState("");   // for display
  const [sort,         setSort]         = useState("newest");

  const toggleTag = useCallback((tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }, []);

  const clearTag = useCallback((tagId) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagId));
  }, []);

  const clearAll = useCallback(() => {
    setSearch("");
    setSelectedTags([]);
    setSelectedGenre(null);
    setAnimeId(null);
    setAnimeName("");
    setSort("newest");
  }, []);

  const hasActiveFilters = useMemo(
    () => !!search || selectedTags.length > 0 || !!selectedGenre || !!animeId,
    [search, selectedTags, selectedGenre, animeId]
  );

  // What gets passed to Gallery / sceneService
  const filterPayload = useMemo(() => ({
    search,
    tagIds:  selectedTags,
    animeId,
    genre:   selectedGenre,
  }), [search, selectedTags, animeId, selectedGenre]);

  return {
    // values
    search, selectedTags, selectedGenre, animeId, animeName, sort,
    // setters
    setSearch, setSelectedGenre, setAnimeId, setAnimeName, setSort,
    // actions
    toggleTag, clearTag, clearAll,
    // derived
    hasActiveFilters, filterPayload,
  };
};
