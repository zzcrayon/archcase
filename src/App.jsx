import { useEffect, useState } from 'react'
import { cases, categories } from './data/cases'
import CaseCard from './components/CaseCard'
import CaseDetailModal from './components/CaseDetailModal'
import DataTools from './components/DataTools'
import CaseModal from './components/CaseModal'
import StatsPanel from './components/StatsPanel'
import AdminLogin from './components/AdminLogin'
import { normalizeRatings } from './utils/ratings'

const STORAGE_KEY = 'archcase_cases'
const ADMIN_SESSION_KEY = 'archcase_admin_session'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const defaultImageById = new Map(cases.map((caseItem) => [caseItem.id, caseItem.image]))
const defaultImageByName = new Map(cases.map((caseItem) => [caseItem.name, caseItem.image]))
const defaultImageByType = new Map(cases.map((caseItem) => [caseItem.type, caseItem.image]))

const isStoredLocalAssetPath = (image = '') =>
  image.startsWith('./assets') ||
  image.startsWith('/src/assets') ||
  image.startsWith('src/assets') ||
  image.startsWith('/assets/')

const getDefaultImageForCase = (caseItem) =>
  defaultImageById.get(caseItem.id) ||
  defaultImageByName.get(caseItem.name) ||
  defaultImageByType.get(caseItem.type) ||
  cases[0].image

const normalizeImage = (caseItem) => {
  const image = typeof caseItem.image === 'string' ? caseItem.image.trim() : ''

  if (!image || isStoredLocalAssetPath(image)) {
    return getDefaultImageForCase(caseItem)
  }

  return image
}

const normalizeCase = (caseItem) => ({
  ...caseItem,
  id: caseItem.id ?? Date.now(),
  image: normalizeImage(caseItem),
  tags: Array.isArray(caseItem.tags) ? caseItem.tags : [],
  ratings: normalizeRatings(caseItem.ratings),
})

const getSafeImage = (image, fallbackCase) => {
  const nextImage = typeof image === 'string' ? image.trim() : ''

  if (!nextImage || isStoredLocalAssetPath(nextImage)) {
    return normalizeImage(fallbackCase)
  }

  return nextImage
}

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

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || '请求失败')
  }

  return response.json()
}

const uploadImageFile = async (imageBlob, fileName, adminToken) => {
  if (!adminToken) {
    throw new Error('请先登录管理员账号')
  }

  const formData = new FormData()
  formData.append('image', imageBlob, fileName)

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || '图片上传失败')
  }

  const data = await response.json()
  return data.url
}

const loadAdminSession = () => {
  try {
    const savedSession = sessionStorage.getItem(ADMIN_SESSION_KEY)
    return savedSession ? JSON.parse(savedSession) : null
  } catch {
    return null
  }
}

function App() {
  const [allCases, setAllCases] = useState(loadCasesFromStorage)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCase, setEditingCase] = useState(null)
  const [selectedCase, setSelectedCase] = useState(null)
  const [storageError, setStorageError] = useState('')
  const [isUsingLocalCache, setIsUsingLocalCache] = useState(false)
  const [adminSession, setAdminSession] = useState(loadAdminSession)
  const isAdmin = Boolean(adminSession?.token)

  const persistLocalCache = (nextCases, { silent = false } = {}) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCases))
      return true
    } catch (error) {
      console.error('保存到 localStorage 失败：', error)
      const message = '保存失败：图片或案例数据可能过大。系统已保留原来的案例数据，请更换图片后再试。'

      if (!silent) {
        setStorageError(message)
        window.alert(message)
      }

      return false
    }
  }

  useEffect(() => {
    let ignore = false

    const loadCasesFromApi = async () => {
      try {
        const apiCases = await requestJson('/cases')
        const normalizedCases = Array.isArray(apiCases)
          ? apiCases.map(normalizeCase)
          : cases.map(normalizeCase)

        if (ignore) {
          return
        }

        setAllCases(normalizedCases)
        persistLocalCache(normalizedCases, { silent: true })
        setIsUsingLocalCache(false)
        setStorageError('')
      } catch (error) {
        console.error('连接后端失败：', error)

        if (ignore) {
          return
        }

        setAllCases(loadCasesFromStorage())
        setIsUsingLocalCache(true)
        setStorageError('后端连接失败，当前使用本地缓存数据')
      }
    }

    loadCasesFromApi()

    return () => {
      ignore = true
    }
  }, [])

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const filteredCases = allCases.filter((item) => {
    const matchesCategory = activeCategory === '全部' || item.type === activeCategory
    const tags = Array.isArray(item.tags) ? item.tags : []

    const searchableText = [
      item.name,
      item.architect,
      item.city,
      item.country,
      item.type,
      item.description,
      item.inspiration,
      tags.join(' '),
    ]
      .join(' ')
      .toLowerCase()

    const matchesSearch =
      normalizedSearchTerm === '' || searchableText.includes(normalizedSearchTerm)

    return matchesCategory && matchesSearch
  })

  const openAddModal = () => {
    if (!isAdmin) {
      window.alert('请先登录管理员账号')
      return
    }

    setEditingCase(null)
    setIsModalOpen(true)
  }

  const openEditModal = (caseItem) => {
    if (!isAdmin) {
      window.alert('请先登录管理员账号')
      return
    }

    setSelectedCase(null)
    setEditingCase(caseItem)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setEditingCase(null)
    setIsModalOpen(false)
  }

  const buildNextCases = (caseData) => {
    const getNextCases = (currentCases) => {
      const fallbackImage = normalizeImage(currentCases[0] || cases[0])

      if (editingCase) {
        return currentCases.map((item) =>
          item.id === editingCase.id
            ? {
                ...item,
                ...caseData,
                image: getSafeImage(caseData.image, { ...item, image: item.image || fallbackImage }),
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
          image: getSafeImage(caseData.image, caseData),
          ratings: normalizeRatings(caseData.ratings),
        },
      ]
    }

    return getNextCases(allCases).map(normalizeCase)
  }

  const handleSaveCase = async (caseData) => {
    if (!isAdmin) {
      window.alert('请先登录管理员账号')
      return
    }

    if (isUsingLocalCache) {
      const nextCases = buildNextCases(caseData)

      if (!persistLocalCache(nextCases)) {
        return
      }

      setAllCases(nextCases)
      closeModal()
      return
    }

    try {
      if (editingCase) {
        const fallbackImage = normalizeImage(editingCase)
        const payload = {
          ...caseData,
          image: getSafeImage(caseData.image, { ...editingCase, image: editingCase.image || fallbackImage }),
          ratings: normalizeRatings(caseData.ratings),
        }
        const updatedCase = normalizeCase(
          await requestJson(`/cases/${editingCase.id}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${adminSession.token}`,
            },
            body: JSON.stringify(payload),
          }),
        )
        const nextCases = allCases.map((item) => (item.id === editingCase.id ? updatedCase : item))

        setAllCases(nextCases)
        persistLocalCache(nextCases, { silent: true })
        setStorageError('')
        closeModal()
        return
      }

      const payload = {
        ...caseData,
        image: getSafeImage(caseData.image, caseData),
        ratings: normalizeRatings(caseData.ratings),
      }
      const createdCase = normalizeCase(
        await requestJson('/cases', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminSession.token}`,
          },
          body: JSON.stringify(payload),
        }),
      )
      const nextCases = [createdCase, ...allCases]

      setAllCases(nextCases)
      persistLocalCache(nextCases, { silent: true })
      setStorageError('')
      closeModal()
    } catch (error) {
      console.error('保存案例失败：', error)
      window.alert('保存失败，请检查后端服务是否正常运行')
    }
  }

  const handleDeleteCase = async (caseId) => {
    if (!isAdmin) {
      window.alert('请先登录管理员账号')
      return
    }

    const shouldDelete = window.confirm('确定要删除这个建筑案例吗？')

    if (!shouldDelete) {
      return
    }

    const nextCases = allCases.filter((item) => item.id !== caseId)

    if (isUsingLocalCache) {
      if (!persistLocalCache(nextCases)) {
        return
      }

      setAllCases(nextCases)
      return
    }

    try {
      await requestJson(`/cases/${caseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
        },
      })
      setAllCases(nextCases)
      persistLocalCache(nextCases, { silent: true })
      setStorageError('')
    } catch (error) {
      console.error('删除案例失败：', error)
      window.alert('删除失败，请检查后端服务是否正常运行')
    }
  }

  const handleImportCases = (importedCases) => {
    if (!isAdmin) {
      window.alert('请先登录管理员账号')
      return
    }

    const importedAt = Date.now()
    const normalizedCases = importedCases.map((item, index) =>
      normalizeCase({
        ...item,
        id: item.id ?? importedAt + index,
      }),
    )

    if (!persistLocalCache(normalizedCases)) {
      return
    }

    setIsUsingLocalCache(true)
    setStorageError('导入数据已保存到本地缓存，后续可再接入后端批量导入接口')
    setSelectedCase(null)
    setEditingCase(null)
    setIsModalOpen(false)
    setAllCases(normalizedCases)
  }

  const handleResetCases = () => {
    if (!isAdmin) {
      window.alert('请先登录管理员账号')
      return
    }

    const shouldReset = window.confirm('重置默认案例会清除当前本地保存的数据，是否继续？')

    if (!shouldReset) {
      return
    }

    localStorage.removeItem(STORAGE_KEY)
    setStorageError('')
    setIsUsingLocalCache(true)
    setSearchTerm('')
    setActiveCategory('全部')
    setSelectedCase(null)
    setEditingCase(null)
    setIsModalOpen(false)
    setAllCases(cases.map(normalizeCase))
  }

  const handleAdminLogin = async (loginData) => {
    try {
      const loginResult = await requestJson('/admin/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      })
      const nextSession = {
        token: loginResult.token,
        username: loginResult.user?.username || loginData.username,
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextSession))
      setAdminSession(nextSession)
      return nextSession
    } catch (error) {
      console.error('管理员登录失败：', error)
      window.alert('管理员登录失败，请检查用户名和密码')
      throw error
    }
  }

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setAdminSession(null)
    setEditingCase(null)
    setIsModalOpen(false)
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
            <p className="hero-description">
              A personal architecture reference system built with React + Vite.
              <br />
              用于建筑案例收藏、评分、分析与资料管理的前端作品。
            </p>
            <div className="hero-tags" aria-label="项目标签">
              <span>React / Vite</span>
              <span>Architecture Research</span>
              <span>Portfolio Project</span>
            </div>
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

      <AdminLogin
        adminSession={adminSession}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
      />

      {isAdmin && (
        <DataTools cases={allCases} onImportCases={handleImportCases} onResetCases={handleResetCases} />
      )}

      <section className="storage-notice" aria-label="本地存储提示">
        当前版本使用浏览器本地存储，新增和编辑的数据仅保存在当前设备，请使用 JSON
        导出功能备份数据。
      </section>

      {storageError && (
        <section className="storage-notice storage-warning" aria-live="polite">
          {storageError}
        </section>
      )}

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
              isAdmin={isAdmin}
              key={item.id}
            />
          ))}
        </section>
      ) : (
        <section className="empty-state" aria-live="polite">
          没有找到相关建筑案例
        </section>
      )}

      {isAdmin && (
        <button className="add-button" type="button" onClick={openAddModal}>
          添加案例
        </button>
      )}

      {isModalOpen && (
        <CaseModal
          categories={categories}
          initialCase={editingCase}
          onClose={closeModal}
          onSaveCase={handleSaveCase}
          onUploadImage={(imageBlob, fileName) =>
            uploadImageFile(imageBlob, fileName, adminSession?.token)
          }
        />
      )}

      {selectedCase && (
        <CaseDetailModal item={selectedCase} onClose={() => setSelectedCase(null)} />
      )}

      <footer className="site-footer">
        <span>ArchCase © 2026</span>
        <span>Designed & developed by zzcrayon</span>
        <span>Built with React + Vite</span>
        <span>Data stored locally in your browser</span>
      </footer>
    </main>
  )
}

export default App
