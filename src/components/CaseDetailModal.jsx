import { useEffect, useState } from 'react'
import { RATING_FIELDS, normalizeRatings, renderRatingStars } from '../utils/ratings'

function CaseDetailModal({ item, onClose }) {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [hasImageError, setHasImageError] = useState(false)
  const ratings = normalizeRatings(item.ratings)

  useEffect(() => {
    setHasImageError(false)
  }, [item.image])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return
      }

      if (isImagePreviewOpen) {
        setIsImagePreviewOpen(false)
        return
      }

      onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isImagePreviewOpen, onClose])

  const detailRows = [
    ['建筑师', item.architect],
    ['地点', `${item.city || '未知城市'}，${item.country || '未知国家'}`],
    ['类型', item.type],
    ['年份', item.year || '未记录'],
  ]

  const analysisBlocks = [
    {
      title: '空间特征',
      text: item.description || '可以从空间序列、尺度变化、光线进入方式等角度继续补充分析。',
    },
    {
      title: '材料与结构',
      text: item.inspiration || '可以记录主要材料、结构逻辑，以及它们如何共同形成建筑表达。',
    },
    {
      title: '场地关系',
      text: item.description || '可以分析建筑如何回应城市、自然、地形、道路或周边公共空间。',
    },
    {
      title: '可借鉴的设计方法',
      text: item.inspiration || '可以总结这个案例中值得学习的设计策略，并转化为自己的方案方法。',
    },
  ]

  return (
    <div className="modal-backdrop detail-backdrop" onClick={onClose}>
      <section
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close detail-close" type="button" onClick={onClose} aria-label="关闭详情">
          ×
        </button>

        <button
          className="detail-image-wrap"
          type="button"
          onClick={() => setIsImagePreviewOpen(true)}
          aria-label={`查看${item.name}大图`}
        >
          {item.image && !hasImageError ? (
            <img
              src={item.image}
              alt={`${item.name}建筑详情图片`}
              className="detail-image"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <div className="detail-image-placeholder">
              <span>{item.name}</span>
            </div>
          )}
          {!hasImageError && <span className="detail-image-hint">点击查看大图</span>}
        </button>

        <div className="detail-content">
          <p className="modal-eyebrow">CASE DETAIL</p>
          <div className="detail-heading">
            <h2 id="detail-modal-title">{item.name}</h2>
            <span>{item.year || 'N/A'}</span>
          </div>

          <dl className="detail-meta">
            {detailRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="tag-list detail-tags">
            {item.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <section className="detail-ratings">
            <h3>案例评分</h3>
            <div className="rating-list">
              {RATING_FIELDS.map((field) => (
                <div className="rating-row" key={field.key}>
                  <span>{field.label}</span>
                  <strong>{renderRatingStars(ratings[field.key])}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h3>简介</h3>
            <p>{item.description || '暂无简介。'}</p>
          </section>

          <section className="detail-section">
            <h3>设计启发</h3>
            <p>{item.inspiration || '暂无设计启发。'}</p>
          </section>

          <div className="analysis-grid">
            {analysisBlocks.map((block) => (
              <section className="analysis-block" key={block.title}>
                <h3>{block.title}</h3>
                <p>{block.text}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      {isImagePreviewOpen && !hasImageError && (
        <div
          className="image-preview-backdrop"
          onClick={(event) => {
            event.stopPropagation()
            setIsImagePreviewOpen(false)
          }}
        >
          <button
            className="image-preview-close"
            type="button"
            onClick={() => setIsImagePreviewOpen(false)}
            aria-label="关闭大图预览"
          >
            ×
          </button>
          <img
            src={item.image}
            alt={`${item.name}建筑大图预览`}
            className="image-preview"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default CaseDetailModal
