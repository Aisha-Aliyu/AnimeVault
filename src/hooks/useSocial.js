import { useState, useEffect, useCallback } from "react";
import {
  getLikedSceneIds, likeScene, unlikeScene,
  getFavouriteSceneIds, favouriteScene, unfavouriteScene,
} from "../services/socialService";

export const useSocial = (user) => {
  const [likedIds,     setLikedIds]     = useState(new Set());
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [loading,      setLoading]      = useState(false);

  // Load user's likes + favourites on auth
  useEffect(() => {
    if (!user?.id) {
      setLikedIds(new Set());
      setFavouriteIds(new Set());
      return;
    }
    setLoading(true);
    Promise.all([
      getLikedSceneIds(user.id),
      getFavouriteSceneIds(user.id),
    ]).then(([liked, faved]) => {
      setLikedIds(new Set(liked));
      setFavouriteIds(new Set(faved));
      setLoading(false);
    });
  }, [user?.id]);

  const toggleLike = useCallback(async (sceneId, currentCount, onCountUpdate) => {
    if (!user?.id) return false; // not logged in
    const isLiked = likedIds.has(sceneId);

    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
    onCountUpdate?.(isLiked ? currentCount - 1 : currentCount + 1);

    const fn = isLiked ? unlikeScene : likeScene;
    const { error } = await fn(user.id, sceneId);

    // Rollback on error
    if (error) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(sceneId);
        else next.delete(sceneId);
        return next;
      });
      onCountUpdate?.(currentCount);
    }

    return !isLiked;
  }, [user?.id, likedIds]);

  const toggleFavourite = useCallback(async (sceneId) => {
    if (!user?.id) return false;
    const isFaved = favouriteIds.has(sceneId);

    // Optimistic update
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (isFaved) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });

    const fn = isFaved ? unfavouriteScene : favouriteScene;
    const { error } = await fn(user.id, sceneId);

    // Rollback on error
    if (error) {
      setFavouriteIds((prev) => {
        const next = new Set(prev);
        if (isFaved) next.add(sceneId);
        else next.delete(sceneId);
        return next;
      });
    }

    return !isFaved;
  }, [user?.id, favouriteIds]);

  return {
    likedIds, favouriteIds,
    isLiked:    (id) => likedIds.has(id),
    isFavourite:(id) => favouriteIds.has(id),
    toggleLike, toggleFavourite,
    loading,
  };
};
