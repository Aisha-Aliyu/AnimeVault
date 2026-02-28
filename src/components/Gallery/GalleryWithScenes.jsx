import { useState } from "react";
import Gallery from "./Gallery";

const GalleryWithScenes = ({ filters, sort, onSortChange, onSceneClick }) => {
  const [loadedScenes, setLoadedScenes] = useState([]);

  return (
    <Gallery
      filters={filters}
      sort={sort}
      onSortChange={onSortChange}
      onSceneClick={(scene) => onSceneClick(scene, loadedScenes)}
      onScenesLoaded={setLoadedScenes}
    />
  );
};

export default GalleryWithScenes;
