import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import multer from 'multer'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '..')
const dataFile = path.join(serverRoot, 'data', 'cases.json')
const uploadsDir = path.join(serverRoot, 'uploads')
const adminTokens = new Set()

const app = express()
const port = Number(process.env.PORT) || 3001
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(uploadsDir))

const uploadStorage = multer.diskStorage({
  destination: uploadsDir,
  filename(req, file, callback) {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
    callback(null, safeName)
  },
})

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true)
      return
    }

    callback(new Error('只支持 jpg、jpeg、png 或 webp 图片'))
  },
})

const readCases = async () => {
  try {
    const fileContent = await fs.readFile(dataFile, 'utf-8')
    const parsedCases = JSON.parse(fileContent)
    return Array.isArray(parsedCases) ? parsedCases : []
  } catch {
    return []
  }
}

const writeCases = async (cases) => {
  const tempFile = `${dataFile}.tmp`
  await fs.writeFile(tempFile, JSON.stringify(cases, null, 2), 'utf-8')
  await fs.rename(tempFile, dataFile)
}

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean)
  }

  if (typeof tags === 'string') {
    return tags
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  return []
}

const normalizeCase = (caseItem) => ({
  id: String(caseItem.id || Date.now()),
  name: String(caseItem.name || '').trim(),
  architect: String(caseItem.architect || '').trim(),
  city: String(caseItem.city || '').trim(),
  country: String(caseItem.country || '').trim(),
  type: String(caseItem.type || '').trim(),
  year: String(caseItem.year || '').trim(),
  image: typeof caseItem.image === 'string' ? caseItem.image.trim() : '',
  tags: normalizeTags(caseItem.tags),
  description: String(caseItem.description || '').trim(),
  inspiration: String(caseItem.inspiration || '').trim(),
  ratings: caseItem.ratings || {},
})

const validateCase = (caseItem) => {
  const missingFields = []

  if (!caseItem.name) {
    missingFields.push('name')
  }

  if (!caseItem.architect) {
    missingFields.push('architect')
  }

  if (!caseItem.type) {
    missingFields.push('type')
  }

  return missingFields
}

const requireAdmin = (req, res, next) => {
  const authHeader = req.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token || !adminTokens.has(token)) {
    res.status(401).json({ message: '需要管理员登录后才能操作' })
    return
  }

  next()
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'archcase-server',
    time: new Date().toISOString(),
  })
})

app.get('/api/cases', async (req, res, next) => {
  try {
    const cases = await readCases()
    res.json(cases)
  } catch (error) {
    next(error)
  }
})

app.post('/api/cases', requireAdmin, async (req, res, next) => {
  try {
    const nextCase = normalizeCase({
      ...req.body,
      id: req.body.id || Date.now(),
    })
    const missingFields = validateCase(nextCase)

    if (missingFields.length > 0) {
      res.status(400).json({
        message: '缺少必要字段',
        fields: missingFields,
      })
      return
    }

    const cases = await readCases()
    const nextCases = [nextCase, ...cases]
    await writeCases(nextCases)
    res.status(201).json(nextCase)
  } catch (error) {
    next(error)
  }
})

app.put('/api/cases/:id', requireAdmin, async (req, res, next) => {
  try {
    const cases = await readCases()
    const caseIndex = cases.findIndex((caseItem) => String(caseItem.id) === req.params.id)

    if (caseIndex === -1) {
      res.status(404).json({ message: '没有找到这个建筑案例' })
      return
    }

    const updatedCase = normalizeCase({
      ...cases[caseIndex],
      ...req.body,
      id: cases[caseIndex].id,
    })
    const missingFields = validateCase(updatedCase)

    if (missingFields.length > 0) {
      res.status(400).json({
        message: '缺少必要字段',
        fields: missingFields,
      })
      return
    }

    const nextCases = cases.map((caseItem, index) => (index === caseIndex ? updatedCase : caseItem))
    await writeCases(nextCases)
    res.json(updatedCase)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/cases/:id', requireAdmin, async (req, res, next) => {
  try {
    const cases = await readCases()
    const nextCases = cases.filter((caseItem) => String(caseItem.id) !== req.params.id)

    if (nextCases.length === cases.length) {
      res.status(404).json({ message: '没有找到这个建筑案例' })
      return
    }

    await writeCases(nextCases)
    res.json({ message: '删除成功' })
  } catch (error) {
    next(error)
  }
})

app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: '请上传图片文件' })
    return
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
  res.status(201).json({
    url: imageUrl,
    filename: req.file.filename,
  })
})

app.post('/api/admin/login', (req, res) => {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD
  const { username, password } = req.body

  if (!adminPassword) {
    res.status(500).json({ message: '后端还没有配置管理员密码，请先设置 ADMIN_PASSWORD' })
    return
  }

  if (username !== adminUsername || password !== adminPassword) {
    res.status(401).json({ message: '用户名或密码错误' })
    return
  }

  const token = crypto.randomBytes(24).toString('hex')
  adminTokens.add(token)

  res.json({
    message: '登录成功',
    token,
    user: {
      username: adminUsername,
    },
  })
})

app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({
    message: error.message || '服务器内部错误',
  })
})

app.listen(port, () => {
  console.log(`ArchCase server is running at http://localhost:${port}`)
})
