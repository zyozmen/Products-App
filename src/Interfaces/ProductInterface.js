/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {string} sku
 * @property {string} status
 * @property {string[]} category_ids
 * @property {Array<{name: string, slug: string, category_id: string}>} categories
 * @property {{
 *   current: number,
 *   original: number,
 *   currency: string,
 *   discount_percentage: number,
 *   tax_inclusive: boolean
 * }} price
 * @property {{
 *   average_rating: number,
 *   total_reviews: number,
 *   rating_distribution: {
 *     '5_star': number,
 *     '4_star': number,
 *     '3_star': number,
 *     '2_star': number,
 *     '1_star': number
 *   }
 * }} ranking
 * @property {Array<{
 *   username: string,
 *   rating: number,
 *   title: string,
 *   body: string,
 *   comment_id: string,
 *   user_id: string,
 *   created_at: string
 * }>} recent_comments
 * @property {string} created_at
 * @property {string} updated_at
 */

const toCategory = (raw = {}) => ({
  name: String(raw.name ?? ""),
  slug: String(raw.slug ?? ""),
  category_id: String(raw.category_id ?? ""),
});

const toPrice = (raw = {}) => ({
  current: Number(raw.current ?? raw.current_price ?? raw.price_current ?? raw.price ?? 0),
  original: Number(raw.original ?? raw.original_price ?? 0),
  currency: String(raw.currency ?? raw.price_currency ?? "USD"),
  discount_percentage: Number(raw.discount_percentage ?? 0),
  tax_inclusive: Boolean(raw.tax_inclusive ?? false),
});

const toRatingDistribution = (raw = {}) => ({
  "5_star": Number(raw["5_star"] ?? 0),
  "4_star": Number(raw["4_star"] ?? 0),
  "3_star": Number(raw["3_star"] ?? 0),
  "2_star": Number(raw["2_star"] ?? 0),
  "1_star": Number(raw["1_star"] ?? 0),
});

const toRanking = (raw = {}) => ({
  average_rating: Number(raw.average_rating ?? 0),
  total_reviews: Number(raw.total_reviews ?? 0),
  rating_distribution: toRatingDistribution(raw.rating_distribution),
});

const toRecentComment = (raw = {}) => ({
  username: String(raw.username ?? ""),
  rating: Number(raw.rating ?? 0),
  title: String(raw.title ?? ""),
  body: String(raw.body ?? ""),
  comment_id: String(raw.comment_id ?? ""),
  user_id: String(raw.user_id ?? ""),
  created_at: String(raw.created_at ?? ""),
});

export const toProduct = (raw = {}) => ({
  id: String(raw.id ?? ""),
  name: String(raw.name ?? raw.nombre ?? raw.Nombre ?? raw.Description ?? ""),
  slug: String(raw.slug ?? ""),
  description: String(raw.description ?? raw.descripcion ?? raw.Descripcion ?? ""),
  sku: String(raw.sku ?? ""),
  status: String(raw.status ?? ""),
  category_ids: Array.isArray(raw.category_ids)
    ? raw.category_ids.map((categoryId) => String(categoryId))
    : Array.isArray(raw.categories)
      ? raw.categories.map((category) => String(category.category_id ?? category.id ?? "")).filter(Boolean)
      : [],
  categories: Array.isArray(raw.categories)
    ? raw.categories.map(toCategory)
    : [],
  price: toPrice(raw.price ?? raw),
  ranking: toRanking(raw.ranking ?? raw),
  recent_comments: Array.isArray(raw.recent_comments)
    ? raw.recent_comments.map(toRecentComment)
    : [],
  created_at: String(raw.created_at ?? ""),
  updated_at: String(raw.updated_at ?? ""),
});

export const toProductList = (rawList) =>
  Array.isArray(rawList)
    ? rawList.map(toProduct)
    : Array.isArray(rawList?.content)
      ? rawList.content.map(toProduct)
      : [];