export const DEFAULT_RATINGS = {
  space: 4,
  material: 4,
  structure: 4,
  site: 4,
  inspiration: 4,
}

export const RATING_FIELDS = [
  { key: 'space', label: '空间组织' },
  { key: 'material', label: '材料表达' },
  { key: 'structure', label: '结构创新' },
  { key: 'site', label: '场地回应' },
  { key: 'inspiration', label: '设计启发' },
]

const clampRating = (value) => {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return 4
  }

  return Math.min(5, Math.max(1, Math.round(numberValue)))
}

export const normalizeRatings = (ratings = {}) =>
  RATING_FIELDS.reduce(
    (result, field) => ({
      ...result,
      [field.key]: clampRating(ratings[field.key]),
    }),
    {},
  )

export const calculateAverageRating = (ratings = {}) => {
  const normalizedRatings = normalizeRatings(ratings)
  const total = RATING_FIELDS.reduce((sum, field) => sum + normalizedRatings[field.key], 0)

  return total / RATING_FIELDS.length
}

export const formatAverageRating = (ratings = {}) => calculateAverageRating(ratings).toFixed(1)

export const renderRatingStars = (score) => {
  const rating = clampRating(score)
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
