import { useEffect, useState } from 'react'
import { formatAverageRating } from '../utils/ratings'

function CaseCard({ item, displayIndex, onDelete, onEdit, onView }) {
  const [hasImageError, setHasImageError] = useState(false)
  const displayNumber = String(displayIndex + 1).padStart(2, '0')
  const averageRating = formatAverageRating(item.ratings)

  useEffect(() => {
    setHasImageError(false)
  }, [item.image])

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onView(item)
    }
  }

  const handleEdit = (event) => {
    event.stopPropagation()
    onEdit(item)
  }

  const handleDelete = (event) => {
    event.stopPropagation()
    onDelete(item.id)
  }

  return (
    <article
      className="case-card"
      role="button"
      tabIndex="0"
      onClick={() => onView(item)}
      onKeyDown={handleKeyDown}
    >
      <div className="case-image-wrap">
        {item.image && !hasImageError ? (
          <img
            src={item.image}
            alt={`${item.name}建筑图片`}
            className="case-image"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className="image-placeholder">
            <span>{item.name}</span>
          </div>
        )}
        <span className="case-card-index">{displayNumber}</span>
      </div>
      <div className="case-body">
        <div className="case-heading">
          <div>
            <p className="case-type">{item.type}</p>
            <h2>{item.name}</h2>
          </div>
          <span className="case-year">{item.year}</span>
        </div>

        <dl className="case-info">
          <div>
            <dt>建筑师</dt>
            <dd>{item.architect}</dd>
          </div>
          <div>
            <dt>地点</dt>
            <dd>
              {item.city}，{item.country}
            </dd>
          </div>
        </dl>

        <div className="tag-list">
          {item.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="case-rating-summary">
          <span>综合评分</span>
          <strong>{averageRating}</strong>
        </div>

        <p className="case-description">{item.description}</p>
        <p className="case-inspiration">{item.inspiration}</p>

        <div className="case-actions">
          <button type="button" onClick={handleEdit}>
            编辑
          </button>
          <button type="button" onClick={handleDelete}>
            删除
          </button>
        </div>
      </div>
    </article>
  )
}

export default CaseCard
