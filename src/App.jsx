import { useEffect, useState } from 'react'
import { cases, categories } from './data/cases'
import CaseCard from './components/CaseCard'
import CaseDetailModal from './components/CaseDetailModal'
import DataTools from './components/DataTools'
import CaseModal from './components/CaseModal'
import StatsPanel from './components/StatsPanel'
import { normalizeRatings } from './utils/ratings'

const STORAGE_KEY = 'archcase_cases'

const normalizeCase = (caseItem) => ({
  ...caseItem,
  id: caseItem.id ?? Date.now(),
  tags: Array.isArray(caseItem.tags) ? caseItem.tags : [],
  ratings: normalizeRatings(caseItem.ratings),
})

const loadCasesFromStorage = () => {
  const savedCases = localStorage.getItem(STORAGE_KEY)

  if (!savedCases) {
    return cases.map(normalizeCase)
  }

  try {
    const parsedCases = JSON.parse(savedCases)
    return Array.isArray(parsedCases) ? parsedCases.map(normalizeCase) : cases.map(normalizeCase)
  } catch {
    return cases.map(normalizeCase)
  }
}

function App() {
  const [allCases, setAllCases] = useState(loadCasesFromStorage)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCase, setEditingCase] = useState(null)
  const [selectedCase, setSelectedCase] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCases))
  }, [allCases])

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const filteredCases = allCases.filter((item) => {
    const matchesCategory = activeCategory === '全部' || item.type === activeCategory

    const searchableText = [
      item.name,
      item.architect,
      item.city,
      item.country,
      item.type,
      item.description,
      item.inspiration,
      item.tags.join(' '),
    ]
      .join(' ')
      .toLowerCase()

    const matchesSearch =
      normalizedSearchTerm === '' || searchableText.includes(normalizedSearchTerm)

    return matchesCategory && matchesSearch
  })

  const openAddModal = () => {
    setEditingCase(null)
    setIsModalOpen(true)
  }

  const openEditModal = (caseItem) => {
    setSelectedCase(null)
    setEditingCase(caseItem)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setEditingCase(null)
    setIsModalOpen(false)
  }

  const handleSaveCase = (caseData) => {
    setAllCases((currentCases) => {
      const fallbackImage = currentCases[0]?.image || cases[0].image

      if (editingCase) {
        return currentCases.map((item) =>
          item.id === editingCase.id
            ? {
                ...item,
                ...caseData,
                image: caseData.image || item.image || fallbackImage,
                ratings: normalizeRatings(caseData.ratings),
              }
            : item,
        )
      }

      return [
        ...currentCases,
        {
          ...caseData,
          id: Date.now(),
          image: caseData.image || fallbackImage,
          ratings: normalizeRatings(caseData.ratings),
        },
      ]
    })

    closeModal()
  }

  const handleDeleteCase = (caseId) => {
    const shouldDelete = window.confirm('确定要删除这个建筑案例吗？')

    if (!shouldDelete) {
      return
    }

    setAllCases((currentCases) => currentCases.filter((item) => item.id !== caseId))
  }

  const handleImportCases = (importedCases) => {
    const importedAt = Date.now()
    const normalizedCases = importedCases.map((item, index) =>
      normalizeCase({
        ...item,
        id: item.id ?? importedAt + index,
      }),
    )

    setSelectedCase(null)
    setEditingCase(null)
    setIsModalOpen(false)
    setAllCases(normalizedCases)
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">ARCHITECTURE REFERENCES / CASE STUDY LIBRARY</p>
        <div className="hero-content">
          <div className="hero-title-group">
            <p className="hero-kicker">ARCH CASE</p>
            <h1>ArchCase 建筑案例灵感库</h1>
            <p className="subtitle">
              收藏、整理与分析你的建筑案例，用作品集的方式建立自己的设计参考系统。
            </p>
          </div>
          <div className="hero-meta">
            <div>
              <span>{allCases.length.toString().padStart(2, '0')}</span>
              <small>Cases</small>
            </div>
            <div>
              <span>{(categories.length - 1).toString().padStart(2, '0')}</span>
              <small>Categories</small>
            </div>
            <div>
              <span>Portfolio</span>
              <small>View Mode</small>
            </div>
          </div>
        </div>
      </section>

      <section className="control-panel" aria-label="案例搜索与分类筛选">
        <label className="search-box">
          <span>搜索案例</span>
          <input
            type="search"
            placeholder="输入建筑名称、城市或标签"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <div className="category-list" aria-label="分类筛选">
          {categories.map((category) => (
            <button
              className={category === activeCategory ? 'category-button active' : 'category-button'}
              type="button"
              key={category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <DataTools cases={allCases} onImportCases={handleImportCases} />

      <StatsPanel cases={allCases} categories={categories} />

      {filteredCases.length > 0 ? (
        <section className="case-grid" aria-label="建筑案例卡片网格">
          {filteredCases.map((item, index) => (
            <CaseCard
              item={item}
              displayIndex={index}
              onDelete={handleDeleteCase}
              onEdit={openEditModal}
              onView={setSelectedCase}
              key={item.id}
            />
          ))}
        </section>
      ) : (
        <section className="empty-state" aria-live="polite">
          没有找到相关建筑案例
        </section>
      )}

      <button className="add-button" type="button" onClick={openAddModal}>
        添加案例
      </button>

      {isModalOpen && (
        <CaseModal
          categories={categories}
          initialCase={editingCase}
          onClose={closeModal}
          onSaveCase={handleSaveCase}
        />
      )}

      {selectedCase && (
        <CaseDetailModal item={selectedCase} onClose={() => setSelectedCase(null)} />
      )}
    </main>
  )
}

export default App
