import { calculateAverageRating } from '../utils/ratings'

function StatsPanel({ cases, categories }) {
  const categoryOptions = categories.filter((category) => category !== '全部')
  const totalCases = cases.length

  const typeCounts = categoryOptions.map((category) => ({
    name: category,
    count: cases.filter((item) => item.type === category).length,
  }))

  const activeTypeCount = typeCounts.filter((item) => item.count > 0).length

  const caseScores = cases.map((item) => ({
    id: item.id,
    name: item.name,
    architect: item.architect,
    score: calculateAverageRating(item.ratings),
  }))

  const averageScore =
    caseScores.length > 0
      ? (caseScores.reduce((sum, item) => sum + item.score, 0) / caseScores.length).toFixed(1)
      : '0.0'

  const topCases = [...caseScores].sort((first, second) => second.score - first.score).slice(0, 3)

  const highestCase = topCases[0]?.name || '暂无案例'

  const tagCounts = cases.reduce((result, item) => {
    item.tags.forEach((tag) => {
      result[tag] = (result[tag] || 0) + 1
    })

    return result
  }, {})

  const frequentTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((first, second) => second.count - first.count || first.tag.localeCompare(second.tag, 'zh-CN'))
    .slice(0, 8)

  const maxTypeCount = Math.max(...typeCounts.map((item) => item.count), 1)

  return (
    <section className="stats-panel" aria-label="数据概览">
      <div className="stats-header">
        <div>
          <p className="eyebrow">LIBRARY ANALYTICS</p>
          <h2>数据概览</h2>
        </div>
        <span>Auto Updated</span>
      </div>

      <div className="overview-grid">
        <article className="overview-card">
          <span>案例总数</span>
          <strong>{totalCases.toString().padStart(2, '0')}</strong>
        </article>
        <article className="overview-card">
          <span>建筑类型数量</span>
          <strong>{activeTypeCount.toString().padStart(2, '0')}</strong>
        </article>
        <article className="overview-card">
          <span>平均综合评分</span>
          <strong>{averageScore}</strong>
        </article>
        <article className="overview-card">
          <span>评分最高案例</span>
          <strong>{highestCase}</strong>
        </article>
      </div>

      <div className="stats-grid">
        <article className="stats-block">
          <h3>类型分布</h3>
          <div className="type-list">
            {typeCounts.map((item) => (
              <div className="type-row" key={item.name}>
                <div>
                  <span>{item.name}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="type-bar">
                  <span style={{ width: `${(item.count / maxTypeCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="stats-block">
          <h3>高频标签</h3>
          {frequentTags.length > 0 ? (
            <div className="tag-frequency-list">
              {frequentTags.map((item) => (
                <span key={item.tag}>
                  {item.tag} × {item.count}
                </span>
              ))}
            </div>
          ) : (
            <p className="stats-empty">暂无标签</p>
          )}
        </article>

        <article className="stats-block high-score-block">
          <h3>高分案例</h3>
          {topCases.length > 0 ? (
            <ol className="top-case-list">
              {topCases.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.architect}</span>
                  </div>
                  <em>{item.score.toFixed(1)}</em>
                </li>
              ))}
            </ol>
          ) : (
            <p className="stats-empty">暂无案例</p>
          )}
        </article>
      </div>
    </section>
  )
}

export default StatsPanel
