const ANILIST_URL = "https://graphql.anilist.co";

const ANIME_FIELDS = `
  id
  title { english romaji }
  coverImage { extraLarge large color }
  bannerImage
  genres
  averageScore
  popularity
  seasonYear
  season
  description(asHtml: false)
  episodes
  status
`;

const query = async (gql, variables = {}) => {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: gql, variables }),
  });
  if (!res.ok) throw new Error(`AniList error: ${res.status}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  return data;
};

/**
 * Fetch trending anime for the hero / seed data
 */
export const fetchTrending = async (page = 1, perPage = 20) => {
  const gql = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await query(gql, { page, perPage });
  return data.Page.media;
};

/**
 * Search anime by title
 */
export const searchAnime = async (search, page = 1, perPage = 10) => {
  const gql = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, search: $search, isAdult: false, sort: SEARCH_MATCH) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await query(gql, { search, page, perPage });
  return data.Page.media;
};

/**
 * Fetch anime by genre
 */
export const fetchByGenre = async (genre, page = 1, perPage = 20) => {
  const gql = `
    query ($genre: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, genre: $genre, isAdult: false, sort: POPULARITY_DESC) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await query(gql, { genre, page, perPage });
  return data.Page.media;
};

/**
 * Fetch single anime by ID
 */
export const fetchAnimeById = async (id) => {
  const gql = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${ANIME_FIELDS}
      }
    }
  `;
  const data = await query(gql, { id });
  return data.Media;
};

/**
 * Map AniList response to our DB schema
 */
export const mapAnimeToDb = (anime) => ({
  id:            anime.id,
  title_english: anime.title?.english || null,
  title_romaji:  anime.title?.romaji  || "Unknown",
  cover_image:   anime.coverImage?.extraLarge || anime.coverImage?.large || null,
  banner_image:  anime.bannerImage || null,
  genres:        anime.genres || [],
  average_score: anime.averageScore || null,
  popularity:    anime.popularity || null,
  year:          anime.seasonYear || null,
  season:        anime.season || null,
});
