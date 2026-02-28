import { useEffect, useRef, useCallback } from "react";

/**
 * Calls `onLoadMore` when the sentinel element enters the viewport.
 * @param {boolean} hasMore  — whether more pages exist
 * @param {boolean} loading  — whether a fetch is in progress
 * @param {Function} onLoadMore — callback to trigger next page
 */
export const useInfiniteScroll = (hasMore, loading, onLoadMore) => {
  const sentinelRef = useRef(null);

  const observe = useCallback(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }  // trigger 200px before bottom
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    const cleanup = observe();
    return cleanup;
  }, [observe]);

  return sentinelRef;
};
